import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList } from 'recharts';

const data = [
  { name: 'Jun 15, 2025', positive: 5, neutral: 2, negative: 1 },
  { name: 'Jun 22, 2025', positive: 29, neutral: 12, negative: 4 },
  { name: 'Jun 29, 2025', positive: 30, neutral: 14, negative: 3 },
  { name: 'Jul 6, 2025', positive: 32, neutral: 17, negative: 2 },
  { name: 'Jul 13, 2025', positive: 27, neutral: 14, negative: 4 },
  { name: 'Jul 20, 2025', positive: 23, neutral: 11, negative: 3 },
  { name: 'Jul 27, 2025', positive: 30, neutral: 13, negative: 5 },
  { name: 'Aug 3, 2025', positive: 32, neutral: 13, negative: 6 },
  { name: 'Aug 10, 2025', positive: 29, neutral: 12, negative: 5 },
  { name: 'Aug 17, 2025', positive: 26, neutral: 10, negative: 4 },
  { name: 'Aug 24, 2025', positive: 18, neutral: 11, negative: 3 },
  { name: 'Aug 31, 2025', positive: 24, neutral: 8, negative: 5 },
  { name: 'Sep 7, 2025', positive: 36, neutral: 18, negative: 8 },
  { name: 'Sep 14, 2025', positive: 28, neutral: 14, negative: 6 },
  { name: 'Sep 21, 2025', positive: 36, neutral: 13, negative: 4 },
  { name: 'Sep 28, 2025', positive: 30, neutral: 16, negative: 5 },
  { name: 'Oct 5, 2025', positive: 53, neutral: 19, negative: 7 },
  { name: 'Oct 12, 2025', positive: 45, neutral: 23, negative: 9 },
  { name: 'Oct 19, 2025', positive: 49, neutral: 30, negative: 8 },
  { name: 'Oct 26, 2025', positive: 59, neutral: 25, negative: 11 },
  { name: 'Nov 2, 2025', positive: 74, neutral: 35, negative: 15 },
  { name: 'Nov 9, 2025', positive: 82, neutral: 49, negative: 15 },
  { name: 'Nov 16, 2025', positive: 116, neutral: 54, negative: 23 },
  { name: 'Nov 23, 2025', positive: 142, neutral: 65, negative: 31 },
  { name: 'Nov 30, 2025', positive: 105, neutral: 53, negative: 40 },
  { name: 'Dec 7, 2025', positive: 28, neutral: 12, negative: 30 },
  { name: 'Dec 14, 2025', positive: 15, neutral: 5, negative: 7 },
];

export function SentimentOverTimeLine() {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-gray-800 mb-4">Activity Sentiments Over Time</h3>
      
      <div className="flex-1 w-full min-h-[350px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 25, right: 30, left: -20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              scale="point"
              tick={{ fill: '#9ca3af', fontSize: 10, angle: -45, textAnchor: 'end' }} 
              padding={{ left: 10, right: 10 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dx={-10}
              domain={[0, 150]}
              ticks={[0, 30, 60, 90, 120, 150]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Line 
              type="monotone" 
              dataKey="positive" 
              stroke="#22c55e" 
              strokeWidth={2} 
              dot={{ r: 3, strokeWidth: 1, fill: '#22c55e' }} 
              activeDot={{ r: 5, strokeWidth: 0 }}
            >
              <LabelList dataKey="positive" position="top" fill="#22c55e" fontSize={10} offset={10} />
            </Line>
            <Line 
              type="monotone" 
              dataKey="neutral" 
              stroke="#facc15" 
              strokeWidth={2} 
              dot={{ r: 3, strokeWidth: 1, fill: '#facc15' }} 
              activeDot={{ r: 5, strokeWidth: 0 }}
            >
              <LabelList dataKey="neutral" position="top" fill="#facc15" fontSize={10} offset={10} />
            </Line>
            <Line 
              type="monotone" 
              dataKey="negative" 
              stroke="#ea580c" 
              strokeWidth={2} 
              dot={{ r: 3, strokeWidth: 1, fill: '#ea580c' }} 
              activeDot={{ r: 5, strokeWidth: 0 }}
            >
              <LabelList dataKey="negative" position="bottom" fill="#ea580c" fontSize={10} offset={10} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
