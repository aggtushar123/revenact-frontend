import { useEffect, useMemo, useRef, useState } from 'react';
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
import { formatMoney } from '../../features/customers/formatters';
import type { Opportunity, Risk } from '../../features/customers/customersSlice';
import type { AppDispatch, RootState } from '../../store';

const PRIORITY_COLORS = {
  high: 'bg-danger-dim text-danger border-danger/40',
  medium: 'bg-warning-dim text-warning border-warning/40',
  low: 'bg-success-dim text-success border-success/40',
};

// ─── Opportunities — real data ──────────────────────────────────────
// Matches Opportunity.Stage on the backend exactly (services/customers/
// models.py), same order as the board's own 6 Kanban columns.
const STAGE_COLUMNS: { stage: Opportunity['stage']; title: string }[] = [
  { stage: 'discovery', title: 'Discovery' },
  { stage: 'qualification', title: 'Qualification' },
  { stage: 'solution_validation', title: 'Solution Validation' },
  { stage: 'proposal_price_review', title: 'Proposal / Price Review' },
  { stage: 'negotiation', title: 'Negotiation' },
  { stage: 'closed_won', title: 'Closed Won' },
];

function opportunityOrgLabel(o: Opportunity): string {
  return o.account_name ? `${o.company_name} • ${o.account_name}` : o.company_name;
}

function OpportunityCard({
  opportunity,
  onDragStart,
  onClick,
}: {
  opportunity: Opportunity;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, opportunity.id)}
      onClick={onClick}
      className="bg-surface border border-line/80 rounded-lg p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-accent/40 transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-[0.98] select-none"
    >
      <h4 className="text-[12.5px] font-bold text-ink leading-snug mb-2.5">{opportunity.title}</h4>
      <div className="text-[12px] font-bold text-accent mb-3">MRR: ${formatMoney(opportunity.mrr)}</div>
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <EntityAvatar name={opportunity.company_name} className="w-5 h-5 rounded-full text-[9px]" />
          <span className="text-[11.5px] text-ink-muted font-semibold truncate max-w-[120px]">{opportunityOrgLabel(opportunity)}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold capitalize shrink-0 ${PRIORITY_COLORS[opportunity.priority]}`}>
          {opportunity.priority}
        </span>
      </div>
    </div>
  );
}

function OpportunityColumn({
  stage,
  title,
  opportunities,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAddClick,
  isDragOver,
}: {
  stage: Opportunity['stage'];
  title: string;
  opportunities: Opportunity[];
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent, stage: Opportunity['stage']) => void;
  onDrop: (e: React.DragEvent, stage: Opportunity['stage']) => void;
  onCardClick: (opportunity: Opportunity) => void;
  onAddClick: (stage: Opportunity['stage']) => void;
  isDragOver: boolean;
}) {
  return (
    <div
      className={`flex flex-col w-[220px] shrink-0 rounded-xl transition-colors duration-150 ${isDragOver ? 'bg-accent-dim/60' : 'bg-subtle/60'}`}
      onDragOver={e => { e.preventDefault(); onDragOver(e, stage); }}
      onDrop={e => onDrop(e, stage)}
    >
      <div className="px-3 pt-3 pb-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-ink-muted tracking-tight">{title}</span>
          <span className="text-[11px] text-ink-faint font-bold">({opportunities.length})</span>
        </div>
        <button
          onClick={() => onAddClick(stage)}
          className="p-0.5 text-ink-faint hover:text-ink-muted transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      {isDragOver && (
        <div className="mx-2 mb-2 h-1 bg-accent rounded-full opacity-60 transition-all" />
      )}

      <div className="flex flex-col gap-2.5 px-2 pb-3 flex-1 min-h-[60px]">
        {opportunities.map(o => (
          <OpportunityCard key={o.id} opportunity={o} onDragStart={onDragStart} onClick={() => onCardClick(o)} />
        ))}
        {opportunities.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-line rounded-lg flex items-center justify-center min-h-[80px] text-[12px] text-ink-faint font-semibold">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunityBoardView({
  opportunities,
  onCardClick,
  onAddClick,
}: {
  opportunities: Opportunity[];
  onCardClick: (opportunity: Opportunity) => void;
  onAddClick: (stage: Opportunity['stage']) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [dragOverStage, setDragOverStage] = useState<Opportunity['stage'] | null>(null);
  const draggingId = useRef<number | null>(null);

  const handleDragStart = (_e: React.DragEvent, id: number) => {
    draggingId.current = id;
  };

  const handleDragOver = (_e: React.DragEvent, stage: Opportunity['stage']) => {
    setDragOverStage(stage);
  };

  const handleDrop = (_e: React.DragEvent, targetStage: Opportunity['stage']) => {
    const id = draggingId.current;
    draggingId.current = null;
    setDragOverStage(null);
    if (id === null) return;
    const current = opportunities.find(o => o.id === id);
    if (!current || current.stage === targetStage) return;
    dispatch(updateOpportunity({ id, stage: targetStage }));
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }} onDragEnd={handleDragEnd}>
      {STAGE_COLUMNS.map(col => (
        <OpportunityColumn
          key={col.stage}
          stage={col.stage}
          title={col.title}
          opportunities={opportunities.filter(o => o.stage === col.stage)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={onCardClick}
          onAddClick={onAddClick}
          isDragOver={dragOverStage === col.stage}
        />
      ))}
    </div>
  );
}

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
                  <EntityAvatar name={o.company_name} className="w-6 h-6 rounded-full text-[10px]" />
                  <span className="text-ink-muted font-medium truncate max-w-[140px]">{opportunityOrgLabel(o)}</span>
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

// ─── Risks — real data ──────────────────────────────────────────────
// Matches Risk.Stage on the backend exactly (services/customers/
// models.py), same order as the board's own 4 Kanban columns.
const RISK_STAGE_COLUMNS: { stage: Risk['stage']; title: string }[] = [
  { stage: 'open', title: 'Open' },
  { stage: 'mitigated', title: 'Mitigated' },
  { stage: 'realised', title: 'Realised' },
  { stage: 'abandoned', title: 'Abandoned' },
];

function riskOrgLabel(r: Risk): string {
  return r.account_name ? `${r.company_name} • ${r.account_name}` : r.company_name;
}

function RiskCard({
  risk,
  onDragStart,
  onClick,
}: {
  risk: Risk;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, risk.id)}
      onClick={onClick}
      className="bg-surface border border-line/80 rounded-lg p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-accent/40 transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-[0.98] select-none"
    >
      <h4 className="text-[12.5px] font-bold text-ink leading-snug mb-2.5">{risk.title}</h4>
      <div className="text-[12px] font-bold text-accent mb-3">MRR: ${formatMoney(risk.mrr)}</div>
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <EntityAvatar name={risk.company_name} className="w-5 h-5 rounded-full text-[9px]" />
          <span className="text-[11.5px] text-ink-muted font-semibold truncate max-w-[120px]">{riskOrgLabel(risk)}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold capitalize shrink-0 ${PRIORITY_COLORS[risk.priority]}`}>
          {risk.priority}
        </span>
      </div>
    </div>
  );
}

