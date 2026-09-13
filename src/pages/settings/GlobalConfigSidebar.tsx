import { useState, type FormEvent } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { updateOrganisation } from '../../features/auth/authSlice';
import type { GlobalAttributeKey } from '../../features/auth/authSlice';
import { ORGANIZATION_ATTRIBUTES } from './organizationAttributes';

const CONCEPTS: { key: GlobalAttributeKey; label: string; hint: string }[] = [
  { key: 'arr', label: 'Organization ARR', hint: 'The field every ARR figure reads.' },
  { key: 'mrr', label: 'Organization MRR', hint: 'The field monthly figures derive from.' },
  { key: 'renewal_date', label: 'Renewal Date', hint: 'The date renewals and the forecast key on.' },
  { key: 'joined_date', label: 'Joined Date', hint: 'When the customer started with you.' },
];

const displayName = (field: string) =>
  ORGANIZATION_ATTRIBUTES.find((a) => a.name === field)?.displayName ?? field;

/**
 * Global configuration — the card the Settings page shipped with as a
 * mock, now real. The organisation's name, and which customer attribute
 * stands for each headline concept (ARR, MRR, renewal date, joined date)
 * across the organisation — read from and saved to the backend's
 * organisation settings. Anyone may read; changing needs
 * manage_org_settings, the same capability as Currency.
 */
export function GlobalConfigSidebar() {
  const dispatch = useAppDispatch();
  const canManage = useCapability('manage_org_settings');
  const organisation = useAppSelector((s) => s.auth.user?.organisation ?? null);
  // Unsaved edits sit on top of what the server has, so the card follows the
  // organisation as the server knows it without copying it into state;
  // Reset simply drops the edits.
  const [edits, setEdits] = useState<{ name?: string; mapping: Partial<Record<GlobalAttributeKey, string>> }>({ mapping: {} });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  const serverMapping: Record<GlobalAttributeKey, string> = { arr: '', mrr: '', renewal_date: '', joined_date: '', ...(organisation?.global_attributes ?? {}) };
  const name = edits.name ?? organisation?.name ?? '';
  const mapping: Record<GlobalAttributeKey, string> = { ...serverMapping, ...edits.mapping };
  const setName = (value: string) => setEdits((e) => ({ ...e, name: value }));
  const setMapping = (next: Record<GlobalAttributeKey, string>) => setEdits((e) => ({ ...e, mapping: next }));
  const resetFromServer = () => setEdits({ mapping: {} });

  const dirty =
    !!organisation &&
    (name !== organisation.name || CONCEPTS.some((c) => serverMapping[c.key] !== mapping[c.key]));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!organisation || !dirty) return;
    setStatus('saving');
    setError(null);
    const result = await dispatch(updateOrganisation({ name: name.trim(), global_attributes: mapping }));
    if (updateOrganisation.fulfilled.match(result)) {
      setEdits({ mapping: {} });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('idle');
      setError(typeof result.payload === 'string' ? result.payload : 'Could not save the configuration.');
    }
  }

  const choices = organisation?.global_attribute_choices;

  return (
    <form onSubmit={submit} className="w-[320px] lg:w-[380px] border-l border-line-subtle bg-surface flex flex-col overflow-hidden shrink-0" aria-label="Global configuration">
      <div className="px-6 py-4 border-b border-line-subtle flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-ink flex items-center gap-2">
          Global Configuration
          <HelpCircle className="w-3.5 h-3.5 text-ink-faint" aria-hidden />
        </h2>
        {!canManage && <span className="text-[11px] font-semibold text-ink-faint">Read-only</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="org-name" className="text-[12px] font-bold text-ink-faint uppercase tracking-wide">
            Organization Name <span className="text-danger">*</span>
          </label>
          <input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canManage}
            className="w-full px-4 py-2 bg-subtle/50 border border-line rounded-lg text-[13px] font-semibold text-ink focus:outline-none focus:border-accent disabled:opacity-70"
          />
        </div>

        {CONCEPTS.map((c) => (
          <div key={c.key} className="flex flex-col gap-1.5">
            <label htmlFor={`global-${c.key}`} className="text-[12px] font-bold text-ink-faint uppercase tracking-wide">
              {c.label} <span className="text-danger">*</span>
            </label>
            <select
              id={`global-${c.key}`}
              value={mapping[c.key]}
              onChange={(e) => setMapping({ ...mapping, [c.key]: e.target.value })}
              disabled={!canManage}
              className="w-full px-4 py-2.5 bg-subtle/50 border border-line rounded-lg text-[13px] font-semibold text-ink focus:outline-none focus:border-accent disabled:opacity-70"
            >
              {(choices?.[c.key] ?? [mapping[c.key]]).map((field) => (
                <option key={field} value={field}>
                  {displayName(field)}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-ink-faint">{c.hint}</span>
          </div>
        ))}

        <div className="mt-2 p-4 bg-info-dim rounded-xl border border-info/20 flex gap-3">
          <Info className="w-5 h-5 text-info shrink-0" />
          <p className="text-[12px] text-ink-muted leading-relaxed font-medium">
            These choices apply across the whole organisation: every screen that shows ARR, MRR, a renewal or a joined date reads the field chosen here.
          </p>
        </div>
        {error && (
          <p className="text-[12px] font-semibold text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      {canManage && (
        <div className="p-6 border-t border-line-subtle flex flex-col gap-3">
          <button type="submit" disabled={!dirty || status === 'saving'} className="w-full bg-accent text-[#0D0F0E] rounded-lg py-2.5 text-[13px] font-bold hover:bg-accent-hover disabled:opacity-50">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Set Global Attributes'}
          </button>
          <button type="button" onClick={resetFromServer} disabled={!dirty} className="w-full bg-surface text-ink-muted border border-line rounded-lg py-2.5 text-[13px] font-bold hover:bg-subtle disabled:opacity-50">
            Reset
          </button>
        </div>
      )}
    </form>
  );
}
