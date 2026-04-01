import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ASSIGNEE_DATA } from '../mockData';

const ASSIGNEE_COLORS = { 
  Solved: '#2ecc71',   // Standard green
  Open: '#f1c40f',     // Yellow
  Pending: '#3498db',  // Standard blue
  Closed: '#f39c12',   // Orange
  New: '#e74c3c',      // Red
  Hold: '#1abc9c'      // Teal
};

export function AssigneesStackedBar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, payload, dataKey } = props;
    const nx = Number(x) || 0;
    const ny = Number(y) || 0;
    const nw = Number(width) || 0;
    const nh = Number(height) || 0;
    
    const nVal = payload && dataKey ? Number(payload[dataKey]) : 0;

    if (!nVal || nVal <= 0) return null;
    if (nw < 20) return null; // hide label if slice is too thin
    
    return (
      <text x={nx + nw / 2} y={ny + nh / 2} fill="#ffffff" fontSize={10} fontWeight={600} textAnchor="middle" dy={4}>
        {nVal}
      </text>
    );
  };

  return (
    <div className="w-full h-full p-4 flex flex-col bg-white border border-gray-100 rounded-lg shadow-sm h-[320px]">
      <div className="flex flex-col mb-4">
        <h3 className="text-[13px] font-bold text-gray-800">Ticket Assignees by Ticket Status</h3>
      </div>
      
      <div className="flex-1 w-full relative -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={ASSIGNEE_DATA}
            margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            barSize={16}
            barGap={0}
          >
            <XAxis type="number" hide domain={[0, 80]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              width={110}
              tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {/* Total Label Hack: Invisible un-stacked bar reaching the row end */}
            <Bar 
              dataKey="total" 
              fill="transparent" 
              isAnimationActive={false}
              label={{ position: 'right', fill: '#4b5563', fontSize: 11, fontWeight: 600, dx: 5 }} 
            />

            <Bar dataKey="Solved" stackId="a" fill={ASSIGNEE_COLORS.Solved} label={renderCustomBarLabel} isAnimationActive={false} />
            <Bar dataKey="Open" stackId="a" fill={ASSIGNEE_COLORS.Open} label={renderCustomBarLabel} isAnimationActive={false} />
            <Bar dataKey="Pending" stackId="a" fill={ASSIGNEE_COLORS.Pending} label={renderCustomBarLabel} isAnimationActive={false} />
            <Bar dataKey="Closed" stackId="a" fill={ASSIGNEE_COLORS.Closed} label={renderCustomBarLabel} isAnimationActive={false} />
            <Bar dataKey="New" stackId="a" fill={ASSIGNEE_COLORS.New} label={renderCustomBarLabel} isAnimationActive={false} />
            <Bar dataKey="Hold" stackId="a" fill={ASSIGNEE_COLORS.Hold} label={renderCustomBarLabel} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
