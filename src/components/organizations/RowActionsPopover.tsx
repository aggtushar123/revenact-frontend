import React from 'react';

interface Props {
  onClose: () => void;
  style?: React.CSSProperties;
}

export function RowActionsPopover({ onClose, style }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div
        className="absolute z-[110] bg-elevated rounded-[6px] shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-line-strong w-[190px] flex flex-col py-1.5 pointer-events-auto"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-subtle hover:text-accent transition-colors w-full">
          Edit Organization
        </button>
        <button className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-subtle hover:text-accent transition-colors w-full">
          Archive Organization
        </button>
        <button className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-subtle hover:text-accent transition-colors w-full">
          Move Linked Entities...
        </button>
        <button className="text-left px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-danger-dim hover:text-danger transition-colors w-full">
          Churn Organization
        </button>
      </div>
    </>
  );
}
