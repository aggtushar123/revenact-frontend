import { useMemo, useState } from 'react';
import { Target, DollarSign, Flame, CheckCircle2, ShieldAlert, Search, Plus } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import {
  fetchOpportunitiesForCustomer,
  fetchOpportunitiesForAccount,
  deleteOpportunity,
  fetchRisksForCustomer,
  fetchRisksForAccount,
  deleteRisk,
} from '../../features/customers/customersSlice';
import { formatMoney, companyLabel } from '../../features/customers/formatters';
import type { Opportunity, Risk } from '../../features/customers/customersSlice';
import { EntityAvatar } from './EntityAvatar';
import { OpportunityFormModal } from '../pipelines/OpportunityFormModal';
import { RiskFormModal } from '../pipelines/RiskFormModal';
import { ConfirmDialog } from '../organizations/ConfirmDialog';

const PRIORITY_COLORS = {
  high: 'bg-danger-dim text-danger border-danger/40',
  medium: 'bg-warning-dim text-warning border-warning/40',
  low: 'bg-success-dim text-success border-success/40',
};

export interface PipelinesTabProps {
  opportunities: Opportunity[];
  opportunitiesLoading: boolean;
  opportunitiesError: string | null;
  risks: Risk[];
  risksLoading: boolean;
  risksError: string | null;
  /** The parent Customer id — used for "Add" (POST .../opportunities/
   * or .../risks/, or the .../accounts/<accountId>/ variants when
   * `accountId` is set below) and to refetch this tab's own lists
   * afterward. Same convention as ContactsTab's own `customerId` prop
   * — undefined only for a mock-data fallback with no real id to act
   * against, which disables "Add" rather than posting against a made-
   * up id. */
  customerId?: number;
  /** Set only when mounted on the standalone Account page — "Add" then
   * creates an account-level Opportunity/Risk scoped to this specific
   * account instead of an organization-level one. Omitted on the
   * Organization Details page's own Pipelines tab. */
  accountId?: number;
}

function entityOrgLabel(e: Opportunity | Risk): string {
  const label = companyLabel(e.companies);
  return e.account_name ? `${label} • ${e.account_name}` : label;
}

