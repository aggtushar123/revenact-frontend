import { useMemo } from 'react';
import { BarChart, Bar, Cell, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketOrigin } from '../../../../../features/tickets/ticketsSlice';
import { niceMax } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { ROLE, TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { DrillTargets } from '../../../drill/DrillTargets';

const PATH = '/tickets/stats/';

/**
 * Where the tickets come from, ranked.
 *
 * Horizontal, like the assignee chart beside it, because the categories are
 * names. Vertically this card is ~250px wide across five origins, and a
 * vertical axis had no room for "Freshdesk" or "Salesforce": Recharts drops
 * labels that don't fit rather than overlapping them, so the chart was showing
 * five bars with two names — and it gave no sign that the other three had been
 * dropped.
 *
 * Counts ride at the end of each bar instead of on an axis, which is what the
 * five numbers are actually for: a 5-ticket origin is a sliver, and the figure
 * beside it is the only way to read it.
 */
export function OriginBar({
  data,
  query,
  drillable = true,
}: {
  data: TicketOrigin[];
  query: string;
  /** False while the view refetches: the figures on screen are the old
   *  ones, but a drill would send the new query, so nothing opens. */
  drillable?: boolean;
}) {
  const { open } = useDrill();
  // Biggest first. The API's order is the connector's, which is not a ranking.
  const ranked = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  // Computed, not hard-coded: the mock's domain={[0, 400]} silently
  // clipped any bar above 400.
  const max = niceMax(ranked.map((d) => d.value));

  const openSegment = (row: TicketOrigin, trigger?: HTMLElement) => {
    const segment = row.connector_id === null ? 'origin:none' : `origin:${row.connector_id}`;
    open(
      {
        title: row.name,
        figure: String(row.value),
        source: { kind: 'server', path: PATH, query, segment },
      },
      trigger,
    );
  };

  // Every origin drills, including the null-connector "Revenact" bucket —
  // the backend's own `origin:none` segment.
  const drillItems = (drillable ? ranked : []).map((row) => ({
    name: row.name,
    figure: String(row.value),
    onSelect: (trigger: HTMLElement) => openSegment(row, trigger),
  }));

  return (
    <div className="w-full h-[280px] p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-bold text-ink">Tickets By Origin</h3>
      </div>

      <DrillTargets label="Tickets By Origin" items={drillItems} />

      <div className="flex-1 w-full min-h-[200px] relative -ml-4">
        {ranked.length === 0 ? (
          <p className="text-[12px] text-ink-faint">No tickets match these filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={ranked}
              margin={{ top: 0, right: 34, left: 6, bottom: 0 }}
              barSize={16}
            >
              <XAxis type="number" hide domain={[0, max]} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                // 78, not the assignee chart's 110: that card is three times
                // as wide. Here the name column was taking more of the card
                // than the bars, so the largest origin drew 30px.
                width={78}
                tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: CURSOR_FILL }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [
                  `${value} ${Number(value) === 1 ? 'ticket' : 'tickets'}`,
                  'Origin',
                ]}
              />
              <Bar {...STATIC_SERIES} dataKey="value" radius={[0, 2, 2, 0]}>
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="var(--text-secondary)"
                  fontSize={11}
                  fontWeight={600}
                />
                {ranked.map((row) => (
                  <Cell
                    key={row.connector_id ?? 'none'}
                    fill={ROLE.ink}
                    cursor={drillable ? 'pointer' : undefined}
                    onClick={drillable ? () => openSegment(row) : undefined}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
