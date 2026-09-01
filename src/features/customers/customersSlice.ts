import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { User } from '../auth/authSlice';

// Mirrors revenact-backend's CustomerSerializer field-for-field — see
// revenact-backend/docs/API_CONTRACTS.md -> customers. One of a *tenant's*
// own customers (not to be confused with `Organisation`, the tenant
// itself). DRF's DecimalField serializes as a string by default (e.g.
// health_score: "9.3") — only FloatField/IntegerField come back as JSON
// numbers, which is why the types below are a mix of `string` and `number`.
export interface Customer {
  id: number;
  name: string;
  address: string;
  domain: string;
  owner: User | null;
  created_by: User | null;
  modified_by: User | null;
  created_at: string;
  updated_at: string;
  lifecycle_stage:
    | 'onboarding'
    | 'kickoff'
    | 'adoption'
    | 'live'
    | 'renewal'
    | 'churn'
    | 'expansion'
    | 'other';
  health_score: string;
  health_category: 'good' | 'average' | 'poor';
  pulse: number[];
  ai_pulse_score: 'very_satisfied' | 'satisfied' | 'moderate' | 'high_risk' | '';
  ai_pulse_reason: string;
  nps_score: number | null;
  csat_score: string | null;
  joined_date: string | null;
  renewal_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  arr_billed_at_account: string;
  arr_billed_at_hq: string;
  implementation_fee: string;
  total_contract_value: string;
  total_forecasted_renewal_revenue: string;
  primary_product: string;
  additional_products_count: number | null;
  top_source_channel: string;
  total_contracted_seats: number | null;
  total_active_seats: number | null;
  seat_utilization_percentage: number | null;
  total_hires: number | null;
  scope_web_app: string;
  ces_percentage: string | null;
  churn_date: string | null;
  churn_reason: string;
  churn_comment: string;
  is_archived: boolean;
}

// The subset of Customer fields the Add/Edit forms actually expose —
// identity, ownership, lifecycle stage, and contract dates. Deliberately
// excludes financials, product usage, and NPS/CSAT/health: per the
// product decision behind this form, those are meant to eventually sync
// from other systems (billing, usage tracking, surveys) rather than be
// hand-typed when an organisation is added or edited. Also covers the
// Churn action's own fields (churn_date/reason/comment) and is_archived
// (Archive/unarchive) — both PATCH through the same updateCustomer thunk
// as a normal edit, just with a different field subset.
export interface CustomerWritePayload {
  name?: string;
  domain?: string;
  address?: string;
  owner_id?: number | null;
  lifecycle_stage?: Customer['lifecycle_stage'];
  joined_date?: string | null;
  renewal_date?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  churn_date?: string | null;
  churn_reason?: string;
  churn_comment?: string;
  is_archived?: boolean;
}

interface CustomersPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

interface StatsBucket {
  count: number;
  /** Derived (arr / 12) server-side — there's no stored MRR field. */
  mrr: number;
  arr: number;
}

// Mirrors revenact-backend's CustomerStatsView response exactly — see
// docs/API_CONTRACTS.md -> GET /api/v1/customers/stats/.
export interface CustomerStats {
  health: Record<Customer['health_category'], StatsBucket>;
  nps: { promoters: number; passives: number; detractors: number; score: number };
  lifecycle: Record<Customer['lifecycle_stage'], StatsBucket>;
}

interface CustomersState {
  customers: Customer[];
  /** Count for the current (possibly search-filtered) fetch — drives the
   * table's "Showing X-Y of Z" pagination footer. */
  count: number;
  /** Count from the last *unfiltered* fetch — how many organisations are
   * onboarded overall, for MetricsPanel's "Number of Organizations" card.
   * Deliberately not just `count`, which would otherwise dip to a search's
   * result size while the user is filtering the table. */
  totalCount: number;
  next: string | null;
  previous: string | null;
  isLoading: boolean;
  error: string | null;
  /** Customers due for renewal within the window last asked for via
   * fetchUpcomingRenewals — a separate list from `customers` so opening
   * the Renewal popover never clobbers whatever the main table is
   * currently showing (which may itself be search-filtered). */
  renewals: Customer[];
  renewalsCount: number;
  renewalsLoading: boolean;
  renewalsError: string | null;
  /** MetricsPanel's Health/NPS/Lifecycle Stages sections — null until the
   * first fetch resolves. */
  stats: CustomerStats | null;
  statsLoading: boolean;
  statsError: string | null;
}

