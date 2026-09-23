import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { SentimentPoint } from '../../../../../features/interactions/interactionsSlice';
import { SENTIMENT_SERIES, niceMax } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

/** How many weeks the line shows. A year of weekly points is 52 ticks on an axis
 *  about 700px wide, which is unreadable; the most recent half-year is what a
 *  trend is read for, and the filter bar's own date range is how you see more. */
const MAX_WEEKS = 26;

/** Positive / neutral / negative counts per week.
 *
 * The mock pinned its Y axis to `domain={[0, 150]}` with hand-written ticks,
 * which silently clipped anything above 150 — so the axis is derived from the
 * data now. Weeks with no interactions at all are absent from the payload
 * rather than zero-filled, which is deliberate on the backend's part: the gap is
 * the truth, and a zero implies a week that was checked and found empty.
 *
 * Per-point value labels are gone with the mock. At 26 weeks × 3 series they
 * overlapped into illegibility; the tooltip carries the exact numbers. */
export function SentimentOverTimeLine({ data }: { data: SentimentPoint[] }) {
  const rows = data.slice(-MAX_WEEKS);
  const max = niceMax(rows.flatMap((p) => [p.positive, p.neutral, p.negative]));

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-ink mb-4">Activity Sentiments Over Time</h3>

      <div className="flex-1 w-full min-h-[350px] relative">
        {rows.length === 0 ? (
          <p className="text-[12.5px] text-ink-faint">No activity in this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 25, right: 30, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-strong)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                scale="point"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, angle: -45, textAnchor: 'end' }}
                padding={{ left: 10, right: 10 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                dx={-10}
                domain={[0, max]}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
              />
              <Legend verticalAlign="top" height={24} iconType="plainline" />

              {SENTIMENT_SERIES.map((series) => (
                <Line
                  key={series.key}
                  {...STATIC_SERIES}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={{ r: 2, strokeWidth: 1, fill: series.color }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
