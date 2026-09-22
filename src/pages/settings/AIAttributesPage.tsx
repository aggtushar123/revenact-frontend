import { useEffect, useState } from 'react';
import { Plus, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useCapability } from '../../hooks';
import { ApiError } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { createAttribute, deleteAttribute, fetchAttributes, fillAttribute } from '../../features/attributes/attributesApi';
import { REFRESH_LABELS, VALUE_TYPE_LABELS } from '../../features/attributes/types';
import type { AIAttribute, AttributeRefresh, AttributeValueType } from '../../features/attributes/types';

// Backs Settings > AI Attributes (Navbar's own sub-tab). Same admin-only
// write, list/add-form/ConfirmDialog shape as CustomObjectsPage: an AI
// attribute is tenant-wide schema, gated by the same capability. The
// answers themselves live on each company page (AIAttributesPanel).

const INPUT = 'w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-line-strong';
const LABEL = 'text-[12px] font-bold text-ink-muted uppercase tracking-wide';

export function AIAttributesPage() {
  const isAdmin = useCapability('manage_custom_objects');
  const [attributes, setAttributes] = useState<AIAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(isAdmin);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AIAttribute | null>(null);
  const [fillNote, setFillNote] = useState<Record<number, string>>({});
  const [filling, setFilling] = useState<number | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [valueType, setValueType] = useState<AttributeValueType>('text');
  const [options, setOptions] = useState('');
  const [toCustomer, setToCustomer] = useState(true);
  const [toAccount, setToAccount] = useState(false);
  const [refresh, setRefresh] = useState<AttributeRefresh>('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        setAttributes(await fetchAttributes());
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load AI attributes.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  function resetForm() {
    setShowAddForm(false);
    setName('');
    setPrompt('');
    setValueType('text');
    setOptions('');
    setToCustomer(true);
    setToAccount(false);
    setRefresh('manual');
    setAddError(null);
  }

  const optionList = options.split(',').map((o) => o.trim()).filter(Boolean);
  const canCreate = name.trim() && prompt.trim() && (toCustomer || toAccount) && (valueType !== 'picklist' || optionList.length > 0) && !isSubmitting;

  async function handleCreate() {
    setAddError(null);
    setIsSubmitting(true);
    try {
      const created = await createAttribute({
        name: name.trim(),
        prompt: prompt.trim(),
        value_type: valueType,
        picklist_options: valueType === 'picklist' ? optionList : [],
        applies_to_customer: toCustomer,
        applies_to_account: toAccount,
        refresh,
      });
      setAttributes((current) => [...current, created]);
      resetForm();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Could not create the attribute.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteAttribute(target.id);
      setAttributes((current) => current.filter((a) => a.id !== target.id));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not delete the attribute.');
    }
  }

  async function handleFillAll(attribute: AIAttribute) {
    setFilling(attribute.id);
    try {
      const result = await fillAttribute(attribute.id);
      const note = result.remaining > 0 ? `${result.filled} filled, ${result.remaining} left for tonight` : `${result.filled} filled`;
      setFillNote((current) => ({ ...current, [attribute.id]: note }));
    } catch (err) {
      setFillNote((current) => ({ ...current, [attribute.id]: err instanceof ApiError ? err.message : 'Could not fill.' }));
    } finally {
      setFilling(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full w-full p-6 max-w-2xl">
        <h1 className="text-[20px] font-bold text-ink tracking-tight mb-4">AI Attributes</h1>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
          You don't have permission to define AI attributes — ask an admin to add one. Their answers show on every Organization and Account page.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">AI Attributes</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Ask a question of every company in plain English. The Copilot answers it from the records, with its reasoning and sources, and keeps every answer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          New attribute
        </button>
      </div>

      {showAddForm && (
        <form
          className="bg-surface rounded-xl border border-line-subtle shadow-sm p-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canCreate) handleCreate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="attr-name" className={LABEL}>Name</label>
            <input id="attr-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product tier" className={INPUT} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="attr-prompt" className={LABEL}>Question</label>
            <textarea id="attr-prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder="Which tier of our product does this company use?" className={`${INPUT} resize-y`} />
            <p className="text-[12px] text-ink-faint">Written as you would ask a colleague. The Copilot reads the company's notes, emails, tickets and calls to answer it.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="attr-type" className={LABEL}>Answer type</label>
              <select id="attr-type" value={valueType} onChange={(e) => setValueType(e.target.value as AttributeValueType)} className={INPUT}>
                {(Object.keys(VALUE_TYPE_LABELS) as AttributeValueType[]).map((type) => (
                  <option key={type} value={type}>{VALUE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="attr-refresh" className={LABEL}>Refresh</label>
              <select id="attr-refresh" value={refresh} onChange={(e) => setRefresh(e.target.value as AttributeRefresh)} className={INPUT}>
                <option value="manual">When someone asks</option>
                <option value="nightly">Nightly, when there is new activity</option>
              </select>
            </div>
          </div>
          {valueType === 'picklist' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="attr-options" className={LABEL}>Options</label>
              <input id="attr-options" type="text" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="SMB, Mid-market, Enterprise" className={INPUT} />
              <p className="text-[12px] text-ink-faint">Comma separated. The answer must be one of these.</p>
            </div>
          )}
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[13px] font-medium text-ink-muted cursor-pointer">
              <input type="checkbox" checked={toCustomer} onChange={(e) => setToCustomer(e.target.checked)} />
              Applies to Organizations
            </label>
            <label className="flex items-center gap-2 text-[13px] font-medium text-ink-muted cursor-pointer">
              <input type="checkbox" checked={toAccount} onChange={(e) => setToAccount(e.target.checked)} />
              Applies to Accounts
            </label>
          </div>
          {addError && <p className="text-[12.5px] text-danger" role="alert">{addError}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={!canCreate} className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="text-[13px] font-semibold text-ink-muted hover:text-ink">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex-1 bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-5" role="status" aria-label="Loading AI attributes">
            <div className="h-4 w-48 rounded bg-subtle animate-pulse" />
            <div className="h-4 w-72 rounded bg-subtle animate-pulse" />
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-danger">{loadError}</div>
        ) : attributes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-1 text-center">
            <Sparkles className="w-5 h-5 text-ink-faint mb-1" aria-hidden="true" />
            <p className="text-[14px] font-semibold text-ink-muted">No AI attributes yet.</p>
            <p className="text-[12.5px] text-ink-faint">Add one and the Copilot will answer it on every Organization or Account page.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                {['Name', 'Question', 'Type', 'Applies to', 'Refresh', ''].map((heading) => (
                  <th key={heading} className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {attributes.map((attribute) => (
                <tr key={attribute.id} className="hover:bg-subtle/40 transition-colors align-top">
                  <td className="px-5 py-3 text-[13px] font-bold text-ink">{attribute.name}</td>
                  <td className="px-5 py-3 text-[13px] text-ink-muted max-w-[320px]">
                    <span className="line-clamp-2">{attribute.prompt}</span>
                    {attribute.value_type === 'picklist' && <span className="block text-[11.5px] text-ink-faint mt-0.5">{attribute.picklist_options.join(' · ')}</span>}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-ink-muted">{VALUE_TYPE_LABELS[attribute.value_type]}</td>
                  <td className="px-5 py-3 text-[13px] text-ink-muted">
                    {[attribute.applies_to_customer && 'Organizations', attribute.applies_to_account && 'Accounts'].filter(Boolean).join(' & ')}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-ink-muted">{REFRESH_LABELS[attribute.refresh]}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleFillAll(attribute)}
                        disabled={filling === attribute.id}
                        aria-label={`Fill all for ${attribute.name}`}
                        className="px-2.5 py-1 rounded-md text-[12px] font-semibold text-ink-muted hover:text-ink hover:bg-subtle disabled:opacity-50"
                      >
                        {filling === attribute.id ? 'Filling…' : 'Fill all'}
                      </button>
                      <button type="button" onClick={() => setDeleteTarget(attribute)} aria-label={`Delete ${attribute.name}`} className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-danger-dim">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    {fillNote[attribute.id] && <p className="text-[11.5px] text-ink-faint text-right mt-1" role="status">{fillNote[attribute.id]}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.name}?`}
          message="Every answer the Copilot or a colleague recorded for it goes with it."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
