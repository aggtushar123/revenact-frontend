import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { updateOrganisation } from '../../features/auth/authSlice';
import { ApiError } from '../../lib/apiClient';
import type { CurrencyCode } from '../../features/auth/authSlice';

// Backs Settings > Currency (Navbar.tsx's own /settings/currency tab,
// unrouted until now). Real, admin-gated persistence via
// Organisation.currency (see revenact-backend's own model docstring) —
// but deliberately just the setting itself: nothing in the app yet
// renders a symbol conditionally on it, every money value elsewhere is
// still a hardcoded "$". That's real, separate work; this page doesn't
// pretend otherwise.
const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

export function CurrencyPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const [selected, setSelected] = useState<CurrencyCode>(user?.organisation.currency ?? 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const savedCurrency = user?.organisation.currency ?? 'USD';
  const isDirty = selected !== savedCurrency;
  const preview = CURRENCY_OPTIONS.find((c) => c.code === selected) ?? CURRENCY_OPTIONS[0];

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await dispatch(updateOrganisation({ currency: selected })).unwrap();
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
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Currency</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          The billing currency this organization operates in.
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
          <label htmlFor="currency-select" className="text-[12px] font-bold text-ink-muted uppercase tracking-wide">
            Currency
          </label>
          <select
            id="currency-select"
            value={selected}
            disabled={!isAdmin}
            onChange={(e) => setSelected(e.target.value as CurrencyCode)}
            className="w-full max-w-xs px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Preview</span>
          <span className="text-[20px] font-bold text-ink">{preview.symbol}12,345.00</span>
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
