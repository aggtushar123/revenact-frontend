import type { CurrencyCode } from '../../features/auth/authSlice';

export type ColumnId =
  | 'organization' | 'revenactId' | 'owner' | 'lifecycleStage' | 'health' | 'pulse'
  | 'aiPulseScore' | 'aiPulseReason' | 'nps' | 'csatScore' | 'joinedDate' | 'renewalDate'
  | 'arrAccount' | 'arrHQ' | 'implFee' | 'tcv' | 'tcvRenewal' | 'contractStart' | 'contractEnd'
  | 'productsUtilized' | 'topSourceChannel' | 'totalContractedSeats' | 'totalActiveSeats'
  | 'totalSeatUtilization' | 'totalHires' | 'scopeWebApp' | 'cesPercentage' | 'churnDate'
  | 'churnReason' | 'churnComment' | 'domain' | 'createdBy' | 'modifiedBy' | 'nameAddress';

export interface ColumnDef {
  id: ColumnId;
  label: string;
  isCompulsory?: boolean;
  isCalc?: boolean;
}

export type HealthCategory = 'good' | 'average' | 'poor';
export type LifecycleCategory = 'onboarding' | 'kickoff' | 'adoption' | 'live' | 'renewal' | 'churn' | 'expansion' | 'other';

export interface OrgRow {
  org: string;
  logo: string;
  id: number;
  owner: string;
  avatar: string;
  bg: string;
  img?: string;
  stage: string;
  health: { val: number; clr: string };
  healthCategory: HealthCategory;
  lifecycleCategory: LifecycleCategory;
  pulse: number[];
  aiScore: string;
  reason: string;
  fullReason: string;
  nps: string;
  npsValue: number;
  npsColor: string;
  csat: string;
  csatColor: string;
  joined: string;
  renewal: string;
  arrAccount: string;
  arrHQ: string;
  implFee: string;
  tcv: string;
  tcvRenewal: string;
  contractStart: string;
  contractEnd: string;
  productsUtilized: { primary: string; additional: number | null };
  topSourceChannel: string;
  totalContractedSeats: number;
  totalActiveSeats: number;
  totalSeatUtilization: string;
  totalHires: number;
  scopeWebApp: string;
  cesPercentage: string;
  churnDate: string;
  churnReason: string;
  churnComment: string;
  domain: string;
  createdBy: string;
  modifiedBy: string;
  nameAddress: string;
  /** Shown on ActivityFeed's Overview tab — optional since the mock
   * TABLE_DATA below (unused by any real page, kept only as historical
   * fallback data) predates these fields. */
  email?: string;
  phone?: string;
  mrr: number;
  arr: number;
  /** This row's own contract currency (Customer.currency, Tier 1) — `arr`/
   * `mrr` above are raw numbers in *this* currency, not the org's
   * reporting one. Compact/card displays elsewhere (e.g. the Organizations
   * board's own Kanban cards) format `arr` with this, not useOrgCurrency().
   * Optional for the same reason `email`/`phone` above are: the mock
   * TABLE_DATA below (unused by any real page) predates this field. */
  currency?: CurrencyCode;
}

export const ALL_COLUMNS: ColumnDef[] = [
  { id: 'organization', label: 'Organization', isCompulsory: true },
  { id: 'revenactId', label: 'Revenact ID' },
  { id: 'owner', label: 'Owner' },
  { id: 'lifecycleStage', label: 'Lifecycle Stage' },
  { id: 'health', label: 'Health' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'aiPulseScore', label: 'AI Pulse Score' },
  { id: 'aiPulseReason', label: 'AI Pulse Reason' },
  { id: 'nps', label: 'NPS' },
  { id: 'csatScore', label: 'CSAT Score' },
  { id: 'joinedDate', label: 'Joined Date' },
  { id: 'renewalDate', label: 'Renewal Date' },
  { id: 'arrAccount', label: 'Total ARR Billed At Account ($)', isCalc: true },
  { id: 'arrHQ', label: 'Total ARR Billed At HQ ($)', isCalc: true },
  { id: 'implFee', label: 'Implementation Fee (One Time) ($)' },
  { id: 'tcv', label: 'Total Contract Value ($)', isCalc: true },
  { id: 'tcvRenewal', label: 'Total Forecasted Renewal Revenue ($)', isCalc: true },
  { id: 'contractStart', label: 'Contract Start Date' },
  { id: 'contractEnd', label: 'Contract End Date' },
  { id: 'productsUtilized', label: 'Products Utilized' },
  { id: 'topSourceChannel', label: 'Top Source Channel' },
  { id: 'totalContractedSeats', label: 'Total Contracted Seats', isCalc: true },
  { id: 'totalActiveSeats', label: 'Total Active Seats', isCalc: true },
  { id: 'totalSeatUtilization', label: 'Total Seat Usage Utilization %', isCalc: true },
  { id: 'totalHires', label: 'Total Hires', isCalc: true },
  { id: 'scopeWebApp', label: 'Scope WebApp' },
  { id: 'cesPercentage', label: 'CES Percentage' },
  { id: 'churnDate', label: 'Churn Date' },
  { id: 'churnReason', label: 'Churn Reason' },
  { id: 'churnComment', label: 'Churn Comment' },
  { id: 'domain', label: 'Domain' },
  { id: 'createdBy', label: 'Created By / Created Date' },
  { id: 'modifiedBy', label: 'Modified By / Modified Date' },
  { id: 'nameAddress', label: 'Name / Address' },
];

