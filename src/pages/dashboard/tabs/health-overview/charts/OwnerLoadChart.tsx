import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import type { OwnerLoad } from '../renewal';

export interface OwnerLoadChartProps {
  load: OwnerLoad[];
  currency: CurrencyCode;
  /** The window `load` was built over, for the subtitle. */
  horizonDays: number;
}

/**
 * Who is carrying the renewal book, and how much of theirs is at risk.
 *
 * A capacity question, not a leaderboard: one CSM holding two thirds of next
 * half's renewals is a staffing decision, and it is invisible on every other
 * tab. The red portion is expected loss (ARR × risk), so six shaky small
 * accounts and one shaky large one don't look the same — they aren't.
 *
 * Hand-drawn bars rather than Recharts. Each row is one number against one
 * scale with a label on either side; a charting library would add an axis, a
 * tooltip and a container height for a layout that is two divs and a
 * percentage.
 */
export function OwnerLoadChart({ load, currency, horizonDays }: OwnerLoadChartProps) {
  const widest = Math.max(1, ...load.map((entry) => entry.arr));

  return (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 pt-3">
        <h3 className="text-[13px] font-bold text-ink">Renewal load by owner</h3>
        <p className="text-[11px] text-ink-faint mt-[1px]">
          ARR renewing in the next {horizonDays} days · the shaded part is expected loss
        </p>
      </div>

      {load.length === 0 ? (
        <p className="px-4 py-6 text-[12px] text-ink-faint">
          Nothing renews in this window.
        </p>
      ) : (
        <ul className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-[10px]">
          {load.map((entry) => {
            const width = (entry.arr / widest) * 100;
            // Of the bar, not of the row — so the shaded part reads as "this
            // much of that owner's book", which is the comparison being made.
            const atRisk = entry.arr > 0 ? (entry.exposure / entry.arr) * 100 : 0;

            return (
              <li key={entry.owner}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12px] font-medium text-ink truncate">{entry.owner}</span>
                  <span className="text-[11px] text-ink-muted tabular-nums shrink-0">
                    {formatCompactMoney(entry.arr, currency)} · {entry.count}{' '}
                    {entry.count === 1 ? 'renewal' : 'renewals'}
                  </span>
                </div>
                <div
                  className="mt-[3px] h-[10px] rounded-[3px] bg-subtle overflow-hidden"
                  role="img"
                  aria-label={`${entry.owner}: ${formatMoney(entry.arr, currency)} renewing, ${formatMoney(
                    entry.exposure,
                    currency
                  )} expected loss`}
                >
                  <div
                    className="h-full rounded-[3px] bg-info/70 flex"
                    style={{ width: `${width}%` }}
                  >
                    <div className="h-full bg-danger/80" style={{ width: `${atRisk}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
