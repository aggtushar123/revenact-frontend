import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

// --- Types ---
interface User {
  email: string;
  name: string;
  avatar: string;
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

// --- Dummy credentials database ---
const DUMMY_USERS: Record<string, { password: string; user: User }> = {
  'admin@velaris.io': {
    password: 'password123',
    user: {
      email: 'admin@velaris.io',
      name: 'Daniel Trial Test',
      avatar: 'https://i.pravatar.cc/150?u=daniel',
    },
  },
  'demo@velaris.io': {
    password: 'demo1234',
    user: {
      email: 'demo@velaris.io',
      name: 'Demo User',
      avatar: 'https://i.pravatar.cc/150?u=demo',
    },
  },
};

// --- Dummy token generator ---
function generateDummyToken(prefix: string): string {
  const payload = btoa(JSON.stringify({ iat: Date.now(), exp: Date.now() + 3600000 }));
  const random = btoa(Math.random().toString(36).substring(2, 15));
  return `${prefix}.${payload}.${random}`;
}

// --- Hydrate from localStorage ---
function loadPersistedState(): Partial<AuthState> {
  try {
    const accessToken = localStorage.getItem('velaris_access_token');
    const refreshToken = localStorage.getItem('velaris_refresh_token');
    const userJson = localStorage.getItem('velaris_user');
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
  localStorage.setItem('velaris_access_token', payload.accessToken);
  localStorage.setItem('velaris_refresh_token', payload.refreshToken);
  localStorage.setItem('velaris_user', JSON.stringify(payload.user));
}

function clearPersistedAuth() {
  localStorage.removeItem('velaris_access_token');
  localStorage.removeItem('velaris_refresh_token');
  localStorage.removeItem('velaris_user');
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
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const entry = DUMMY_USERS[email.toLowerCase()];
    if (!entry || entry.password !== password) {
      return rejectWithValue('Invalid email or password. Please try again.');
    }

    return {
      user: entry.user,
      accessToken: generateDummyToken('access'),
      refreshToken: generateDummyToken('refresh'),
    };
  }
);

export const refreshSession = createAsyncThunk<{ accessToken: string }, void, { rejectValue: string }>(
  'auth/refreshSession',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.refreshToken) {
      return rejectWithValue('No refresh token available');
    }
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { accessToken: generateDummyToken('access') };
  }
);

// --- Slice ---
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
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
        localStorage.setItem('velaris_access_token', action.payload.accessToken);
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

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
