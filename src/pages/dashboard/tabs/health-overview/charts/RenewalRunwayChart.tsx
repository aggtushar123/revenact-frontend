import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import type { HealthStatus } from '../mockData';
import type { RenewalBucket } from '../movement';
import { HEALTH_STACK, makeStackedTotalLabel } from './stackedTotalLabel';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { useDrill } from '../../../drill/useDrill';
import { fromHealthRows } from '../../../drill/rows';
import { DrillTargets } from '../../../drill/DrillTargets';

const STATUS_COLORS: Record<HealthStatus, string> = {
  Poor: 'var(--danger)',
  Average: 'var(--warning)',
  Good: 'var(--success)',
};

export interface RenewalRunwayChartProps {
  buckets: RenewalBucket[];
}

/**
 * What is coming up for renewal, and what state it is in.
 *
 * Buckets by days remaining, which is the "what do I have to act on" cut. The
 * Controls tab's `AccountsByRenewalDateBar` reads the same `renewalDate` field
 * but groups by calendar month, for planning rather than triage.
 */
export function RenewalRunwayChart({ buckets }: RenewalRunwayChartProps) {
  const { open } = useDrill();

  const data = useMemo(
    () =>
      buckets.map((b) => ({
        name: b.label,
        Good: b.counts.Good,
        Average: b.counts.Average,
        Poor: b.counts.Poor,
        total: b.total,
        atRisk: b.atRisk,
      })),
    [buckets],
  );

  const soonest = buckets[0];

  const openSegment = (bucket: RenewalBucket, status: HealthStatus, trigger?: HTMLElement) => {
    const picked = bucket.rows[status];
    open(
      {
        title: `${bucket.label} · ${status}`,
        figure: String(picked.length),
        source: { kind: 'rows', rows: fromHealthRows(picked) },
      },
      trigger,
    );
  };

  // One button per bucket × status that actually has an account in it — a
  // keyboard user (and this chart's own test) can't reach a recharts <Bar>'s
  // SVG segments, so this is the real drill target; the Bar's own onClick
  // below is the pointer shortcut to the same thing.
  const drillItems = buckets.flatMap((bucket) =>
    HEALTH_STACK.filter((status) => bucket.counts[status] > 0).map((status) => ({
      name: `${bucket.label} · ${status}`,
      figure: String(bucket.counts[status]),
      onSelect: (trigger: HTMLElement) => openSegment(bucket, status, trigger),
    })),
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">Renewal runway</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            Accounts by days to renewal, coloured by current health
          </p>
        </div>
        {soonest && soonest.atRisk > 0 && (
          <p className="text-[11px] font-bold text-danger shrink-0">
            {soonest.atRisk} not at Good within {soonest.to} days
          </p>
        )}
      </div>

      <DrillTargets label="Renewal runway" items={drillItems} />

      <div className="flex-1 w-full min-h-0 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 12, left: -22, bottom: 4 }} barSize={54}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'var(--bg-subtle)' }}
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
                {...STATIC_SERIES}
                key={status}
                dataKey={status}
                stackId="renewal"
                fill={STATUS_COLORS[status]}
                onClick={(_, index) => openSegment(buckets[index], status)}
              >
                <LabelList content={makeStackedTotalLabel(status, data, 11)} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
