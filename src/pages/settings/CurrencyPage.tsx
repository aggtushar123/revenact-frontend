import { useEffect, useState } from 'react';
import { ShieldAlert, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { updateOrganisation } from '../../features/auth/authSlice';
import { formatMoney, CURRENCY_OPTIONS } from '../../features/customers/formatters';
import { fetchFxRates, createFxRate, updateFxRate, deleteFxRate } from './fxRatesApi';
import type { FxRate } from './fxRatesApi';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { ApiError } from '../../lib/apiClient';
import type { CurrencyCode } from '../../features/auth/authSlice';

// Backs Settings > Currency (Navbar.tsx's own /settings/currency tab).
// Real, admin-gated persistence via Organisation.currency (see
// revenact-backend's own model docstring). The preview below dogfoods
// the same currency-aware formatMoney() (features/customers/
// formatters.ts) that now backs every money value across the app.
// Exchange Rates (below the currency picker) is Tier 1's own admin-
// maintained FX table — see fxRatesApi.ts and the backend's
// services.fx_rates app.
export function CurrencyPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = useCapability('manage_org_settings');
  const [selected, setSelected] = useState<CurrencyCode>(user?.organisation.currency ?? 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const savedCurrency = user?.organisation.currency ?? 'USD';
  const isDirty = selected !== savedCurrency;

  // --- Exchange Rates — admin-only both ways server-side (IsOrgAdmin on
  // GET too, see FxRateListCreateView's own docstring), so a CSM can't
  // even fetch this list — same "no fetch attempted at all" pattern as
  // WebhooksPage.tsx for the same reason.
  const [rates, setRates] = useState<FxRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(isAdmin);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const [showAddRate, setShowAddRate] = useState(false);
  const [newRateCurrency, setNewRateCurrency] = useState<CurrencyCode | ''>('');
  const [newRateValue, setNewRateValue] = useState('');
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [addRateError, setAddRateError] = useState<string | null>(null);

  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [editRateValue, setEditRateValue] = useState('');
  const [editRateError, setEditRateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FxRate | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      try {
        setRates(await fetchFxRates());
      } catch (err) {
        setRatesError(err instanceof ApiError ? err.message : 'Could not load exchange rates.');
      } finally {
        setRatesLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  // Currencies with no rate yet, excluding whatever the org's own
  // currency currently is — that one needs no rate (it's implicitly 1),
  // and the backend rejects trying to add one for it anyway.
  const availableCurrencies = CURRENCY_OPTIONS.filter(
    (c) => c.code !== savedCurrency && !rates.some((r) => r.currency === c.code)
  );

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      await dispatch(updateOrganisation({ currency: selected })).unwrap();
      setSavedAt(Date.now());
      // Every existing rate is now stale ("X -> the *old* currency") —
      // the backend already cleared them (see OrganisationSettingsView),
      // this just keeps the list on screen from lying about it.
      setRates([]);
    } catch (err) {
      setError(typeof err === 'string' ? err : err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddRate() {
    if (!newRateCurrency || !newRateValue.trim()) return;
    setAddRateError(null);
    setIsAddingRate(true);
    try {
      const created = await createFxRate({
        currency: newRateCurrency,
        rate_to_org_currency: newRateValue.trim(),
      });
      setRates((current) => [...current, created]);
      setNewRateCurrency('');
      setNewRateValue('');
      setShowAddRate(false);
    } catch (err) {
      setAddRateError(err instanceof ApiError ? err.message : 'Could not add that rate.');
    } finally {
      setIsAddingRate(false);
    }
  }

  function startEditing(rate: FxRate) {
    setEditingRateId(rate.id);
    setEditRateValue(rate.rate_to_org_currency);
    setEditRateError(null);
  }

  async function handleSaveEdit(id: number) {
    if (!editRateValue.trim()) return;
    setEditRateError(null);
    try {
      const updated = await updateFxRate(id, { rate_to_org_currency: editRateValue.trim() });
      setRates((current) => current.map((r) => (r.id === id ? updated : r)));
      setEditingRateId(null);
    } catch (err) {
      setEditRateError(err instanceof ApiError ? err.message : 'Could not save that rate.');
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
          You don't have permission to change this.
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
          <span className="text-[20px] font-bold text-ink">{formatMoney(12345, selected)}</span>
        </div>

        {isDirty && rates.length > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Saving will clear your {rates.length} existing exchange rate{rates.length === 1 ? '' : 's'} below —
            they're no longer valid for a different base currency.
          </div>
        )}

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
            {!isDirty && savedAt && <span className="text-[12px] text-success font-medium">Saved.</span>}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-surface rounded-xl border border-line-subtle shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-bold text-ink">Exchange Rates</h2>
              <p className="text-[12px] text-ink-faint mt-0.5">
                A Customer can bill in its own currency (Add/Edit Organization) — these rates convert those
                amounts into {savedCurrency} for the Health/Lifecycle totals above.
              </p>
            </div>
            {availableCurrencies.length > 0 && (
              <button
                onClick={() => setShowAddRate((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add rate
              </button>
            )}
          </div>

          {showAddRate && (
            <div className="flex items-end gap-2 p-3 bg-subtle/40 rounded-lg">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Currency</label>
                <select
                  value={newRateCurrency}
                  onChange={(e) => setNewRateCurrency(e.target.value as CurrencyCode)}
                  className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                >
                  <option value="">Select…</option>
                  {availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">
                  1 {newRateCurrency || '???'} =
                </label>
                <input
                  type="number"
                  step="any"
                  value={newRateValue}
                  onChange={(e) => setNewRateValue(e.target.value)}
                  placeholder={`${savedCurrency} amount`}
                  className="w-32 px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={handleAddRate}
                disabled={!newRateCurrency || !newRateValue.trim() || isAddingRate}
                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingRate ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => { setShowAddRate(false); setAddRateError(null); }}
                className="px-2 py-1.5 text-[12px] font-semibold text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          )}
          {addRateError && <p className="text-[12.5px] text-danger">{addRateError}</p>}

          {ratesLoading ? (
            <p className="text-[12.5px] text-ink-faint py-4 text-center">Loading…</p>
          ) : ratesError ? (
            <p className="text-[12.5px] text-danger py-4 text-center">{ratesError}</p>
          ) : rates.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint py-4 text-center">
              No exchange rates configured yet — every customer is assumed to bill in {savedCurrency}.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between px-3 py-2 bg-subtle/30 rounded-lg text-[13px]"
                >
                  {editingRateId === rate.id ? (
                    <>
                      <span className="text-ink font-medium">1 {rate.currency} =</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <input
                          type="number"
                          step="any"
                          value={editRateValue}
                          onChange={(e) => setEditRateValue(e.target.value)}
                          autoFocus
                          className="w-28 px-2 py-1 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
                        />
                        <span className="text-ink-muted">{savedCurrency}</span>
                        <button
                          onClick={() => handleSaveEdit(rate.id)}
                          className="p-1.5 hover:bg-subtle rounded-md text-success"
                          aria-label="Save rate"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingRateId(null)}
                          className="p-1.5 hover:bg-subtle rounded-md text-ink-faint"
                          aria-label="Cancel editing"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-ink font-medium">
                        1 {rate.currency} = {rate.rate_to_org_currency} {savedCurrency}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditing(rate)}
                          className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-ink"
                          aria-label={`Edit rate for ${rate.currency}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rate)}
                          className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-danger"
                          aria-label={`Delete rate for ${rate.currency}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {editRateError && <p className="text-[12.5px] text-danger">{editRateError}</p>}
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this exchange rate?"
          message={`Customers billing in ${deleteTarget.currency} will be excluded from MRR/ARR totals until a new rate is added.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteFxRate(deleteTarget.id);
            setRates((current) => current.filter((r) => r.id !== deleteTarget.id));
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
