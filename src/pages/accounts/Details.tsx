import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  MoreHorizontal,
  Layout,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ACCOUNTS_DATA } from '../../components/organizations/accountsData';
import type { AccountRow } from '../../components/organizations/accountsData';
import { ActivityFeed, PinnedAttributes, EntityAvatar, ContactsTab, PipelinesTab, CanvasListTab, CustomObjectsTab } from '../../components/shared';
import type { AttributeDef } from '../../components/shared';
import { useAppDispatch, useAppSelector, useOrgCurrency, useCapability } from '../../hooks';
import { useMembers } from '../../features/knowledge/useMembers';
import { OwnerTile, type OwnerSummary } from '../../components/shared/OwnerTile';
import { formatCompactMoney } from '../../features/customers/formatters';
import {
  fetchContactsForAccount,
  clearContacts,
  fetchOpportunitiesForAccount,
  fetchRisksForAccount,
  clearPipelineData,
  fetchCanvasesForAccount,
  clearCanvases,
  updateAccount,
} from '../../features/customers/customersSlice';

export function AccountDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
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
    entityCanvases,
    entityCanvasesLoading,
    entityCanvasesError,
  } = useAppSelector((state) => state.customers);
  const [activeTab, setActiveTab] = useState('General');
  const [is360Enabled, setIs360Enabled] = useState(true);
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);
  // Real count, reported by CustomObjectsTab itself once it's fetched —
  // replaces the old hardcoded `0` (see this tab's own render block
  // below for why CustomObjectsTab, not this page, owns that fetch).
  const [customObjectsCount, setCustomObjectsCount] = useState(0);
  // The account's one accountable person (the same tile as an organisation's).
  const canAssign = useCapability('view_all_accounts');
  const me = useAppSelector((s) => s.auth.user);
  const members = useMembers();
  // What the row said, until a save on this page says otherwise.
  const [saved, setSaved] = useState<{ accountId: number; owner: OwnerSummary | null } | null>(null);

  // Clicking through from a real org's Accounts tab (see
  // organizations/Details.tsx) carries the real, already-fetched
  // AccountRow via navigation `state` — everything below already just
  // renders whatever AccountRow it's given, so that's the only change
  // needed to make a click-through show the real account end to end.
  // A direct URL visit or refresh has no state to read, so it still
  // falls back to the mock, same as before.
  const accountNavState = location.state as { account: AccountRow; activityFilter?: string } | null;
  const account = accountNavState?.account ?? ACCOUNTS_DATA.find((a) => a.id === id) ?? ACCOUNTS_DATA[0];
  // Set by the standalone Surveys page's own row-click navigation (see
  // SurveysPage.tsx) so landing here opens straight to the Surveys
  // filter instead of the general feed — see ActivityFeedProps' own
  // `initialFilter` docstring.
  const activityFilter = accountNavState?.activityFilter;

  // Same "only fetch real data when reached with a real, already-known
  // parent customer id" convention as ActivityFeed's own `customerId`
  // prop (see this component's JSX below) — a mock-fallback account has
  // no real customer/account id pair to fetch Contacts for.
  useEffect(() => {
    if (accountNavState?.account) {
      dispatch(fetchContactsForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      dispatch(fetchOpportunitiesForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      dispatch(fetchRisksForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      dispatch(fetchCanvasesForAccount({ customerId: account.orgId, accountId: account.revenactId }));
      // The Organizations tab below needs nothing fetched of its own —
      // `account.orgs` (every linked Customer, id+name) already rode
      // along on the same nav-state AccountRow as everything else on
      // this page (see mapAccountToAccountRow).
    } else {
      dispatch(clearContacts());
      dispatch(clearPipelineData());
      dispatch(clearCanvases());
    }
  }, [dispatch, accountNavState, account]);

  const owner: OwnerSummary | null =
    saved && saved.accountId === account.revenactId
      ? saved.owner
      : account.ownerId
        ? { id: account.ownerId, name: account.owner, function: account.ownerFunction ?? null }
        : null;
  const isRealAccount = !!accountNavState?.account;
  const mayChangeOwner = isRealAccount && (canAssign || (!!me && (!owner || owner.id === me.id)));
  async function saveOwner(userId: number | null, note: string) {
    const result = await dispatch(
      updateAccount({ customerId: account.orgId, id: account.revenactId, owner_id: userId, handover_note: note }),
    );
    if (!updateAccount.fulfilled.match(result)) return false;
    const next = result.payload.owner;
    setSaved({ accountId: account.revenactId, owner: next ? { id: next.id, name: next.name, function: next.function ?? null } : null });
    return true;
  }

  const tabs = [
    { name: 'General', count: null },
    { name: 'Organizations', count: account.orgs?.length ?? 1 },
    { name: 'Contacts', count: contacts.length },
    { name: 'Pipelines', count: pipelineOpportunities.length + pipelineRisks.length },
    { name: 'Custom Objects', count: customObjectsCount },
    { name: 'Success Plans', count: null },
    { name: 'Canvas List', count: entityCanvases.length },
  ];

  // Build the pinned attributes for this account
  const accountAttributes: AttributeDef[] = [
    { label: 'Revenact ID', value: account.revenactId.toString() },
    { label: 'Account Name', value: account.name },
    { label: 'AI Pulse-Score', value: account.aiPulseScore, type: 'truncated' },
    { label: 'AI Pulse-Reason', value: account.aiPulseReason, type: 'truncated' },
    { label: 'Pulse', value: '', type: 'pulse' },
    { label: 'Account Owner', value: owner?.name ?? 'Unassigned', type: 'owner', ownerAvatar: account.avatar },
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

          <button
            onClick={() =>
              navigate(`/copilot?forAccountId=${account.revenactId}&forCustomerName=${encodeURIComponent(account.name)}`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-[#0D0F0E] text-[12px] font-bold shadow-sm hover:scale-105 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask Copilot
          </button>

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
            <OwnerTile owner={owner} members={members} mayChange={mayChangeOwner} onSave={saveOwner} />
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
                  initialFilter={activityFilter}
                  healthColor="bg-success"
                  overviewInfo={{
                    domain: account.domain,
                    location: account.location,
                    email: account.email,
                    phone: account.phone,
                    industry: account.industry,
                  }}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'Organizations' ? (
          <OrganizationTab account={account} isRealAccount={!!accountNavState?.account} />
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
        ) : activeTab === 'Canvas List' ? (
          <CanvasListTab
            canvases={entityCanvases}
            isLoading={entityCanvasesLoading}
            error={entityCanvasesError}
            customerId={accountNavState?.account ? account.orgId : undefined}
            accountId={accountNavState?.account ? account.revenactId : undefined}
          />
        ) : activeTab === 'Custom Objects' ? (
          <CustomObjectsTab
            accountId={accountNavState?.account ? account.revenactId : undefined}
            onCountChange={setCustomObjectsCount}
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
  const currency = useOrgCurrency();
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
        <span className="text-xl font-bold text-ink leading-tight">{formatCompactMoney(account.arr, currency)}</span>
      </div>
    </div>
  );
}

// ── Organizations tab ──────────────────────────────────────────────────────────

// An Account can belong to more than one Customer at once now (a true
// many-to-many, no primary owner — see the backend Account model's own
// docstring for why: joint ventures, shared subsidiaries serviced by
// vendor and reseller, holding-company restructuring), so unlike a
// single-record "profile card" this is a list of every organization
// this Account is linked to. `account.orgs` (id+name only) already
// rode along on the same nav-state AccountRow as everything else on
// this page (see mapAccountToAccountRow) — no fetch of its own needed.
// Each row is a click-through to that organization's own full Details
// page, which already has the rich Health/NPS/CSAT/ARR profile; this
// tab doesn't re-derive a second copy of it per linked org here.
function OrganizationTab({
  account,
  isRealAccount,
}: {
  account: AccountRow;
  /** Whether `account` is real (reached via a real Accounts tab click-
   * through) rather than the ACCOUNTS_DATA mock fallback — mirrors the
   * same convention every other tab on this page already follows: no
   * real parent id, no real fetch, no click-through. */
  isRealAccount: boolean;
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

  const orgs = account.orgs ?? [];
  if (orgs.length === 0) return null;

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl flex flex-col gap-3">
        {orgs.map((org) => (
          <div
            key={org.id}
            className="bg-surface rounded-xl border border-line-subtle shadow-sm p-4 cursor-pointer hover:border-accent/40 transition-all group flex items-center justify-between"
            onClick={() => navigate(`/organizations/${org.id}`)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <EntityAvatar name={org.name} className="w-11 h-11 rounded-xl border border-line-subtle shadow-xs" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14.5px] font-bold text-ink group-hover:text-accent transition-colors truncate">{org.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <span className="text-[12px] font-medium text-ink-faint">Revenact ID {org.id}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-faint shrink-0" />
          </div>
        ))}
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
