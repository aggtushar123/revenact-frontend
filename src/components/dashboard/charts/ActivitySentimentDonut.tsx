import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Negative', value: 300, color: '#f43f5e' }, // Rose/Red
  { name: 'Neutral', value: 1200, color: '#f59e0b' }, // Amber
  { name: 'Positive', value: 588, color: '#10b981' }, // Emerald/Green
];

export function ActivitySentimentDonut() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-gray-800 mb-4">Activities By Sentiment</h3>
      <div className="flex-1 relative min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={120}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
              label={({ name, percent = 0, value, cx, cy, midAngle = 0, outerRadius = 0 }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 25;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="#4b5563" 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    className="text-[12px] font-medium"
                  >
                    <tspan x={x} dy="-0.5em">{name}</tspan>
                    <tspan x={x} dy="1.2em">{`${(value / 1000).toFixed(1)}k (${(percent * 100).toFixed(0)}%)`}</tspan>
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
          <div className="text-center mt-2">
            <span className="text-4xl font-normal text-gray-800 tracking-tight">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
