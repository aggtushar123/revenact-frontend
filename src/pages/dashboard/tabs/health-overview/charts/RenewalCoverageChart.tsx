import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import type { Coverage, CoverageBand } from '../renewal';
import { CONTACT_COLD_DAYS, CONTACT_FRESH_DAYS } from '../renewal';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { useDrill } from '../../../drill/useDrill';
import { fromHealthRows } from '../../../drill/rows';
import { DrillTargets } from '../../../drill/DrillTargets';

/** Contact age, not health — green is "somebody is in this deal", red is
 *  "nobody has spoken to them". Deliberately the same three hues the health
 *  charts use: on this screen those colours already mean good/attention/bad,
 *  and inventing a second palette for a second meaning of "bad" costs more
 *  than it explains. */
const COVERAGE_SERIES = [
  { key: 'cold', label: `No contact ${CONTACT_COLD_DAYS}d+`, color: 'var(--danger)' },
  { key: 'ageing', label: `${CONTACT_FRESH_DAYS}–${CONTACT_COLD_DAYS}d`, color: 'var(--warning)' },
  { key: 'fresh', label: `Contacted <${CONTACT_FRESH_DAYS}d`, color: 'var(--success)' },
  { key: 'unknown', label: 'No activity logged', color: 'var(--text-tertiary)' },
] as const;

export interface RenewalCoverageChartProps {
  bands: CoverageBand[];
  currency: CurrencyCode;
  /** False when `bands` were built from a truncated book — a drill from it
   *  would only ever show some of the accounts a segment counted. Defaults
   *  to `true` so every existing caller (and test) keeps drilling. */
  drillable?: boolean;
}

/**
 * How much renewing money nobody is talking to.
 *
 * The chart a renewals meeting runs off. Health is deliberately not an axis
 * here — it is the calendar chart's job, and a *Good* account nobody has
 * spoken to in three months is precisely the case a health-only view misses,
 * right up until it doesn't renew.
 *
 * Horizontal bars because the windows are an ordered sequence with long labels,
 * and reading down a list of windows is how the question is asked out loud:
 * "what's in the next thirty days, and who's on it?"
 */
export function RenewalCoverageChart({
  bands,
  currency,
  drillable = true,
}: RenewalCoverageChartProps) {
  const { open } = useDrill();

  // Recharts draws the first row at the bottom, so the nearest window would
  // end up furthest from the title. Reversed here, not in the domain module —
  // window order is a fact about the book, this is a fact about the chart.
  const reversedBands = useMemo(() => [...bands].reverse(), [bands]);
  const data = useMemo(
    () =>
      reversedBands.map((band) => ({
        name: band.label,
        cold: band.cold,
        ageing: band.ageing,
        fresh: band.fresh,
        unknown: band.unknown,
        count: band.count,
      })),
    [reversedBands]
  );

  // The three windows inside 90 days — not 91–180, and **not overdue**: an
  // overdue renewal is not "renewing in 90 days", and counting it here made
  // this headline contradict the tile above it, which reads the same book.
  const NINETY_DAY_WINDOWS = ['30', '60', '90'];
  const exposed = bands
    .filter((band) => NINETY_DAY_WINDOWS.includes(band.key))
    .reduce((sum, band) => sum + band.cold, 0);

  const openSegment = (band: CoverageBand, series: Coverage, trigger?: HTMLElement) => {
    const picked = band.rows[series];
    const seriesLabel = COVERAGE_SERIES.find((s) => s.key === series)?.label ?? series;
    open(
      {
        title: `${band.label} · ${seriesLabel}`,
        figure: String(picked.length),
        source: { kind: 'rows', rows: fromHealthRows(picked) },
      },
      trigger
    );
  };

  // One button per window × contact-age series that actually has an account
  // in it — a keyboard user (and this chart's own test) can't reach a
  // recharts <Bar>'s SVG segments, so this is the real drill target; the
  // Bar's own onClick below is the pointer shortcut to the same thing. None
  // at all when the book is truncated — see `drillable`.
  const drillItems = drillable
    ? reversedBands.flatMap((band) =>
        COVERAGE_SERIES.filter((series) => band.rows[series.key].length > 0).map((series) => ({
          name: `${band.label} · ${series.label}`,
          figure: String(band.rows[series.key].length),
          onSelect: (trigger: HTMLElement) => openSegment(band, series.key, trigger),
        })),
      )
    : [];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">Coverage gap</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            ARR by renewal window, split by how long since anyone logged an activity
          </p>
        </div>
        {exposed > 0 && (
          <p className="text-[11px] font-bold text-danger shrink-0">
            {formatCompactMoney(exposed, currency)} renewing in 90 days with no recent contact
          </p>
        )}
      </div>

      <DrillTargets label="Coverage gap" items={drillItems} />

      <div className="flex-1 w-full min-h-0 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
            barSize={22}
          >
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
              tickFormatter={(value: number) => formatCompactMoney(value, currency)}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={96}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-subtle)' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
              }}
              // See RenewalQuarterChart on why these parameters are untyped.
              formatter={(value, name) => [
                formatMoney(Number(value ?? 0), currency),
                COVERAGE_SERIES.find((series) => series.key === name)?.label ?? String(name),
              ]}
            />
            {COVERAGE_SERIES.map((series) => (
              <Bar
                {...STATIC_SERIES}
                key={series.key}
                dataKey={series.key}
                stackId="arr"
                fill={series.color}
                cursor={drillable ? 'pointer' : undefined}
                onClick={
                  drillable ? (_, index) => openSegment(reversedBands[index], series.key) : undefined
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center flex-wrap gap-3 px-4 pb-3">
        {COVERAGE_SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-[2px]"
              style={{ background: series.color }}
              aria-hidden
            />
            <span className="text-[11px] text-ink-muted">{series.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
