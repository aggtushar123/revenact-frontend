import { useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow, HealthStatus } from '../mockData';
import { pulseBuckets } from '../controls';
import type { PulseBucket } from '../controls';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { fromHealthRows } from '../../../drill/rows';
import { DrillTargets } from '../../../drill/DrillTargets';

export function AIPulseBar({ data }: { data: HealthDataRow[] }) {
  const { open } = useDrill();
  const buckets = useMemo(() => pulseBuckets(data, 'aiPulseScore'), [data]);
  const chartData = useMemo(
    () =>
      buckets.map((b) => ({
        score: String(b.score),
        Poor: b.counts.Poor,
        Average: b.counts.Average,
        Good: b.counts.Good,
        total: b.total,
      })),
    [buckets],
  );

  const openSegment = (bucket: PulseBucket, status: HealthStatus, trigger?: HTMLElement) => {
    const picked = bucket.rows[status];
    open(
      {
        title: `AI Pulse ${bucket.score} · ${status}`,
        figure: String(picked.length),
        source: { kind: 'rows', rows: fromHealthRows(picked) },
      },
      trigger,
    );
  };

  const HEALTH_STACK: HealthStatus[] = ['Poor', 'Average', 'Good'];
  const drillItems = buckets.flatMap((bucket) =>
    HEALTH_STACK.filter((status) => bucket.rows[status].length > 0).map((status) => ({
      name: `AI Pulse ${bucket.score} · ${status}`,
      figure: String(bucket.rows[status].length),
      onSelect: (trigger: HTMLElement) => openSegment(bucket, status, trigger),
    })),
  );

  return (
    <div className="w-full h-full p-4 flex flex-col relative h-[140px]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[13px] font-bold text-ink">AI Pulse Score</h3>
      </div>

      <DrillTargets label="AI Pulse Score" items={drillItems} />

      <div className="flex-1 w-full mt-2 relative min-h-[90px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: -25, bottom: -5 }}
            barSize={24}
          >
            <XAxis
              dataKey="score"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
              dy={5}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              contentStyle={TOOLTIP_STYLE}
            />

            <Bar
              {...STATIC_SERIES}
              dataKey="Poor"
              stackId="a"
              fill="var(--danger)"
              label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }}
              cursor="pointer"
              onClick={(_, index) => openSegment(buckets[index], 'Poor')}
            />
            <Bar
              {...STATIC_SERIES}
              dataKey="Average"
              stackId="a"
              fill="var(--warning)"
              label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }}
              cursor="pointer"
              onClick={(_, index) => openSegment(buckets[index], 'Average')}
            />
            <Bar
              {...STATIC_SERIES}
              dataKey="Good"
              stackId="a"
              fill="var(--success)"
              label={{ position: 'top', fill: 'var(--text-secondary)', fontSize: 10 }}
              cursor="pointer"
              onClick={(_, index) => openSegment(buckets[index], 'Good')}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
