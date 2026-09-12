import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { InteractionBucket } from '../../../../../features/interactions/interactionsSlice';
import { AREA_COLORS, FALLBACK_COLOR, percentOf } from '../chartTheme';
import { UnclassifiedNote } from './UnclassifiedNote';

/** Classified interactions by AI Area — which side of the business owns the
 *  conversation.
 *
 * Its total is the number of *classified* interactions, not every interaction:
 * the backend leaves unclassified rows out of this breakdown rather than
 * bucketing them as "Unknown". The note underneath says so when the two differ,
 * because a donut that quietly describes a third of the book is worse than one
 * that admits it. */
export function ActivitiesByAIAreaDonut({
  data,
  classified,
  total,
}: {
  data: InteractionBucket[];
  /** How many interactions in scope carry a classification, from the API. Used
   *  for the note, not for the ring: a row can have a category and no area, so
   *  this chart's own segments can sum to less than it. */
  classified: number;
  /** Every interaction in scope, classified or not — for the note below. */
  total: number;
}) {
  const plotted = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-full p-6 flex flex-col relative">
      <h3 className="text-[14px] font-bold text-ink mb-4">
        Activities By AI Area (Common Taxonomy)
      </h3>
      <div className="flex-1 min-h-[300px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
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
                    className="text-[11px] font-medium"
                  >
                    <tspan x={x} dy="-0.6em">
                      {name}
                    </tspan>
                    <tspan x={x} dy="1.4em">
                      {`${value} (${percentOf(Number(value), plotted)}%)`}
                    </tspan>
                  </text>
                );
              }}
              labelLine={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={AREA_COLORS[entry.name] ?? FALLBACK_COLOR} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-ink tracking-tight">
            {plotted.toLocaleString()}
          </span>
        </div>
      </div>
      <UnclassifiedNote classified={classified} total={total} />
    </div>
  );
}
