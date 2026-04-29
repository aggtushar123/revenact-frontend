// ─────────────────────────────────────────────────────────────
// Company Brain — TypeScript type definitions
// ─────────────────────────────────────────────────────────────

export type NodeStatus = 'healthy' | 'stale' | 'pending' | 'conflicted' | 'new';
export type SkillStatus = 'draft' | 'published' | 'deprecated' | 'under-review';
export type ConnectorStatus = 'connected' | 'disconnected' | 'error';
export type FeedbackOutcome = 'success' | 'escalation' | 'correction';

export interface KnowledgeNode {
  id: string;
  name: string;
  domain: string;
  status: NodeStatus;
  confidence: number; // 0–1
  sources: string[];
  updatedAt: string;  // ISO date string
  owner: string;
  content?: string;   // full extracted knowledge text
  relationships?: { targetId: string; strength: number }[];
}

export interface Skill {
  id: string;
  name: string;
  domain: string;
  version: string;
  status: SkillStatus;
  agentUsage30d: number;
  successRate: number | null;
  escalationRate?: number;
  correctionRate?: number;
  yamlContent?: string;
  previousYamlContent?: string;
  usedByAgents?: string[];
  lastPublished?: string;
}

export interface Connector {
  id: string;
  name: string;
  logo: string;
  status: ConnectorStatus;
  lastSync: string;  // ISO datetime string
  recordCount: number;
  errorMessage?: string;
}

export interface FeedbackEntry {
  id: string;
  agentId: string;
  skillId: string;
  skillName: string;
  outcome: FeedbackOutcome;
  timestamp: string;   // ISO datetime string
  linkedNodeId?: string;
  nodeTitle?: string;
}

export interface BrainMetrics {
  knowledgeCoverage: number;     // percentage 0–100
  coverageTrend: number;         // delta e.g. +3.2
  agentSuccessRate: number;      // percentage
  nodesPendingReview: number;
  freshnessScore: number;        // median days since last update
}

export interface DomainCoverage {
  domain: string;
  coverage: number;   // 0–100
  confidence: 'low' | 'medium' | 'high';
  nodeCount: number;
}
