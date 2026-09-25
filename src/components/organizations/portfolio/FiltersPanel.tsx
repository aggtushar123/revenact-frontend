// This module intentionally exports both GROUP_OPTIONS and the components
// that share it (GroupSortControls, FiltersPanel), per the brief's interface
// (Task 10). Fast refresh doesn't apply to this shared, mostly-presentational
// module (same precedent as rowParts.tsx, Task 4).
/* eslint-disable react-refresh/only-export-components */
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { ArrowDown, ArrowUp, Download, Plus, X } from 'lucide-react';
import { trapTab } from '../../../lib/focusTrap';
import { SORT_OPTIONS } from '../../../features/organizations/portfolioFields';
import { HEALTH_BANDS, toggleIn, type PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { GroupKey, LifecycleValue, NpsBand, PortfolioResponse } from '../../../features/organizations/portfolioTypes';
import { BAND_LABEL } from './rowParts';

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
const SELECT = `min-h-11 sm:min-h-9 rounded-lg border border-line bg-surface px-2 text-[13px] text-ink hover:border-line-strong disabled:opacity-50 ${FOCUS}`;

export const GROUP_OPTIONS: { value: GroupKey | 'none'; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'health', label: 'Health' },
  { value: 'owner', label: 'Owner' },
  { value: 'lifecycle', label: 'Lifecycle' },
  { value: 'product', label: 'Product' },
  { value: 'renewal', label: 'Renewal window' },
];

