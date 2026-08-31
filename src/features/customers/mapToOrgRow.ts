import type { Customer } from './customersSlice';
import type { OrgRow, LifecycleCategory } from '../../components/organizations/tableData';

// Adapts a real backend `Customer` into the `OrgRow` shape the
// (mock-data-era) organizations table/popovers already render. Keeping the
// table components untouched and doing the shaping here means swapping
// mock data for real data didn't require rewriting the UI — see
// OrganizationsTable.tsx and List.tsx.
//
// A few OrgRow fields have no backend counterpart (they were always purely
// presentational: pill/dot colors, avatar initials, the "(Enterprise)"/
// "(Mid-Market)" tier suffix on lifecycle stage) — those are derived here
// from real fields rather than fabricated from nothing.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Formats a "YYYY-MM-DD" date-only string without going through `Date`
// (which would apply the local timezone and can shift the day).
function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatMoney(val: string | null | undefined): string {
  const n = Number(val ?? 0);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return 'N/A';
  return `${parseFloat(String(val))}%`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return letters.toUpperCase() || '?';
}

const HEALTH_COLORS: Record<Customer['health_category'], string> = {
  good: 'bg-[var(--success)]',
  average: 'bg-[var(--warning)]',
  poor: 'bg-[var(--danger)]',
};

const LIFECYCLE_LABELS: Record<LifecycleCategory, string> = {
  onboarding: 'Onboarding',
  kickoff: 'Kickoff',
  adoption: 'Adoption',
  live: 'Live',
  renewal: 'Renewal',
  churn: 'Churn',
  expansion: 'Expansion',
  other: 'Other',
};

const AI_PULSE_LABELS: Record<Customer['ai_pulse_score'], string> = {
  very_satisfied: 'Very Satisfied',
  satisfied: 'Satisfied',
  moderate: 'Moderate',
  high_risk: 'High Risk',
  '': '—',
};

// Matches the mock data's own implied rule: any positive score reads as
// healthy, zero is neutral, negative is a detractor signal.
function npsColor(nps: number): string {
  if (nps > 0) return 'bg-[var(--success)]';
  if (nps === 0) return 'bg-[var(--warning)]';
  return 'bg-[var(--danger)]';
}

// Thresholds fitted to the mock data's own csat/ces color bands.
function csatColor(pct: number): string {
  if (pct >= 70) return 'bg-[var(--success)]';
  if (pct >= 50) return 'bg-[var(--warning)]';
  return 'bg-[var(--danger)]';
}

export function mapCustomerToOrgRow(c: Customer): OrgRow {
  const arr = Number(c.arr_billed_at_account);
  const nps = c.nps_score ?? 0;
  const csat = c.csat_score !== null ? parseFloat(c.csat_score) : null;

  return {
    org: c.name,
    logo: c.domain ? `https://logo.clearbit.com/${c.domain}` : '',
    id: c.id,
    owner: c.owner?.name ?? 'Unassigned',
    avatar: c.owner ? initials(c.owner.name) : '—',
    bg: c.owner ? 'bg-indigo-500' : 'bg-gray-300',
    img: c.owner?.avatar,
    stage: LIFECYCLE_LABELS[c.lifecycle_stage] ?? 'Other',
    health: { val: Number(c.health_score), clr: HEALTH_COLORS[c.health_category] },
    healthCategory: c.health_category,
    lifecycleCategory: c.lifecycle_stage,
    pulse: c.pulse,
    aiScore: AI_PULSE_LABELS[c.ai_pulse_score] ?? '—',
    reason: c.ai_pulse_reason || '-',
    fullReason: c.ai_pulse_reason || '-',
    nps: c.nps_score === null ? '0' : `${nps > 0 ? '+' : ''}${nps}`,
    npsValue: nps,
    npsColor: npsColor(nps),
    csat: csat === null ? 'N/A' : `${csat}%`,
    csatColor: csat === null ? 'bg-gray-300' : csatColor(csat),
    joined: formatDate(c.joined_date),
    renewal: formatDate(c.renewal_date),
    arrAccount: formatMoney(c.arr_billed_at_account),
    arrHQ: formatMoney(c.arr_billed_at_hq),
    implFee: formatMoney(c.implementation_fee),
    tcv: formatMoney(c.total_contract_value),
    tcvRenewal: formatMoney(c.total_forecasted_renewal_revenue),
    contractStart: formatDate(c.contract_start_date),
    contractEnd: formatDate(c.contract_end_date),
    productsUtilized: { primary: c.primary_product || '-', additional: c.additional_products_count },
    topSourceChannel: c.top_source_channel || '-',
    totalContractedSeats: c.total_contracted_seats ?? 0,
    totalActiveSeats: c.total_active_seats ?? 0,
    totalSeatUtilization: formatPercent(c.seat_utilization_percentage),
    totalHires: c.total_hires ?? 0,
    scopeWebApp: c.scope_web_app || 'N/A',
    cesPercentage: formatPercent(c.ces_percentage),
    churnDate: formatDate(c.churn_date),
    churnReason: c.churn_reason || '-',
    churnComment: c.churn_comment || '-',
    domain: c.domain || '-',
    createdBy: c.created_by?.name ?? 'System',
    modifiedBy: c.modified_by?.name ?? 'System',
    nameAddress: c.address || '-',
    mrr: Math.round(arr / 12),
    arr,
  };
}
