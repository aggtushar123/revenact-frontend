import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketAssigneeRow } from '../../../../../features/tickets/ticketsSlice';
import { STATUS_COLORS, STATUS_ORDER, FALLBACK_COLOR, niceMax } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

export function AssigneesStackedBar({ data }: { data: TicketAssigneeRow[] }) {
  // The mock's domain={[0, 80]} clipped any assignee past 80 tickets.
  const max = niceMax(data.map((d) => d.total));
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
    <div className="w-full h-full p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm h-[320px]">
      <div className="flex flex-col mb-4">
        <h3 className="text-[13px] font-bold text-ink">Ticket Assignees by Ticket Status</h3>
      </div>
      
      <div className="flex-1 w-full relative -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            barSize={16}
            barGap={0}
          >
            <XAxis type="number" hide domain={[0, max]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              width={110}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 500 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />

            {/* Total Label Hack: Invisible un-stacked bar reaching the row end */}
            <Bar {...STATIC_SERIES}
              dataKey="total" 
              fill="transparent" 
              label={{ position: 'right', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, dx: 5 }} 
            />

            {/* One segment per real status, in ticket-lifecycle order —
                the mock hard-coded Zendesk's own six status names. */}
            {STATUS_ORDER.map((statusLabel) => (
              <Bar
                key={statusLabel}
                {...STATIC_SERIES}
                dataKey={statusLabel}
                stackId="a"
                fill={STATUS_COLORS[statusLabel] ?? FALLBACK_COLOR}
                label={renderCustomBarLabel}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
