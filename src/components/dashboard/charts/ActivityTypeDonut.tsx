import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Email', value: 876, color: 'var(--info)' },
  { name: 'Call', value: 534, color: 'var(--warning)' },
  { name: 'Ticket', value: 678, color: 'var(--accent)' },
];

export function ActivityTypeDonut() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-ink mb-4">Activities By Type</h3>
      <div className="flex-1 relative min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
              label={({ name, percent = 0, value, cx, cy, midAngle = 0, outerRadius = 0 }) => {
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
                    {`${name} \n${value} (${(percent * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-2xl font-semibold text-ink tracking-tight">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
