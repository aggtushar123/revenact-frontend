import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Edit2 } from 'lucide-react';
import { TABLE_DATA } from './tableData';
import type { HealthCategory, LifecycleCategory } from './tableData';

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

// --- Format currency ---
function formatCurrency(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

// --- Main Component ---
export function MetricsPanel() {
  const [healthTab, setHealthTab] = useState<MetricTab>('count');
  const [lifecycleTab, setLifecycleTab] = useState<MetricTab>('count');

  // --- Computed Health Metrics ---
  const healthMetrics = useMemo(() => {
    const buckets: Record<HealthCategory, { count: number; mrr: number; arr: number }> = {
      good: { count: 0, mrr: 0, arr: 0 },
      average: { count: 0, mrr: 0, arr: 0 },
      poor: { count: 0, mrr: 0, arr: 0 },
    };

    for (const row of TABLE_DATA) {
      const cat = row.healthCategory;
      buckets[cat].count += 1;
      buckets[cat].mrr += row.mrr;
      buckets[cat].arr += row.arr;
    }
    return buckets;
  }, []);

  // --- Computed NPS ---
  const npsMetrics = useMemo(() => {
    let promoters = 0, passives = 0, detractors = 0;
    for (const row of TABLE_DATA) {
      if (row.npsValue > 0) promoters++;
      else if (row.npsValue === 0) passives++;
      else detractors++;
    }
    const total = TABLE_DATA.length;
    const npsScore = total > 0
      ? Math.round(((promoters - detractors) / total) * 100)
      : 0;
    return { promoters, passives, detractors, npsScore };
  }, []);

  // --- Computed Lifecycle ---
  const lifecycleMetrics = useMemo(() => {
    const stages: LifecycleCategory[] = ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'expansion', 'churn', 'other'];
    const buckets = Object.fromEntries(stages.map(s => [s, { count: 0, mrr: 0, arr: 0 }])) as Record<LifecycleCategory, { count: number; mrr: number; arr: number }>;
    for (const row of TABLE_DATA) {
      const cat = row.lifecycleCategory;
      if (buckets[cat]) {
        buckets[cat].count += 1;
        buckets[cat].mrr += row.mrr;
        buckets[cat].arr += row.arr;
      }
    }
    return { stages, buckets };
  }, []);

  // --- Renewal count (within next 1 month) ---
  const renewalCount = useMemo(() => {
    const now = new Date();
    const oneMonthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    let count = 0;
    for (const row of TABLE_DATA) {
      if (row.renewal === '-') continue;
      const d = new Date(row.renewal);
      if (!isNaN(d.getTime()) && d >= now && d <= oneMonthLater) count++;
    }
    return count;
  }, []);

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
    return formatCurrency(val);
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
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">NPS</div>
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
                    title={`${stage}: ${lifecycleTab === 'count' ? val : formatCurrency(val)}`}
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
          <span className="text-2xl font-bold text-ink leading-tight">{TABLE_DATA.length}</span>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Renewal */}
      <div className="flex flex-col px-5 py-4 min-w-[100px]">
        <div className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold text-ink tracking-wide cursor-pointer hover:text-accent transition-colors">
          Renewal <Edit2 className="w-3.5 h-3.5 text-ink-faint" />
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-xl font-bold text-ink leading-tight">{renewalCount}</span>
          <span className="text-[11px] font-medium text-ink-faint mt-0.5 whitespace-nowrap">Next 1 mo</span>
        </div>
      </div>

    </div>
  );
}
