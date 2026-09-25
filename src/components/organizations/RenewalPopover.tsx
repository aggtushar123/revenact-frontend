import { useEffect, useRef } from 'react';
import type { CSSProperties, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { Customer } from '../../features/customers/customersSlice';
import { formatDate } from '../../features/customers/formatters';

interface RenewalPopoverProps {
  customers: Customer[];
  count: number;
  isLoading: boolean;
  error: string | null;
  windowLabel: string;
  onClose: () => void;
  /** Viewport-relative position (from the trigger button's own
   * getBoundingClientRect(), computed by the caller on click). */
  style: CSSProperties;
  /** The whole Renewal card (trigger button + 1M/3M pills) — excluded
   * from the "click outside" close check, entirely. Not just the trigger
   * button: without this, clicking a pill while the popover is open would
   * count as "outside" and close it before the pill's own onClick could
   * switch the window; and excluding only the trigger button (rather than
   * the pills too) would still let clicking it again to close race with
   * its own click handler — mousedown closes first, then that same
   * click's bubbled event reopens it, since the handler still reads the
   * pre-close "open" state when deciding whether to toggle. */
  anchorRef: RefObject<HTMLDivElement | null>;
}

const HEALTH_DOT: Record<Customer['health_category'], string> = {
  good: 'bg-success',
  average: 'bg-warning',
  poor: 'bg-danger',
};


// Whole calendar days between today and the (date-only) renewal_date,
// without going through `Date` parsing of the ISO string directly (which
// would apply the local timezone and can shift the day).
function daysUntil(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function dueLabel(days: number): string {
  if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

// Renewals due within a week (including overdue ones) read as urgent;
// the rest just need to be on someone's radar.
function dueColor(days: number): string {
  return days <= 7 ? 'text-danger' : 'text-ink-faint';
}

/** Positioned `fixed` from a viewport rect the caller computes on click —
 * same pattern as HealthPopover/CsatPopover — and, unlike those,
 * rendered through a portal to `document.body`. MetricsPanel's root has
 * an inline `backdropFilter` (the glass-panel effect), and per spec any
 * `filter`/`backdrop-filter` ancestor creates a new stacking context AND
 * containing block for fixed-position descendants — that traps a nested
 * `position:fixed` element inside MetricsPanel's own stacking level, so
 * no z-index on the popover itself can lift it above a later sibling
 * (the table) no matter how high. A portal escapes that ancestor
 * entirely rather than fighting it.
 *
 * Closing uses a document-level "click outside the popover" listener
 * instead of the full-viewport invisible overlay the other popovers use —
 * that overlay would, once portaled to the same top level as everything
 * else, sit *above* the still-backdrop-filter-trapped Renewal card behind
 * it, swallowing clicks on the card's own 1M/3M pills before they could
 * switch the window while this popover is open. */
export function RenewalPopover({
  customers,
  count,
  isLoading,
  error,
  windowLabel,
  onClose,
  style,
  anchorRef,
}: RenewalPopoverProps) {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (contentRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onClose, anchorRef]);

  return createPortal(
    <div
      ref={contentRef}
      style={style}
      className="fixed z-[110] w-[320px] bg-elevated rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-line-strong flex flex-col"
    >
        <div className="px-4 py-3 border-b border-line-subtle">
          <h3 className="text-ink font-semibold text-[13px]">Renewing {windowLabel}</h3>
          <p className="text-ink-faint text-[11px] mt-0.5">
            {count} organization{count === 1 ? '' : 's'}
          </p>
        </div>

        <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
          {error ? (
            <div className="px-4 py-6 text-center text-[12px] text-danger">{error}</div>
          ) : isLoading ? (
            <div className="px-4 py-6 text-center text-[12px] text-ink-faint">Loading…</div>
          ) : customers.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-ink-faint">
              Nothing renewing {windowLabel.toLowerCase()}.
            </div>
          ) : (
            customers.map((c) => {
              const days = c.renewal_date ? daysUntil(c.renewal_date) : null;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onClose();
                    navigate(`/organizations/${c.id}`);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-subtle transition-colors text-left border-b border-line-subtle last:border-b-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${HEALTH_DOT[c.health_category]}`} />
                    <span className="text-[13px] font-medium text-ink truncate">{c.name}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[11px] font-medium text-ink-muted">
                      {c.renewal_date ? formatDate(c.renewal_date) : '-'}
                    </span>
                    {days !== null && (
                      <span className={`text-[10px] font-semibold ${dueColor(days)}`}>{dueLabel(days)}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {!isLoading && !error && count > customers.length && (
          <div className="px-4 py-2 border-t border-line-subtle text-[11px] text-ink-faint text-center">
            +{count - customers.length} more not shown
          </div>
        )}
      </div>,
    document.body
  );
}
