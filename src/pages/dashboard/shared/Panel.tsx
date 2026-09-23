import type { ReactNode } from 'react';

/** The one container on the dashboard. Never nest one inside another: group
 *  inside a panel with `divide-y` or whitespace instead. */
export function Panel({
  title,
  action,
  className = '',
  children,
}: {
  title?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`bg-surface border border-line rounded-xl p-4 ${className}`}>
      {(title || action) && (
        <header className="flex items-baseline justify-between gap-3 mb-3">
          {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
