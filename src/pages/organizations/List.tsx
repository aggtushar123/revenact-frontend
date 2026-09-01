import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetricsPanel } from '../../components/organizations/MetricsPanel';
import { ActionBar } from '../../components/organizations/ActionBar';
import { OrganizationsTable } from '../../components/organizations/OrganizationsTable';
import { OrganizationFormModal } from '../../components/organizations/OrganizationFormModal';
import { ChurnOrganizationModal } from '../../components/organizations/ChurnOrganizationModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { fetchCustomers, updateCustomer } from '../../features/customers/customersSlice';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import type { AppDispatch, RootState } from '../../store';

export function List() {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, count, totalCount, next, previous, isLoading, error } = useSelector(
    (state: RootState) => state.customers
  );
  // Index (0-based) of the first row in the currently-loaded page, for the
  // "Showing X-Y of Z" footer. Tracked from how many rows each fetched page
  // actually contained — not a hardcoded page-size assumption, which would
  // silently drift if the backend's PAGE_SIZE ever changed or a page came
  // back short (e.g. the last one).
  const [offset, setOffset] = useState(0);

  // Search box state: `searchQuery` is what the input shows; `debouncedSearch`
  // is what actually drives the fetch, updated 300ms after typing stops so a
  // request isn't fired per keystroke.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const url = debouncedSearch ? `/customers/?search=${encodeURIComponent(debouncedSearch)}` : undefined;
    dispatch(fetchCustomers(url))
      .unwrap()
      .then(() => {
        // Guards against a slower, now-stale request (e.g. an earlier
        // keystroke's fetch) resetting the offset after a newer one already
        // has — this effect re-runs on every debouncedSearch change.
        if (!cancelled) setOffset(0);
      })
      .catch(() => {
        // Failure is already surfaced via redux `error` state into the table.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, debouncedSearch]);

  const rows = useMemo(() => customers.map(mapCustomerToOrgRow), [customers]);

  const handleNext = async () => {
    if (!next) return;
    const currentPageSize = customers.length;
    try {
      await dispatch(fetchCustomers(next)).unwrap();
      setOffset((o) => o + currentPageSize);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  const handlePrevious = async () => {
    if (!previous) return;
    try {
      const result = await dispatch(fetchCustomers(previous)).unwrap();
      setOffset((o) => o - result.results.length);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  // Checkbox selection — shared between the table's own checkboxes and the
  // ActionBar's settings-gear menu, which acts on whatever's selected
  // instead of needing its own separate row context. Only ever holds ids
  // from the currently-loaded page; reset on paging/search since the ids
  // on screen change entirely then (an id left over from a previous page
  // just wouldn't match anything current otherwise, but starting fresh
  // reads better than a phantom "2 selected" for rows no longer visible).
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  // Reset during render (React's documented pattern for "adjusting state
  // when a prop/derived value changes") rather than in an effect, which
  // would cost an extra commit-then-rerender cycle for no benefit here.
  const [selectionPageKey, setSelectionPageKey] = useState({ offset, debouncedSearch });
  if (selectionPageKey.offset !== offset || selectionPageKey.debouncedSearch !== debouncedSearch) {
    setSelectionPageKey({ offset, debouncedSearch });
    setSelectedIds(new Set());
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.has(r.id));
      return allSelected ? new Set() : new Set(rows.map((r) => r.id));
    });
  };

  const selectedOrganizations = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)).map((r) => ({ id: r.id, name: r.org })),
    [rows, selectedIds]
  );

  // Edit/Churn/Archive modal state — shared for the same reason: a row's
  // own "..." menu and the ActionBar's settings gear both open these.
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [churnTargets, setChurnTargets] = useState<{ ids: number[]; names: string[] } | null>(null);
  const [archiveTargets, setArchiveTargets] = useState<{ ids: number[]; names: string[] } | null>(null);
  const editingCustomer = customers.find((c) => c.id === editingCustomerId) ?? null;

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink">
      {/* Glass Metrics Banner */}
      <div className="px-6 pt-5 pb-4">
        <MetricsPanel totalCount={totalCount} />
      </div>

      {/* Search and Table Area */}
      <div className="flex flex-col flex-1 overflow-hidden px-6">
        <ActionBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedOrganizations={selectedOrganizations}
          onEditRequest={setEditingCustomerId}
          onChurnRequest={(ids, names) => setChurnTargets({ ids, names })}
          onArchiveRequest={(ids, names) => setArchiveTargets({ ids, names })}
        />

        <div className="flex-1 overflow-hidden mt-3 relative">
          <OrganizationsTable
            rows={rows}
            isLoading={isLoading}
            error={error}
            offset={offset}
            count={count}
            hasNext={next !== null}
            hasPrevious={previous !== null}
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onEditRequest={setEditingCustomerId}
            onChurnRequest={(ids, names) => setChurnTargets({ ids, names })}
            onArchiveRequest={(ids, names) => setArchiveTargets({ ids, names })}
          />
        </div>
      </div>

      {editingCustomer && (
        <OrganizationFormModal customer={editingCustomer} onClose={() => setEditingCustomerId(null)} />
      )}

      {churnTargets && (
        <ChurnOrganizationModal
          customerIds={churnTargets.ids}
          customerNames={churnTargets.names}
          onClose={() => {
            setChurnTargets(null);
            setSelectedIds(new Set());
          }}
        />
      )}

      {archiveTargets && (
        <ConfirmDialog
          title={
            archiveTargets.ids.length === 1
              ? `Archive ${archiveTargets.names[0]}?`
              : `Archive ${archiveTargets.ids.length} organizations?`
          }
          message="Hidden from this list and the metrics banner, but not deleted — you can unarchive later."
          confirmLabel="Archive"
          danger
          onConfirm={async () => {
            await Promise.all(
              archiveTargets.ids.map((id) => dispatch(updateCustomer({ id, is_archived: true })).unwrap())
            );
            setSelectedIds(new Set());
          }}
          onClose={() => setArchiveTargets(null)}
        />
      )}
    </div>
  );
}
