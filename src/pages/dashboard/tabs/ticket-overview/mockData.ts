export interface KPIData {
  label: string;
  value: string | number;
  subValue?: string;
  textColor?: 'gray' | 'green' | 'red' | 'orange';
}

export const KPI_METRICS: KPIData[] = [
  { label: 'Total Ticket Volume', subValue: 'Since June 2025', value: '735', textColor: 'gray' },
  { label: 'Tickets On Hold', value: '17', textColor: 'orange' },
  { label: 'Avg. Ticket Lifetime (Days)', value: '19.67', textColor: 'green' },
  { label: 'Ticket Resolution Rate', value: '70.61%', textColor: 'green' },
  { label: 'Positive Sentiment Tickets', value: '491', textColor: 'green' },
  { label: 'Negative Sentiment Tickets', value: '65', textColor: 'red' },
];

export const PRIORITY_DATA = [
  { name: 'Low', value: 291, fill: '#4f46e5' }, // indigo
  { name: 'Medium', value: 256, fill: '#eab308' }, // yellow
  { name: 'High', value: 155, fill: '#f97316' }, // orange
  { name: 'Urgent', value: 33, fill: '#ef4444' }, // red
];

export const STATUS_DATA = [
  { name: 'Solved', value: 456, fill: '#22c55e' }, // green
  { name: 'Open', value: 79, fill: '#1d4ed8' }, // dark blue
  { name: 'Pending', value: 76, fill: '#eab308' }, // yellow
  { name: 'Closed', value: 63, fill: '#14b8a6' }, // teal
  { name: 'New', value: 44, fill: '#60a5fa' }, // light blue
  { name: 'Hold', value: 17, fill: '#f97316' }, // orange
];

export const ORIGIN_DATA = [
  { name: 'Zendesk', value: 369 },
  { name: 'Jira', value: 366 },
];

export const ASSIGNEE_DATA = [
  { name: 'Logan Martinez', Solved: 44, Open: 3, Pending: 10, Closed: 4, New: 1, Hold: 8, total: 70 },
  { name: 'Liam Anderson', Solved: 37, Open: 5, Pending: 9, Closed: 2, New: 5, Hold: 0, total: 58 },
  { name: 'Jack Thomas', Solved: 40, Open: 7, Pending: 7, Closed: 3, New: 2, Hold: 4, total: 63 },
  { name: 'Jack Lopez', Solved: 24, Open: 5, Pending: 4, Closed: 4, New: 1, Hold: 9, total: 47 },
  { name: 'Isabella Hernandez', Solved: 34, Open: 5, Pending: 4, Closed: 6, New: 3, Hold: 6, total: 58 },
  { name: 'Henry Taylor', Solved: 45, Open: 6, Pending: 8, Closed: 3, New: 6, Hold: 4, total: 72 },
  { name: 'Elijah Johnson', Solved: 33, Open: 4, Pending: 6, Closed: 2, New: 4, Hold: 3, total: 52 },
].reverse(); // reverse to render top-down in Recharts vertical bar chart

export const SENTIMENT_TIMELINE_DATA = [
  { date: 'Jun 2025', positive: 50, negative: 10 },
  { date: 'Jul 2025', positive: 65, negative: 15 },
  { date: 'Aug 2025', positive: 58, negative: 8 },
  { date: 'Sep 2025', positive: 45, negative: 12 },
  { date: 'Oct 2025', positive: 60, negative: 10 },
  { date: 'Nov 2025', positive: 60, negative: 8 },
  { date: 'Dec 2025', positive: 25, negative: 5 },
];
