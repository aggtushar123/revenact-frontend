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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2, stroke: label ? (label === 'Yes' ? '#10b981' : '#f43f5e') : '#cbd5e1' }} />
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
                ? 'bg-white border-gray-200 text-gray-400 opacity-0 group-hover:opacity-100' 
                : label === 'Yes' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            {label || 'Set Label'}
          </button>
          
          <button
            onClick={onRemove}
            className="w-5 h-5 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-200 opacity-0 group-hover:opacity-100 transition-all scale-75 hover:scale-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
