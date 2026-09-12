import { useMemo } from 'react';

import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow, HealthStatus } from '../mockData';
import { HEALTH_ORDER, healthByOwner } from '../controls';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

const STATUS_COLORS: Record<HealthStatus, string> = {
  Poor: 'var(--danger)',
  Average: 'var(--warning)',
  Good: 'var(--success)',
};

/**
 * Who is carrying the sick accounts.
 *
 * The grouping and the ordering live in `controls.healthByOwner` — including
 * the argument for counting accounts rather than reporting a share of each
 * book. This file is the drawing.
 */
export function HealthByOwnerStackedBar({ data }: { data: HealthDataRow[] }) {
  const chartData = useMemo(() => healthByOwner(data), [data]);

  const widest = Math.max(1, ...chartData.map((row) => row.total));

  return (
    <div className="w-full h-full p-4 flex flex-col relative h-[300px]">
      <div className="flex flex-col mb-4">
        <h3 className="text-[13px] font-bold text-ink mb-1">Health By Owner</h3>
        <p className="text-[11px] text-ink-faint mb-2">
          Accounts per owner, stacked by health · worst book first
        </p>
        <div className="flex items-center gap-4">
          {HEALTH_ORDER.map((status) => (
            <div key={status} className="flex items-center gap-1.5 opacity-90">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <span className="text-[11px] font-medium text-ink-muted">{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[220px]">
        {chartData.length === 0 ? (
          <p className="text-[12px] text-ink-faint">No accounts match these filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 30, left: 10, bottom: 5 }}
              barSize={20}
            >
              <XAxis type="number" hide domain={[0, widest]} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="owner"
                axisLine={false}
                tickLine={false}
                width={100}
                tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 8px 24px rgb(0 0 0 / 0.4)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
                formatter={(value, name) => [
                  `${value} ${Number(value) === 1 ? 'account' : 'accounts'}`,
                  name,
                ]}
              />

              {HEALTH_ORDER.map((status, index) => (
                <Bar
                  key={status}
                  {...STATIC_SERIES}
                  dataKey={status}
                  stackId="a"
                  fill={STATUS_COLORS[status]}
                >
                  {/* The book size rides outside the end of the bar, not
                      inside the slices: on a real book most owners hold one or
                      two accounts per health band, and no label fits in a 6px
                      slice. Only the last segment carries it. */}
                  {index === HEALTH_ORDER.length - 1 && (
                    <LabelList
                      dataKey="total"
                      position="right"
                      fill="var(--text-secondary)"
                      fontSize={11}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
