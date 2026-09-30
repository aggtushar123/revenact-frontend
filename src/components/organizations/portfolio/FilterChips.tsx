import { X } from 'lucide-react';
import { countText, filterChips } from '../../../features/organizations/filterChips';
import type { PortfolioParams } from '../../../features/organizations/portfolioParams';
import type { FilterOptions } from '../../../features/organizations/portfolioTypes';
import { usePortfolioKind } from './portfolioKind';
import { FOCUS, MONO } from './styles';

/** One active filter as a chip: removing it writes `patch` to the URL. */
export interface RemovableChip<P> {
  key: string;
  label: string;
  patch: Partial<P>;
}

/** The row under a portfolio's toolbar, for any params shape: one
 *  removable chip per active filter, "Clear all", and a live count. */
export function ChipRow<P>({
  chips,
  status,
  onChange,
  onClearAll,
}: {
  chips: RemovableChip<P>[];
  status: string;
  onChange: (patch: Partial<P>) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.patch)}
          aria-label={`Remove ${chip.label}`}
          className={`inline-flex min-h-11 sm:min-h-8 items-center gap-1 rounded-full bg-subtle px-3 text-[13px] text-ink hover:bg-line-subtle active:bg-line ${FOCUS}`}
        >
          {chip.label}
          <X className="w-3.5 h-3.5 text-ink-muted" aria-hidden="true" />
        </button>
      ))}
      {chips.length > 0 ? (
        <button
          type="button"
          onClick={onClearAll}
          className={`min-h-11 sm:min-h-8 rounded-lg px-2 text-[13px] font-semibold text-ink underline-offset-2 hover:underline ${FOCUS}`}
        >
          Clear all
        </button>
      ) : null}
      <p role="status" aria-live="polite" className={`ml-auto ${MONO} text-[13px] text-ink-muted`}>
        {status}
      </p>
    </div>
  );
}

export function FilterChips({
  params,
  options,
  count,
  total,
  failed = false,
  onChange,
  onClearAll,
}: {
  params: PortfolioParams;
  options: FilterOptions | null;
  count: number | null;
  total: number | null;
  /** The first load failed: there is no count to wait for. */
  failed?: boolean;
  onChange: (patch: Partial<PortfolioParams>) => void;
  onClearAll: () => void;
}) {
  const kind = usePortfolioKind();
  const chips = filterChips(params, options);
  return (
    <ChipRow
      chips={chips}
      status={countText(count, total, chips.length > 0, failed, kind.noun)}
      onChange={onChange}
      onClearAll={onClearAll}
    />
  );
}
