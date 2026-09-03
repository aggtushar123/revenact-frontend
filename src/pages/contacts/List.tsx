import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MetricsPanel } from '../../components/contacts/MetricsPanel';
import { ActionBar } from '../../components/contacts/ActionBar';
import { ContactsTable } from '../../components/contacts/ContactsTable';
import { ContactFormModal } from '../../components/contacts/ContactFormModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { fetchAllContacts, fetchCustomers, deleteContact } from '../../features/customers/customersSlice';
import type { Contact } from '../../features/customers/customersSlice';
import type { AppDispatch, RootState } from '../../store';

// Same "raw path in, paginated page out" pattern as the Organizations
// page's own List.tsx (fetchCustomers) — see that page for the
// debounced-search/offset-tracking reasoning this mirrors exactly.
export function List() {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, allContacts, allContactsCount, allContactsNext, allContactsPrevious, allContactsLoading, allContactsError } =
    useSelector((state: RootState) => state.customers);

  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // A Customer id as a string, or '' for "All Companies" — see
  // ActionBar's own prop doc.
  const [companyFilter, setCompanyFilter] = useState('');
  // Bumped after a successful Add/Edit/Delete to re-run the fetch
  // effect below with the current search/company filters still
  // applied — simpler than each mutation guessing how to patch the
  // already-paginated `allContacts` array in place.
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Company filter dropdown's own options — every company the tenant
  // has, fetched for real rather than the old hardcoded 3-company list.
  // Also what "Add Contact" picks a company from.
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (companyFilter) params.set('company', companyFilter);
    const query = params.toString();
    dispatch(fetchAllContacts(query ? `/contacts/?${query}` : undefined))
      .unwrap()
      .then(() => {
        if (!cancelled) setOffset(0);
      })
      .catch(() => {
        // Failure is already surfaced via redux `error` state into the table.
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, debouncedSearch, companyFilter, refreshKey]);

  const companies = useMemo(
    () => customers.map((c) => ({ id: c.id, name: c.name })),
    [customers]
  );

  const handleNext = async () => {
    if (!allContactsNext) return;
    const currentPageSize = allContacts.length;
    try {
      await dispatch(fetchAllContacts(allContactsNext)).unwrap();
      setOffset((o) => o + currentPageSize);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  const handlePrevious = async () => {
    if (!allContactsPrevious) return;
    try {
      const result = await dispatch(fetchAllContacts(allContactsPrevious)).unwrap();
      setOffset((o) => o - result.results.length);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  // Checkbox selection — same reasoning/reset-on-page-change pattern as
  // the Organizations List page's own selectedIds (see that file).
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectionPageKey, setSelectionPageKey] = useState({ offset, debouncedSearch, companyFilter });
  if (
    selectionPageKey.offset !== offset ||
    selectionPageKey.debouncedSearch !== debouncedSearch ||
    selectionPageKey.companyFilter !== companyFilter
  ) {
    setSelectionPageKey({ offset, debouncedSearch, companyFilter });
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
      const allSelected = allContacts.length > 0 && allContacts.every((c) => prev.has(c.id));
      return allSelected ? new Set() : new Set(allContacts.map((c) => c.id));
    });
  };

  // Add/Edit modal + Delete confirmation state — shared between the
  // ActionBar's "Add Contact" button and each row's own "..." menu.
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink">
      {/* Top Metrics Area */}
      <div className="px-6 pt-6 pb-4">
        <MetricsPanel />
      </div>

      {/* Horizontal Divider */}
      <div className="px-6 mb-4">
        <div className="w-full h-px bg-line"></div>
      </div>

      {/* Search and Table Area */}
      <div className="flex flex-col flex-1 overflow-hidden px-6">
        <ActionBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          companies={companies}
          onAddContact={() => setIsAddingContact(true)}
        />

        <div className="flex-1 overflow-hidden mt-4 bg-surface/50 relative">
           <ContactsTable
             contacts={allContacts}
             isLoading={allContactsLoading}
             error={allContactsError}
             offset={offset}
             count={allContactsCount}
             hasNext={!!allContactsNext}
             hasPrevious={!!allContactsPrevious}
             onNext={handleNext}
             onPrevious={handlePrevious}
             selectedIds={selectedIds}
             onToggleSelect={toggleSelect}
             onToggleSelectAll={toggleSelectAll}
             onEditRequest={setEditingContact}
             onDeleteRequest={setDeletingContact}
           />
        </div>
      </div>

      {isAddingContact && (
        <ContactFormModal
          companies={companies}
          onClose={() => setIsAddingContact(false)}
          onSaved={refetch}
        />
      )}

      {editingContact && (
        <ContactFormModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          // Never actually called for an edit — see ContactFormModal's
          // own prop doc — but still required by its type.
          onSaved={() => {}}
        />
      )}

      {deletingContact && (
        <ConfirmDialog
          title={`Delete ${deletingContact.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteContact(deletingContact.id)).unwrap();
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(deletingContact.id);
              return next;
            });
          }}
          onClose={() => setDeletingContact(null)}
        />
      )}
    </div>
  );
}
