// --- Activity Feed Data ---

export interface EmailItem {
  id: number;
  orgId: number;
  subject: string;
  senderName: string;
  senderAvatar: string;
  recipientName: string;
  body: string;
  date: string;
  time: string;
  group: string;
  links: number;
  watchers: number;
  isStarred: boolean;
}

export interface TaskItem {
  id: number;
  orgId: number;
  title: string;
  assignee: string;
  assigneeAvatar: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  group: string;
}

export interface NoteItem {
  id: number;
  orgId: number;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: string;
  group: string;
  tags: string[];
}

export interface TicketItem {
  id: number;
  orgId: number;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee: string;
  date: string;
  group: string;
  ticketId: string;
}

export interface CalendarEventItem {
  id: number;
  orgId: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  group: string;
  attendees: string[];
  type: 'meeting' | 'call' | 'review' | 'demo';
}

export interface ActivityItem {
  id: number;
  orgId: number;
  type: string;
  date: string;
  group: string;
  links: number;
  watchers: number;
}

// --- Emails Data ---
export const EMAILS_DATA: EmailItem[] = [
  {
    id: 1, orgId: 1,
    subject: "Re: Welcome — Let's Begin Your Onboarding Journey",
    senderName: 'Edgar Holmes',
    senderAvatar: 'https://i.pravatar.cc/150?u=edgar',
    recipientName: 'Natalie Reyes',
    body: 'Noted on this Natalie! Thanks. Regards, Edgar',
    date: 'Feb 26th 6:20 PM',
    time: '6:20 PM',
    group: '26 Feb 2026',
    links: 3, watchers: 2,
    isStarred: true,
  },
  {
    id: 2, orgId: 1,
    subject: 'Re: Follow-Up: Renewal Readiness & Expansion Opportunities',
    senderName: 'Natalie Reyes',
    senderAvatar: 'https://i.pravatar.cc/150?u=natalie',
    recipientName: 'Edgar Holmes',
    body: "Hi Edgar, following up on our last conversation regarding the upcoming renewal. We've prepared a summary of expansion options for your review.",
    date: 'Dec 8th 11:57 AM',
    time: '11:57 AM',
    group: '08 Dec 2025',
    links: 2, watchers: 1,
    isStarred: false,
  },
  {
    id: 3, orgId: 1,
    subject: 'Quarterly Business Review - Q4 2025 Recap',
    senderName: 'Edgar Holmes',
    senderAvatar: 'https://i.pravatar.cc/150?u=edgar',
    recipientName: 'Sarah Chen',
    body: 'Hi Sarah, please find attached the QBR deck for Q4. Happy to discuss any items that need follow-up.',
    date: 'Jan 15th 3:45 PM',
    time: '3:45 PM',
    group: '15 Jan 2026',
    links: 5, watchers: 3,
    isStarred: true,
  },
  {
    id: 4, orgId: 1,
    subject: 'Feature Request: Advanced Analytics Dashboard',
    senderName: 'Natalie Reyes',
    senderAvatar: 'https://i.pravatar.cc/150?u=natalie',
    recipientName: 'Product Team',
    body: 'The customer has requested enhancements to the analytics module — specifically drill-down capability and custom report builder.',
    date: 'Jan 10th 9:30 AM',
    time: '9:30 AM',
    group: '15 Jan 2026',
    links: 1, watchers: 4,
    isStarred: false,
  },
  {
    id: 5, orgId: 2,
    subject: 'Escalation: Critical Integration Issue',
    senderName: 'Edgar Holmes',
    senderAvatar: 'https://i.pravatar.cc/150?u=edgar',
    recipientName: 'Support Team',
    body: 'Priority escalation — the Salesforce integration has been intermittently failing since yesterday. Customer impact is significant.',
    date: 'Mar 2nd 8:15 AM',
    time: '8:15 AM',
    group: '02 Mar 2026',
    links: 0, watchers: 5,
    isStarred: true,
  },
  {
    id: 6, orgId: 2,
    subject: 'Onboarding Check-In: Week 3 Status',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://i.pravatar.cc/150?u=sarah',
    recipientName: 'Edgar Holmes',
    body: 'Quick check-in on the onboarding progress. All milestones are on track and the team is ramping up well.',
    date: 'Feb 20th 2:00 PM',
    time: '2:00 PM',
    group: '20 Feb 2026',
    links: 1, watchers: 2,
    isStarred: false,
  },
  {
    id: 7, orgId: 3,
    subject: 'Success Plan Review: H1 2026 Goals',
    senderName: 'Edgar Holmes',
    senderAvatar: 'https://i.pravatar.cc/150?u=edgar',
    recipientName: 'Natalie Reyes',
    body: 'Attached is the updated success plan with revised KPIs for H1. Let me know if we need to adjust timelines.',
    date: 'Mar 1st 10:00 AM',
    time: '10:00 AM',
    group: '01 Mar 2026',
    links: 2, watchers: 1,
    isStarred: false,
  },
];

