import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { User, Trash2, UserX } from 'lucide-react';
import { useAppSelector } from '../../hooks';

const SENTIMENT_COLOR: Record<'positive' | 'neutral' | 'negative', string> = {
  positive: 'var(--success)',
  neutral: 'var(--text-tertiary)',
  negative: 'var(--danger)',
};

// A Canvas node's own `data` holds only a `contact_id` reference — see
// the Canvas model's own backend docstring on why (editing a Contact
// anywhere in the app is reflected here without a sync step). Looked
// up live against the same `contacts` slot ContactsTab.tsx itself
// reads, already fetched by CanvasEditor.tsx on mount.
export const ContactNode = memo(({ id, data, selected }: NodeProps) => {
  const { setNodes, setEdges } = useReactFlow();
  const contactId = (data as { contact_id: number }).contact_id;
  const contact = useAppSelector((state) => state.customers.contacts.find((c) => c.id === contactId));

  const onDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  if (!contact) {
    return (
      <div className="group relative min-w-[220px] bg-surface rounded-lg shadow-sm border border-line-subtle opacity-60">
        <Handle type="target" position={Position.Top} className="!opacity-0" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-10 top-1 p-1.5 bg-surface border border-line rounded shadow-sm hover:bg-subtle text-danger opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Node"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <div className="px-4 py-3 flex items-center gap-2 text-ink-faint">
          <UserX className="w-4 h-4" />
          <span className="text-[13px] font-medium">Contact removed</span>
        </div>
        <Handle type="source" position={Position.Bottom} className="!opacity-0" />
      </div>
    );
  }

  return (
    <div
      className={`group relative min-w-[220px] bg-surface rounded-lg shadow-sm border transition-all ${
        selected ? 'ring-2 ring-accent border-transparent' : 'border-line'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[var(--accent)] !-top-1 !z-50" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -right-10 top-1 p-1.5 bg-surface border border-line rounded shadow-sm hover:bg-subtle text-danger opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete Node"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="px-3.5 py-3 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-accent-dim text-accent flex items-center justify-center">
            <User className="w-4.5 h-4.5" />
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface"
            style={{ backgroundColor: SENTIMENT_COLOR[contact.sentiment] }}
            title={`Sentiment: ${contact.sentiment}`}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13.5px] font-bold text-ink truncate">{contact.name}</span>
          <span className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide truncate">
            {contact.role_display}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-surface !border-2 !border-line !rounded-full !flex !items-center !justify-center !-bottom-2 !z-50 hover:!border-accent transition-colors"
      >
        <div className="w-1.5 h-1.5 bg-line-strong rounded-full pointer-events-none" />
      </Handle>
    </div>
  );
});
