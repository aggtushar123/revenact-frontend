import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { UsageAccount } from '../../../../../features/usage/usageSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import { BAND_COLORS, FALLBACK_COLOR, niceMax } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

export interface UsageScatterProps {
  points: UsageAccount[];
  currency: CurrencyCode;
  /** Where shelfware stops and healthy use starts, from the API's own rule. */
  shelfwareCeiling?: number;
  capacityFloor?: number;
}

/**
 * Every account: what it pays against how much of it is used.
 *
 * The one chart on this screen that finds accounts rather than describing the
 * book. **Up and to the left is the money problem** — a large contract barely
 * used — and up and to the right is the expansion list. Dot size is contracted
 * seats, so a big dot on the left is a big rollout that never landed.
 *
 * The two reference lines are the same thresholds the backend counts by, drawn
 * rather than described: a reader should be able to see why an account is in
 * the shelfware list without being told the rule.
 */
export function UsageScatter({
  points,
  currency,
  shelfwareCeiling = 75,
  capacityFloor = 90,
}: UsageScatterProps) {
  const data = useMemo(
    () =>
      points.map((point) => ({
        x: point.utilisation ?? 0,
        // An unpriced account still has usage worth plotting; it sits on the
        // floor rather than vanishing, and its tooltip says why.
        y: point.arr ?? 0,
        z: point.contracted_seats ?? 1,
        point,
      })),
    [points]
  );

  const maxArr = niceMax(data.map((row) => row.y));
  // Past 100% is real (more actives than the contract allows), so the axis has
  // to have room for it rather than clipping those accounts off the edge.
  const maxUtil = Math.max(100, ...data.map((row) => row.x));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 pt-3">
        <h3 className="text-[13px] font-bold text-ink">Every account: spend against use</h3>
        <p className="text-[11px] text-ink-faint mt-[1px]">
          Dot size is contracted seats · top-left is the money problem, right of{' '}
          {capacityFloor}% is expansion
        </p>
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-3">
        {data.length === 0 ? (
          <p className="px-2 py-6 text-[12px] text-ink-faint">
            No account in this selection has seat data recorded.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 16, left: 4, bottom: 12 }}>
              <XAxis
                type="number"
                dataKey="x"
                name="Utilisation"
                domain={[0, maxUtil]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                tickFormatter={(value: number) => `${value}%`}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="ARR"
                domain={[0, maxArr]}
                width={64}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                tickFormatter={(value: number) => formatCompactMoney(value, currency)}
              />
              <ZAxis type="number" dataKey="z" range={[40, 420]} />

              <ReferenceLine
                x={shelfwareCeiling}
                stroke="var(--border-strong)"
                strokeDasharray="4 4"
                label={{
                  value: `${shelfwareCeiling}%`,
                  position: 'top',
                  fill: 'var(--text-tertiary)',
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                x={capacityFloor}
                stroke="var(--info)"
                strokeDasharray="4 4"
                label={{
                  value: `${capacityFloor}%`,
                  position: 'top',
                  fill: 'var(--info)',
                  fontSize: 10,
                }}
              />

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  fontSize: '12px',
                }}
                formatter={(_value, _name, item) => {
                  const point = item?.payload?.point as UsageAccount | undefined;
                  if (!point) return ['', ''];
                  return [
                    `${point.utilisation}% used · ${point.active_seats}/${point.contracted_seats} seats · ${
                      point.arr === null ? 'ARR unpriced' : formatMoney(point.arr, currency)
                    }`,
                    point.name,
                  ];
                }}
              />
              <Scatter {...STATIC_SERIES} data={data} fillOpacity={0.75}>
                {data.map((row) => (
                  <Cell
                    key={row.point.id}
                    fill={BAND_COLORS[row.point.band ?? ''] ?? FALLBACK_COLOR}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
