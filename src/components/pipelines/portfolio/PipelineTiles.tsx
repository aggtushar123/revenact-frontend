import { useState } from 'react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import type { PipelineKind } from '../../../features/pipelines/pipelineKinds';
import type { PipelineParams } from '../../../features/pipelines/pipelineParams';
import type { PipelineSummary } from '../../../features/pipelines/pipelineTypes';
import { MONO } from '../../organizations/portfolio/styles';
import { FilterButton, Switch, Tile, TileButton, TilesSkeleton } from '../../organizations/portfolio/tileParts';

type Span = '30' | '90';
const SPANS: { value: Span; label: string }[] = [
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
];
const only = (values: string[], value: string) => values.length === 1 && values[0] === value;
/** Whether `values` is exactly `target`, in any order: used to tell a
 *  Closing/Due tile's own open-stage restriction from any other stage
 *  filter the URL happens to carry. */
const sameStages = (values: string[], target: string[]) => values.length === target.length && target.every((value) => values.includes(value));

/** The five tiles (spec §1, and the backend ruling: they ignore only the
 *  stage filter). Every figure is the server's, over every filtered row. A
 *  tile sets its filter and pressing it again clears it; the first tile is
 *  the List's default view, so it is a figure only (plan Decision 3). The
 *  strip lists the open stages from `summary.stages`, empty ones included.
 *
 *  Closing/Due within 30/90 days also pins the kind's open stages (a
 *  controller ruling): the backend's `date=30|90` window has no open
 *  condition of its own, so without it the list could show closed rows the
 *  tile never counted. Overdue needs no such pin — its window already
 *  requires an open stage (services/pipelines_portfolio's `matches_date`) —
 *  so it lands on exactly its count with `date=overdue` alone.
 *
 *  On phones the row swipes sideways; the page never scrolls sideways. */
export function PipelineTiles({
  kind,
  summary,
  failed = false,
  currency,
  params,
  onFilter,
}: {
  kind: PipelineKind;
  summary: PipelineSummary | null;
  failed?: boolean;
  currency: CurrencyCode;
  params: PipelineParams;
  onFilter: (patch: Partial<PipelineParams>) => void;
}) {
  // The Closing tile's window follows a 30/90 date filter set elsewhere
  // (the Filters panel, a chip). Synced during render.
  const [span, setSpan] = useState<Span>(params.date === '90' ? '90' : '30');
  const [seenDate, setSeenDate] = useState(params.date);
  if (seenDate !== params.date) {
    setSeenDate(params.date);
    if (params.date === '30' || params.date === '90') setSpan(params.date);
  }

  if (!summary) {
    if (!failed) return <TilesSkeleton />;
    return (
      <div className="rounded-xl bg-surface p-3">
        <p className="text-[13px] font-semibold text-ink">Summary unavailable</p>
        <p className="text-[11px] text-ink-muted">The tiles return once the list loads.</p>
      </div>
    );
  }

  const money = (value: number) => `${formatCompactMoney(value, currency)} MRR`;
  const within = summary.within[span];
  const withinOn = params.date === span && sameStages(params.stage, kind.openStages);
  const done = summary.done_this_quarter;
  const doneOn = only(params.stage, done.stage) && params.changed === 'quarter';
  const stages = summary.stages.filter((stage) => kind.openStages.includes(stage.value));
  const stageMax = Math.max(1, ...stages.map((stage) => stage.count));
  const figure = (count: number, mrr: number) => (
    <>
      <span className={`${MONO} block text-[22px] leading-tight text-ink`}>{count}</span>
      <span className={`${MONO} block text-[11px] text-ink-muted`}>{money(mrr)}</span>
    </>
  );

  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 @min-[50rem]:grid-cols-5">
      <Tile title={kind.tiles.open}>{figure(summary.open.count, summary.open.mrr)}</Tile>

      <Tile title={kind.tiles.within} action={<Switch label={`${kind.tiles.within} window`} value={span} onChange={setSpan} options={SPANS} />}>
        <TileButton
          pressed={withinOn}
          label={`${kind.tiles.within} within ${span} days: ${within.count}`}
          onClick={() => onFilter(withinOn ? { date: '', stage: [] } : { date: span, stage: [...kind.openStages] })}
        >
          {figure(within.count, within.mrr)}
        </TileButton>
      </Tile>

      <Tile title="Overdue">
        <TileButton
          pressed={params.date === 'overdue'}
          label={`Overdue: ${summary.overdue.count}`}
          onClick={() => onFilter({ date: params.date === 'overdue' ? '' : 'overdue' })}
        >
          {figure(summary.overdue.count, summary.overdue.mrr)}
        </TileButton>
      </Tile>

      <Tile title={kind.tiles.done}>
        <TileButton
          pressed={doneOn}
          label={`${kind.tiles.done}: ${done.count}`}
          onClick={() => onFilter(doneOn ? { stage: [], changed: '' } : { stage: [done.stage], changed: 'quarter' })}
        >
          {figure(done.count, done.mrr)}
        </TileButton>
      </Tile>

      <Tile title="Stages">
        {stages.map((stage) => (
          <FilterButton
            key={stage.value}
            pressed={only(params.stage, stage.value)}
            onClick={() => onFilter({ stage: only(params.stage, stage.value) ? [] : [stage.value] })}
          >
            <span title={stage.label} className="min-w-0 flex-1 truncate text-left">
              {stage.label}
            </span>{' '}
            <span aria-hidden="true" className="mx-1 h-1 w-10 shrink-0 rounded-full bg-line">
              <span className="block h-full rounded-full bg-ink-muted" style={{ width: `${(stage.count / stageMax) * 100}%` }} />
            </span>
            <span className={`${MONO} text-ink`}>{stage.count}</span>
          </FilterButton>
        ))}
      </Tile>
    </div>
  );
}
