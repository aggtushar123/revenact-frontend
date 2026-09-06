import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Boxes, Network, Layers } from 'lucide-react';
import { ApiError } from '../../lib/apiClient';
import {
  fetchAllCustomObjectRecords,
  fetchCustomObjectDefinition,
} from '../../features/customObjects/customObjectsApi';
import { displayValue } from '../../features/customObjects/displayValue';
import type { CustomObjectDefinition, CustomObjectRecord } from '../../features/customObjects/types';

// The real destination behind the sidebar's own dynamic "CUSTOM
// OBJECTS" section (Sidebar.tsx) — one org-wide, read-only table per
// object definition, spanning every Organization/Account it applies
// to (unlike CustomObjectsTab.tsx, which is scoped to one specific
// parent already known from the Details page it's mounted on). Same
// tier as the standalone Organizations/Accounts/Contacts list pages,
// but far simpler: no add/edit here — a new record needs a real
// parent picked first, which belongs on that parent's own page (this
// page's own row click navigates there instead of duplicating that
// flow).
//
// `key={id}` below forces a full remount when navigating from one
// custom object straight to another (two different sidebar items,
// same route pattern) — simpler and more correct than resetting
// isLoading/error/records by hand inside an effect that reruns on a
// changed id, which would either leak the previous object's rows for
// a moment or need a synchronous setState right in the effect body.
export function CustomObjectRecordsPage() {
  const { id } = useParams<{ id: string }>();
  return <CustomObjectRecordsPageForId key={id} definitionId={Number(id)} />;
}

function CustomObjectRecordsPageForId({ definitionId }: { definitionId: number }) {
  const navigate = useNavigate();

  const [definition, setDefinition] = useState<CustomObjectDefinition | null>(null);
  const [records, setRecords] = useState<CustomObjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchCustomObjectDefinition(definitionId), fetchAllCustomObjectRecords(definitionId)])
      .then(([def, recs]) => {
        if (cancelled) return;
        setDefinition(def);
        setRecords(recs);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Could not load this custom object.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [definitionId]);

  function goToParent(record: CustomObjectRecord) {
    if (record.parent_type === 'customer' && record.customer_id) {
      navigate(`/organizations/${record.customer_id}`);
    } else if (record.account_id) {
      navigate(`/accounts/${record.account_id}`);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] text-ink-faint">Loading…</div>
    );
  }

  if (error || !definition) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] text-danger">
        {error ?? 'Custom object not found.'}
      </div>
    );
  }

  const fields = definition.fields;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6">
      <div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">{definition.name}</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Every real {definition.name} record across your organization.
        </p>
      </div>

      <div className="flex-1 bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-1 text-center">
            <Boxes className="w-8 h-8 text-ink-faint mb-1" />
            <p className="text-[14px] font-semibold text-ink-muted">No records yet.</p>
            <p className="text-[12.5px] text-ink-faint">
              Add one from an Organization's or Account's own Custom Objects tab.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-subtle/40 border-b border-line-subtle">
                <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">
                  Organization / Account
                </th>
                {fields.map((field) => (
                  <th
                    key={field.id}
                    className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider"
                  >
                    {field.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {records.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => goToParent(record)}
                  className="hover:bg-subtle/40 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 text-[13px] font-bold text-ink">
                    <span className="flex items-center gap-2">
                      {record.parent_type === 'customer' ? (
                        <Network className="w-3.5 h-3.5 text-danger shrink-0" />
                      ) : (
                        <Layers className="w-3.5 h-3.5 text-info shrink-0" />
                      )}
                      {record.parent_name}
                    </span>
                  </td>
                  {fields.map((field) => (
                    <td key={field.id} className="px-5 py-3 text-[13px] text-ink-muted font-medium">
                      {displayValue(field, record)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
