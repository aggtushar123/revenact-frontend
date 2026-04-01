import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';
import { MOCK_OWNERS, MOCK_HEALTH_DATA } from '../mockData';

const STATUS_COLORS = {
  Poor: '#ef4444',
  Average: '#eab308',
  Good: '#14b8a6',
};

export function HealthByOwnerStackedBar({ data }: { data: HealthDataRow[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, payload, dataKey } = props;
    const nx = Number(x) || 0;
    const ny = Number(y) || 0;
    const nw = Number(width) || 0;
    const nh = Number(height) || 0;
    
    const nVal = payload && dataKey ? Number(payload[dataKey]) : 0;

    if (!nVal || nVal <= 0) return null;
    if (nw < 35) return null; // hide label if slice is too thin
    return (
      <text x={nx + nw / 2} y={ny + nh / 2} fill="#ffffff" fontSize={11} fontWeight={500} textAnchor="middle" dy={4}>
        {`${nVal}%`}
      </text>
    );
  };

  const chartData = useMemo(() => {
    return MOCK_OWNERS.map(owner => {
      // Use unfiltered data for total to keep percentage bounds absolute
      const originalRows = MOCK_HEALTH_DATA.filter(d => d.owner === owner);
      const originalTotal = originalRows.length || 1;
      
      const myRows = data.filter(d => d.owner === owner);
      
      const counts = { Poor: 0, Average: 0, Good: 0 };
      myRows.forEach(row => counts[row.healthStatus]++);

      return {
        name: owner,
        Poor: parseFloat(((counts.Poor / originalTotal) * 100).toFixed(2)),
        Average: parseFloat(((counts.Average / originalTotal) * 100).toFixed(2)),
        Good: parseFloat(((counts.Good / originalTotal) * 100).toFixed(2)),
        filteredTotal: myRows.length,
      };
    }).filter(row => row.filteredTotal > 0); 
  }, [data]);

  return (
    <div className="w-full h-full p-4 flex flex-col relative h-[300px]">
      <div className="flex flex-col mb-4">
        <h3 className="text-[13px] font-bold text-gray-800 mb-2">Health By Owner</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 opacity-90">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS.Average }} />
            <span className="text-[11px] font-medium text-gray-500">Average</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-90">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS.Good }} />
            <span className="text-[11px] font-medium text-gray-500">Good</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-90">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS.Poor }} />
            <span className="text-[11px] font-medium text-gray-500">Poor</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 30, left: 10, bottom: 5 }}
            barSize={20}
          >
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              width={100}
              tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value, name) => [`${value}%`, name]}
            />

            <Bar dataKey="Average" stackId="a" fill={STATUS_COLORS.Average} label={renderCustomBarLabel} />
            <Bar dataKey="Good" stackId="a" fill={STATUS_COLORS.Good} label={renderCustomBarLabel} />
            <Bar dataKey="Poor" stackId="a" fill={STATUS_COLORS.Poor} label={renderCustomBarLabel} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
