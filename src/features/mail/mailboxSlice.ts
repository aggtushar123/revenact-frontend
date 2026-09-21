import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';

/**
 * The person's own inbox on the Communications page.
 *
 * Mirrors `revenact-backend`'s `/api/v1/mail/messages/` family exactly (see
 * that repo's `docs/API_CONTRACTS.md`, "The person's own inbox"). Two fetches:
 * the list, which refetches on every control, and the summary (folder counts
 * and the Categories block), which refetches only when something changed.
 */

export type MailFolder = 'inbox' | 'drafts' | 'sent' | 'done' | 'muted' | 'spam' | 'trash' | 'starred' | 'important';
export type MailCategory = 'general' | 'financial' | 'newsletters' | 'notifications' | 'promotions' | 'social';
export type MailState = 'open' | 'done' | 'muted';

export interface MailAccount {
  id: number;
  name: string;
  type: 'customer' | 'account';
}

export interface MailMessage {
  id: number;
  thread_id: string;
  direction: 'sent' | 'received';
  from_name: string;
  from_address: string;
  to: [string, string][];
  subject: string;
  snippet: string;
  sent_at: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';
  category: MailCategory;
  state: MailState;
  is_read: boolean;
  is_starred: boolean;
  is_important: boolean;
  priority: boolean;
  account: MailAccount | null;
}

export interface MailMessageDetail extends MailMessage {
  body: string;
}

export interface MailPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: MailMessage[];
}

export interface MailCategoryBlock {
  category: MailCategory;
  label: string;
  count: number;
  subjects: string[];
  senders: string[];
  more_senders: number;
}

export interface MailSummary {
  has_mailbox: boolean;
  address: string;
  last_synced_at: string | null;
  folders: Record<'inbox' | 'drafts' | 'sent' | 'done' | 'muted', number>;
  unread: number;
  categories: MailCategoryBlock[];
}

export interface MailQuery {
  folder: MailFolder;
  category: MailCategory | null;
  unread: boolean;
  priority: boolean;
  search: string;
}

interface MailboxState extends MailQuery {
  page: MailPage | null;
  loading: boolean;
  error: string | null;
  summary: MailSummary | null;
  selectedId: number | null;
  detail: MailMessageDetail | null;
  detailLoading: boolean;
  replying: boolean;
  replyError: string | null;
  /** The id of the message whose reply just went out; the pane says so. */
  repliedId: number | null;
}

const initialState: MailboxState = {
  folder: 'inbox',
  category: null,
  unread: false,
  priority: false,
  search: '',
  page: null,
  loading: false,
  error: null,
  summary: null,
  selectedId: null,
  detail: null,
  detailLoading: false,
  replying: false,
  replyError: null,
  repliedId: null,
};

export function buildMailQuery({ folder, category, unread, priority, search }: MailQuery): string {
  const params = new URLSearchParams();
  if (folder !== 'inbox') params.set('folder', folder);
  if (category) params.set('category', category);
  if (unread) params.set('unread', 'true');
  if (priority) params.set('priority', 'true');
  if (search.trim()) params.set('q', search.trim());
  const query = params.toString();
  return query ? `/mail/messages/?${query}` : '/mail/messages/';
}

function reason(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

export const fetchMailMessages = createAsyncThunk<MailPage, MailQuery, { rejectValue: string }>(
  'mailbox/fetch',
  async (query, { rejectWithValue }) => {
    try {
      return await apiFetch<MailPage>(buildMailQuery(query));
    } catch (err) {
      return rejectWithValue(reason(err, 'Could not load your mail.'));
    }
  },
);

export const fetchMailSummary = createAsyncThunk<MailSummary, void, { rejectValue: string }>(
  'mailbox/summary',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<MailSummary>('/mail/messages/summary/');
    } catch (err) {
      return rejectWithValue(reason(err, 'Could not load your counts.'));
    }
  },
);

