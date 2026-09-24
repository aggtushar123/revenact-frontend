import { useMemo } from 'react';

import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthDataRow, HealthStatus } from '../mockData';
import { HEALTH_ORDER, healthByOwner } from '../controls';
import type { OwnerHealth } from '../controls';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { fromHealthRows } from '../../../drill/rows';
import { DrillTargets } from '../../../drill/DrillTargets';

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
export function HealthByOwnerStackedBar({
  data,
  drillable = true,
}: {
  data: HealthDataRow[];
  /** False when `data` is a truncated book — a drill from it would only ever
   *  show some of the accounts a segment counted. Defaults to `true` so
   *  every existing caller (and test) keeps drilling. */
  drillable?: boolean;
}) {
  const { open } = useDrill();
  const chartData = useMemo(() => healthByOwner(data), [data]);

  const widest = Math.max(1, ...chartData.map((row) => row.total));

  // Two owners can share a display name — `healthByOwner` now groups by
  // `ownerKey`, not the label — so the drill target's name has to
  // disambiguate them too, or two distinct entries collapse into one
  // identically-labelled button.
  const duplicateNames = new Set(
    [...new Set(chartData.map((row) => row.owner))].filter(
      (name) => chartData.filter((row) => row.owner === name).length > 1,
    ),
  );
  const labelFor = (owner: OwnerHealth) =>
    duplicateNames.has(owner.owner) ? `${owner.owner} (${owner.ownerKey})` : owner.owner;

  const openSegment = (owner: OwnerHealth, status: HealthStatus, trigger?: HTMLElement) => {
    const picked = owner.rows[status];
    open(
      {
        title: `${labelFor(owner)} · ${status}`,
        figure: String(picked.length),
        source: { kind: 'rows', rows: fromHealthRows(picked) },
      },
      trigger,
    );
  };

  // One button per owner × status that actually has an account in it — a
  // keyboard user (and this chart's own test) can't reach a recharts <Bar>'s
  // SVG segments, so this is the real drill target; the Bar's own onClick
  // below is the pointer shortcut to the same thing. None at all when the
  // book is truncated — see `drillable`.
  const drillItems = drillable
    ? chartData.flatMap((owner) =>
        HEALTH_ORDER.filter((status) => owner.rows[status].length > 0).map((status) => ({
          name: `${labelFor(owner)} · ${status}`,
          figure: String(owner.rows[status].length),
          onSelect: (trigger: HTMLElement) => openSegment(owner, status, trigger),
        })),
      )
    : [];

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

      <DrillTargets label="Health By Owner" items={drillItems} />

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
                cursor={{ fill: CURSOR_FILL }}
                contentStyle={TOOLTIP_STYLE}
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
                  cursor={drillable ? 'pointer' : undefined}
                  onClick={
                    drillable ? (_, dataIndex) => openSegment(chartData[dataIndex], status) : undefined
                  }
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
