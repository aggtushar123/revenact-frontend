import type {
  KnowledgeNode, Skill, Connector, FeedbackEntry, BrainMetrics, DomainCoverage
} from './types';

// ─────────────────────────────────────────────────────────────
// Knowledge Nodes
// ─────────────────────────────────────────────────────────────
export const mockNodes: KnowledgeNode[] = [
  {
    id: 'node-1',
    name: 'Escalation SLA Policy — Tier 1 Customers',
    domain: 'Support',
    status: 'healthy',
    confidence: 0.92,
    sources: ['Confluence', 'Slack #support-ops'],
    updatedAt: '2026-04-20',
    owner: 'Sarah Chen',
    content: 'All Tier 1 customer tickets must receive a first response within 2 hours of creation. Escalations to L2 must occur within 4 hours if unresolved. SLA breach triggers automatic CS manager notification via Slack.',
    relationships: [{ targetId: 'node-3', strength: 0.8 }, { targetId: 'node-7', strength: 0.5 }],
  },
  {
    id: 'node-2',
    name: 'Enterprise Pricing Tiers — FY2026',
    domain: 'Finance',
    status: 'stale',
    confidence: 0.61,
    sources: ['Notion'],
    updatedAt: '2026-01-10',
    owner: 'Mark Ellis',
    content: 'Enterprise plans are structured across three tiers: Growth ($499/mo), Scale ($1,499/mo), and Enterprise (custom). Volume discounts apply at 50+ seats. Annual pre-payment provides 15% discount.',
    relationships: [{ targetId: 'node-5', strength: 0.7 }],
  },
  {
    id: 'node-3',
    name: 'Onboarding Checklist — v3.2',
    domain: 'Operations',
    status: 'pending',
    confidence: 0.85,
    sources: ['Confluence', 'Google Docs'],
    updatedAt: '2026-04-28',
    owner: 'Unassigned',
    content: 'New customer onboarding consists of: (1) Kickoff call within 48h of signing, (2) Data migration scoping, (3) Integration setup (CRM, support tools), (4) Training sessions x2, (5) Go-live sign-off.',
    relationships: [{ targetId: 'node-1', strength: 0.8 }, { targetId: 'node-6', strength: 0.6 }],
  },
  {
    id: 'node-4',
    name: 'API Rate Limit Specification',
    domain: 'Engineering',
    status: 'conflicted',
    confidence: 0.44,
    sources: ['GitHub', 'Confluence'],
    updatedAt: '2026-03-15',
    owner: 'James Park',
    content: 'Public API: 1000 req/min per tenant. Internal service-to-service: 10,000 req/min. Burst allowance: 2x limit for 30s. Exceeded limits return HTTP 429 with Retry-After header.',
    relationships: [{ targetId: 'node-8', strength: 0.9 }],
  },
  {
    id: 'node-5',
    name: 'Sales Qualification Criteria — ICP',
    domain: 'Sales',
    status: 'healthy',
    confidence: 0.88,
    sources: ['HubSpot', 'Notion'],
    updatedAt: '2026-04-15',
    owner: 'Priya Sharma',
    content: 'Ideal Customer Profile: B2B SaaS or tech company, 100-2000 employees, CS team >5 people, annual revenue $5M+, uses Salesforce or HubSpot CRM. Disqualify: <50 employees, consumer product, no dedicated CS function.',
    relationships: [{ targetId: 'node-2', strength: 0.7 }],
  },
  {
    id: 'node-6',
    name: 'HR Offboarding Protocol',
    domain: 'HR',
    status: 'new',
    confidence: 0.73,
    sources: ['BambooHR', 'Confluence'],
    updatedAt: '2026-04-29',
    owner: 'Lisa Wong',
    content: 'Employee offboarding: IT access revocation within 24h, equipment return within 5 business days, exit interview within last week, payroll final run on standard cycle unless involuntary termination.',
    relationships: [{ targetId: 'node-3', strength: 0.6 }],
  },
  {
    id: 'node-7',
    name: 'Customer Health Score Algorithm',
    domain: 'Support',
    status: 'healthy',
    confidence: 0.95,
    sources: ['Revenact', 'Confluence'],
    updatedAt: '2026-04-22',
    owner: 'Sarah Chen',
    content: 'Health score = weighted sum: Product usage (40%), Support ticket frequency (25%), NPS score (20%), Contract renewal probability (15%). Scores below 40 trigger automated CS outreach.',
    relationships: [{ targetId: 'node-1', strength: 0.5 }, { targetId: 'node-5', strength: 0.4 }],
  },
  {
    id: 'node-8',
    name: 'Microservices Deployment Runbook',
    domain: 'Engineering',
    status: 'stale',
    confidence: 0.58,
    sources: ['GitHub', 'Notion'],
    updatedAt: '2026-02-03',
    owner: 'James Park',
    content: 'All services deploy via CI/CD pipeline (GitHub Actions). Production deploys require 2 approvals. Rollback: use `make rollback SERVICE=<name>` to revert to previous container tag. Canary deployments for traffic-sensitive services.',
    relationships: [{ targetId: 'node-4', strength: 0.9 }],
  },
  {
    id: 'node-9',
    name: 'Invoice Payment Terms',
    domain: 'Finance',
    status: 'pending',
    confidence: 0.79,
    sources: ['Notion', 'Stripe'],
    updatedAt: '2026-04-25',
    owner: 'Mark Ellis',
    content: 'Standard payment terms: Net 30 from invoice date. Enterprise customers may negotiate Net 60. Overdue invoices (>15 days) trigger automated reminder. >30 days: account manager notified. >60 days: account suspended.',
    relationships: [{ targetId: 'node-2', strength: 0.8 }],
  },
  {
    id: 'node-10',
    name: 'Data Retention Policy',
    domain: 'Engineering',
    status: 'new',
    confidence: 0.66,
    sources: ['Confluence', 'Legal Drive'],
    updatedAt: '2026-04-28',
    owner: 'Unassigned',
    content: 'Customer data retained for 7 years post-contract. PII deleted on request within 30 days per GDPR. Logs retained 90 days. Backups: daily incremental, weekly full, 1-year retention.',
    relationships: [{ targetId: 'node-8', strength: 0.6 }],
  },
];

