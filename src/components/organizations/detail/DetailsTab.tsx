import type { Customer } from '../../../features/customers/customersSlice';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { AIAttributesPanel } from '../../shared/AIAttributesPanel';
import { AccountDetails } from '../portfolio/AccountDetails';
import { AccountsSection, type AccountsSectionProps } from './AccountsSection';
import { CustomerFacts } from './CustomerFacts';

/** Details (spec §1.7): the connected accounts (the owner's decision,
 *  2026-09-26), then the List's six panels with every field and Edit
 *  details, stacked on phones, then contact and CSAT from the customer
 *  record (spec §2), then the AI attributes that used to sit in the pinned
 *  panel. */
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
  return (
    <div className="flex flex-col gap-3">
      <AccountsSection {...accounts} />
      <div className="rounded-xl bg-surface">
        <AccountDetails row={row} stacked={!isSm} onEdit={onEdit ? () => onEdit() : undefined} />
        <CustomerFacts customer={customer} error={customerError} stacked={!isSm} onRetry={onRetryCustomer} />
        <div className="px-3 pb-4">
          <AIAttributesPanel customerId={customerId} />
        </div>
      </div>
    </div>
  );
}
