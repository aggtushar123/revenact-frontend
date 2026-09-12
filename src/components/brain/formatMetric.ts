import type { CurrencyCode } from '../../features/auth/authSlice';
import type { MetricUnit } from '../../features/metrics/metricsSlice';
import { formatCompactMoney } from '../../features/customers/formatters';

/** A metric value in its own unit; a dash for unmeasured, never a zero. */
export function formatMetricValue(
  unit: MetricUnit,
  value: number | null,
  currency: CurrencyCode
): string {
  if (value === null) return '—';
  if (unit === 'money') return formatCompactMoney(value, currency);
  if (unit === 'percent') return `${value}%`;
  return String(Math.round(value));
}

/** A change, signed — points for a percent, money or a count otherwise. */
export function formatMetricChange(unit: MetricUnit, change: number, currency: CurrencyCode) {
  const sign = change > 0 ? '+' : '';
  if (unit === 'percent') return `${sign}${change} pts`;
  return `${sign}${formatMetricValue(unit, change, currency)}`;
}

export function monthName(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
}