// ─────────────────────────────────────────────────────────────
// Skills
// ─────────────────────────────────────────────────────────────
export const mockSkills: Skill[] = [
  {
    id: 'skill-1',
    name: 'resolve-tier1-ticket',
    domain: 'Support',
    version: 'v2.3.1',
    status: 'published',
    agentUsage30d: 1240,
    successRate: 0.94,
    escalationRate: 0.04,
    correctionRate: 0.02,
    lastPublished: '2026-04-15T10:00:00Z',
    usedByAgents: ['agent-support-001', 'agent-support-002', 'agent-cx-003'],
    yamlContent: `name: resolve-tier1-ticket
version: 2.3.1
domain: support
description: Resolves Tier 1 customer support tickets using SLA-aware routing

inputs:
  - ticket_id: string
  - customer_tier: enum [tier1, tier2, tier3]
  - issue_category: string

steps:
  - fetch_ticket:
      source: zendesk
      id: "{{ticket_id}}"
  - classify_severity:
      model: gpt-4o
      context: escalation-sla-policy
      output: severity_level
  - route_ticket:
      if: severity_level == "high"
      then: escalate_to_l2
      else: auto_respond
  - auto_respond:
      template: tier1-resolution-template
      personalization: true
  - update_ticket_status:
      status: resolved
      add_tag: "ai-resolved"

outputs:
  - resolution_status: string
  - response_sent: boolean
  - escalated: boolean`,
    previousYamlContent: `name: resolve-tier1-ticket
version: 2.3.0
domain: support
description: Resolves Tier 1 customer support tickets

inputs:
  - ticket_id: string
  - customer_tier: enum [tier1, tier2, tier3]

steps:
  - fetch_ticket:
      source: zendesk
      id: "{{ticket_id}}"
  - auto_respond:
      template: tier1-resolution-template
  - update_ticket_status:
      status: resolved

outputs:
  - resolution_status: string`,
  },
  {
    id: 'skill-2',
    name: 'qualify-enterprise-lead',
    domain: 'Sales',
    version: 'v1.0.0',
    status: 'draft',
    agentUsage30d: 0,
    successRate: null,
    lastPublished: undefined,
    usedByAgents: [],
    yamlContent: `name: qualify-enterprise-lead
version: 1.0.0
domain: sales
description: Qualifies inbound leads against ICP criteria

inputs:
  - lead_id: string
  - company_data: object

steps:
  - fetch_enrichment:
      source: clearbit
      domain: "{{company_data.domain}}"
  - score_icp_fit:
      model: gpt-4o
      context: sales-qualification-criteria
      output: icp_score
  - route_lead:
      if: icp_score >= 70
      then: assign_to_ae
      else: nurture_sequence

outputs:
  - icp_score: number
  - qualified: boolean`,
  },
  {
    id: 'skill-3',
    name: 'health-score-update',
    domain: 'Support',
    version: 'v3.1.0',
    status: 'published',
    agentUsage30d: 4200,
    successRate: 0.97,
    escalationRate: 0.02,
    correctionRate: 0.01,
    lastPublished: '2026-04-22T08:00:00Z',
    usedByAgents: ['agent-cs-001', 'agent-cs-002'],
    yamlContent: `name: health-score-update
version: 3.1.0
domain: support
description: Recalculates customer health scores based on latest signals

inputs:
  - customer_id: string
  - recalculation_trigger: enum [usage_event, ticket_closed, nps_received, manual]

steps:
  - fetch_signals:
      sources: [revenact, zendesk, delighted]
  - compute_score:
      weights:
        usage: 0.40
        support_frequency: 0.25
        nps: 0.20
        renewal_probability: 0.15
  - update_crm:
      field: health_score
  - trigger_playbook_if_low:
      threshold: 40
      playbook: proactive-outreach

outputs:
  - new_score: number
  - delta: number
  - playbook_triggered: boolean`,
  },
  {
    id: 'skill-4',
    name: 'offboarding-checklist-runner',
    domain: 'HR',
    version: 'v1.2.0',
    status: 'under-review',
    agentUsage30d: 12,
    successRate: 0.83,
    escalationRate: 0.10,
    correctionRate: 0.07,
    lastPublished: '2026-04-10T15:00:00Z',
    usedByAgents: ['agent-hr-001'],
    yamlContent: `name: offboarding-checklist-runner
version: 1.2.0
domain: hr
description: Automates employee offboarding task distribution

inputs:
  - employee_id: string
  - termination_type: enum [voluntary, involuntary]
  - last_day: date

steps:
  - notify_it:
      action: revoke_access
      deadline: 24h
  - notify_facilities:
      action: equipment_return
      deadline: 5_business_days
  - schedule_exit_interview:
      timing: last_week
  - process_final_payroll:
      type: "{{termination_type}}"

outputs:
  - tasks_created: number
  - completion_status: object`,
  },
  {
    id: 'skill-5',
    name: 'payment-overdue-escalation',
    domain: 'Finance',
    version: 'v2.0.0',
    status: 'published',
    agentUsage30d: 89,
    successRate: 0.91,
    escalationRate: 0.06,
    correctionRate: 0.03,
    lastPublished: '2026-04-01T12:00:00Z',
    usedByAgents: ['agent-finance-001'],
    yamlContent: `name: payment-overdue-escalation
version: 2.0.0
domain: finance
description: Manages overdue invoice escalation workflow

inputs:
  - invoice_id: string
  - days_overdue: number

steps:
  - send_reminder:
      if: days_overdue >= 15
      template: payment-reminder-v2
  - notify_account_manager:
      if: days_overdue >= 30
  - suspend_account:
      if: days_overdue >= 60
      require_approval: true

outputs:
  - action_taken: string
  - account_suspended: boolean`,
  },
];

