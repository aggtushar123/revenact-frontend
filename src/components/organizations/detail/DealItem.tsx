import { useOrgCurrency } from '../../../hooks';
import type { Opportunity, Risk } from '../../../features/customers/customersSlice';
import { formatMoney } from '../../../features/customers/formatters';
import { accountTag } from '../../../features/organizations/accountScope';
import { PRIORITY_COLORS } from '../../pipelines/kanbanConfig';
import { FOCUS } from '../portfolio/styles';
import { AccountTag } from './ListParts';
import { META } from './listStyles';

/** One opportunity or risk (spec 2026-09-27 §3): the title and its MRR,
 *  then stage, priority, department and the account tag. The whole item
 *  opens the record's existing edit form. Priority is the only colour: it
 *  carries severity. */
export function DealItem({ deal, onOpen }: { deal: Opportunity | Risk; onOpen: () => void }) {
  const currency = useOrgCurrency();
  return (
    <li data-deal={deal.id}>
      <button
        type="button"
        onClick={onOpen}
        className={`flex min-h-11 w-full min-w-0 flex-col px-3 py-2.5 text-left hover:bg-subtle active:bg-line-subtle ${FOCUS}`}
      >
        <span className="flex w-full min-w-0 items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">{deal.title}</span>
          <span className="shrink-0 text-[13px] text-ink-muted">
            <span className="font-mono-brand tabular-nums text-ink">{formatMoney(deal.mrr, currency)}</span> MRR
          </span>
        </span>
        <span className={META}>
          <span className="rounded-full bg-subtle px-2 py-0.5 text-ink">{deal.stage_display}</span>
          <span className={`rounded-full border px-2 py-0.5 ${PRIORITY_COLORS[deal.priority]}`}>{deal.priority_display} priority</span>
          <span>{deal.department ? deal.department_display : 'Whole company'}</span>
          <AccountTag name={accountTag(deal)} />
        </span>
      </button>
    </li>
  );
}