const initialState: CustomersState = {
  customers: [],
  count: 0,
  totalCount: 0,
  next: null,
  previous: null,
  isLoading: false,
  error: null,
  renewals: [],
  renewalsCount: 0,
  renewalsLoading: false,
  renewalsError: null,
  stats: null,
  statsLoading: false,
  statsError: null,
};

// `url`, when given, is one of DRF's own (already-absolute) `next`/
// `previous` links — paging forward/back re-fetches through those instead
// of re-deriving query params here. Omit it for the first page.
export const fetchCustomers = createAsyncThunk<CustomersPage, string | void, { rejectValue: string }>(
  'customers/fetchCustomers',
  async (url, { rejectWithValue }) => {
    try {
      return await apiFetch<CustomersPage>(url || '/customers/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load organizations.';
      return rejectWithValue(message);
    }
  }
);

// `days` becomes `?renewal_within=<days>` — see revenact-backend's
// customers/views.py for the exact window semantics (includes already-
// overdue renewals, not just upcoming ones).
export const fetchUpcomingRenewals = createAsyncThunk<CustomersPage, number, { rejectValue: string }>(
  'customers/fetchUpcomingRenewals',
  async (days, { rejectWithValue }) => {
    try {
      return await apiFetch<CustomersPage>(`/customers/?renewal_within=${days}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load upcoming renewals.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCustomerStats = createAsyncThunk<CustomerStats, void, { rejectValue: string }>(
  'customers/fetchCustomerStats',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<CustomerStats>('/customers/stats/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load stats.';
      return rejectWithValue(message);
    }
  }
);

// `name` is the only field the backend requires — everything else in
// CustomerWritePayload is optional, matching the quick-add form.
export const createCustomer = createAsyncThunk<
  Customer,
  CustomerWritePayload & { name: string },
  { rejectValue: string }
>('customers/createCustomer', async (data, { rejectWithValue }) => {
  try {
    return await apiFetch<Customer>('/customers/', { method: 'POST', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not add organization.';
    return rejectWithValue(message);
  }
});

// Backs Edit, Churn, and Archive/Unarchive alike — each just sends a
// different subset of CustomerWritePayload as a partial update.
export const updateCustomer = createAsyncThunk<
  Customer,
  { id: number } & CustomerWritePayload,
  { rejectValue: string }
>('customers/updateCustomer', async ({ id, ...data }, { rejectWithValue }) => {
  try {
    return await apiFetch<Customer>(`/customers/${id}/`, { method: 'PATCH', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not update organization.';
    return rejectWithValue(message);
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload.results;
        state.count = action.payload.count;
        state.next = action.payload.next;
        state.previous = action.payload.previous;
        // `action.meta.arg` is the exact URL this fetch was dispatched
        // with. A search-filtered fetch (this one, or a next/previous page
        // reached while a search is active — DRF's pagination links carry
        // existing query params through) still has `search=` in it; only a
        // plain listing fetch updates the "onboarded overall" total.
        const url = action.meta.arg;
        if (!url || !url.includes('search=')) {
          state.totalCount = action.payload.count;
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Something went wrong.';
      })
      .addCase(fetchUpcomingRenewals.pending, (state) => {
        state.renewalsLoading = true;
        state.renewalsError = null;
      })
      .addCase(fetchUpcomingRenewals.fulfilled, (state, action) => {
        state.renewalsLoading = false;
        state.renewals = action.payload.results;
        state.renewalsCount = action.payload.count;
      })
      .addCase(fetchUpcomingRenewals.rejected, (state, action) => {
        state.renewalsLoading = false;
        state.renewalsError = action.payload ?? 'Something went wrong.';
      })
      .addCase(fetchCustomerStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCustomerStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload ?? 'Something went wrong.';
      })
      // createCustomer/updateCustomer's own rejections are shown inline in
      // their modal forms instead (same pattern as userManagementSlice's
      // addCSM/updateCSM) — no .rejected case needed here.
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.unshift(action.payload);
        state.count += 1;
        state.totalCount += 1;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated.is_archived) {
          // Archived — soft-hidden from the list, same as the backend
          // does for GET /customers/. Drop it locally too rather than
          // leaving a stale, now-archived row visible until next fetch.
          const wasPresent = state.customers.some((c) => c.id === updated.id);
          state.customers = state.customers.filter((c) => c.id !== updated.id);
          if (wasPresent) {
            state.count = Math.max(0, state.count - 1);
            state.totalCount = Math.max(0, state.totalCount - 1);
          }
        } else {
          const index = state.customers.findIndex((c) => c.id === updated.id);
          if (index !== -1) state.customers[index] = updated;
        }
      });
  },
});

export default customersSlice.reducer;
