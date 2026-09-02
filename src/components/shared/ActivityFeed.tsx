import { useEffect, useState } from 'react';
import { Search, Plus, Filter, Sparkles, Layout, FileText, Zap, Globe, MapPin, Mail, Phone } from 'lucide-react';
import React from 'react';
import {
  EmailsTab,
  EmailThreadPanel,
  TasksTab,
  NotesTab,
  TicketsTab,
  CalendarEventsTab,
  ActivitiesTab,
  CallSenseTab,
  HeadlinesTab,
  SlackTab,
} from '../organizations/activity';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchActivitiesForCustomer,
  fetchActivitiesForAccount,
  clearActivities,
  fetchEmailsForCustomer,
  fetchEmailsForAccount,
  clearEmails,
  fetchTasksForCustomer,
  fetchTasksForAccount,
  clearTasks,
  fetchNotesForCustomer,
  fetchNotesForAccount,
  clearNotes,
  fetchTicketsForCustomer,
  fetchTicketsForAccount,
  clearTickets,
  type Email,
} from '../../features/customers/customersSlice';

// ── Data sources ─────────────────────────────────────────────────────────────
// Org data (original arrays — imported lazily to avoid mutating them).
// Activities/Emails/Tasks/Notes/Tickets aren't here — they're wired to
// real backend models below, not this mock injection scheme (see
// fetchActivitiesFor*/fetchEmailsFor*/fetchTasksFor*/fetchNotesFor*/
// fetchTicketsFor* above).
import {
  CALENDAR_EVENTS_DATA as ORG_CALENDAR,
} from '../organizations/activityData';

// Account data
import {
  ACCOUNT_CALENDAR_EVENTS_DATA,
  ACCOUNT_ID_MAP,
} from '../organizations/accountActivityData';

