import { useState } from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { updateOrganisation } from '../../features/auth/authSlice';
import { LIFECYCLE_LABELS } from '../../features/customers/formatters';
import { ApiError } from '../../lib/apiClient';
import type { LifecycleCategory } from '../../components/organizations/tableData';

// Backs Settings > Global Presets (Navbar.tsx's own /settings/global-presets
// tab, unrouted until now) — the real home for what GlobalConfigSidebar.tsx
// used to mock inside the Data tab (deleted; that sidebar never persisted
// anything). Real, admin-gated persistence via
// Organisation.default_lifecycle_stage: the standalone Add Organization
// flow (ActionBar.tsx) reads this to pre-fill new organizations' own
// Lifecycle Stage instead of always hardcoding "Onboarding".
const STAGE_OPTIONS: LifecycleCategory[] = [
  'onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'expansion', 'churn', 'other',
];

export function GlobalPresetsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const savedStage = user?.organisation.default_lifecycle_stage ?? '';
  const [selected, setSelected] = useState<string>(savedStage);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isDirty = selected !== savedStage;

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await dispatch(updateOrganisation({ default_lifecycle_stage: selected })).unwrap();
      setSavedAt(Date.now());
    } catch (err) {
      setError(typeof err === 'string' ? err : err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6 max-w-2xl">
      <div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Global Presets</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Tenant-wide defaults, applied when a new record is created — overridable per record.
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Only an organisation admin can change this.
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line-subtle shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="default-stage-select" className="text-[12px] font-bold text-ink-muted uppercase tracking-wide">
            Default Lifecycle Stage — new Organizations
          </label>
          <select
            id="default-stage-select"
            value={selected}
            disabled={!isAdmin}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full max-w-sm px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">No default (starts at Onboarding)</option>
            {STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>{LIFECYCLE_LABELS[stage]}</option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-accent-dim/40 border border-accent/30">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[12px] text-accent/90 leading-relaxed font-medium">
            Applies to the standalone "Add Organization" flow. You can still set a different stage on any individual
            organization when adding it.
          </p>
        </div>

        {error && <p className="text-[12.5px] text-danger">{error}</p>}

        {isAdmin && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            {!isDirty && savedAt && (
              <span className="text-[12px] text-success font-medium">Saved.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
