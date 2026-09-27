import { Pencil, Plus } from 'lucide-react';
import type { Account } from '../../../features/customers/customersSlice';
import { QUIET } from '../portfolio/styles';
import { CountChip } from './CountChip';

/** The account chips (spec §1.4): All, each account and the organization
 *  itself, numbered by the story's `counts.by_account`. Accounts do carry
 *  health, ARR, renewal, NPS, CSAT and CSM pulse (round-1/round-2 fixes,
 *  2026-09-27 corrected this comment, which previously claimed otherwise) —
 *  the chips stay name plus count by design, and those figures live on the
 *  Details tab's Accounts section instead. The row also adds an account and
 *  edits the chosen one (the old Accounts tab's two real actions). */
export function AccountChips({
  accounts,
  loading,
  error,
  counts,
  selected,
  onSelect,
  onRetry,
  onAdd,
  onEdit,
}: {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  /** `counts.by_account` from the story (`all`, `none`, each account in
   *  scope by id); null until it lands. */
  counts: Record<string, number> | null;
  /** An account id, 'none', or '' for All. */
  selected: string;
  onSelect: (value: string) => void;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (account: Account) => void;
}) {
  const total = counts ? (counts.all ?? 0) : null;
  const orgCount = counts?.none ?? 0;
  const current = accounts.find((account) => String(account.id) === selected) ?? null;
  // The accounts endpoint lists every account of the organization; the
  // story counts only those in this viewer's scope. Once it has counted, an
  // account it leaves out is not this viewer's to filter by.
  const shown = counts ? accounts.filter((account) => String(account.id) in counts) : accounts;

  const chip = (value: string, label: string, n: number | null) => {
    const pressed = selected === value;
    return (
      <CountChip key={value || 'all'} label={label} count={n} pressed={pressed} onClick={() => onSelect(pressed && value ? '' : value)} />
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* From sm the group lends its chips to the row (display: contents), so
          chips, Edit and Add account wrap as one row; on phones the chips
          scroll sideways and the two actions follow. */}
      <div role="group" aria-label="Filter by account" className="flex min-w-0 max-w-full gap-2 overflow-x-auto sm:contents">
        {loading && accounts.length === 0 ? (
          <span role="status" aria-label="Loading accounts" className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden="true" className="h-8 w-24 animate-pulse rounded-full bg-subtle" />
            ))}
          </span>
        ) : error ? (
          <span className="inline-flex items-center gap-2 text-[13px] text-danger">
            {error}
            <button type="button" onClick={onRetry} className={QUIET}>
              Try again
            </button>
          </span>
        ) : accounts.length ? (
          <>
            {chip('', 'All', total)}
            {shown.map((account) => chip(String(account.id), account.name, counts ? (counts[String(account.id)] ?? 0) : null))}
            {orgCount > 0 || selected === 'none' ? chip('none', 'Organization', counts ? orgCount : null) : null}
          </>
        ) : null}
      </div>
      {current ? (
        <button type="button" onClick={() => onEdit(current)} className={QUIET}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit {current.name}
        </button>
      ) : null}
      <button type="button" onClick={onAdd} className={QUIET}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add account
      </button>
    </div>
  );
}