export const DEFAULT_VISIBLE_COLUMNS: ColumnId[] = [
  'organization', 'revenactId', 'owner', 'lifecycleStage', 'health', 'pulse',
  'aiPulseScore', 'aiPulseReason', 'nps', 'csatScore', 'joinedDate', 'renewalDate',
  'arrAccount', 'arrHQ', 'implFee', 'tcv', 'tcvRenewal', 'contractStart', 'contractEnd',
  'productsUtilized', 'topSourceChannel', 'totalContractedSeats', 'totalActiveSeats',
  'totalSeatUtilization', 'totalHires'
];

export const TABLE_DATA: OrgRow[] = [
  { 
    org: 'Apple Inc', logo: 'https://logo.clearbit.com/apple.com', 
    id: 1, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info', 
    stage: 'Live (Enterprise)', health: { val: 9.3, clr: 'bg-[var(--success)]' }, 
    healthCategory: 'good', lifecycleCategory: 'live',
    pulse: [1,1,1,1,1], aiScore: 'Very Satisfied',
    reason: 'Consistent high feature adoption and proactive...', fullReason: 'Consistent high feature adoption and proactive usage across all key metrics.',
    nps: '+100', npsValue: 100, npsColor: 'bg-[var(--success)]', csat: '100%', csatColor: 'bg-[var(--success)]',
    joined: '19 Oct 2024', renewal: '2 Mar 2026', arrAccount: '51,200.00', arrHQ: '128,300.00',
    implFee: '70,000.00', tcv: '179,500.00', tcvRenewal: '188,475.00',
    contractStart: '26 Oct 2024', contractEnd: '12 Aug 2025',
    productsUtilized: { primary: 'Product A', additional: 3 }, topSourceChannel: 'Talent Pool Re-engage',
    totalContractedSeats: 560, totalActiveSeats: 471, totalSeatUtilization: '84.11%', totalHires: 124,
    scopeWebApp: 'N/A', cesPercentage: '98%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'apple.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Cupertino, CA',
    mrr: 4267, arr: 51200,
  },
  { 
    org: 'Pizza Hut', logo: 'https://logo.clearbit.com/pizzahut.com', 
    id: 2, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info', 
    stage: 'Live (Enterprise)', health: { val: 1.8, clr: 'bg-[var(--danger)]' }, 
    healthCategory: 'poor', lifecycleCategory: 'live',
    pulse: [2,0,0,0,0], aiScore: 'High Risk',
    reason: 'Significant drop in active users and multiple unresolved high-...', fullReason: 'Significant drop in active users and multiple unresolved high-severity support tickets.',
    nps: '-80', npsValue: -80, npsColor: 'bg-[var(--danger)]', csat: '20%', csatColor: 'bg-[var(--danger)]',
    joined: '25 Sep 2024', renewal: '15 Jun 2026', arrAccount: '69,600.00', arrHQ: '0.00',
    implFee: '60,000.00', tcv: '69,600.00', tcvRenewal: '73,080.00',
    contractStart: '1 Sep 2025', contractEnd: '22 Jun 2026',
    productsUtilized: { primary: 'Product B', additional: 2 }, topSourceChannel: 'University Portal',
    totalContractedSeats: 543, totalActiveSeats: 88, totalSeatUtilization: '16.21%', totalHires: 42,
    scopeWebApp: 'N/A', cesPercentage: '45%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'pizzahut.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Plano, TX',
    mrr: 5800, arr: 69600,
  },
  { 
    org: 'Kraft Heinz', logo: 'https://logo.clearbit.com/kraftheinz.com', 
    id: 3, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info', 
    stage: 'Onboarding (Enterprise)', health: { val: 8.6, clr: 'bg-[var(--success)]' }, 
    healthCategory: 'good', lifecycleCategory: 'onboarding',
    pulse: [1,1,1,1,1], aiScore: 'Moderate',
    reason: 'Successful milestone completion but technical...', fullReason: 'Successful milestone completion but technical integration delays causing moderate friction.',
    nps: '-17', npsValue: -17, npsColor: 'bg-[var(--danger)]', csat: '47.8%', csatColor: 'bg-[var(--danger)]',
    joined: '24 Apr 2024', renewal: '15 Nov 2027', arrAccount: '152,600.00', arrHQ: '167,800.00',
    implFee: '85,000.00', tcv: '320,400.00', tcvRenewal: '336,420.00',
    contractStart: '31 Oct 2024', contractEnd: '22 Nov 2027',
    productsUtilized: { primary: 'Integrations Module', additional: null }, topSourceChannel: 'Google Search',
    totalContractedSeats: 1071, totalActiveSeats: 940, totalSeatUtilization: '87.77%', totalHires: 56,
    scopeWebApp: 'N/A', cesPercentage: '75%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'kraftheinz.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Chicago, IL',
    mrr: 12717, arr: 152600,
  },
  { 
    org: 'Hyatt Hotels Corporation - Glob...', logo: 'https://logo.clearbit.com/hyatt.com', 
    id: 4, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info', 
    stage: 'Live (Enterprise)', health: { val: 8.8, clr: 'bg-[var(--success)]' }, 
    healthCategory: 'good', lifecycleCategory: 'live',
    pulse: [3,3,3,0,0], aiScore: 'Satisfied',
    reason: 'High renewal probability back by strong expansion into...', fullReason: 'High renewal probability back by strong expansion into the LATAM region.',
    nps: '+40', npsValue: 40, npsColor: 'bg-[var(--success)]', csat: '73.3%', csatColor: 'bg-[var(--success)]',
    joined: '26 Mar 2023', renewal: '2 Feb 2026', arrAccount: '59,500.00', arrHQ: '101,900.00',
    implFee: '40,000.00', tcv: '161,400.00', tcvRenewal: '169,470.00',
    contractStart: '24 Feb 2024', contractEnd: '2 Sep 2026',
    productsUtilized: { primary: 'Product C', additional: null }, topSourceChannel: 'Talent Pool Re-engage',
    totalContractedSeats: 1041, totalActiveSeats: 822, totalSeatUtilization: '78.96%', totalHires: 19,
    scopeWebApp: 'N/A', cesPercentage: '88%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'hyatt.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Chicago, IL',
    mrr: 4958, arr: 59500,
  },
  { 
    org: 'Arista Networks - Corporate HQ ...', logo: 'https://logo.clearbit.com/arista.com', 
    id: 5, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info', 
    stage: 'Onboarding (Enterprise)', health: { val: 10, clr: 'bg-[var(--success)]' }, 
    healthCategory: 'good', lifecycleCategory: 'onboarding',
    pulse: [1,1,1,1,1], aiScore: 'Satisfied',
    reason: 'Steady onboarding progress with high sentiment scores fro...', fullReason: 'Steady onboarding progress with high sentiment scores from the execution team.',
    nps: '+47', npsValue: 47, npsColor: 'bg-[var(--success)]', csat: '80%', csatColor: 'bg-[var(--success)]',
    joined: '1 Jan 2023', renewal: '28 Sep 2026', arrAccount: '101,700.00', arrHQ: '131,100.00',
    implFee: '65,000.00', tcv: '232,800.00', tcvRenewal: '244,440.00',
    contractStart: '16 Dec 2023', contractEnd: '5 Oct 2026',
    productsUtilized: { primary: 'Product C', additional: 1 }, topSourceChannel: 'University Portal',
    totalContractedSeats: 607, totalActiveSeats: 412, totalSeatUtilization: '67.87%', totalHires: 30,
    scopeWebApp: 'N/A', cesPercentage: '91%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'arista.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Santa Clara, CA',
    mrr: 8475, arr: 101700,
  },
  { 
    org: 'Oracle', logo: 'https://logo.clearbit.com/oracle.com', 
    id: 6, owner: 'Daniel Trial Test', avatar: 'DT', bg: 'bg-elevated', img: 'https://i.pravatar.cc/150?u=daniel',
    stage: 'Onboarding (Enterprise)', health: { val: 10, clr: 'bg-[var(--success)]' }, 
    healthCategory: 'good', lifecycleCategory: 'onboarding',
    pulse: [1,1,1,1,0], aiScore: 'Very Satisfied',
    reason: 'Peak platform utilization and frequent participation in...', fullReason: 'Peak platform utilization and frequent participation in our beta features program.',
    nps: '+100', npsValue: 100, npsColor: 'bg-[var(--success)]', csat: '100%', csatColor: 'bg-[var(--success)]',
    joined: '1 Jun 2025', renewal: '15 May 2026', arrAccount: '0.00', arrHQ: '0.00',
    implFee: '20,000.00', tcv: '0.00', tcvRenewal: '0.00',
    contractStart: '10 Jun 2025', contractEnd: '10 Jun 2026',
    productsUtilized: { primary: 'Integrations Module', additional: 2 }, topSourceChannel: 'Indeed',
    totalContractedSeats: 0, totalActiveSeats: 0, totalSeatUtilization: 'N/A', totalHires: 0,
    scopeWebApp: 'N/A', cesPercentage: '96%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'oracle.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Austin, TX',
    mrr: 0, arr: 0,
  },
  // --- Additional orgs for lifecycle coverage ---
  {
    org: 'Salesforce', logo: 'https://logo.clearbit.com/salesforce.com',
    id: 7, owner: 'Sarah Chen', avatar: 'SC', bg: 'bg-accent-hover',
    stage: 'Kickoff (Enterprise)', health: { val: 7.2, clr: 'bg-[var(--success)]' },
    healthCategory: 'good', lifecycleCategory: 'kickoff',
    pulse: [1,1,1,0,0], aiScore: 'Satisfied',
    reason: 'Strong executive sponsorship with clear success criteria...', fullReason: 'Strong executive sponsorship with clear success criteria defined during kickoff phase.',
    nps: '+60', npsValue: 60, npsColor: 'bg-[var(--success)]', csat: '82%', csatColor: 'bg-[var(--success)]',
    joined: '15 Feb 2025', renewal: '15 Feb 2027', arrAccount: '89,400.00', arrHQ: '89,400.00',
    implFee: '55,000.00', tcv: '233,800.00', tcvRenewal: '245,490.00',
    contractStart: '1 Mar 2025', contractEnd: '28 Feb 2027',
    productsUtilized: { primary: 'Product A', additional: 2 }, topSourceChannel: 'Partner Referral',
    totalContractedSeats: 820, totalActiveSeats: 340, totalSeatUtilization: '41.46%', totalHires: 15,
    scopeWebApp: 'N/A', cesPercentage: '80%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'salesforce.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'San Francisco, CA',
    mrr: 7450, arr: 89400,
  },
  {
    org: 'Spotify', logo: 'https://logo.clearbit.com/spotify.com',
    id: 8, owner: 'Sarah Chen', avatar: 'SC', bg: 'bg-accent-hover',
    stage: 'Adoption (Mid-Market)', health: { val: 6.5, clr: 'bg-[var(--warning)]' },
    healthCategory: 'average', lifecycleCategory: 'adoption',
    pulse: [1,3,1,0,0], aiScore: 'Moderate',
    reason: 'Feature adoption is growing but user engagement remains inconsistent...', fullReason: 'Feature adoption is growing but user engagement remains inconsistent across teams.',
    nps: '+10', npsValue: 10, npsColor: 'bg-[var(--success)]', csat: '58%', csatColor: 'bg-[var(--warning)]',
    joined: '10 Aug 2024', renewal: '10 Aug 2026', arrAccount: '38,400.00', arrHQ: '38,400.00',
    implFee: '25,000.00', tcv: '101,800.00', tcvRenewal: '106,890.00',
    contractStart: '15 Aug 2024', contractEnd: '14 Aug 2026',
    productsUtilized: { primary: 'Product B', additional: 1 }, topSourceChannel: 'Google Search',
    totalContractedSeats: 380, totalActiveSeats: 195, totalSeatUtilization: '51.32%', totalHires: 28,
    scopeWebApp: 'N/A', cesPercentage: '62%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'spotify.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Stockholm, SE',
    mrr: 3200, arr: 38400,
  },
  {
    org: 'Stripe', logo: 'https://logo.clearbit.com/stripe.com',
    id: 9, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info',
    stage: 'Renewal (Enterprise)', health: { val: 8.1, clr: 'bg-[var(--success)]' },
    healthCategory: 'good', lifecycleCategory: 'renewal',
    pulse: [1,1,1,1,0], aiScore: 'Satisfied',
    reason: 'Upcoming renewal with strong ROI metrics and expanding use cases...', fullReason: 'Upcoming renewal with strong ROI metrics and expanding use cases across departments.',
    nps: '+55', npsValue: 55, npsColor: 'bg-[var(--success)]', csat: '76%', csatColor: 'bg-[var(--success)]',
    joined: '5 May 2023', renewal: '5 May 2026', arrAccount: '112,000.00', arrHQ: '112,000.00',
    implFee: '45,000.00', tcv: '269,000.00', tcvRenewal: '282,450.00',
    contractStart: '10 May 2023', contractEnd: '9 May 2026',
    productsUtilized: { primary: 'Product A', additional: 4 }, topSourceChannel: 'Direct Sales',
    totalContractedSeats: 900, totalActiveSeats: 756, totalSeatUtilization: '84.00%', totalHires: 67,
    scopeWebApp: 'N/A', cesPercentage: '89%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'stripe.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'South San Francisco, CA',
    mrr: 9333, arr: 112000,
  },
  {
    org: 'WeWork', logo: 'https://logo.clearbit.com/wework.com',
    id: 10, owner: 'Daniel Trial Test', avatar: 'DT', bg: 'bg-elevated', img: 'https://i.pravatar.cc/150?u=daniel',
    stage: 'Churn', health: { val: 1.2, clr: 'bg-[var(--danger)]' },
    healthCategory: 'poor', lifecycleCategory: 'churn',
    pulse: [2,2,0,0,0], aiScore: 'Critical',
    reason: 'Account has been marked for churn due to budget constraints...', fullReason: 'Account has been marked for churn due to budget constraints and leadership changes.',
    nps: '-100', npsValue: -100, npsColor: 'bg-[var(--danger)]', csat: '12%', csatColor: 'bg-[var(--danger)]',
    joined: '20 Jan 2024', renewal: '-', arrAccount: '24,000.00', arrHQ: '24,000.00',
    implFee: '15,000.00', tcv: '63,000.00', tcvRenewal: '0.00',
    contractStart: '1 Feb 2024', contractEnd: '31 Jan 2025',
    productsUtilized: { primary: 'Product B', additional: null }, topSourceChannel: 'Indeed',
    totalContractedSeats: 150, totalActiveSeats: 12, totalSeatUtilization: '8.00%', totalHires: 5,
    scopeWebApp: 'N/A', cesPercentage: '18%', churnDate: '31 Jan 2025', churnReason: 'Budget Cut', churnComment: 'Leadership restructuring led to budget realignment.',
    domain: 'wework.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'New York, NY',
    mrr: 2000, arr: 24000,
  },
  {
    org: 'Shopify', logo: 'https://logo.clearbit.com/shopify.com',
    id: 11, owner: 'Sarah Chen', avatar: 'SC', bg: 'bg-accent-hover',
    stage: 'Expansion (Enterprise)', health: { val: 9.5, clr: 'bg-[var(--success)]' },
    healthCategory: 'good', lifecycleCategory: 'expansion',
    pulse: [1,1,1,1,1], aiScore: 'Very Satisfied',
    reason: 'Expanding license count and requesting additional modules...', fullReason: 'Expanding license count and requesting additional modules for their APAC teams.',
    nps: '+85', npsValue: 85, npsColor: 'bg-[var(--success)]', csat: '94%', csatColor: 'bg-[var(--success)]',
    joined: '12 Jul 2023', renewal: '12 Jul 2026', arrAccount: '175,000.00', arrHQ: '175,000.00',
    implFee: '90,000.00', tcv: '440,000.00', tcvRenewal: '462,000.00',
    contractStart: '15 Jul 2023', contractEnd: '14 Jul 2026',
    productsUtilized: { primary: 'Product A', additional: 5 }, topSourceChannel: 'Partner Referral',
    totalContractedSeats: 1500, totalActiveSeats: 1380, totalSeatUtilization: '92.00%', totalHires: 95,
    scopeWebApp: 'N/A', cesPercentage: '95%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'shopify.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Ottawa, ON',
    mrr: 14583, arr: 175000,
  },
  {
    org: 'Twilio', logo: 'https://logo.clearbit.com/twilio.com',
    id: 12, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info',
    stage: 'Kickoff (Mid-Market)', health: { val: 5.5, clr: 'bg-[var(--warning)]' },
    healthCategory: 'average', lifecycleCategory: 'kickoff',
    pulse: [3,1,0,0,0], aiScore: 'Moderate',
    reason: 'Initial kickoff progressing but stakeholders alignment still pending...', fullReason: 'Initial kickoff progressing but stakeholder alignment still pending on success metrics.',
    nps: '0', npsValue: 0, npsColor: 'bg-[var(--warning)]', csat: '50%', csatColor: 'bg-[var(--warning)]',
    joined: '1 Mar 2025', renewal: '1 Mar 2027', arrAccount: '42,000.00', arrHQ: '42,000.00',
    implFee: '30,000.00', tcv: '114,000.00', tcvRenewal: '119,700.00',
    contractStart: '10 Mar 2025', contractEnd: '9 Mar 2027',
    productsUtilized: { primary: 'Product C', additional: null }, topSourceChannel: 'Google Search',
    totalContractedSeats: 300, totalActiveSeats: 45, totalSeatUtilization: '15.00%', totalHires: 8,
    scopeWebApp: 'N/A', cesPercentage: '52%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'twilio.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'San Francisco, CA',
    mrr: 3500, arr: 42000,
  },
  {
    org: 'Zoom', logo: 'https://logo.clearbit.com/zoom.us',
    id: 13, owner: 'Sarah Chen', avatar: 'SC', bg: 'bg-accent-hover',
    stage: 'Adoption (Enterprise)', health: { val: 7.8, clr: 'bg-[var(--success)]' },
    healthCategory: 'good', lifecycleCategory: 'adoption',
    pulse: [1,1,1,3,0], aiScore: 'Satisfied',
    reason: 'Adoption phase going well with increasing DAU across all modules...', fullReason: 'Adoption phase going well with increasing DAU across all modules and positive exec feedback.',
    nps: '+30', npsValue: 30, npsColor: 'bg-[var(--success)]', csat: '71%', csatColor: 'bg-[var(--success)]',
    joined: '20 Nov 2024', renewal: '20 Nov 2026', arrAccount: '67,200.00', arrHQ: '67,200.00',
    implFee: '35,000.00', tcv: '169,400.00', tcvRenewal: '177,870.00',
    contractStart: '1 Dec 2024', contractEnd: '30 Nov 2026',
    productsUtilized: { primary: 'Product A', additional: 2 }, topSourceChannel: 'Direct Sales',
    totalContractedSeats: 650, totalActiveSeats: 430, totalSeatUtilization: '66.15%', totalHires: 35,
    scopeWebApp: 'N/A', cesPercentage: '74%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'zoom.us', createdBy: 'System', modifiedBy: 'System', nameAddress: 'San Jose, CA',
    mrr: 5600, arr: 67200,
  },
  {
    org: 'Uber', logo: 'https://logo.clearbit.com/uber.com',
    id: 14, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-info',
    stage: 'Renewal (Enterprise)', health: { val: 3.5, clr: 'bg-[var(--danger)]' },
    healthCategory: 'poor', lifecycleCategory: 'renewal',
    pulse: [2,3,2,0,0], aiScore: 'At Risk',
    reason: 'Renewal at risk due to champion departure and competitive evaluation...', fullReason: 'Renewal at risk due to champion departure and active competitive evaluation with rival platform.',
    nps: '-45', npsValue: -45, npsColor: 'bg-[var(--danger)]', csat: '32%', csatColor: 'bg-[var(--danger)]',
    joined: '8 Apr 2023', renewal: '8 Apr 2026', arrAccount: '95,000.00', arrHQ: '95,000.00',
    implFee: '50,000.00', tcv: '240,000.00', tcvRenewal: '0.00',
    contractStart: '15 Apr 2023', contractEnd: '14 Apr 2026',
    productsUtilized: { primary: 'Product B', additional: 1 }, topSourceChannel: 'Talent Pool Re-engage',
    totalContractedSeats: 700, totalActiveSeats: 220, totalSeatUtilization: '31.43%', totalHires: 18,
    scopeWebApp: 'N/A', cesPercentage: '35%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'uber.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'San Francisco, CA',
    mrr: 7917, arr: 95000,
  },
];
