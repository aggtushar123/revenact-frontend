import type { AccountRow } from '../../components/organizations/accountsData';
import { HEALTH_COLORS, LIFECYCLE_LABELS, formatDate, initials } from '../customers/formatters';
import type { AccountPortfolioRow } from './portfolioTypes';

/** The row `/accounts/:id` (pages/accounts/Details.tsx, until delivery 2)
 *  reads from `location.state.account`, built from a portfolio row as
 *  mapAccountToAccountRow built it from GET /accounts/. The first openable
 *  organisation stands in for the parent the old mapper was given; with
 *  none, the page's organisation-scoped reads have no id (0), as before for
 *  an unknown parent. */
export function accountNavRow(row: AccountPortfolioRow): AccountRow {
  const profile = row.details.profile;
  const nps = row.details.voice.nps_score;
  const csat = row.details.voice.csat_score;
  const arr = row.arr ?? 0;
  return {
    orgId: row.organisation?.id ?? 0,
    id: String(row.id),
    name: row.name,
    orgName: row.organisation?.name ?? '',
    orgs: profile.organisations,
    // No third-party logo (house rule): the page's avatar falls back to initials.
    logo: '',
    revenactId: row.id,
    domain: profile.domain || undefined,
    location: profile.address || undefined,
    email: profile.email || undefined,
    phone: profile.phone || undefined,
    industry: profile.industry || undefined,
    pulse: row.pulse.history,
    // The server's label for the AI category ("High Risk"), as AI_PULSE_LABELS printed it.
    aiPulseScore: row.pulse.ai_label || '—',
    aiPulseReason: row.pulse.reason || '-',
    owner: row.owner?.name ?? 'Unassigned',
    ownerId: row.owner?.id ?? null,
    ownerFunction: null,
    accountPulse: null,
    avatar: row.owner ? initials(row.owner.name) : '—',
    health: { val: row.health.score, clr: HEALTH_COLORS[row.health.category] },
    healthCategory: row.health.category,
    nps: nps === null ? '0' : `${nps > 0 ? '+' : ''}${nps}`,
    npsValue: nps ?? 0,
    csat: csat === null ? 'N/A' : `${csat}%`,
    csatValue: csat ?? 0,
    lifecycleStage: LIFECYCLE_LABELS[row.lifecycle.value] ?? 'Other',
    mrr: Math.round(arr / 12),
    arr,
    renewal: formatDate(row.renewal.date),
  };
}
