import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { UserFunction } from '../auth/authSlice';

// Mirrors revenact-backend's services/knowledge — see docs/API_CONTRACTS.md
// -> knowledge. What the whole company knows about a customer, and who
// answers for it in each function. Company-wide: any member reads and
// writes, whatever their book.

export interface Contribution {
  id: number;
  customer_id: number;
  customer_name: string;
  author: { id: number; name: string };
  function: UserFunction;
  function_display: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Responsible {
  function: UserFunction;
  function_display: string;
  user: { id: number; name: string } | null;
}

interface KnowledgeState {
  /** Keyed by customer id. */
  contributions: Record<number, Contribution[]>;
  responsible: Record<number, Responsible[]>;
  isLoading: boolean;
  error: string | null;
  saveError: string | null;
}

const initialState: KnowledgeState = { contributions: {}, responsible: {}, isLoading: false, error: null, saveError: null };
const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export const fetchContributions = createAsyncThunk<
  { customerId: number; rows: Contribution[] },
  number,
  { rejectValue: string }
>('knowledge/fetchContributions', async (customerId, { rejectWithValue }) => {
  try {
    return { customerId, rows: await apiFetch<Contribution[]>(`/customers/${customerId}/contributions/`) };
  } catch (err) {
    return rejectWithValue(message(err, 'Could not load what the company knows.'));
  }
});

export const addContribution = createAsyncThunk<
  Contribution,
  { customerId: number; body: string },
  { rejectValue: string }
>('knowledge/addContribution', async ({ customerId, body }, { rejectWithValue }) => {
  try {
    return await apiFetch<Contribution>(`/customers/${customerId}/contributions/`, { method: 'POST', body: { body } });
  } catch (err) {
    return rejectWithValue(message(err, 'Could not save that.'));
  }
});

export const deleteContribution = createAsyncThunk<
  { customerId: number; id: number },
  { customerId: number; id: number },
  { rejectValue: string }
>('knowledge/deleteContribution', async (args, { rejectWithValue }) => {
  try {
    await apiFetch<void>(`/contributions/${args.id}/`, { method: 'DELETE' });
    return args;
  } catch (err) {
    return rejectWithValue(message(err, 'Could not remove that.'));
  }
});

export const fetchResponsible = createAsyncThunk<
  { customerId: number; rows: Responsible[] },
  number,
  { rejectValue: string }
>('knowledge/fetchResponsible', async (customerId, { rejectWithValue }) => {
  try {
    const data = await apiFetch<{ responsible: Responsible[] }>(`/customers/${customerId}/responsible/`);
    return { customerId, rows: data.responsible };
  } catch (err) {
    return rejectWithValue(message(err, 'Could not load who is responsible.'));
  }
});

export const setResponsible = createAsyncThunk<
  { customerId: number; rows: Responsible[] },
  { customerId: number; function: UserFunction; user_id: number | null },
  { rejectValue: string }
>('knowledge/setResponsible', async ({ customerId, ...body }, { rejectWithValue }) => {
  try {
    const data = await apiFetch<{ responsible: Responsible[] }>(`/customers/${customerId}/responsible/`, { method: 'PATCH', body });
    return { customerId, rows: data.responsible };
  } catch (err) {
    return rejectWithValue(message(err, 'Could not change who is responsible.'));
  }
});

const knowledgeSlice = createSlice({
  name: 'knowledge',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContributions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContributions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contributions[action.payload.customerId] = action.payload.rows;
      })
      .addCase(fetchContributions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load what the company knows.';
      })
      .addCase(addContribution.pending, (state) => {
        state.saveError = null;
      })
      .addCase(addContribution.fulfilled, (state, action) => {
        const rows = state.contributions[action.payload.customer_id] ?? [];
        state.contributions[action.payload.customer_id] = [action.payload, ...rows];
      })
      .addCase(addContribution.rejected, (state, action) => {
        state.saveError = action.payload ?? 'Could not save that.';
      })
      .addCase(deleteContribution.fulfilled, (state, action) => {
        const rows = state.contributions[action.payload.customerId] ?? [];
        state.contributions[action.payload.customerId] = rows.filter((c) => c.id !== action.payload.id);
      })
      .addCase(deleteContribution.rejected, (state, action) => {
        state.saveError = action.payload ?? 'Could not remove that.';
      })
      .addCase(fetchResponsible.fulfilled, (state, action) => {
        state.responsible[action.payload.customerId] = action.payload.rows;
      })
      .addCase(fetchResponsible.rejected, (state, action) => {
        state.error = action.payload ?? 'Could not load who is responsible.';
      })
      .addCase(setResponsible.pending, (state) => {
        state.saveError = null;
      })
      .addCase(setResponsible.fulfilled, (state, action) => {
        state.responsible[action.payload.customerId] = action.payload.rows;
      })
      .addCase(setResponsible.rejected, (state, action) => {
        state.saveError = action.payload ?? 'Could not change who is responsible.';
      });
  },
});

export default knowledgeSlice.reducer;
