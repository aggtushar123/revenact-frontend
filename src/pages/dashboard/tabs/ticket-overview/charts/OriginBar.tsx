import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ORIGIN_DATA } from '../mockData';

export function OriginBar() {
  return (
    <div className="w-full h-[280px] p-4 flex flex-col bg-white border border-gray-100 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold text-gray-800">Tickets By Origin</h3>
      </div>
      
      <div className="flex-1 w-full min-h-[200px] mt-2 relative -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ORIGIN_DATA} barCategoryGap="15%">
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} 
              dy={5}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              domain={[0, 400]}
              ticks={[0, 100, 200, 300, 400]}
              width={35}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              fill="#4f46e5"
              radius={[2, 2, 0, 0]}
              label={{ position: 'top', fill: '#6b7280', fontSize: 10, dy: -5 }} 
              isAnimationActive={false} // for consistent pixel rendering 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
