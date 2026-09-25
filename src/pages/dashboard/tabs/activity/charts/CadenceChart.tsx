import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { CadenceBucket } from '../../../../../features/activity/activitySlice';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';
import { TOOLTIP_STYLE } from '../../../shared/chartPalette';

/** Fresher is better, so this one *is* a scale — and "never" is grey rather
 *  than the darkest red, because it is a different kind of fact: an absence of
 *  records, not a long silence. */
const BUCKET_COLORS: Record<string, string> = {
  week: 'var(--success)',
  month: 'var(--success)',
  stale: 'var(--warning)',
  dark: 'var(--danger)',
  cold: 'var(--danger)',
  never: 'var(--text-tertiary)',
};

/** Axis labels. The API's own names carry their units ("No contact logged"),
 *  which is right in a tooltip and collides with its neighbour under a bar —
 *  six categories in a third-width card leaves about six characters each. */
const SHORT_LABELS: Record<string, string> = {
  week: '≤7d',
  month: '8–30d',
  stale: '31–60d',
  dark: '61–90d',
  cold: '90d+',
  never: 'Never',
};

export interface CadenceChartProps {
  buckets: CadenceBucket[];
  currency: CurrencyCode;
  threshold: number;
}

/**
 * How long it has been since anyone contacted each account.
 *
 * The shape of the book's cadence: a coverage percentage says how many were
 * touched, this says how recently, which is the difference between a team on a
 * rhythm and a team that did everything in one panicked week.
 *
 * Bars are account counts with ARR in the tooltip. Counts lead here — unlike
 * the money-first charts elsewhere — because cadence is a discipline question,
 * and a small account nobody has called is still nobody calling.
 */
export function CadenceChart({ buckets, currency, threshold }: CadenceChartProps) {
  const behind = buckets
    .filter((bucket) => ['dark', 'cold', 'never'].includes(bucket.key))
    .reduce((sum, bucket) => sum + bucket.accounts, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">Contact cadence</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            Accounts by time since any logged contact
          </p>
        </div>
        {behind > 0 && (
          <p className="text-[11px] font-bold text-danger shrink-0">
            {behind} past {threshold} days
          </p>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets.map((bucket) => ({
              ...bucket,
              short: SHORT_LABELS[bucket.key] ?? bucket.name,
            }))}
            margin={{ top: 14, right: 12, left: -18, bottom: 4 }}
            barSize={40}
          >
            <XAxis
              dataKey="short"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
              interval={0}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={38}
              allowDecimals={false}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-subtle)' }}
              contentStyle={{ ...TOOLTIP_STYLE, fontSize: '12px' }}
              formatter={(value, _name, item) => [
                `${value} account${value === 1 ? '' : 's'} · ${formatMoney(
                  Number(item?.payload?.arr ?? 0),
                  currency
                )}`,
                item?.payload?.name ?? '',
              ]}
            />
            <Bar {...STATIC_SERIES} dataKey="accounts" radius={[3, 3, 0, 0]}>
              {buckets.map((bucket) => (
                <Cell key={bucket.key} fill={BUCKET_COLORS[bucket.key] ?? 'var(--text-tertiary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="px-4 pb-3 text-[10.5px] text-ink-faint">
        Counts any logged contact — call, email, note, meeting or activity — on the company or
        any of its accounts. The same rule the health score's Customer Touch component reads.
        {buckets.find((b) => b.key === 'never')?.accounts
          ? ` ${formatCompactMoney(
              buckets.find((b) => b.key === 'never')?.arr ?? 0,
              currency
            )} has no contact on record at all.`
          : ''}
      </p>
    </div>
  );
}
