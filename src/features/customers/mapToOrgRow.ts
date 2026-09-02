import type { Customer } from './customersSlice';
import type { OrgRow } from '../../components/organizations/tableData';
import {
  formatDate,
  formatMoney,
  formatPercent,
  initials,
  HEALTH_COLORS,
  LIFECYCLE_LABELS,
  AI_PULSE_LABELS,
  npsColor,
  csatColor,
} from './formatters';

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
    bg: c.owner ? 'bg-info' : 'bg-line-strong',
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
    csatColor: csat === null ? 'bg-line-strong' : csatColor(csat),
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
