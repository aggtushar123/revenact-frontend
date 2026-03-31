// Mock activity data for Account entities.
// Uses the same data shapes as activityData.ts but keyed with accountId stored in orgId field.
// Account IDs here match ACCOUNTS_DATA ids: 'acc-1', 'acc-2', 'acc-3'.
// We store them as numeric stubs 101, 102, 103 mapped from account id string in ActivityFeed.

import type {
  EmailItem,
  TaskItem,
  NoteItem,
  TicketItem,
  CalendarEventItem,
  ActivityItem,
} from './activityData';

// Map from account string id → numeric stub used as orgId in these records
export const ACCOUNT_ID_MAP: Record<string, number> = {
  'acc-1': 101,
  'acc-2': 102,
  'acc-3': 103,
};

export const ACCOUNT_EMAILS_DATA: EmailItem[] = [
  {
    id: 101, orgId: 101,
    subject: 'Apr 2026 Success Plan Update — Account Review',
    senderName: 'Edgar Holmes',
    senderAvatar: 'https://i.pravatar.cc/150?u=edgar',
    recipientName: 'Tim Cook',
    body: 'Hi Tim, please find the updated success plan for Q2 attached. Key milestones highlighted in yellow.',
    date: 'Mar 28th 10:15 AM',
    time: '10:15 AM',
    group: '28 Mar 2026',
    links: 2, watchers: 3,
    isStarred: true,
  },
  {
    id: 102, orgId: 101,
    subject: 'Integration Sync Issue — Action Required',
    senderName: 'Natalie Reyes',
    senderAvatar: 'https://i.pravatar.cc/150?u=natalie',
    recipientName: 'Edgar Holmes',
    body: 'The nightly Salesforce sync failed last night — engineering is investigating. ETA for fix is 4 hours.',
    date: 'Mar 20th 8:30 AM',
    time: '8:30 AM',
    group: '20 Mar 2026',
    links: 0, watchers: 5,
    isStarred: true,
  },
  {
    id: 103, orgId: 102,
    subject: 'Renewal Prep: Expansion Proposal Draft',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://i.pravatar.cc/150?u=sarah',
    recipientName: 'Edgar Holmes',
    body: 'Draft expansion proposal attached. Looking to grow from 200 to 500 seats ahead of renewal.',
    date: 'Mar 15th 2:00 PM',
    time: '2:00 PM',
    group: '15 Mar 2026',
    links: 1, watchers: 2,
    isStarred: false,
  },
];

export const ACCOUNT_TASKS_DATA: TaskItem[] = [
  { id: 101, orgId: 101, title: 'Prepare account success plan for Q2', assignee: 'Edgar Holmes', assigneeAvatar: 'https://i.pravatar.cc/150?u=edgar', dueDate: 'Apr 1, 2026', priority: 'high', status: 'in-progress', group: 'This Week' },
  { id: 102, orgId: 101, title: 'Schedule executive alignment call', assignee: 'Natalie Reyes', assigneeAvatar: 'https://i.pravatar.cc/150?u=natalie', dueDate: 'Apr 5, 2026', priority: 'medium', status: 'pending', group: 'Next Week' },
  { id: 103, orgId: 102, title: 'Draft renewal commercial terms', assignee: 'Edgar Holmes', assigneeAvatar: 'https://i.pravatar.cc/150?u=edgar', dueDate: 'Mar 28, 2026', priority: 'high', status: 'in-progress', group: 'Overdue' },
];