// --- Tasks Data ---
export const TASKS_DATA: TaskItem[] = [
  { id: 1, orgId: 1, title: 'Prepare QBR deck for Q1 2026', assignee: 'Edgar Holmes', assigneeAvatar: 'https://i.pravatar.cc/150?u=edgar', dueDate: 'Mar 15, 2026', priority: 'high', status: 'in-progress', group: 'This Week' },
  { id: 2, orgId: 1, title: 'Schedule renewal discussion call', assignee: 'Natalie Reyes', assigneeAvatar: 'https://i.pravatar.cc/150?u=natalie', dueDate: 'Mar 10, 2026', priority: 'high', status: 'pending', group: 'This Week' },
  { id: 3, orgId: 1, title: 'Update customer health scorecard', assignee: 'Edgar Holmes', assigneeAvatar: 'https://i.pravatar.cc/150?u=edgar', dueDate: 'Mar 20, 2026', priority: 'medium', status: 'pending', group: 'Next Week' },
  { id: 4, orgId: 1, title: 'Send product update newsletter', assignee: 'Sarah Chen', assigneeAvatar: 'https://i.pravatar.cc/150?u=sarah', dueDate: 'Mar 25, 2026', priority: 'low', status: 'completed', group: 'Next Week' },
  { id: 5, orgId: 2, title: 'Resolve integration escalation', assignee: 'Edgar Holmes', assigneeAvatar: 'https://i.pravatar.cc/150?u=edgar', dueDate: 'Mar 5, 2026', priority: 'high', status: 'in-progress', group: 'Overdue' },
  { id: 6, orgId: 2, title: 'Create onboarding checklist', assignee: 'Sarah Chen', assigneeAvatar: 'https://i.pravatar.cc/150?u=sarah', dueDate: 'Mar 12, 2026', priority: 'medium', status: 'pending', group: 'This Week' },
  { id: 7, orgId: 3, title: 'Review success plan KPIs', assignee: 'Edgar Holmes', assigneeAvatar: 'https://i.pravatar.cc/150?u=edgar', dueDate: 'Mar 8, 2026', priority: 'medium', status: 'in-progress', group: 'This Week' },
];

// --- Notes Data ---
export const NOTES_DATA: NoteItem[] = [
  { id: 1, orgId: 1, title: 'Call Notes: Product Feedback Session', content: 'Customer expressed interest in AI-powered analytics. Wants better integration with existing BI tools. Follow up with product team on roadmap.', author: 'Edgar Holmes', authorAvatar: 'https://i.pravatar.cc/150?u=edgar', date: 'Mar 4, 2026', group: '04 Mar 2026', tags: ['feedback', 'product'] },
  { id: 2, orgId: 1, title: 'Renewal Strategy Discussion', content: 'Multi-year deal preferred. Customer open to expansion if we can deliver the analytics dashboard by Q2. CFO approval needed.', author: 'Natalie Reyes', authorAvatar: 'https://i.pravatar.cc/150?u=natalie', date: 'Feb 28, 2026', group: '28 Feb 2026', tags: ['renewal', 'strategy'] },
  { id: 3, orgId: 1, title: 'Technical Requirements Gathering', content: 'SSO integration required before go-live. API rate limits need to be discussed. Security review pending from their IT team.', author: 'Sarah Chen', authorAvatar: 'https://i.pravatar.cc/150?u=sarah', date: 'Feb 25, 2026', group: '25 Feb 2026', tags: ['technical', 'requirements'] },
  { id: 4, orgId: 2, title: 'Escalation Meeting Summary', content: 'Integration failures root cause identified — API version mismatch. Fix deployed, monitoring for 48 hours.', author: 'Edgar Holmes', authorAvatar: 'https://i.pravatar.cc/150?u=edgar', date: 'Mar 3, 2026', group: '03 Mar 2026', tags: ['escalation', 'technical'] },
  { id: 5, orgId: 3, title: 'H1 Planning Review', content: 'Agreed on 3 key metrics for H1. Customer wants monthly check-ins. Next review scheduled for April 1st.', author: 'Edgar Holmes', authorAvatar: 'https://i.pravatar.cc/150?u=edgar', date: 'Mar 1, 2026', group: '01 Mar 2026', tags: ['planning', 'review'] },
];

