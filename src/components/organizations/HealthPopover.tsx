import React from 'react';
import type { HealthComponent } from '../../features/customers/customersSlice';

interface HealthPopoverProps {
  /** The overall score, 0-10. */
  val: number;
  /** The five components behind `val`, straight from the API. The `points` of
   *  the available ones sum to `val`. */
  breakdown: HealthComponent[];
  /** True when someone pinned the score by hand, so the components below are
   *  what the rubric *would* have said rather than what produced this number. */
  isOverridden?: boolean;
  style: React.CSSProperties;
}

function toneFor(ratio: number) {
  if (ratio >= 0.7) return { color: 'var(--success)', bg: 'var(--success-dim)', badge: 'Good' };
  if (ratio >= 0.4) return { color: 'var(--warning)', bg: 'var(--warning-dim)', badge: 'Average' };
  return { color: 'var(--danger)', bg: 'var(--danger-dim)', badge: 'Poor' };
}

/**
 * What the health score is made of.
 *
 * Every row is read from `health_breakdown`. This used to invent its five rows
 * by branching on the score itself — so the parts were derived from the total
 * rather than the total from the parts, and they never added up to it (a 7.0
 * showed components summing to 8.3). The backend calculates the score from
 * these components now, so the arithmetic reconciles by construction.
 */
export function HealthPopover({ val, breakdown, isOverridden = false, style }: HealthPopoverProps) {
  const main = toneFor(val / 10);
  // A component with no data is left out of the score and the rest are marked
  // out of what remains — so the rows below deliberately total less than the
  // headline. Saying nothing would look like the arithmetic was simply wrong.
  const unmeasured = breakdown.filter((c) => !c.available).length;

  return (
    <div
      style={style}
      className="fixed z-[100] w-[380px] bg-elevated rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-line-strong p-5 text-[12px] text-ink-muted pointer-events-none transition-opacity duration-200"
    >
      {/* Tooltip Arrow pointing down */}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-elevated border-b border-r border-line-strong transform rotate-45"></div>

      <div className="flex flex-col gap-3.5 relative z-10 bg-elevated">
        <div className="flex items-center justify-between mb-1 font-bold text-ink">
          <div className="w-[140px] truncate pr-2">Overall health score</div>
          <div className="flex-1 h-[6px] bg-subtle rounded-full overflow-hidden flex mx-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, (val / 10) * 100)}%`, backgroundColor: main.color }}
            />
          </div>
          <div className="w-[50px] text-center ml-1">
            <span
              className="px-2 py-[2px] rounded-md font-bold text-[10px]"
              style={{ backgroundColor: main.bg, color: main.color }}
            >
              {main.badge}
            </span>
          </div>
          <div className="w-[45px] text-right text-[11px] tabular-nums">{val}/10</div>
        </div>

        {breakdown.map((component) => {
          // An unmeasurable component is left out of the score rather than
          // scored zero, so it must not render as if it failed.
          if (!component.available) {
            return (
              <div key={component.key} className="flex items-center justify-between font-medium opacity-60">
                <div className="w-[140px] truncate pr-2">{component.label}</div>
                <div className="flex-1 h-[6px] bg-subtle rounded-full mx-2" />
                <div className="w-[50px] text-center ml-1">
                  <span className="px-2 py-[2px] rounded-md font-bold text-[10px] bg-subtle text-ink-faint">
                    No data
                  </span>
                </div>
                <div className="w-[45px] text-right text-[11px] text-ink-faint">—</div>
              </div>
            );
          }

          const tone = toneFor(component.ratio ?? 0);
          return (
            <div key={component.key} className="flex items-center justify-between font-medium">
              <div className="w-[140px] truncate pr-2" title={component.label}>
                {component.label}
              </div>
              <div className="flex-1 h-[6px] bg-subtle rounded-full overflow-hidden flex mx-2">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(component.ratio ?? 0) * 100}%`, backgroundColor: tone.color }}
                />
              </div>
              <div className="w-[50px] text-center ml-1">
                <span
                  className="px-2 py-[2px] rounded-md font-bold text-[10px]"
                  style={{ backgroundColor: tone.bg, color: tone.color }}
                >
                  {tone.badge}
                </span>
              </div>
              <div className="w-[45px] text-right text-[11px] tabular-nums">
                {component.points}/{component.weight}
              </div>
            </div>
          );
        })}

        {unmeasured > 0 && !isOverridden && (
          <p className="text-[11px] text-ink-faint border-t border-line-subtle pt-2.5">
            Scored on the {breakdown.length - unmeasured} components with data.
            The {unmeasured === 1 ? 'other is' : `other ${unmeasured} are`} left out
            rather than counted as zero, so the rows above total less than {val}.
          </p>
        )}

        {isOverridden && (
          <p className="text-[11px] text-ink-faint border-t border-line-subtle pt-2.5">
            This score was set by hand. The components above are what the
            calculation would have given.
          </p>
        )}
      </div>
    </div>
  );
}
