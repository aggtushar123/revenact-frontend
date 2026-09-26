import { useEffect, useRef, type RefObject } from 'react';
import type { ColumnId } from '../tableData';
import { MAX_PINS } from '../../../features/organizations/pinnedFields';
import { PANELS, PANEL_ORDER, PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';
import { FOCUS } from './styles';

/** Replaces the old "Edit columns" popover: pick up to three fields to show
 *  as chips on every row (spec §1 "Pin a field"). */
export function PinFieldsMenu({
  pins,
  onToggle,
  onClose,
  triggerRef,
}: {
  pins: ColumnId[];
  onToggle: (id: ColumnId) => void;
  onClose: () => void;
  /** The toolbar's "Pin fields" button, excluded from the "click outside"
   *  close check and where focus goes back to on close (see FiltersPanel's
   *  triggerRef for why the trigger itself must never count as outside). */
  triggerRef?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Escape and the close button (there isn't one here, but the pattern
  // matches FiltersPanel) hand focus back to the trigger. An outside click
  // doesn't: the user moved focus somewhere on purpose, so the browser's own
  // focus change is left alone instead of being fought right after.
  const restoreFocus = useRef(true);
  useEffect(() => {
    restoreFocus.current = true;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const trigger = triggerRef?.current ?? null;
    ref.current?.querySelector<HTMLElement>('input')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      if (trigger?.contains(target)) return;
      restoreFocus.current = false;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointerDown);
      if (restoreFocus.current) (trigger ?? previouslyFocused)?.focus();
    };
  }, [onClose, triggerRef]);

  const full = pins.length >= MAX_PINS;
  return (
    <div ref={ref} role="dialog" aria-label="Pin fields" className="absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[20rem] overflow-y-auto rounded-xl border border-line bg-elevated p-4 shadow-md">
      <h2 className="text-[15px] font-semibold text-ink">Pin fields</h2>
      <p className="mt-1 text-[11px] text-ink-muted">Up to {MAX_PINS} fields show on every row.</p>
      <p className="font-mono-brand tabular-nums text-[11px] text-ink-muted">{`${pins.length} of ${MAX_PINS} pinned`}</p>
      <div className="mt-3 flex flex-col gap-3">
        {PANELS.map((panel) => (
          <fieldset key={panel.key}>
            <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{panel.title}</legend>
            {PANEL_ORDER[panel.key].map((id) => {
              const checked = pins.includes(id);
              return (
                <label key={id} className={`flex min-h-11 sm:min-h-8 items-center gap-2 text-[13px] ${!checked && full ? 'text-ink-faint' : 'text-ink'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && full}
                    onChange={() => onToggle(id)}
                    className={`w-4 h-4 accent-accent ${FOCUS} disabled:opacity-50`}
                  />
                  {PORTFOLIO_FIELDS[id].label}
                </label>
              );
            })}
          </fieldset>
        ))}
      </div>
    </div>
  );
}
