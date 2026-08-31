import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';

// --- Types ---
// Shaped to match revenact-backend's UserSerializer — see
// revenact-backend/docs/API_CONTRACTS.md.
interface Organisation {
  id: number;
  name: string;
  slug: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  role: 'admin' | 'csm';
  organisation: Organisation;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Raw shape returned by the backend's /login/ and /signup/ endpoints.
interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

// --- Hydrate from localStorage ---
function loadPersistedState(): Partial<AuthState> {
  try {
    const accessToken = localStorage.getItem('revenact_access_token');
    const refreshToken = localStorage.getItem('revenact_refresh_token');
    const userJson = localStorage.getItem('revenact_user');
    if (accessToken && refreshToken && userJson) {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userJson),
        isAuthenticated: true,
      };
    }
  } catch {
    // Corrupted localStorage — ignore
  }
  return {};
}

function persistAuth(payload: LoginPayload) {
  localStorage.setItem('revenact_access_token', payload.accessToken);
  localStorage.setItem('revenact_refresh_token', payload.refreshToken);
  localStorage.setItem('revenact_user', JSON.stringify(payload.user));
}

function clearPersistedAuth() {
  localStorage.removeItem('revenact_access_token');
  localStorage.removeItem('revenact_refresh_token');
  localStorage.removeItem('revenact_user');
}

// --- Initial state ---
const persisted = loadPersistedState();
const initialState: AuthState = {
  user: persisted.user ?? null,
  accessToken: persisted.accessToken ?? null,
  refreshToken: persisted.refreshToken ?? null,
  isAuthenticated: persisted.isAuthenticated ?? false,
  isLoading: false,
  error: null,
};

// --- Async thunks ---
export const login = createAsyncThunk<LoginPayload, { email: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await apiFetch<AuthResponse>('/auth/login/', {
        method: 'POST',
        body: { email, password },
      });
      return { user: data.user, accessToken: data.access, refreshToken: data.refresh };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// Best-effort server-side logout: blacklists the refresh token via
// revenact-backend's /auth/logout/ so it can't be used again, but the user
// is logged out client-side (loggedOut, below) regardless of whether this
// call succeeds — a dead network shouldn't trap someone in a logged-in UI.
export const logout = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  'auth/logout',
  async (_, { getState, dispatch }) => {
    const { accessToken, refreshToken } = getState().auth;
    dispatch(authSlice.actions.loggedOut());
    if (refreshToken) {
      try {
        await apiFetch('/auth/logout/', { method: 'POST', body: { refresh: refreshToken }, accessToken });
      } catch {
        // Refresh token may already be expired/blacklisted, or the server
        // is unreachable — the user is logged out client-side either way.
      }
    }
  }
);

export const refreshSession = createAsyncThunk<{ accessToken: string }, void, { rejectValue: string }>(
  'auth/refreshSession',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.refreshToken) {
      return rejectWithValue('No refresh token available');
    }
    try {
      const data = await apiFetch<{ access: string }>('/auth/token/refresh/', {
        method: 'POST',
        body: { refresh: state.auth.refreshToken },
      });
      return { accessToken: data.access };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Session refresh failed.';
      return rejectWithValue(message);
    }
  }
);

// --- Slice ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Internal — dispatched by the `logout` thunk above. Not exported: call
    // `logout()` instead so the server-side token blacklist call happens too.
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      clearPersistedAuth();
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<LoginPayload>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        persistAuth(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'An unexpected error occurred';
      })
      // Refresh session
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('revenact_access_token', action.payload.accessToken);
      })
      .addCase(refreshSession.rejected, (state) => {
        // Refresh failed — force logout
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        clearPersistedAuth();
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
