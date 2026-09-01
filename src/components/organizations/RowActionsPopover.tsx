import React from 'react';

interface Props {
  onClose: () => void;
  style?: React.CSSProperties;
  /** Omitted entirely from the ActionBar's generic settings-gear usage of
   * this popover, which isn't tied to any one organization — only the
   * per-row "..." menu in OrganizationsTable passes these. */
  onEdit?: () => void;
  onArchive?: () => void;
  onChurn?: () => void;
}

export function RowActionsPopover({ onClose, style, onEdit, onArchive, onChurn }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div
        className="absolute z-[110] bg-elevated rounded-[6px] shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-line-strong w-[190px] flex flex-col py-1.5 pointer-events-auto"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          disabled={!onEdit}
          className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-subtle hover:text-accent transition-colors w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Edit Organization
        </button>
        <button
          onClick={onArchive}
          disabled={!onArchive}
          className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-subtle hover:text-accent transition-colors w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Archive Organization
        </button>
        <button
          disabled
          title="Not built yet"
          className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted transition-colors w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Move Linked Entities...
        </button>
        <button
          onClick={onChurn}
          disabled={!onChurn}
          className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-danger-dim hover:text-danger transition-colors w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Churn Organization
        </button>
      </div>
    </>
  );
}
