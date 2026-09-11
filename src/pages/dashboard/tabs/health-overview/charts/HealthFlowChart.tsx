import { useMemo } from 'react';
import type { HealthStatus } from '../mockData';
import { STACK_ORDER } from '../movement';
import type { Flow } from '../movement';

const STATUS_COLORS: Record<HealthStatus, string> = {
  Poor: 'var(--danger)',
  Average: 'var(--warning)',
  Good: 'var(--success)',
};

// Geometry, in viewBox units. The viewBox is a fixed size and the SVG scales
// to its container, so the column pitch is derived from the month count rather
// than fixed: the chart fills the card at any window length, and the rendered
// height stays proportional instead of ballooning on a wide screen.
const VIEW_W = 960;
const PAD = { top: 26, right: 46, bottom: 28, left: 10 };
const COL_W = 13;
const PLOT_H = 250;
/** Blank space between the stacked segments of one column. */
const SEGMENT_GAP = 7;

/** Ribbons for accounts that stayed put recede; the ones that moved carry. */
const HELD_OPACITY = 0.14;
const MOVED_OPACITY = 0.5;

export interface HealthFlowChartProps {
  flow: Flow;
}

interface Segment {
  y: number;
  h: number;
}

/**
 * Accounts flowing between health states, month by month.
 *
 * This is the one chart on the screen that counts *transitions* rather than
 * states. `HealthChangeOverTimeStacked` already shows the totals per month;
 * totals hide churn, because a month where nine accounts fell and nine
 * recovered looks identical to a month where nothing happened.
 *
 * Drawn by hand rather than with recharts: its Sankey is a node-link diagram
 * with no notion of the same category recurring along a time axis, which is
 * exactly what this needs.
 */
export function HealthFlowChart({ flow }: HealthFlowChartProps) {
  const { months, steps } = flow;

  const layout = useMemo(() => {
    if (months.length === 0) return null;

    // Scale against the busiest month so the tallest column just fills the plot.
    const peak = Math.max(...months.map((m) => m.total), 1);
    const usable = PLOT_H - SEGMENT_GAP * (STACK_ORDER.length - 1);
    const heightOf = (count: number) => (count / peak) * usable;

    // Spread the columns evenly across the fixed viewBox width.
    const span = VIEW_W - PAD.left - COL_W - PAD.right;
    const pitch = months.length > 1 ? span / (months.length - 1) : 0;

    const columns = months.map((month, i) => {
      const x = PAD.left + i * pitch;
      const segments = {} as Record<HealthStatus, Segment>;
      let y = PAD.top;
      for (const status of STACK_ORDER) {
        const h = heightOf(month.counts[status]);
        segments[status] = { y, h };
        // Only spend a gap after a segment that actually drew something.
        y += h + (month.counts[status] > 0 ? SEGMENT_GAP : 0);
      }
      return { month, x, segments };
    });

    // Ribbons leave a column in stacking order and arrive in stacking order,
    // so they nest instead of crossing where they don't have to.
    const ribbons = steps.map((step, i) => {
      const left = columns[i];
      const right = columns[i + 1];
      const outCursor = {} as Record<HealthStatus, number>;
      const inCursor = {} as Record<HealthStatus, number>;

      return step.map((t) => {
        const h = heightOf(t.count);
        const y0 = (outCursor[t.from] ??= left.segments[t.from].y);
        const y1 = (inCursor[t.to] ??= right.segments[t.to].y);
        outCursor[t.from] += h;
        inCursor[t.to] += h;

        const x0 = left.x + COL_W;
        const x1 = right.x;
        const mid = (x0 + x1) / 2;
        const d =
          `M${x0},${y0} C${mid},${y0} ${mid},${y1} ${x1},${y1} ` +
          `L${x1},${y1 + h} C${mid},${y1 + h} ${mid},${y0 + h} ${x0},${y0 + h} Z`;

        return { t, d, key: `${i}-${t.from}-${t.to}` };
      });
    });

    return { columns, ribbons, width: VIEW_W, height: PAD.top + PLOT_H + PAD.bottom };
  }, [months, steps]);

  if (!layout) {
    return (
      <p className="px-4 py-8 text-center text-[12px] text-ink-faint">
        No health history recorded for these accounts.
      </p>
    );
  }

  const { columns, ribbons, width, height } = layout;
  const last = columns[columns.length - 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="block w-full h-auto"
        role="img"
        aria-label={
          `Health state flow across ${months.length} months, ` +
          `${flow.tracked} accounts. Ribbon width is the number of accounts moving.`
        }
      >
        {/* Ribbons first so the columns read as solid edges on top of them. */}
        {ribbons.flat().map(({ t, d, key }) => (
          <path
            key={key}
            d={d}
            fill={STATUS_COLORS[t.direction === 'held' ? t.from : t.to]}
            fillOpacity={t.direction === 'held' ? HELD_OPACITY : MOVED_OPACITY}
          >
            <title>
              {`${t.count} account${t.count === 1 ? '' : 's'}: ${t.from} → ${t.to}`}
            </title>
          </path>
        ))}

        {columns.map(({ month, x, segments }) =>
          STACK_ORDER.map((status) =>
            month.counts[status] > 0 ? (
              <rect
                key={`${month.label}-${status}`}
                x={x}
                y={segments[status].y}
                width={COL_W}
                height={segments[status].h}
                rx={3}
                fill={STATUS_COLORS[status]}
              >
                <title>{`${month.short}: ${month.counts[status]} ${status}`}</title>
              </rect>
            ) : null,
          ),
        )}

        {/* Month labels along the bottom. */}
        {columns.map(({ month, x }) => (
          <text
            key={`label-${month.label}`}
            x={x + COL_W / 2}
            y={PAD.top + PLOT_H + 18}
            textAnchor="middle"
            fontSize={10}
            fill="var(--text-tertiary)"
          >
            {month.short}
          </text>
        ))}

        {/* Only the final column is annotated with counts — repeating them on
            every month would bury the ribbons the chart exists to show. */}
        {STACK_ORDER.map((status) =>
          last.month.counts[status] > 0 ? (
            <g key={`final-${status}`}>
              <text
                x={last.x + COL_W + 7}
                y={last.segments[status].y + last.segments[status].h / 2 + 3}
                fontSize={11.5}
                fontWeight={700}
                fill="var(--text-primary)"
              >
                {last.month.counts[status]}
              </text>
              <text
                x={last.x + COL_W + 7}
                y={last.segments[status].y + last.segments[status].h / 2 + 15}
                fontSize={9}
                fill="var(--text-tertiary)"
              >
                {status}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}
