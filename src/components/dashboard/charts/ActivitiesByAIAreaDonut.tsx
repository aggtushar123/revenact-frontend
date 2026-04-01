import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Product & Growth', value: 57, percent: 41, color: '#6366f1' }, // Indigo/Purple
  { name: 'Support & Operations', value: 39, percent: 28, color: '#f59e0b' }, // Amber
  { name: 'Customer Success', value: 42, percent: 30, color: '#38bdf8' }, // Sky Blue
];

export function ActivitiesByAIAreaDonut() {
  const total = 138;

  return (
    <div className="w-full h-full p-6 flex flex-col relative">
      <h3 className="text-[14px] font-bold text-gray-800 mb-4">Activities By AI Area (Common Taxonomy)</h3>
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

                const dataPoint = data.find(d => d.name === name);
                const displayPercent = dataPoint ? dataPoint.percent : (percent * 100).toFixed(0);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="#4b5563"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-[12px] font-medium"
                  >
                    <tspan x={x} dy="-0.6em">
                      {name}
                    </tspan>
                    <tspan x={x} dy="1.4em">
                      {`${value} (${displayPercent}%)`}
                    </tspan>
                  </text>
                );
              }}
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
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
          <span className="text-2xl font-semibold text-gray-800 tracking-tight">{total}</span>
        </div>
      </div>
    </div>
  );
}
