import type { ReactNode } from 'react';
import { Panel } from './Panel';
import { CHART_HEIGHT } from './chartPalette';

/**
 * The card every dashboard chart sits in: `Panel` chrome, a sentence-case
 * title, an optional subtitle, action, legend and footer, and a plot area of
 * a definite height so `<ResponsiveContainer height="100%">` always resolves.
 *
 * `height` is the plot area's height (a `CHART_HEIGHT` size or a number, e.g.
 * from `barListHeight`); header, legend and footer sit around it. `drill`
 * takes `DrillTargets`: the card is `relative`, so the targets overlay its top
 * edge when focused and never take height from the plot.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  legend,
  footer,
  drill,
  height = 'md',
  className = '',
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  legend?: ReactNode;
  footer?: ReactNode;
  drill?: ReactNode;
  height?: keyof typeof CHART_HEIGHT | number;
  className?: string;
  children: ReactNode;
}) {
  const plotHeight = typeof height === 'number' ? height : CHART_HEIGHT[height];
  return (
    <Panel className={`relative flex flex-col ${className}`}>
      {drill}
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[12px] text-ink-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
      {legend && <div className="mb-3">{legend}</div>}
      <div className="relative w-full min-w-0" style={{ height: plotHeight }}>
        {children}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </Panel>
  );
}
