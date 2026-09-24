import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useOrgCurrency } from '../../../hooks';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { useDrill } from './useDrill';
import type { DrillRow } from './types';

const LIST_LIMIT = 500;

/** The rows behind one number. Beside the scroll area from `lg`, a sheet
 *  over the page below it. */
export function DrillPanel() {
  const { current, close } = useDrill();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!current) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, close]);

  if (!current) return null;
  return (
    <aside
      role="dialog"
      aria-labelledby={titleId}
      className="animate-slide-in-right fixed inset-0 z-40 bg-surface lg:static lg:inset-auto lg:z-auto lg:w-[360px] lg:shrink-0 lg:border lg:border-line lg:rounded-xl flex flex-col min-h-0"
    >
      <header className="flex items-start justify-between gap-3 p-4 border-b border-line">
        <h2 id={titleId} className="text-[15px] font-semibold text-ink">
          {current.title}{' '}
          <span className="font-mono-brand tabular-nums text-ink-muted">{current.figure}</span>
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </header>
      {current.source.kind === 'rows' ? <RowList rows={current.source.rows} /> : <ServerRows />}
    </aside>
  );
}

function RowList({ rows, total }: { rows: DrillRow[]; total?: number }) {
  const currency = useOrgCurrency();
  if (rows.length === 0) {
    return <p className="p-4 text-[13px] text-ink-muted">No accounts behind this number.</p>;
  }
  const count = total ?? rows.length;
  return (
    <div className="flex flex-col min-h-0">
      {count <= LIST_LIMIT && rows.length === count && (
        <Link
          to={`/organizations/list?ids=${rows.map((r) => r.id).join(',')}`}
          className="mx-4 mt-3 text-[13px] font-semibold text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          Open as a list <span aria-hidden="true">→</span>
        </Link>
      )}
      <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-line px-4 py-2">
        {rows.map((row) => (
          <li key={row.id} className="py-2.5 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/organizations/${row.id}`}
                className="block truncate text-[13px] font-semibold text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
              >
                {row.name}
              </Link>
              {(row.detail || row.owner) && (
                <div className="text-[11px] text-ink-muted truncate">
                  {row.detail && <span>{row.detail}</span>}
                  {row.detail && row.owner && ' · '}
                  {row.owner && <span>{row.owner}</span>}
                </div>
              )}
            </div>
            {row.arr != null && (
              <span className="font-mono-brand tabular-nums text-[13px] text-ink shrink-0">
                {formatCompactMoney(row.arr, currency)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Replaced in Task 3.
function ServerRows() {
  return null;
}
