import type { HealthStatus } from '../../../features/health/types';

/** The three health bars, bottom to top, as every stacked chart here orders them. */
export const HEALTH_STACK: HealthStatus[] = ['Poor', 'Average', 'Good'];

export interface StackedDatum {
  Good: number;
  Average: number;
  Poor: number;
  total: number;
}

/** The highest segment that actually has accounts in it, or undefined if empty. */
export function topSegment(datum: StackedDatum): HealthStatus | undefined {
  for (let i = HEALTH_STACK.length - 1; i >= 0; i--) {
    if (datum[HEALTH_STACK[i]] > 0) return HEALTH_STACK[i];
  }
  return undefined;
}

/** What recharts hands a LabelList `content` renderer for one data point. */
interface LabelContentProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  index?: number;
}

/**
 * A total drawn above a stacked bar, on whichever segment is actually on top.
 *
 * Attaching a `LabelList` to one fixed series — the natural reading of "put the
 * total on the last bar" — drops the label on every row where that series is
 * zero. On a health chart that silently hides the total for exactly the months
 * with no healthy accounts, which are the ones worth reading.
 *
 * So each series gets one of these, and only the topmost non-empty one draws.
 */
export function makeStackedTotalLabel<T extends StackedDatum>(
  status: HealthStatus,
  data: T[],
  fontSize = 10,
) {
  return function StackedTotalLabel({ x = 0, y = 0, width = 0, index = 0 }: LabelContentProps) {
    const datum = data[index];
    if (!datum || datum.total === 0 || topSegment(datum) !== status) return null;

    return (
      <text
        x={Number(x) + Number(width) / 2}
        y={Number(y) - 6}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill="var(--text-secondary)"
      >
        {datum.total}
      </text>
    );
  };
}
