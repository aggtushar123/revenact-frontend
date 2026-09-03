import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { EntityAvatar } from '../shared/EntityAvatar';
import { formatMoney, companyLabel } from '../../features/customers/formatters';
import { PRIORITY_COLORS, pipelineOrgLabel } from './kanbanConfig';
import type { PipelineCardEntity } from './kanbanConfig';

// Shared Kanban rendering for both the standalone Pipelines board
// (pages/pipelines/PipelinesPage.tsx) and the embedded Pipelines tab
// (components/shared/PipelinesTab.tsx, on the Organization/Account
// Details pages) — Opportunity and Risk cards were previously two
// near-identical copies of the same card/column/drag-and-drop code
// living only in PipelinesPage.tsx; extracted here once both needed a
// second (embedded) home, same "one shared component, not page-local
// copies" reasoning as ContactsTab/PipelinesTab themselves. Stage
// columns/colors/labels live in ./kanbanConfig instead of here — a
// file exporting a component can only export components (react-
// refresh/only-export-components), not also that plain data.

function PipelineCard<T extends PipelineCardEntity>({
  entity,
  onDragStart,
  onClick,
}: {
  entity: T;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onClick: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, entity.id)}
      onClick={onClick}
      className="bg-surface border border-line/80 rounded-lg p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-accent/40 transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-[0.98] select-none"
    >
      <h4 className="text-[12.5px] font-bold text-ink leading-snug mb-2.5">{entity.title}</h4>
      <div className="text-[12px] font-bold text-accent mb-3">MRR: ${formatMoney(entity.mrr)}</div>
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <EntityAvatar name={companyLabel(entity.companies)} className="w-5 h-5 rounded-full text-[9px]" />
          <span className="text-[11.5px] text-ink-muted font-semibold truncate max-w-[120px]">{pipelineOrgLabel(entity)}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold capitalize shrink-0 ${PRIORITY_COLORS[entity.priority]}`}>
          {entity.priority}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn<S extends string, T extends PipelineCardEntity>({
  stage,
  title,
  entities,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onAddClick,
  isDragOver,
}: {
  stage: S;
  title: string;
  entities: T[];
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragOver: (e: React.DragEvent, stage: S) => void;
  onDrop: (e: React.DragEvent, stage: S) => void;
  onCardClick: (entity: T) => void;
  onAddClick: (stage: S) => void;
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
          <span className="text-[11px] text-ink-faint font-bold">({entities.length})</span>
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
        {entities.map(e => (
          <PipelineCard key={e.id} entity={e} onDragStart={onDragStart} onClick={() => onCardClick(e)} />
        ))}
        {entities.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-line rounded-lg flex items-center justify-center min-h-[80px] text-[12px] text-ink-faint font-semibold">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export interface KanbanBoardProps<S extends string, T extends PipelineCardEntity & { stage: S }> {
  columns: { stage: S; title: string }[];
  entities: T[];
  onCardClick: (entity: T) => void;
  onAddClick: (stage: S) => void;
  /** Drag a card to another column — PATCH the moved entity's own
   * `stage`. Caller's own responsibility (dispatches updateOpportunity/
   * updateRisk) since KanbanBoard doesn't know which thunk applies. */
  onMove: (id: number, stage: S) => void;
  /** Caps each column's own scroll area instead of the whole page's —
   * matches the standalone board's own `calc(100vh - 260px)`; an
   * embedded tab (less vertical chrome above it) passes a shorter one. */
  minHeight?: string;
}

export function KanbanBoard<S extends string, T extends PipelineCardEntity & { stage: S }>({
  columns,
  entities,
  onCardClick,
  onAddClick,
  onMove,
  minHeight = 'calc(100vh - 260px)',
}: KanbanBoardProps<S, T>) {
  const [dragOverStage, setDragOverStage] = useState<S | null>(null);
  const draggingId = useRef<number | null>(null);

  const handleDragStart = (_e: React.DragEvent, id: number) => {
    draggingId.current = id;
  };

  const handleDragOver = (_e: React.DragEvent, stage: S) => {
    setDragOverStage(stage);
  };

  const handleDrop = (_e: React.DragEvent, targetStage: S) => {
    const id = draggingId.current;
    draggingId.current = null;
    setDragOverStage(null);
    if (id === null) return;
    const current = entities.find(e => e.id === id);
    if (!current || current.stage === targetStage) return;
    onMove(id, targetStage);
  };

  const handleDragEnd = () => {
    draggingId.current = null;
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight }} onDragEnd={handleDragEnd}>
      {columns.map(col => (
        <KanbanColumn
          key={col.stage}
          stage={col.stage}
          title={col.title}
          entities={entities.filter(e => e.stage === col.stage)}
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
