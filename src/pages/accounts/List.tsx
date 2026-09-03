import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionBar } from '../../components/accounts/ActionBar';
import { AccountsTable } from '../../components/accounts/AccountsTable';
import { AccountFormModal } from '../organizations/AccountFormModal';
import { fetchAllAccounts, fetchCustomers } from '../../features/customers/customersSlice';
import type { Account } from '../../features/customers/customersSlice';
import type { AppDispatch, RootState } from '../../store';

// Same "raw path in, paginated page out" pattern as the standalone
// Contacts page's own List.tsx (fetchAllContacts) — see that page for
// the debounced-search/offset-tracking reasoning this mirrors exactly.
// No MetricsPanel/stats banner or checkbox bulk-select here — Account
// has neither a stats endpoint nor a Delete capability yet (see
// AccountListView's own docstring on the backend), so there's nothing
// real to back either one.
export function List() {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, allAccounts, allAccountsCount, allAccountsNext, allAccountsPrevious, allAccountsLoading, allAccountsError } =
    useSelector((state: RootState) => state.customers);

  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // A Customer id as a string, or '' for "All Organizations".
  const [companyFilter, setCompanyFilter] = useState('');
  // Bumped after a successful Add/Edit to re-run the fetch effect below
  // with the current search/company filters still applied — same
  // reasoning as the Contacts page's own refreshKey.
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Organization filter dropdown's own options — also what "Add
  // Account" picks an organization from.
  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (companyFilter) params.set('company', companyFilter);
    const query = params.toString();
    dispatch(fetchAllAccounts(query ? `/accounts/?${query}` : undefined))
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
    if (!allAccountsNext) return;
    const currentPageSize = allAccounts.length;
    try {
      await dispatch(fetchAllAccounts(allAccountsNext)).unwrap();
      setOffset((o) => o + currentPageSize);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  const handlePrevious = async () => {
    if (!allAccountsPrevious) return;
    try {
      const result = await dispatch(fetchAllAccounts(allAccountsPrevious)).unwrap();
      setOffset((o) => o - result.results.length);
    } catch {
      // Failure is already surfaced via redux `error` state into the table.
    }
  };

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink">
      <div className="flex flex-col flex-1 overflow-hidden p-6">
        <ActionBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          companies={companies}
          onAddAccount={() => setIsAddingAccount(true)}
        />

        <div className="flex-1 overflow-hidden bg-surface/50 relative">
          <AccountsTable
            accounts={allAccounts}
            isLoading={allAccountsLoading}
            error={allAccountsError}
            offset={offset}
            count={allAccountsCount}
            hasNext={!!allAccountsNext}
            hasPrevious={!!allAccountsPrevious}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onEditRequest={setEditingAccount}
          />
        </div>
      </div>

      {isAddingAccount && (
        <AccountFormModal
          companies={companies}
          onClose={() => setIsAddingAccount(false)}
          onSaved={refetch}
        />
      )}

      {editingAccount && (
        <AccountFormModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
        />
      )}
    </div>
  );
}
