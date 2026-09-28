import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch, apiFetchBlob, ApiError } from '../../lib/apiClient';

// The Files tab on an organisation or account — see revenact-backend
// docs/API_CONTRACTS.md -> Files. Anyone who may open the company may list
// and upload; the uploader or an admin may delete. The bytes never come
// through the store: downloads go straight to a Blob.

export interface Attachment {
  id: number;
  name: string;
  content_type: string;
  size: number;
  description: string;
  source: 'upload' | 'transcript';
  uploaded_by: { id: number; name: string } | null;
  download_url: string;
  created_at: string;
  /** The account it is on; null on the organization itself. The
   *  organization's list rolls up its visible accounts' files. */
  account_id?: number | null;
  account_name?: string | null;
}

export interface FileParent {
  entityType: 'organization' | 'account';
  customerId: number;
  accountId?: number;
}

export function filesPath({ entityType, customerId, accountId }: FileParent): string {
  return entityType === 'organization'
    ? `/customers/${customerId}/files/`
    : `/customers/${customerId}/accounts/${accountId}/files/`;
}

interface FilesState {
  items: Attachment[];
  isLoading: boolean;
  error: string | null;
  uploading: boolean;
  uploadError: string | null;
}

const initialState: FilesState = { items: [], isLoading: false, error: null, uploading: false, uploadError: null };

const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

export const fetchFiles = createAsyncThunk<Attachment[], FileParent, { rejectValue: string }>(
  'files/fetch',
  async (parent, { rejectWithValue }) => {
    try {
      return await apiFetch<Attachment[]>(filesPath(parent));
    } catch (err) {
      return rejectWithValue(message(err, 'Could not load the files.'));
    }
  }
);

export const uploadFile = createAsyncThunk<
  Attachment,
  FileParent & { file: File; description?: string },
  { rejectValue: string }
>('files/upload', async ({ file, description, ...parent }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (description) formData.append('description', description);
    return await apiFetch<Attachment>(filesPath(parent), { method: 'POST', formData });
  } catch (err) {
    return rejectWithValue(message(err, 'Could not upload that file.'));
  }
});

export const deleteFile = createAsyncThunk<number, number, { rejectValue: string }>(
  'files/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiFetch<void>(`/files/${id}/`, { method: 'DELETE' });
      return id;
    } catch (err) {
      return rejectWithValue(message(err, 'Could not delete that file.'));
    }
  }
);

/** Fetch the bytes with the session's token and hand them to the browser
 * as a download — the API never exposes a URL a plain link could open. */
export async function downloadAttachment(file: Pick<Attachment, 'download_url' | 'name'>): Promise<void> {
  const blob = await apiFetchBlob(file.download_url);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearFiles(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Could not load the files.';
      })
      .addCase(uploadFile.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.items.unshift(action.payload);
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload ?? 'Could not upload that file.';
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteFile.rejected, (state, action) => {
        state.uploadError = action.payload ?? 'Could not delete that file.';
      });
  },
});

export const { clearFiles } = filesSlice.actions;
export default filesSlice.reducer;
