// This module intentionally exports both the panel component and the two
// pure helpers (timelinePositions, npsBand) its interface and tests share
// (Task 6 brief). Fast refresh doesn't apply to this mostly-presentational
// module, same precedent as rowParts.tsx.
/* eslint-disable react-refresh/only-export-components */
import { Fragment, type ReactNode } from 'react';
import { Pencil } from 'lucide-react';
import type { ColumnId } from '../tableData';
import { PANELS, PANEL_ORDER, PORTFOLIO_FIELDS, type PanelKey } from '../../../features/organizations/portfolioFields';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { BUTTON } from './styles';

const utc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Where each date (and today) sits on a line from the earliest to the latest
 *  of them, as a percentage. Missing dates have no mark. */
export function timelinePositions(
  dates: (string | null)[],
  today: string,
): { marks: (number | null)[]; today: number | null } {
  const known = dates.filter((d): d is string => Boolean(d)).map(utc);
  if (known.length === 0) return { marks: dates.map(() => null), today: null };
  const now = utc(today);
  const lo = Math.min(...known, now);
  const hi = Math.max(...known, now);
  const span = hi - lo || 1;
  const at = (value: number) => Math.round(((value - lo) / span) * 1000) / 10;
  return { marks: dates.map((d) => (d ? at(utc(d)) : null)), today: at(now) };
}

function Panel({ panel, children }: { panel: PanelKey; children: ReactNode }) {
  const title = PANELS.find((p) => p.key === panel)?.title ?? panel;
  // A headed section with no accessible name: six panels per opened row
  // would otherwise each be a region landmark.
  return (
    <section data-panel={panel} className="min-w-0">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Pairs({
  row,
  ids,
  mono = true,
  tone = {},
}: {
  row: PortfolioRow;
  ids: ColumnId[];
  mono?: boolean;
  tone?: Partial<Record<ColumnId, string>>;
}) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-[13px]">
      {ids.map((id) => {
        const field = PORTFOLIO_FIELDS[id];
        return (
          <Fragment key={id}>
            <dt className="truncate text-ink-muted">{field.label}</dt>
            <dd
              data-field={id}
              className={`text-right break-words ${mono ? 'font-mono-brand tabular-nums' : ''} ${tone[id] ?? 'text-ink'}`}
            >
              {field.value(row)}
            </dd>
          </Fragment>
        );
      })}
    </dl>
  );
}

function ContractPanel({ row, today }: { row: PortfolioRow; today: string }) {
  const ids = PANEL_ORDER.contract;
  const c = row.details.contract;
  const { marks, today: todayAt } = timelinePositions(
    [c.joined_date, c.contract_start_date, c.renewal_date, c.contract_end_date],
    today,
  );
  const overdue = row.renewal.days != null && row.renewal.days < 0;
  return (
    <Panel panel="contract">
      <div className="relative h-6" aria-hidden="true">
        <span className="absolute left-0 right-0 top-1/2 h-px bg-line" />
        {marks.map((at, i) =>
          at == null ? null : (
            <span
              key={ids[i]}
              data-mark={ids[i]}
              className={`absolute top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                ids[i] === 'renewalDate' && overdue ? 'bg-danger' : 'bg-ink-muted'
              }`}
              style={{ left: `${at}%` }}
            />
          ),
        )}
        {todayAt == null ? null : (
          <span className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-ink" style={{ left: `${todayAt}%` }} />
        )}
      </div>
      <p className="mb-2 text-[11px] text-ink-muted">Dots mark the dates below. The line marks today.</p>
      <Pairs row={row} ids={ids} tone={overdue ? { renewalDate: 'text-danger font-semibold' } : {}} />
    </Panel>
  );
}