function RiskColumn({
  stage,
  title,
  risks,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAddClick,
  isDragOver,
}: {
  stage: Risk['stage'];
  title: string;
  risks: Risk[];
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent, stage: Risk['stage']) => void;
  onDrop: (e: React.DragEvent, stage: Risk['stage']) => void;
  onCardClick: (risk: Risk) => void;
  onAddClick: (stage: Risk['stage']) => void;
  isDragOver: boolean;
}) {
  return (
    <div
      className={`flex flex-col w-[220px] shrink-0 rounded-xl transition-colors duration-150 ${isDragOver ? 'bg-accent-dim/60' : 'bg-subtle/60'}`}
      onDragOver={e => { e.preventDefault(); onDragOver(e, stage); }}
      onDrop={e => onDrop(e, stage)}
    >
      <div className="px-3 pt-3 pb-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-ink-muted tracking-tight">{title}</span>
          <span className="text-[11px] text-ink-faint font-bold">({risks.length})</span>
        </div>
        <button
          onClick={() => onAddClick(stage)}
          className="p-0.5 text-ink-faint hover:text-ink-muted transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      {isDragOver && (
        <div className="mx-2 mb-2 h-1 bg-accent rounded-full opacity-60 transition-all" />
      )}

      <div className="flex flex-col gap-2.5 px-2 pb-3 flex-1 min-h-[60px]">
        {risks.map(r => (
          <RiskCard key={r.id} risk={r} onDragStart={onDragStart} onClick={() => onCardClick(r)} />
        ))}
        {risks.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-line rounded-lg flex items-center justify-center min-h-[80px] text-[12px] text-ink-faint font-semibold">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function RiskBoardView({
  risks,
  onCardClick,
  onAddClick,
}: {
  risks: Risk[];
  onCardClick: (risk: Risk) => void;
  onAddClick: (stage: Risk['stage']) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const [dragOverStage, setDragOverStage] = useState<Risk['stage'] | null>(null);
  const draggingId = useRef<number | null>(null);

  const handleDragStart = (_e: React.DragEvent, id: number) => {
    draggingId.current = id;
  };

  const handleDragOver = (_e: React.DragEvent, stage: Risk['stage']) => {
    setDragOverStage(stage);
  };

  const handleDrop = (_e: React.DragEvent, targetStage: Risk['stage']) => {
    const id = draggingId.current;
    draggingId.current = null;
    setDragOverStage(null);
    if (id === null) return;
    const current = risks.find(r => r.id === id);
    if (!current || current.stage === targetStage) return;
    dispatch(updateRisk({ id, stage: targetStage }));
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }} onDragEnd={handleDragEnd}>
      {RISK_STAGE_COLUMNS.map(col => (
        <RiskColumn
          key={col.stage}
          stage={col.stage}
          title={col.title}
          risks={risks.filter(r => r.stage === col.stage)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onCardClick={onCardClick}
          onAddClick={onAddClick}
          isDragOver={dragOverStage === col.stage}
        />
      ))}
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
                  <EntityAvatar name={r.company_name} className="w-6 h-6 rounded-full text-[10px]" />
                  <span className="text-ink-muted font-medium truncate max-w-[140px]">{riskOrgLabel(r)}</span>
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
              <span className="px-2 py-0.5 rounded border border-line text-[10px] font-bold text-ink-muted bg-subtle">COUNT</span>
              <span className="px-2 py-0.5 rounded border border-line text-[10px] font-bold text-ink-faint bg-subtle">MRR</span>
            </span>
          </div>
          <div className="flex items-center gap-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span className="text-[12px] font-bold text-ink-muted">Opportunities</span>
              </div>
              <div className="text-[22px] font-bold text-ink leading-none">{opportunities.length}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-danger"></div>
                <span className="text-[12px] font-bold text-ink-muted">Risks</span>
              </div>
              <div className="text-[22px] font-bold text-ink leading-none">{risks.length}</div>
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
            <RiskBoardView risks={filteredRisks} onCardClick={setEditingRisk} onAddClick={handleAddRiskClick} />
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
          <OpportunityBoardView
            opportunities={filteredOpportunities}
            onCardClick={setEditingOpportunity}
            onAddClick={handleAddClick}
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
