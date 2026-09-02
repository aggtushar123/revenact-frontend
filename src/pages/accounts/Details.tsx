import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  RefreshCw,
  MoreHorizontal,
  Layout,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';
import { ACCOUNTS_DATA } from '../../components/organizations/accountsData';
import { ActivityFeed, PinnedAttributes } from '../../components/shared';
import type { AttributeDef } from '../../components/shared';

export function AccountDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('General');
  const [is360Enabled, setIs360Enabled] = useState(true);
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);

  const account = ACCOUNTS_DATA.find(a => a.id === id) || ACCOUNTS_DATA[0];

  const tabs = [
    { name: 'General', count: null },
    { name: 'Organizations', count: 1 },
    { name: 'Contacts', count: 6 },
    { name: 'Pipelines', count: 3 },
    { name: 'Custom Objects', count: 0 },
    { name: 'Success Plans', count: null },
    { name: 'Canvas List', count: null },
  ];

  // Build the pinned attributes for this account
  const accountAttributes: AttributeDef[] = [
    { label: 'Revenact ID', value: account.revenactId.toString() },
    { label: 'Account Name', value: account.name },
    { label: 'AI Pulse-Score', value: account.aiPulseScore, type: 'truncated' },
    { label: 'AI Pulse-Reason', value: account.aiPulseReason, type: 'truncated' },
    { label: 'Pulse', value: '', type: 'pulse' },
    { label: 'Account Owner', value: account.owner, type: 'owner', ownerAvatar: account.avatar },
  ];

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Tab Navigation */}
      <div className="bg-surface border-b border-line-subtle px-6 flex items-center justify-between shrink-0 z-10">
        <nav className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative h-full text-[13.5px] font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === tab.name ? 'text-accent' : 'text-ink-muted hover:text-ink-muted'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className={`text-[11px] font-bold ${activeTab === tab.name ? 'text-accent' : 'text-ink-faint'}`}>
                  ({tab.count})
                </span>
              )}
              {activeTab === tab.name && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent rounded-t-full shadow-[0_-2px_6px_rgba(45,212,168,0.35)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5 pt-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[11.5px] font-bold text-ink-faint uppercase tracking-widest mt-0.5">Enable new 360 UI</span>
            <button
              onClick={() => setIs360Enabled(!is360Enabled)}
              className={`w-9 h-[21px] rounded-full relative transition-all duration-300 ${is360Enabled ? 'bg-accent' : 'bg-line'}`}
            >
              <div className={`absolute top-[2.5px] w-4 h-4 bg-surface rounded-full shadow-sm transition-all duration-300 ${is360Enabled ? 'right-[2.5px]' : 'left-[2.5px]'}`} />
            </button>
          </div>

          <div className="h-6 w-px bg-subtle" />

          <HeaderAction icon={<MessageCircle className="w-[18px] h-[18px]" />} />
          <HeaderAction icon={<RefreshCw className="w-[18px] h-[18px]" />} />
          <HeaderAction icon={<MoreHorizontal className="w-[18px] h-[18px]" />} />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-subtle/50">
        {activeTab === 'General' ? (
          <div className="flex flex-col gap-4 w-full px-6 pt-5 pb-4 h-full">
            {/* Metrics Banner */}
            <AccountMetricsBanner account={account} />

            {/* Main content: Pinned Attributes + Activity Feed */}
            <div className="flex gap-4 w-full flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              {/* Collapsed toggle */}
              {!isPinnedOpen && (
                <div className="flex flex-col items-center pt-3 shrink-0">
                  <button
                    onClick={() => setIsPinnedOpen(true)}
                    className="p-1.5 bg-surface border border-line rounded-lg shadow-sm text-ink-faint hover:text-accent hover:border-accent/40 transition-all"
                    title="Expand panel"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Pinned Attributes Panel */}
              {isPinnedOpen && (
                <div className="w-[320px] flex flex-col bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden shrink-0">
                  <PinnedAttributes
                    entityName={account.name}
                    attributes={accountAttributes}
                    onCollapse={() => setIsPinnedOpen(false)}
                  />
                </div>
              )}

              {/* Activity Feed */}
              <div className="flex-1 overflow-hidden bg-surface rounded-xl border border-line-subtle shadow-sm flex flex-col">
                <ActivityFeed
                  entityId={account.id}
                  entityType="account"
                  healthColor="bg-success"
                  overviewInfo={{
                    domain: `${account.name.toLowerCase().replace(/\s+/g, '')}.com`,
                    location: 'London, UK',
                    email: `contact@${account.name.toLowerCase().replace(/\s+/g, '')}.com`,
                    phone: '+1 (800) 275-2273',
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-ink-faint py-24 bg-surface m-6 rounded-3xl border-2 border-dashed border-line-subtle shadow-inner">
            <div className="w-20 h-20 bg-subtle rounded-[28px] flex items-center justify-center mb-6 shadow-xs border border-line-subtle">
              <Layout className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] opacity-40">{activeTab} coming soon</p>
            <p className="text-[11px] font-bold text-ink-faint uppercase tracking-widest mt-2">Integrating Salesforce Data...</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Metrics Banner ─────────────────────────────────────────────────────────────

// Same unified glass-strip pattern as the organizations list's own
// MetricsPanel and the parent Organization Details page's own
// MetricsBanner (react-ts-app/src/pages/organizations/Details.tsx) — one
// cohesive card with divided sections, rather than this page's previous
// standalone card with its own smaller dots/typography scale. The
// numbers themselves are unchanged (still the same placeholders this
// page always showed — see this component's own history — not real
// per-account data yet); only the presentation was brought in line.
function AccountMetricsBanner({ account }: { account: typeof ACCOUNTS_DATA[0] }) {
  const healthScore = 9.3;
  const healthPct = (healthScore / 10) * 100;
  const npsScore = 100;
  const csatPct = 100;

  return (
    <div
      className="flex items-stretch w-full h-[110px] font-sans rounded-xl border border-line bg-surface/70 shadow-sm"
      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Health Score */}
      <div className="flex items-center gap-4 flex-1 px-5 py-4 min-w-0">
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg-subtle)" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--success)" strokeWidth="3.5"
              strokeDasharray={`${healthPct} ${100 - healthPct}`} strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Health Score</span>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-2xl font-bold text-ink leading-none">{healthScore}</span>
            <span className="text-[12px] font-medium text-ink-muted truncate">
              {account.lifecycleStage ?? 'Live (Enterprise)'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* CSM Pulse */}
      <div className="flex flex-col justify-center flex-1 px-5 py-4 min-w-0">
        <span className="text-[13px] font-semibold text-ink tracking-wide mb-2">CSM Pulse</span>
        <span className="text-xl font-bold leading-none truncate text-success">Very Satisfied</span>
      </div>

      <div className="w-px bg-line my-3" />

      {/* NPS */}
      <div className="flex flex-col flex-1 px-5 py-4">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">NPS</div>
        <div className="flex items-center gap-5 mt-0.5">
          <span className="text-[38px] font-light text-ink leading-none tracking-tight">
            {npsScore > 0 ? '+' : ''}{npsScore}
          </span>
          <div className="flex flex-col text-[12px] text-ink-muted font-medium gap-1">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-success" /> Promoters</div>
              <span className="font-semibold text-ink ml-4">10</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-warning" /> Passives</div>
              <span className="font-semibold text-ink ml-4">0</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-danger" /> Detractors</div>
              <span className="font-semibold text-ink ml-4">0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* CSAT Score */}
      <div className="flex flex-col px-5 py-4 min-w-[140px]">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">CSAT Score</div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xl font-bold text-ink leading-tight">{csatPct}%</span>
          <div className="shrink-0" style={{ width: 40, height: 40 }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg-subtle)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--success)" strokeWidth="3.5"
                strokeDasharray={`${csatPct} ${100 - csatPct}`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Total ARR */}
      <div className="flex flex-col px-5 py-4 min-w-[130px] justify-center">
        <span className="text-[13px] font-semibold text-ink tracking-wide mb-2">Total ARR</span>
        <span className="text-xl font-bold text-ink leading-tight">
          ${account.arr ? (account.arr >= 1_000_000 ? `${(account.arr / 1_000_000).toFixed(1)}M` : `${(account.arr / 1_000).toFixed(0)}K`) : '1.2M'}
        </span>
      </div>
    </div>
  );
}

function HeaderAction({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 hover:bg-subtle rounded-lg text-ink-faint transition-all border border-transparent hover:border-line-subtle hover:text-accent">
      {icon}
    </button>
  );
}
