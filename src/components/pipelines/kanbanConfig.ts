import { companyLabel } from '../../features/customers/formatters';
import type { Opportunity, Risk } from '../../features/customers/customersSlice';

// Plain data/helpers shared by KanbanBoard.tsx and its consumers
// (PipelinesPage.tsx, PipelinesTab.tsx) — split out from KanbanBoard.tsx
// itself because a file exporting a component can only export
// components (react-refresh/only-export-components), not also these.

export const PRIORITY_COLORS = {
  high: 'bg-danger-dim text-danger border-danger/40',
  medium: 'bg-warning-dim text-warning border-warning/40',
  low: 'bg-success-dim text-success border-success/40',
};

// Matches Opportunity.Stage/Risk.Stage on the backend exactly (services/
// customers/models.py), same order as each board's own Kanban columns.
export const OPPORTUNITY_STAGE_COLUMNS: { stage: Opportunity['stage']; title: string }[] = [
  { stage: 'discovery', title: 'Discovery' },
  { stage: 'qualification', title: 'Qualification' },
  { stage: 'solution_validation', title: 'Solution Validation' },
  { stage: 'proposal_price_review', title: 'Proposal / Price Review' },
  { stage: 'negotiation', title: 'Negotiation' },
  { stage: 'closed_won', title: 'Closed Won' },
];

export const RISK_STAGE_COLUMNS: { stage: Risk['stage']; title: string }[] = [
  { stage: 'open', title: 'Open' },
  { stage: 'mitigated', title: 'Mitigated' },
  { stage: 'realised', title: 'Realised' },
  { stage: 'abandoned', title: 'Abandoned' },
];

// Opportunity and Risk are otherwise unrelated models, but their own
// card content is field-for-field identical (title/mrr/companies/
// account_name/priority) — this is the common shape KanbanBoard needs,
// satisfied structurally by both without either importing the other.
export interface PipelineCardEntity {
  id: number;
  title: string;
  mrr: string;
  priority: 'high' | 'medium' | 'low';
  /** Opportunity/Risk only: whose pipeline it is on. */
  department?: string;
  department_display?: string;
  companies: { id: number; name: string }[];
  account_name: string | null;
}

export function pipelineOrgLabel(e: PipelineCardEntity): string {
  const label = companyLabel(e.companies);
  return e.account_name ? `${label} • ${e.account_name}` : label;
}
