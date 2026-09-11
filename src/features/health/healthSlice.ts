import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import { toHealthDataRows } from './toHealthDataRow';
import type { CustomerHealthApiResponse } from './toHealthDataRow';
import type { HealthDataRow } from './types';

/**
 * The Health Overview dashboard's own state.
 *
 * One fetch serves all four tabs — Triage, Divergence, Movement and Controls
 * read the same book differently rather than needing different data, so a
 * fetch per tab would pull the same rows four times. The thunk-per-fetch shape
 * follows customersSlice.ts.
 */

interface HealthState {
  rows: HealthDataRow[];
  isLoading: boolean;
  error: string | null;
  /** How many months of history the server actually returned. */
  historyMonths: number;
  /** True when the book was larger than the endpoint's cap. The tabs say so
   *  rather than charting a partial book as though it were the whole one. */
  truncated: boolean;
  /** Null until the first successful load. */
  loadedAt: string | null;
}

const initialState: HealthState = {
  rows: [],
  isLoading: false,
  error: null,
  historyMonths: 0,
  truncated: false,
  loadedAt: null,
};

interface HealthPayload {
  rows: HealthDataRow[];
  historyMonths: number;
  truncated: boolean;
}

export const fetchHealthOverview = createAsyncThunk<
  HealthPayload,
  { historyMonths?: number } | void,
  { rejectValue: string }
>('health/fetchHealthOverview', async (options, { rejectWithValue }) => {
  const months = options && 'historyMonths' in options ? options.historyMonths : undefined;
  const query = months ? `?history_months=${months}` : '';
  try {
    const data = await apiFetch<CustomerHealthApiResponse>(`/customers/health/${query}`);
    return {
      rows: toHealthDataRows(data.results),
      historyMonths: data.history_months,
      truncated: data.truncated,
    };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not load account health.';
    return rejectWithValue(message);
  }
});

export const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealthOverview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHealthOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rows = action.payload.rows;
        state.historyMonths = action.payload.historyMonths;
        state.truncated = action.payload.truncated;
        state.loadedAt = new Date().toISOString();
      })
      .addCase(fetchHealthOverview.rejected, (state, action) => {
        state.isLoading = false;
        // Previously loaded rows are kept: a failed refresh shouldn't blank a
        // dashboard the user is reading.
        state.error = action.payload ?? 'Could not load account health.';
      });
  },
});

export default healthSlice.reducer;
