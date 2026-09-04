import { useState } from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { updateOrganisation } from '../../features/auth/authSlice';
import { ApiError } from '../../lib/apiClient';
import type { AgentTone } from '../../features/auth/authSlice';

// Backs Settings > AI Agent (Navbar.tsx's own /settings/ai-agent tab,
// unrouted until now). Real, admin-gated persistence via
// Organisation.ai_agent_enabled/ai_agent_tone — but, same honesty as
// CurrencyPage's own: Copilot (src/pages/copilot/) has no backend at
// all yet, so nothing reads these back out today. This page stores a
// real preference for whenever that changes, not a working toggle.
const TONE_OPTIONS: { value: AgentTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' },
];

export function AIAgentPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const savedEnabled = user?.organisation.ai_agent_enabled ?? true;
  const savedTone = user?.organisation.ai_agent_tone ?? 'professional';
  const [enabled, setEnabled] = useState(savedEnabled);
  const [tone, setTone] = useState<AgentTone>(savedTone);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const isDirty = enabled !== savedEnabled || tone !== savedTone;

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await dispatch(updateOrganisation({ ai_agent_enabled: enabled, ai_agent_tone: tone })).unwrap();
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
        <h1 className="text-[20px] font-bold text-ink tracking-tight">AI Agent</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Preferences for the AI Copilot's own suggestions and tone.
        </p>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Only an organisation admin can change this.
        </div>
      )}

      <div className="bg-surface rounded-xl border border-line-subtle shadow-sm p-6 flex flex-col gap-5">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="AI Agent enabled"
            disabled={!isAdmin}
            onClick={() => setEnabled((v) => !v)}
            className={`w-8 h-[18px] rounded-full relative transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${enabled ? 'bg-success' : 'bg-line-strong'}`}
          >
            <span
              className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface shadow-sm transition-transform ${
                enabled ? 'translate-x-[16px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
          <span className="text-[13px] font-semibold text-ink">Enable AI Copilot suggestions</span>
        </label>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="agent-tone-select" className="text-[12px] font-bold text-ink-muted uppercase tracking-wide">
            Tone
          </label>
          <select
            id="agent-tone-select"
            value={tone}
            disabled={!isAdmin}
            onChange={(e) => setTone(e.target.value as AgentTone)}
            className="w-full max-w-xs px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-accent-dim/40 border border-accent/30">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[12px] text-accent/90 leading-relaxed font-medium">
            These preferences are saved for real, but Copilot doesn't read them yet — there's no backend behind it
            today.
          </p>
        </div>

        {error && <p className="text-[12.5px] text-danger">{error}</p>}

        {isAdmin && (
          <div className="flex items-center gap-3">
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
