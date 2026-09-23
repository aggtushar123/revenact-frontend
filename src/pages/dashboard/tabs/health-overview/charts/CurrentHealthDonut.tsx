import { useMemo } from 'react';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { HealthDataRow, HealthStatus } from '../mockData';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

interface CurrentHealthDonutProps {
  data: HealthDataRow[];
  activeFilter: HealthStatus | null;
  onSegmentClick: (status: HealthStatus | null) => void;
  filteredCount: number;
}

const STATUS_COLORS: Record<HealthStatus, string> = {
  'Poor': 'var(--danger)',
  'Average': 'var(--warning)',
  'Good': 'var(--success)',
};

export function CurrentHealthDonut({ data, activeFilter, onSegmentClick }: CurrentHealthDonutProps) {
  const chartData = useMemo(() => {
    const counts = { Poor: 0, Average: 0, Good: 0 };
    data.forEach(d => counts[d.healthStatus]++);
    
    return [
      { name: 'Poor', value: counts.Poor, color: STATUS_COLORS.Poor },
      { name: 'Average', value: counts.Average, color: STATUS_COLORS.Average },
      { name: 'Good', value: counts.Good, color: STATUS_COLORS.Good },
    ];
  }, [data]);

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full h-full p-4 flex flex-col relative group cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[13px] font-bold text-ink">Current Health</h3>
        <div className="flex items-center gap-3">
          {chartData.map(d => (
            <div key={d.name} className="flex items-center gap-1.5 opacity-80">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] font-medium text-ink-muted">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              {...STATIC_SERIES}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              onClick={(data) => {
                if (data.payload.name === activeFilter) {
                  onSegmentClick(null); // Toggle off
                } else {
                  onSegmentClick(data.payload.name as HealthStatus); // Set filter
                }
              }}
              label={({ name, percent = 0, value, cx, cy, midAngle = 0, outerRadius = 0 }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 15;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                // Dim the label if another filter is active
                const isFaded = activeFilter && activeFilter !== name;
                if (isFaded) return null;

                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill={STATUS_COLORS[name as HealthStatus]} 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    className="text-[11px] font-bold"
                  >
                    <tspan x={x} dy="-0.6em">{name}</tspan>
                    <tspan x={x} dy="1.2em" className="text-ink-muted font-medium">{`${value} (${(percent * 100).toFixed(0)}%)`}</tspan>
                  </text>
                );
              }}
            >
              {chartData.map((entry, index) => {
                const isFaded = activeFilter && activeFilter !== entry.name;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    style={{ 
                      opacity: isFaded ? 0.2 : 1,
                      transition: 'opacity 0.3s ease',
                      cursor: 'pointer' 
                    }} 
                  />
                );
              })}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ fontSize: '13px', fontWeight: 500 }}
              formatter={(value, name) => [`${value}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-3xl font-medium text-ink tabular-nums">{total}</span>
        </div>
      </div>
    </div>
  );
}
