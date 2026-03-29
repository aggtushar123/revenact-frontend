export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  lastContacted: string;
  avatar?: string;
  orgId: number;
}

export const CONTACTS_DATA: Contact[] = [
  {
    id: 'c1',
    name: 'Sarah Chen',
    role: 'Executive Sponsor',
    email: 'sarah.chen@apple.com',
    phone: '+1 (408) 555-0123',
    status: 'Active',
    sentiment: 'Positive',
    lastContacted: '2 hours ago',
    avatar: 'SC',
    orgId: 1
  },
  {
    id: 'c2',
    name: 'James Wilson',
    role: 'Champion',
    email: 'j.wilson@apple.com',
    phone: '+1 (408) 555-0456',
    status: 'Active',
    sentiment: 'Positive',
    lastContacted: '1 day ago',
    avatar: 'JW',
    orgId: 1
  },
  {
    id: 'c3',
    name: 'Elena Rodriguez',
    role: 'Economic Buyer',
    email: 'elena.r@apple.com',
    phone: '+1 (408) 555-0789',
    status: 'Active',
    sentiment: 'Neutral',
    lastContacted: '3 days ago',
    avatar: 'ER',
    orgId: 1
  },
  {
    id: 'c4',
    name: 'Marcus Thorne',
    role: 'Technical Lead',
    email: 'm.thorne@apple.com',
    phone: '+1 (408) 555-0990',
    status: 'Active',
    sentiment: 'Positive',
    lastContacted: '5 days ago',
    avatar: 'MT',
    orgId: 1
  },
  {
    id: 'c5',
    name: 'Olivia Park',
    role: 'Influencer',
    email: 'olivia.p@apple.com',
    phone: '+1 (408) 555-0111',
    status: 'Inactive',
    sentiment: 'Negative',
    lastContacted: '2 weeks ago',
    avatar: 'OP',
    orgId: 1
  },
  {
    id: 'c6',
    name: 'David Miller',
    role: 'Decision Maker',
    email: 'd.miller@pizzahut.com',
    phone: '+1 (972) 555-0101',
    status: 'Active',
    sentiment: 'Negative',
    lastContacted: '1 hour ago',
    avatar: 'DM',
    orgId: 2
  },
  {
    id: 'c7',
    name: 'Sophie Turner',
    role: 'Finance Manager',
    email: 's.turner@kraftheinz.com',
    phone: '+1 (312) 555-0202',
    status: 'Active',
    sentiment: 'Positive',
    lastContacted: '4 days ago',
    avatar: 'ST',
    orgId: 3
  }
];
