import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { HealthCategory, LifecycleCategory } from '../organizations/tableData';
import { fetchAccountStats } from '../../features/customers/customersSlice';
import { formatCompactMoney } from '../../features/customers/formatters';
import { useOrgCurrency } from '../../hooks';
import type { AppDispatch, RootState } from '../../store';

type MetricTab = 'count' | 'mrr' | 'arr';

// Same donut/tab/metric-item building blocks as the Organizations
// page's own MetricsPanel — kept as local copies here rather than a
// new shared export, matching how AccountsMetricsBanner (organizations/
// Details.tsx) and the standalone Account page's own formatArr already
// each keep their own copy rather than sharing one.
function DonutChart({ segments, size = 44 }: { segments: { value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 36 36" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--border-default)" strokeWidth="3.5" />
      </svg>
    );
  }

  const paths = segments.reduce<ReactNode[]>((acc, seg, i) => {
    const pct = (seg.value / total) * 100;
    const prevPct = segments.slice(0, i).reduce((s, sg) => s + (sg.value / total) * 100, 0);
    const dashoffset = -prevPct;
    acc.push(
      <circle
        key={i}
        cx="18" cy="18" r="15.9155"
        fill="none"
        stroke={seg.color}
        strokeWidth="3.5"
        strokeDasharray={`${pct} ${100 - pct}`}
        strokeDashoffset={dashoffset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
      />
    );
    return acc;
  }, []);

  return (
    <svg viewBox="0 0 36 36" style={{ width: size, height: size }}>
      <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--border-subtle)" strokeWidth="3.5" />
      {paths}
    </svg>
  );
}

