import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../../hooks';
import { apiFetch, ApiError } from '../../lib/apiClient';
import { createSurvey } from '../../features/customers/customersSlice';
import type { Survey } from '../../features/customers/customersSlice';

// "Log Survey" from the standalone Surveys page — always creates
// (there's no Edit flow here; "Log Response" on an existing Survey is
// a small inline action on SurveysPage.tsx/SurveysTab.tsx directly, not
// a modal). Company/optional-Account picker duality mirrors
// OpportunityFormModal.tsx's own standalone-Add mode exactly, minus
// everything that modal only needs for its Details-page-embedded mode
// or its Edit mode — neither applies here.
interface SurveyFormModalProps {
  /** Every company to choose from — this modal has no fixed parent the
   * way SurveysTab.tsx's own embedded "Log Survey" does. */
  companies: { id: number; name: string }[];
  onClose: () => void;
  /** Called after a successful create — createSurvey's own
   * extraReducers already unshift into `surveys` directly, so this is
   * just for the caller to close/reset anything of its own; SurveysPage
   * doesn't need it today but it matches the "onSaved after create"
   * convention other form modals use. */
  onSaved?: () => void;
}

export function SurveyFormModal({ companies, onClose, onSaved }: SurveyFormModalProps) {
  const dispatch = useAppDispatch();

  const [surveyType, setSurveyType] = useState<Survey['survey_type']>('nps');
  const [sentAt, setSentAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const [accountOptions, setAccountOptions] = useState<{ id: number; name: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  useEffect(() => {
    if (!selectedCompanyId) {
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
  }, [selectedCompanyId]);

  useEffect(() => {
    setSelectedAccountId('');
  }, [selectedCompanyId]);

  // CES has nowhere to sync a response on an Account (see Survey
  // model's own backend docstring) — the backend rejects it outright,
  // so this just doesn't offer the combination in the first place.
  useEffect(() => {
    if (selectedAccountId && surveyType === 'ces') setSurveyType('nps');
  }, [selectedAccountId, surveyType]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedCompanyId) {
      setError('Pick a company.');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedAccountId) {
        await dispatch(
          createSurvey({ accountId: Number(selectedAccountId), survey_type: surveyType, sent_at: sentAt })
        ).unwrap();
      } else {
        await dispatch(
          createSurvey({ customerId: Number(selectedCompanyId), survey_type: surveyType, sent_at: sentAt })
        ).unwrap();
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        typeof err === 'string' ? err : err instanceof ApiError ? err.message : 'Could not log that survey.'
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
          <h2 className="text-[15px] font-bold text-ink">Log Survey</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Company" value={selectedCompanyId} onChange={setSelectedCompanyId} required>
            <option value="">Select a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          {selectedCompanyId && (
            <SelectField label="Account (optional)" value={selectedAccountId} onChange={setSelectedAccountId}>
              <option value="">Organization survey (no specific account)</option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </SelectField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Type"
              value={surveyType}
              onChange={(v) => setSurveyType(v as Survey['survey_type'])}
            >
              <option value="nps">NPS</option>
              <option value="csat">CSAT</option>
              {/* CES is Customer-only — see the effect above. */}
              {!selectedAccountId && <option value="ces">CES</option>}
            </SelectField>
            <div>
              <label className="block text-[12px] font-semibold text-ink-muted mb-1">Sent</label>
              <input
                type="date"
                value={sentAt}
                onChange={(e) => setSentAt(e.target.value)}
                className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
              />
            </div>
          </div>

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
              disabled={isSaving || !selectedCompanyId}
              className="px-3.5 py-2 bg-accent text-[#0D0F0E] rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Logging…' : 'Log Survey'}
            </button>
          </div>
        </form>
      </div>
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
