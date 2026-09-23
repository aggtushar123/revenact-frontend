import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { InteractionBucket } from '../../../../../features/interactions/interactionsSlice';
import { SOURCE_COLORS, FALLBACK_COLOR, percentOf } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

/** Interactions by where they came from: email, call or ticket.
 *
 * Empty buckets are kept rather than filtered out — the backend always returns
 * all three, and a donut whose segment disappears when a source goes quiet is
 * harder to read than one with an empty segment. Recharts draws nothing for a
 * zero, so the legend label still sits in the ring's order. */
export function ActivityTypeDonut({ data }: { data: InteractionBucket[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-ink mb-4">Activities By Type</h3>
      <div className="flex-1 relative min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...STATIC_SERIES}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
              label={({ name, value, cx, cy, midAngle = 0, outerRadius = 0 }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 15;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="var(--text-secondary)"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-[12px] font-medium"
                  >
                    {`${name} ${value} (${percentOf(Number(value), total)}%)`}
                  </text>
                );
              }}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={SOURCE_COLORS[entry.name] ?? FALLBACK_COLOR} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-ink tracking-tight">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
