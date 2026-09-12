import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

export function CSMPulseBar({ data }: { data: HealthDataRow[] }) {
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
      // Null means nobody has rated this account — it belongs in no bucket
      // rather than in the lowest one.
      const score = d.csmPulseScore;
      if (score !== null && score >= 1 && score <= 5) {
        freqs[score][d.healthStatus]++;
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
        <h3 className="text-[13px] font-bold text-ink">CSM Pulse Score</h3>
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
              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
              dy={5}
            />
            <YAxis hide />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgb(0 0 0 / 0.4)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
            
            {/* 
              Recharts trick: To get the single colored bar based on its predominant composition, 
              we can use stacked bars or render custom Cells based on composition. 
              The mockup shows distinct vertical bars colored based on their cohort. 
              Scores 1-2 tend to be poor (red), 3 average (yellow), 4-5 good (teal).
              For cross-filtering, if ONLY poor is selected, they should all be red.
              Let's use stacked bars, which natively handles this! 
            */}
            <Bar {...STATIC_SERIES} dataKey="Poor" stackId="a" fill="var(--danger)" label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }} />
            <Bar {...STATIC_SERIES} dataKey="Average" stackId="a" fill="var(--warning)" label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }} />
            <Bar {...STATIC_SERIES} dataKey="Good" stackId="a" fill="var(--success)" label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
