import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Plus, SlidersHorizontal, Pencil } from 'lucide-react';
import { EntityAvatar } from '../../components/shared';
import { OpportunityFormModal } from '../../components/pipelines/OpportunityFormModal';
import { RiskFormModal } from '../../components/pipelines/RiskFormModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import {
  fetchOpportunities,
  fetchRisks,
  fetchCustomers,
  updateOpportunity,
  deleteOpportunity,
  updateRisk,
  deleteRisk,
} from '../../features/customers/customersSlice';
import { formatMoney, companyLabel } from '../../features/customers/formatters';
import { KanbanBoard } from '../../components/pipelines/KanbanBoard';
import {
  OPPORTUNITY_STAGE_COLUMNS,
  RISK_STAGE_COLUMNS,
  PRIORITY_COLORS,
  pipelineOrgLabel,
} from '../../components/pipelines/kanbanConfig';
import type { Opportunity, Risk } from '../../features/customers/customersSlice';
import type { AppDispatch, RootState } from '../../store';

// Same toggle-pill look/behavior as the Organizations page's own
// MetricsPanel (COUNT/MRR/ARR) — a private local copy rather than an
// import since that one isn't exported and this only needs two states.
function TabPill({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer transition-all duration-200 ${
        isActive
          ? 'text-accent bg-accent-dim border-accent/40 shadow-sm'
          : 'text-ink-faint border-line bg-subtle hover:text-ink-muted'
      }`}
    >
      {label}
    </button>
  );
}

// The Kanban board itself (cards, columns, drag-and-drop) is shared
// with the embedded Pipelines tab on the Organization/Account Details
// pages — see components/pipelines/KanbanBoard.tsx. Only each entity's
// own flat-table List view stays here, one per entity for the same
// reason ContactsTable/OrganizationsTable aren't merged into one
// generic table: the column sets genuinely differ (Stage/MRR/
// Organization/Priority isn't reused by anything else).

function OpportunityListView({
  opportunities,
  onRowClick,
}: {
  opportunities: Opportunity[];
  onRowClick: (opportunity: Opportunity) => void;
}) {
  return (
    <div className="bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-subtle border-b border-line-subtle">
            <th className="text-left px-5 py-3 font-bold text-ink-muted tracking-tight">Opportunity</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">Stage</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">MRR</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">Organization</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">Priority</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((o, i) => (
            <tr
              key={o.id}
              onClick={() => onRowClick(o)}
              className={`border-b border-line-subtle hover:bg-accent-dim/30 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-subtle/30'}`}
            >
              <td className="px-5 py-3.5 font-semibold text-ink">{o.title}</td>
              <td className="px-4 py-3.5">
                <span className="px-2.5 py-1 rounded-full bg-accent-dim text-accent text-[11.5px] font-bold">{o.stage_display}</span>
              </td>
              <td className="px-4 py-3.5 font-bold text-ink-muted">${formatMoney(o.mrr)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <EntityAvatar name={companyLabel(o.companies)} className="w-6 h-6 rounded-full text-[10px]" />
                  <span className="text-ink-muted font-medium truncate max-w-[140px]">{pipelineOrgLabel(o)}</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className={`px-2 py-0.5 rounded border text-[11px] font-bold capitalize ${PRIORITY_COLORS[o.priority]}`}>
                  {o.priority}
                </span>
              </td>
            </tr>
          ))}
          {opportunities.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-ink-faint font-medium">No opportunities found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RiskListView({
  risks,
  onRowClick,
}: {
  risks: Risk[];
  onRowClick: (risk: Risk) => void;
}) {
  return (
    <div className="bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-subtle border-b border-line-subtle">
            <th className="text-left px-5 py-3 font-bold text-ink-muted tracking-tight">Risk</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">Stage</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">MRR</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">Organization</th>
            <th className="text-left px-4 py-3 font-bold text-ink-muted tracking-tight">Priority</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((r, i) => (
            <tr
              key={r.id}
              onClick={() => onRowClick(r)}
              className={`border-b border-line-subtle hover:bg-accent-dim/30 transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-subtle/30'}`}
            >
              <td className="px-5 py-3.5 font-semibold text-ink">{r.title}</td>
              <td className="px-4 py-3.5">
                <span className="px-2.5 py-1 rounded-full bg-accent-dim text-accent text-[11.5px] font-bold">{r.stage_display}</span>
              </td>
              <td className="px-4 py-3.5 font-bold text-ink-muted">${formatMoney(r.mrr)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <EntityAvatar name={companyLabel(r.companies)} className="w-6 h-6 rounded-full text-[10px]" />
                  <span className="text-ink-muted font-medium truncate max-w-[140px]">{pipelineOrgLabel(r)}</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <span className={`px-2 py-0.5 rounded border text-[11px] font-bold capitalize ${PRIORITY_COLORS[r.priority]}`}>
                  {r.priority}
                </span>
              </td>
            </tr>
          ))}
          {risks.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-ink-faint font-medium">No risks found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export function PipelinesPage({ view }: { view: 'list' | 'board' }) {
  const dispatch = useDispatch<AppDispatch>();
  const { opportunities, opportunitiesLoading, opportunitiesError, risks, risksLoading, risksError, customers } =
    useSelector((state: RootState) => state.customers);
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'risks'>('opportunities');
  const [searchQuery, setSearchQuery] = useState('');
  // Overview banner's own COUNT/MRR toggle — previously two static
  // labels that did nothing; MRR never actually rendered.
  const [overviewTab, setOverviewTab] = useState<'count' | 'mrr'>('count');

  const [isAdding, setIsAdding] = useState(false);
  const [addDefaultStage, setAddDefaultStage] = useState<Opportunity['stage']>('discovery');
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [deletingOpportunity, setDeletingOpportunity] = useState<Opportunity | null>(null);

  const [isAddingRisk, setIsAddingRisk] = useState(false);
  const [addRiskDefaultStage, setAddRiskDefaultStage] = useState<Risk['stage']>('open');
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deletingRisk, setDeletingRisk] = useState<Risk | null>(null);

  useEffect(() => {
    dispatch(fetchOpportunities());
    dispatch(fetchRisks());
    // Company picker for Add Opportunity/Add Risk — same source as the
    // standalone Contacts page's own Add Contact.
    dispatch(fetchCustomers());
  }, [dispatch]);

  const companies = useMemo(
    () => customers.map((c) => ({ id: c.id, name: c.name })),
    [customers]
  );

  // Overview banner's own totals — every opportunity/risk regardless of
  // the search box above (same "unfiltered overall total" reasoning as
  // MetricsPanel's own totalCount), so typing in Search never makes
  // these numbers dip.
  const totalOpportunityMrr = useMemo(
    () => opportunities.reduce((sum, o) => sum + Number(o.mrr), 0),
    [opportunities]
  );
  const totalRiskMrr = useMemo(() => risks.reduce((sum, r) => sum + Number(r.mrr), 0), [risks]);

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

  const handleAddClick = (stage: Opportunity['stage'] = 'discovery') => {
    setAddDefaultStage(stage);
    setIsAdding(true);
  };

  const handleAddRiskClick = (stage: Risk['stage'] = 'open') => {
    setAddRiskDefaultStage(stage);
    setIsAddingRisk(true);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">

      {/* Sub-tabs */}
      <div className="flex items-center gap-4 border-b border-line-subtle shrink-0">
        <button
          onClick={() => setActiveSubTab('opportunities')}
          className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeSubTab === 'opportunities' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
        >
          Opportunities
        </button>
        <button
          onClick={() => setActiveSubTab('risks')}
          className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeSubTab === 'risks' ? 'text-accent border-accent' : 'text-ink-faint border-transparent hover:text-ink-muted'}`}
        >
          Risks
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-surface rounded-xl border border-line-subtle shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 shrink-0 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold text-ink-faint uppercase tracking-widest mb-3 flex items-center gap-3">
            Pipelines Overview
            <span className="flex items-center gap-2 ml-1">
              <TabPill label="COUNT" isActive={overviewTab === 'count'} onClick={() => setOverviewTab('count')} />
              <TabPill label="MRR" isActive={overviewTab === 'mrr'} onClick={() => setOverviewTab('mrr')} />
            </span>
          </div>
          <div className="flex items-center gap-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-[12px] font-bold text-ink-muted">Opportunities</span>
              </div>
              <div className="text-[22px] font-bold text-ink leading-none">
                {overviewTab === 'count' ? opportunities.length : `$${formatMoney(String(totalOpportunityMrr))}`}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-danger"></div>
                <span className="text-[12px] font-bold text-ink-muted">Risks</span>
              </div>
              <div className="text-[22px] font-bold text-ink leading-none">
                {overviewTab === 'count' ? risks.length : `$${formatMoney(String(totalRiskMrr))}`}
              </div>
            </div>
          </div>
        </div>
        <button className="p-1.5 text-ink-faint hover:text-ink-muted hover:bg-subtle rounded-md transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Search + Action buttons inline */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 bg-surface placeholder-ink-faint font-medium"
            placeholder={activeSubTab === 'opportunities' ? 'Search opportunities by title' : 'Search risks by title'}
          />
        </div>
        {activeSubTab === 'opportunities' ? (
          <button
            onClick={() => handleAddClick()}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-[13px] font-bold hover:bg-accent transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            Add Opportunity
          </button>
        ) : (
          <button
            onClick={() => handleAddRiskClick()}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg text-[13px] font-bold hover:bg-accent transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5px]" />
            Add Risk
          </button>
        )}
        <button className="flex items-center gap-1.5 px-3 py-2.5 border border-line rounded-lg text-[12.5px] font-bold text-ink-muted hover:bg-subtle transition-colors bg-surface">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-accent font-bold">1</span>
        </button>
      </div>

      {/* Board / List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeSubTab === 'risks' ? (
          risksLoading && risks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
              Loading risks…
            </div>
          ) : risksError ? (
            <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">
              {risksError}
            </div>
          ) : view === 'board' ? (
            <KanbanBoard
              columns={RISK_STAGE_COLUMNS}
              entities={filteredRisks}
              onCardClick={setEditingRisk}
              onAddClick={handleAddRiskClick}
              onMove={(id, stage) => dispatch(updateRisk({ id, stage }))}
            />
          ) : (
            <RiskListView risks={filteredRisks} onRowClick={setEditingRisk} />
          )
        ) : opportunitiesLoading && opportunities.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
            Loading opportunities…
          </div>
        ) : opportunitiesError ? (
          <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">
            {opportunitiesError}
          </div>
        ) : view === 'board' ? (
          <KanbanBoard
            columns={OPPORTUNITY_STAGE_COLUMNS}
            entities={filteredOpportunities}
            onCardClick={setEditingOpportunity}
            onAddClick={handleAddClick}
            onMove={(id, stage) => dispatch(updateOpportunity({ id, stage }))}
          />
        ) : (
          <OpportunityListView opportunities={filteredOpportunities} onRowClick={setEditingOpportunity} />
        )}
      </div>

      {isAdding && (
        <OpportunityFormModal
          companies={companies}
          defaultStage={addDefaultStage}
          onClose={() => setIsAdding(false)}
        />
      )}

      {editingOpportunity && (
        <OpportunityFormModal
          opportunity={editingOpportunity}
          companies={companies}
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
          companies={companies}
          defaultStage={addRiskDefaultStage}
          onClose={() => setIsAddingRisk(false)}
        />
      )}

      {editingRisk && (
        <RiskFormModal
          risk={editingRisk}
          companies={companies}
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
