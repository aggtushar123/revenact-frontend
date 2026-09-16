import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { Email } from '../customers/customersSlice';

// A person's own connected mailbox — see revenact-backend services/mail.
// Credentials never come to the browser; the OAuth dance goes through the
// backend, which bounces back to /integrations?mailbox=connected|error.

export type MailProviderKey = 'google' | 'microsoft' | 'imap';

export interface MailProviderOption {
  key: MailProviderKey;
  label: string;
  uses_oauth: boolean;
}

export interface MailboxConnection {
  id: number;
  provider: MailProviderKey;
  provider_display: string;
  address: string;
  display_name: string;
  status: 'connected' | 'error';
  error: string;
  last_synced_at: string | null;
  created_at: string;
}

export interface ImapForm {
  address: string;
  password: string;
  imap_host: string;
  imap_port?: number;
  smtp_host: string;
  smtp_port?: number;
  username?: string;
  display_name?: string;
}

interface MailState {
  connection: MailboxConnection | null;
  providers: MailProviderOption[];
  loaded: boolean;
  saving: boolean;
  error: string | null;
  sending: boolean;
  sendError: string | null;
}

const initialState: MailState = {
  connection: null,
  providers: [],
  loaded: false,
  saving: false,
  error: null,
  sending: false,
  sendError: null,
};

function message(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export const fetchMailbox = createAsyncThunk<
  { connection: MailboxConnection | null; providers: MailProviderOption[] },
  void,
  { rejectValue: string }
>('mail/fetchMailbox', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch('/mail/connection/');
  } catch (err) {
    return rejectWithValue(message(err, 'Could not load your mailbox.'));
  }
});

/** For an OAuth provider: where to send the browser. */
export const startOAuth = createAsyncThunk<{ authorize_url: string }, MailProviderKey, { rejectValue: string }>(
  'mail/startOAuth',
  async (provider, { rejectWithValue }) => {
    try {
      return await apiFetch(`/mail/connect/${provider}/`, { method: 'POST', body: {} });
    } catch (err) {
      return rejectWithValue(message(err, 'Could not start the connection.'));
    }
  },
);

export const connectImap = createAsyncThunk<MailboxConnection, ImapForm, { rejectValue: string }>(
  'mail/connectImap',
  async (form, { rejectWithValue }) => {
    try {
      return await apiFetch('/mail/connect/imap/', { method: 'POST', body: form });
    } catch (err) {
      return rejectWithValue(message(err, 'Could not connect the mailbox.'));
    }
  },
);

export const disconnectMailbox = createAsyncThunk<void, void, { rejectValue: string }>(
  'mail/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      await apiFetch('/mail/connection/', { method: 'DELETE' });
    } catch (err) {
      return rejectWithValue(message(err, 'Could not disconnect.'));
    }
  },
);

export const syncMailbox = createAsyncThunk<MailboxConnection & { filed: number }, void, { rejectValue: string }>(
  'mail/sync',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch('/mail/sync/', { method: 'POST', body: {} });
    } catch (err) {
      return rejectWithValue(message(err, 'Sync failed.'));
    }
  },
);

export const sendEmail = createAsyncThunk<
  Email,
  { customerId: number; accountId?: number; to: string[]; subject: string; body: string },
  { rejectValue: string }
>('mail/send', async ({ customerId, accountId, ...body }, { rejectWithValue }) => {
  const path = accountId
    ? `/customers/${customerId}/accounts/${accountId}/emails/send/`
    : `/customers/${customerId}/emails/send/`;
  try {
    return await apiFetch<Email>(path, { method: 'POST', body });
  } catch (err) {
    return rejectWithValue(message(err, 'Could not send the email.'));
  }
});

const mailSlice = createSlice({
  name: 'mail',
  initialState,
  reducers: {
    clearSendError(state) {
      state.sendError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMailbox.fulfilled, (state, action) => {
        state.connection = action.payload?.connection ?? null;
        state.providers = Array.isArray(action.payload?.providers) ? action.payload.providers : [];
        state.loaded = true;
        state.error = null;
      })
      .addCase(fetchMailbox.rejected, (state, action) => {
        state.loaded = true;
        state.error = action.payload ?? 'Could not load your mailbox.';
      })
      .addCase(connectImap.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(connectImap.fulfilled, (state, action) => {
        state.saving = false;
        state.connection = action.payload;
      })
      .addCase(connectImap.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Could not connect the mailbox.';
      })
      .addCase(startOAuth.rejected, (state, action) => {
        state.error = action.payload ?? 'Could not start the connection.';
      })
      .addCase(disconnectMailbox.fulfilled, (state) => {
        state.connection = null;
      })
      .addCase(syncMailbox.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(syncMailbox.fulfilled, (state, action) => {
        state.saving = false;
        const connection: MailboxConnection & { filed?: number } = { ...action.payload };
        delete connection.filed;
        state.connection = connection;
      })
      .addCase(syncMailbox.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Sync failed.';
      })
      .addCase(sendEmail.pending, (state) => {
        state.sending = true;
        state.sendError = null;
      })
      .addCase(sendEmail.fulfilled, (state) => {
        state.sending = false;
      })
      .addCase(sendEmail.rejected, (state, action) => {
        state.sending = false;
        state.sendError = action.payload ?? 'Could not send the email.';
      });
  },
});

export const { clearSendError } = mailSlice.actions;
export default mailSlice.reducer;
