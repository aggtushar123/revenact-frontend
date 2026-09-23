import type { ReactNode } from 'react';

const FIGURE_TONE = {
  neutral: 'text-ink',
  loss: 'text-danger',
  gain: 'text-success',
} as const;

/** One headline number. Colour is reserved for a figure that *means* loss or
 *  gain; everything else is ink. Replaces the six local `Tile`s, which tinted
 *  a left border by tone and so coloured numbers that meant nothing. */
export function Kpi({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: keyof typeof FIGURE_TONE;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</div>
      <div className={`font-mono-brand tabular-nums text-[22px] leading-tight mt-1 ${FIGURE_TONE[tone]}`}>
        {value}
      </div>
      {detail && <div className="text-[11px] text-ink-muted mt-0.5">{detail}</div>}
    </div>
  );
}

/** Four across from `md`, two below, separated by hairlines rather than boxes. */
export function KpiStrip({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <ul className="grid grid-cols-2 md:grid-cols-4 gap-y-4 bg-surface border border-line rounded-xl p-4 md:divide-x md:divide-line">
      {items.map((child, i) => (
        <li key={i} className="md:px-4 md:first:pl-0">
          {child}
        </li>
      ))}
    </ul>
  );
}
