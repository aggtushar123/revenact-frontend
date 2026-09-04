import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus } from 'lucide-react';
import { MetricsPanel } from '../../components/organizations/MetricsPanel';
import { OrganizationFormModal } from '../../components/organizations/OrganizationFormModal';
import { ChurnOrganizationModal } from '../../components/organizations/ChurnOrganizationModal';
import { KanbanBoard } from '../../components/pipelines/KanbanBoard';
import { EntityAvatar } from '../../components/shared';
import { fetchCustomers, updateCustomer } from '../../features/customers/customersSlice';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import { formatCompactMoney } from '../../features/customers/formatters';
import type { LifecycleCategory } from '../../components/organizations/tableData';
import type { CurrencyCode } from '../../features/auth/authSlice';
import type { AppDispatch, RootState } from '../../store';

// Real data, grouped by lifecycle_stage — the Organizations page's own
// equivalent of the Pipelines board's own "stage" (see
// components/pipelines/KanbanBoard.tsx, shared by both rather than a
// third copy of the same drag-and-drop columns). Previously a "Coming
// Soon" placeholder; List.tsx already has the real fetch/search/Add
// this reuses.
//
// "Churn" is a column here (an organisation can be dragged into or out
// of it) but never something the "+" directly creates into, since
// churning captures churn_date/reason/comment together via its own
// dedicated ChurnOrganizationModal — same reasoning as
// OrganizationFormModal's own lifecycle dropdown excluding it (see that
// component's own docstring). Dragging a card onto the Churn column
// opens that same modal instead of silently PATCHing lifecycle_stage
// alone.
const LIFECYCLE_COLUMNS: { stage: LifecycleCategory; title: string; disableAdd?: boolean }[] = [
  { stage: 'onboarding', title: 'Onboarding' },
  { stage: 'kickoff', title: 'Kickoff' },
  { stage: 'adoption', title: 'Adoption' },
  { stage: 'live', title: 'Live' },
  { stage: 'renewal', title: 'Renewal' },
  { stage: 'expansion', title: 'Expansion' },
  { stage: 'churn', title: 'Churn', disableAdd: true },
  { stage: 'other', title: 'Other' },
];

interface OrgCardEntity {
  id: number;
  stage: LifecycleCategory;
  org: string;
  logo: string;
  health: { val: number; clr: string };
  arr: number;
  /** This org's own contract currency (Customer.currency, Tier 1) — arr
   * above is a raw number in *this* currency, not the org's reporting
   * one (see OrgRow's own docstring in tableData.ts). */
  currency: CurrencyCode;
  owner: string;
  avatar: string;
  img?: string;
  bg: string;
}

function OrgCardContent(entity: OrgCardEntity) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2.5 min-w-0">
        <EntityAvatar name={entity.org} logoUrl={entity.logo} className="w-7 h-7 rounded-lg text-[10px] shrink-0" />
        <h4 className="text-[12.5px] font-bold text-ink leading-snug truncate">{entity.org}</h4>
      </div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${entity.health.clr}`} />
          <span className="text-[11px] font-bold text-ink-muted">Health {entity.health.val}</span>
        </div>
        <span className="text-[11.5px] font-bold text-accent">{formatCompactMoney(entity.arr, entity.currency)}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        {entity.img ? (
          <img src={entity.img} alt={entity.owner} className="w-4 h-4 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-4 h-4 rounded-full ${entity.bg} text-white flex items-center justify-center text-[7px] font-bold shrink-0`}>
            {entity.avatar}
          </div>
        )}
        <span className="text-[11px] text-ink-faint font-medium truncate">{entity.owner}</span>
      </div>
    </>
  );
}

export function Board() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { customers, totalCount, isLoading, error } = useSelector((state: RootState) => state.customers);

  // Same debounced-search convention as List.tsx's own — a separate
  // fetch of every (unpaginated in spirit, but see below) matching
  // customer, not a client-side filter of whatever page happened to be
  // loaded.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const url = debouncedSearch ? `/customers/?search=${encodeURIComponent(debouncedSearch)}` : undefined;
    dispatch(fetchCustomers(url));
  }, [dispatch, debouncedSearch]);

  const [isAdding, setIsAdding] = useState(false);
  const [addDefaultStage, setAddDefaultStage] = useState<LifecycleCategory>('onboarding');
  const [churnTarget, setChurnTarget] = useState<{ id: number; name: string } | null>(null);

  const rows = useMemo(() => customers.map((c) => mapCustomerToOrgRow(c)), [customers]);

  const entities: OrgCardEntity[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        stage: r.lifecycleCategory,
        org: r.org,
        logo: r.logo,
        health: r.health,
        arr: r.arr,
        currency: r.currency ?? 'USD',
        owner: r.owner,
        avatar: r.avatar,
        img: r.img,
        bg: r.bg,
      })),
    [rows]
  );

  function handleMove(id: number, stage: LifecycleCategory) {
    if (stage === 'churn') {
      // Same "own dedicated modal, not a bare PATCH" reasoning as the
      // List page's own Churn action — churn_date/reason/comment are
      // meant to be captured together, not defaulted silently.
      const org = rows.find((r) => r.id === id);
      if (org) setChurnTarget({ id, name: org.org });
      return;
    }
    dispatch(updateCustomer({ id, lifecycle_stage: stage }));
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink">
      <div className="px-6 pt-5 pb-4">
        <MetricsPanel totalCount={totalCount} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden px-6 pb-4">
        <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
          <div className="relative w-[400px]">
            <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, Revenact ID or External ID"
              className="w-full pl-9 pr-4 py-[8px] bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent placeholder:text-ink-faint"
            />
          </div>
          <button
            onClick={() => { setAddDefaultStage('onboarding'); setIsAdding(true); }}
            className="flex items-center gap-1.5 px-4 py-[8px] bg-accent hover:bg-accent-hover text-[#0D0F0E] text-[13px] font-semibold rounded-lg shadow-sm transition-colors tracking-wide"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Add Organization
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLoading && customers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
              Loading organizations…
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">{error}</div>
          ) : (
            <KanbanBoard
              columns={LIFECYCLE_COLUMNS}
              entities={entities}
              renderCard={OrgCardContent}
              onCardClick={(e) => navigate(`/organizations/${e.id}`)}
              onAddClick={(stage) => { setAddDefaultStage(stage); setIsAdding(true); }}
              onMove={handleMove}
              minHeight="calc(100vh - 300px)"
            />
          )}
        </div>
      </div>

      {isAdding && (
        <OrganizationFormModal defaultLifecycleStage={addDefaultStage} onClose={() => setIsAdding(false)} />
      )}

      {churnTarget && (
        <ChurnOrganizationModal
          customerIds={[churnTarget.id]}
          customerNames={[churnTarget.name]}
          onClose={() => setChurnTarget(null)}
        />
      )}
    </div>
  );
}