export const fetchMailMessage = createAsyncThunk<MailMessageDetail, number, { rejectValue: string }>(
  'mailbox/detail',
  async (id, { rejectWithValue }) => {
    try {
      return await apiFetch<MailMessageDetail>(`/mail/messages/${id}/`);
    } catch (err) {
      return rejectWithValue(reason(err, 'Could not open the message.'));
    }
  },
);

export const updateMailMessage = createAsyncThunk<
  MailMessageDetail,
  { id: number; patch: Partial<Pick<MailMessage, 'is_read' | 'is_starred' | 'state'>> },
  { rejectValue: string }
>('mailbox/update', async ({ id, patch }, { rejectWithValue }) => {
  try {
    return await apiFetch<MailMessageDetail>(`/mail/messages/${id}/`, { method: 'PATCH', body: patch });
  } catch (err) {
    return rejectWithValue(reason(err, 'Could not update the message.'));
  }
});

export const replyToMailMessage = createAsyncThunk<
  MailMessageDetail,
  { id: number; body: string },
  { rejectValue: string }
>('mailbox/reply', async ({ id, body }, { rejectWithValue }) => {
  try {
    return await apiFetch<MailMessageDetail>(`/mail/messages/${id}/reply/`, { method: 'POST', body: { body } });
  } catch (err) {
    return rejectWithValue(reason(err, 'Could not send the reply.'));
  }
});

const mailboxSlice = createSlice({
  name: 'mailbox',
  initialState,
  reducers: {
    setMailFolder(state, action: PayloadAction<MailFolder>) {
      state.folder = action.payload;
      state.selectedId = null;
      state.detail = null;
    },
    /** Picking the category already picked clears it, so the block both
     *  narrows and widens. */
    toggleMailCategory(state, action: PayloadAction<MailCategory>) {
      state.category = state.category === action.payload ? null : action.payload;
      state.selectedId = null;
      state.detail = null;
    },
    setMailUnread(state, action: PayloadAction<boolean>) {
      state.unread = action.payload;
      state.selectedId = null;
    },
    setMailPriority(state, action: PayloadAction<boolean>) {
      state.priority = action.payload;
      state.selectedId = null;
    },
    setMailSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.selectedId = null;
    },
    selectMailMessage(state, action: PayloadAction<number | null>) {
      state.selectedId = action.payload;
      if (action.payload === null) state.detail = null;
      state.replyError = null;
      state.repliedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMailMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMailMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.page = action.payload;
      })
      .addCase(fetchMailMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Could not load your mail.';
      })
      .addCase(fetchMailSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(fetchMailMessage.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchMailMessage.fulfilled, (state, action) => {
        state.detailLoading = false;
        if (state.selectedId === action.payload.id) state.detail = action.payload;
      })
      .addCase(fetchMailMessage.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload ?? 'Could not open the message.';
      })
      .addCase(updateMailMessage.fulfilled, (state, action) => {
        const updated = action.payload;
        if (state.detail?.id === updated.id) state.detail = updated;
        if (state.page) {
          state.page.results = state.page.results.map((row) => (row.id === updated.id ? { ...row, ...updated } : row));
        }
      })
      .addCase(replyToMailMessage.pending, (state) => {
        state.replying = true;
        state.replyError = null;
      })
      .addCase(replyToMailMessage.fulfilled, (state, action) => {
        state.replying = false;
        state.repliedId = action.meta.arg.id;
        if (state.detail?.id === action.meta.arg.id) state.detail.is_read = true;
      })
      .addCase(replyToMailMessage.rejected, (state, action) => {
        state.replying = false;
        state.replyError = action.payload ?? 'Could not send the reply.';
      });
  },
});

export const { setMailFolder, toggleMailCategory, setMailUnread, setMailPriority, setMailSearch, selectMailMessage } = mailboxSlice.actions;
export default mailboxSlice.reducer;
