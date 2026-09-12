import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchMetrics } from '../../features/metrics/metricsSlice';
import type { Metric } from '../../features/metrics/metricsSlice';
import type { CurrencyCode } from '../../features/auth/authSlice';
import { formatCompactMoney } from '../../features/customers/formatters';
import { ExplanationCard } from './ExplanationCard';

/**
 * The metric layer, grouped the way a manager reads it rather than the way
 * the backend computes it. A key the backend adds later that isn't listed
 * here lands in "Other" rather than vanishing — the registry is the source
 * of truth, this is only the seating plan.
 */
const GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Revenue', keys: ['active_arr', 'forecast_arr', 'nrr', 'at_risk_arr', 'average_arr'] },
  { title: 'Retention', keys: ['logo_retention', 'churned_arr_12m', 'top_three_share'] },
  { title: 'Usage', keys: ['seat_utilisation', 'shelfware_arr', 'at_capacity_arr'] },
  { title: 'Engagement', keys: ['coverage', 'dark_accounts', 'dark_arr'] },
  { title: 'Health', keys: ['healthy_share', 'poor_health_count', 'active_customers'] },
  { title: 'Support', keys: ['open_tickets'] },
  { title: 'Knowledge', keys: ['open_questions', 'stale_questions', 'contributions_30d'] },
];

function formatValue(metric: Metric, value: number | null, currency: CurrencyCode): string {
  if (value === null) return '—';
  if (metric.unit === 'money') return formatCompactMoney(value, currency);
  if (metric.unit === 'percent') return `${value}%`;
  return String(Math.round(value));
}

/** Whether a move is good, bad or neither — the metric says which way is up. */
function tone(metric: Metric): 'success' | 'danger' | 'neutral' {
  if (metric.change === null || metric.change === 0 || metric.better === 'none') return 'neutral';
  const improved = metric.better === 'up' ? metric.change > 0 : metric.change < 0;
  return improved ? 'success' : 'danger';
}

function monthName(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  });
}

function MetricTile({
  metric,
  currency,
  open,
  onWhy,
}: {
  metric: Metric;
  currency: CurrencyCode;
  open: boolean;
  onWhy: () => void;
}) {
  const t = tone(metric);
  const colour = { success: 'text-success', danger: 'text-danger', neutral: 'text-ink-faint' }[t];
  const Arrow =
    metric.change === null || metric.change === 0
      ? Minus
      : metric.change > 0
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <div
      className="bg-surface border border-line-subtle rounded-lg px-[13px] py-[11px] flex flex-col gap-[3px]"
      title={metric.note}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-ink-faint truncate">
          {metric.label}
        </span>
        <button
          type="button"
          onClick={onWhy}
          aria-expanded={open}
          aria-label={`Why ${metric.label}`}
          className={`text-[11px] font-bold shrink-0 hover:underline ${open ? 'text-ink' : 'text-accent'}`}
        >
          {open ? 'Hide' : 'Why?'}
        </button>
      </div>
      <div className="text-[22px] font-semibold leading-tight tracking-tight tabular-nums text-ink">
        {formatValue(metric, metric.value, currency)}
      </div>
      <div className={`flex items-center gap-1 text-[11px] ${colour}`}>
        {metric.previous === null ? (
          <span className="text-ink-faint">no month-end recorded yet</span>
        ) : metric.change === null ? (
          <span className="text-ink-faint">unmeasured at {monthName(metric.previous.period_end)} end</span>
        ) : (
          <>
            <Arrow className="w-3 h-3 shrink-0" />
            <span className="tabular-nums">
              {metric.change === 0
                ? 'unchanged'
                : `${metric.change > 0 ? '+' : ''}${formatValue(metric, metric.change, currency)}`}
            </span>
            <span className="text-ink-faint">since {monthName(metric.previous.period_end)} end</span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The first real thing on the Brain dashboard: the organisation's headline
 * numbers, from the metric registry, each with its move since the last
 * month-end.
 *
 * Gated on `view_all_accounts` on both ends. These are whole-organisation
 * figures; a CSM's own book is scoped to their customers and this panel
 * would otherwise hand them the company's ARR.
 */
export function MetricLayerPanel() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { data, isLoading, error } = useAppSelector((state) => state.metrics);
  // One open explanation at a time; it renders full-width under its group.
  const [whyKey, setWhyKey] = useState<string | null>(null);

  useEffect(() => {
    if (canSeeAll) dispatch(fetchMetrics());
  }, [dispatch, canSeeAll]);

  if (!canSeeAll) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        Organisation-wide numbers need the view-all-accounts capability; your dashboards show
        your own book.
      </div>
    );
  }

  const byKey = new Map((data?.metrics ?? []).map((metric) => [metric.key, metric]));
  const seated = new Set(GROUPS.flatMap((group) => group.keys));
  const other = (data?.metrics ?? []).filter((metric) => !seated.has(metric.key));
  const groups = [
    ...GROUPS.map((group) => ({
      title: group.title,
      metrics: group.keys.map((key) => byKey.get(key)).filter((m): m is Metric => Boolean(m)),
    })),
    ...(other.length ? [{ title: 'Other', metrics: other }] : []),
  ].filter((group) => group.metrics.length > 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-ink">Business metrics</h2>
          <p className="text-[11.5px] text-ink-faint">
            Every headline number, defined once and read from the same rollups the dashboards
            draw — with its move since the last month-end.
          </p>
        </div>
        {data && (
          <span className="text-[11px] text-ink-faint whitespace-nowrap">as of {data.as_of}</span>
        )}
      </div>

      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      {isLoading && !data && <p className="text-[12px] text-ink-faint">Loading…</p>}

      {groups.map((group) => (
        <div key={group.title} className={isLoading ? 'opacity-60 transition-opacity' : ''}>
          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            {group.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
            {group.metrics.map((metric) => (
              <MetricTile
                key={metric.key}
                metric={metric}
                currency={data!.currency}
                open={whyKey === metric.key}
                onWhy={() => setWhyKey(whyKey === metric.key ? null : metric.key)}
              />
            ))}
          </div>
          {whyKey && group.metrics.some((m) => m.key === whyKey) && (
            <div className="mt-2">
              <ExplanationCard metricKey={whyKey} asOf={data?.as_of} />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
