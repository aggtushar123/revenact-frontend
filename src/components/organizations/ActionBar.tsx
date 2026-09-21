import React, { useState } from 'react';
import { Search, Download, CloudUpload, Filter, Settings } from 'lucide-react';
import { RowActionsPopover } from './RowActionsPopover';
import { OrganizationFormModal } from './OrganizationFormModal';
import { useAppSelector } from '../../hooks';
import type { Customer } from '../../features/customers/customersSlice';

interface ActionBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  /** Checkbox-selected rows from the table — the settings gear acts on
   * these instead of needing its own row context. */
  selectedOrganizations: { id: number; name: string }[];
  onEditRequest: (id: number) => void;
  onChurnRequest: (ids: number[], names: string[]) => void;
  onArchiveRequest: (ids: number[], names: string[]) => void;
}

export function ActionBar({
  searchQuery,
  setSearchQuery,
  selectedOrganizations,
  onEditRequest,
  onChurnRequest,
  onArchiveRequest,
}: ActionBarProps) {
  const [showSettingsPopup, setShowSettingsPopup] = useState<{ style: React.CSSProperties } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const selectedCount = selectedOrganizations.length;
  // Settings > Global Presets' own default (see GlobalPresetsPage.tsx) —
  // '' means "no tenant default", which OrganizationFormModal's own
  // fallback chain already treats the same as not passing this prop at
  // all (falls through to its hardcoded 'onboarding').
  const defaultLifecycleStage = useAppSelector(
    (state) => state.auth.user?.organisation.default_lifecycle_stage || undefined
  ) as Customer['lifecycle_stage'] | undefined;

  const handleSettingsClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setShowSettingsPopup({
      style: { top: rect.bottom + 8, right: window.innerWidth - rect.right }
    });
  };
  return (
    <div className="flex items-center justify-between w-full mb-4">
      <div className="relative w-[400px]">
        <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, Revenact ID or External ID"
          className="w-full pl-9 pr-4 py-[8px] bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent placeholder:text-ink-faint"
        />
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-[12px] font-semibold text-ink-muted mr-1">
            {selectedCount} selected
          </span>
        )}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-[8px] bg-accent hover:bg-accent-hover text-on-accent text-[13px] font-semibold rounded-lg shadow-sm transition-colors tracking-wide"
        >
          <span className="text-lg leading-none mb-[2px]">+</span> Add Organization
        </button>
        <button className="flex items-center gap-1.5 px-3 py-[8px] bg-accent-dim border border-accent/30 text-accent hover:bg-accent-dim text-[13px] font-semibold rounded-lg shadow-sm transition-colors">
          <Filter className="w-3.5 h-3.5 stroke-[2.5px]" /> (2)
        </button>
        <button className="p-[8px] bg-surface border border-line hover:bg-subtle text-accent rounded-lg shadow-sm transition-colors">
          <Download className="w-4 h-4 stroke-[2px]" />
        </button>
        <button className="p-[8px] bg-surface border border-line hover:bg-subtle text-ink-muted rounded-lg shadow-sm transition-colors">
          <CloudUpload className="w-4 h-4 stroke-[2px]" />
        </button>
        <button
          className={`relative p-[8px] border rounded-lg shadow-sm transition-colors ${
            selectedCount > 0
              ? 'bg-accent-dim border-accent/30 text-accent hover:bg-accent-dim'
              : 'bg-surface border-line hover:bg-subtle text-ink-muted'
          }`}
          onClick={handleSettingsClick}
          aria-label={
            selectedCount > 0
              ? `Actions for ${selectedCount} selected organization${selectedCount === 1 ? '' : 's'}`
              : 'Settings'
          }
        >
          <Settings className="w-4 h-4 stroke-[2px]" />
          {selectedCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-on-accent text-[10px] font-bold flex items-center justify-center leading-none">
              {selectedCount}
            </span>
          )}
        </button>
      </div>

      {showSettingsPopup && (
        <RowActionsPopover
          onClose={() => setShowSettingsPopup(null)}
          style={showSettingsPopup.style}
          onEdit={
            selectedCount === 1
              ? () => {
                  onEditRequest(selectedOrganizations[0].id);
                  setShowSettingsPopup(null);
                }
              : undefined
          }
          onArchive={
            selectedCount > 0
              ? () => {
                  onArchiveRequest(
                    selectedOrganizations.map((o) => o.id),
                    selectedOrganizations.map((o) => o.name)
                  );
                  setShowSettingsPopup(null);
                }
              : undefined
          }
          onChurn={
            selectedCount > 0
              ? () => {
                  onChurnRequest(
                    selectedOrganizations.map((o) => o.id),
                    selectedOrganizations.map((o) => o.name)
                  );
                  setShowSettingsPopup(null);
                }
              : undefined
          }
        />
      )}

      {showAddModal && (
        <OrganizationFormModal defaultLifecycleStage={defaultLifecycleStage} onClose={() => setShowAddModal(false)} />
      )}

      {/* Floating Theme button on the right edge */}
      <div className="fixed right-0 top-[35%] bg-elevated text-accent p-2 pl-3 rounded-l-lg shadow-lg cursor-pointer z-50 flex items-center justify-center border border-line-strong border-r-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>
      </div>
    </div>
  );
}