// ─────────────────────────────────────────────────────────────
// Connectors
// ─────────────────────────────────────────────────────────────
export const mockConnectors: Connector[] = [
  {
    id: 'conn-1',
    name: 'Confluence',
    logo: 'https://cdn.worldvectorlogo.com/logos/confluence-1.svg',
    status: 'connected',
    lastSync: '2026-04-29T08:00:00Z',
    recordCount: 2847,
  },
  {
    id: 'conn-2',
    name: 'Slack',
    logo: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
    status: 'connected',
    lastSync: '2026-04-29T09:15:00Z',
    recordCount: 18423,
  },
  {
    id: 'conn-3',
    name: 'Notion',
    logo: 'https://cdn.worldvectorlogo.com/logos/notion-2.svg',
    status: 'error',
    lastSync: '2026-04-27T14:30:00Z',
    recordCount: 612,
    errorMessage: 'OAuth token expired. Please reconnect.',
  },
  {
    id: 'conn-4',
    name: 'GitHub',
    logo: 'https://cdn.worldvectorlogo.com/logos/github-icon-2.svg',
    status: 'connected',
    lastSync: '2026-04-29T07:45:00Z',
    recordCount: 4201,
  },
  {
    id: 'conn-5',
    name: 'Google Drive',
    logo: 'https://cdn.worldvectorlogo.com/logos/google-drive.svg',
    status: 'disconnected',
    lastSync: '2026-04-01T10:00:00Z',
    recordCount: 0,
  },
];

