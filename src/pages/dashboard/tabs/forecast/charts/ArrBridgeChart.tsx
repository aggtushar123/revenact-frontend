import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { ForecastBridge } from '../../../../../features/forecast/forecastSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';

export interface ArrBridgeChartProps {
  bridge: ForecastBridge;
  currency: CurrencyCode;
  horizonDays: number;
}

/**
 * Opening ARR to forecast ARR, one bar per thing that moves it.
 *
 * A waterfall rather than a single forecast number, because the number on its
 * own hides how it was reached: the same closing figure can be a quiet year or
 * a year where a third of the book churned and the pipeline happened to cover
 * it. Those are not the same year to plan for.
 *
 * Built from two stacked bars — an invisible base and the visible step —
 * because that is what a waterfall is, and Recharts has no waterfall of its
 * own. The alternative, a library for one chart, is a dependency to carry
 * forever.
 */
export function ArrBridgeChart({ bridge, currency, horizonDays }: ArrBridgeChartProps) {
  const data = useMemo(() => {
    const afterChurn = bridge.opening_arr - bridge.churn;
    const afterContraction = afterChurn - bridge.contraction;

    return [
      { name: 'Opening', base: 0, value: bridge.opening_arr, kind: 'total' as const },
      {
        name: 'Churn',
        base: afterChurn,
        value: bridge.churn,
        kind: 'down' as const,
        signed: -bridge.churn,
      },
      {
        name: 'Contraction',
        base: afterContraction,
        value: bridge.contraction,
        kind: 'down' as const,
        signed: -bridge.contraction,
      },
      {
        name: 'Expansion',
        base: afterContraction,
        value: bridge.expansion,
        kind: 'up' as const,
        signed: bridge.expansion,
      },
      { name: 'Forecast', base: 0, value: bridge.forecast_arr, kind: 'total' as const },
    ];
  }, [bridge]);

  const colour = { total: 'var(--info)', down: 'var(--danger)', up: 'var(--success)' };
  const max = Math.max(bridge.opening_arr, bridge.forecast_arr, 1) * 1.15;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">ARR bridge</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            What the book is worth today, and what moves it over the next {horizonDays} days
          </p>
        </div>
        <div className="text-right shrink-0">
          <p
            className={`text-[13px] font-bold tabular-nums ${
              bridge.net_change < 0 ? 'text-danger' : 'text-success'
            }`}
          >
            {bridge.net_change >= 0 ? '+' : ''}
            {formatCompactMoney(bridge.net_change, currency)}
          </p>
          <p className="text-[11px] text-ink-muted">
            {bridge.nrr === null ? 'NRR —' : `${bridge.nrr}% net revenue retention`}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 12, left: 4, bottom: 4 }} barSize={52}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={64}
              domain={[0, max]}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
              tickFormatter={(value: number) => formatCompactMoney(value, currency)}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-subtle)' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
              }}
              formatter={(_value, name, item) => {
                if (name === 'base') return [];
                const row = item?.payload;
                const signed = row?.signed ?? row?.value ?? 0;
                return [
                  `${signed > 0 && row?.kind !== 'total' ? '+' : ''}${formatMoney(signed, currency)}`,
                  row?.name ?? '',
                ];
              }}
            />
            {/* The invisible half of the waterfall: it lifts each step to
                where the running total sits. */}
            <Bar dataKey="base" stackId="bridge" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="value" stackId="bridge" radius={[3, 3, 0, 0]}>
              {data.map((row) => (
                <Cell key={row.name} fill={colour[row.kind]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
