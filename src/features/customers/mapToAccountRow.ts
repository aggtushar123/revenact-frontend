import type { Account } from './customersSlice';
import type { AccountRow } from '../../components/organizations/accountsData';
import { formatDate, initials, HEALTH_COLORS, LIFECYCLE_LABELS, AI_PULSE_LABELS } from './formatters';

// Adapts a real backend `Account` into the `AccountRow` shape the
// (mock-data-era) Accounts tab (Details.tsx's AccountsTab/
// AccountsMetricsBanner) already renders — same approach as
// mapToOrgRow.ts for Customer/OrgRow, and for the same reason: swapping
// mock data for real data didn't require rewriting that UI.
//
// `orgId`/`orgName`/`orgDomain` come from the parent Customer (already
// fetched by Details.tsx for its own header/General tab) rather than
// from the Account itself — an Account only carries a `customer` id, not
// its parent's name, and its own `domain` is meant to fall back to the
// parent's for the logo (see the backend Account model's docstring).
export function mapAccountToAccountRow(
  a: Account,
  orgId: number,
  orgName: string,
  orgDomain: string
): AccountRow {
  const arr = Number(a.arr);
  const nps = a.nps_score ?? 0;
  const csat = a.csat_score !== null ? parseFloat(a.csat_score) : null;
  const domain = a.domain || orgDomain;

  return {
    orgId,
    id: String(a.id),
    name: a.name,
    orgName,
    logo: domain ? `https://logo.clearbit.com/${domain}` : '',
    revenactId: a.id,
    pulse: a.pulse,
    aiPulseScore: AI_PULSE_LABELS[a.ai_pulse_score] ?? '—',
    aiPulseReason: a.ai_pulse_reason || '-',
    owner: a.owner?.name ?? 'Unassigned',
    avatar: a.owner ? initials(a.owner.name) : '—',
    health: { val: Number(a.health_score), clr: HEALTH_COLORS[a.health_category] },
    healthCategory: a.health_category,
    nps: a.nps_score === null ? '0' : `${nps > 0 ? '+' : ''}${nps}`,
    npsValue: nps,
    csat: csat === null ? 'N/A' : `${csat}%`,
    csatValue: csat ?? 0,
    lifecycleStage: LIFECYCLE_LABELS[a.lifecycle_stage] ?? 'Other',
    mrr: Math.round(arr / 12),
    arr,
    renewal: formatDate(a.renewal_date),
  };
}
