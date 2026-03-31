import { useState } from 'react';
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

// ── Data sources ─────────────────────────────────────────────────────────────
// Org data (original arrays — imported lazily to avoid mutating them)
import {
  EMAILS_DATA as ORG_EMAILS,
  TASKS_DATA as ORG_TASKS,
  NOTES_DATA as ORG_NOTES,
  TICKETS_DATA as ORG_TICKETS,
  CALENDAR_EVENTS_DATA as ORG_CALENDAR,
  ACTIVITIES_DATA as ORG_ACTIVITIES,
} from '../organizations/activityData';

// Account data
import {
  ACCOUNT_EMAILS_DATA,
  ACCOUNT_TASKS_DATA,
  ACCOUNT_NOTES_DATA,
  ACCOUNT_TICKETS_DATA,
  ACCOUNT_CALENDAR_EVENTS_DATA,
  ACCOUNT_ACTIVITIES_DATA,
  ACCOUNT_ID_MAP,
} from '../organizations/accountActivityData';

// Re-export from activityData so tabs can still import from there
import * as orgActivityData from '../organizations/activityData';
import type { EmailItem } from '../organizations/activityData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ActivityFeedProps {
  entityId: number | string;
  entityType: 'organization' | 'account';
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

function injectAccountData(accountId: string) {
  const numId = ACCOUNT_ID_MAP[accountId] ?? 101;

  // Temporarily replace every exported array with account-filtered data
  // by re-assigning length + push (in-place mutation of the array reference).
  const swap = (arr: unknown[], data: unknown[]) => {
    arr.splice(0, arr.length, ...data);
  };

  swap(orgActivityData.EMAILS_DATA, ACCOUNT_EMAILS_DATA.filter(e => e.orgId === numId));
  swap(orgActivityData.TASKS_DATA, ACCOUNT_TASKS_DATA.filter(t => t.orgId === numId));
  swap(orgActivityData.NOTES_DATA, ACCOUNT_NOTES_DATA.filter(n => n.orgId === numId));
  swap(orgActivityData.TICKETS_DATA, ACCOUNT_TICKETS_DATA.filter(t => t.orgId === numId));
  swap(orgActivityData.CALENDAR_EVENTS_DATA, ACCOUNT_CALENDAR_EVENTS_DATA.filter(e => e.orgId === numId));
  swap(orgActivityData.ACTIVITIES_DATA, ACCOUNT_ACTIVITIES_DATA.filter(a => a.orgId === numId));

  return numId;
}

function restoreOrgData() {
  const swap = (arr: unknown[], data: unknown[]) => {
    arr.splice(0, arr.length, ...data);
  };

  swap(orgActivityData.EMAILS_DATA, ORG_EMAILS);
  swap(orgActivityData.TASKS_DATA, ORG_TASKS);
  swap(orgActivityData.NOTES_DATA, ORG_NOTES);
  swap(orgActivityData.TICKETS_DATA, ORG_TICKETS);
  swap(orgActivityData.CALENDAR_EVENTS_DATA, ORG_CALENDAR);
  swap(orgActivityData.ACTIVITIES_DATA, ORG_ACTIVITIES);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActivityFeed({ entityId, entityType, overviewInfo, healthColor = 'bg-teal-400' }: ActivityFeedProps) {
  const [activeSubTab, setActiveSubTab] = useState('Activity Feed');
  const [filter, setFilter] = useState('All');
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);

  // Resolve numeric ID for tab components.
  // For accounts, inject mock data and use the numeric stub.
  let resolvedId: number;
  if (entityType === 'account') {
    resolvedId = injectAccountData(String(entityId));
  } else {
    restoreOrgData();
    resolvedId = Number(entityId);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs: Activity Feed | Headlines | Overview | Files | CallSense */}
      <div className="px-4 pt-3 flex items-center justify-between border-b border-gray-100 flex-wrap shrink-0">
        <div className="flex gap-5">
          {FEED_TABS.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveSubTab(tab.name)}
              className={`flex items-center gap-1.5 pb-2.5 text-[13px] font-semibold transition-all relative ${activeSubTab === tab.name ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab.icon && tab.icon}
              {tab.name}
              {activeSubTab === tab.name && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeSubTab === 'Activity Feed' ? (
          <>
            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 relative bg-white z-0">
              {/* Filter Toolbar */}
            <div className="p-4 flex flex-col gap-4 border-b border-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${filter.toLowerCase()}...`}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-indigo-500/20 placeholder:text-gray-400"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-bold transition-all shadow-sm">
                  <Plus className="w-4 h-4" />
                  Add Action
                </button>
                <button className="p-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
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
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
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
                <ActivitiesTab entityId={resolvedId} healthColor={healthColor} />
              )}
              {filter === 'Emails' && <EmailsTab entityId={resolvedId} selectedEmail={selectedEmail} onSelectEmail={setSelectedEmail} />}
              {filter === 'Tasks' && <TasksTab entityId={resolvedId} />}
              {filter === 'Notes' && <NotesTab entityId={resolvedId} />}
              {filter === 'Tickets' && <TicketsTab entityId={resolvedId} />}
              {filter === 'Calendar Events' && <CalendarEventsTab entityId={resolvedId} />}
              {filter === 'Slack' && <SlackTab entityId={resolvedId} />}

              {!IMPLEMENTED_FILTERS.includes(filter) && (
                <div className="flex flex-col items-center justify-center flex-1 py-16 opacity-30">
                  <Layout className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                    {filter} coming soon
                  </span>
                </div>
              )}
            </div>
            </div>
            
            {/* Slide-in panel area */}
            {selectedEmail && (
              <div 
                className="w-[420px] shrink-0 bg-white h-full shadow-[0_0_20px_rgba(0,0,0,0.05)] z-10 border-l border-gray-100 relative"
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
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gray-50/20">
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
            <Layout className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
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
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-start gap-3 hover:shadow-md transition-shadow">
      <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-600">{icon}</div>
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
