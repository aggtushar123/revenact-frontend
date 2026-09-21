import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { fetchAllPages, ApiError } from '../../lib/apiClient';
import type { ScenarioRun } from './types';

interface CustomerOption {
  id: number;
  name: string;
}

interface RunNowModalProps {
  onRun: (customerId: number) => Promise<ScenarioRun>;
  onClose: () => void;
}

const STATUS_ICON = {
  ok: <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />,
  skipped: <MinusCircle className="w-3.5 h-3.5 text-ink-faint shrink-0" />,
  failed: <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />,
};

/** The builder's "Run Now" button — picks a real Customer to run the
 * scenario against (see engine.py's own docstring on why only a
 * Customer, not an Account/Contact, is a valid target in v1) and shows
 * the run's own log once it comes back. Runs synchronously on the
 * backend (no task queue) so this modal's "Running…" state is exactly
 * as long as the single POST /run/ request takes. */
export function RunNowModal({ onRun, onClose }: RunNowModalProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScenarioRun | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setCustomers(await fetchAllPages<CustomerOption>('/customers/'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load organizations.');
      } finally {
        setIsLoadingCustomers(false);
      }
    }
    load();
  }, []);

  async function handleRun() {
    if (!selectedId) return;
    setError(null);
    setIsRunning(true);
    try {
      setResult(await onRun(Number(selectedId)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not run this scenario.');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div
        className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">Run Now</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!result && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-ink-muted" htmlFor="run-now-customer">
                Organization
              </label>
              <select
                id="run-now-customer"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={isLoadingCustomers}
                className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              >
                <option value="" disabled>
                  {isLoadingCustomers ? 'Loading…' : 'Select an organization'}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[12px] text-danger">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRun}
                disabled={!selectedId || isRunning}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50"
              >
                {isRunning ? 'Running…' : 'Run'}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <p className={`text-[13px] font-semibold ${result.status === 'success' ? 'text-success' : 'text-danger'}`}>
              {result.status === 'success' ? 'Run completed.' : 'Run finished with a failure.'}
            </p>
            <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {result.log.map((entry, i) => (
                <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-muted">
                  {STATUS_ICON[entry.status]}
                  <span>
                    <span className="font-semibold text-ink">{entry.action ?? 'Flow'}:</span> {entry.detail}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-on-accent rounded-lg text-[13px] font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
