import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { ForecastBridge } from '../../../../../features/forecast/forecastSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { ROLE, TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { DrillTargets } from '../../../drill/DrillTargets';

export interface ArrBridgeChartProps {
  bridge: ForecastBridge;
  currency: CurrencyCode;
  horizonDays: number;
  /** The view's own filter query string, forwarded to the server drill so
   *  the accounts behind a bar respect the same book the bar was drawn from. */
  query: string;
}

/** Which server segment a bar drills into — Opening and Forecast are totals,
 *  not segments, so they carry none. */
const SEGMENT: Record<string, string> = {
  Churn: 'churn',
  Contraction: 'contraction',
  Expansion: 'expansion',
};

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
export function ArrBridgeChart({ bridge, currency, horizonDays, query }: ArrBridgeChartProps) {
  const { open } = useDrill();

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

  // Opening and Forecast are both "total" bars, but Forecast is drawn as an
  // outline rather than filled ink — the two are the same tone, and without a
  // visual difference the chart reads as opening-then-closing rather than
  // where-we-are-headed.
  const colour = { total: ROLE.ink, down: ROLE.loss, up: ROLE.gain };
  const max = Math.max(bridge.opening_arr, bridge.forecast_arr, 1) * 1.15;

  const openSegment = (row: (typeof data)[number], trigger?: HTMLElement) => {
    const segment = SEGMENT[row.name];
    if (!segment) return;
    open(
      {
        title: row.name,
        figure: formatCompactMoney(row.value, currency),
        source: { kind: 'server', path: '/customers/forecast/', query, segment },
      },
      trigger,
    );
  };

  // One keyboard target per drillable bar — a keyboard user can't reach a
  // recharts <Bar>'s SVG cells, so this is the real drill target; the Cell's
  // own onClick below is the pointer shortcut to the same thing. Opening and
  // Forecast are totals, not segments the server can drill into.
  const drillItems = data
    .filter((row) => SEGMENT[row.name])
    .map((row) => ({
      name: row.name,
      figure: formatCompactMoney(row.value, currency),
      onSelect: (trigger: HTMLElement) => openSegment(row, trigger),
    }));

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

      <div className="px-4">
        <DrillTargets label="ARR bridge" items={drillItems} />
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
              cursor={{ fill: CURSOR_FILL }}
              contentStyle={{ ...TOOLTIP_STYLE, fontSize: '12px' }}
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
            <Bar {...STATIC_SERIES} dataKey="base" stackId="bridge" fill="transparent" />
            <Bar {...STATIC_SERIES} dataKey="value" stackId="bridge" radius={[3, 3, 0, 0]}>
              {data.map((row) =>
                row.name === 'Forecast' ? (
                  <Cell key={row.name} fill="transparent" stroke={ROLE.ink} strokeWidth={2} />
                ) : SEGMENT[row.name] ? (
                  <Cell
                    key={row.name}
                    fill={colour[row.kind]}
                    cursor="pointer"
                    onClick={() => openSegment(row)}
                  />
                ) : (
                  <Cell key={row.name} fill={colour[row.kind]} />
                )
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
