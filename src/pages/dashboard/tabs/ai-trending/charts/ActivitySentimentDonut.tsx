import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { InteractionBucket } from '../../../../../features/interactions/interactionsSlice';
import { SENTIMENT_COLORS, FALLBACK_COLOR, compact, percentOf } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

/** Interactions by sentiment, across all three sources. */
export function ActivitySentimentDonut({ data }: { data: InteractionBucket[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-full p-6 flex flex-col relative">
      <h3 className="text-[14px] font-bold text-ink mb-4">Activities By Sentiment</h3>
      <div className="flex-1 min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...STATIC_SERIES}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={0}
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
                    <tspan x={x} dy="-0.6em">
                      {name}
                    </tspan>
                    <tspan x={x} dy="1.4em">
                      {`${compact(Number(value))} (${percentOf(Number(value), total)}%)`}
                    </tspan>
                  </text>
                );
              }}
              labelLine={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={SENTIMENT_COLORS[entry.name] ?? FALLBACK_COLOR} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-ink tracking-tight">{compact(total)}</span>
        </div>
      </div>
    </div>
  );
}
