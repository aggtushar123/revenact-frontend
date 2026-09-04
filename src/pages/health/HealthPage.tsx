import { useEffect, useMemo, useState } from 'react';
import { Smile, Meh, Frown, ThumbsUp, Minus, ThumbsDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { useAllEntities } from '../../hooks/useAllEntities';
import { fetchCustomerStats } from '../../features/customers/customersSlice';
import { fetchAllPages } from '../../lib/apiClient';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import { AI_PULSE_LABELS, LIFECYCLE_LABELS } from '../../features/customers/formatters';
import { EntityAvatar } from '../../components/shared';
import type { Customer } from '../../features/customers/customersSlice';
import type { HealthCategory } from '../../components/organizations/tableData';

// Real health signals already live on Customer (see revenact-backend's
// model) and already surfaced piecemeal elsewhere: `health_score`/
// `health_category` back MetricsPanel's own "Health" donut and every
// health dot in the Organizations table; `ai_pulse_score` backs the
// table's "AI Pulse" column and its ActivityFeed reason text; `nps_score`
// backs MetricsPanel's own "NPS" section. This page is the one place
// all three roll up together into a single, whole-tenant health view,
// with a drill-down into who's actually behind each number — something
// no existing page does (the Board/table show one org at a time; the
// Dashboard's own Health Overview tab is still mock-data, see
// docs/API_CONTRACTS.md's Status table).
type MetricTab = 'count' | 'mrr';

const HEALTH_ORDER: HealthCategory[] = ['good', 'average', 'poor'];

const HEALTH_COLORS: Record<HealthCategory, { text: string; bg: string; bar: string; icon: typeof Smile }> = {
  good: { text: 'text-success', bg: 'bg-success-dim', bar: 'bg-success', icon: Smile },
  average: { text: 'text-warning', bg: 'bg-warning-dim', bar: 'bg-warning', icon: Meh },
  poor: { text: 'text-danger', bg: 'bg-danger-dim', bar: 'bg-danger', icon: Frown },
};

const HEALTH_LABELS: Record<HealthCategory, string> = { good: 'Good', average: 'Average', poor: 'Poor' };

const AI_PULSE_ORDER: Customer['ai_pulse_score'][] = ['very_satisfied', 'satisfied', 'moderate', 'high_risk'];

const AI_PULSE_COLORS: Record<string, { text: string; bg: string }> = {
  very_satisfied: { text: 'text-success', bg: 'bg-success-dim' },
  satisfied: { text: 'text-info', bg: 'bg-info-dim' },
  moderate: { text: 'text-warning', bg: 'bg-warning-dim' },
  high_risk: { text: 'text-danger', bg: 'bg-danger-dim' },
};

function formatCompactMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function HealthPage() {
  const dispatch = useAppDispatch();
  const { stats, statsLoading, statsError } = useAppSelector((state) => state.customers);
  const [metricTab, setMetricTab] = useState<MetricTab>('count');
  const [selectedCategory, setSelectedCategory] = useState<HealthCategory | null>(null);

  useEffect(() => {
    dispatch(fetchCustomerStats());
  }, [dispatch]);

  const { entities: customers, isLoading: customersLoading, error: customersError } = useAllEntities<Customer>(
    () => fetchAllPages('/customers/'),
    'organization',
    true
  );

  const maxCount = useMemo(() => {
    if (!stats) return 1;
    return Math.max(1, ...HEALTH_ORDER.map((c) => stats.health[c].count));
  }, [stats]);

  // Not part of CustomerStatsView's own rollup (that endpoint only
  // aggregates health/nps/lifecycle) — cheap to derive client-side
  // since every customer is already fetched for the table below.
  const aiPulseCounts = useMemo(() => {
    const counts: Record<string, number> = { very_satisfied: 0, satisfied: 0, moderate: 0, high_risk: 0 };
    for (const c of customers) {
      if (c.ai_pulse_score) counts[c.ai_pulse_score] += 1;
    }
    return counts;
  }, [customers]);

  const rows = useMemo(() => {
    const mapped = customers.map(mapCustomerToOrgRow);
    const filtered = selectedCategory ? mapped.filter((r) => r.healthCategory === selectedCategory) : mapped;
    const order: Record<HealthCategory, number> = { poor: 0, average: 1, good: 2 };
    return [...filtered].sort((a, b) => order[a.healthCategory] - order[b.healthCategory] || a.health.val - b.health.val);
  }, [customers, selectedCategory]);

  function metricValue(category: HealthCategory): string {
    if (!stats) return '—';
    const bucket = stats.health[category];
    return metricTab === 'count' ? String(bucket.count) : formatCompactMoney(bucket.mrr);
  }

  function toggleCategory(category: HealthCategory) {
    setSelectedCategory((current) => (current === category ? null : category));
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-ink tracking-tight">Customer Health</h1>
          <p className="text-[13px] text-ink-faint font-medium mt-0.5">
            Health score, AI Pulse, and NPS across every organization, in one place.
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-surface border border-line-subtle rounded-lg p-0.5">
          {(['count', 'mrr'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMetricTab(tab)}
              aria-pressed={metricTab === tab}
              className={`text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md transition-colors ${
                metricTab === tab ? 'bg-accent-dim text-accent' : 'text-ink-faint hover:text-ink-muted'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {statsError && <p className="text-[12.5px] text-danger">{statsError}</p>}

      {/* Health distribution */}
      <div className="flex gap-3">
        {HEALTH_ORDER.map((category) => {
          const colors = HEALTH_COLORS[category];
          const Icon = colors.icon;
          const count = stats?.health[category].count ?? 0;
          const widthPct = Math.max(8, Math.round((count / maxCount) * 100));
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              aria-pressed={isSelected}
              className={`flex-1 flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                isSelected ? `${colors.bg} border-transparent shadow-sm` : 'bg-surface border-line-subtle hover:border-line-strong'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isSelected ? colors.text : 'text-ink-faint'}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? colors.text : 'text-ink-faint'}`}>
                  {HEALTH_LABELS[category]}
                </span>
              </div>
              <span className="text-[24px] font-bold text-ink leading-none">
                {statsLoading && !stats ? '—' : metricValue(category)}
              </span>
              <div className="h-1.5 rounded-full bg-subtle overflow-hidden">
                <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${widthPct}%` }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* NPS */}
      <div className="flex items-center gap-6 rounded-xl border border-line-subtle bg-surface p-4">
        <div className="flex flex-col gap-0.5 pr-6 border-r border-line-subtle">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">NPS Score</span>
          <span className="text-[24px] font-bold text-ink leading-none">
            {stats ? (stats.nps.score > 0 ? `+${stats.nps.score}` : stats.nps.score) : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
          <ThumbsUp className="w-4 h-4 text-success" /> {stats?.nps.promoters ?? 0} Promoters
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
          <Minus className="w-4 h-4 text-warning" /> {stats?.nps.passives ?? 0} Passives
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
          <ThumbsDown className="w-4 h-4 text-danger" /> {stats?.nps.detractors ?? 0} Detractors
        </div>
      </div>

      {/* AI Pulse */}
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-bold text-ink-faint uppercase tracking-wider shrink-0">AI Pulse</span>
        {AI_PULSE_ORDER.map((score) => (
          <span
            key={score}
            className={`text-[12px] font-bold px-3 py-1.5 rounded-full ${AI_PULSE_COLORS[score!].bg} ${AI_PULSE_COLORS[score!].text}`}
          >
            {AI_PULSE_LABELS[score!]} · {aiPulseCounts[score!]}
          </span>
        ))}
      </div>

      {/* Detail table */}
      <div className="flex-1 min-h-[240px] flex flex-col bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line-subtle shrink-0">
          <h2 className="text-[13.5px] font-bold text-ink">
            {selectedCategory ? `${HEALTH_LABELS[selectedCategory]} — ${rows.length}` : `All Organizations — ${rows.length}`}
          </h2>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="text-[12px] font-semibold text-accent hover:text-accent-hover">
              Clear filter
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {customersLoading ? (
            <div className="flex items-center justify-center h-full py-16 text-[13px] text-ink-faint">Loading…</div>
          ) : customersError ? (
            <div className="flex items-center justify-center h-full py-16 text-[13px] text-danger">{customersError}</div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center h-full py-16 text-[13px] text-ink-faint">No organizations here.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-subtle/40 border-b border-line-subtle sticky top-0">
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Organization</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Health</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">AI Pulse</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Lifecycle</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">Owner</th>
                  <th className="px-5 py-2.5 text-[11px] font-bold text-ink-faint uppercase tracking-wider">NPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-subtle/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <EntityAvatar name={row.org} logoUrl={row.logo} className={`w-7 h-7 rounded-lg text-[11px] font-bold text-white ${row.bg}`} />
                        <span className="text-[13px] font-bold text-ink">{row.org}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${row.health.clr}`} />
                        <span className="text-[13px] font-medium text-ink-muted">{row.health.val}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{row.aiScore}</td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{LIFECYCLE_LABELS[row.lifecycleCategory]}</td>
                    <td className="px-5 py-3 text-[13px] font-medium text-ink-muted">{row.owner}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${row.npsColor}`} />
                        <span className="text-[13px] font-medium text-ink-muted">{row.nps}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
