import { useMemo } from 'react';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { HealthDataRow } from '../mockData';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

export function AccountsLastTouchLine({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => {
    // We'll generate a static timeline of the last 12 months for visual fidelity, 
    // but scale the numbers by the length of the filtered data to simulate cross-filtering.
    const months = ['Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026'];
    
    // Base curve data
    const baseCurve = [1, 1, 1, 1, 1, 1, 2, 2, 6, 57, 71, 248];
    
    const factor = data.length / 60; // 60 is total mock items

    return months.map((m, i) => ({
      name: m,
      accounts: Math.max(0, Math.round(baseCurve[i] * factor))
    }));

  }, [data]);

  return (
    <div className="w-full h-full p-6 flex flex-col mt-4 border-t border-line-subtle">
      <h3 className="text-[13px] font-bold text-ink mb-4">Accounts by Last Touch (Monthly)</h3>
      
      <div className="flex-1 w-full relative min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10, angle: -45, textAnchor: 'end' }} 
              padding={{ left: 10, right: 10 }}
              dy={15}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgb(0 0 0 / 0.4)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
            
            <Line {...STATIC_SERIES}
              type="monotone" 
              dataKey="accounts" 
              stroke="var(--accent)" 
              strokeWidth={2} 
              dot={false}
              activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 0 }}
              label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10, dy: -5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
