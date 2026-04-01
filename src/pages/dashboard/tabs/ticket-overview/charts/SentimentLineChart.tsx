import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { SENTIMENT_TIMELINE_DATA } from '../mockData';

export function SentimentLineChart() {
  return (
    <div className="w-full h-full p-4 flex flex-col bg-white border border-gray-100 rounded-lg shadow-sm h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold text-gray-800">Tickets By Sentiment and Created Date</h3>
      </div>
      
      <div className="flex-1 w-full min-h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={SENTIMENT_TIMELINE_DATA} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={{ stroke: '#f3f4f6' }} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Line 
              type="linear" 
              dataKey="positive" 
              stroke="#22c55e" 
              strokeWidth={2}
              activeDot={{ r: 6, fill: '#22c55e', strokeWidth: 0 }}
              dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
              label={{ position: 'top', fill: '#22c55e', fontSize: 11, fontWeight: 600, dy: -5 }}
              isAnimationActive={false}
            />
            <Line 
              type="linear" 
              dataKey="negative" 
              stroke="#eab308" 
              strokeWidth={2}
              activeDot={{ r: 6, fill: '#eab308', strokeWidth: 0 }}
              dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }}
              label={{ position: 'top', fill: '#eab308', fontSize: 11, fontWeight: 600, dy: -5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
