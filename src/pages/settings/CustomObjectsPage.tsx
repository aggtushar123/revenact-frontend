import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { useCapability } from '../../hooks';
import { ApiError } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import { createCustomObjectDefinition, deleteCustomObjectDefinition, fetchCustomObjectDefinitions } from '../../features/customObjects/customObjectsApi';
import type { CustomObjectDefinition } from '../../features/customObjects/types';

// Backs Settings > Custom Objects (Navbar's own sub-tab, previously a
// hardcoded "Custom Objects (2/3)" label falling through to
// SettingPlaceholder — see SettingsPage.tsx). Same admin-only-write,
// same overall list/add-form/ConfirmDialog shape as WebhooksPage.tsx,
// since defining a new object is tenant-wide config exactly like a
// webhook — but unlike Webhooks, *reading* the list here is open to
// any org member (IsAuthenticated on GET — see revenact-backend's own
// CustomObjectDefinitionListCreateView docstring), since every CSM
// needs to know what object types exist to use them on a real
// Customer/Account page (CustomObjectsTab.tsx).
//
// This page only creates/deletes object *types* — managing an
// existing one's own fields and browsing/editing its real records both
// live on that object's own real page instead (each row's name links
// there — see pages/customObjects/CustomObjectRecordsPage.tsx and its
// own ManageFieldsPanel), reached the same way from the sidebar's own
// real "Custom Objects" section.
export function CustomObjectsPage() {
  const isAdmin = useCapability('manage_custom_objects');

  const [definitions, setDefinitions] = useState<CustomObjectDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(isAdmin);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomObjectDefinition | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAppliesToCustomer, setNewAppliesToCustomer] = useState(true);
  const [newAppliesToAccount, setNewAppliesToAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    // A CSM never sees the list rendered below (the early !isAdmin
    // return above skips straight to the "ask an admin" notice) — a
    // CSM works with real records on the Customer/Account page's own
    // CustomObjectsTab (or the object's own real page) instead, not
    // here. No point fetching what won't be shown, same reasoning as
    // WebhooksPage's own gate.
    if (!isAdmin) return;

    async function load() {
      try {
        setDefinitions(await fetchCustomObjectDefinitions());
      } catch (err) {
        setLoadError(err instanceof ApiError ? err.message : 'Could not load custom objects.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  function resetAddForm() {
    setShowAddForm(false);
    setNewName('');
    setNewAppliesToCustomer(true);
    setNewAppliesToAccount(false);
    setAddError(null);
  }

  async function handleAdd() {
    setAddError(null);
    setIsSubmitting(true);
    try {
      const created = await createCustomObjectDefinition({
        name: newName,
        applies_to_customer: newAppliesToCustomer,
        applies_to_account: newAppliesToAccount,
      });
      setDefinitions((current) => [...current, created]);
      resetAddForm();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Could not create this custom object.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col h-full w-full p-6 gap-6 max-w-3xl">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Custom Objects</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Your own object types for Organizations and Accounts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          You don't have permission to define custom objects — ask an admin to add one, or open a
          Customer/Account page to use what's already there.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Custom Objects</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Define your own object types to track on Organizations and/or Accounts — open one to
            manage its fields and records.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[13px] font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Object
        </button>
      </div>

      {showAddForm && (
        <div className="bg-surface rounded-xl border border-line-subtle shadow-sm p-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="object-name" className="text-[12px] font-bold text-ink-muted uppercase tracking-wide">
              Name
            </label>
            <input
              id="object-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Opportunity Line Item"
              className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-[13px] text-ink focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[13px] font-medium text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={newAppliesToCustomer}
                onChange={(e) => setNewAppliesToCustomer(e.target.checked)}
              />
              Applies to Organizations
            </label>
            <label className="flex items-center gap-2 text-[13px] font-medium text-ink-muted cursor-pointer">
              <input
                type="checkbox"
                checked={newAppliesToAccount}
                onChange={(e) => setNewAppliesToAccount(e.target.checked)}
              />
              Applies to Accounts
            </label>
          </div>
          {addError && <p className="text-[12.5px] text-danger">{addError}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || (!newAppliesToCustomer && !newAppliesToAccount) || isSubmitting}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
            <button onClick={resetAddForm} className="text-[13px] font-semibold text-ink-muted hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-ink-faint">Loading…</div>
        ) : loadError ? (
          <div className="flex items-center justify-center py-16 text-[13px] text-danger">{loadError}</div>
        ) : definitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-1 text-center">
            <p className="text-[14px] font-semibold text-ink-muted">No custom objects yet.</p>
            <p className="text-[12.5px] text-ink-faint">
              Create one to start tracking your own data on Organizations/Accounts.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Name</th>
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Applies to</th>
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Fields</th>
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Records</th>
                <th className="px-5 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {definitions.map((definition) => (
                <tr key={definition.id} className="hover:bg-subtle/40 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      to={`/custom-objects/${definition.id}`}
                      className="text-[13px] font-bold text-ink hover:text-accent transition-colors"
                    >
                      {definition.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">
                    {[
                      definition.applies_to_customer && 'Organizations',
                      definition.applies_to_account && 'Accounts',
                    ]
                      .filter(Boolean)
                      .join(' & ')}
                  </td>
                  <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{definition.fields.length}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{definition.records_count}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(definition)}
                      aria-label={`Delete ${definition.name}`}
                      className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-danger transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.name}"?`}
          message="This deletes every field and every real record of this object type — this can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteCustomObjectDefinition(deleteTarget.id);
            setDefinitions((current) => current.filter((d) => d.id !== deleteTarget.id));
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
