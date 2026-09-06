import { useEffect, useState } from 'react';
import { Boxes, Plus, Trash2, Pencil } from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import {
  createCustomObjectRecord,
  deleteCustomObjectRecord,
  fetchCustomObjectDefinitions,
  fetchCustomObjectRecords,
  updateCustomObjectRecord,
} from '../../features/customObjects/customObjectsApi';
import { displayValue } from '../../features/customObjects/displayValue';
import type { CustomFieldDefinition, CustomObjectDefinition, CustomObjectRecord } from '../../features/customObjects/types';
import { ConfirmDialog } from '../organizations/ConfirmDialog';

export interface CustomObjectsTabProps {
  /** Set on the Organization Details page's own Custom Objects tab. */
  customerId?: number;
  /** Set on the standalone Account page's own Custom Objects tab. */
  accountId?: number;
  /** Reports the real total record count across every applicable
   * object once loaded, so the hosting Details page can show it on
   * the tab label itself instead of today's hardcoded `2`/`0`. */
  onCountChange?: (count: number) => void;
}

// A field value as held in the add/edit form's own local state — plain
// strings/booleans straight from each input, coerced to the real
// number/boolean createCustomObjectRecord expects only at submit time
// (see `toPayloadValue`). Kept as strings while editing so a
// half-typed number ("12.") or an empty required field doesn't get
// silently mangled before the user's done typing.
type FormValues = Record<string, string | boolean>;

function initialFormValues(fields: CustomFieldDefinition[], record?: CustomObjectRecord): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const existing = record?.data[field.api_name];
    if (field.field_type === 'boolean') {
      values[field.api_name] = typeof existing === 'boolean' ? existing : false;
    } else {
      values[field.api_name] = existing === undefined || existing === null ? '' : String(existing);
    }
  }
  return values;
}

function toPayload(fields: CustomFieldDefinition[], values: FormValues): CustomObjectRecord['data'] {
  const data: CustomObjectRecord['data'] = {};
  for (const field of fields) {
    const value = values[field.api_name];
    if (field.field_type === 'boolean') {
      data[field.api_name] = Boolean(value);
      continue;
    }
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) continue; // omitted — backend enforces is_required itself
    if (field.field_type === 'number' || field.field_type === 'currency') {
      data[field.api_name] = Number(trimmed);
    } else {
      data[field.api_name] = trimmed;
    }
  }
  return data;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDefinition;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  const baseClass =
    'w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-[12.5px] text-ink focus:outline-none focus:border-accent';

  if (field.field_type === 'boolean') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={field.name}
      />
    );
  }
  if (field.field_type === 'picklist') {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={field.name}
        className={baseClass}
      >
        <option value="">—</option>
        {field.picklist_options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.field_type === 'date' ? 'date' : field.field_type === 'number' || field.field_type === 'currency' ? 'number' : 'text'}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={field.name}
      className={baseClass}
    />
  );
}

