import { useState, useRef } from 'react';
import { Search, Plus, SlidersHorizontal, Pencil } from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────

interface PipelineCard {
  id: string;
  title: string;
  mrr: string;
  org: string;
  orgColor: string;
  orgInitials: string;
  priority?: 'high' | 'medium' | 'low';
}

interface Column {
  id: string;
  title: string;
  count: number;
  cards: PipelineCard[];
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'discovery',
    title: 'Discovery',
    count: 12,
    cards: [
      { id: 'c1', title: 'Teamtailor Expansion – Global Talent Hub Rollout', mrr: '$57,450.00', org: 'IBM', orgColor: 'bg-blue-600', orgInitials: 'IB', priority: 'high' },
      { id: 'c2', title: 'Potential Upsell Opportunity', mrr: '$28,000.00', org: 'Basecamp', orgColor: 'bg-slate-600', orgInitials: 'BC', priority: 'medium' },
      { id: 'c3', title: 'Digital First Account Expansion', mrr: '$18,500.00', org: 'Shopify', orgColor: 'bg-green-600', orgInitials: 'SH', priority: 'low' },
    ]
  },
  {
    id: 'qualification',
    title: 'Qualification',
    count: 1,
    cards: [
      { id: 'c4', title: 'Renewal Expansion Opportunity', mrr: '$30,000.00', org: 'Apple EMEA', orgColor: 'bg-gray-800', orgInitials: 'AE', priority: 'high' },
    ]
  },
  {
    id: 'solution-validation',
    title: 'Solution Validation',
    count: 2,
    cards: [
      { id: 'c5', title: 'Monthly Upsell Opportunity', mrr: '$10,000.00', org: 'Apple Inc', orgColor: 'bg-gray-800', orgInitials: 'AI', priority: 'medium' },
      { id: 'c6', title: 'Potential Upsell Expansion Opportunity', mrr: '$20,000.00', org: 'GreenLeaf Organics Wholesale Division', orgColor: 'bg-teal-600', orgInitials: 'GO', priority: 'low' },
    ]
  },
  {
    id: 'proposal',
    title: 'Proposal / Price Review',
    count: 1,
    cards: [
      { id: 'c7', title: 'December 2025 – Renewal Expansion Opportunity', mrr: '$25,000.00', org: 'Apple EMEA', orgColor: 'bg-gray-800', orgInitials: 'AE', priority: 'high' },
    ]
  },
  {
    id: 'negotiation',
    title: 'Negotiation',
    count: 3,
    cards: [
      { id: 'c8', title: 'New Support Tier Update Opportunity', mrr: '$15,000.00', org: 'EOS Software Engineering Division', orgColor: 'bg-purple-600', orgInitials: 'EO', priority: 'medium' },
      { id: 'c9', title: 'Teamtailor – AI Candidate Matching Rollout', mrr: '$20,000.00', org: 'Mailchimp', orgColor: 'bg-yellow-500', orgInitials: 'MC', priority: 'low' },
    ]
  },
  {
    id: 'closed-won',
    title: 'Closed Won',
    count: 2,
    cards: [
      { id: 'c10', title: 'Enterprise Platform Expansion Q4', mrr: '$45,000.00', org: 'Salesforce', orgColor: 'bg-sky-600', orgInitials: 'SF', priority: 'high' },
    ]
  },
];

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-600 border-red-200',
  medium: 'bg-amber-100 text-amber-600 border-amber-200',
  low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
};

const RISK_COLUMNS: Column[] = [
  {
    id: 'open',
    title: 'Open',
    count: 5,
    cards: [
      { id: 'r1', title: 'HIGH TOUCH ACCOUNT AT RISK!', mrr: '$0.00', org: 'Digital Operations', orgColor: 'bg-red-500', orgInitials: 'DO', priority: 'high' },
      { id: 'r2', title: 'HIGH TOUCH ACCOUNT AT RISK!', mrr: '$0.00', org: 'Culinary Innovation Lab (HCIL)', orgColor: 'bg-orange-500', orgInitials: 'CI', priority: 'high' },
      { id: 'r3', title: 'Downgrade Risk', mrr: '$12,000.00', org: 'Pacific Retail Ventures', orgColor: 'bg-amber-600', orgInitials: 'PR', priority: 'medium' },
      { id: 'r4', title: 'Renewal Risk – Contract Expiry', mrr: '$8,500.00', org: 'Horizon Analytics Group', orgColor: 'bg-rose-600', orgInitials: 'HA', priority: 'high' },
      { id: 'r5', title: 'Disengagement Risk Q1', mrr: '$5,000.00', org: 'Sunrise Logistics', orgColor: 'bg-red-400', orgInitials: 'SL', priority: 'medium' },
    ]
  },
  {
    id: 'mitigated',
    title: 'Mitigated',
    count: 1,
    cards: [
      { id: 'r6', title: 'Chrun Risk', mrr: '$30,000.00', org: 'Digital Operations', orgColor: 'bg-red-500', orgInitials: 'DO', priority: 'medium' },
    ]
  },
  {
    id: 'realised',
    title: 'Realised',
    count: 1,
    cards: [
      { id: 'r7', title: 'Churn Risk', mrr: '$20,000.00', org: 'EMEA Operations', orgColor: 'bg-purple-600', orgInitials: 'EO', priority: 'high' },
    ]
  },
  {
    id: 'abandoned',
    title: 'Abandoned',
    count: 0,
    cards: []
  },
];


