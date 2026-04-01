import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';

const STATUS_COLORS = {
  Poor: '#ef4444',
  Average: '#eab308',
  Good: '#14b8a6',
};

export function HealthChangeOverTimeStacked({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // We will simulate the visual from the mockup by generating a scaling trend line
    // since our mock data doesn't have 12 months deep history for all 60 accounts.
    const allMonths = [
      'Apr 30, 2025', 'May 31, 2025', 'Jun 30, 2025', 'Jul 31, 2025', 
      'Aug 31, 2025', 'Sep 30, 2025', 'Oct 31, 2025', 'Nov 30, 2025', 
      'Dec 31, 2025', 'Jan 31, 2026', 'Feb 28, 2026', 'Mar 31, 2026'
    ];

    const factor = data.length / 60;

    return allMonths.map((m, i) => {
      // Simulate an up-and-to-the-right scaling curve matching the visual
      const baseTotal = 20 + i * 15; // 20, 35, 50, 65...
      const total = Math.max(1, Math.round(baseTotal * factor));

      // Recreate the color distribution
      let pGood = 0.50, pAvg = 0.35, pPoor = 0.15;

      // If there is only one type of data due to filtering, the stack will natively 
      // just render the one active key because the other keys will naturally be 0
      // In the mock, we can hardcode the distribution logic to show the solid block
      if (data.length > 0 && data.every(d => d.healthStatus === 'Poor')) {
        pGood = 0; pAvg = 0; pPoor = 1;
      } else if (data.length > 0 && data.every(d => d.healthStatus === 'Good')) {
        pGood = 1; pAvg = 0; pPoor = 0;
      } else if (data.length > 0 && data.every(d => d.healthStatus === 'Average')) {
        pGood = 0; pAvg = 1; pPoor = 0;
      }

      return {
        name: m,
        Good: Math.round(total * pGood),
        Average: Math.round(total * pAvg),
        Poor: Math.round(total * pPoor),
        total
      };
    });

  }, [data]);

  return (
    <div className="w-full h-full p-6 flex flex-col mt-4 border-t border-gray-100">
      <h3 className="text-[13px] font-bold text-gray-800 mb-4">Account Health Change Over Time (Monthly)</h3>
      
      <div className="flex-1 w-full relative min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }} barSize={28}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 10, angle: -45, textAnchor: 'end' }} 
              padding={{ left: 10, right: 10 }}
              dy={15}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Bar dataKey="Average" stackId="a" fill={STATUS_COLORS.Average} />
            <Bar dataKey="Good" stackId="a" fill={STATUS_COLORS.Good} />
            <Bar dataKey="Poor" stackId="a" fill={STATUS_COLORS.Poor} label={{ position: 'top', fill: '#6b7280', fontSize: 9 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
