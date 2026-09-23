import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { Concentration } from '../../../../../features/portfolio/portfolioSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { ROLE, TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';

const HEALTH_COLORS: Record<string, string> = {
  good: ROLE.gain,
  average: ROLE.caution,
  poor: ROLE.loss,
};

export interface ConcentrationChartProps {
  concentration: Concentration;
  currency: CurrencyCode;
}

/**
 * How much of the book sits in how few customers.
 *
 * A Pareto: bars are each account's ARR, the line is the running share. If the
 * line reaches 55% by the third bar, that is the most important fact about the
 * business, and no other screen in this product states it.
 *
 * Bars are coloured by health, which is the join that makes this actionable
 * rather than interesting: concentration is a risk only in proportion to how
 * shaky the accounts carrying it are. A red bar on the left of this chart is
 * the single worst position a book can be in.
 */
export function ConcentrationChart({ concentration, currency }: ConcentrationChartProps) {
  const data = useMemo(
    () =>
      concentration.rows.map((row) => ({
        name: row.name,
        arr: row.arr,
        cumulative: row.cumulative_share,
        health: row.health_category,
        share: row.share,
      })),
    [concentration.rows]
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">Revenue concentration</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            Largest accounts by ARR, with the running share of the book · bars coloured by health
          </p>
        </div>
        {concentration.top_three_share !== null && (
          <p
            className={`text-[11px] font-bold shrink-0 ${
              concentration.top_three_share >= 50 ? 'text-danger' : 'text-ink-muted'
            }`}
          >
            top 3 = {concentration.top_three_share}% of ARR
          </p>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-1">
        {data.length === 0 ? (
          <p className="px-2 py-6 text-[12px] text-ink-faint">
            No priced accounts in this selection.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 14, right: 8, left: -6, bottom: 4 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={52}
              />
              <YAxis
                yAxisId="arr"
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                tickFormatter={(value: number) => formatCompactMoney(value, currency)}
              />
              <YAxis
                yAxisId="share"
                orientation="right"
                axisLine={false}
                tickLine={false}
                width={38}
                domain={[0, 100]}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                tickFormatter={(value: number) => `${value}%`}
              />
              <Tooltip
                cursor={{ fill: CURSOR_FILL }}
                contentStyle={{ ...TOOLTIP_STYLE, fontSize: '12px' }}
                formatter={(value, name, item) =>
                  name === 'cumulative'
                    ? [`${value}% of the book cumulatively`, item?.payload?.name ?? '']
                    : [
                        `${formatMoney(Number(value ?? 0), currency)} · ${item?.payload?.share ?? 0}%`,
                        item?.payload?.name ?? '',
                      ]
                }
              />
              <Bar {...STATIC_SERIES} yAxisId="arr" dataKey="arr" radius={[3, 3, 0, 0]}>
                {data.map((row) => (
                  <Cell key={row.name} fill={HEALTH_COLORS[row.health] ?? ROLE.faint} />
                ))}
              </Bar>
              <Line
                {...STATIC_SERIES}
                yAxisId="share"
                type="monotone"
                dataKey="cumulative"
                stroke={ROLE.ink}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {concentration.rest_count > 0 && (
        <p className="px-4 pb-3 text-[10.5px] text-ink-faint">
          {concentration.rest_count} smaller accounts hold the remaining{' '}
          {formatCompactMoney(concentration.rest_arr, currency)}.
        </p>
      )}
    </div>
  );
}
