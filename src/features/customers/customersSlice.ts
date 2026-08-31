import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { User } from '../auth/authSlice';

// Matches revenact-backend's CustomerSerializer — see
// revenact-backend/docs/API_CONTRACTS.md → `customers`. This is one of
// *our* customer's own customers (tracked for health/ARR/renewal) — not
// to be confused with the Organisation/tenant that owns the account we're
// logged into. See the `Organisation` type in authSlice.ts for that one.
export type HealthCategory = 'good' | 'average' | 'poor';
export type LifecycleStage =
  | 'onboarding'
  | 'kickoff'
  | 'adoption'
  | 'live'
  | 'renewal'
  | 'churn'
  | 'expansion'
  | 'other';

export interface Customer {
  id: number;
  name: string;
  health_score: number;
  health_category: HealthCategory;
  arr: string; // DRF serializes DecimalField as a string
  renewal_date: string | null;
  lifecycle_stage: LifecycleStage;
  owner: User | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse {
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

// `url` lets callers follow DRF's next/previous pagination links directly;
// omit it for the first page.
export const fetchCustomers = createAsyncThunk<PaginatedResponse, string | void, { rejectValue: string }>(
  'customers/fetchCustomers',
  async (url, { rejectWithValue }) => {
    try {
      return await apiFetch<PaginatedResponse>(url || '/customers/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load organizations.';
      return rejectWithValue(message);
    }
  }
);

// `name` is required to create a customer, but optional on update — a
// PATCH only needs to send the fields actually changing.
interface CustomerFields {
  name?: string;
  health_score?: number;
  arr?: string;
  renewal_date?: string | null;
  lifecycle_stage?: LifecycleStage;
  owner_id?: number | null;
}

type CustomerInput = CustomerFields & { name: string };

export const addCustomer = createAsyncThunk<Customer, CustomerInput, { rejectValue: string }>(
  'customers/addCustomer',
  async (data, { rejectWithValue }) => {
    try {
      return await apiFetch<Customer>('/customers/', { method: 'POST', body: data });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not add organization.';
      return rejectWithValue(message);
    }
  }
);

export const updateCustomer = createAsyncThunk<
  Customer,
  CustomerFields & { id: number },
  { rejectValue: string }
>('customers/updateCustomer', async ({ id, ...body }, { rejectWithValue }) => {
  try {
    return await apiFetch<Customer>(`/customers/${id}/`, { method: 'PATCH', body });
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
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Something went wrong.';
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
        state.customers.sort((a, b) => a.name.localeCompare(b.name));
        state.count += 1;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.customers[index] = action.payload;
      });
  },
});

export default customersSlice.reducer;
