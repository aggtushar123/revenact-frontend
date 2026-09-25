import { useEffect, useRef } from 'react';
import type { ColumnId } from '../tableData';
import { MAX_PINS } from '../../../features/organizations/pinnedFields';
import { PANELS, PANEL_ORDER, PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';

/** Replaces the old "Edit columns" popover: pick up to three fields to show
 *  as chips on every row (spec §1 "Pin a field"). */
export function PinFieldsMenu({
  pins,
  onToggle,
  onClose,
}: {
  pins: ColumnId[];
  onToggle: (id: ColumnId) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
                <label key={id} className={`flex min-h-8 items-center gap-2 text-[13px] ${!checked && full ? 'text-ink-faint' : 'text-ink'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && full}
                    onChange={() => onToggle(id)}
                    className="w-4 h-4 accent-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
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