// ─── List View ─────────────────────────────────────────────────────────────

function ListView({ columns }: { columns: Column[] }) {
  const allCards = columns.flatMap(col => col.cards.map(c => ({ ...c, stage: col.title })));
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-5 py-3 font-bold text-gray-500 tracking-tight">Opportunity</th>
            <th className="text-left px-4 py-3 font-bold text-gray-500 tracking-tight">Stage</th>
            <th className="text-left px-4 py-3 font-bold text-gray-500 tracking-tight">MRR</th>
            <th className="text-left px-4 py-3 font-bold text-gray-500 tracking-tight">Organization</th>
            <th className="text-left px-4 py-3 font-bold text-gray-500 tracking-tight">Priority</th>
          </tr>
        </thead>
        <tbody>
          {allCards.map((card, i) => (
            <tr key={card.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
              <td className="px-5 py-3.5 font-semibold text-[#334155]">{card.title}</td>
              <td className="px-4 py-3.5">
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11.5px] font-bold">{card.stage}</span>
              </td>
              <td className="px-4 py-3.5 font-bold text-gray-700">{card.mrr}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${card.orgColor} flex items-center justify-center text-white text-[10px] font-bold`}>{card.orgInitials}</div>
                  <span className="text-gray-600 font-medium truncate max-w-[140px]">{card.org}</span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                {card.priority && (
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-bold capitalize ${PRIORITY_COLORS[card.priority]}`}>
                    {card.priority}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Kanban Card ───────────────────────────────────────────────────────────

function KanbanCard({
  card,
  onDragStart,
}: {
  card: PipelineCard;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, card.id)}
      className="bg-white border border-gray-200/80 rounded-lg p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-indigo-200 transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-[0.98] select-none"
    >
      <h4 className="text-[12.5px] font-bold text-[#334155] leading-snug mb-2.5">{card.title}</h4>
      <div className="text-[12px] font-bold text-[#6D72D6] mb-3">MRR: {card.mrr}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full ${card.orgColor} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
            {card.orgInitials}
          </div>
          <span className="text-[11.5px] text-gray-500 font-semibold truncate max-w-[120px]">{card.org}</span>
        </div>
        {card.priority && (
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold capitalize ${PRIORITY_COLORS[card.priority]}`}>
            {card.priority}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Kanban Column ─────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: {
  column: Column;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDragOver: (e: React.DragEvent, colId: string) => void;
  onDrop: (e: React.DragEvent, colId: string) => void;
  isDragOver: boolean;
}) {
  return (
    <div
      className={`flex flex-col w-[220px] shrink-0 rounded-xl transition-colors duration-150 ${isDragOver ? 'bg-indigo-50/60' : 'bg-gray-50/60'}`}
      onDragOver={e => { e.preventDefault(); onDragOver(e, column.id); }}
      onDrop={e => onDrop(e, column.id)}
    >
      {/* Column header */}
      <div className="px-3 pt-3 pb-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-bold text-gray-600 tracking-tight">{column.title}</span>
          <span className="text-[11px] text-gray-400 font-bold">({column.cards.length}/{column.count})</span>
        </div>
        <button className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
          <Plus className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      {/* Drop zone indicator */}
      {isDragOver && (
        <div className="mx-2 mb-2 h-1 bg-indigo-400 rounded-full opacity-60 transition-all" />
      )}

      {/* Cards */}
      <div className="flex flex-col gap-2.5 px-2 pb-3 flex-1 min-h-[60px]">
        {column.cards.map(card => (
          <KanbanCard key={card.id} card={card} onDragStart={onDragStart} />
        ))}
        {column.cards.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center min-h-[80px] text-[12px] text-gray-300 font-semibold">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Board View ────────────────────────────────────────────────────────────

function BoardView() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const draggingCardId = useRef<string | null>(null);

  const handleDragStart = (_e: React.DragEvent, cardId: string) => {
    draggingCardId.current = cardId;
  };

  const handleDragOver = (_e: React.DragEvent, colId: string) => {
    setDragOverColId(colId);
  };

  const handleDrop = (_e: React.DragEvent, targetColId: string) => {
    const cardId = draggingCardId.current;
    if (!cardId) return;

    setColumns(prev => {
      // Find source column and card
      let movedCard: PipelineCard | undefined;
      const updated = prev.map(col => {
        const idx = col.cards.findIndex(c => c.id === cardId);
        if (idx !== -1) {
          movedCard = col.cards[idx];
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }
        return col;
      });
      if (!movedCard) return prev;
      // Add to target column
      return updated.map(col => {
        if (col.id === targetColId) {
          return { ...col, cards: [...col.cards, movedCard!] };
        }
        return col;
      });
    });

    draggingCardId.current = null;
    setDragOverColId(null);
  };

  const handleDragEnd = () => {
    draggingCardId.current = null;
    setDragOverColId(null);
  };

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4"
      style={{ minHeight: 'calc(100vh - 260px)' }}
      onDragEnd={handleDragEnd}
    >
      {columns.map(col => (
        <KanbanColumn
          key={col.id}
          column={col}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragOver={dragOverColId === col.id}
        />
      ))}
    </div>
  );
}

// ─── Risk Board View ───────────────────────────────────────────────────────

function RiskBoardView() {
  const [columns, setColumns] = useState<Column[]>(RISK_COLUMNS);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const draggingCardId = useRef<string | null>(null);

  const handleDragStart = (_e: React.DragEvent, cardId: string) => {
    draggingCardId.current = cardId;
  };

  const handleDragOver = (_e: React.DragEvent, colId: string) => {
    setDragOverColId(colId);
  };

  const handleDrop = (_e: React.DragEvent, targetColId: string) => {
    const cardId = draggingCardId.current;
    if (!cardId) return;
    setColumns(prev => {
      let movedCard: PipelineCard | undefined;
      const updated = prev.map(col => {
        const idx = col.cards.findIndex(c => c.id === cardId);
        if (idx !== -1) { movedCard = col.cards[idx]; return { ...col, cards: col.cards.filter(c => c.id !== cardId) }; }
        return col;
      });
      if (!movedCard) return prev;
      return updated.map(col => col.id === targetColId ? { ...col, cards: [...col.cards, movedCard!] } : col);
    });
    draggingCardId.current = null;
    setDragOverColId(null);
  };

  const handleDragEnd = () => { draggingCardId.current = null; setDragOverColId(null); };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }} onDragEnd={handleDragEnd}>
      {columns.map(col => (
        <KanbanColumn key={col.id} column={col} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} isDragOver={dragOverColId === col.id} />
      ))}
    </div>
  );
}



export function PipelinesPage({ view }: { view: 'list' | 'board' }) {
  const [activeSubTab, setActiveSubTab] = useState<'opportunities' | 'risks'>('opportunities');

  const totalOpportunities = INITIAL_COLUMNS.reduce((s, c) => s + c.cards.length, 0);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">

      {/* Sub-tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100 shrink-0">
        <button
          onClick={() => setActiveSubTab('opportunities')}
          className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeSubTab === 'opportunities' ? 'text-[#6D72D6] border-[#6D72D6]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          Opportunities
        </button>
        <button
          onClick={() => setActiveSubTab('risks')}
          className={`pb-2.5 text-[13px] font-bold border-b-2 transition-colors ${activeSubTab === 'risks' ? 'text-[#6D72D6] border-[#6D72D6]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
        >
          Risks
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4 shrink-0 flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-3">
            Pipelines Overview
            <span className="flex items-center gap-2 ml-1">
              <span className="px-2 py-0.5 rounded border border-gray-200 text-[10px] font-bold text-gray-500 bg-gray-50">COUNT</span>
              <span className="px-2 py-0.5 rounded border border-gray-200 text-[10px] font-bold text-gray-400 bg-gray-50">MRR</span>
            </span>
          </div>
          <div className="flex items-center gap-10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[12px] font-bold text-gray-600">Opportunities</span>
              </div>
              <div className="text-[22px] font-bold text-gray-800 leading-none">{totalOpportunities}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[12px] font-bold text-gray-600">Risks</span>
              </div>
              <div className="text-[22px] font-bold text-gray-800 leading-none">7</div>
            </div>
          </div>
        </div>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Search + Action buttons inline */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white placeholder-gray-400 font-medium"
            placeholder="Search by name, Velaris ID or External ID"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#6D72D6] text-white rounded-lg text-[13px] font-bold hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap">
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          + Add Pipeline
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-[12.5px] font-bold text-gray-500 hover:bg-gray-50 transition-colors bg-white">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[#6D72D6] font-bold">1</span>
        </button>
      </div>

      {/* Board / List */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeSubTab === 'risks' ? (
          view === 'board' ? <RiskBoardView /> : <ListView columns={RISK_COLUMNS} />
        ) : (
          view === 'board' ? <BoardView /> : <ListView columns={INITIAL_COLUMNS} />
        )}
      </div>
    </div>
  );
}
