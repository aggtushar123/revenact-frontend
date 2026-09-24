import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useOrgCurrency } from '../../../hooks';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { useDrill } from './useDrill';
import { fetchDrill, UnlistableDrillError } from './drillApi';
import { Loading, ErrorState } from '../shared/DataState';
import type { DrillRow } from './types';

const LIST_LIMIT = 500;

// Same breakpoint as the panel's own `lg:` classes below — this is the
// point where it stops being a full-screen sheet over the page and
// becomes a side panel next to it.
const LARGE_SCREEN_QUERY = '(min-width: 1024px)';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Whether the viewport is at `lg` or above. jsdom has no `matchMedia`, so a
 *  test that never stubs it renders as "not large" (a sheet) — the same
 *  mobile-first default the panel's own CSS assumes. */
function useIsLargeScreen(): boolean {
  const [isLarge, setIsLarge] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(LARGE_SCREEN_QUERY).matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(LARGE_SCREEN_QUERY);
    const onChange = () => setIsLarge(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isLarge;
}

/** The rows behind one number. Beside the scroll area from `lg`, a sheet
 *  over the page below it. Below `lg` it is a full-screen sheet with
 *  nowhere else useful for focus to go, so it is `aria-modal` and traps
 *  Tab/Shift+Tab within itself; at `lg` it sits beside the page as an
 *  ordinary panel, so focus is free to move between the two. */
export function DrillPanel() {
  const { current, close } = useDrill();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const isLargeScreen = useIsLargeScreen();
  const isSheet = !isLargeScreen;

  // Focus moves in when a drill opens (or is replaced), not when the
  // viewport merely crosses `lg` — that would yank focus off whatever row
  // the user was on.
  useEffect(() => {
    if (current) closeRef.current?.focus();
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // The sheet covers the page, so Escape always closes it. At `lg` the
        // panel sits beside the page, whose own controls (a menu, a combobox)
        // may want Escape: only close when focus is in the panel and nothing
        // else has already handled the key.
        if (isSheet) {
          close();
          return;
        }
        const root = panelRef.current;
        if (event.defaultPrevented || !root || !root.contains(document.activeElement)) return;
        close();
        return;
      }
      if (event.key !== 'Tab' || !isSheet) return;
      const root = panelRef.current;
      if (!root) return;
      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, close, isSheet]);

  if (!current) return null;
  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      aria-modal={isSheet ? true : undefined}
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
      {current.source.kind === 'rows' ? (
        <RowList rows={current.source.rows} />
      ) : (
        <ServerRows
          key={`${current.source.path}::${current.source.query}::${current.source.segment}`}
          {...current.source}
        />
      )}
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

// A ticket/interaction count is not a company count: the list is the
// companies with at least one match, unlinked records have no company to
// list, and a record on a shared account lists under each of its companies.
// Said once under the header so the rows don't look like they fail to add up.
const RECONCILE_NOTE: Record<string, string> = {
  tickets:
    "Companies with at least one matching ticket. Tickets not linked to a company aren't listed, and a ticket on a shared account counts for each of its companies.",
  interactions:
    "Companies with at least one matching interaction. Interactions not linked to a company aren't listed, and an interaction on a shared account counts for each of its companies.",
};

function ServerRows({ path, query, segment }: { path: string; query: string; segment: string }) {
  const currency = useOrgCurrency();
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; unlistable: boolean }
    | { status: 'done'; rows: DrillRow[]; count: number; truncated: boolean; valueLabel: string }
  >({ status: 'loading' });

  useEffect(() => {
    let live = true;
    fetchDrill(path, query, segment, currency)
      .then((result) => live && setState({ status: 'done', ...result }))
      .catch((error: unknown) =>
        live && setState({ status: 'error', unlistable: error instanceof UnlistableDrillError }),
      );
    return () => {
      live = false;
    };
    // `path`/`query`/`segment` changing remounts this component (DrillPanel
    // keys it on those three), so this effect only ever runs once per
    // mount — it doesn't need to reset `state` back to loading itself.
  }, [path, query, segment, currency]);

  if (state.status === 'loading') return <Loading label="Loading the accounts behind this number…" />;
  if (state.status === 'error') {
    if (state.unlistable) {
      return (
        <ErrorState
          message="This number can't be listed."
          detail="Open the area's full view to see what's behind it."
        />
      );
    }
    return (
      <ErrorState
        message="Could not load the accounts behind this number."
        detail="Try again, or open the area's full view."
      />
    );
  }
  const note = RECONCILE_NOTE[state.valueLabel];
  return (
    <>
      {note && <p className="mx-4 mt-3 text-[11px] text-ink-muted">{note}</p>}
      {state.truncated && (
        <p className="mx-4 mt-3 text-[11px] text-ink-muted">
          Showing <span className="font-mono-brand tabular-nums">{state.rows.length}</span> of{' '}
          <span className="font-mono-brand tabular-nums">{state.count}</span>
        </p>
      )}
      <RowList rows={state.rows} total={state.count} />
    </>
  );
}
