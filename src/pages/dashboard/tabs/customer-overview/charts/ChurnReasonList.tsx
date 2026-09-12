import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { ChurnReason } from '../../../../../features/portfolio/portfolioSlice';
import { formatCompactMoney } from '../../../../../features/customers/formatters';

export interface ChurnReasonListProps {
  reasons: ChurnReason[];
  currency: CurrencyCode;
}

/**
 * Why the customers who left, left — ranked by the ARR that went with them.
 *
 * Ranked by money rather than by count, because two small accounts leaving
 * over price and one large one leaving over a missing feature are not the same
 * problem, and a count chart says they are.
 *
 * `churn_reason` is a free-text field. The backend folds case and whitespace
 * and nothing more, so near-duplicates like "Budget Cut" and "Budget cuts"
 * survive as separate rows. That is reported rather than hidden — the footnote
 * is the argument for giving the field a set of choices.
 */
export function ChurnReasonList({ reasons, currency }: ChurnReasonListProps) {
  const widest = Math.max(1, ...reasons.map((reason) => reason.arr));
  const folded = reasons.filter((reason) => reason.spellings > 1).length;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 pt-3">
        <h3 className="text-[13px] font-bold text-ink">Why they left</h3>
        <p className="text-[11px] text-ink-faint mt-[1px]">
          Churn reasons by the ARR that left with them
        </p>
      </div>

      {reasons.length === 0 ? (
        <p className="px-4 py-6 text-[12px] text-ink-faint">
          No customers in this selection have churned.
        </p>
      ) : (
        <>
          <ul className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-[10px]">
            {reasons.map((reason) => (
              <li key={reason.reason}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12px] font-medium text-ink truncate">
                    {reason.reason}
                  </span>
                  <span className="text-[11px] text-ink-muted tabular-nums shrink-0">
                    {formatCompactMoney(reason.arr, currency)} · {reason.customers}
                  </span>
                </div>
                <div className="mt-[3px] h-[10px] rounded-[3px] bg-subtle overflow-hidden">
                  <div
                    className="h-full rounded-[3px] bg-danger/70"
                    style={{ width: `${(reason.arr / widest) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-3 text-[10.5px] text-ink-faint">
            Reasons are free text, grouped on case only — similar wordings stay separate.
            {folded > 0 &&
              ` ${folded} ${folded === 1 ? 'row here already merges' : 'rows here already merge'} several spellings.`}
          </p>
        </>
      )}
    </div>
  );
}
