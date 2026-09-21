import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

// Company/optional-Account picker mirrors SurveyFormModal.tsx's own
// standalone-Add mode exactly. Unlike that modal, this one never calls
// an API itself — the actual Canvas row is created on CanvasEditor.tsx's
// own first save, same deferred-create-until-first-save behavior
// CreateScenario.tsx already has for a brand new Scenario. Picking a
// company here just navigates to `/canvas/create?customerId=...` with
// the parent baked into the URL.
interface NewCanvasModalProps {
  companies: { id: number; name: string }[];
  onClose: () => void;
}

export function NewCanvasModal({ companies, onClose }: NewCanvasModalProps) {
  const navigate = useNavigate();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [accountOptions, setAccountOptions] = useState<{ id: number; name: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  // "Latest request wins" guard for the account fetch below, triggered
  // by the company picker's own onChange rather than an effect keyed
  // on selectedCompanyId — same race-safety as an effect's cleanup
  // function, just driven by the actual user action instead.
  const latestRequestRef = useRef(0);

  function handleCompanyChange(companyId: string) {
    setSelectedCompanyId(companyId);
    setSelectedAccountId('');
    setAccountOptions([]);
    if (!companyId) return;

    const requestId = ++latestRequestRef.current;
    apiFetch<{ id: number; name: string }[]>(`/customers/${companyId}/accounts/`)
      .then((accounts) => {
        if (latestRequestRef.current === requestId) setAccountOptions(Array.isArray(accounts) ? accounts : []);
      })
      .catch(() => {
        if (latestRequestRef.current === requestId) setAccountOptions([]);
      });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId) return;
    const params = new URLSearchParams({ customerId: selectedCompanyId });
    if (selectedAccountId) params.set('accountId', selectedAccountId);
    navigate(`/canvas/create?${params.toString()}`);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-lg p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">New Canvas</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField label="Company" value={selectedCompanyId} onChange={handleCompanyChange} required>
            <option value="">Select a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectField>

          {selectedCompanyId && (
            <SelectField label="Account (optional)" value={selectedAccountId} onChange={setSelectedAccountId}>
              <option value="">Organization canvas (no specific account)</option>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </SelectField>
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
              disabled={!selectedCompanyId}
              className="px-3.5 py-2 bg-accent text-on-accent rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
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