// Re-export from activityData so tabs can still import from there
import * as orgActivityData from '../organizations/activityData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityFeedProps {
  entityId: number | string;
  entityType: 'organization' | 'account';
  /** The parent Customer id — needed to hit the nested
   * /customers/<customerId>/accounts/<accountId>/activities/ endpoint
   * when entityType is 'account'. Ignored for entityType 'organization'
   * (entityId already IS the customer id there). Omit it for an account
   * reached with no resolvable real id (a direct URL visit/refresh with
   * no navigation state, e.g. AccountDetails' own mock fallback) —
   * without a real customerId there's no real Activity data to fetch,
   * so the Activities tab just shows its empty state. */
  customerId?: number;
  /** Shown in Overview tab */
  overviewInfo?: {
    domain?: string;
    location?: string;
    email?: string;
    phone?: string;
  };
  /** Tailwind class for the health dot in ActivitiesTab */
  healthColor?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FEED_TABS = [
  { name: 'Activity Feed', icon: null },
  { name: 'Headlines', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { name: 'Overview', icon: <Layout className="w-3.5 h-3.5" /> },
  { name: 'Files', icon: <FileText className="w-3.5 h-3.5" /> },
  { name: 'CallSense', icon: <Zap className="w-3.5 h-3.5" /> },
];

const FILTER_ITEMS = [
  'All', 'Activities', 'Emails', 'Tasks', 'Notes', 'Tickets',
  'Calendar Events', 'Pulse', 'Conversations', 'Revenact Support',
  'Surveys', 'Slack',
];

const IMPLEMENTED_FILTERS = ['All', 'Activities', 'Emails', 'Tasks', 'Notes', 'Tickets', 'Calendar Events', 'Slack'];

// ── Data injection helper ─────────────────────────────────────────────────────
// For the account entity type, we temporarily swap the data in the shared
// activityData module's exported arrays so the existing tab components
// (which reference those arrays directly) pick up account-specific data.
// We restore the original org data after rendering.
//
// Covers Calendar Events only — Activities/Emails/Tasks/Notes/Tickets
// are wired to real backend models (fetchActivitiesFor*/
// fetchEmailsFor*/fetchTasksFor*/fetchNotesFor*/fetchTicketsFor*
// above), not this mock scheme.

function injectAccountData(accountId: string) {
  const numId = ACCOUNT_ID_MAP[accountId] ?? 101;

  // Temporarily replace every exported array with account-filtered data
  // by re-assigning length + push (in-place mutation of the array reference).
  const swap = (arr: unknown[], data: unknown[]) => {
    arr.splice(0, arr.length, ...data);
  };

  swap(orgActivityData.CALENDAR_EVENTS_DATA, ACCOUNT_CALENDAR_EVENTS_DATA.filter(e => e.orgId === numId));

  return numId;
}

function restoreOrgData() {
  const swap = (arr: unknown[], data: unknown[]) => {
    arr.splice(0, arr.length, ...data);
  };

  swap(orgActivityData.CALENDAR_EVENTS_DATA, ORG_CALENDAR);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActivityFeed({
  entityId,
  entityType,
  customerId,
  overviewInfo,
  healthColor = 'bg-success',
}: ActivityFeedProps) {
  const [activeSubTab, setActiveSubTab] = useState('Activity Feed');
  const [filter, setFilter] = useState('All');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const dispatch = useAppDispatch();
  const {
    activities,
    activitiesLoading,
    activitiesError,
    emails,
    emailsLoading,
    emailsError,
    tasks,
    tasksLoading,
    tasksError,
    notes,
    notesLoading,
    notesError,
    tickets,
    ticketsLoading,
    ticketsError,
  } = useAppSelector((state) => state.customers);

  // Resolve numeric ID for tab components.
  // For accounts, inject mock data and use the numeric stub.
  let resolvedId: number;
  if (entityType === 'account') {
    resolvedId = injectAccountData(String(entityId));
  } else {
    restoreOrgData();
    resolvedId = Number(entityId);
  }

  // Activities is wired to the real backend model, not the mock
  // injection above — org case always has a resolvable customer id
  // (entityId itself); account case only does when reached with a real
  // account (customerId set — see this component's own prop doc).
  // Re-fires whenever the entity being viewed changes, same as
  // fetchAccountsForCustomer's own effect in organizations/Details.tsx.
  useEffect(() => {
    if (entityType === 'organization') {
      dispatch(fetchActivitiesForCustomer(Number(entityId)));
    } else if (customerId !== undefined) {
      dispatch(fetchActivitiesForAccount({ customerId, accountId: Number(entityId) }));
    } else {
      dispatch(clearActivities());
    }
  }, [dispatch, entityType, entityId, customerId]);

  // Emails is wired to the real backend model the same way Activities
  // is above — same resolvability rules, same clear-on-no-real-id
  // fallback.
  useEffect(() => {
    if (entityType === 'organization') {
      dispatch(fetchEmailsForCustomer(Number(entityId)));
    } else if (customerId !== undefined) {
      dispatch(fetchEmailsForAccount({ customerId, accountId: Number(entityId) }));
    } else {
      dispatch(clearEmails());
    }
  }, [dispatch, entityType, entityId, customerId]);

  // Tasks is wired to the real backend model the same way
  // Activities/Emails are above — same resolvability rules, same
  // clear-on-no-real-id fallback.
  useEffect(() => {
    if (entityType === 'organization') {
      dispatch(fetchTasksForCustomer(Number(entityId)));
    } else if (customerId !== undefined) {
      dispatch(fetchTasksForAccount({ customerId, accountId: Number(entityId) }));
    } else {
      dispatch(clearTasks());
    }
  }, [dispatch, entityType, entityId, customerId]);

  // Notes is wired to the real backend model the same way
  // Activities/Emails/Tasks are above — same resolvability rules, same
  // clear-on-no-real-id fallback.
  useEffect(() => {
    if (entityType === 'organization') {
      dispatch(fetchNotesForCustomer(Number(entityId)));
    } else if (customerId !== undefined) {
      dispatch(fetchNotesForAccount({ customerId, accountId: Number(entityId) }));
    } else {
      dispatch(clearNotes());
    }
  }, [dispatch, entityType, entityId, customerId]);

  // Tickets is wired to the real backend model the same way
  // Activities/Emails/Tasks/Notes are above — same resolvability
  // rules, same clear-on-no-real-id fallback.
  useEffect(() => {
    if (entityType === 'organization') {
      dispatch(fetchTicketsForCustomer(Number(entityId)));
    } else if (customerId !== undefined) {
      dispatch(fetchTicketsForAccount({ customerId, accountId: Number(entityId) }));
    } else {
      dispatch(clearTickets());
    }
  }, [dispatch, entityType, entityId, customerId]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs: Activity Feed | Headlines | Overview | Files | CallSense */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-line-subtle flex-wrap shrink-0">
        <div className="flex gap-5">
          {FEED_TABS.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveSubTab(tab.name)}
              className={`flex items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === tab.name ? 'text-accent' : 'text-ink-faint hover:text-ink-muted'
                }`}
            >
              {tab.icon && tab.icon}
              {tab.name}
              {activeSubTab === tab.name && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeSubTab === 'Activity Feed' ? (
          <>
            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative bg-surface z-0">
              {/* Filter Toolbar */}
            <div className="p-4 flex flex-col gap-4 border-b border-line-subtle shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input
                    type="text"
                    placeholder={`Search ${filter.toLowerCase()}...`}
                    className="w-full pl-9 pr-4 py-1.5 bg-surface border border-line rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/20 placeholder:text-ink-faint"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
                  Add Action
                </button>
                <button className="p-1.5 border border-line rounded-lg text-ink-faint hover:text-ink-muted hover:bg-subtle">
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Activity type chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap">
                {FILTER_ITEMS.map(item => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`px-3 py-1 rounded-full text-[12px] font-bold transition-all border ${filter === item
                      ? 'bg-accent-dim border-accent/30 text-accent'
                      : 'bg-surface border-transparent text-ink-muted hover:bg-subtle'
                      }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {(filter === 'All' || filter === 'Activities') && (
                <ActivitiesTab
                  activities={activities}
                  isLoading={activitiesLoading}
                  error={activitiesError}
                  healthColor={healthColor}
                />
              )}
              {filter === 'Emails' && (
                <EmailsTab
                  emails={emails}
                  isLoading={emailsLoading}
                  error={emailsError}
                  selectedEmail={selectedEmail}
                  onSelectEmail={setSelectedEmail}
                />
              )}
              {filter === 'Tasks' && (
                <TasksTab tasks={tasks} isLoading={tasksLoading} error={tasksError} />
              )}
              {filter === 'Notes' && (
                <NotesTab notes={notes} isLoading={notesLoading} error={notesError} />
              )}
              {filter === 'Tickets' && (
                <TicketsTab tickets={tickets} isLoading={ticketsLoading} error={ticketsError} />
              )}
              {filter === 'Calendar Events' && <CalendarEventsTab entityId={resolvedId} />}
              {filter === 'Slack' && <SlackTab entityId={resolvedId} />}

              {!IMPLEMENTED_FILTERS.includes(filter) && (
                <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-30">
                  <Layout className="w-12 h-12 text-ink-faint mb-2" />
                  <span className="text-sm font-bold text-ink-muted uppercase tracking-widest">
                    {filter} coming soon
                  </span>
                </div>
              )}
            </div>
            </div>
            
            {/* Slide-in panel area */}
            {selectedEmail && (
              <div 
                className="w-[420px] shrink-0 bg-surface h-full shadow-[0_0_20px_rgba(0,0,0,0.05)] z-10 border-l border-line-subtle relative"
                style={{ animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)' }}
              >
                <EmailThreadPanel email={selectedEmail} onClose={() => setSelectedEmail(null)} />
              </div>
            )}
            {/* Slide-in animation */}
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to   { transform: translateX(0);   opacity: 1; }
              }
            `}</style>
          </>
        ) : activeSubTab === 'Overview' ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-subtle/20">
            <div className="grid grid-cols-2 gap-4 max-w-4xl">
              <InfoCard icon={<Globe className="w-4 h-4" />} label="Domain" value={overviewInfo?.domain ?? '—'} />
              <InfoCard icon={<MapPin className="w-4 h-4" />} label="Location" value={overviewInfo?.location ?? '—'} />
              <InfoCard icon={<Mail className="w-4 h-4" />} label="Email" value={overviewInfo?.email ?? '—'} />
              <InfoCard icon={<Phone className="w-4 h-4" />} label="Phone" value={overviewInfo?.phone ?? '—'} />
            </div>
          </div>
        ) : activeSubTab === 'Headlines' ? (
          <HeadlinesTab entityId={resolvedId} />
        ) : activeSubTab === 'CallSense' ? (
          <CallSenseTab entityId={resolvedId} />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-10 opacity-30">
            <Layout className="w-12 h-12 text-ink-faint mb-2" />
            <span className="text-sm font-bold text-ink-muted uppercase tracking-widest">
              {activeSubTab} coming soon
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-surface rounded-xl border border-line-subtle shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
      <div className="p-2 bg-accent-dim/50 rounded-lg text-accent">{icon}</div>
      <div>
        <p className="text-[11px] font-bold text-ink-faint uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
