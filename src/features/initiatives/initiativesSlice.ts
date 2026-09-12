import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { MetricDirection, MetricUnit } from '../metrics/metricsSlice';

// Mirrors revenact-backend's InitiativeSerializer exactly — see
// docs/API_CONTRACTS.md -> metrics -> initiatives.
//
// A decision with a number attached: a metric from the registry (or one
// cut of it), a target, a date, an owner — judged live against the same
// registry the Brain overview reads.

export type InitiativeStatus = 'planned' | 'active' | 'done' | 'abandoned';

export interface InitiativeProgress {
  /** The starting line, captured when the decision was written. */
  baseline: number | null;
  /** The registry's value now. */
  current: number | null;
  target: number;
  /** Share of the way from baseline to target, 0–100; null when either end is unmeasured. */
  progress_pct: number | null;
  /** Negative once the target date has passed. */
  days_left: number;
  direction: 'up' | 'down';
  unit: MetricUnit | null;
  better: MetricDirection | null;
}

export interface Initiative {
  id: number;
  title: string;
  hypothesis: string;
  metric: string;
  metric_label: string;
  dimension: string;
  dimension_label: string;
  member: string;
  member_label: string;
  target_value: string;
  target_by: string;
  owner: { id: number; name: string } | null;
  status: InitiativeStatus;
  status_display: string;
  outcome: string;
  baseline_value: string | null;
  baseline_as_of: string;
  progress: InitiativeProgress;
  history: { period_end: string; value: number | null }[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface InitiativeWrite {
  title: string;
  hypothesis: string;
  metric: string;
  dimension: string;
  member: string;
  target_value: string;
  target_by: string;
  owner_id: number | null;
}

interface InitiativesState {
  items: Initiative[];
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  saveError: string | null;
}

const initialState: InitiativesState = {
  items: [],
  isLoading: false,
  error: null,
  isSaving: false,
  saveError: null,
};

const message = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

export const fetchInitiatives = createAsyncThunk<Initiative[], void, { rejectValue: string }>(
  'initiatives/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<Initiative[]>('/metrics/initiatives/');
    } catch (err) {
      return rejectWithValue(message(err, 'Could not load the initiatives.'));
    }
  }
);

export const createInitiative = createAsyncThunk<Initiative, InitiativeWrite, { rejectValue: string }>(
  'initiatives/create',
  async (body, { rejectWithValue }) => {
    try {
      return await apiFetch<Initiative>('/metrics/initiatives/', { method: 'POST', body });
    } catch (err) {
      return rejectWithValue(message(err, 'Could not save the initiative.'));
    }
  }
);

export const updateInitiative = createAsyncThunk<
  Initiative,
  { id: number; patch: Partial<Pick<Initiative, 'status' | 'outcome' | 'title' | 'hypothesis'>> },
  { rejectValue: string }
>('initiatives/update', async ({ id, patch }, { rejectWithValue }) => {
  try {
    return await apiFetch<Initiative>(`/metrics/initiatives/${id}/`, { method: 'PATCH', body: patch });
  } catch (err) {
    return rejectWithValue(message(err, 'Could not update the initiative.'));
  }
});

const initiativesSlice = createSlice({
  name: 'initiatives',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitiatives.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInitiatives.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchInitiatives.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the initiatives.';
      })
      .addCase(createInitiative.pending, (state) => {
        state.isSaving = true;
        state.saveError = null;
      })
      .addCase(createInitiative.fulfilled, (state, action) => {
        state.isSaving = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createInitiative.rejected, (state, action) => {
        state.isSaving = false;
        state.saveError = action.payload ?? 'Could not save the initiative.';
      })
      .addCase(updateInitiative.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })
      .addCase(updateInitiative.rejected, (state, action) => {
        state.saveError = action.payload ?? 'Could not update the initiative.';
      });
  },
});

export default initiativesSlice.reducer;
