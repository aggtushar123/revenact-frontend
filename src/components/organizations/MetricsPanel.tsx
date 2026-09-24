import { useState, useMemo, useEffect, useRef } from 'react';
import type { ReactNode, CSSProperties, MouseEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { HealthCategory, LifecycleCategory } from './tableData';
import { RenewalPopover } from './RenewalPopover';
import { fetchUpcomingRenewals, fetchCustomerStats } from '../../features/customers/customersSlice';
import { formatCompactMoney } from '../../features/customers/formatters';
import { useOrgCurrency } from '../../hooks';
import type { AppDispatch, RootState } from '../../store';

type MetricTab = 'count' | 'mrr' | 'arr';

// --- Donut Chart Component ---
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

// --- Tab Pill Component ---
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

// --- Metric Item ---
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

// Renewal window presets — `days` is what the backend's ?renewal_within=
// expects; the rest are just display strings for the pill/card/popover.
const RENEWAL_WINDOWS = [
  { days: 30, pill: '1M', short: 'Next 1 mo', title: 'in the Next 1 Month' },
  { days: 90, pill: '3M', short: 'Next 3 mo', title: 'in the Next 3 Months' },
];

// --- Main Component ---
//
// "Number of Organizations" (below) is deliberately NOT a prop from the
// table's own (possibly search- or drill-filtered, via ?ids=) fetch —
// this panel sums it from the Health buckets instead, the same way
// components/accounts/MetricsPanel.tsx already does for Accounts. That
// keeps it correct even when the table never runs an unfiltered fetch at
// all, e.g. landing straight on /organizations/list?ids=3,7 from a
// dashboard drill — this component's own fetchCustomerStats() call below
// is unconditional and always reflects every organisation.
export function MetricsPanel() {
  const [healthTab, setHealthTab] = useState<MetricTab>('count');
  const [lifecycleTab, setLifecycleTab] = useState<MetricTab>('count');

  // --- Renewal + Stats (both backed by real, live data — see
  // customersSlice.ts's fetchUpcomingRenewals/fetchCustomerStats and
  // revenact-backend's ?renewal_within= / GET /customers/stats/.
  // Independent of the main table's own customers/search state, so
  // neither ever disturbs what the table shows.) ---
  const dispatch = useDispatch<AppDispatch>();
  const { renewals, renewalsCount, renewalsLoading, renewalsError, stats, statsError } = useSelector(
    (state: RootState) => state.customers
  );
  const currency = useOrgCurrency();
  const [renewalDays, setRenewalDays] = useState(RENEWAL_WINDOWS[0].days);
  const [renewalPanelStyle, setRenewalPanelStyle] = useState<CSSProperties | null>(null);
  const renewalWindow = RENEWAL_WINDOWS.find((w) => w.days === renewalDays) ?? RENEWAL_WINDOWS[0];
  const renewalCardRef = useRef<HTMLDivElement>(null);

  const toggleRenewalPanel = (e: MouseEvent<HTMLButtonElement>) => {
    if (renewalPanelStyle) {
      setRenewalPanelStyle(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setRenewalPanelStyle({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
  };

  useEffect(() => {
    dispatch(fetchUpcomingRenewals(renewalDays));
  }, [dispatch, renewalDays]);

  useEffect(() => {
    dispatch(fetchCustomerStats());
  }, [dispatch]);

  // --- Health metrics (real, from stats.health — zero-filled until the
  // fetch resolves or if it fails, rather than leaving the section
  // blank or crashing on a null read) ---
  const healthMetrics = useMemo(() => {
    const cats: HealthCategory[] = ['good', 'average', 'poor'];
    return Object.fromEntries(cats.map((c) => [c, stats?.health[c] ?? ZERO_BUCKET])) as Record<
      HealthCategory,
      typeof ZERO_BUCKET
    >;
  }, [stats]);

  // Every organisation is in exactly one health bucket (see
  // CustomerStatsView's own docstring — archived excluded, churned
  // included, same scope as the table's default listing), so this sum is
  // the book-wide total regardless of what the table itself has fetched.
  const totalCount = healthMetrics.good.count + healthMetrics.average.count + healthMetrics.poor.count;

  // --- NPS (real, from stats.nps) ---
  const npsMetrics = useMemo(() => {
    const nps = stats?.nps;
    return {
      promoters: nps?.promoters ?? 0,
      passives: nps?.passives ?? 0,
      detractors: nps?.detractors ?? 0,
      npsScore: nps?.score ?? 0,
    };
  }, [stats]);

  // --- Lifecycle (real, from stats.lifecycle) ---
  const lifecycleMetrics = useMemo(() => {
    const stages: LifecycleCategory[] = ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'expansion', 'churn', 'other'];
    const buckets = Object.fromEntries(stages.map((s) => [s, stats?.lifecycle[s] ?? ZERO_BUCKET])) as Record<
      LifecycleCategory,
      typeof ZERO_BUCKET
    >;
    return { stages, buckets };
  }, [stats]);

  // --- Health donut data ---
  const healthDonutData = (tab: MetricTab) => {
    const h = healthMetrics;
    return [
      { value: h.good[tab], color: 'var(--success)' },
      { value: h.average[tab], color: 'var(--warning)' },
      { value: h.poor[tab], color: 'var(--danger)' },
    ];
  };

  // --- Lifecycle donut data ---
  // The token system has 5 semantic hues (accent/success/warning/danger/
  // info) for 8 lifecycle stages, so a couple of stages intentionally share
  // a hue here — they're still distinguished by position and label.
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

  // --- Health values for display ---
  const getHealthValue = (cat: HealthCategory) => {
    const val = healthMetrics[cat][healthTab];
    if (healthTab === 'count') return val.toString();
    return formatCompactMoney(val, currency);
  };

  return (
    <div
      className="flex items-stretch w-full h-[110px] font-sans rounded-xl border border-line bg-surface/70 shadow-sm"
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
          {statsError && <span className="text-[10px] font-medium text-danger normal-case">Couldn't load</span>}
          {healthTab !== 'count' && !!stats?.unconverted_count && (
            <span
              className="text-[10px] font-medium text-warning normal-case"
              title={`${stats.unconverted_count} organization${stats.unconverted_count === 1 ? '' : 's'} excluded — no exchange rate set for their currency (Settings > Currency).`}
            >
              {stats.unconverted_count} excluded
            </span>
          )}
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
          {statsError && <span className="text-[10px] font-medium text-danger normal-case">Couldn't load</span>}
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
          {statsError && <span className="text-[10px] font-medium text-danger normal-case">Couldn't load</span>}
          {lifecycleTab !== 'count' && !!stats?.unconverted_count && (
            <span
              className="text-[10px] font-medium text-warning normal-case"
              title={`${stats.unconverted_count} organization${stats.unconverted_count === 1 ? '' : 's'} excluded — no exchange rate set for their currency (Settings > Currency).`}
            >
              {stats.unconverted_count} excluded
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Bar chart */}
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
          {/* Donut */}
          <DonutChart segments={lifecycleDonutData(lifecycleTab)} size={40} />
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Number of Organizations */}
      <div className="flex flex-col px-5 py-4 min-w-[140px]">
        <div className="mb-3 text-[13px] font-semibold text-ink tracking-wide">Number of Organizations</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="relative w-4 h-4 text-warning">
            <svg viewBox="0 0 24 24" className="w-full h-full fill-current"><path d="M12 2L2 20h20L12 2zm0 3.8l6.1 11H5.9L12 5.8z"/></svg>
          </div>
          <span title="Number of organizations" className="text-2xl font-bold text-ink leading-tight">
            {totalCount}
          </span>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Renewal — the one section wired to real, live data (see
          fetchUpcomingRenewals). The popover is a document-click-outside
          portal (see RenewalPopover.tsx), not the overlay-based pattern
          the other popovers in this app use, specifically so the whole
          card (the 1M/3M pills included) stays clickable while it's open —
          "outside" means outside this card, not just outside the popover. */}
      <div ref={renewalCardRef} className="flex flex-col px-5 py-4 min-w-[150px] relative">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Renewal</span>
          <div className="flex items-center gap-0.5">
            {RENEWAL_WINDOWS.map((w) => (
              <TabPill key={w.days} label={w.pill} isActive={renewalDays === w.days} onClick={() => setRenewalDays(w.days)} />
            ))}
          </div>
        </div>
        <button
          onClick={toggleRenewalPanel}
          aria-expanded={renewalPanelStyle !== null}
          aria-label={`View organizations renewing ${renewalWindow.title}`}
          className="flex flex-col items-start text-left group/renewal cursor-pointer mt-1"
        >
          <span className="text-xl font-bold text-ink leading-tight group-hover/renewal:text-accent transition-colors">
            {renewalsLoading && renewals.length === 0 ? '…' : renewalsCount}
          </span>
          <span className="text-[11px] font-medium text-ink-faint mt-0.5 whitespace-nowrap flex items-center gap-1 group-hover/renewal:text-ink-muted transition-colors">
            {renewalWindow.short}
            <ChevronDown className={`w-3 h-3 transition-transform ${renewalPanelStyle ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {renewalPanelStyle && (
          <RenewalPopover
            customers={renewals}
            count={renewalsCount}
            isLoading={renewalsLoading}
            error={renewalsError}
            windowLabel={renewalWindow.title}
            onClose={() => setRenewalPanelStyle(null)}
            style={renewalPanelStyle}
            anchorRef={renewalCardRef}
          />
        )}
      </div>

    </div>
  );
}
