// Mirrors revenact-backend's TaskListSerializer/CockpitSummaryView
// field-for-field — see docs/API_CONTRACTS.md -> customers -> Task /
// Cockpit summary.
import type { Task } from '../../features/customers/customersSlice';

// Extends the same real Task shape TasksTab.tsx already renders — this
// is the exact same customers.Task model, just from the one endpoint
// that spans every Customer/Account at once (GET /api/v1/tasks/),
// which needs to additionally say *which* company each row belongs to.
export interface CockpitTask extends Task {
  priority_display: string;
  status_display: string;
  parent_name: string;
  parent_type: 'customer' | 'account';
}

export interface CockpitHealthBreakdown {
  good: number;
  average: number;
  poor: number;
}

export interface CockpitBookSummary {
  count: number;
  value: number;
  health: CockpitHealthBreakdown;
  unconverted_count?: number;
}

export interface CockpitRenewalBucket {
  count: number;
  value: number;
}

export interface CockpitSummary {
  customers: CockpitBookSummary;
  accounts: CockpitBookSummary;
  renewals_next_30_days: {
    customers: CockpitRenewalBucket;
    accounts: CockpitRenewalBucket;
  };
}
