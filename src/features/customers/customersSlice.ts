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
}

interface CustomersPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

interface CustomersState {
  customers: Customer[];
  count: number;
  next: string | null;
  previous: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  count: 0,
  next: null,
  previous: null,
  isLoading: false,
  error: null,
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
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Something went wrong.';
      });
  },
});

export default customersSlice.reducer;
