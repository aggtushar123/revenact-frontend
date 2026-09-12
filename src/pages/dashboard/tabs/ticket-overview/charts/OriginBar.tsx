import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketOrigin } from '../../../../../features/tickets/ticketsSlice';
import { niceMax, ticksTo } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

export function OriginBar({ data }: { data: TicketOrigin[] }) {
  // Computed, not hard-coded: the mock's domain={[0, 400]} silently
  // clipped any bar above 400.
  const max = niceMax(data.map((d) => d.value));
  return (
    <div className="w-full h-[280px] p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold text-ink">Tickets By Origin</h3>
      </div>
      
      <div className="flex-1 w-full min-h-[200px] mt-2 relative -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="15%">
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }} 
              dy={5}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              domain={[0, max]}
              ticks={ticksTo(max)}
              width={38}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar {...STATIC_SERIES}
              dataKey="value" 
              fill="var(--accent)"
              radius={[2, 2, 0, 0]}
              label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10, dy: -5 }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