function TabPill({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
        isActive
          ? 'text-accent bg-accent-dim shadow-sm'
          : 'text-ink-faint hover:text-ink-muted hover:bg-subtle'
      }`}
    >
      {label}
    </button>
  );
}

function MetricItem({ color, label, value, formatted }: { color: string; label: string; value: number; formatted?: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-[12px] text-ink-muted mb-0.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} /> {label}
      </div>
      <span className="text-xl font-bold text-ink leading-tight">
        {formatted || value.toLocaleString()}
      </span>
    </div>
  );
}

const ZERO_BUCKET = { count: 0, mrr: 0, arr: 0 };

// Same Health/NPS/Lifecycle rollup sections as the Organizations page's
// own MetricsPanel, backed by GET /api/v1/accounts/stats/
// (AccountStatsView) instead of /customers/stats/ — see that view's
// own docstring for the bucketing/NPS-denominator rules, identical
// here. No Renewal section — Account has no renewal-window concept
// exposed anywhere yet, unlike Customer's own ?renewal_within=.
//
// Unlike the Organizations page's own MetricsPanel, "Number of
// Accounts" isn't passed in as a prop from the table's own (possibly
// search-filtered) fetch — it's summed from the health buckets here
// instead, which always reflects every account the tenant has
// regardless of the table's current search/company filter (same total
// AccountStatsView itself aggregated over).
export function MetricsPanel() {
  const [healthTab, setHealthTab] = useState<MetricTab>('count');
  const [lifecycleTab, setLifecycleTab] = useState<MetricTab>('count');

  const dispatch = useDispatch<AppDispatch>();
  const { accountStats, accountStatsError } = useSelector((state: RootState) => state.customers);
  const currency = useOrgCurrency();

  useEffect(() => {
    dispatch(fetchAccountStats());
  }, [dispatch]);

  const healthMetrics = useMemo(() => {
    const cats: HealthCategory[] = ['good', 'average', 'poor'];
    return Object.fromEntries(cats.map((c) => [c, accountStats?.health[c] ?? ZERO_BUCKET])) as Record<
      HealthCategory,
      typeof ZERO_BUCKET
    >;
  }, [accountStats]);

  const npsMetrics = useMemo(() => {
    const nps = accountStats?.nps;
    return {
      promoters: nps?.promoters ?? 0,
      passives: nps?.passives ?? 0,
      detractors: nps?.detractors ?? 0,
      npsScore: nps?.score ?? 0,
    };
  }, [accountStats]);

  const lifecycleMetrics = useMemo(() => {
    const stages: LifecycleCategory[] = ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'expansion', 'churn', 'other'];
    const buckets = Object.fromEntries(stages.map((s) => [s, accountStats?.lifecycle[s] ?? ZERO_BUCKET])) as Record<
      LifecycleCategory,
      typeof ZERO_BUCKET
    >;
    return { stages, buckets };
  }, [accountStats]);

  const healthDonutData = (tab: MetricTab) => {
    const h = healthMetrics;
    return [
      { value: h.good[tab], color: 'var(--success)' },
      { value: h.average[tab], color: 'var(--warning)' },
      { value: h.poor[tab], color: 'var(--danger)' },
    ];
  };

  const lifecycleColors: Record<LifecycleCategory, string> = {
    onboarding: 'var(--info)', kickoff: 'var(--accent)', adoption: 'var(--accent-hover)',
    live: 'var(--success)', renewal: 'var(--warning)', expansion: 'var(--success)',
    churn: 'var(--danger)', other: 'var(--text-tertiary)',
  };

  const lifecycleShortLabels: Record<LifecycleCategory, string> = {
    onboarding: 'ON', kickoff: 'KI', adoption: 'AD', live: 'LI',
    renewal: 'RE', expansion: 'EX', churn: 'CH', other: 'OT',
  };

  const lifecycleDonutData = (tab: MetricTab) => {
    return lifecycleMetrics.stages
      .filter(s => lifecycleMetrics.buckets[s][tab] > 0)
      .map(s => ({
        value: lifecycleMetrics.buckets[s][tab],
        color: lifecycleColors[s],
      }));
  };

  const getHealthValue = (cat: HealthCategory) => {
    const val = healthMetrics[cat][healthTab];
    if (healthTab === 'count') return val.toString();
    return formatCompactMoney(val, currency);
  };

  const totalCount = healthMetrics.good.count + healthMetrics.average.count + healthMetrics.poor.count;

  return (
    <div
      className="flex items-stretch w-full h-[110px] font-sans rounded-xl border border-line bg-surface/70 shadow-sm mb-4"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >

      {/* Health Section */}
      <div className="flex flex-col flex-1 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Health</span>
          <div className="flex items-center gap-0.5">
            <TabPill label="COUNT" isActive={healthTab === 'count'} onClick={() => setHealthTab('count')} />
            <TabPill label="MRR" isActive={healthTab === 'mrr'} onClick={() => setHealthTab('mrr')} />
            <TabPill label="ARR" isActive={healthTab === 'arr'} onClick={() => setHealthTab('arr')} />
          </div>
          {accountStatsError && <span className="text-[10px] font-medium text-danger normal-case">Couldn't load</span>}
        </div>
        <div className="flex items-center gap-5">
          <div className="flex gap-5">
            <MetricItem color="var(--success)" label="Good" value={healthMetrics.good[healthTab]} formatted={getHealthValue('good')} />
            <MetricItem color="var(--warning)" label="Average" value={healthMetrics.average[healthTab]} formatted={getHealthValue('average')} />
            <MetricItem color="var(--danger)" label="Poor" value={healthMetrics.poor[healthTab]} formatted={getHealthValue('poor')} />
          </div>
          <div className="ml-2">
            <DonutChart segments={healthDonutData(healthTab)} />
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* NPS Section */}
      <div className="flex flex-col flex-1 px-5 py-4">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide flex items-center gap-2">
          NPS
          {accountStatsError && <span className="text-[10px] font-medium text-danger normal-case">Couldn't load</span>}
        </div>
        <div className="flex items-center gap-5 mt-0.5">
          <span className="text-[38px] font-light text-ink leading-none tracking-tight">
            {npsMetrics.npsScore > 0 ? '+' : ''}{npsMetrics.npsScore}
          </span>
          <div className="flex flex-col text-[12px] text-ink-muted font-medium gap-1">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-success" /> Promoters</div>
              <span className="font-semibold text-ink ml-4">{npsMetrics.promoters}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-warning" /> Passives</div>
              <span className="font-semibold text-ink ml-4">{npsMetrics.passives}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-danger" /> Detractors</div>
              <span className="font-semibold text-ink ml-4">{npsMetrics.detractors}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Lifecycle Stages Section */}
      <div className="flex flex-col flex-1 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Lifecycle Stages</span>
          <div className="flex items-center gap-0.5">
            <TabPill label="COUNT" isActive={lifecycleTab === 'count'} onClick={() => setLifecycleTab('count')} />
            <TabPill label="MRR" isActive={lifecycleTab === 'mrr'} onClick={() => setLifecycleTab('mrr')} />
            <TabPill label="ARR" isActive={lifecycleTab === 'arr'} onClick={() => setLifecycleTab('arr')} />
          </div>
          {accountStatsError && <span className="text-[10px] font-medium text-danger normal-case">Couldn't load</span>}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col w-[200px]">
            <div className="flex items-end gap-[3px] h-8 w-full border-b border-line pb-0.5">
              {lifecycleMetrics.stages.map(stage => {
                const val = lifecycleMetrics.buckets[stage][lifecycleTab];
                const maxVal = Math.max(...lifecycleMetrics.stages.map(s => lifecycleMetrics.buckets[s][lifecycleTab]));
                const heightPct = maxVal > 0 ? Math.max((val / maxVal) * 100, val > 0 ? 8 : 3) : 3;
                return (
                  <div
                    key={stage}
                    className="flex-1 rounded-t-[2px] transition-all duration-300"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: val > 0 ? lifecycleColors[stage] : 'var(--border-default)',
                    }}
                    title={`${stage}: ${lifecycleTab === 'count' ? val : formatCompactMoney(val, currency)}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[8px] font-bold text-ink-faint mt-1 uppercase w-full">
              {lifecycleMetrics.stages.map(s => (
                <span key={s} className="flex-1 text-center">{lifecycleShortLabels[s]}</span>
              ))}
            </div>
          </div>
          <DonutChart segments={lifecycleDonutData(lifecycleTab)} size={40} />
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Number of Accounts */}
      <div className="flex flex-col px-5 py-4 min-w-[140px]">
        <div className="mb-3 text-[13px] font-semibold text-ink tracking-wide">Number of Accounts</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="relative w-4 h-4 text-info">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>
          </div>
          <span className="text-2xl font-bold text-ink leading-tight">{totalCount}</span>
        </div>
      </div>

    </div>
  );
}
