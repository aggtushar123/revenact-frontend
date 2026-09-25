import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { ProductRow } from '../../../../../features/products/productsSlice';
import {
  formatCompactMoney,
  formatMoney,
} from '../../../../../features/customers/formatters';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

/** The three segments, in the order they stack. Also the chart's own key. */
const LABELS: Record<string, string> = {
  healthy: 'In good health',
  unhealthy: 'Not in good health',
  lost: 'Already churned',
};

const KEY = [
  { label: LABELS.healthy, color: 'var(--success)' },
  { label: LABELS.unhealthy, color: 'var(--danger)' },
  { label: LABELS.lost, color: 'var(--text-tertiary)' },
];

export interface ProductMoneyChartProps {
  rows: ProductRow[];
  currency: CurrencyCode;
}

/**
 * The screen's thesis in one chart: per product, money held in healthy
 * accounts, money held in accounts that are not, and money already gone.
 *
 * Three segments because a single ARR bar per product answers the easy
 * question — which product is biggest — and hides the one worth asking. A
 * product can be the largest on the book and still be the one leaking: that
 * shows up here as a tall bar made mostly of the two darker segments.
 *
 * The churned segment is stacked on *beside* the live ones rather than
 * included in them: it is not revenue, it is revenue that left. Showing it in
 * the same bar is the point — a product's past is the best available evidence
 * about its present.
 */
export function ProductMoneyChart({ rows, currency }: ProductMoneyChartProps) {
  const data = useMemo(
    () =>
      rows.map((row) => ({
        name: row.product,
        healthy: Math.max(0, row.arr - row.unhealthy_arr),
        unhealthy: row.unhealthy_arr,
        lost: row.churned_arr,
        customers: row.customers,
      })),
    [rows]
  );

  const anyMoney = data.some((row) => row.healthy + row.unhealthy + row.lost > 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">ARR by product</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            What each product leads, split by the health of the accounts holding it — with the ARR
            that has already left alongside
          </p>
        </div>
        {/* Our own key rather than Recharts' Legend, which orders itself by
            series and read back healthy / churned / unhealthy. The order here
            is the order of the stack, bottom segment first. */}
        <ul className="flex items-center gap-3 shrink-0 pt-[2px]">
          {KEY.map((entry) => (
            <li key={entry.label} className="flex items-center gap-1.5">
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[10.5px] text-ink-muted whitespace-nowrap">{entry.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-1">
        {!anyMoney ? (
          <p className="px-2 py-6 text-[12px] text-ink-faint">
            No priced customers in this selection.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {/* Capped bar width: filtering to one product is a first-class
                action on this screen, and an uncapped bar fills the whole
                card when there is only one category. */}
            <BarChart
              data={data}
              margin={{ top: 14, right: 8, left: -6, bottom: 4 }}
              maxBarSize={84}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={56}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                tickFormatter={(value: number) => formatCompactMoney(value, currency)}
              />
              <Tooltip
                cursor={{ fill: 'var(--bg-subtle)' }}
                contentStyle={{ ...TOOLTIP_STYLE, fontSize: '12px' }}
                formatter={(value, name) => [
                  formatMoney(Number(value ?? 0), currency),
                  LABELS[String(name)] ?? String(name),
                ]}
              />
              {/* No grow-in animation, same as OriginBar: a stacked bar
                  climbing from zero reads as if the healthy/unhealthy split
                  were changing, and this screen is re-fetched on every filter
                  change — the comparison should be legible immediately. */}
              <Bar
                {...STATIC_SERIES}
                dataKey="healthy"
                stackId="live"
                fill="var(--success)"
              />
              <Bar
                {...STATIC_SERIES}
                dataKey="unhealthy"
                stackId="live"
                fill="var(--danger)"
                radius={[3, 3, 0, 0]}
              />
              <Bar
                {...STATIC_SERIES}
                dataKey="lost"
                fill="var(--text-tertiary)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
