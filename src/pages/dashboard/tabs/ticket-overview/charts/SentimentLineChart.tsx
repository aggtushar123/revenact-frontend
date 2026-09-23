import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketSentimentPoint } from '../../../../../features/tickets/ticketsSlice';
import { niceMax, ticksTo } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

export function SentimentLineChart({ data }: { data: TicketSentimentPoint[] }) {
  // The mock's domain={[0, 100]} clipped any month past 100 tickets.
  const max = niceMax([...data.map((d) => d.positive), ...data.map((d) => d.negative)]);
  return (
    <div className="w-full h-full p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold text-ink">Tickets By Sentiment and Created Date</h3>
      </div>
      
      <div className="flex-1 w-full min-h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={{ stroke: 'var(--border-default)' }} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
              domain={[0, max]}
              ticks={ticksTo(max, 5)}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
            />
            <Line {...STATIC_SERIES}
              type="linear" 
              dataKey="positive" 
              stroke="var(--success)" 
              strokeWidth={2}
              activeDot={{ r: 6, fill: 'var(--success)', strokeWidth: 0 }}
              dot={{ r: 4, fill: 'var(--success)', strokeWidth: 0 }}
              label={{ position: 'top', fill: 'var(--success)', fontSize: 11, fontWeight: 600, dy: -5 }}
            />
            <Line {...STATIC_SERIES}
              type="linear" 
              dataKey="negative" 
              stroke="var(--warning)" 
              strokeWidth={2}
              activeDot={{ r: 6, fill: 'var(--warning)', strokeWidth: 0 }}
              dot={{ r: 4, fill: 'var(--warning)', strokeWidth: 0 }}
              label={{ position: 'top', fill: 'var(--warning)', fontSize: 11, fontWeight: 600, dy: -5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