// Shared between the Organization Details page's own Custom Objects tab
// and the standalone Account page's — same "one component, driven by
// whichever of customerId/accountId is set" shape as ContactsTab/
// PipelinesTab/CanvasListTab. Unlike those, this fetches its own data
// directly (definitions, then each applicable one's own records)
// rather than through customersSlice — custom objects are entirely
// admin-defined and dynamic, not a fixed entity the rest of that slice
// already knows how to load, same "self-contained feature fetches its
// own data" reasoning as CockpitView.tsx/WebhooksPage.tsx.
export function CustomObjectsTab({ customerId, accountId, onCountChange }: CustomObjectsTabProps) {
  const [definitions, setDefinitions] = useState<CustomObjectDefinition[]>([]);
  const [recordsByDefinition, setRecordsByDefinition] = useState<Record<number, CustomObjectRecord[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [addingForId, setAddingForId] = useState<number | null>(null);
  const [addValues, setAddValues] = useState<FormValues>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingRecord, setEditingRecord] = useState<CustomObjectRecord | null>(null);
  const [editValues, setEditValues] = useState<FormValues>({});

  const [deleteTarget, setDeleteTarget] = useState<CustomObjectRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const allDefinitions = await fetchCustomObjectDefinitions();
        const applicable = allDefinitions.filter((d) =>
          customerId !== undefined ? d.applies_to_customer : d.applies_to_account
        );
        const parent = customerId !== undefined ? { customerId } : { accountId: accountId! };
        const recordLists = await Promise.all(
          applicable.map((definition) => fetchCustomObjectRecords(definition.id, parent))
        );
        if (cancelled) return;

        setDefinitions(applicable);
        const byDefinition: Record<number, CustomObjectRecord[]> = {};
        applicable.forEach((definition, i) => {
          byDefinition[definition.id] = recordLists[i];
        });
        setRecordsByDefinition(byDefinition);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Could not load custom objects.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (customerId !== undefined || accountId !== undefined) load();
    return () => {
      cancelled = true;
    };
  }, [customerId, accountId]);

  // Derived from the same state that actually renders the tables below,
  // rather than recomputed by hand at every add/delete call site — one
  // real source of truth for "how many records exist right now."
  useEffect(() => {
    const total = Object.values(recordsByDefinition).reduce((sum, records) => sum + records.length, 0);
    onCountChange?.(total);
  }, [recordsByDefinition, onCountChange]);

  function startAdding(definition: CustomObjectDefinition) {
    setAddingForId(definition.id);
    setAddValues(initialFormValues(definition.fields));
    setFormError(null);
  }

  async function handleAdd(definition: CustomObjectDefinition) {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const record = await createCustomObjectRecord({
        object_definition_id: definition.id,
        ...(customerId !== undefined ? { customer_id: customerId } : { account_id: accountId! }),
        data: toPayload(definition.fields, addValues),
      });
      setRecordsByDefinition((current) => ({
        ...current,
        [definition.id]: [record, ...(current[definition.id] ?? [])],
      }));
      setAddingForId(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not add this record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditing(record: CustomObjectRecord, definition: CustomObjectDefinition) {
    setEditingRecord(record);
    setEditValues(initialFormValues(definition.fields, record));
    setFormError(null);
  }

  async function handleSaveEdit(definition: CustomObjectDefinition) {
    if (!editingRecord) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const updated = await updateCustomObjectRecord(editingRecord.id, {
        data: toPayload(definition.fields, editValues),
      });
      setRecordsByDefinition((current) => ({
        ...current,
        [definition.id]: current[definition.id].map((r) => (r.id === updated.id ? updated : r)),
      }));
      setEditingRecord(null);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not save this record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40">
        <span className="text-sm font-semibold text-ink-faint">Loading custom objects…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16">
        <span className="text-sm font-semibold text-danger">{loadError}</span>
      </div>
    );
  }

  if (definitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-40 gap-2">
        <Boxes className="w-10 h-10 text-ink-faint" />
        <span className="text-sm font-semibold text-ink-faint">No custom objects yet</span>
        <span className="text-[12px] text-ink-faint">An organisation admin can add one in Settings → Custom Objects.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 bg-subtle/40 font-sans flex flex-col gap-5">
      {definitions.map((definition) => {
        const records = recordsByDefinition[definition.id] ?? [];
        const fields = definition.fields;
        return (
          <div key={definition.id} className="bg-surface rounded-xl border border-line/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line-subtle">
              <h3 className="text-[13.5px] font-bold text-ink">{definition.name}</h3>
              <button
                onClick={() => startAdding(definition)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add row
              </button>
            </div>

            {addingForId === definition.id && (
              <div className="flex flex-col gap-2.5 p-4 bg-subtle/30 border-b border-line-subtle">
                <div className="flex flex-wrap gap-2.5">
                  {fields.map((field) => (
                    <div key={field.id} className="flex flex-col gap-1 min-w-[140px]">
                      <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">
                        {field.name}
                        {field.is_required && ' *'}
                      </label>
                      <FieldInput
                        field={field}
                        value={addValues[field.api_name] ?? ''}
                        onChange={(value) => setAddValues((v) => ({ ...v, [field.api_name]: value }))}
                      />
                    </div>
                  ))}
                </div>
                {formError && <p className="text-[12px] text-danger">{formError}</p>}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAdd(definition)}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    onClick={() => setAddingForId(null)}
                    className="text-[12px] font-semibold text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {records.length === 0 && addingForId !== definition.id ? (
              <p className="text-[12.5px] text-ink-faint font-medium px-4 py-6 text-center">No records yet.</p>
            ) : (
              records.length > 0 && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-subtle/40 border-b border-line-subtle">
                      {fields.map((field) => (
                        <th key={field.id} className="px-4 py-2 text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                          {field.name}
                        </th>
                      ))}
                      <th className="px-4 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {records.map((record) =>
                      editingRecord?.id === record.id ? (
                        <tr key={record.id}>
                          <td colSpan={fields.length + 1} className="p-3 bg-subtle/30">
                            <div className="flex flex-wrap gap-2.5">
                              {fields.map((field) => (
                                <div key={field.id} className="flex flex-col gap-1 min-w-[140px]">
                                  <label className="text-[11px] font-bold text-ink-faint uppercase tracking-wide">
                                    {field.name}
                                  </label>
                                  <FieldInput
                                    field={field}
                                    value={editValues[field.api_name] ?? ''}
                                    onChange={(value) => setEditValues((v) => ({ ...v, [field.api_name]: value }))}
                                  />
                                </div>
                              ))}
                            </div>
                            {formError && <p className="text-[12px] text-danger mt-2">{formError}</p>}
                            <div className="flex items-center gap-3 mt-2.5">
                              <button
                                onClick={() => handleSaveEdit(definition)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-[#0D0F0E] rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50"
                              >
                                {isSubmitting ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingRecord(null)}
                                className="text-[12px] font-semibold text-ink-muted hover:text-ink"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={record.id} className="hover:bg-subtle/40 transition-colors">
                          {fields.map((field) => (
                            <td key={field.id} className="px-4 py-2.5 text-[12.5px] text-ink font-medium">
                              {displayValue(field, record)}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <button
                              onClick={() => startEditing(record, definition)}
                              aria-label="Edit record"
                              className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-accent transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(record)}
                              aria-label="Delete record"
                              className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-danger transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )
            )}
          </div>
        );
      })}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this record?"
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteCustomObjectRecord(deleteTarget.id);
            setRecordsByDefinition((current) => ({
              ...current,
              [deleteTarget.object_definition_id]: current[deleteTarget.object_definition_id].filter(
                (r) => r.id !== deleteTarget.id
              ),
            }));
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
