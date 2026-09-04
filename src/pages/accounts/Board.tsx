import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ActionBar } from '../../components/accounts/ActionBar';
import { MetricsPanel } from '../../components/accounts/MetricsPanel';
import { AccountFormModal } from '../organizations/AccountFormModal';
import { KanbanBoard } from '../../components/pipelines/KanbanBoard';
import { EntityAvatar } from '../../components/shared';
import { fetchAllAccounts, fetchCustomers, updateAccount } from '../../features/customers/customersSlice';
import { HEALTH_COLORS, companyLabel, formatCompactMoney } from '../../features/customers/formatters';
import { mapAccountToAccountRow } from '../../features/customers/mapToAccountRow';
import { useOrgCurrency } from '../../hooks';
import type { Account } from '../../features/customers/customersSlice';
import type { CurrencyCode } from '../../features/auth/authSlice';
import type { AppDispatch, RootState } from '../../store';

// Real data, grouped by lifecycle_stage — the standalone Accounts
// page's own equivalent of the Organizations board (pages/
// organizations/Board.tsx, same reasoning there applies here almost
// unchanged) and the Pipelines board's own "stage" (see
// components/pipelines/KanbanBoard.tsx, shared by all three rather
// than a fourth copy of the same drag-and-drop columns). Previously a
// route that didn't exist at all; List.tsx already has the real fetch/
// search/company-filter/Add this reuses via the same ActionBar.
//
// Unlike the Organizations board's own Churn column, Account's
// lifecycle dropdown already includes 'churn' as a plain selectable
// option (see AccountFormModal's own LIFECYCLE_OPTIONS/docstring) —
// Account has no dedicated churn-with-reason modal the way Customer
// does (see AccountWritePayload's own docstring), so every column here
// gets the same "+" and the same plain PATCH on drag, no special case.
const LIFECYCLE_COLUMNS: { stage: Account['lifecycle_stage']; title: string }[] = [
  { stage: 'onboarding', title: 'Onboarding' },
  { stage: 'kickoff', title: 'Kickoff' },
  { stage: 'adoption', title: 'Adoption' },
  { stage: 'live', title: 'Live' },
  { stage: 'renewal', title: 'Renewal' },
  { stage: 'expansion', title: 'Expansion' },
  { stage: 'churn', title: 'Churn' },
  { stage: 'other', title: 'Other' },
];

interface AccountCardEntity {
  id: number;
  stage: Account['lifecycle_stage'];
  name: string;
  domain: string;
  health: { val: number; clr: string };
  arr: number;
  owner: string;
  orgLabel: string;
}

// Plain function passed as KanbanBoard's renderCard prop (called directly
// as renderCard(entity), not rendered as JSX) — can't call useOrgCurrency()
// itself, so currency comes in as an explicit param, threaded by Board()'s
// own renderCard={(entity) => AccountCardContent(entity, currency)} closure.
function AccountCardContent(entity: AccountCardEntity, currency: CurrencyCode) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2.5 min-w-0">
        <EntityAvatar
          name={entity.name}
          logoUrl={entity.domain ? `https://logo.clearbit.com/${entity.domain}` : ''}
          className="w-7 h-7 rounded-lg text-[10px] shrink-0"
        />
        <h4 className="text-[12.5px] font-bold text-ink leading-snug truncate">{entity.name}</h4>
      </div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${entity.health.clr}`} />
          <span className="text-[11px] font-bold text-ink-muted">Health {entity.health.val}</span>
        </div>
        <span className="text-[11.5px] font-bold text-accent">{formatCompactMoney(entity.arr, currency)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[11px] text-ink-faint font-medium truncate">{entity.owner}</span>
        <span className="text-[10.5px] text-ink-faint font-semibold truncate max-w-[90px]">{entity.orgLabel}</span>
      </div>
    </>
  );
}

export function Board() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { customers, allAccounts, allAccountsLoading, allAccountsError } = useSelector(
    (state: RootState) => state.customers
  );
  const currency = useOrgCurrency();

  // Same debounced-search + company-filter convention as List.tsx's own.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  // Bumped after a successful Add to re-run the fetch effect below with
  // the current search/company filters still applied — same reasoning
  // as List.tsx's own refreshKey (createAccount doesn't know this
  // board's own `entities` need refreshing the way updateAccount's own
  // extraReducers already patch `allAccounts` directly for a move).
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
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (companyFilter) params.set('company', companyFilter);
    const query = params.toString();
    dispatch(fetchAllAccounts(query ? `/accounts/?${query}` : undefined));
  }, [dispatch, debouncedSearch, companyFilter, refreshKey]);

  const companies = useMemo(() => customers.map((c) => ({ id: c.id, name: c.name })), [customers]);

  const [isAdding, setIsAdding] = useState(false);
  const [addDefaultStage, setAddDefaultStage] = useState<Account['lifecycle_stage']>('onboarding');

  const entities: AccountCardEntity[] = useMemo(
    () =>
      allAccounts.map((a) => ({
        id: a.id,
        stage: a.lifecycle_stage,
        name: a.name,
        domain: a.domain,
        health: { val: Number(a.health_score), clr: HEALTH_COLORS[a.health_category] },
        arr: Number(a.arr),
        owner: a.owner?.name ?? 'Unassigned',
        orgLabel: companyLabel(a.customers),
      })),
    [allAccounts]
  );

  function handleMove(id: number, stage: Account['lifecycle_stage']) {
    const account = allAccounts.find((a) => a.id === id);
    if (!account) return;
    // Any one of the account's own linked Customers addresses the
    // nested update URL — AccountDetailView's own get_queryset accepts
    // any of them (see AccountFormModal's own edit-flow reasoning).
    dispatch(updateAccount({ customerId: account.customers[0]?.id ?? 0, id, lifecycle_stage: stage }));
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink">
      <div className="flex flex-col flex-1 overflow-hidden p-6">
        <MetricsPanel />

        <ActionBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          companies={companies}
          onAddAccount={() => {
            setAddDefaultStage('onboarding');
            setIsAdding(true);
          }}
        />

        <div className="flex-1 overflow-hidden">
          {allAccountsLoading && allAccounts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
              Loading accounts…
            </div>
          ) : allAccountsError ? (
            <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">
              {allAccountsError}
            </div>
          ) : (
            <KanbanBoard
              columns={LIFECYCLE_COLUMNS}
              entities={entities}
              renderCard={(entity) => AccountCardContent(entity, currency)}
              onCardClick={(entity) => {
                const account = allAccounts.find((a) => a.id === entity.id);
                if (!account) return;
                // Same "pass the already-known real AccountRow through
                // navigation state" pattern as AccountsTable's own
                // click-through — the *first* linked Customer, when
                // there's more than one (see that table's own reasoning).
                navigate(`/accounts/${account.id}`, {
                  state: {
                    account: mapAccountToAccountRow(
                      account,
                      account.customers[0]?.id ?? 0,
                      account.customers[0]?.name ?? '',
                      '', '', '', ''
                    ),
                  },
                });
              }}
              onAddClick={(stage) => {
                setAddDefaultStage(stage);
                setIsAdding(true);
              }}
              onMove={handleMove}
              minHeight="calc(100vh - 300px)"
            />
          )}
        </div>
      </div>

      {isAdding && (
        <AccountFormModal
          companies={companies}
          defaultLifecycleStage={addDefaultStage}
          onClose={() => setIsAdding(false)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
