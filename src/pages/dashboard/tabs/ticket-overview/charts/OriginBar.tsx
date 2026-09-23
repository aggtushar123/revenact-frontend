import { useMemo } from 'react';
import { BarChart, Bar, LabelList, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TicketOrigin } from '../../../../../features/tickets/ticketsSlice';
import { niceMax } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { ROLE, TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';

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
export function OriginBar({ data }: { data: TicketOrigin[] }) {
  // Biggest first. The API's order is the connector's, which is not a ranking.
  const ranked = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);
  // Computed, not hard-coded: the mock's domain={[0, 400]} silently
  // clipped any bar above 400.
  const max = niceMax(ranked.map((d) => d.value));

  return (
    <div className="w-full h-[280px] p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13px] font-bold text-ink">Tickets By Origin</h3>
      </div>

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
              <Bar {...STATIC_SERIES} dataKey="value" fill={ROLE.ink} radius={[0, 2, 2, 0]}>
                <LabelList
                  dataKey="value"
                  position="right"
                  fill="var(--text-secondary)"
                  fontSize={11}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
