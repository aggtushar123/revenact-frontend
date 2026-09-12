import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { CurrencyCode } from '../auth/authSlice';

// Mirrors revenact-backend's MetricListView exactly — see docs/API_CONTRACTS.md
// -> metrics -> GET /api/v1/metrics/.
//
// The metric layer: every headline number defined once on the backend, read
// through the same rollups the dashboards draw, whole-organisation, with the
// last month-end beside it. Phase 1 of the company brain.

export type MetricUnit = 'money' | 'percent' | 'count';
/** Which direction is good news. 'none' is context, not a target. */
export type MetricDirection = 'up' | 'down' | 'none';

export interface Metric {
  key: string;
  label: string;
  unit: MetricUnit;
  better: MetricDirection;
  note: string;
  /** Null when unmeasured — an empty book has no NRR — never zero. */
  value: number | null;
  /** The most recent month-end snapshot, null before the first is recorded. */
  previous: { period_end: string; value: number | null } | null;
  /** Null whenever either side is unmeasured: "unknown" to 40 is not a rise of 40. */
  change: number | null;
}

export interface MetricsPayload {
  as_of: string;
  currency: CurrencyCode;
  metrics: Metric[];
}

interface MetricsState {
  data: MetricsPayload | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MetricsState = { data: null, isLoading: false, error: null };

export const fetchMetrics = createAsyncThunk<MetricsPayload, void, { rejectValue: string }>(
  'metrics/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<MetricsPayload>('/metrics/');
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load the metrics.');
    }
  }
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the metrics.';
      });
  },
});

export default metricsSlice.reducer;
