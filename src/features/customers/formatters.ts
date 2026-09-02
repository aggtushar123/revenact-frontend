// Shared display-formatting helpers for adapting real backend records
// (Customer, Account) into the mock-data-era row shapes the table/card
// components already render — see mapToOrgRow.ts and mapToAccountRow.ts.
// Split out here because both mappers need the exact same date/health/
// lifecycle/AI-pulse/NPS/CSAT formatting rules (an Account's health and
// lifecycle mean the same thing as a Customer's, just at a finer grain —
// see the backend's Account model docstring).

import type { Customer } from './customersSlice';
import type { LifecycleCategory } from '../../components/organizations/tableData';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Formats a "YYYY-MM-DD" date-only string without going through `Date`
// (which would apply the local timezone and can shift the day).
export function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatMoney(val: string | null | undefined): string {
  const n = Number(val ?? 0);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPercent(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return 'N/A';
  return `${parseFloat(String(val))}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return letters.toUpperCase() || '?';
}

export const HEALTH_COLORS: Record<Customer['health_category'], string> = {
  good: 'bg-[var(--success)]',
  average: 'bg-[var(--warning)]',
  poor: 'bg-[var(--danger)]',
};

export const LIFECYCLE_LABELS: Record<LifecycleCategory, string> = {
  onboarding: 'Onboarding',
  kickoff: 'Kickoff',
  adoption: 'Adoption',
  live: 'Live',
  renewal: 'Renewal',
  churn: 'Churn',
  expansion: 'Expansion',
  other: 'Other',
};

export const AI_PULSE_LABELS: Record<Customer['ai_pulse_score'], string> = {
  very_satisfied: 'Very Satisfied',
  satisfied: 'Satisfied',
  moderate: 'Moderate',
  high_risk: 'High Risk',
  '': '—',
};

// Matches the mock data's own implied rule: any positive score reads as
// healthy, zero is neutral, negative is a detractor signal.
export function npsColor(nps: number): string {
  if (nps > 0) return 'bg-[var(--success)]';
  if (nps === 0) return 'bg-[var(--warning)]';
  return 'bg-[var(--danger)]';
}

// Thresholds fitted to the mock data's own csat/ces color bands.
export function csatColor(pct: number): string {
  if (pct >= 70) return 'bg-[var(--success)]';
  if (pct >= 50) return 'bg-[var(--warning)]';
  return 'bg-[var(--danger)]';
}
