import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
import type { Account } from '../../../features/customers/customersSlice';
import { AI_PULSE_LABELS } from '../../../features/customers/formatters';
import { PulseDots } from '../portfolio/rowParts';
import { FOCUS, QUIET } from '../portfolio/styles';

export interface AccountsSectionProps {
  /** `GET /customers/{id}/accounts/`, the same read as the chips. */
  items: Account[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (account: Account) => void;
}

function AccountItem({ account, onEdit }: { account: Account; onEdit: (account: Account) => void }) {
  const ai = account.ai_pulse_value;
  return (
    <li data-account={account.id} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-start sm:gap-3">
      <div className="min-w-0 flex-1">
        <Link
          to={`/accounts/${account.id}`}
          className={`inline-flex min-h-11 max-w-full items-center truncate rounded-sm text-[13px] font-semibold text-ink hover:underline sm:min-h-0 ${FOCUS}`}
        >
          {account.name}
        </Link>
        <p className="truncate text-[11px] text-ink-muted">{[account.owner?.name ?? 'No owner', account.domain || null].filter(Boolean).join(' · ')}</p>
        <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-muted">
          <span className="font-mono-brand tabular-nums text-ink">AI {ai == null ? '—' : ai}</span>
          {account.ai_pulse_score ? <span>{AI_PULSE_LABELS[account.ai_pulse_score]}</span> : null}
          {account.pulse.length ? <PulseDots history={account.pulse} /> : null}
        </p>
        {account.ai_pulse_reason ? <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{account.ai_pulse_reason}</p> : null}
      </div>
      <button type="button" aria-label={`Edit ${account.name}`} onClick={() => onEdit(account)} className={`${QUIET} self-start`}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit
      </button>
    </li>
  );
}

/** Accounts on the Details tab (the owner's decision, 2026-09-26: an
 *  account's details are not lost with the old Accounts tab). One list item
 *  per connected account with only what the accounts endpoint serves; the
 *  name opens `/accounts/:id`. Add and Edit are also on the Story tab's chip
 *  row. On phones the item's Edit wraps under its details. */
export function AccountsSection({ items, loading, error, onRetry, onAdd, onEdit }: AccountsSectionProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="rounded-xl bg-surface">
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Accounts
        </h2>
        <button type="button" onClick={onAdd} className={QUIET}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add account
        </button>
      </div>
      {loading && items.length === 0 ? (
        <div role="status" aria-label="Loading accounts">
          <ul aria-hidden="true" className="divide-y divide-line-subtle">
            {[0, 1].map((i) => (
              <li key={i} className="flex flex-col gap-1.5 px-3 py-2.5">
                <span className="block h-3 w-40 animate-pulse rounded bg-subtle" />
                <span className="block h-2.5 w-56 animate-pulse rounded bg-subtle" />
                <span className="block h-2.5 w-full animate-pulse rounded bg-subtle" />
              </li>
            ))}
          </ul>
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-start gap-2 px-3 pb-3">
          <p className="text-[13px] text-danger">{error}</p>
          <button type="button" onClick={onRetry} className={`${QUIET} border border-line`}>
            Try again
          </button>
        </div>
      ) : items.length ? (
        <ul className="divide-y divide-line-subtle">
          {items.map((account) => (
            <AccountItem key={account.id} account={account} onEdit={onEdit} />
          ))}
        </ul>
      ) : (
        <div className="px-3 pb-3">
          <p className="text-[13px] font-semibold text-ink">No accounts yet</p>
          <p className="text-[13px] text-ink-muted">Accounts connected to this organization appear here, each with its owner and pulse.</p>
        </div>
      )}
    </section>
  );
}
