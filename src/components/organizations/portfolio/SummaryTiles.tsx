import { useId, useState, type ReactNode } from 'react';
import type { CurrencyCode } from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { signed } from '../../../features/organizations/portfolioFields';
import type { PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { HealthBand, NpsBand, PortfolioSummary } from '../../../features/organizations/portfolioTypes';
import { HEALTH_LABEL, NPS_BANDS, NPS_LABEL, RENEWAL_WINDOWS, type RenewalWindow } from '../../../features/organizations/portfolioLabels';
import { FOCUS } from './styles';

const BANDS: HealthBand[] = ['good', 'average', 'poor'];
const BAND_DOT: Record<HealthBand, string> = { good: 'bg-success', average: 'bg-warning', poor: 'bg-danger' };
const NPS_BAR: Record<NpsBand, string> = { promoter: 'bg-success', passive: 'bg-line-strong', detractor: 'bg-danger' };

/** A group named by its heading, not a region: five tiles as landmarks
 *  would crowd a screen reader's landmark list. */
function Tile({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId} className="min-w-[15rem] shrink-0 snap-start rounded-xl bg-surface p-3 sm:min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-md bg-subtle p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 sm:min-h-6 rounded px-1.5 text-[11px] font-semibold ${FOCUS} ${
            value === option.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FilterButton({
  pressed,
  onClick,
  compact = false,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex w-full min-w-0 min-h-11 ${compact ? 'sm:min-h-6' : 'sm:min-h-7'} items-center justify-between gap-2 rounded-md px-1.5 text-[11px] hover:bg-subtle active:bg-line-subtle ${FOCUS} ${
        pressed ? 'bg-subtle font-semibold text-ink' : 'text-ink-muted'
      }`}
    >
      {children}
    </button>
  );
}

const only = <T,>(values: T[], value: T) => values.length === 1 && values[0] === value;
const mono = 'font-mono-brand tabular-nums';

function Skeleton() {
  return (
    <div role="status" aria-label="Loading summary" className="flex gap-3 overflow-hidden sm:grid sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} aria-hidden="true" className="min-w-[15rem] shrink-0 rounded-xl bg-surface p-3 sm:min-w-0">
          <span className="block h-2.5 w-16 animate-pulse rounded bg-subtle" />
          <span className="mt-3 block h-5 w-20 animate-pulse rounded bg-subtle" />
          <span className="mt-3 block h-2 w-full animate-pulse rounded bg-subtle" />
        </div>
      ))}
    </div>
  );
}

/** The five summary tiles (spec §1). Numbers come from the server for the
 *  current filters, and every segment filters the list on click. On phones
 *  the row swipes sideways; the page itself never scrolls horizontally. */
export function SummaryTiles({
  summary,
  failed = false,
  currency,
  params,
  onFilter,
}: {
  summary: PortfolioSummary | null;
  /** The first load failed: there is no summary to wait for. */
  failed?: boolean;
  currency: CurrencyCode;
  params: PortfolioParams;
  onFilter: (patch: Partial<PortfolioParams>) => void;
}) {
  const [mode, setMode] = useState<'count' | 'mrr' | 'arr'>('count');
  // The Renewing tile's window. The summary counts 30 and 90 days; a
  // 180-day filter (set from the Filters panel) shows as a third, pressed
  // option, whose count is the whole filtered book. Synced during render.
  const [span, setSpan] = useState<RenewalWindow>(params.renews_within || '30');
  const [seenWindow, setSeenWindow] = useState(params.renews_within);
  if (seenWindow !== params.renews_within) {
    setSeenWindow(params.renews_within);
    if (params.renews_within) setSpan(params.renews_within);
    else if (span === '180') setSpan('30');
  }
  if (!summary) {
    if (!failed) return <Skeleton />;
    return (
      <div className="rounded-xl bg-surface p-3">
        <p className="text-[13px] font-semibold text-ink">Summary unavailable</p>
        <p className="text-[11px] text-ink-muted">The tiles return once the list loads.</p>
      </div>
    );
  }

  const health = summary.health;
  const bandValue = (band: HealthBand) => (mode === 'count' ? health[band] : health[mode][band]);
  const bandTotal = BANDS.reduce((total, band) => total + bandValue(band), 0);
  const show = (n: number) => (mode === 'count' ? String(n) : formatCompactMoney(n, currency));

  const nps = summary.nps;
  const npsCount: Record<NpsBand, number> = { promoter: nps.promoters, passive: nps.passives, detractor: nps.detractors };
  const npsBands = NPS_BANDS.map((band) => ({ band, label: NPS_LABEL[band], count: npsCount[band], bar: NPS_BAR[band] }));
  const npsTotal = nps.promoters + nps.passives + nps.detractors;
  const stages = summary.lifecycle.filter((stage) => stage.count > 0);
  const stageMax = Math.max(1, ...stages.map((s) => s.count));
  // More than four stages fit the tile's height in two columns, without bars.
  const twoColumns = stages.length > 4;
  const renewing = span === '180' ? summary.accounts : summary.renewing[span];
  const spans = RENEWAL_WINDOWS.filter((days) => days !== '180' || span === '180');

  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
      <Tile
        title="Health"
        action={
          <Switch
            label="Health measure"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'count', label: 'Count' },
              { value: 'mrr', label: 'MRR' },
              { value: 'arr', label: 'ARR' },
            ]}
          />
        }
      >
        <div aria-hidden="true" className="mb-2 flex h-2 overflow-hidden rounded-full bg-line">
          {bandTotal > 0
            ? BANDS.map((band) => (
                <span key={band} className={BAND_DOT[band]} style={{ width: `${(bandValue(band) / bandTotal) * 100}%` }} />
              ))
            : null}
        </div>
        {BANDS.map((band) => (
          <FilterButton
            key={band}
            pressed={only(params.health, band)}
            onClick={() => onFilter({ health: only(params.health, band) ? [] : [band] })}
          >
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${BAND_DOT[band]}`} />
              {HEALTH_LABEL[band]}
            </span>{' '}
            <span className={`${mono} text-ink`}>{show(bandValue(band))}</span>
          </FilterButton>
        ))}
      </Tile>

      <Tile title="NPS">
        <p className={`${mono} text-[22px] leading-tight text-ink`}>{signed(nps.score)}</p>
        <div aria-hidden="true" className="my-2 flex h-2 overflow-hidden rounded-full bg-line">
          {npsTotal > 0
            ? npsBands.map((b) => <span key={b.band} className={b.bar} style={{ width: `${(b.count / npsTotal) * 100}%` }} />)
            : null}
        </div>
        {npsBands.map((b) => (
          <FilterButton key={b.band} pressed={params.nps === b.band} onClick={() => onFilter({ nps: params.nps === b.band ? '' : b.band })}>
            <span>{b.label}</span>{' '}
            <span className={`${mono} text-ink`}>{b.count}</span>
          </FilterButton>
        ))}
      </Tile>

      <Tile title="Lifecycle">
        <div className={twoColumns ? 'grid grid-cols-2 gap-x-2' : ''}>
          {stages.map((stage) => (
            <FilterButton
              key={stage.value}
              compact={twoColumns}
              pressed={only(params.lifecycle, stage.value)}
              onClick={() => onFilter({ lifecycle: only(params.lifecycle, stage.value) ? [] : [stage.value] })}
            >
              <span title={stage.label} className={`truncate text-left ${twoColumns ? 'min-w-0' : 'w-20'}`}>
                {stage.label}
              </span>{' '}
              {twoColumns ? null : (
                <span aria-hidden="true" className="mx-1 h-1 flex-1 rounded-full bg-line">
                  <span className="block h-full rounded-full bg-ink-muted" style={{ width: `${(stage.count / stageMax) * 100}%` }} />
                </span>
              )}
              <span className={`${mono} text-ink`}>{stage.count}</span>
            </FilterButton>
          ))}
        </div>
      </Tile>

      <Tile title="Accounts · ARR">
        <p className={`${mono} text-[22px] leading-tight text-ink`}>{summary.accounts}</p>
        <p className={`${mono} mt-1 text-[13px] text-ink-muted`}>{formatCompactMoney(summary.arr, currency)} ARR</p>
        {summary.unconverted_count > 0 ? (
          <p className="mt-1 text-[11px] text-ink-muted">
            <span className={mono}>{summary.unconverted_count}</span> without an exchange rate, left out of ARR
          </p>
        ) : null}
      </Tile>

      <Tile
        title="Renewing"
        action={
          <Switch
            label="Renewal window"
            value={span}
            onChange={setSpan}
            options={spans.map((days) => ({ value: days, label: `${days}d` }))}
          />
        }
      >
        <button
          type="button"
          aria-pressed={params.renews_within === span}
          aria-label={`Renewing within ${span} days: ${renewing}`}
          onClick={() => onFilter({ renews_within: params.renews_within === span ? '' : span })}
          className={`-m-1 block w-full rounded-lg p-1 text-left hover:bg-subtle active:bg-line-subtle ${FOCUS} ${
            params.renews_within === span ? 'bg-subtle' : ''
          }`}
        >
          <span className={`${mono} block text-[22px] leading-tight text-ink`}>{renewing}</span>
          <span className="block text-[11px] text-ink-muted">within {span} days, overdue included</span>
        </button>
      </Tile>
    </div>
  );
}
