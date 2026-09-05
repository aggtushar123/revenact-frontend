import React, { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge, type EdgeProps, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

// A stakeholder relationship's own vocabulary — deliberately a small
// fixed set cycled by clicking, not free text, same "toggle pill, not
// an input" mechanic as CustomEdge.tsx's own Yes/No cycle, just a
// longer cycle: undefined -> each label in turn -> undefined.
const RELATIONSHIP_LABELS = ['Reports to', 'Introduced by', 'Blocks', 'Influences'];

const LABEL_COLOR: Record<string, string> = {
  'Reports to': 'var(--accent)',
  'Introduced by': 'var(--info)',
  Blocks: 'var(--danger)',
  Influences: 'var(--warning)',
};

export const CanvasEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
  }: EdgeProps) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const currentLabel = typeof label === 'string' ? label : undefined;
    const color = currentLabel ? LABEL_COLOR[currentLabel] : 'var(--border-strong)';

    const onToggleLabel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge;
          const index = RELATIONSHIP_LABELS.indexOf(String(edge.label ?? ''));
          const nextLabel = index === -1 ? RELATIONSHIP_LABELS[0] : RELATIONSHIP_LABELS[index + 1];
          return { ...edge, label: nextLabel };
        })
      );
    };

    const onRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEdges((eds) => eds.filter((edge) => edge.id !== id));
    };

    return (
      <>
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2, stroke: color }} />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan flex items-center gap-1 group"
          >
            <button
              onClick={onToggleLabel}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border transition-all whitespace-nowrap ${
                !currentLabel ? 'bg-surface border-line text-ink-faint opacity-0 group-hover:opacity-100' : ''
              }`}
              style={
                currentLabel
                  ? { backgroundColor: `${color}1A`, borderColor: `${color}66`, color }
                  : undefined
              }
            >
              {currentLabel || 'Set Label'}
            </button>

            <button
              onClick={onRemove}
              className="w-5 h-5 bg-surface border border-line-subtle rounded-full shadow-sm flex items-center justify-center text-ink-faint hover:text-danger hover:border-danger/40 opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);
