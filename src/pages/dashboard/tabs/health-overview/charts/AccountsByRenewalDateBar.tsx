import { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';

export function AccountsByRenewalDateBar({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // Generate months from Mar 2026 to Jan 2028 based on screenshot
    const months = [
      'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 
      'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026', 'Jan 2027', 'Feb 2027',
      'Mar 2027', 'Apr 2027', 'Jun 2027', 'Jul 2027', 'Sep 2027', 'Oct 2027', 
      'Nov 2027', 'Jan 2028'
    ];
    
    const randomVals = [3, 5, 2, 5, 1, 1, 1, 1, 3, 3, 1, 3, 1, 1, 1, 1, 1, 1, 1, 2];
    
    // Simulate data shape from screenshot: random fluctuating bars with a static blue benchmark line
    return months.map((m, i) => {
      // Mock some data. We'll use the 'filter' scaling to make it react to data len.
      const factor = data.length / 60;
      
      const barVal = Math.max(0, Math.round(randomVals[i % randomVals.length] * factor));
      const lineVal = Math.max(1, Math.round(2 * factor));

      let pGood = 0.50, pAvg = 0.35, pPoor = 0.15;

      if (data.length > 0 && data.every(d => d.healthStatus === 'Poor')) {
        pGood = 0; pAvg = 0; pPoor = 1;
      } else if (data.length > 0 && data.every(d => d.healthStatus === 'Good')) {
        pGood = 1; pAvg = 0; pPoor = 0;
      } else if (data.length > 0 && data.every(d => d.healthStatus === 'Average')) {
        pGood = 0; pAvg = 1; pPoor = 0;
      }

      return {
        name: m,
        Good: Math.round(barVal * pGood),
        Average: Math.round(barVal * pAvg),
        Poor: Math.max(1, Math.round(barVal * pPoor)), // ensure at least 1 shows up for aesthetic
        benchmark: lineVal,
      };
    });
  }, [data]);

  return (
    <div className="w-full h-[280px] p-6 flex flex-col">
      <h3 className="text-[13px] font-bold text-gray-800 mb-6">Accounts by Renewal Date (Monthly)</h3>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 10, angle: -45, textAnchor: 'end' }} 
              padding={{ left: 15, right: 15 }}
              dy={15}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Bar dataKey="Average" stackId="a" fill="#eab308" barSize={24} />
            <Bar dataKey="Good" stackId="a" fill="#14b8a6" barSize={24} />
            <Bar dataKey="Poor" stackId="a" fill="#ef4444" barSize={24} label={{ position: 'top', fill: '#6b7280', fontSize: 10, dy: -5 }} />
            
            <Line 
              type="linear" 
              dataKey="benchmark" 
              stroke="#818cf8" 
              strokeWidth={1} 
              dot={false}
              label={{ position: 'top', fill: '#818cf8', fontSize: 10, dy: -20 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
