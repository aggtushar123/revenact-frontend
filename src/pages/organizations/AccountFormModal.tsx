import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import { apiFetch, ApiError } from '../../lib/apiClient';
import { createAccount, updateAccount } from '../../features/customers/customersSlice';
import type { Account } from '../../features/customers/customersSlice';
import type { User } from '../../features/auth/authSlice';

interface AccountFormModalProps {
  /** The organization this account belongs to (for Add) or already
   * belongs to (for Edit) — addresses the nested /customers/<id>/accounts/
   * URL. Never sent as part of the write payload itself; the backend
   * takes it from the URL, same as Customer takes `organisation` from
   * the caller rather than the request body. */
  customerId: number;
  /** Present for Edit, omitted for Add. */
  account?: Account;
  onClose: () => void;
}

// Same product decision as OrganizationFormModal: only what's editable
// while an account is being onboarded — identity, ownership, lifecycle
// stage, and renewal date. Health, pulse, AI pulse, NPS/CSAT, and ARR
// are meant to eventually sync from other systems, not be hand-typed
// here — see AccountWritePayload's own docstring.
const LIFECYCLE_OPTIONS: { value: Account['lifecycle_stage']; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'kickoff', label: 'Kickoff' },
  { value: 'adoption', label: 'Adoption' },
  { value: 'live', label: 'Live' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'churn', label: 'Churn' },
  { value: 'other', label: 'Other' },
];

export function AccountFormModal({ customerId, account, onClose }: AccountFormModalProps) {
  const dispatch = useAppDispatch();
  const isEdit = !!account;

  const [name, setName] = useState(account?.name ?? '');
  const [domain, setDomain] = useState(account?.domain ?? '');
  const [ownerId, setOwnerId] = useState<string>(account?.owner ? String(account.owner.id) : '');
  const [lifecycleStage, setLifecycleStage] = useState<Account['lifecycle_stage']>(
    account?.lifecycle_stage ?? 'onboarding'
  );
  const [renewalDate, setRenewalDate] = useState(account?.renewal_date ?? '');

  const [members, setMembers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Same owner-picker source as OrganizationFormModal — any org member
    // is a valid account owner, matching the backend's own validation.
    apiFetch<User[]>('/auth/members/')
      .then(setMembers)
      .catch(() => {
        // A failed member list just means the owner dropdown falls back
        // to "Unassigned" only — not worth blocking the whole form over.
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const data = {
      name: name.trim(),
      domain: domain.trim(),
      owner_id: ownerId ? Number(ownerId) : null,
      lifecycle_stage: lifecycleStage,
      renewal_date: renewalDate || null,
    };
    try {
      if (isEdit) {
        await dispatch(updateAccount({ customerId, id: account.id, ...data })).unwrap();
      } else {
        await dispatch(createAccount({ customerId, ...data })).unwrap();
      }
      onClose();
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err instanceof ApiError
            ? err.message
            : `Could not ${isEdit ? 'save changes to' : 'add'} the account.`
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
          <h2 className="text-[15px] font-bold text-ink">
            {isEdit ? `Edit ${account.name}` : 'Add Account'}
          </h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Name" value={name} onChange={setName} required autoFocus />
          <TextField label="Domain" value={domain} onChange={setDomain} placeholder="na.acme.com" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Owner" value={ownerId} onChange={setOwnerId}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Lifecycle Stage"
              value={lifecycleStage}
              onChange={(v) => setLifecycleStage(v as Account['lifecycle_stage'])}
            >
              {LIFECYCLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </div>
          <TextField label="Renewal Date" value={renewalDate} onChange={setRenewalDate} type="date" />

          <p className="text-[11px] text-ink-faint">
            Health, pulse, AI pulse, NPS/CSAT, and ARR aren't set here — those are meant to sync in from
            billing/usage/survey data once that's built.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-[12px] text-danger">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-3.5 py-2 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        type={type}
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
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
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
