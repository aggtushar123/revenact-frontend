import React, { memo } from 'react';
import { 
  getBezierPath, 
  EdgeLabelRenderer, 
  BaseEdge, 
  type EdgeProps, 
  useReactFlow 
} from '@xyflow/react';
import { X } from 'lucide-react';

export const CustomEdge = memo(({
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

  const onToggleLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === id) {
          const currentLabel = edge.label;
          let nextLabel: string | undefined = undefined;
          
          if (!currentLabel) nextLabel = 'Yes';
          else if (currentLabel === 'Yes') nextLabel = 'No';
          else if (currentLabel === 'No') nextLabel = undefined;
          
          return { ...edge, label: nextLabel };
        }
        return edge;
      })
    );
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((eds) => eds.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2, stroke: label ? (label === 'Yes' ? 'var(--success)' : 'var(--danger)') : 'var(--border-strong)' }} />
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
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm border transition-all ${
              !label 
                ? 'bg-surface border-line text-ink-faint opacity-0 group-hover:opacity-100' 
                : label === 'Yes' 
                  ? 'bg-success-dim border-success/40 text-success'
                  : 'bg-danger-dim border-danger/40 text-danger'
            }`}
          >
            {label || 'Set Label'}
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
});
