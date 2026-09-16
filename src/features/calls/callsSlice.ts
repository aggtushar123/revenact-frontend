import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { Attachment, FileParent } from '../files/filesSlice';

// CallSense on an organisation or account — see revenact-backend
// docs/API_CONTRACTS.md -> Calls. A call is logged with a summary, or with
// a transcript the model summarises; either way it is classified for
// sentiment so the Account Pulse counts it.

export type Sentiment = 'positive' | 'neutral' | 'negative' | '';

export interface Call {
  id: number;
  title: string;
  host_name: string;
  occurred_at: string;
  duration_minutes: number | null;
  summary: string;
  sentiment: Sentiment;
  ai_area: string;
  ai_category: string;
  recording_url: string;
  connector_name: string | null;
  connector_provider: string | null;
  logged_by: { id: number; name: string } | null;
  transcript: Attachment | null;
  /** Who from the customer's side was on it; the call's sentiment is theirs. */
  participants: { id: number; name: string; role_display: string; sentiment: string }[];
  links: number;
  created_at: string;
}

export interface LogCallInput {
  title: string;
  host_name?: string;
  occurred_at: string;
  duration_minutes?: number | null;
  summary?: string;
  recording_url?: string;
  transcript_text?: string;
  transcriptFile?: File | null;
  participant_ids?: number[];
}

export function callsPath({ entityType, customerId, accountId }: FileParent): string {
  return entityType === 'organization'
    ? `/customers/${customerId}/calls/`
    : `/customers/${customerId}/accounts/${accountId}/calls/`;
}

interface CallsState {
  items: Call[];
  isLoading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: CallsState = { items: [], isLoading: false, error: null, saving: false, saveError: null };

const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export const fetchCalls = createAsyncThunk<Call[], FileParent, { rejectValue: string }>(
  'calls/fetch',
  async (parent, { rejectWithValue }) => {
    try {
      return await apiFetch<Call[]>(callsPath(parent));
    } catch (err) {
      return rejectWithValue(message(err, 'Could not load the calls.'));
    }
  }
);

export const logCall = createAsyncThunk<Call, FileParent & { input: LogCallInput }, { rejectValue: string }>(
  'calls/log',
  async ({ input, ...parent }, { rejectWithValue }) => {
    try {
      const { transcriptFile, ...fields } = input;
      if (transcriptFile) {
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          if (Array.isArray(value)) value.forEach((v) => formData.append(key, String(v)));
          else if (value !== undefined && value !== null && value !== '') formData.append(key, String(value));
        });
        formData.append('transcript', transcriptFile, transcriptFile.name);
        return await apiFetch<Call>(callsPath(parent), { method: 'POST', formData });
      }
      return await apiFetch<Call>(callsPath(parent), { method: 'POST', body: fields });
    } catch (err) {
      return rejectWithValue(message(err, 'Could not log that call.'));
    }
  }
);

const callsSlice = createSlice({
  name: 'calls',
  initialState,
  reducers: {
    clearCalls(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalls.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCalls.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCalls.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the calls.';
      })
      .addCase(logCall.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(logCall.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
      })
      .addCase(logCall.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload ?? 'Could not log that call.';
      });
  },
});

export const { clearCalls } = callsSlice.actions;
export default callsSlice.reducer;
