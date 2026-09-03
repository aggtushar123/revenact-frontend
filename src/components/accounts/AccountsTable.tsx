import { useNavigate } from 'react-router-dom';
import { Building, Pencil } from 'lucide-react';
import { HEALTH_COLORS, LIFECYCLE_LABELS, initials, csatColor } from '../../features/customers/formatters';
import { mapAccountToAccountRow } from '../../features/customers/mapToAccountRow';
import type { Account } from '../../features/customers/customersSlice';

interface AccountsTableProps {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  /** Index (0-based) of the first row in `accounts` within the full
   * (possibly search/company-filtered) result set. */
  offset: number;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onEditRequest: (account: Account) => void;
}

// `accounts` is already just this one server-fetched, server-filtered
// page — same "no local slicing" convention as ContactsTable/
// OrganizationsTable. No checkboxes/bulk actions and no Delete column
// here — Account has neither today (see AccountListView's own
// docstring on the backend), same capability as the Organization
// Details page's own Accounts tab.
export function AccountsTable({
  accounts,
  isLoading,
  error,
  offset,
  count,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  onEditRequest,
}: AccountsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full bg-surface rounded-xl border border-line shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="overflow-x-auto overflow-y-auto w-full flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max relative pb-16">
          <thead className="text-[12px] font-bold text-ink-muted bg-surface shadow-[0_1px_0_0_var(--border-default)]">
            <tr>
              <th className="px-6 py-4 font-bold border-b border-line-subtle sticky left-0 z-20 bg-surface shadow-[1px_0_0_0_var(--border-default)]">Account</th>
              <th className="px-6 py-4 font-bold border-b border-line-subtle">Organization</th>
              <th className="px-6 py-4 font-bold border-b border-line-subtle">Owner</th>
              <th className="px-6 py-4 font-bold border-b border-line-subtle">Lifecycle Stage</th>
              <th className="px-6 py-4 font-bold border-b border-line-subtle">Health</th>
              <th className="px-6 py-4 font-bold border-b border-line-subtle text-center">CSAT</th>
              <th className="px-3 py-4 font-bold border-b border-line-subtle sticky right-0 z-30 bg-surface shadow-[-1px_0_0_0_var(--border-default)]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="text-[13px] text-ink-muted whitespace-nowrap bg-surface relative z-0">
            {accounts.map((a) => {
              // Same null-handling as mapToAccountRow.ts/mapToOrgRow.ts:
              // a missing CSAT reads as "N/A", not a fabricated
              // real-looking value.
              const csat = a.csat_score !== null ? parseFloat(a.csat_score) : null;

              return (
              <tr key={a.id} className="group hover:bg-subtle transition-colors">
                <td className="px-6 py-4 border-b border-line-subtle relative sticky left-0 z-10 bg-surface group-hover:bg-subtle shadow-[1px_0_0_0_var(--border-default)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-dim text-accent flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0 border border-accent/40">
                      {initials(a.name)}
                    </div>
                    <span
                      className="font-bold text-ink tracking-tight cursor-pointer hover:text-accent hover:underline transition-colors"
                      onClick={() =>
                        // Same "pass the already-known real AccountRow
                        // through navigation state" pattern as the
                        // Organization Details page's own Accounts tab
                        // — this list already has everything that
                        // mapper needs except the parent org's own
                        // domain/address/email/phone (not part of this
                        // flat endpoint's response), which fall back to
                        // blank the same way an unset Account-level
                        // value already does.
                        navigate(`/accounts/${a.id}`, {
                          state: { account: mapAccountToAccountRow(a, a.customer, a.customer_name, '', '', '', '') },
                        })
                      }
                    >
                      {a.name}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                  <div
                    className="flex items-center gap-2 text-ink-muted font-medium hover:text-accent cursor-pointer w-fit"
                    onClick={() => navigate(`/organizations/${a.customer}`)}
                  >
                    <Building className="w-3.5 h-3.5 text-ink-faint" />
                    {a.customer_name}
                  </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle font-medium">
                  {a.owner?.name ?? 'Unassigned'}
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                  <span className="px-2.5 py-1 rounded-md bg-subtle border border-line-subtle text-[11.5px] font-bold text-ink-muted uppercase tracking-tight">
                    {LIFECYCLE_LABELS[a.lifecycle_stage] ?? 'Other'}
                  </span>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${HEALTH_COLORS[a.health_category]}`}></span>
                    <span className="font-bold text-ink-muted">{a.health_score}</span>
                  </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                  <div className="flex justify-center w-full">
                    <div className={`${csat === null ? 'bg-line-strong' : csatColor(csat)} text-white px-3 py-1 rounded text-[12px] font-bold min-w-[56px] text-center`}>
                      {csat === null ? 'N/A' : `${csat}%`}
                    </div>
                  </div>
                </td>

                <td className="px-3 py-4 border-b border-line-subtle sticky right-0 z-10 bg-surface group-hover:bg-subtle shadow-[-1px_0_0_0_var(--border-default)] transition-colors text-center">
                  <button
                    type="button"
                    aria-label={`Edit ${a.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRequest(a);
                    }}
                    className="p-1.5 cursor-pointer hover:bg-line rounded-md transition-colors inline-block text-ink-faint opacity-0 group-hover:opacity-100 hover:text-accent"
                  >
                    <Pencil className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
              );
            })}
            {!isLoading && !error && accounts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-20 text-center text-ink-faint font-medium">No accounts found.</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-20 text-center text-ink-faint font-medium">Loading accounts…</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={7} className="p-20 text-center text-danger font-medium">{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-line-subtle bg-surface shrink-0 mt-auto relative z-10">
        <div className="text-[13px] text-ink-muted font-medium tracking-tight">
          Showing {count === 0 ? 0 : offset + 1}-{offset + accounts.length} of {count} accounts
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="px-3 py-1.5 rounded border border-line text-ink-muted hover:text-ink-muted hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none text-[12px] font-medium"
          >
            Prev
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="px-3 py-1.5 rounded border border-line text-ink-muted hover:text-ink-muted hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none text-[12px] font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
