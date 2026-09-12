import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow } from '../mockData';
import { buildFlow } from '../movement';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

const STATUS_COLORS = {
  Poor: 'var(--danger)',
  Average: 'var(--warning)',
  Good: 'var(--success)',
};

/** Bottom to top, so Good sits on top — matching the flow and runway charts. */
const STACK = ['Poor', 'Average', 'Good'] as const;

/**
 * The book's health month by month, read from each account's `history`.
 *
 * This used to invent its own numbers: a `baseTotal = 20 + i * 15` ramp times a
 * fixed 50/35/15 split, which drew the same up-and-to-the-right curve whatever
 * the data said. Its own comment gave the reason — the mock carried three
 * months of history, not twelve. It carries twelve now, so the chart reads it.
 *
 * Counts states, not moves. The Movement tab's flow chart is the companion to
 * this: a month where nine accounts fell and nine recovered looks identical
 * here and completely different there.
 */
export function HealthChangeOverTimeStacked({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(
    () =>
      buildFlow(data).months.map((m) => ({
        name: m.short,
        full: m.label,
        Good: m.counts.Good,
        Average: m.counts.Average,
        Poor: m.counts.Poor,
        total: m.total,
      })),
    [data],
  );

  return (
    <div className="w-full h-full p-6 flex flex-col mt-4 border-t border-line-subtle">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h3 className="text-[13px] font-bold text-ink">Account Health Change Over Time (Monthly)</h3>
        <span className="text-[11px] text-ink-faint">
          {chartData.length} month{chartData.length === 1 ? '' : 's'} of recorded history
        </span>
      </div>

      <div className="flex-1 w-full relative min-h-[160px]">
        {chartData.length === 0 ? (
          <p className="text-[12px] text-ink-faint">No health history for the current selection.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }} barSize={28}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--bg-subtle)' }}
                // The axis is shortened to a month name so twelve of them fit;
                // the tooltip restores the month-end date they stand for.
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ''}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
              />

              {/* No total label: every account carries every month, so the
                  total is identical on all twelve bars whatever the filter.
                  The stacked split is what changes. */}
              {STACK.map((status) => (
                <Bar {...STATIC_SERIES} key={status} dataKey={status} stackId="health" fill={STATUS_COLORS[status]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
