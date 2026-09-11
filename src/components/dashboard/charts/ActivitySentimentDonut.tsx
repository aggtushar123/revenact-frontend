import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Negative', value: 300, color: 'var(--danger)' }, // Orange
  { name: 'Neutral', value: 590, color: 'var(--warning)' },  // Yellow
  { name: 'Positive', value: 1200, color: 'var(--success)' }, // Green
];

export function ActivitySentimentDonut() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Format total using compact notation, e.g., 2090 -> 2.09K
  const formattedTotal = total >= 1000 ? `${(total / 1000).toFixed(2)}K` : total.toString();

  return (
    <div className="w-full h-full p-6 flex flex-col relative">
      <h3 className="text-[14px] font-bold text-ink mb-4">Activities By Sentiment</h3>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={({ name, percent = 0, value, cx, cy, midAngle = 0, outerRadius = 0 }: any) => {
                const RADIAN = Math.PI / 180;
                // Place text outside the pie chart
                const radius = outerRadius + 15;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                const formattedValue = value >= 1000 ? `${(value / 1000).toFixed(1)}K` : `${(value / 1000).toFixed(1)}K`; // 300 -> 0.3K

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
                      {`${formattedValue} (${(percent * 100).toFixed(0)}%)`}
                    </tspan>
                  </text>
                );
              }}
              labelLine={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-ink tracking-tight">{formattedTotal}</span>
        </div>
      </div>
    </div>
  );
}
