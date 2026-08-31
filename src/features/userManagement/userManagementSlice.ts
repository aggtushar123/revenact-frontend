import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import type { User } from '../auth/authSlice';

// A CSM is just a User (role: 'csm') as seen by an org admin — same shape
// UserSerializer returns everywhere else. See revenact-backend's
// docs/API_CONTRACTS.md → GET/POST /api/v1/auth/csms/.
export type CSM = User;

interface UserManagementState {
  csms: CSM[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserManagementState = {
  csms: [],
  isLoading: false,
  error: null,
};

export const fetchCSMs = createAsyncThunk<CSM[], void, { rejectValue: string }>(
  'userManagement/fetchCSMs',
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiFetch<{ results: CSM[] }>('/auth/csms/');
      return data.results;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load team members.';
      return rejectWithValue(message);
    }
  }
);

export const addCSM = createAsyncThunk<
  CSM,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('userManagement/addCSM', async (data, { rejectWithValue }) => {
  try {
    return await apiFetch<CSM>('/auth/csms/', { method: 'POST', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not add team member.';
    return rejectWithValue(message);
  }
});

interface UpdateCSMArgs {
  id: number;
  name?: string;
  is_active?: boolean;
  password?: string;
}

export const updateCSM = createAsyncThunk<CSM, UpdateCSMArgs, { rejectValue: string }>(
  'userManagement/updateCSM',
  async ({ id, ...body }, { rejectWithValue }) => {
    try {
      return await apiFetch<CSM>(`/auth/csms/${id}/`, { method: 'PATCH', body });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update team member.';
      return rejectWithValue(message);
    }
  }
);

const userManagementSlice = createSlice({
  name: 'userManagement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCSMs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCSMs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.csms = action.payload;
      })
      .addCase(fetchCSMs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Something went wrong.';
      })
      .addCase(addCSM.fulfilled, (state, action) => {
        state.csms.push(action.payload);
        state.csms.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(updateCSM.fulfilled, (state, action) => {
        const index = state.csms.findIndex((csm) => csm.id === action.payload.id);
        if (index !== -1) state.csms[index] = action.payload;
      })
      // addCSM's own rejection is shown inline in its modal form instead
      // (it has the fields to react to); updateCSM's deactivate/reactivate
      // button has no form of its own, so its failure surfaces here.
      .addCase(updateCSM.rejected, (state, action) => {
        state.error = action.payload ?? 'Something went wrong.';
      });
  },
});

export default userManagementSlice.reducer;