/** Group and sort: in the toolbar from `sm`, inside the Filters sheet below. */
export function GroupSortControls({
  params,
  update,
}: {
  params: PortfolioParams;
  update: (patch: Partial<PortfolioParams>) => void;
}) {
  const descending = params.sort.startsWith('-');
  const field = params.sort.replace(/^-/, '');
  const groupId = useId();
  const sortId = useId();
  // Labels point at their selects by id rather than wrapping them, so each
  // select's accessible name is the label alone.
  return (
    <>
      <span className="flex items-center gap-1.5">
        <label htmlFor={groupId} className="text-[13px] text-ink-muted">
          Group
        </label>
        <select
          id={groupId}
          className={SELECT}
          value={params.group || 'none'}
          onChange={(event) => update({ group: event.target.value === 'none' ? '' : (event.target.value as GroupKey) })}
        >
          {GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
      <span className="flex items-center gap-1.5">
        <label htmlFor={sortId} className="text-[13px] text-ink-muted">
          Sort by
        </label>
        <select
          id={sortId}
          className={SELECT}
          value={field}
          onChange={(event) => update({ sort: `${descending ? '-' : ''}${event.target.value}` })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={descending}
          aria-label={descending ? 'Descending' : 'Ascending'}
          title={descending ? 'High to low' : 'Low to high'}
          onClick={() => update({ sort: descending ? field : `-${field}` })}
          className={`inline-flex w-11 h-11 sm:w-9 sm:h-9 items-center justify-center rounded-lg border border-line text-ink-muted hover:text-ink hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
        >
          {descending ? <ArrowDown className="w-4 h-4" aria-hidden="true" /> : <ArrowUp className="w-4 h-4" aria-hidden="true" />}
        </button>
      </span>
    </>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-11 sm:min-h-8 items-center gap-2 text-[13px] text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className={`w-4 h-4 accent-accent ${FOCUS}`} />
      {label}
    </label>
  );
}

function Radio({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-11 sm:min-h-8 items-center gap-2 text-[13px] text-ink">
      <input type="radio" name={name} checked={checked} onChange={onChange} className={`w-4 h-4 accent-accent ${FOCUS}`} />
      {label}
    </label>
  );
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}

const WINDOWS: { value: PortfolioParams['renews_within']; label: string }[] = [
  { value: '', label: 'Any time' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
];
const NPS: { value: '' | NpsBand; label: string }[] = [
  { value: '', label: 'Any' },
  { value: 'promoter', label: 'Promoters' },
  { value: 'passive', label: 'Passives' },
  { value: 'detractor', label: 'Detractors' },
];

/** Every filter from spec §1. Changes apply at once (they write the URL).
 *  From `sm` it is a popover under the toolbar. Below `sm` it is a modal
 *  bottom sheet that also holds group, sort, Export and Add, because the
 *  phone toolbar is only Search and Filters. */
export function FiltersPanel({
  params,
  update,
  options,
  isSm,
  onClose,
  onExport,
  exporting,
  onAdd,
  triggerRef,
}: {
  params: PortfolioParams;
  update: (patch: Partial<PortfolioParams>) => void;
  options: PortfolioResponse['filters'] | null;
  isSm: boolean;
  onClose: () => void;
  onExport: () => void;
  exporting: boolean;
  onAdd: () => void;
  /** The toolbar's "Filters" button. Excluded from the "click outside"
   *  close check entirely — not just from where the popover itself sits —
   *  so a click that reopens it (its own onClick toggle) never races a
   *  mousedown that would otherwise close it first. Also where focus goes
   *  back to on close. */
  triggerRef?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ownerRef = useRef<HTMLSelectElement>(null);
  const ownerId = useId();
  // Escape, the close button and applying a choice (Export/Add on the phone
  // sheet) hand focus back to the trigger. An outside click doesn't: the
  // user moved focus somewhere on purpose (e.g. straight into the search
  // box), so the browser's own focus change is left alone instead of being
  // fought right after.
  const restoreFocus = useRef(true);

  useEffect(() => {
    restoreFocus.current = true;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const trigger = triggerRef?.current ?? null;
    ownerRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (!isSm && event.key === 'Tab' && ref.current) trapTab(event, ref.current);
    };
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      if (trigger?.contains(target)) return;
      restoreFocus.current = false;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    if (isSm) document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (isSm) document.removeEventListener('mousedown', onPointerDown);
      if (restoreFocus.current) (trigger ?? previouslyFocused)?.focus();
    };
  }, [isSm, onClose, triggerRef]);

  const body = (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Filters</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className={`inline-flex w-11 h-11 sm:w-8 sm:h-8 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-subtle ${FOCUS}`}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      {!isSm ? (
        <div className="flex flex-wrap items-center gap-3">
          <GroupSortControls params={params} update={update} />
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor={ownerId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Owner
        </label>
        {/* The server's options already include Unassigned. */}
        <select ref={ownerRef} id={ownerId} className={SELECT} value={params.owner} onChange={(event) => update({ owner: event.target.value })}>
          <option value="">Everyone</option>
          {(options?.owners ?? []).map((owner) => (
            <option key={owner.value} value={owner.value}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>

      <Group legend="Health">
        {HEALTH_BANDS.map((band) => (
          <Check key={band} label={BAND_LABEL[band]} checked={params.health.includes(band)} onChange={() => update({ health: toggleIn(params.health, band) })} />
        ))}
      </Group>

      <Group legend="Lifecycle">
        {(options?.lifecycles ?? []).map((stage) => (
          <Check
            key={stage.value}
            label={stage.name}
            checked={params.lifecycle.includes(stage.value as LifecycleValue)}
            onChange={() => update({ lifecycle: toggleIn(params.lifecycle, stage.value as LifecycleValue) })}
          />
        ))}
      </Group>

      <Group legend="Product">
        {options?.products.length ? (
          options.products.map((product) => (
            <Check key={product.value} label={product.name} checked={params.product.includes(product.value)} onChange={() => update({ product: toggleIn(params.product, product.value) })} />
          ))
        ) : (
          <p className="text-[13px] text-ink-muted">No products in the catalogue yet.</p>
        )}
      </Group>

      <Group legend="Renews within">
        {WINDOWS.map((w) => (
          <Radio key={w.label} name="renews_within" label={w.label} checked={params.renews_within === w.value} onChange={() => update({ renews_within: w.value })} />
        ))}
      </Group>

      <Group legend="NPS">
        {NPS.map((n) => (
          <Radio key={n.label} name="nps" label={n.label} checked={params.nps === n.value} onChange={() => update({ nps: n.value })} />
        ))}
      </Group>

      <Group legend="Churned">
        <Check label="Include churned" checked={params.include_churned} onChange={() => update({ include_churned: !params.include_churned })} />
      </Group>

      {!isSm ? (
        <div className="flex flex-col gap-2 border-t border-line-subtle pt-4">
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-line text-[13px] font-semibold text-ink hover:bg-subtle disabled:opacity-50 ${FOCUS}`}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            {exporting ? 'Exporting…' : 'Export'}
          </button>
          <button
            type="button"
            onClick={onAdd}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-accent text-[13px] font-semibold text-on-accent hover:bg-accent-hover ${FOCUS}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add organization
          </button>
        </div>
      ) : null}
    </div>
  );

  if (isSm) {
    return (
      <div ref={ref} role="dialog" aria-label="Filters" className="absolute right-0 top-full z-30 mt-2 max-h-[70vh] w-[22rem] overflow-y-auto rounded-xl border border-line bg-elevated p-4 shadow-md">
        {body}
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div aria-hidden="true" className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Filters" className="relative max-h-[85dvh] overflow-y-auto rounded-t-xl bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {body}
      </div>
    </div>
  );
}
