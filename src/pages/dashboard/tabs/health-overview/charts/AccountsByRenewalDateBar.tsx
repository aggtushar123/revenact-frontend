import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import type { HealthDataRow } from '../mockData';
import { renewalMonths } from '../movement';
import { HEALTH_STACK, makeStackedTotalLabel } from './stackedTotalLabel';

const STATUS_COLORS = {
  Poor: 'var(--danger)',
  Average: 'var(--warning)',
  Good: 'var(--success)',
};

/**
 * When the book comes up for renewal, and what state each account is in.
 *
 * This used to ignore `renewalDate` entirely: it listed twenty hardcoded months
 * from Mar 2026 to Jan 2028 and filled them from a fixed `randomVals` array
 * scaled by how many rows were selected, plus a flat "benchmark" line that
 * measured nothing. The field it is named after was never read.
 *
 * The benchmark line is gone rather than reimplemented — there is no target
 * renewal count in the data to draw one from, and a line with nothing behind it
 * is what this chart is being fixed for.
 */
export function AccountsByRenewalDateBar({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(
    () =>
      renewalMonths(data).map((m) => ({
        name: m.short,
        full: m.label,
        Good: m.counts.Good,
        Average: m.counts.Average,
        Poor: m.counts.Poor,
        total: m.total,
      })),
    [data],
  );

  const busiest = useMemo(
    () => chartData.reduce<(typeof chartData)[number] | null>(
      (peak, m) => (peak === null || m.total > peak.total ? m : peak),
      null,
    ),
    [chartData],
  );

  return (
    <div className="w-full h-[280px] p-6 flex flex-col">
      <div className="flex items-baseline justify-between gap-3 mb-6">
        <h3 className="text-[13px] font-bold text-ink">Accounts by Renewal Date (Monthly)</h3>
        {busiest && busiest.total > 0 && (
          <span className="text-[11px] text-ink-faint">
            Busiest: {busiest.full} · {busiest.total} renewing
          </span>
        )}
      </div>

      <div className="flex-1 w-full relative">
        {chartData.length === 0 ? (
          <p className="text-[12px] text-ink-faint">
            No readable renewal dates for the current selection.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {/* Rotated labels need real bottom margin or they render clipped. */}
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 26 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10, angle: -45, textAnchor: 'end' }}
                padding={{ left: 12, right: 12 }}
                dy={6}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'var(--bg-subtle)' }}
                // The axis is abbreviated to fit; the tooltip spells the month out.
                labelFormatter={(_, payload) => payload?.[0]?.payload?.full ?? ''}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
              />

              {HEALTH_STACK.map((status) => (
                <Bar
                  key={status}
                  dataKey={status}
                  stackId="renewal"
                  fill={STATUS_COLORS[status]}
                  barSize={24}
                >
                  <LabelList content={makeStackedTotalLabel(status, chartData)} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
