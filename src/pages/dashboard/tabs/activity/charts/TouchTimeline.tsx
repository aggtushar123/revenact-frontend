import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ActivityWeek, SourceCount } from '../../../../../features/activity/activitySlice';

/** One colour per source. Not semantic — a note is not better or worse than a
 *  call — so these are five distinguishable hues rather than a red-to-green
 *  scale, which would imply a ranking that doesn't exist. */
const SOURCE_SERIES = [
  { key: 'calls', label: 'Calls', color: 'var(--warning)' },
  { key: 'meetings', label: 'Meetings', color: 'var(--accent)' },
  { key: 'activities', label: 'Activities', color: 'var(--info)' },
  { key: 'emails', label: 'Emails', color: 'var(--success)' },
  { key: 'notes', label: 'Notes', color: 'var(--text-tertiary)' },
] as const;

export interface TouchTimelineProps {
  weeks: ActivityWeek[];
  sources: SourceCount[];
  /** Tickets raised in the same window. Shown as a figure rather than a series:
   *  it is not team output, and stacking it would make a busy support week look
   *  like a productive one. */
  inbound: number;
  windowDays: number;
}

/**
 * Logged work per week, stacked by what kind it was.
 *
 * Stacked rather than lines, because the question is total output first and
 * mix second — five lines answer the mix question well and the volume question
 * badly, and volume is what a cadence review opens with.
 */
export function TouchTimeline({ weeks, sources, inbound, windowDays }: TouchTimelineProps) {
  const total = sources.reduce((sum, source) => sum + source.count, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">Logged work</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            Touches per week over the last {windowDays} days · tickets are counted apart, as
            inbound
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-bold text-ink tabular-nums">
            {total.toLocaleString()} touches
          </p>
          <p
            className={`text-[11px] tabular-nums ${
              inbound > total ? 'font-bold text-danger' : 'text-ink-muted'
            }`}
          >
            {inbound.toLocaleString()} inbound tickets
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-2">
        {weeks.length === 0 ? (
          <p className="px-2 py-6 text-[12px] text-ink-faint">
            Nothing logged against these accounts in this window.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeks} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                allowDecimals={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={22} iconType="plainline" />
              {SOURCE_SERIES.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stackId="touches"
                  stroke={series.color}
                  fill={series.color}
                  fillOpacity={0.45}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
