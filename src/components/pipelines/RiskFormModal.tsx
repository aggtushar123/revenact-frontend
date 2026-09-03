import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import { apiFetch, ApiError } from '../../lib/apiClient';
import { createRisk, updateRisk } from '../../features/customers/customersSlice';
import type { Risk } from '../../features/customers/customersSlice';

// Matches Risk.Stage on the backend exactly (services/customers/
// models.py) — the board's own 4 Risk Kanban columns, in the same order.
const STAGE_OPTIONS: { value: Risk['stage']; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'mitigated', label: 'Mitigated' },
  { value: 'realised', label: 'Realised' },
  { value: 'abandoned', label: 'Abandoned' },
];

interface RiskFormModalProps {
  /** Present for Edit, omitted for Add. */
  risk?: Risk;
  /** Add-only default stage — the column "+" the user clicked, or the
   * first column when opened from the board's own "Add Risk" button.
   * Ignored for Edit. */
  defaultStage?: Risk['stage'];
  /** Every company to choose from — same reasoning as
   * OpportunityFormModal's own `companies` prop. */
  companies: { id: number; name: string }[];
  onClose: () => void;
  /** Edit-only: shows a "Delete" button that hands off to the caller,
   * same separation as OpportunityFormModal's own. */
  onDeleteRequest?: () => void;
}

export function RiskFormModal({ risk, defaultStage, companies, onClose, onDeleteRequest }: RiskFormModalProps) {
  const dispatch = useAppDispatch();
  const isEdit = !!risk;

  const [title, setTitle] = useState(risk?.title ?? '');
  const [mrr, setMrr] = useState(risk?.mrr ?? '');
  const [stage, setStage] = useState<Risk['stage']>(risk?.stage ?? defaultStage ?? 'open');
  const [priority, setPriority] = useState<Risk['priority']>(risk?.priority ?? 'medium');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Same self-fetching Account picker as OpportunityFormModal — every
  // account under whichever company is currently picked, so a new Risk
  // can be organisation-level (left on "Organization") or tied to one
  // specific Account, same two-tier model.
  const [accountOptions, setAccountOptions] = useState<{ id: number; name: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (isEdit || !selectedCompanyId) {
      setAccountOptions([]);
      return;
    }
    let cancelled = false;
    apiFetch<{ id: number; name: string }[]>(`/customers/${selectedCompanyId}/accounts/`)
      .then((accounts) => {
        if (!cancelled) setAccountOptions(Array.isArray(accounts) ? accounts : []);
      })
      .catch(() => {
        if (!cancelled) setAccountOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, selectedCompanyId]);

  useEffect(() => {
    setSelectedAccountId('');
  }, [selectedCompanyId]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !selectedCompanyId) {
      setError('Pick a company.');
      return;
    }

    setIsSaving(true);
    const data = { title: title.trim(), mrr: mrr.trim() || '0', stage, priority };
    try {
      // No manual refetch needed after any of these — createRisk/
      // updateRisk/deleteRisk's own extraReducers already patch the
      // one board-wide `risks` list directly, same reasoning as
      // OpportunityFormModal.
      if (isEdit) {
        await dispatch(updateRisk({ id: risk.id, ...data })).unwrap();
      } else if (selectedAccountId) {
        await dispatch(createRisk({ accountId: Number(selectedAccountId), ...data })).unwrap();
      } else {
        await dispatch(createRisk({ customerId: Number(selectedCompanyId), ...data })).unwrap();
      }
      onClose();
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err instanceof ApiError
            ? err.message
            : `Could not ${isEdit ? 'save changes to' : 'add'} the risk.`
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">{isEdit ? `Edit ${risk.title}` : 'Add Risk'}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Title" value={title} onChange={setTitle} required autoFocus />

          {isEdit ? (
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">Company</label>
              <p className="text-[13px] text-ink-faint px-3 py-2 bg-subtle/50 border border-line-subtle rounded-lg">
                {risk.company_name}
                {risk.account_name ? ` • ${risk.account_name}` : ''}
              </p>
            </div>
          ) : (
            <>
              <SelectField label="Company" value={selectedCompanyId} onChange={setSelectedCompanyId} required>
                <option value="">Select a company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>

              {/* A Risk can be organisation-level or belong to one
                  specific Account — same two-tier model as
                  Opportunity's own optional Account picker. */}
              {selectedCompanyId && (
                <SelectField label="Account (optional)" value={selectedAccountId} onChange={setSelectedAccountId}>
                  <option value="">Organization risk (no specific account)</option>
                  {accountOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </SelectField>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <TextField label="MRR" value={mrr} onChange={setMrr} placeholder="0.00" />
            <SelectField label="Priority" value={priority} onChange={(v) => setPriority(v as Risk['priority'])}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </SelectField>
          </div>

          <SelectField label="Stage" value={stage} onChange={(v) => setStage(v as Risk['stage'])}>
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectField>

          {error && (
            <div className="flex items-center gap-2 text-[12px] text-danger">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {isEdit && onDeleteRequest ? (
              <button
                type="button"
                onClick={onDeleteRequest}
                className="px-3.5 py-2 text-[12px] font-semibold text-danger hover:bg-danger-dim rounded-lg transition-all"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim()}
                className="px-3.5 py-2 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add Risk'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Same field components as OpportunityFormModal.tsx, kept local here
// rather than shared since neither is exported from there.
function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  required,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      >
        {children}
      </select>
    </div>
  );
}
