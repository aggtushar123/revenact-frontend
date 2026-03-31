import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Layout,
  ChevronUp,
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
    <div className="flex flex-col h-full bg-[#fcfdfe] overflow-hidden">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-10">
        <nav className="flex items-center gap-8 h-12 overflow-x-auto no-scrollbar whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative h-full text-[13.5px] font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === tab.name ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className={`text-[11px] font-bold ${activeTab === tab.name ? 'text-indigo-400' : 'text-gray-400'}`}>
                  ({tab.count})
                </span>
              )}
              {activeTab === tab.name && (
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-full shadow-[0_-2px_6px_rgba(99,102,241,0.3)]" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5 pt-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Enable new 360 UI</span>
            <button
              onClick={() => setIs360Enabled(!is360Enabled)}
              className={`w-9 h-[21px] rounded-full relative transition-all duration-300 ${is360Enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-[2.5px] w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${is360Enabled ? 'right-[2.5px]' : 'left-[2.5px]'}`} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-100" />

          <HeaderAction icon={<MessageCircle className="w-[18px] h-[18px]" />} />
          <HeaderAction icon={<RefreshCw className="w-[18px] h-[18px]" />} />
          <HeaderAction icon={<MoreHorizontal className="w-[18px] h-[18px]" />} />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8f9fc]/50">
        {activeTab === 'General' ? (
          <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full px-4 pt-5 pb-6 h-full">
            {/* Metrics Banner */}
            <AccountMetricsBanner account={account} />

            {/* Main content: Pinned Attributes + Activity Feed */}
            <div className="flex gap-4 w-full flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              {/* Collapsed toggle */}
              {!isPinnedOpen && (
                <div className="flex flex-col items-center pt-3 shrink-0">
                  <button
                    onClick={() => setIsPinnedOpen(true)}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                    title="Expand panel"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Pinned Attributes Panel */}
              {isPinnedOpen && (
                <div className="w-[320px] flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden shrink-0">
                  <PinnedAttributes
                    entityName={account.name}
                    attributes={accountAttributes}
                    onCollapse={() => setIsPinnedOpen(false)}
                  />
                </div>
              )}

              {/* Activity Feed */}
              <div className="flex-1 overflow-hidden bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
                <ActivityFeed
                  entityId={account.id}
                  entityType="account"
                  healthColor="bg-teal-400"
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
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-24 bg-white m-6 rounded-3xl border-2 border-dashed border-gray-100 shadow-inner">
            <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center mb-6 shadow-xs border border-gray-100">
              <Layout className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-[15px] font-bold uppercase tracking-[0.2em] opacity-40">{activeTab} coming soon</p>
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">Integrating Salesforce Data...</p>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Metrics Banner ─────────────────────────────────────────────────────────────

function AccountMetricsBanner({ account }: { account: typeof ACCOUNTS_DATA[0] }) {
  const healthScore = 9.3;
  const npsScore = 100;
  const csatPct = 100;
  const csatColor = '#00a699';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex overflow-hidden lg:divide-x divide-gray-50 relative group shrink-0">
      {/* Health */}
      <div className="px-4 py-4 flex flex-col gap-1.5 min-w-[130px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Health Score</span>
        <div className="flex items-center gap-2.5 mt-0.5">
          <div className="w-[7px] h-[7px] bg-[#00a699] rounded-full shadow-[0_0_8px_rgba(0,166,153,0.4)]" />
          <span className="text-[22px] font-bold text-gray-900 tracking-tight leading-none">{healthScore}</span>
        </div>
      </div>

      {/* Lifecycle */}
      <div className="px-4 py-4 flex flex-col gap-1.5 min-w-[170px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lifecycle Stage</span>
        <span className="text-[15px] font-bold text-gray-900 mt-1">{account.lifecycleStage ?? 'Live (Enterprise)'}</span>
      </div>

      {/* CSM Pulse */}
      <div className="px-4 py-4 flex flex-col gap-1.5 min-w-[140px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSM Pulse</span>
        <div className="flex items-center gap-2.5 mt-1">
          <div className="w-[7px] h-[7px] bg-[#00a699] rounded-sm" />
          <span className="text-[15px] font-bold text-gray-700">Very Satisfied</span>
        </div>
      </div>

      {/* NPS */}
      <div className="px-4 py-4 flex flex-col gap-1 flex-1 min-w-[220px]">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">NPS</span>
        <div className="flex items-end gap-6 h-full mt-0.5">
          <span className="text-[32px] font-bold text-gray-900 leading-none tracking-tighter">
            {npsScore > 0 ? '+' : ''}{npsScore}
          </span>
          <div className="flex flex-col gap-1 text-[10.5px] font-bold pb-0.5">
            <div className="flex items-center gap-2.5 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#00a699]" />
              <span className="w-16 whitespace-nowrap">Promoters</span>
              <span className="ml-auto text-gray-900">10</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#ffbb00]" />
              <span className="w-16 whitespace-nowrap">Passives</span>
              <span className="ml-auto text-gray-900">0</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-sm bg-[#fa5c5c]" />
              <span className="w-16 whitespace-nowrap">Detractors</span>
              <span className="ml-auto text-gray-900">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSAT */}
      <div className="px-4 py-4 flex flex-col gap-1 min-w-[150px] relative">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">CSAT Score</span>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-[18px] font-bold text-gray-900 leading-none">{csatPct}%</span>
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-50" />
              <circle cx="20" cy="20" r="16" stroke={csatColor} strokeWidth="3" fill="transparent"
                strokeDasharray={`${csatPct} ${100 - csatPct}`} strokeDashoffset="0" />
            </svg>
          </div>
        </div>
      </div>

      {/* ARR */}
      <div className="px-4 py-4 flex flex-col gap-1 min-w-[120px] border-l border-gray-50">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total ARR</span>
        <span className="text-[18px] font-bold text-gray-900 mt-1">
          ${account.arr ? (account.arr >= 1_000_000 ? `${(account.arr / 1_000_000).toFixed(1)}M` : `${(account.arr / 1_000).toFixed(0)}K`) : '1.2M'}
        </span>
      </div>

      {/* Hover actions */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col gap-1.5 lg:flex">
        <div className="p-1 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-300 hover:text-indigo-500">
          <ChevronUp className="w-4 h-4" />
        </div>
        <div className="p-1 hover:bg-gray-50 rounded-full transition-colors cursor-pointer text-gray-300 hover:text-indigo-500">
          <Pencil className="w-[14px] h-[14px]" />
        </div>
      </div>
    </div>
  );
}

function HeaderAction({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 transition-all border border-transparent hover:border-gray-100 hover:text-indigo-600">
      {icon}
    </button>
  );
}