// ─────────────────────────────────────────────────────────────
// Feedback Log
// ─────────────────────────────────────────────────────────────
export const mockFeedback: FeedbackEntry[] = [
  {
    id: 'fb-1',
    agentId: 'agent-support-001',
    skillId: 'skill-1',
    skillName: 'resolve-tier1-ticket',
    outcome: 'success',
    timestamp: '2026-04-29T09:32:00Z',
    linkedNodeId: 'node-1',
    nodeTitle: 'Escalation SLA Policy — Tier 1 Customers',
  },
  {
    id: 'fb-2',
    agentId: 'agent-cs-002',
    skillId: 'skill-3',
    skillName: 'health-score-update',
    outcome: 'success',
    timestamp: '2026-04-29T09:15:00Z',
  },
  {
    id: 'fb-3',
    agentId: 'agent-support-002',
    skillId: 'skill-1',
    skillName: 'resolve-tier1-ticket',
    outcome: 'escalation',
    timestamp: '2026-04-29T08:58:00Z',
    linkedNodeId: 'node-1',
    nodeTitle: 'Escalation SLA Policy — Tier 1 Customers',
  },
  {
    id: 'fb-4',
    agentId: 'agent-hr-001',
    skillId: 'skill-4',
    skillName: 'offboarding-checklist-runner',
    outcome: 'correction',
    timestamp: '2026-04-29T08:20:00Z',
    linkedNodeId: 'node-6',
    nodeTitle: 'HR Offboarding Protocol',
  },
  {
    id: 'fb-5',
    agentId: 'agent-finance-001',
    skillId: 'skill-5',
    skillName: 'payment-overdue-escalation',
    outcome: 'success',
    timestamp: '2026-04-29T07:45:00Z',
  },
  {
    id: 'fb-6',
    agentId: 'agent-support-001',
    skillId: 'skill-3',
    skillName: 'health-score-update',
    outcome: 'success',
    timestamp: '2026-04-29T07:20:00Z',
    linkedNodeId: 'node-7',
    nodeTitle: 'Customer Health Score Algorithm',
  },
  {
    id: 'fb-7',
    agentId: 'agent-cx-003',
    skillId: 'skill-1',
    skillName: 'resolve-tier1-ticket',
    outcome: 'escalation',
    timestamp: '2026-04-28T22:10:00Z',
  },
  {
    id: 'fb-8',
    agentId: 'agent-support-002',
    skillId: 'skill-3',
    skillName: 'health-score-update',
    outcome: 'correction',
    timestamp: '2026-04-28T18:00:00Z',
    linkedNodeId: 'node-7',
    nodeTitle: 'Customer Health Score Algorithm',
  },
];

// ─────────────────────────────────────────────────────────────
// Dashboard Metrics
// ─────────────────────────────────────────────────────────────
export const brainMetrics: BrainMetrics = {
  knowledgeCoverage: 68,
  coverageTrend: +3.2,
  agentSuccessRate: 91,
  nodesPendingReview: 4, // nodes with status === 'pending' or 'new'
  freshnessScore: 23,    // median days since last update
};

// ─────────────────────────────────────────────────────────────
// Domain Coverage Bars
// ─────────────────────────────────────────────────────────────
export const domainCoverage: DomainCoverage[] = [
  { domain: 'Support',     coverage: 84, confidence: 'high',   nodeCount: 3 },
  { domain: 'Finance',     coverage: 61, confidence: 'medium', nodeCount: 3 },
  { domain: 'Engineering', coverage: 53, confidence: 'low',    nodeCount: 3 },
  { domain: 'Operations',  coverage: 72, confidence: 'medium', nodeCount: 1 },
  { domain: 'Sales',       coverage: 88, confidence: 'high',   nodeCount: 1 },
  { domain: 'HR',          coverage: 45, confidence: 'low',    nodeCount: 2 },
];
