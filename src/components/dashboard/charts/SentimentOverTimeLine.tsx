import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Week 1', positive: 65, negative: 12 },
  { name: 'Week 2', positive: 59, negative: 18 },
  { name: 'Week 3', positive: 80, negative: 15 },
  { name: 'Week 4', positive: 142, negative: 32 },
  { name: 'Week 5', positive: 90, negative: 20 },
];

export function SentimentOverTimeLine() {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-gray-800 mb-4">Activity Sentiments Over Time</h3>
      
      <div className="flex-1 w-full min-h-[260px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              scale="point"
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
              padding={{ left: 10, right: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            {/* Using colors that match the reference chart */}
            <Line 
              type="monotone" 
              dataKey="positive" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="negative" 
              stroke="#f43f5e" 
              strokeWidth={3} 
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
