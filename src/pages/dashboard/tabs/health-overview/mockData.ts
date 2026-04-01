export type HealthStatus = 'Poor' | 'Average' | 'Good';
export type Owner = 'Melak Anbessa' | 'Justin Middleton' | 'Joey Gilkey' | 'Gerry Hill';

export interface HealthDataRow {
  id: string;
  account: string;
  owner: Owner;
  lifecycleStage: string;
  renewalDate: string;
  healthStatus: HealthStatus;
  healthScore: number;
  csmPulseScore: number;
  aiPulseScore: number;
  lastPulseModified: string;
  aiPulseReason: string;
  activeRecruiters: number;
  history: {
    month: string;
    status: HealthStatus;
  }[];
}

export const MOCK_OWNERS: Owner[] = ['Melak Anbessa', 'Justin Middleton', 'Joey Gilkey', 'Gerry Hill'];

// Generate ~50 diverse mock rows with varied health distributions
const generateMockData = (): HealthDataRow[] => {
  const data: HealthDataRow[] = [];
  const accounts = [
    'Nova Enterprises', 'Stream Technologies', 'Prime Enterprises', 'Quantum Logistics', 
    'Horizon Labs', 'Global Partners', 'Bloomreach', 'Summit Consulting', 'Evo Labs', 
    'Horizon Industries', 'Global Group', 'Evo Group', 'Stream Consulting', 'Core Systems', 
    'Apex Dynamics', 'Velocity Logistics', 'Stark Industries', 'Wayne Enterprises'
  ];

  for (let i = 1; i <= 60; i++) {
    // Artificial distribution skewing towards 'Good' to match screenshot 398 vs 182 vs 38
    const rand = Math.random();
    let status: HealthStatus = 'Good';
    let csmPulse = 3;
    let aiPulse = 3;

    if (rand < 0.15) {
      status = 'Poor';
      csmPulse = Math.floor(Math.random() * 2) + 1; // 1-2
      aiPulse = Math.floor(Math.random() * 2) + 1;
    } else if (rand < 0.45) {
      status = 'Average';
      csmPulse = 3;
      aiPulse = Math.floor(Math.random() * 2) + 2; // 2-3
    } else {
      status = 'Good';
      csmPulse = Math.floor(Math.random() * 2) + 4; // 4-5
      aiPulse = Math.floor(Math.random() * 2) + 4;
    }

    const owner = MOCK_OWNERS[Math.floor(Math.random() * MOCK_OWNERS.length)];
    const account = accounts[Math.floor(Math.random() * accounts.length)];

    data.push({
      id: `${i}`,
      account: `${account} ${i}`,
      owner,
      lifecycleStage: Math.random() > 0.8 ? 'Pilot' : (Math.random() > 0.9 ? 'Closed Lost' : 'Customer - Active'),
      renewalDate: `Dec 31, 2026`,
      healthStatus: status,
      healthScore: status === 'Good' ? 8 : (status === 'Average' ? 5 : 2),
      csmPulseScore: csmPulse,
      aiPulseScore: aiPulse,
      lastPulseModified: 'Feb 4, 2026',
      aiPulseReason: 'AI detected higher potential due to surging career site traffic',
      activeRecruiters: Math.floor(Math.random() * 50) + 10,
      history: [
        { month: 'Apr 30, 2025', status: Math.random() > 0.5 ? 'Average' : 'Good' },
        { month: 'May 31, 2025', status: 'Average' },
        { month: 'Jun 30, 2025', status: status },
      ]
    });
  }

  // Inject a few hardcoded 'Poor' ones from the screenshot to ensure exact matches
  data.push({
    id: '2',
    account: 'Nova Enterprises',
    owner: 'Gerry Hill',
    lifecycleStage: 'Customer - Active',
    renewalDate: 'Dec 31, 2026',
    healthStatus: 'Poor',
    healthScore: 2,
    csmPulseScore: 1,
    aiPulseScore: 2,
    lastPulseModified: 'Feb 4, 2026',
    aiPulseReason: 'AI detected higher potential due to surging career site traffic',
    activeRecruiters: 38,
    history: []
  });

  return data;
};

export const MOCK_HEALTH_DATA = generateMockData();
