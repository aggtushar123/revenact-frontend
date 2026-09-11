import React, { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { 
  Zap, Split, Filter, 
  Mail, Trash2, Edit2
} from 'lucide-react';
import type { ScenarioNodeData } from './types';

// Common node container
const NodeContainer = ({ header, color, icon, isSelected, data, onDelete, onEdit }: { header: string, color: string, icon: React.ReactNode, isSelected: boolean, data: ScenarioNodeData, onDelete?: () => void, onEdit?: () => void }) => (
  <div className={`group relative min-w-[280px] bg-surface rounded-lg shadow-sm border transition-all ${
    isSelected ? 'ring-2 ring-accent' : 'border-line'
  }`} style={{ borderColor: isSelected ? undefined : color }}>
    
    {/* Floating Controls (Visible on hover or selection) */}
    <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
       <button 
         onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
         className="p-1.5 bg-surface border border-line rounded shadow-sm hover:bg-subtle text-ink-muted"
         title="Edit Node"
       >
         <Edit2 className="w-3.5 h-3.5" />
       </button>
       <button 
         onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
         className="p-1.5 bg-surface border border-line rounded shadow-sm hover:bg-subtle text-danger"
         title="Delete Node"
       >
         <Trash2 className="w-3.5 h-3.5" />
       </button>
    </div>

    {/* Node Header */}
    <div className="px-3 py-1.5 flex flex-col items-center justify-center border-b border-line-subtle bg-subtle/30">
      <span className="text-[11px] font-bold text-ink-faint/80 uppercase tracking-wider">{header}</span>
    </div>

    {/* Node Body */}
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="p-1.5 rounded flex items-center justify-center" style={{ backgroundColor: `${color}1A`, color: color }}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-ink-muted">
          <span className="text-ink-faint font-medium mr-1">{data.action}:</span>
          {data.label}
        </span>
      </div>
    </div>
  </div>
);

export const EntryNode = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();
  const onDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };
  
  // Custom event to trigger edit pane in parent
  const onEdit = () => {
    const event = new CustomEvent('edit-node', { detail: { id, data, type: 'entry' } });
    window.dispatchEvent(event);
  };
  
  const nodeData = data as ScenarioNodeData;
  
  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <NodeContainer 
        header="Entry Criteria" 
        color="var(--success)" 
        icon={<Zap className="w-4 h-4" />} 
        isSelected={!!selected}
        data={nodeData}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !bg-surface !border-2 !border-line !rounded-full !flex !items-center !justify-center !-bottom-2 !z-50 hover:!border-success transition-colors"
      >
        <div className="w-1.5 h-1.5 bg-line-strong rounded-full pointer-events-none" />
      </Handle>
    </>
  );
});

export const OperatorNode = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();
  const onDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };
  
  const onEdit = () => {
    const event = new CustomEvent('edit-node', { detail: { id, data, type: 'operator' } });
    window.dispatchEvent(event);
  };

  const nodeData = data as ScenarioNodeData;
  const isCondition = nodeData.action === 'Condition';
  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[var(--accent)] !-top-1 !z-50" />
      <NodeContainer 
        header="Operator" 
        color="var(--accent)" 
        icon={isCondition ? <Split className="w-4 h-4" /> : <Filter className="w-4 h-4" />} 
        isSelected={!!selected}
        data={nodeData}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      
      {isCondition ? (
        <>
          <div className="absolute -bottom-8 left-[25%] flex flex-col items-center">
            <span className="text-[10px] font-bold text-ink-faint mb-1">No</span>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="no" 
              className="!w-3 !h-3 !bg-danger !z-50"
            />
          </div>
          <div className="absolute -bottom-8 right-[25%] flex flex-col items-center">
            <span className="text-[10px] font-bold text-ink-faint mb-1">Yes</span>
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="yes" 
              className="!w-3 !h-3 !bg-success !z-50"
            />
          </div>
        </>
      ) : (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!w-4 !h-4 !bg-surface !border-2 !border-line !rounded-full !flex !items-center !justify-center !-bottom-2 !z-50 hover:!border-accent transition-colors"
        >
          <div className="w-1.5 h-1.5 bg-line-strong rounded-full pointer-events-none" />
        </Handle>
      )}
    </>
  );
});

export const ActionNode = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();
  const onDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  const onEdit = () => {
    const event = new CustomEvent('edit-node', { detail: { id, data, type: 'action' } });
    window.dispatchEvent(event);
  };

  const nodeData = data as ScenarioNodeData;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[var(--info)] !-top-1 !z-50" />
      <NodeContainer 
        header="Action" 
        color="var(--info)" 
        icon={<Mail className="w-4 h-4" />} 
        isSelected={!!selected}
        data={nodeData}
        onDelete={onDelete}
        onEdit={onEdit}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-4 !h-4 !bg-surface !border-2 !border-line !rounded-full !flex !items-center !justify-center !-bottom-2 !z-50 hover:!border-info transition-colors"
      >
        <div className="w-1.5 h-1.5 bg-line-strong rounded-full pointer-events-none" />
      </Handle>
    </>
  );
});
