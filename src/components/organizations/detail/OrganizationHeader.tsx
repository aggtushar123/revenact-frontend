import { useId } from 'react';
import { Ellipsis, Pencil, Plus } from 'lucide-react';
import { PORTFOLIO_FIELDS } from '../../../features/organizations/portfolioFields';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { SignalTag, touchText } from '../portfolio/rowParts';
import { BUTTON, FOCUS, QUIET } from '../portfolio/styles';
import { Menu, type MenuItem } from './Menu';

/** The name row (spec §1.2, and 2026-09-27 §1): initials (never a
 *  third-party logo), the name, owner · lifecycle · last touch, the signal,
 *  then Edit, Add account and ⋯. ⋯ offers Archive and Churn while they still
 *  apply; the server applies its own rules to both, as on the List. */
export function OrganizationHeader({
  row,
  canEdit,
  editError = null,
  onRetryEdit,
  onEdit,
  onArchive,
  onChurn,
  onAddAccount,
}: {
  row: PortfolioRow;
  /** The customer record has landed, so the edit form can open. */
  canEdit: boolean;
  /** Why the record did not land; shown as Edit's reason while it is off. */
  editError?: string | null;
  onRetryEdit?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onChurn: () => void;
  /** Opens the new-account form; it needs only the organization's id. */
  onAddAccount: () => void;
}) {
  const reasonId = useId();
  const blocked = !canEdit && editError ? editError : null;
  const status = row.is_archived ? 'Archived' : row.churned ? 'Churned' : null;
  const actions: MenuItem[] = [
    ...(row.is_archived ? [] : [{ key: 'archive', label: 'Archive', onSelect: onArchive }]),
    ...(row.churned ? [] : [{ key: 'churn', label: 'Churn', onSelect: onChurn, danger: true }]),
  ];
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-subtle font-mono-brand text-[13px] font-semibold text-ink"
      >
        {row.initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h1 data-field="organization" className="min-w-0 truncate text-[22px] font-semibold leading-tight text-ink">
            {row.name}
          </h1>
          {status ? (
            <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-muted">{status}</span>
          ) : null}
          <SignalTag signal={row.signal} />
        </div>
        <p className="truncate text-[13px] text-ink-muted">
          <span data-field="owner">{PORTFOLIO_FIELDS.owner.value(row)}</span> ·{' '}
          <span data-field="lifecycleStage">{row.lifecycle.label}</span> · {touchText(row.last_touch_days)}
        </p>
        {blocked ? (
          <p role="alert" className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-danger">
            <span id={reasonId}>Edit is unavailable: {blocked}</span>
            {onRetryEdit ? (
              <button type="button" onClick={onRetryEdit} className={QUIET}>
                Try again
              </button>
            ) : null}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          disabled={!canEdit}
          aria-describedby={blocked ? reasonId : undefined}
          className={`${BUTTON} min-w-11 justify-center sm:min-w-0`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          {/* Icon-only below sm, as Add account: the name gets the room. */}
          <span className="sr-only sm:not-sr-only">Edit</span>
        </button>
        <button type="button" onClick={onAddAccount} className={`${BUTTON} min-w-11 justify-center sm:min-w-0`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {/* Icon-only below sm, where the row is short of room; the name stays. */}
          <span className="sr-only sm:not-sr-only">Add account</span>
        </button>
        {actions.length ? (
          <Menu
            label={`More actions for ${row.name}`}
            trigger={<Ellipsis className="h-4 w-4" aria-hidden="true" />}
            triggerClassName={`inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-surface text-ink hover:bg-subtle active:bg-line-subtle sm:h-9 sm:w-9 ${FOCUS}`}
            items={actions}
          />
        ) : null}
      </div>
    </div>
  );
}
