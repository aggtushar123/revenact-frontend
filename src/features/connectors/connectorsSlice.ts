import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';

// Mirrors revenact-backend's services/connectors — see docs/API_CONTRACTS.md
// -> connectors. A connector records that the organisation uses a system
// and which companies it covers, so records already here can say where
// they came from. It is not a live sync (the model's own docstring).

export type Provider =
  | 'zendesk' | 'jira' | 'intercom' | 'salesforce' | 'hubspot' | 'slack'
  | 'gmail' | 'ms_teams' | 'zoom' | 'github' | 'figma';

export interface Connector {
  id: number;
  provider: Provider;
  provider_display: string;
  name: string;
  is_enabled: boolean;
  customers: { id: number; name: string }[];
  accounts: { id: number; name: string }[];
  is_organisation_wide: boolean;
  /** Records already attributed to this connector. */
  ticket_count: number;
  call_count: number;
  /** ISO date of the newest attributed record, or null. */
  last_record_at: string | null;
  created_at: string;
}

interface ConnectorsState {
  items: Connector[];
  isLoading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
}

const initialState: ConnectorsState = { items: [], isLoading: false, error: null, saving: false, saveError: null };

const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export const fetchConnectors = createAsyncThunk<Connector[], void, { rejectValue: string }>(
  'connectors/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<Connector[]>('/connectors/');
    } catch (err) {
      return rejectWithValue(message(err, 'Could not load the connectors.'));
    }
  }
);

export const createConnector = createAsyncThunk<
  Connector,
  { provider: Provider; name: string },
  { rejectValue: string }
>('connectors/create', async (body, { rejectWithValue }) => {
  try {
    return await apiFetch<Connector>('/connectors/', { method: 'POST', body });
  } catch (err) {
    return rejectWithValue(message(err, 'Could not connect that system.'));
  }
});

export const updateConnector = createAsyncThunk<
  Connector,
  { id: number; is_enabled: boolean },
  { rejectValue: string }
>('connectors/update', async ({ id, ...body }, { rejectWithValue }) => {
  try {
    return await apiFetch<Connector>(`/connectors/${id}/`, { method: 'PATCH', body });
  } catch (err) {
    return rejectWithValue(message(err, 'Could not update that connector.'));
  }
});

const connectorsSlice = createSlice({
  name: 'connectors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConnectors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConnectors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchConnectors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the connectors.';
      })
      .addCase(createConnector.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(createConnector.fulfilled, (state, action) => {
        state.saving = false;
        state.items.push(action.payload);
      })
      .addCase(createConnector.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload ?? 'Could not connect that system.';
      })
      .addCase(updateConnector.pending, (state) => {
        state.saveError = null;
      })
      .addCase(updateConnector.fulfilled, (state, action) => {
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(updateConnector.rejected, (state, action) => {
        state.saveError = action.payload ?? 'Could not update that connector.';
      });
  },
});

export default connectorsSlice.reducer;
