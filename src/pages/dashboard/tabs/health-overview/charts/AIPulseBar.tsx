import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';

export function AIPulseBar({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // Collect frequencies for scores 1-5
    const freqs: Record<number, { Poor: number, Average: number, Good: number }> = {
      1: { Poor: 0, Average: 0, Good: 0 },
      2: { Poor: 0, Average: 0, Good: 0 },
      3: { Poor: 0, Average: 0, Good: 0 },
      4: { Poor: 0, Average: 0, Good: 0 },
      5: { Poor: 0, Average: 0, Good: 0 },
    };

    data.forEach(d => {
      if (d.aiPulseScore >= 1 && d.aiPulseScore <= 5) {
        freqs[d.aiPulseScore][d.healthStatus]++;
      }
    });

    return [1, 2, 3, 4, 5].map(score => ({
      score: score.toString(),
      Poor: freqs[score].Poor,
      Average: freqs[score].Average,
      Good: freqs[score].Good,
      total: freqs[score].Poor + freqs[score].Average + freqs[score].Good
    }));
  }, [data]);

  return (
    <div className="w-full h-full p-4 flex flex-col relative h-[140px]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[13px] font-bold text-gray-800">AI Pulse Score</h3>
      </div>
      
      <div className="flex-1 w-full mt-2 relative min-h-[90px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -25, bottom: -5 }}
            barSize={24}
          >
            <XAxis 
              dataKey="score" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dy={5}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Bar dataKey="Poor" stackId="a" fill="#ef4444" label={{ position: 'top', fill: '#6b7280', fontSize: 10 }} />
            <Bar dataKey="Average" stackId="a" fill="#eab308" label={{ position: 'top', fill: '#6b7280', fontSize: 10 }} />
            <Bar dataKey="Good" stackId="a" fill="#14b8a6" label={{ position: 'top', fill: '#6b7280', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