export const ACCOUNT_NOTES_DATA: NoteItem[] = [
  { id: 101, orgId: 101, title: 'Executive Sponsor Meeting Notes', content: 'Tim expressed high satisfaction with the platform. Wants AI dashboards to be GA by end of Q2. No blockers currently.', author: 'Edgar Holmes', authorAvatar: 'https://i.pravatar.cc/150?u=edgar', date: 'Mar 20, 2026', group: '20 Mar 2026', tags: ['executive', 'feedback'] },
  { id: 102, orgId: 101, title: 'Technical Handoff Notes', content: 'SSO is fully configured. API keys rotated. Security scan passed. IT team signed off on enterprise compliance requirements.', author: 'Natalie Reyes', authorAvatar: 'https://i.pravatar.cc/150?u=natalie', date: 'Mar 10, 2026', group: '10 Mar 2026', tags: ['technical', 'compliance'] },
  { id: 103, orgId: 102, title: 'Commercial Negotiation Summary', content: 'Customer requested 15% discount for 3-year commitment. Legal reviewing terms. Decision expected by Apr 10th.', author: 'Edgar Holmes', authorAvatar: 'https://i.pravatar.cc/150?u=edgar', date: 'Mar 15, 2026', group: '15 Mar 2026', tags: ['renewal', 'commercial'] },
];

export const ACCOUNT_TICKETS_DATA: TicketItem[] = [
  { id: 101, orgId: 101, ticketId: 'TKT-2001', title: 'API rate limit exceeded during batch import', description: 'Large data import job hitting rate limits. Customer requests temporary limit increase.', status: 'in-progress', priority: 'high', assignee: 'Engineering', date: 'Mar 26, 2026', group: '26 Mar 2026' },
  { id: 102, orgId: 101, ticketId: 'TKT-2002', title: 'Custom field display bug in analytics view', description: 'Custom numeric fields showing incorrect decimal precision in reports.', status: 'resolved', priority: 'medium', assignee: 'Support Team', date: 'Mar 18, 2026', group: '18 Mar 2026' },
  { id: 103, orgId: 102, ticketId: 'TKT-2003', title: 'Mobile app login fails on iOS 18', description: 'Users on iOS 18 cannot authenticate using biometric login. Affects ~40 users.', status: 'open', priority: 'critical', assignee: 'Engineering', date: 'Mar 29, 2026', group: '29 Mar 2026' },
];

export const ACCOUNT_CALENDAR_EVENTS_DATA: CalendarEventItem[] = [
  { id: 101, orgId: 101, title: 'Q2 Business Review — Executive Session', description: 'Exec-level QBR with Tim Cook and Edgar Holmes', startTime: '10:00 AM', endTime: '11:30 AM', date: 'Apr 5, 2026', group: '05 Apr 2026', attendees: ['Edgar Holmes', 'Tim Cook', 'Natalie Reyes'], type: 'review' },
  { id: 102, orgId: 101, title: 'Platform Demo: AI Analytics Launch', description: 'Demo of new AI-powered analytics dashboard for account stakeholders', startTime: '2:00 PM', endTime: '3:00 PM', date: 'Mar 28, 2026', group: '28 Mar 2026', attendees: ['Edgar Holmes', 'Product Team'], type: 'demo' },
  { id: 103, orgId: 102, title: 'Renewal Negotiation Call', description: 'Commercial terms alignment for 3-year renewal proposal', startTime: '11:00 AM', endTime: '12:00 PM', date: 'Apr 10, 2026', group: '10 Apr 2026', attendees: ['Edgar Holmes', 'Legal Team'], type: 'call' },
];

export const ACCOUNT_ACTIVITIES_DATA: ActivityItem[] = [
  { id: 101, orgId: 101, type: 'Success Plan Updated', date: 'Mar 28th', group: '28 Mar 2026', links: 1, watchers: 2 },
  { id: 102, orgId: 101, type: 'Executive Alignment Session', date: 'Mar 20th', group: '20 Mar 2026', links: 0, watchers: 3 },
  { id: 103, orgId: 101, type: 'Health Check Review', date: 'Mar 10th', group: '10 Mar 2026', links: 2, watchers: 1 },
  { id: 104, orgId: 102, type: 'Renewal Proposal Submitted', date: 'Mar 15th', group: '15 Mar 2026', links: 1, watchers: 4 },
];
