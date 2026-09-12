import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CurrencyCode } from '../../../../../features/auth/authSlice';
import type { HealthStatus } from '../../../../../features/health/types';
import { formatCompactMoney, formatMoney } from '../../../../../features/customers/formatters';
import type { QuarterColumn } from '../renewal';
import { STATIC_SERIES } from '../../../../../components/shared/chartAnimation';

const STATUS_COLORS: Record<HealthStatus, string> = {
  Poor: 'var(--danger)',
  Average: 'var(--warning)',
  Good: 'var(--success)',
};

/** Worst at the bottom of the stack, so the at-risk money sits on the axis
 *  where the eye lands rather than floating on top of the healthy revenue. */
const STACK: HealthStatus[] = ['Poor', 'Average', 'Good'];

export interface RenewalQuarterChartProps {
  columns: QuarterColumn[];
  currency: CurrencyCode;
}

/**
 * The renewal calendar, in money.
 *
 * One bar per quarter, stacked by the health of the accounts renewing in it —
 * so "a big quarter" and "a big quarter that is mostly shaky" can't look the
 * same, which is exactly what a chart of account counts does to them.
 */
export function RenewalQuarterChart({ columns, currency }: RenewalQuarterChartProps) {
  const data = useMemo(
    () =>
      columns.map((column) => ({
        name: column.label,
        Good: column.arr.Good,
        Average: column.arr.Average,
        Poor: column.arr.Poor,
        total: column.total,
        count: column.count,
      })),
    [columns]
  );

  const booked = columns.reduce((sum, c) => sum + c.total, 0);
  const atRisk = columns.reduce((sum, c) => sum + c.arr.Poor + c.arr.Average, 0);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div>
          <h3 className="text-[13px] font-bold text-ink">Renewal calendar</h3>
          <p className="text-[11px] text-ink-faint mt-[1px]">
            ARR up for renewal by quarter, coloured by the account's current health
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-ink-muted">{formatCompactMoney(booked, currency)} ahead</p>
          {atRisk > 0 && (
            <p className="text-[11px] font-bold text-danger">
              {formatCompactMoney(atRisk, currency)} not at Good
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 12, left: 4, bottom: 4 }} barSize={48}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={64}
              tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
              tickFormatter={(value: number) => formatCompactMoney(value, currency)}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-subtle)' }}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid var(--border-default)',
                fontSize: '12px',
              }}
              // Untyped parameters: Recharts hands these through as
              // `ValueType | undefined`, and the stack only ever carries
              // numbers, so the coercion is at the boundary rather than an
              // `any` on the signature.
              formatter={(value, name) => [formatMoney(Number(value ?? 0), currency), String(name)]}
            />
            {STACK.map((status) => (
              <Bar {...STATIC_SERIES} key={status} dataKey={status} stackId="arr" fill={STATUS_COLORS[status]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 px-4 pb-3">
        {STACK.map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-[2px]"
              style={{ background: STATUS_COLORS[status] }}
              aria-hidden
            />
            <span className="text-[11px] text-ink-muted">{status}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
