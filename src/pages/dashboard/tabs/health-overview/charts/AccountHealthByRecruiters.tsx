import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';

export function AccountHealthByRecruiters({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // Generate a single bar or group based on current filter state
    // The mockup showed one massive red bar because the global filter was "Poor"
    const totalRecruiters = {
      Poor: 0,
      Average: 0,
      Good: 0,
    };

    data.forEach(d => {
      totalRecruiters[d.healthStatus] += d.activeRecruiters;
    });

    return [
      { name: 'Poor', value: totalRecruiters.Poor, fill: '#ef4444' },
      { name: 'Average', value: totalRecruiters.Average, fill: '#eab308' },
      { name: 'Good', value: totalRecruiters.Good, fill: '#14b8a6' },
    ].filter(d => d.value > 0);
  }, [data]);

  return (
    <div className="w-full h-full p-6 flex flex-col h-[280px]">
      <h3 className="text-[13px] font-bold text-gray-800 mb-4">Account Health by Active Recruiters (This Week)</h3>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }} barSize={120}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            <Bar dataKey="value" label={{ position: 'top', fill: '#6b7280', fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
