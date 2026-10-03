// A portfolio toolbar's shared pieces (Organizations, Accounts, Pipelines):
// the search box, the Filters trigger (with its active-filter count), the
// phone Select toggle, and the Export/Add pair shown from `sm`. Each
// toolbar still owns its own layout, debounce and open/closed state; these
// are the bits that were byte-for-byte identical between them.
import type { RefObject } from 'react';
import { BookmarkPlus, CheckSquare, Download, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { BUTTON, FOCUS, PRIMARY } from './styles';

export function ToolbarSearch({
  label,
  searchRef,
  value,
  onChange,
  isSm,
}: {
  label: string;
  searchRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  isSm: boolean;
}) {
  return (
    <label className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-sm">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
      <input
        ref={searchRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={isSm ? label : 'Search'}
        className={`w-full min-h-11 sm:min-h-9 rounded-lg border border-line bg-surface pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint hover:border-line-strong ${FOCUS}`}
      />
    </label>
  );
}

/** The "Filters" button: a count badge once any filter is active. */
export function FiltersTrigger({
  triggerRef,
  open,
  onClick,
  count,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button ref={triggerRef} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={onClick} className={BUTTON}>
      <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
      Filters
      {count > 0 ? <span className="rounded-full bg-accent px-1.5 font-mono-brand tabular-nums text-[11px] text-on-accent">{count}</span> : null}
    </button>
  );
}

/** Phones: turns selection mode on without a long press. */
export function SelectToggle({ pressed, onClick }: { pressed: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className={`${BUTTON} ${pressed ? 'bg-accent-dim' : ''}`}>
      <CheckSquare className="w-4 h-4" aria-hidden="true" />
      Select
    </button>
  );
}

/** "Save as segment" (segments spec 2026-10-03 §3): the list's current
 *  filters as a new segment's rules. Beside Filters on Organizations and
 *  Accounts, before Add on Contacts. */
export function SaveAsSegmentButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${BUTTON} ${className}`}>
      <BookmarkPlus className="w-4 h-4" aria-hidden="true" />
      Save as segment
    </button>
  );
}

/** Export then "Add {noun}", shown in the toolbar from `sm` (below `sm`
 *  they move into the Filters sheet via FilterSheetFooter instead). */
export function ToolbarActions({
  onExport,
  exporting,
  onAdd,
  addLabel,
}: {
  onExport: () => void;
  exporting: boolean;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <>
      <button type="button" onClick={onExport} disabled={exporting} className={BUTTON}>
        <Download className="w-4 h-4" aria-hidden="true" />
        {exporting ? 'Exporting…' : 'Export'}
      </button>
      <button type="button" onClick={onAdd} className={PRIMARY}>
        <Plus className="w-4 h-4" aria-hidden="true" />
        {addLabel}
      </button>
    </>
  );
}
