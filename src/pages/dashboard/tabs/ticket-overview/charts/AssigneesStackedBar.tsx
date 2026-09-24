import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TicketAssigneeRow } from '../../../../../features/tickets/ticketsSlice';
import { STATUS_COLORS, STATUS_ORDER, FALLBACK_COLOR, niceMax } from '../chartTheme';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { ROLE, TOOLTIP_STYLE, CURSOR_FILL } from '../../../shared/chartPalette';
import { useDrill } from '../../../drill/useDrill';
import { DrillTargets } from '../../../drill/DrillTargets';

const PATH = '/tickets/stats/';

// Which text colour (if any) clears 4.5:1 against a segment's own fill in
// BOTH light and dark mode — computed from the literal token values in
// src/index.css (see the task-9 fix report for the full contrast table).
// A theme-adaptive token like `var(--color-on-accent)` or `var(--text-
// primary)` resolves to a different literal colour per theme, so "clears
// 4.5:1 in both" has to be checked per token, not assumed:
//   Open (ink bg):          on-accent → 18.4:1 light / 17.8:1 dark  ✅
//   In Progress (muted bg): on-accent →  5.2:1 light /  7.7:1 dark  ✅
//   On Hold (faint bg):     ink       →  6.8:1 light /  4.4:1 dark  ❌ (dark just misses)
//                           on-accent →  2.7:1 light /  4.1:1 dark  ❌
//   Resolved (gain bg):     ink       →  7.3:1 light /  2.3:1 dark  ❌
//                           on-accent →  2.5:1 light /  7.7:1 dark  ❌
//   Closed (gainSoft bg):   ink       → 12.0:1 light /  7.1:1 dark  ✅
// `--success` isn't redefined for dark mode, so a green bar is exactly as
// light or dark in both themes — there is no adaptive token that reads as
// "dark text" in light mode AND "dark text" in dark mode at once, so
// `Resolved` has no safe in-segment colour. `On Hold` misses by a hair in
// dark mode. Both are omitted rather than shipped under 4.5:1; the legend
// below and the tooltip still carry every status's count.
const LABEL_FILL: Partial<Record<string, string>> = {
  Open: 'var(--color-on-accent)',
  'In Progress': 'var(--color-on-accent)',
  Closed: ROLE.ink,
};

export function AssigneesStackedBar({
  data,
  query,
  drillable = true,
}: {
  data: TicketAssigneeRow[];
  query: string;
  /** False while the view refetches: the figures on screen are the old
   *  ones, but a drill would send the new query, so nothing opens. */
  drillable?: boolean;
}) {
  const { open } = useDrill();
  // The mock's domain={[0, 80]} clipped any assignee past 80 tickets.
  const max = niceMax(data.map((d) => d.total));

  // A blank assignee name is a real group (an unassigned ticket), but the
  // backend's `assignee:<name>` drill needs a non-empty value — an empty
  // one isn't a real choice, and `parse_segment` ignores it the same way it
  // ignores every other malformed filter. So this bar alone gets no click,
  // no cursor and no keyboard target.
  // An empty bucket has no accounts behind it, so it offers no drill.
  const canDrill = (row: TicketAssigneeRow) => drillable && row.total > 0 && Boolean(row.name);
  const openSegment = (row: TicketAssigneeRow, trigger?: HTMLElement) => {
    if (!canDrill(row)) return;
    open(
      {
        title: row.name,
        figure: String(row.total),
        source: { kind: 'server', path: PATH, query, segment: `assignee:${row.name}` },
      },
      trigger,
    );
  };

  const drillItems = data
    .filter(canDrill)
    .map((row) => ({
      name: row.name,
      figure: String(row.total),
      onSelect: (trigger: HTMLElement) => openSegment(row, trigger),
    }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, payload, dataKey } = props;
    const nx = Number(x) || 0;
    const ny = Number(y) || 0;
    const nw = Number(width) || 0;
    const nh = Number(height) || 0;

    const nVal = payload && dataKey ? Number(payload[dataKey]) : 0;

    if (!nVal || nVal <= 0) return null;
    if (nw < 20) return null; // hide label if slice is too thin

    const fill = LABEL_FILL[dataKey as string];
    if (!fill) return null; // no colour clears 4.5:1 in both themes — see LABEL_FILL above
    return (
      <text x={nx + nw / 2} y={ny + nh / 2} fill={fill} fontSize={10} fontWeight={600} textAnchor="middle" dy={4}>
        {nVal}
      </text>
    );
  };

  return (
    <div className="w-full h-full p-4 flex flex-col bg-surface border border-line-subtle rounded-lg shadow-sm h-[320px]">
      <div className="flex flex-col mb-4">
        <h3 className="text-[13px] font-bold text-ink">Ticket Assignees by Ticket Status</h3>
      </div>

      <DrillTargets label="Ticket Assignees by Ticket Status" items={drillItems} />

      <div className="flex-1 w-full relative -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
            barSize={16}
            barGap={0}
          >
            <XAxis type="number" hide domain={[0, max]} />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              width={110}
              tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: CURSOR_FILL }}
              contentStyle={TOOLTIP_STYLE}
            />
            {/* Colour alone no longer carries the five statuses — two of the
                five (On Hold, Resolved) also lost their in-segment count
                label above, because no text colour clears 4.5:1 against
                their fill in both themes (see LABEL_FILL). */}
            <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: 11 }} />

            {/* Total Label Hack: Invisible un-stacked bar reaching the row end */}
            <Bar {...STATIC_SERIES}
              dataKey="total"
              fill="transparent"
              legendType="none"
              label={{ position: 'right', fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, dx: 5 }}
            />

            {/* One segment per real status, in ticket-lifecycle order —
                the mock hard-coded Zendesk's own six status names. `name`
                is what the legend above reads its labels from. */}
            {STATUS_ORDER.map((statusLabel) => (
              <Bar
                key={statusLabel}
                {...STATIC_SERIES}
                dataKey={statusLabel}
                name={statusLabel}
                stackId="a"
                fill={STATUS_COLORS[statusLabel] ?? FALLBACK_COLOR}
                label={renderCustomBarLabel}
              >
                {/* Every status segment of a row opens the same drill — the
                    whole bar is one assignee, not five. Cells carry no `fill`
                    of their own, so the Bar's own colour (and the legend
                    swatch, which reads it) are unaffected; the blank-assignee
                    row alone gets no cursor and no click — see `openSegment`. */}
                {data.map((row, index) => (
                  <Cell
                    key={row.name || `blank-${index}`}
                    cursor={canDrill(row) ? 'pointer' : undefined}
                    onClick={canDrill(row) ? () => openSegment(row) : undefined}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
