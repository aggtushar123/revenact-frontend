import { Fragment, useEffect, useState } from 'react';
import { ShieldAlert, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { ApiError } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import {
  createCustomFieldDefinition,
  createCustomObjectDefinition,
  deleteCustomFieldDefinition,
  deleteCustomObjectDefinition,
  fetchCustomObjectDefinitions,
} from '../../features/customObjects/customObjectsApi';
import type {
  CustomFieldDefinition,
  CustomFieldType,
  CustomObjectDefinition,
} from '../../features/customObjects/types';

const FIELD_TYPE_OPTIONS: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'picklist', label: 'Picklist' },
];

// Backs Settings > Custom Objects (Navbar's own sub-tab, previously a
// hardcoded "Custom Objects (2/3)" label falling through to
// SettingPlaceholder — see SettingsPage.tsx). Same admin-only-write,
// same overall list/expand/add-form/ConfirmDialog shape as
// WebhooksPage.tsx, since defining a new object/field type is
// tenant-wide config exactly like a webhook — but unlike Webhooks,
// *reading* the list here is open to any org member (IsAuthenticated
// on GET — see revenact-backend's own CustomObjectDefinitionListCreateView
// docstring), since every CSM needs to know what object tabs exist to
// use them on a real Customer/Account page (CustomObjectsTab.tsx).
export function CustomObjectsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const [definitions, setDefinitions] = useState<CustomObjectDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(isAdmin);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomObjectDefinition | null>(null);
  const [deleteFieldTarget, setDeleteFieldTarget] = useState<{
    definitionId: number;
    field: CustomFieldDefinition;
  } | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAppliesToCustomer, setNewAppliesToCustomer] = useState(true);
  const [newAppliesToAccount, setNewAppliesToAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [showFieldForm, setShowFieldForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [isFieldSubmitting, setIsFieldSubmitting] = useState(false);
  const [fieldAddError, setFieldAddError] = useState<string | null>(null);

  useEffect(() => {
    // A CSM never sees the list rendered below (the early !isAdmin
    // return above skips straight to the "ask an admin" notice) — a
    // CSM works with real records on the Customer/Account page's own
    // CustomObjectsTab instead, not here. No point fetching what
    // won't be shown, same reasoning as WebhooksPage's own gate.
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

  function resetFieldForm() {
    setShowFieldForm(false);
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions('');
    setFieldAddError(null);
  }

  async function handleAddField(definitionId: number) {
    setFieldAddError(null);
    setIsFieldSubmitting(true);
    try {
      const field = await createCustomFieldDefinition(definitionId, {
        name: newFieldName,
        field_type: newFieldType,
        is_required: newFieldRequired,
        picklist_options:
          newFieldType === 'picklist'
            ? newFieldOptions
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean)
            : [],
      });
      setDefinitions((current) =>
        current.map((d) => (d.id === definitionId ? { ...d, fields: [...d.fields, field] } : d))
      );
      resetFieldForm();
    } catch (err) {
      setFieldAddError(err instanceof ApiError ? err.message : 'Could not add this field.');
    } finally {
      setIsFieldSubmitting(false);
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
          Only an organisation admin can define custom objects — ask yours to add one, or open a
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
            Define your own object types — each with its own fields — to track on Organizations
            and/or Accounts.
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
                <Fragment key={definition.id}>
                  <tr className="hover:bg-subtle/40 transition-colors">
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          setExpandedId((id) => (id === definition.id ? null : definition.id));
                          resetFieldForm();
                        }}
                        className="flex items-center gap-1.5 text-[13px] font-bold text-ink hover:text-accent transition-colors"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${expandedId === definition.id ? 'rotate-180' : ''}`}
                        />
                        {definition.name}
                      </button>
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
                  {expandedId === definition.id && (
                    <tr>
                      <td colSpan={5} className="px-5 py-4 bg-subtle/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">Fields</p>
                          <button
                            onClick={() => setShowFieldForm((v) => !v)}
                            className="flex items-center gap-1 text-[11.5px] font-bold text-accent hover:text-accent-hover"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add field
                          </button>
                        </div>

                        {definition.fields.length === 0 ? (
                          <p className="text-[12.5px] text-ink-faint mb-2">No fields yet.</p>
                        ) : (
                          <ul className="flex flex-col gap-1.5 mb-2">
                            {definition.fields.map((field) => (
                              <li
                                key={field.id}
                                className="flex items-center gap-2 text-[12.5px] text-ink-muted"
                              >
                                <span className="font-semibold text-ink">{field.name}</span>
                                <span>· {field.field_type_display}</span>
                                {field.is_required && <span className="text-danger">· Required</span>}
                                {field.field_type === 'picklist' && (
                                  <span>· {field.picklist_options.join(', ')}</span>
                                )}
                                <button
                                  onClick={() => setDeleteFieldTarget({ definitionId: definition.id, field })}
                                  aria-label={`Delete field ${field.name}`}
                                  className="ml-1 p-1 hover:bg-subtle rounded-md text-ink-faint hover:text-danger transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        {showFieldForm && (
                          <div className="flex flex-col gap-2.5 bg-surface border border-line-subtle rounded-lg p-3.5 mt-2">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="text"
                                value={newFieldName}
                                onChange={(e) => setNewFieldName(e.target.value)}
                                placeholder="Field name"
                                className="flex-1 px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent"
                              />
                              <select
                                value={newFieldType}
                                onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                                className="px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent"
                              >
                                {FIELD_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <label className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted whitespace-nowrap cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newFieldRequired}
                                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                                />
                                Required
                              </label>
                            </div>
                            {newFieldType === 'picklist' && (
                              <input
                                type="text"
                                value={newFieldOptions}
                                onChange={(e) => setNewFieldOptions(e.target.value)}
                                placeholder="Options, comma-separated (e.g. Gold, Silver, Bronze)"
                                className="w-full px-3 py-1.5 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent"
                              />
                            )}
                            {fieldAddError && <p className="text-[12px] text-danger">{fieldAddError}</p>}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleAddField(definition.id)}
                                disabled={!newFieldName.trim() || isFieldSubmitting}
                                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isFieldSubmitting ? 'Adding…' : 'Add'}
                              </button>
                              <button
                                onClick={resetFieldForm}
                                className="text-[12px] font-semibold text-ink-muted hover:text-ink"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
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

      {deleteFieldTarget && (
        <ConfirmDialog
          title={`Delete field "${deleteFieldTarget.field.name}"?`}
          message="Existing records keep whatever value they already had for it, but it won't show or be editable anymore — this can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteCustomFieldDefinition(deleteFieldTarget.definitionId, deleteFieldTarget.field.id);
            setDefinitions((current) =>
              current.map((d) =>
                d.id === deleteFieldTarget.definitionId
                  ? { ...d, fields: d.fields.filter((f) => f.id !== deleteFieldTarget.field.id) }
                  : d
              )
            );
          }}
          onClose={() => setDeleteFieldTarget(null)}
        />
      )}
    </div>
  );
}
