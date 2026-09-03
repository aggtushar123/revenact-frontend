import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  MoreHorizontal,
  Layout,
  MessageCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ACCOUNTS_DATA } from '../../components/organizations/accountsData';
import type { AccountRow } from '../../components/organizations/accountsData';
import { ActivityFeed, PinnedAttributes, EntityAvatar, ContactsTab, PipelinesTab } from '../../components/shared';
import type { AttributeDef } from '../../components/shared';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchContactsForAccount,
  clearContacts,
  fetchOpportunitiesForAccount,
  fetchRisksForAccount,
  clearPipelineData,
  fetchCustomerById,
  clearSelectedCustomer,
} from '../../features/customers/customersSlice';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import type { Customer } from '../../features/customers/customersSlice';

export function AccountDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const {
    contacts,
    contactsLoading,
    contactsError,
    pipelineOpportunities,
    pipelineOpportunitiesLoading,
    pipelineOpportunitiesError,
    pipelineRisks,
    pipelineRisksLoading,
    pipelineRisksError,
    selectedCustomer,
    selectedCustomerLoading,
    selectedCustomerError,
  } = useAppSelector((state) => state.customers);
  const [activeTab, setActiveTab] = useState('General');
  const [is360Enabled, setIs360Enabled] = useState(true);
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);

  // Clicking through from a real org's Accounts tab (see
  // organizations/Details.tsx) carries the real, already-fetched
  // AccountRow via navigation `state` — everything below already just
  // renders whatever AccountRow it's given, so that's the only change
  // needed to make a click-through show the real account end to end.
  // A direct URL visit or refresh has no state to read, so it still
  // falls back to the mock, same as before.
  const accountNavState = location.state as { account: AccountRow } | null;
  const account = accountNavState?.account ?? ACCOUNTS_DATA.find((a) => a.id === id) ?? ACCOUNTS_DATA[0];

  // Same "only fetch real data when reached with a real, already-known
  // parent customer id" convention as ActivityFeed's own `customerId`
  // prop (see this component's JSX below) — a mock-fallback account has
  // no real customer/account id pair to fetch Contacts for.
  useEffect(() => {
    if (accountNavState?.account) {
      dispatch(fetchContactsForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      dispatch(fetchOpportunitiesForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      dispatch(fetchRisksForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      // Powers the Organizations tab below — an Account belongs to
      // exactly one Customer, so this is always a single-record fetch,
      // never a list.
      dispatch(fetchCustomerById(account.orgId));
    } else {
      dispatch(clearContacts());
      dispatch(clearPipelineData());
      dispatch(clearSelectedCustomer());
    }
  }, [dispatch, accountNavState, account]);

  const tabs = [
    { name: 'General', count: null },
    { name: 'Organizations', count: 1 },
    { name: 'Contacts', count: contacts.length },
    { name: 'Pipelines', count: pipelineOpportunities.length + pipelineRisks.length },
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
      {/* Tab Navigation — same structure/spacing as the Organization
          Details page's own tab nav (react-ts-app/src/pages/organizations/
          Details.tsx), which this page previously diverged from: a taller
          h-12 bar, an all-caps bold toggle label with no pill container,
          and 18px icons instead of the shared 16px/p-2 convention. */}
      <nav className="px-6 bg-surface border-b border-line-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8 h-10 overflow-x-auto no-scrollbar whitespace-nowrap">
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
        </div>

        <div className="flex items-center gap-4 py-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-subtle/50 rounded-lg border border-line-subtle">
            <span className="text-[12px] font-medium text-ink-muted">Enable new 360 UI</span>
            <button
              onClick={() => setIs360Enabled(!is360Enabled)}
              className={`w-8 h-4 rounded-full relative cursor-pointer transition-all duration-300 ${is360Enabled ? 'bg-accent' : 'bg-line'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-surface rounded-full shadow-sm transition-all duration-300 ${is360Enabled ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <HeaderAction icon={<MessageCircle className="w-4 h-4" />} />
            <HeaderAction icon={<RefreshCw className="w-4 h-4" />} />
            <HeaderAction icon={<MoreHorizontal className="w-4 h-4" />} />
          </div>
        </div>
      </nav>

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
                  // Only set for a real account reached via nav state
                  // (account.orgId is the real parent customer id from
                  // mapAccountToAccountRow) — undefined for the mock
                  // fallback below, since there's no real customer id to
                  // fetch real Activities against then.
                  customerId={accountNavState?.account ? account.orgId : undefined}
                  healthColor="bg-success"
                  overviewInfo={{
                    domain: account.domain,
                    location: account.location,
                    email: account.email,
                    phone: account.phone,
                  }}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'Organizations' ? (
          <OrganizationTab
            account={account}
            isRealAccount={!!accountNavState?.account}
            customer={selectedCustomer}
            isLoading={selectedCustomerLoading}
            error={selectedCustomerError}
          />
        ) : activeTab === 'Contacts' ? (
          <ContactsTab
            contacts={contacts}
            isLoading={contactsLoading}
            error={contactsError}
            customerId={accountNavState?.account ? account.orgId : undefined}
            accountId={accountNavState?.account ? account.revenactId : undefined}
          />
        ) : activeTab === 'Pipelines' ? (
          <PipelinesTab
            opportunities={pipelineOpportunities}
            opportunitiesLoading={pipelineOpportunitiesLoading}
            opportunitiesError={pipelineOpportunitiesError}
            risks={pipelineRisks}
            risksLoading={pipelineRisksLoading}
            risksError={pipelineRisksError}
            customerId={accountNavState?.account ? account.orgId : undefined}
            accountId={accountNavState?.account ? account.revenactId : undefined}
          />
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

// Same tiering as AccountsMetricsBanner's fmtCur (organizations/Details.tsx)
// and MetricsPanel's formatCurrency. Always computed, no "missing" fallback
// placeholder — `arr` a real, always-present number (0 for a freshly-added
// account is a legitimate value, not a signal to show a made-up "$1.2M").
function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

// Same unified glass-strip pattern as the organizations list's own
// MetricsPanel and the parent Organization Details page's own
// MetricsBanner (react-ts-app/src/pages/organizations/Details.tsx) — one
// cohesive card with divided sections, rather than this page's previous
// standalone card with its own smaller dots/typography scale.
//
// Every value here is derived from the `account` prop — previously
// healthScore/npsScore/csatPct were hardcoded regardless of which
// account was passed in (a real bug: they didn't even match
// ACCOUNTS_DATA[0]'s own mock health of 9.5). CSM Pulse text and the
// Promoters/Passives/Detractors breakdown are derived from health/NPS
// the same simplified way the Organization Details page's own
// single-entity MetricsBanner already does (a single account has one
// NPS score, not a real distribution across many respondents).
function AccountMetricsBanner({ account }: { account: AccountRow }) {
  const healthScore = account.health.val;
  const healthPct = (healthScore / 10) * 100;
  const npsScore = account.npsValue;
  const csatPct = account.csatValue;

  const csmPulseText = healthScore >= 7 ? 'Very Satisfied' : healthScore >= 4 ? 'Neutral' : 'High Risk';
  const csmPulseColor = healthScore >= 7 ? 'text-success' : healthScore >= 4 ? 'text-warning' : 'text-danger';
  const healthColor = healthScore >= 7 ? 'var(--success)' : healthScore >= 4 ? 'var(--warning)' : 'var(--danger)';
  const csatColor = csatPct >= 70 ? 'var(--success)' : csatPct >= 40 ? 'var(--warning)' : 'var(--danger)';
  const promoters = npsScore > 0 ? 1 : 0;
  const passives = npsScore === 0 ? 1 : 0;
  const detractors = npsScore < 0 ? 1 : 0;

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
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke={healthColor} strokeWidth="3.5"
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
        <span className={`text-xl font-bold leading-none truncate ${csmPulseColor}`}>{csmPulseText}</span>
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
              <span className="font-semibold text-ink ml-4">{promoters}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-warning" /> Passives</div>
              <span className="font-semibold text-ink ml-4">{passives}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-danger" /> Detractors</div>
              <span className="font-semibold text-ink ml-4">{detractors}</span>
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
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke={csatColor} strokeWidth="3.5"
                strokeDasharray={`${csatPct} ${100 - csatPct}`} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Total ARR */}
      <div className="flex flex-col px-5 py-4 min-w-[130px] justify-center">
        <span className="text-[13px] font-semibold text-ink tracking-wide mb-2">Total ARR</span>
        <span className="text-xl font-bold text-ink leading-tight">{formatArr(account.arr)}</span>
      </div>
    </div>
  );
}

// ── Organizations tab ──────────────────────────────────────────────────────────

// An Account belongs to exactly one Customer (see the backend Account
// model's docstring) — so unlike every other tab on this page (Contacts/
// Pipelines, both real lists), this is always a single-record "profile
// card", not a table. Real data via fetchCustomerById(account.orgId),
// same thunk/mapper (mapCustomerToOrgRow) the Organization Details page
// itself already uses — reusing rather than re-deriving the health/NPS/
// CSAT color and ARR-tiering logic a second time here.
function OrganizationTab({
  account,
  isRealAccount,
  customer,
  isLoading,
  error,
}: {
  account: AccountRow;
  /** Whether `account` is real (reached via a real Accounts tab click-
   * through) rather than the ACCOUNTS_DATA mock fallback — mirrors the
   * same convention every other tab on this page already follows: no
   * real parent id, no real fetch, no click-through. */
  isRealAccount: boolean;
  customer: Customer | null;
  isLoading: boolean;
  error: string | null;
}) {
  const navigate = useNavigate();

  if (!isRealAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center gap-3">
        <EntityAvatar name={account.orgName} className="w-16 h-16 rounded-2xl text-lg" />
        <span className="text-[15px] font-bold text-ink">{account.orgName}</span>
        <span className="text-[12px] text-ink-faint max-w-xs">
          Reload this page from a real Accounts tab link to see this organization's real data.
        </span>
      </div>
    );
  }

  if (isLoading && !customer) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] font-medium text-ink-faint">
        Loading organization…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-[13px] font-medium text-danger">
        {error}
      </div>
    );
  }

  if (!customer) return null;

  const org = mapCustomerToOrgRow(customer);
  const healthPct = (org.health.val / 10) * 100;

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div
        className="max-w-2xl bg-surface rounded-2xl border border-line-subtle shadow-sm p-6 cursor-pointer hover:border-accent/40 transition-all group"
        onClick={() => navigate(`/organizations/${org.id}`)}
      >
        {/* Identity */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <EntityAvatar name={org.org} logoUrl={org.logo} className="w-14 h-14 rounded-2xl border border-line-subtle shadow-xs" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-bold text-ink group-hover:text-accent transition-colors truncate">{org.org}</span>
                <ExternalLink className="w-4 h-4 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
              <span className="text-[12px] font-medium text-ink-faint">
                Revenact ID {org.id}{org.domain && org.domain !== '-' ? ` • ${org.domain}` : ''}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-md bg-subtle border border-line-subtle text-[11.5px] font-bold text-ink-muted uppercase tracking-tight shrink-0">
            {org.stage}
          </span>
        </div>

        {/* Health / NPS / CSAT / ARR */}
        <div className="grid grid-cols-4 gap-6 pt-5 border-t border-line-subtle">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg-subtle)" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none" stroke={org.health.clr} strokeWidth="3.5"
                  strokeDasharray={`${healthPct} ${100 - healthPct}`} strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest">Health</span>
              <span className="text-lg font-bold text-ink leading-tight">{org.health.val}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest">NPS</span>
            <span className={`inline-flex w-fit ${org.npsColor} text-white px-2.5 py-1 rounded text-[12px] font-bold`}>{org.nps}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest">CSAT</span>
            <span className={`inline-flex w-fit ${org.csatColor} text-white px-2.5 py-1 rounded text-[12px] font-bold`}>{org.csat}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest">ARR</span>
            <span className="text-lg font-bold text-ink leading-tight">{formatArr(org.arr)}</span>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-2 mt-5 pt-5 border-t border-line-subtle">
          {org.img ? (
            <img src={org.img} alt={org.owner} className="w-7 h-7 rounded-full object-cover border border-line" />
          ) : (
            <div className={`w-7 h-7 rounded-full ${org.bg} text-white flex items-center justify-center font-bold text-[10px] shadow-sm`}>
              {org.avatar}
            </div>
          )}
          <span className="text-[12.5px] font-semibold text-ink-muted">{org.owner}</span>
          <span className="text-[11px] text-ink-faint">Owner</span>
        </div>
      </div>
    </div>
  );
}

// Same "minimal" icon-button convention as the Organization Details
// page's own IconButton — plain hover:bg-subtle, no border/accent-tint,
// so the two pages' tab-nav rows read as the same component.
function HeaderAction({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-2 rounded-lg transition-colors text-ink-faint hover:text-ink-muted hover:bg-subtle">
      {icon}
    </button>
  );
}
