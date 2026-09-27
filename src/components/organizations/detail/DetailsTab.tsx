import { useId } from 'react';
import { Pencil } from 'lucide-react';
import type { Customer } from '../../../features/customers/customersSlice';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { AIAttributesPanel } from '../../shared/AIAttributesPanel';
import { AccountDetails } from '../portfolio/AccountDetails';
import { BUTTON } from '../portfolio/styles';
import { AccountsSection, type AccountsSectionProps } from './AccountsSection';
import { CustomerFacts } from './CustomerFacts';

/** Details (spec §1.7): the connected accounts (the owner's decision,
 *  2026-09-26), then the List's six panels with every field and Edit
 *  details, stacked on phones, then contact and CSAT from the customer
 *  record (spec §2), then the AI attributes that used to sit in the pinned
 *  panel. Edit details sits on the section's heading row, as Add account
 *  does on Accounts, not alone under the panels. */
export function DetailsTab({
  row,
  customerId,
  isSm,
  accounts,
  customer,
  customerError,
  onRetryCustomer,
  onEdit,
}: {
  row: PortfolioRow;
  customerId: number;
  isSm: boolean;
  accounts: AccountsSectionProps;
  /** GET /customers/{id}/; null while it loads or when it failed. */
  customer: Customer | null;
  customerError: string | null;
  onRetryCustomer: () => void;
  /** Absent until the customer record has landed. */
  onEdit?: () => void;
}) {
  const headingId = useId();
  return (
    <div className="flex flex-col gap-3">
      <AccountsSection {...accounts} currency={row.details.commercial.currency} />
      <section aria-labelledby={headingId} className="rounded-xl bg-surface">
        <div data-part="details-heading" className="flex items-center justify-between gap-2 px-3 pt-2 pb-2">
          <h2 id={headingId} className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Organization details
          </h2>
          {onEdit ? (
            <button type="button" onClick={() => onEdit()} className={BUTTON}>
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Edit details
            </button>
          ) : null}
        </div>
        <AccountDetails row={row} stacked={!isSm} />
        <CustomerFacts customer={customer} error={customerError} stacked={!isSm} onRetry={onRetryCustomer} />
        <div className="px-3 pb-4">
          <AIAttributesPanel customerId={customerId} />
        </div>
      </section>
    </div>
  );
}