function AdoptionPanel({ row }: { row: PortfolioRow }) {
  const a = row.details.adoption;
  const contracted = a.total_contracted_seats ?? 0;
  const active = a.total_active_seats ?? 0;
  const ratio = contracted > 0 ? Math.min(1, active / contracted) : 0;
  const { primary, additional_count } = a.products;
  return (
    <Panel panel="adoption">
      <div
        role="meter"
        aria-label="Active of contracted seats"
        aria-valuemin={0}
        aria-valuemax={contracted}
        aria-valuenow={active}
        className="h-1.5 overflow-hidden rounded-full bg-line"
      >
        <span className="block h-full bg-ink" style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="mt-1 mb-2 text-[11px] text-ink-muted">
        <span className="font-mono-brand tabular-nums">
          {active.toLocaleString('en-US')} of {contracted.toLocaleString('en-US')}
        </span>{' '}
        seats active
      </p>
      <Pairs row={row} ids={['totalContractedSeats', 'totalActiveSeats', 'totalSeatUtilization', 'totalHires', 'scopeWebApp']} />
      <p className="mt-2 text-[13px] text-ink-muted">Products</p>
      <div data-field="productsUtilized" className="mt-1 flex flex-wrap gap-1">
        {primary ? (
          <>
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] text-ink">{primary.name}</span>
            {additional_count ? (
              <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] text-ink-muted">(+{additional_count})</span>
            ) : null}
          </>
        ) : (
          <span className="text-[13px] text-ink-muted">—</span>
        )}
      </div>
    </Panel>
  );
}

/** The backend's sign rule (/customers/stats/): above 0 promoter, 0 passive, below 0 detractor. */
export function npsBand(score: number | null): string {
  if (score == null) return 'No NPS yet';
  if (score > 0) return 'Promoter';
  if (score < 0) return 'Detractor';
  return 'Passive';
}

function VoicePanel({ row }: { row: PortfolioRow }) {
  const nps = row.details.voice.nps_score;
  const at = nps == null ? null : (Math.max(-100, Math.min(100, nps)) + 100) / 2;
  return (
    <Panel panel="voice">
      <p className="mb-1 text-[11px] font-semibold text-ink">{npsBand(nps)}</p>
      <div className="relative h-1.5 rounded-full bg-line" aria-hidden="true">
        <span className="absolute top-0 bottom-0 left-1/2 w-px bg-ink-muted" />
        {at == null ? null : (
          <span
            className="absolute top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `${at}%` }}
          />
        )}
      </div>
      <p className="mt-1 mb-2 flex justify-between font-mono-brand tabular-nums text-[11px] text-ink-muted" aria-hidden="true">
        <span>−100</span>
        <span>0</span>
        <span>+100</span>
      </p>
      <Pairs row={row} ids={['nps', 'csatScore', 'cesPercentage']} />
      <p className="mt-3 text-[11px] text-ink-muted">AI pulse reason</p>
      <blockquote data-field="aiPulseReason" className="mt-1 border-l-2 border-line pl-3 text-[13px] text-ink">
        {PORTFOLIO_FIELDS.aiPulseReason.value(row)}
      </blockquote>
    </Panel>
  );
}

/** Every field the row header does not show, in six panels (spec §1
 *  "Opened row"). It is part of its row: panels are grouped by whitespace,
 *  never boxed, so there is no card in a card. */
export function AccountDetails({
  row,
  id,
  today = new Date().toISOString().slice(0, 10),
  onEdit,
}: {
  row: PortfolioRow;
  id?: string;
  today?: string;
  onEdit?: (id: number) => void;
}) {
  const churned = row.churned;
  return (
    <div id={id} className="grid gap-x-8 gap-y-5 border-t border-line-subtle px-3 pt-3 pb-4 md:grid-cols-2 xl:grid-cols-3">
      <Panel panel="commercial">
        <Pairs row={row} ids={PANEL_ORDER.commercial} />
      </Panel>
      <ContractPanel row={row} today={today} />
      <AdoptionPanel row={row} />
      <VoicePanel row={row} />
      <Panel panel="profile">
        <Pairs row={row} ids={PANEL_ORDER.profile} mono={false} tone={{ revenactId: 'text-ink font-mono-brand tabular-nums' }} />
      </Panel>
      <Panel panel="history">
        <Pairs row={row} ids={churned ? PANEL_ORDER.history : ['createdBy', 'modifiedBy']} mono={false} />
      </Panel>
      {onEdit ? (
        <div className="flex justify-end md:col-span-2 xl:col-span-3">
          <button
            type="button"
            onClick={() => onEdit(row.id)}
            className={BUTTON}
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            Edit details
          </button>
        </div>
      ) : null}
    </div>
  );
}
