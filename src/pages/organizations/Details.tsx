import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, RefreshCw, MoreHorizontal, CheckCircle, Globe, Mail, Phone, ChevronUp, Search, Maximize2, ChevronRight, Plus, Filter, Layout, Sparkles, ExternalLink, Download, X } from 'lucide-react';
import type { OrgRow } from '../../components/organizations/tableData';
import type { AccountRow } from '../../components/organizations/accountsData';
import { CONTACTS_DATA } from '../../components/organizations/contactsData';
import { ActivityFeed, PinnedAttributes } from '../../components/shared';
import type { AttributeDef } from '../../components/shared';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCustomerById, fetchAccountsForCustomer } from '../../features/customers/customersSlice';
import type { Account } from '../../features/customers/customersSlice';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import { mapAccountToAccountRow } from '../../features/customers/mapToAccountRow';
import { AccountFormModal } from './AccountFormModal';



// --- Main Component ---
export function Details() {
  const { id } = useParams<{ id: string }>();
  const orgId = parseInt(id || '0', 10);
  const dispatch = useAppDispatch();
  const { selectedCustomer, selectedCustomerError, accountsForCustomer, accountsLoading, accountsError } =
    useAppSelector((state) => state.customers);

  useEffect(() => {
    dispatch(fetchCustomerById(orgId));
    dispatch(fetchAccountsForCustomer(orgId));
  }, [dispatch, orgId]);

  // The General tab, PinnedAttributes panel, and ActivityFeed all render
  // off this — Contacts/Pipelines/etc. below still use their own mock
  // data (CONTACTS_DATA), which has no backend model yet. Accounts is now
  // real too (one Customer has many Account rows — see
  // customers/models.py:Account on the backend).
  const organization = selectedCustomer ? mapCustomerToOrgRow(selectedCustomer) : null;
  const accounts = organization
    ? accountsForCustomer.map((a) => mapAccountToAccountRow(a, orgId, organization.org, organization.domain))
    : [];

  const [activeTab, setActiveTab] = useState('General');
  const [isPinnedOpen, setIsPinnedOpen] = useState(true);
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);

  const tabs = [
    { name: 'General', count: null },
    { name: 'Accounts', count: accounts.length },
    { name: 'Contacts', count: CONTACTS_DATA.filter(c => c.orgId === orgId).length },
    { name: 'Pipelines', count: 1 },
    { name: 'Custom Objects', count: 2 },
    { name: 'Success Plans', count: null },
    { name: 'Canvas List', count: null },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-surface">
      {/* Tabs Navigation */}
      <nav className="px-6 bg-surface border-b border-line-subtle flex items-center justify-between shrink-0">
        <div className="flex items-center gap-8 h-10 overflow-x-auto no-scrollbar whitespace-nowrap">
          {tabs.map(tab => (
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
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-accent rounded-t-full shadow-[0_-2px_6px_rgba(45,212,168,0.35)]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 py-2 shrink-0">
           <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-subtle/50 rounded-lg border border-line-subtle">
             <span className="text-[12px] font-medium text-ink-muted">Enable new 360 UI</span>
             <div className="w-8 h-4 bg-accent rounded-full relative cursor-pointer">
               <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-surface rounded-full shadow-sm"></div>
             </div>
           </div>
           
           <div className="flex items-center gap-1">
             <IconButton icon={<MessageSquare className="w-4 h-4" />} minimal />
             <IconButton icon={<RefreshCw className="w-4 h-4" />} minimal />
             <IconButton icon={<MoreHorizontal className="w-4 h-4" />} minimal />
           </div>
        </div>
      </nav>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-subtle/50 px-6 pt-5 pb-4">
        {activeTab === 'General' && !organization && (
          <div className="flex items-center justify-center h-full">
            <span className={`text-[13px] font-medium ${selectedCustomerError ? 'text-danger' : 'text-ink-faint'}`}>
              {selectedCustomerError ?? 'Loading organization…'}
            </span>
          </div>
        )}
        {activeTab === 'General' && organization && (
          <div className="flex flex-col w-full h-full gap-4 max-w-7xl mx-auto">
            <MetricsBanner organization={organization} />
            <div className="flex gap-4 w-full h-[calc(100vh-260px)] overflow-hidden">
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
                 <div className="w-[320px] flex flex-col h-full bg-surface rounded-xl border border-line-subtle shadow-sm overflow-hidden shrink-0 transition-all">
                   <PinnedAttributes
                     entityName={organization.org}
                     attributes={buildOrgAttributes(organization)}
                     onCollapse={() => setIsPinnedOpen(false)}
                     onExpand={() => setIsAttrModalOpen(true)}
                   />
                 </div>
               )}
               <div className="flex-1 h-full overflow-hidden bg-surface rounded-xl border border-line-subtle shadow-sm flex flex-col">
                 <ActivityFeed
                   entityId={organization.id}
                   entityType="organization"
                   healthColor={organization.health.clr}
                   overviewInfo={{
                     domain: organization.domain,
                     location: organization.nameAddress,
                     email: `contact@${organization.domain}`,
                     phone: '+1 (555) 000-0000',
                   }}
                 />
               </div>
            </div>

            {/* Full Attributes Modal */}
            {isAttrModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setIsAttrModalOpen(false)}>
                <div className="absolute inset-0 bg-black/30" style={{ backdropFilter: 'blur(4px)' }} />
                <div
                  className="relative w-full max-w-2xl max-h-[80vh] bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal header */}
                  <div className="px-6 py-4 border-b border-line-subtle flex items-center justify-between shrink-0">
                    <h2 className="text-[16px] font-bold text-ink">All Attributes — {organization.org}</h2>
                    <button onClick={() => setIsAttrModalOpen(false)} className="p-1.5 rounded-lg hover:bg-subtle text-ink-faint hover:text-ink-muted transition-all">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Modal content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                      <AttrModalItem label="Revenact ID" value={organization.id.toString()} />
                      <AttrModalItem label="Organization Name" value={organization.org} />
                      <AttrModalItem label="Health Score" value={organization.health.val.toString()} dotColor={organization.health.clr} />
                      <AttrModalItem label="Lifecycle Stage" value={organization.stage} />
                      <AttrModalItem label="AI Pulse Score" value={organization.aiScore} />
                      <AttrModalItem label="AI Pulse Reason" value={organization.reason} />
                      <AttrModalItem label="NPS Value" value={organization.npsValue.toString()} />
                      <AttrModalItem label="CSAT" value={organization.csat} />
                      <AttrModalItem label="Domain" value={organization.domain} />
                      <AttrModalItem label="Location" value={organization.nameAddress} />
                      <AttrModalItem label="Owner" value={organization.owner} />
                      <AttrModalItem label="Next Renewal" value={organization.renewal} />
                      <AttrModalItem label="MRR" value={`$${organization.mrr.toLocaleString()}`} />
                      <AttrModalItem label="ARR" value={`$${organization.arr.toLocaleString()}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'Accounts' && (
          <AccountsTab
            accounts={accounts}
            rawAccounts={accountsForCustomer}
            customerId={orgId}
            isLoading={accountsLoading}
            error={accountsError}
          />
        )}
        {activeTab === 'Contacts' && <ContactsTab orgId={orgId} />}
        {activeTab !== 'General' && activeTab !== 'Accounts' && activeTab !== 'Contacts' && (
          <div className="flex flex-col items-center justify-center h-full py-10 opacity-30">
            <Layout className="w-12 h-12 text-ink-faint mb-2" />
            <span className="text-sm font-bold text-ink-muted uppercase tracking-widest">{activeTab} Coming Soon</span>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Sub-Components ---

// One cohesive glass strip with divided sections — the same structure as
// the organizations list's own MetricsPanel (and this file's own
// AccountsMetricsBanner, further down) rather than several separate
// floating cards. Kept consistent deliberately: this page used to be the
// odd one out, with 3 disconnected cards that didn't fill the row's width
// evenly, right next to an Accounts tab that already got this pattern right.
function MetricsBanner({ organization }: { organization: OrgRow }) {
  const npsSign = organization.npsValue > 0 ? '+' : '';
  const csatNum = parseFloat(organization.csat);
  const csatPct = !isNaN(csatNum) ? csatNum : 0;

  const healthVal = organization.health.val;
  const healthColor = healthVal >= 7 ? 'var(--success)' : healthVal >= 4 ? 'var(--warning)' : 'var(--danger)';
  const healthPct = (healthVal / 10) * 100;

  const csmPulseText = healthVal >= 7 ? 'Very Satisfied' : healthVal >= 4 ? 'Neutral' : 'High Risk';
  const csmPulseColor = healthVal >= 7 ? 'text-success' : healthVal >= 4 ? 'text-warning' : 'text-danger';

  const promoters = organization.npsValue > 0 ? 1 : 0;
  const passives = organization.npsValue === 0 ? 1 : 0;
  const detractors = organization.npsValue < 0 ? 1 : 0;

  const csatColor = csatPct >= 70 ? 'var(--success)' : csatPct >= 40 ? 'var(--warning)' : 'var(--danger)';

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
              strokeDasharray={`${healthPct} ${100 - healthPct}`} strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          </svg>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[13px] font-semibold text-ink tracking-wide">Health Score</span>
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-2xl font-bold text-ink leading-none">{healthVal}</span>
            <span className="text-[12px] font-medium text-ink-muted truncate">{organization.stage}</span>
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
            {npsSign}{organization.npsValue}
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
          <span className="text-xl font-bold text-ink leading-tight">{organization.csat}</span>
          <div className="shrink-0" style={{ width: 40, height: 40 }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg-subtle)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke={csatColor} strokeWidth="3.5"
                strokeDasharray={`${csatPct} ${100 - csatPct}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            </svg>
          </div>
        </div>
      </div>

      <div className="w-px bg-line my-3" />

      {/* Next Renewal Date */}
      <div className="flex flex-col px-5 py-4 min-w-[150px] justify-center">
        <span className="text-[13px] font-semibold text-ink tracking-wide mb-2">Next Renewal Date</span>
        <span className="text-xl font-bold text-ink leading-tight">{organization.renewal}</span>
      </div>
    </div>
  );
}

// ── Org attribute builder ─────────────────────────────────────────────────────
function buildOrgAttributes(organization: OrgRow): AttributeDef[] {
  return [
    { label: 'Revenact ID', value: organization.id.toString() },
    { label: 'AI Pulse-Reason', value: organization.reason, type: 'truncated' },
    { label: 'Lifecycle Stage *', value: organization.stage },
    { label: 'Pulse', value: '', type: 'pulse' },
    { label: 'Owners', value: organization.owner, type: 'owner', ownerAvatar: organization.avatar },
    { label: 'Health', value: organization.health.val.toString(), type: 'dot', dotColor: organization.health.clr },
  ];
}



interface AccountsTabProps {
  accounts: AccountRow[];
  /** Unmapped Account records, keyed the same way as `accounts` (same
   * order/ids) — needed to pre-fill the Edit form with raw values
   * (owner id, ISO renewal_date, ...) rather than the display-formatted
   * strings AccountRow carries. */
  rawAccounts: Account[];
  customerId: number;
  isLoading: boolean;
  error: string | null;
}

function AccountsTab({ accounts, rawAccounts, customerId, isLoading, error }: AccountsTabProps) {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const editingAccount = rawAccounts.find((a) => a.id === editingAccountId) ?? null;

  return (
    <div className="flex flex-col w-full h-full gap-4 max-w-7xl mx-auto">
      {/* Accounts Dynamic Metrics Banner */}
      <AccountsMetricsBanner accounts={accounts} />

      {/* Sub-Accounts Table Section */}
      <div className="w-full bg-surface rounded-2xl border border-line-subtle shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-subtle bg-surface flex items-center justify-between gap-4">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input type="text" placeholder="Search by name, Revenact ID or External ID" className="w-full pl-10 pr-4 py-2 bg-surface border border-line rounded-lg text-[13px] font-medium shadow-xs focus:outline-none focus:ring-2 focus:ring-accent/10 placeholder:text-ink-faint transition-all" />
           </div>

           <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition-all transform active:scale-95"
              >
                 <Plus className="w-4 h-4" />
                 Add Account
              </button>

              <div className="h-9 w-px bg-subtle mx-1" />
              
              <button className="flex items-center gap-2 px-3 py-2 bg-surface border border-line rounded-lg text-ink-muted hover:bg-subtle text-[13px] font-bold shadow-xs transition-colors relative">
                 <Filter className="w-4 h-4 text-ink-faint" />
                 Filter
                 <span className="flex items-center justify-center w-5 h-5 bg-accent-dim text-accent border border-accent/30 rounded-md text-[10px] font-bold">(2)</span>
              </button>
              
              <IconButton icon={<Download className="w-4 h-4" />} />
              <IconButton icon={<Globe className="w-4 h-4" />} />
              <IconButton icon={<RefreshCw className="w-4 h-4" />} />
              <IconButton icon={<Maximize2 className="w-4 h-4" />} />
           </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="bg-subtle/50 border-b border-line-subtle">
                    <th className="p-4 w-10"><input type="checkbox" className="rounded border-line-strong text-accent" /></th>
                    <HeaderCell label="Account" />
                    <HeaderCell label="Revenact ID" />
                    <HeaderCell label="Pulse" />
                    <HeaderCell label="AI Pulse-Reason" />
                    <HeaderCell label="AI Pulse-Score" />
                    <HeaderCell label="Owner" />
                    <th className="p-4 text-center w-12">
                       <Plus className="w-4 h-4 text-ink-faint cursor-pointer hover:text-ink-muted" />
                    </th>
                 </tr>
              </thead>
              <tbody>
                 {error ? (
                   <tr>
                     <td colSpan={8} className="p-20 text-center text-[13px] font-medium text-danger">{error}</td>
                   </tr>
                 ) : isLoading && accounts.length === 0 ? (
                   <tr>
                     <td colSpan={8} className="p-20 text-center text-[13px] font-medium text-ink-faint">Loading accounts…</td>
                   </tr>
                 ) : accounts.length === 0 ? (
                   <tr>
                     <td colSpan={8} className="p-20 text-center text-[13px] font-medium text-ink-faint">No accounts for this organization yet.</td>
                   </tr>
                 ) : accounts.map((acc) => (
                   <tr
                     key={acc.id}
                     className="hover:bg-accent-dim/20 border-b border-line-subtle transition-all cursor-pointer group"
                     onClick={() =>
                       // The standalone /accounts/:id page still runs on
                       // ACCOUNTS_DATA mock lookups keyed by the mock's own
                       // string ids, so a real backend id never matches
                       // there. Passing the already-known real AccountRow
                       // through navigation state gets that page (header,
                       // metrics banner, pinned attributes — all of it,
                       // since they already just render whatever AccountRow
                       // they're given) showing this exact account when
                       // reached this way — a direct URL visit or refresh
                       // still falls back to the mock, since there's
                       // nothing to read state from then.
                       navigate(`/accounts/${acc.id}`, { state: { account: acc } })
                     }
                   >
                     <td className="p-4"><input type="checkbox" className="rounded border-line" onClick={(e) => e.stopPropagation()} /></td>
                     <td className="p-4">
                        <div className="flex items-center gap-4">
                           <div className="w-9 h-9 flex items-center justify-center bg-surface border border-line-subtle rounded-xl shadow-xs p-1.5 shrink-0">
                              <img src={acc.logo} alt={acc.name} className="w-7 h-7 object-contain" />
                           </div>
                           <div className="flex flex-col overflow-hidden pt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[13.5px] font-bold text-ink group-hover:text-accent transition-colors uppercase tracking-tight truncate">{acc.name}</span>
                                <ExternalLink className="w-3 h-3 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest truncate">{acc.orgName}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-4 text-[13px] font-bold text-ink-muted">{acc.revenactId}</td>
                     <td className="p-4">
                        <div className="flex items-center gap-1">
                           {acc.pulse.map((val: number, i: number) => (
                             <div key={i} className={`w-2 h-2 rounded-full border border-white shadow-sm ${val === 1 ? 'bg-success' : 'bg-line'}`} />
                           ))}
                        </div>
                     </td>
                     <td className="p-4 max-w-[280px]">
                        <span className="text-[12px] font-medium text-ink-muted leading-relaxed line-clamp-2">
                           {acc.aiPulseReason}
                        </span>
                     </td>
                     <td className="p-4">
                        <span className="text-[12px] font-bold text-success bg-success-dim px-2 py-0.5 rounded-md border border-success/30 uppercase tracking-tight">
                           {acc.aiPulseScore}
                        </span>
                     </td>
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-subtle border-2 border-white flex items-center justify-center text-[10px] font-bold text-ink-muted overflow-hidden shadow-sm">
                              {acc.avatar ? acc.avatar : <img src={`https://i.pravatar.cc/150?u=${acc.owner}`} alt={acc.owner} className="w-full h-full object-cover" />}
                           </div>
                           <span className="text-[13px] font-bold text-ink-muted whitespace-nowrap">{acc.owner}</span>
                        </div>
                     </td>
                     <td className="p-4">
                        <button
                          type="button"
                          aria-label={`Edit ${acc.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccountId(acc.revenactId);
                          }}
                          className="p-1 rounded-md text-ink-faint opacity-0 group-hover:opacity-100 hover:text-accent hover:bg-subtle transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-surface border-t border-line-subtle flex items-center justify-end gap-6 shrink-0">
           <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent text-white text-[12px] font-bold shadow-sm">1</button>
           </div>
           
           <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-ink-faint uppercase">100 / page</span>
              <ChevronUp className="w-4 h-4 text-ink-faint rotate-180 cursor-pointer" />
           </div>
        </div>

      </div>

      {showAddModal && (
        <AccountFormModal customerId={customerId} onClose={() => setShowAddModal(false)} />
      )}
      {editingAccount && (
        <AccountFormModal
          customerId={customerId}
          account={editingAccount}
          onClose={() => setEditingAccountId(null)}
        />
      )}
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
    <th className="p-4 text-left group/header cursor-pointer">
       <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">{label}</span>
          <div className="flex flex-col -gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
             <ChevronUp className="w-2.5 h-2.5 text-ink-faint" />
             <ChevronUp className="w-2.5 h-2.5 text-ink-faint rotate-180" />
          </div>
       </div>
    </th>
  );
}

function ContactsTab({ orgId }: { orgId: number }) {
  const contacts = CONTACTS_DATA.filter(c => c.orgId === orgId);
  
  const stats = {
    total: contacts.length,
    decisionMakers: contacts.filter(c => c.role === 'Executive Sponsor' || c.role === 'Decision Maker' || c.role === 'Economic Buyer').length,
    active: contacts.filter(c => c.status === 'Active').length,
    positiveSentiment: contacts.filter(c => c.sentiment === 'Positive').length
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-6 pt-2">
      {/* Contacts Summary Banner */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface p-4 rounded-2xl border border-line-subtle shadow-sm shrink-0">
        <ContactStatCard title="Total Contacts" value={stats.total.toString()} subtext="Across all departments" icon={<Layout className="w-4 h-4 text-accent" />} />
        <ContactStatCard title="Decision Makers" value={stats.decisionMakers.toString()} subtext="High influence" icon={<Sparkles className="w-4 h-4 text-accent" />} />
        <ContactStatCard title="Active Users" value={stats.active.toString()} subtext="Logged in last 30d" icon={<CheckCircle className="w-4 h-4 text-success" />} />
        <ContactStatCard title="Avg Sentiment" value={`${stats.total > 0 ? Math.round((stats.positiveSentiment / stats.total) * 100) : 0}%`} subtext="Positive feedback" icon={<MessageSquare className="w-4 h-4 text-info" />} />
      </div>

      {/* Action Bar & Table */}
      <div className="max-w-7xl w-full mx-auto bg-surface rounded-2xl border border-line-subtle shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-subtle bg-surface flex items-center justify-between gap-4">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input type="text" placeholder="Search contacts by name, role or email..." className="w-full pl-10 pr-4 py-2 bg-subtle/30 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/10 placeholder:text-ink-faint" />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition-all">
                 <Plus className="w-4 h-4" />
                 Add Contact
              </button>
              <button className="p-2 border border-line rounded-lg text-ink-faint hover:bg-subtle transition-colors">
                 <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 border border-line rounded-lg text-ink-faint hover:bg-subtle transition-colors">
                 <Download className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="bg-surface border-b border-line-subtle">
                    <th className="p-4 w-10"><input type="checkbox" className="rounded border-line-strong text-accent" /></th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Role</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Status</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Sentiment</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Last Contacted</th>
                    <th className="p-4 text-center w-10"></th>
                 </tr>
              </thead>
              <tbody>
                 {contacts.map((contact) => (
                   <tr key={contact.id} className="hover:bg-subtle border-b border-line-subtle transition-all cursor-pointer group">
                     <td className="p-4"><input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} /></td>
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-accent-dim border border-accent/30 flex items-center justify-center text-[12px] font-bold text-accent shadow-xs">
                              {contact.avatar}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[13.5px] font-bold text-ink group-hover:text-accent transition-colors">{contact.name}</span>
                              <span className="text-[11px] font-medium text-ink-faint lowercase">{contact.email}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-subtle border border-line-subtle text-[11.5px] font-bold text-ink-muted uppercase tracking-tight">
                           {contact.role}
                        </span>
                     </td>
                     <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${contact.status === 'Active' ? 'bg-success' : 'bg-line-strong'}`} />
                           <span className={`text-[13px] font-medium ${contact.status === 'Active' ? 'text-ink-muted' : 'text-ink-faint'}`}>{contact.status}</span>
                        </div>
                     </td>
                     <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                          contact.sentiment === 'Positive' ? 'bg-success-dim border-success/30 text-success' :
                          contact.sentiment === 'Negative' ? 'bg-danger-dim border-danger/30 text-danger' :
                          'bg-warning-dim border-warning/30 text-warning'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${
                             contact.sentiment === 'Positive' ? 'bg-success' :
                             contact.sentiment === 'Negative' ? 'bg-danger' :
                             'bg-warning'
                           }`} />
                           {contact.sentiment}
                        </div>
                     </td>
                     <td className="p-4">
                        <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-ink-muted">{contact.lastContacted}</span>
                           <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Mail className="w-3 h-3 text-accent hover:text-accent cursor-pointer" />
                              <Phone className="w-3 h-3 text-accent hover:text-accent cursor-pointer" />
                           </div>
                        </div>
                     </td>
                     <td className="p-4"><MoreHorizontal className="w-4 h-4 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                   </tr>
                 ))}
                 {contacts.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-20 text-center text-ink-faint font-medium">No contacts found for this organization.</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function ContactStatCard({ title, value, subtext, icon }: { title: string, value: string, subtext: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-subtle rounded-xl border border-line-subtle">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest leading-none mb-1">{title}</span>
        <span className="text-[20px] font-bold text-ink leading-tight">{value}</span>
        <span className="text-[11px] font-medium text-ink-faint pt-0.5">{subtext}</span>
      </div>
    </div>
  );
}

function IconButton({ icon, minimal = false }: { icon: React.ReactNode, minimal?: boolean }) {
  return (
    <button className={`p-2 rounded-lg transition-colors text-ink-faint hover:text-ink-muted ${minimal ? 'hover:bg-subtle' : 'hover:bg-subtle border border-transparent hover:border-line'}`}>
      {icon}
    </button>
  );
}


function AccountsMetricsBanner({ accounts }: { accounts: AccountRow[] }) {
  type MetricTab = 'count' | 'mrr' | 'arr';
  const [healthTab, setHealthTab] = useState<MetricTab>('count');
  const [lifecycleTab, setLifecycleTab] = useState<MetricTab>('count');

  const health = useMemo(() => {
    const buckets = {
      good: { count: 0, mrr: 0, arr: 0 },
      average: { count: 0, mrr: 0, arr: 0 },
      poor: { count: 0, mrr: 0, arr: 0 },
    };
    for (const a of accounts) {
      const cat = a.healthCategory;
      buckets[cat].count++;
      buckets[cat].mrr += a.mrr;
      buckets[cat].arr += a.arr;
    }
    return buckets;
  }, [accounts]);

  const nps = useMemo(() => {
    let promoters = 0, passives = 0, detractors = 0;
    for (const a of accounts) {
      if (a.npsValue > 0) promoters++;
      else if (a.npsValue === 0) passives++;
      else detractors++;
    }
    const total = accounts.length;
    const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
    return { promoters, passives, detractors, score };
  }, [accounts]);

  const avgCsat = useMemo(() => {
    if (accounts.length === 0) return 0;
    return Math.round(accounts.reduce((s, a) => s + a.csatValue, 0) / accounts.length);
  }, [accounts]);

  // Lifecycle stages — use proper categories matching the org list MetricsPanel
  type LifecycleKey = 'onboarding' | 'kickoff' | 'adoption' | 'live' | 'renewal' | 'expansion' | 'churn' | 'other';
  const lifecycleLabels: Record<LifecycleKey, string> = {
    onboarding: 'ON', kickoff: 'KI', adoption: 'AD', live: 'LI',
    renewal: 'RE', expansion: 'EX', churn: 'CH', other: 'OT',
  };
  const lifecycleColors: Record<LifecycleKey, string> = {
    onboarding: 'var(--accent)', kickoff: 'var(--accent)', adoption: 'var(--accent)',
    live: 'var(--success)', renewal: 'var(--warning)', expansion: 'var(--success)',
    churn: 'var(--danger)', other: 'var(--text-tertiary)',
  };
  const allStages: LifecycleKey[] = ['onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'expansion', 'churn', 'other'];

  const lifecycle = useMemo(() => {
    const buckets = Object.fromEntries(
      allStages.map(s => [s, { count: 0, mrr: 0, arr: 0 }])
    ) as Record<LifecycleKey, { count: number; mrr: number; arr: number }>;
    for (const a of accounts) {
      const stage = a.lifecycleStage?.toLowerCase() || '';
      let key: LifecycleKey = 'other';
      if (stage.startsWith('onboarding')) key = 'onboarding';
      else if (stage.startsWith('kickoff')) key = 'kickoff';
      else if (stage.startsWith('adoption')) key = 'adoption';
      else if (stage.startsWith('live')) key = 'live';
      else if (stage.startsWith('renewal')) key = 'renewal';
      else if (stage.startsWith('expansion')) key = 'expansion';
      else if (stage.startsWith('churn')) key = 'churn';
      buckets[key].count++;
      buckets[key].mrr += a.mrr;
      buckets[key].arr += a.arr;
    }
    return buckets;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  // CSM pulse aggregation
  const csmScore = useMemo(() => {
    if (accounts.length === 0) return 0;
    const totalPulse = accounts.reduce((s, a) => {
      // A freshly-added account (Add Account) starts with an empty pulse
      // history — 0/0 would be NaN, not 0, and poison the whole average.
      if (a.pulse.length === 0) return s;
      const active = a.pulse.filter(v => v === 1).length;
      return s + (active / a.pulse.length) * 100;
    }, 0);
    return Math.round(totalPulse / accounts.length);
  }, [accounts]);

  // Format currency helper — same as MetricsPanel
  const fmtCur = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val}`;
  };

  const getHealthVal = (cat: 'good' | 'average' | 'poor') => {
    const val = health[cat][healthTab];
    return healthTab === 'count' ? val.toString() : fmtCur(val);
  };

  // Health donut
  const healthDonutData = [
    { value: health.good[healthTab], color: 'var(--success)' },
    { value: health.average[healthTab], color: 'var(--warning)' },
    { value: health.poor[healthTab], color: 'var(--danger)' },
  ];

  // Lifecycle donut
  const lifecycleDonutData = allStages
    .filter(s => lifecycle[s][lifecycleTab] > 0)
    .map(s => ({ value: lifecycle[s][lifecycleTab], color: lifecycleColors[s] }));

  const csatColor = avgCsat >= 70 ? 'var(--success)' : avgCsat >= 40 ? 'var(--warning)' : 'var(--danger)';
  const csmColor = csmScore >= 70 ? 'var(--success)' : csmScore >= 40 ? 'var(--warning)' : 'var(--danger)';

  // Donut renderer — same as MetricsPanel DonutChart
  const renderDonut = (segments: { value: number; color: string }[], size: number) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) {
      return (
        <svg viewBox="0 0 36 36" style={{ width: size, height: size }}>
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--border-strong)" strokeWidth="3.5" />
        </svg>
      );
    }
    let offset = 0;
    return (
      <svg viewBox="0 0 36 36" style={{ width: size, height: size }}>
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--bg-subtle)" strokeWidth="3.5" />
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const el = (
            <circle key={i} cx="18" cy="18" r="15.9155" fill="none"
              stroke={seg.color} strokeWidth="3.5"
              strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }} />
          );
          offset += pct;
          return el;
        })}
      </svg>
    );
  };


  return (
    <div
      className="flex items-stretch w-full h-[110px] font-sans rounded-xl border border-line/80 bg-surface/70 shadow-sm"
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
            <MItem color="var(--success)" label="Good" formatted={getHealthVal('good')} />
            <MItem color="var(--warning)" label="Average" formatted={getHealthVal('average')} />
            <MItem color="var(--danger)" label="Poor" formatted={getHealthVal('poor')} />
          </div>
          <div className="ml-2">
            {renderDonut(healthDonutData, 44)}
          </div>
        </div>
      </div>

      <div className="w-px bg-line/70 my-3" />

      {/* NPS Section */}
      <div className="flex flex-col flex-1 px-5 py-4">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">NPS</div>
        <div className="flex items-center gap-5 mt-0.5">
          <span className="text-[38px] font-light text-ink leading-none tracking-tight">
            {nps.score > 0 ? '+' : ''}{nps.score}
          </span>
          <div className="flex flex-col text-[12px] text-ink-muted font-medium gap-1">
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-[var(--success)]" /> Promoters</div>
              <span className="font-semibold text-ink ml-4">{nps.promoters}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-[var(--warning)]" /> Passives</div>
              <span className="font-semibold text-ink ml-4">{nps.passives}</span>
            </div>
            <div className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-[var(--danger)]" /> Detractors</div>
              <span className="font-semibold text-ink ml-4">{nps.detractors}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-px bg-line/70 my-3" />

      {/* CSAT Score */}
      <div className="flex flex-col px-5 py-4 min-w-[120px]">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">CSAT Score</div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xl font-bold text-ink leading-tight">{avgCsat}%</span>
          {renderDonut([{ value: avgCsat, color: csatColor }, { value: 100 - avgCsat, color: 'var(--border-strong)' }], 40)}
        </div>
      </div>

      <div className="w-px bg-line/70 my-3" />

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
              {allStages.map(stage => {
                const val = lifecycle[stage][lifecycleTab];
                const maxVal = Math.max(...allStages.map(s => lifecycle[s][lifecycleTab]));
                const heightPct = maxVal > 0 ? Math.max((val / maxVal) * 100, val > 0 ? 8 : 3) : 3;
                return (
                  <div key={stage} className="flex-1 rounded-t-[2px] transition-all duration-300"
                    style={{ height: `${heightPct}%`, backgroundColor: val > 0 ? lifecycleColors[stage] : 'var(--border-strong)' }}
                    title={`${stage}: ${lifecycleTab === 'count' ? val : fmtCur(val)}`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[8px] font-bold text-ink-faint mt-1 uppercase w-full">
              {allStages.map(s => (
                <span key={s} className="flex-1 text-center">{lifecycleLabels[s]}</span>
              ))}
            </div>
          </div>
          {/* Donut */}
          {renderDonut(lifecycleDonutData, 40)}
        </div>
      </div>

      <div className="w-px bg-line/70 my-3" />

      {/* CSM */}
      <div className="flex flex-col px-5 py-4 min-w-[80px] items-center">
        <div className="mb-2 text-[13px] font-semibold text-ink tracking-wide">CSM</div>
        <div className="mt-0.5">
          {renderDonut([{ value: csmScore, color: csmColor }, { value: 100 - csmScore, color: 'var(--border-strong)' }], 44)}
        </div>
      </div>
    </div>
  );
}

function AttrModalItem({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold text-ink-faint uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {dotColor && <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />}
        <span className="text-[14px] font-semibold text-ink">{value}</span>
      </div>
    </div>
  );
}

// ── Shared helper components (hoisted to module level) ─────────────────────────────
function TabPill({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
        isActive ? 'text-accent bg-accent-dim shadow-sm' : 'text-ink-faint hover:text-ink-muted hover:bg-subtle'
      }`}
    >
      {label}
    </button>
  );
}

function MItem({ color, label, formatted }: { color: string; label: string; formatted: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-[12px] text-ink-muted mb-0.5">
        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} /> {label}
      </div>
      <span className="text-xl font-bold text-ink leading-tight">{formatted}</span>
    </div>
  );
}
