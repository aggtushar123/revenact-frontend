
export type ColumnId =
  | 'organization' | 'velarisId' | 'owner' | 'lifecycleStage' | 'health' | 'pulse'
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

export const ALL_COLUMNS: ColumnDef[] = [
  { id: 'organization', label: 'Organization', isCompulsory: true },
  { id: 'velarisId', label: 'Velaris ID' },
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
  'organization', 'velarisId', 'owner', 'lifecycleStage', 'health', 'pulse',
  'aiPulseScore', 'aiPulseReason', 'nps', 'csatScore', 'joinedDate', 'renewalDate',
  'arrAccount', 'arrHQ', 'implFee', 'tcv', 'tcvRenewal', 'contractStart', 'contractEnd',
  'productsUtilized', 'topSourceChannel', 'totalContractedSeats', 'totalActiveSeats',
  'totalSeatUtilization', 'totalHires'
];

export const TABLE_DATA = [
  { 
    org: 'Apple Inc', logo: 'https://logo.clearbit.com/apple.com', 
    id: 1, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-[#409add]', 
    stage: 'Live (Enterprise)', health: { val: 9.3, clr: 'bg-[#00a699]' }, 
    pulse: [1,1,1,1,1], aiScore: 'Very Satisfied',
    reason: 'Consistent high feature adoption and proactive...', fullReason: 'Consistent high feature adoption and proactive usage across all key metrics.',
    nps: '+100', npsColor: 'bg-[#0bc2a6]', csat: '100%', csatColor: 'bg-[#087383]',
    joined: '19 Oct 2024', renewal: '2 Mar 2026', arrAccount: '51,200.00', arrHQ: '128,300.00',
    implFee: '70,000.00', tcv: '179,500.00', tcvRenewal: '188,475.00',
    contractStart: '26 Oct 2024', contractEnd: '12 Aug 2025',
    productsUtilized: { primary: 'Product A', additional: 3 }, topSourceChannel: 'Talent Pool Re-engage',
    totalContractedSeats: 560, totalActiveSeats: 471, totalSeatUtilization: '84.11%', totalHires: 124,
    scopeWebApp: 'N/A', cesPercentage: '98%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'apple.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Cupertino, CA'
  },
  { 
    org: 'Pizza Hut', logo: 'https://logo.clearbit.com/pizzahut.com', 
    id: 2, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-[#409add]', 
    stage: 'Live (Enterprise)', health: { val: 1.8, clr: 'bg-[#fa5c5c]' }, 
    pulse: [2,0,0,0,0], aiScore: 'High Risk',
    reason: 'Significant drop in active users and multiple unresolved high-...', fullReason: 'Significant drop in active users and multiple unresolved high-severity support tickets.',
    nps: '-80', npsColor: 'bg-[#fb5e5e]', csat: '20%', csatColor: 'bg-[#fb5e5e]',
    joined: '25 Sep 2024', renewal: '15 Jun 2026', arrAccount: '69,600.00', arrHQ: '0.00',
    implFee: '60,000.00', tcv: '69,600.00', tcvRenewal: '73,080.00',
    contractStart: '1 Sep 2025', contractEnd: '22 Jun 2026',
    productsUtilized: { primary: 'Product B', additional: 2 }, topSourceChannel: 'University Portal',
    totalContractedSeats: 543, totalActiveSeats: 88, totalSeatUtilization: '16.21%', totalHires: 42,
    scopeWebApp: 'N/A', cesPercentage: '45%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'pizzahut.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Plano, TX'
  },
  { 
    org: 'Kraft Heinz', logo: 'https://logo.clearbit.com/kraftheinz.com', 
    id: 3, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-[#409add]', 
    stage: 'Onboarding (Enterprise)', health: { val: 8.6, clr: 'bg-[#00a699]' }, 
    pulse: [1,1,1,1,1], aiScore: 'Moderate',
    reason: 'Successful milestone completion but technical...', fullReason: 'Successful milestone completion but technical integration delays causing moderate friction.',
    nps: '-17', npsColor: 'bg-[#fb5e5e]', csat: '47.8%', csatColor: 'bg-[#fb5e5e]',
    joined: '24 Apr 2024', renewal: '15 Nov 2027', arrAccount: '152,600.00', arrHQ: '167,800.00',
    implFee: '85,000.00', tcv: '320,400.00', tcvRenewal: '336,420.00',
    contractStart: '31 Oct 2024', contractEnd: '22 Nov 2027',
    productsUtilized: { primary: 'Integrations Module', additional: null }, topSourceChannel: 'Google Search',
    totalContractedSeats: 1071, totalActiveSeats: 940, totalSeatUtilization: '87.77%', totalHires: 56,
    scopeWebApp: 'N/A', cesPercentage: '75%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'kraftheinz.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Chicago, IL'
  },
  { 
    org: 'Hyatt Hotels Corporation - Glob...', logo: 'https://logo.clearbit.com/hyatt.com', 
    id: 4, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-[#409add]', 
    stage: 'Live (Enterprise)', health: { val: 8.8, clr: 'bg-[#00a699]' }, 
    pulse: [3,3,3,0,0], aiScore: 'Satisfied',
    reason: 'High renewal probability back by strong expansion into...', fullReason: 'High renewal probability back by strong expansion into the LATAM region.',
    nps: '+40', npsColor: 'bg-[#0bc2a6]', csat: '73.3%', csatColor: 'bg-[#0bc2a6]',
    joined: '26 Mar 2023', renewal: '2 Feb 2026', arrAccount: '59,500.00', arrHQ: '101,900.00',
    implFee: '40,000.00', tcv: '161,400.00', tcvRenewal: '169,470.00',
    contractStart: '24 Feb 2024', contractEnd: '2 Sep 2026',
    productsUtilized: { primary: 'Product C', additional: null }, topSourceChannel: 'Talent Pool Re-engage',
    totalContractedSeats: 1041, totalActiveSeats: 822, totalSeatUtilization: '78.96%', totalHires: 19,
    scopeWebApp: 'N/A', cesPercentage: '88%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'hyatt.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Chicago, IL'
  },
  { 
    org: 'Arista Networks - Corporate HQ ...', logo: 'https://logo.clearbit.com/arista.com', 
    id: 5, owner: 'Edgar Holmes', avatar: 'EH', bg: 'bg-[#409add]', 
    stage: 'Onboarding (Enterprise)', health: { val: 10, clr: 'bg-[#00a699]' }, 
    pulse: [1,1,1,1,1], aiScore: 'Satisfied',
    reason: 'Steady onboarding progress with high sentiment scores fro...', fullReason: 'Steady onboarding progress with high sentiment scores from the execution team.',
    nps: '+47', npsColor: 'bg-[#0bc2a6]', csat: '80%', csatColor: 'bg-[#0bc2a6]',
    joined: '1 Jan 2023', renewal: '28 Sep 2026', arrAccount: '101,700.00', arrHQ: '131,100.00',
    implFee: '65,000.00', tcv: '232,800.00', tcvRenewal: '244,440.00',
    contractStart: '16 Dec 2023', contractEnd: '5 Oct 2026',
    productsUtilized: { primary: 'Product C', additional: 1 }, topSourceChannel: 'University Portal',
    totalContractedSeats: 607, totalActiveSeats: 412, totalSeatUtilization: '67.87%', totalHires: 30,
    scopeWebApp: 'N/A', cesPercentage: '91%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'arista.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Santa Clara, CA'
  },
  { 
    org: 'Oracle', logo: 'https://logo.clearbit.com/oracle.com', 
    id: 6, owner: 'Daniel Trial Test', avatar: 'DT', bg: 'bg-gray-800 img', img: 'https://i.pravatar.cc/150?u=daniel',
    stage: 'Onboarding (Enterprise)', health: { val: 10, clr: 'bg-[#00a699]' }, 
    pulse: [1,1,1,1,0], aiScore: 'Very Satisfied',
    reason: 'Peak platform utilization and frequent participation in...', fullReason: 'Peak platform utilization and frequent participation in our beta features program.',
    nps: '+100', npsColor: 'bg-[#0bc2a6]', csat: '100%', csatColor: 'bg-[#087383]',
    joined: '1 Jun 2025', renewal: '15 May 2026', arrAccount: '0.00', arrHQ: '0.00',
    implFee: '20,000.00', tcv: '0.00', tcvRenewal: '0.00',
    contractStart: '10 Jun 2025', contractEnd: '10 Jun 2026',
    productsUtilized: { primary: 'Integrations Module', additional: 2 }, topSourceChannel: 'Indeed',
    totalContractedSeats: 0, totalActiveSeats: 0, totalSeatUtilization: 'N/A', totalHires: 0,
    scopeWebApp: 'N/A', cesPercentage: '96%', churnDate: '-', churnReason: '-', churnComment: '-',
    domain: 'oracle.com', createdBy: 'System', modifiedBy: 'System', nameAddress: 'Austin, TX'
  }
];
