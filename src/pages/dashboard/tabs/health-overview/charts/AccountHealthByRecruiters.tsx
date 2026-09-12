import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

export function AccountHealthByRecruiters({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // Generate a single bar or group based on current filter state
    // The mockup showed one massive red bar because the global filter was "Poor"
    // Seats, not recruiters: the mock invented a recruiter count, and the
    // backend records `total_active_seats`. Accounts with no seat figure
    // recorded contribute nothing rather than a zero that looks measured.
    const totalSeats = {
      Poor: 0,
      Average: 0,
      Good: 0,
    };

    data.forEach(d => {
      totalSeats[d.healthStatus] += d.activeSeats ?? 0;
    });

    return [
      { name: 'Poor', value: totalSeats.Poor, fill: 'var(--danger)' },
      { name: 'Average', value: totalSeats.Average, fill: 'var(--warning)' },
      { name: 'Good', value: totalSeats.Good, fill: 'var(--success)' },
    ].filter(d => d.value > 0);
  }, [data]);

  return (
    <div className="w-full h-full p-6 flex flex-col h-[280px]">
      <h3 className="text-[13px] font-bold text-ink mb-4">Account Health by Active Seats</h3>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }} barSize={120}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgb(0 0 0 / 0.4)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
            
            <Bar {...STATIC_SERIES} dataKey="value" label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