// Shared between the Organization Details page's own Pipelines tab and
// the standalone Account page's Pipelines tab — same shape either way
// (only the fetch that populates `opportunities`/`risks` differs: every
// organization-level record for one Customer vs. every account-level
// record for one Account — see fetchOpportunitiesForCustomer/
// fetchOpportunitiesForAccount and their Risk equivalents in
// customersSlice.ts), same "one shared component, not two page-local
// copies" reasoning as ContactsTab. Unlike the standalone Pipelines
// board (PipelinesPage.tsx), this is a compact table only — no Kanban
// board — same "embedded Details-page tabs are tables, not boards"
// convention as every other tab here (Contacts, Activities, ...).
export function PipelinesTab({
  opportunities,
  opportunitiesLoading,
  opportunitiesError,
  risks,
  risksLoading,
  risksError,
  customerId,
  accountId,
}: PipelinesTabProps) {
  const dispatch = useAppDispatch();
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'risks'>('opportunities');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingOpportunity, setIsAddingOpportunity] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [deletingOpportunity, setDeletingOpportunity] = useState<Opportunity | null>(null);

  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deletingRisk, setDeletingRisk] = useState<Risk | null>(null);

  // Client-side filter, not a server round-trip — both lists are
  // already fully loaded (the nested Customer/Account-scoped endpoints
  // turn pagination off, see CustomerOpportunityListView's own
  // docstring), same reasoning as ContactsTab's own search.
  const filteredOpportunities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter((o) => o.title.toLowerCase().includes(q));
  }, [opportunities, searchQuery]);

  const filteredRisks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return risks;
    return risks.filter((r) => r.title.toLowerCase().includes(q));
  }, [risks, searchQuery]);

  const opportunityStats = {
    total: opportunities.length,
    totalMrr: opportunities.reduce((sum, o) => sum + Number(o.mrr), 0),
    highPriority: opportunities.filter((o) => o.priority === 'high').length,
    closedWon: opportunities.filter((o) => o.stage === 'closed_won').length,
  };

  const riskStats = {
    total: risks.length,
    totalMrr: risks.reduce((sum, r) => sum + Number(r.mrr), 0),
    highPriority: risks.filter((r) => r.priority === 'high').length,
    realised: risks.filter((r) => r.stage === 'realised').length,
  };

  // Add is the one mutation that needs an explicit refetch — Edit/
  // Delete already patch `pipelineOpportunities`/`pipelineRisks`
  // directly via updateOpportunity/deleteOpportunity's (and Risk's own)
  // extraReducers, same "caller refetches only for create" reasoning as
  // ContactsTab's own refetch.
  const refetchOpportunities = () => {
    if (customerId === undefined) return;
    if (accountId !== undefined) {
      dispatch(fetchOpportunitiesForAccount({ customerId, accountId }));
    } else {
      dispatch(fetchOpportunitiesForCustomer(customerId));
    }
  };

  const refetchRisks = () => {
    if (customerId === undefined) return;
    if (accountId !== undefined) {
      dispatch(fetchRisksForAccount({ customerId, accountId }));
    } else {
      dispatch(fetchRisksForCustomer(customerId));
    }
  };

  // Only the Organization Details page's own Pipelines tab (accountId
  // undefined) rolls up more than one scope — its own organisation-
  // level records *and* every account's individual ones — so only it
  // needs a column to tell them apart. Same reasoning as ContactsTab's
  // own `showAccountColumn`.
  const showAccountColumn = accountId === undefined;
  const columnCount = showAccountColumn ? 5 : 4;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-6 pt-2">
      {/* Summary Banner */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface p-4 rounded-2xl border border-line-subtle shadow-sm shrink-0">
        {activeSubTab === 'opportunities' ? (
          <>
            <PipelineStatCard title="Total Opportunities" value={opportunityStats.total.toString()} subtext="Across every stage" icon={<Target className="w-4 h-4 text-accent" />} />
            <PipelineStatCard title="Pipeline MRR" value={`$${formatMoney(opportunityStats.totalMrr.toFixed(2))}`} subtext="Sum of open + won deals" icon={<DollarSign className="w-4 h-4 text-accent" />} />
            <PipelineStatCard title="High Priority" value={opportunityStats.highPriority.toString()} subtext="Needs attention" icon={<Flame className="w-4 h-4 text-warning" />} />
            <PipelineStatCard title="Closed Won" value={opportunityStats.closedWon.toString()} subtext="Deals won" icon={<CheckCircle2 className="w-4 h-4 text-success" />} />
          </>
        ) : (
          <>
            <PipelineStatCard title="Total Risks" value={riskStats.total.toString()} subtext="Across every stage" icon={<ShieldAlert className="w-4 h-4 text-danger" />} />
            <PipelineStatCard title="MRR At Risk" value={`$${formatMoney(riskStats.totalMrr.toFixed(2))}`} subtext="Sum of open + mitigated" icon={<DollarSign className="w-4 h-4 text-danger" />} />
            <PipelineStatCard title="High Priority" value={riskStats.highPriority.toString()} subtext="Needs attention" icon={<Flame className="w-4 h-4 text-warning" />} />
            <PipelineStatCard title="Realised" value={riskStats.realised.toString()} subtext="Risks that materialized" icon={<CheckCircle2 className="w-4 h-4 text-ink-muted" />} />
          </>
        )}
      </div>

      {/* Action Bar & Table */}
      <div className="max-w-7xl w-full mx-auto bg-surface rounded-2xl border border-line-subtle shadow-sm flex flex-col overflow-hidden">
        {/* Sub-tabs */}
        <div className="px-4 pt-3 flex items-center gap-4 border-b border-line-subtle">
          <button
            onClick={() => setActiveSubTab('opportunities')}
            className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeSubTab === 'opportunities' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
          >
            Opportunities <span className="text-[11px] font-bold text-ink-faint">({opportunities.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('risks')}
            className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeSubTab === 'risks' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
          >
            Risks <span className="text-[11px] font-bold text-ink-faint">({risks.length})</span>
          </button>
        </div>

        <div className="p-4 border-b border-line-subtle bg-surface flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSubTab === 'opportunities' ? 'Search opportunities by title...' : 'Search risks by title...'}
              className="w-full pl-10 pr-4 py-2 bg-subtle/30 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/10 placeholder:text-ink-faint"
            />
          </div>
          {activeSubTab === 'opportunities' ? (
            <button
              onClick={() => setIsAddingOpportunity(true)}
              disabled={customerId === undefined}
              title={customerId === undefined ? 'Reload this page from a real Accounts tab link to add an opportunity.' : undefined}
              className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Opportunity
            </button>
          ) : (
            <button
              onClick={() => setIsAddingRisk(true)}
              disabled={customerId === undefined}
              title={customerId === undefined ? 'Reload this page from a real Accounts tab link to add a risk.' : undefined}
              className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Risk
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface border-b border-line-subtle">
                <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">{activeSubTab === 'opportunities' ? 'Opportunity' : 'Risk'}</th>
                <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Stage</th>
                <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">MRR</th>
                {showAccountColumn && (
                  <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Account</th>
                )}
                <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Priority</th>
              </tr>
            </thead>
            <tbody>
              {activeSubTab === 'opportunities' &&
                filteredOpportunities.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setEditingOpportunity(o)}
                    className="hover:bg-subtle border-b border-line-subtle transition-all cursor-pointer group"
                  >
                    <td className="p-4 font-bold text-[13.5px] text-ink group-hover:text-accent transition-colors">{o.title}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-accent-dim text-accent text-[11.5px] font-bold">{o.stage_display}</span>
                    </td>
                    <td className="p-4 font-bold text-ink-muted">${formatMoney(o.mrr)}</td>
                    {showAccountColumn && (
                      <td className="p-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <EntityAvatar name={companyLabel(o.companies)} className="w-6 h-6 rounded-full text-[10px] shrink-0" />
                          <span className="text-ink-muted font-medium truncate max-w-[160px]">{entityOrgLabel(o)}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold capitalize ${PRIORITY_COLORS[o.priority]}`}>
                        {o.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              {activeSubTab === 'risks' &&
                filteredRisks.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setEditingRisk(r)}
                    className="hover:bg-subtle border-b border-line-subtle transition-all cursor-pointer group"
                  >
                    <td className="p-4 font-bold text-[13.5px] text-ink group-hover:text-accent transition-colors">{r.title}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-danger-dim text-danger text-[11.5px] font-bold">{r.stage_display}</span>
                    </td>
                    <td className="p-4 font-bold text-ink-muted">${formatMoney(r.mrr)}</td>
                    {showAccountColumn && (
                      <td className="p-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <EntityAvatar name={companyLabel(r.companies)} className="w-6 h-6 rounded-full text-[10px] shrink-0" />
                          <span className="text-ink-muted font-medium truncate max-w-[160px]">{entityOrgLabel(r)}</span>
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold capitalize ${PRIORITY_COLORS[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                  </tr>
                ))}

              {activeSubTab === 'opportunities' && !opportunitiesLoading && !opportunitiesError && filteredOpportunities.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="p-20 text-center text-ink-faint font-medium">
                    {opportunities.length === 0 ? 'No opportunities found.' : 'No opportunities match your search.'}
                  </td>
                </tr>
              )}
              {activeSubTab === 'opportunities' && opportunitiesLoading && (
                <tr>
                  <td colSpan={columnCount} className="p-20 text-center text-ink-faint font-medium">Loading opportunities…</td>
                </tr>
              )}
              {activeSubTab === 'opportunities' && opportunitiesError && (
                <tr>
                  <td colSpan={columnCount} className="p-20 text-center text-danger font-medium">{opportunitiesError}</td>
                </tr>
              )}

              {activeSubTab === 'risks' && !risksLoading && !risksError && filteredRisks.length === 0 && (
                <tr>
                  <td colSpan={columnCount} className="p-20 text-center text-ink-faint font-medium">
                    {risks.length === 0 ? 'No risks found.' : 'No risks match your search.'}
                  </td>
                </tr>
              )}
              {activeSubTab === 'risks' && risksLoading && (
                <tr>
                  <td colSpan={columnCount} className="p-20 text-center text-ink-faint font-medium">Loading risks…</td>
                </tr>
              )}
              {activeSubTab === 'risks' && risksError && (
                <tr>
                  <td colSpan={columnCount} className="p-20 text-center text-danger font-medium">{risksError}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddingOpportunity && (
        <OpportunityFormModal
          customerId={customerId}
          accountId={accountId}
          onClose={() => setIsAddingOpportunity(false)}
          onSaved={refetchOpportunities}
        />
      )}

      {editingOpportunity && (
        <OpportunityFormModal
          opportunity={editingOpportunity}
          onClose={() => setEditingOpportunity(null)}
          onDeleteRequest={() => {
            setDeletingOpportunity(editingOpportunity);
            setEditingOpportunity(null);
          }}
        />
      )}

      {deletingOpportunity && (
        <ConfirmDialog
          title={`Delete ${deletingOpportunity.title}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteOpportunity(deletingOpportunity.id)).unwrap();
          }}
          onClose={() => setDeletingOpportunity(null)}
        />
      )}

      {isAddingRisk && (
        <RiskFormModal
          customerId={customerId}
          accountId={accountId}
          onClose={() => setIsAddingRisk(false)}
          onSaved={refetchRisks}
        />
      )}

      {editingRisk && (
        <RiskFormModal
          risk={editingRisk}
          onClose={() => setEditingRisk(null)}
          onDeleteRequest={() => {
            setDeletingRisk(editingRisk);
            setEditingRisk(null);
          }}
        />
      )}

      {deletingRisk && (
        <ConfirmDialog
          title={`Delete ${deletingRisk.title}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteRisk(deletingRisk.id)).unwrap();
          }}
          onClose={() => setDeletingRisk(null)}
        />
      )}
    </div>
  );
}

function PipelineStatCard({ title, value, subtext, icon }: { title: string; value: string; subtext: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-subtle rounded-xl border border-line-subtle">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest leading-none mb-1">{title}</span>
        <span className="text-[20px] font-bold text-ink leading-tight">{value}</span>
        <span className="text-[11px] font-medium text-ink-faint pt-0.5">{subtext}</span>
      </div>
    </div>
  );
}