// --- Tickets Data ---
export const TICKETS_DATA: TicketItem[] = [
  { id: 1, orgId: 1, ticketId: 'TKT-1042', title: 'Dashboard loading slow on large datasets', description: 'Performance degradation when loading 10k+ records in the analytics view.', status: 'in-progress', priority: 'high', assignee: 'Support Team', date: 'Mar 3, 2026', group: '03 Mar 2026' },
  { id: 2, orgId: 1, ticketId: 'TKT-1038', title: 'Export to CSV not including all columns', description: 'Custom fields are missing from CSV exports. Affects reporting workflow.', status: 'resolved', priority: 'medium', assignee: 'Support Team', date: 'Feb 27, 2026', group: '27 Feb 2026' },
  { id: 3, orgId: 1, ticketId: 'TKT-1035', title: 'SSO login redirect loop', description: 'Users experience redirect loop when attempting SSO login from the mobile app.', status: 'closed', priority: 'critical', assignee: 'Engineering', date: 'Feb 20, 2026', group: '20 Feb 2026' },
  { id: 4, orgId: 2, ticketId: 'TKT-1045', title: 'Salesforce sync failure', description: 'Bi-directional sync with Salesforce failing intermittently since API update.', status: 'open', priority: 'critical', assignee: 'Engineering', date: 'Mar 2, 2026', group: '02 Mar 2026' },
  { id: 5, orgId: 3, ticketId: 'TKT-1041', title: 'Custom report template not saving', description: 'When creating a custom report template, changes are not persisted after page reload.', status: 'in-progress', priority: 'medium', assignee: 'Support Team', date: 'Mar 1, 2026', group: '01 Mar 2026' },
];

// --- Calendar Events Data ---
export const CALENDAR_EVENTS_DATA: CalendarEventItem[] = [
  { id: 1, orgId: 1, title: 'Quarterly Business Review', description: 'Q1 2026 QBR with stakeholders', startTime: '10:00 AM', endTime: '11:30 AM', date: 'Mar 15, 2026', group: '15 Mar 2026', attendees: ['Edgar Holmes', 'Natalie Reyes', 'Sarah Chen'], type: 'review' },
  { id: 2, orgId: 1, title: 'Product Demo: New Analytics Module', description: 'Showcase the new analytics capabilities', startTime: '2:00 PM', endTime: '3:00 PM', date: 'Mar 10, 2026', group: '10 Mar 2026', attendees: ['Edgar Holmes', 'Product Team'], type: 'demo' },
  { id: 3, orgId: 1, title: 'Weekly Sync — Account Health', description: 'Regular check-in on account metrics', startTime: '9:00 AM', endTime: '9:30 AM', date: 'Mar 7, 2026', group: '07 Mar 2026', attendees: ['Edgar Holmes', 'Natalie Reyes'], type: 'call' },
  { id: 4, orgId: 2, title: 'Escalation Follow-Up', description: 'Review integration fix deployment', startTime: '11:00 AM', endTime: '11:30 AM', date: 'Mar 5, 2026', group: '05 Mar 2026', attendees: ['Edgar Holmes', 'Engineering'], type: 'meeting' },
  { id: 5, orgId: 3, title: 'Success Plan Kickoff', description: 'H1 2026 goals alignment', startTime: '3:00 PM', endTime: '4:00 PM', date: 'Mar 3, 2026', group: '03 Mar 2026', attendees: ['Edgar Holmes', 'Natalie Reyes'], type: 'meeting' },
];

// --- Activities Data (general timeline entries) ---
export const ACTIVITIES_DATA: ActivityItem[] = [
  { id: 1, orgId: 1, type: 'Value Reinforcement', date: 'Mar 5th', group: '05 Mar 2026', links: 1, watchers: 1 },
  { id: 2, orgId: 1, type: 'Enablement or Re-Training', date: 'Mar 5th', group: '05 Mar 2026', links: 1, watchers: 0 },
  { id: 3, orgId: 1, type: 'Health Check Review', date: 'Feb 28th', group: '28 Feb 2026', links: 2, watchers: 3 },
  { id: 4, orgId: 1, type: 'Product Usage Analysis', date: 'Feb 20th', group: '20 Feb 2026', links: 0, watchers: 1 },
  { id: 5, orgId: 2, type: 'Escalation Triggered', date: 'Mar 2nd', group: '02 Mar 2026', links: 1, watchers: 5 },
  { id: 6, orgId: 2, type: 'Onboarding Milestone Reached', date: 'Feb 20th', group: '20 Feb 2026', links: 0, watchers: 2 },
  { id: 7, orgId: 3, type: 'Success Plan Created', date: 'Mar 1st', group: '01 Mar 2026', links: 2, watchers: 1 },
];
