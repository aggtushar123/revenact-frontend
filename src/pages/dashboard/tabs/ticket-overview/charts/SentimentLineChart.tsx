import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketSentimentPoint } from '../../../../../features/tickets/ticketsSlice';
import { SENTIMENT_SERIES, niceMax, ticksTo } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

export function SentimentLineChart({ data }: { data: TicketSentimentPoint[] }) {
  // The mock's domain={[0, 100]} clipped any month past 100 tickets.
  const max = niceMax([...data.map((d) => d.positive), ...data.map((d) => d.negative)]);
  return (
    <div className="w-full h-full p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[13px] font-bold text-ink">Tickets By Sentiment and Created Date</h3>
        <ul className="flex items-center gap-3 text-[11px] text-ink-muted" aria-label="Series">
          {Object.values(SENTIMENT_SERIES).map((series) => (
            <li key={series.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="w-3 h-0.5 rounded-full" style={{ background: series.color }} />
              {series.label}
            </li>
          ))}
        </ul>
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
              name={SENTIMENT_SERIES.positive.label}
              stroke={SENTIMENT_SERIES.positive.color}
              strokeWidth={2}
              activeDot={{ r: 6, fill: SENTIMENT_SERIES.positive.color, strokeWidth: 0 }}
              dot={{ r: 4, fill: SENTIMENT_SERIES.positive.color, strokeWidth: 0 }}
              label={{ position: 'top', fill: SENTIMENT_SERIES.positive.color, fontSize: 11, fontWeight: 600, dy: -5 }}
            />
            {/* Negative sentiment is a loss — the one job danger has. */}
            <Line {...STATIC_SERIES}
              type="linear"
              dataKey="negative"
              name={SENTIMENT_SERIES.negative.label}
              stroke={SENTIMENT_SERIES.negative.color}
              strokeWidth={2}
              activeDot={{ r: 6, fill: SENTIMENT_SERIES.negative.color, strokeWidth: 0 }}
              dot={{ r: 4, fill: SENTIMENT_SERIES.negative.color, strokeWidth: 0 }}
              label={{ position: 'top', fill: SENTIMENT_SERIES.negative.color, fontSize: 11, fontWeight: 600, dy: -5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
