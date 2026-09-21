import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiFetch, ApiError } from '../../lib/apiClient';
import { errorCodeOf } from './oauth';

// --- Types ---
// Shaped to match revenact-backend's UserSerializer — see
// revenact-backend/docs/API_CONTRACTS.md. Exported: userManagement uses
// the same shape for CSMs (they're the same User model, just listed by
// an admin instead of viewing themselves).
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'JPY';
export type AgentTone = 'professional' | 'friendly' | 'concise';

export interface Organisation {
  id: number;
  name: string;
  slug: string;
  currency: CurrencyCode;
  currency_display: string;
  /** One of Customer['lifecycle_stage']'s own values, or '' for no
   * tenant-wide default — see revenact-backend's Organisation model
   * docstring. Backs Settings > Global Presets. */
  default_lifecycle_stage: string;
  /** Backs Settings > AI Agent — real, but not yet consumed anywhere
   * (Copilot has no backend of its own). See the backend model's own
   * docstring. */
  ai_agent_enabled: boolean;
  ai_agent_tone: AgentTone;
  ai_agent_tone_display: string;
  /** Settings › Data's global configuration: which customer field stands
   * for each headline concept. Read as the stored mapping over the
   * backend's defaults; optional here only so older fixtures type-check. */
  global_attributes?: Record<GlobalAttributeKey, string>;
  global_attribute_choices?: Record<GlobalAttributeKey, string[]>;
}

export type GlobalAttributeKey = 'arr' | 'mrr' | 'renewal_date' | 'joined_date';

// The closed set the backend actually enforces — mirrors
// revenact-backend's services/accounts/capabilities.py. The role
// *editor* fetches labels from /auth/capabilities/ rather than
// hardcoding them, but gating code needs the keys at compile time.
export type Capability =
  | 'manage_users'
  | 'manage_org_settings'
  | 'manage_custom_objects'
  | 'manage_integrations'
  | 'manage_fx_rates'
  // Unlike the five above, this one gates no UI: every customer/account
  // page stays reachable and what changes is how many rows come back.
  // Nothing calls useCapability with it — it's here because the union
  // has to accept what /auth/me/ sends, and because the Roles tab
  // renders a checkbox per key.
  | 'view_all_accounts';

export type UserFunction = 'cs' | 'engineering' | 'sales' | 'analytics' | 'leadership' | 'other';
export const FUNCTION_LABELS: Record<UserFunction, string> = {
  cs: 'Customer Success',
  engineering: 'Engineering',
  sales: 'Sales',
  analytics: 'Analytics',
  leadership: 'Leadership',
  other: 'Other',
};

export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string;
  /** The role's slug. `'admin'`/`'csm'` are the two built-in ones every
   * organisation has, but an org can define any number of its own — so
   * this is a plain string, and gating reads `permissions` below
   * rather than comparing against it. */
  role: string;
  role_id: number | null;
  role_name: string;
  /** What this user can actually do — see useCapability in hooks.ts. */
  permissions: Capability[];
  /** Which part of the company they work in — stamps their contributions
   * and is what "the responsible person" is looked up by. Not a permission. */
  function: UserFunction;
  function_display: string;
  /** Their manager — the org chart. What they may see of what others say is read from it. */
  reports_to: { id: number; name: string } | null;
  organisation: Organisation;
  is_active: boolean;
  /** False for someone who only ever signed in with Google or Microsoft:
   * there is no current password to ask for, so Account settings shows
   * how they sign in instead of a password form. */
  has_password?: boolean;
  /** When they finished or skipped the first-run tour. Server-side, so a
   * new browser does not replay it. Null until then. */
  tour_completed_at?: string | null;
  /** Only `/auth/me/` carries this; login and list rows do not. */
  sign_in_providers?: string[];
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
        skipAuthRetry: true, // a 401 here means bad credentials, not an expired token
      });
      return { user: data.user, accessToken: data.access, refreshToken: data.refresh };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// Second half of "Continue with Google / Microsoft". The provider talks to
// the backend, which redirects to /auth/callback with a one-time hand-off
// code; this trades that code for the same {user, access, refresh} the
// password login returns, so the session is stored identically and nothing
// downstream needs to know which door was used.
export const loginWithHandoff = createAsyncThunk<LoginPayload, string, { rejectValue: string }>(
  'auth/loginWithHandoff',
  async (handoff, { rejectWithValue }) => {
    try {
      const data = await apiFetch<AuthResponse>('/auth/oauth/exchange/', {
        method: 'POST',
        body: { handoff },
        accessToken: null,
        skipAuthRetry: true, // a 401 here means the code is spent or expired
      });
      return { user: data.user, accessToken: data.access, refreshToken: data.refresh };
    } catch (err) {
      // The callback screen explains codes itself, so pass the code through
      // when there is one and fall back to prose when there is not.
      return rejectWithValue(errorCodeOf(err) ?? 'INVALID_HANDOFF');
    }
  }
);

// The workspace form after a provider sign-in from a domain nobody has
// claimed. `setup` is the short-lived code the callback arrived with; the
// backend turns it into an organisation with this person as its first
// administrator and answers with the same session shape as login.
export const createWorkspace = createAsyncThunk<
  LoginPayload,
  { setup: string; organisationName: string; name: string },
  { rejectValue: string }
>('auth/createWorkspace', async ({ setup, organisationName, name }, { rejectWithValue }) => {
  try {
    const data = await apiFetch<AuthResponse>('/auth/oauth/workspace/', {
      method: 'POST',
      body: { setup, organisation_name: organisationName, name },
      accessToken: null,
      skipAuthRetry: true,
    });
    return { user: data.user, accessToken: data.access, refreshToken: data.refresh };
  } catch (err) {
    return rejectWithValue(errorCodeOf(err) ?? 'INVALID_SETUP');
  }
});

// Marks the first-run tour finished (or, with `false`, asks for it again).
// The server stamps the time; this just reports the decision.
export const setTourCompleted = createAsyncThunk<User, boolean, { rejectValue: string }>(
  'auth/setTourCompleted',
  async (completed, { rejectWithValue }) => {
    try {
      return await apiFetch<User>('/auth/me/', {
        method: 'PATCH',
        body: { tour_completed: completed },
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not save your tour progress.';
      return rejectWithValue(message);
    }
  }
);

// Refreshes your own profile from the server — used on the Profile page's
// mount, since localStorage's cached copy could be stale (e.g. an admin
// deactivated then reactivated you in another tab).
export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await apiFetch<User>('/auth/me/');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load your profile.';
      return rejectWithValue(message);
    }
  }
);

// Only `name` is writable — see revenact-backend's MeSerializer.
export const updateProfile = createAsyncThunk<User, { name: string }, { rejectValue: string }>(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      return await apiFetch<User>('/auth/me/', { method: 'PATCH', body: data });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update your profile.';
      return rejectWithValue(message);
    }
  }
);

// Backs Settings > Currency / Global Presets. Admin-only server-side
// (IsOrgAdmin — a CSM gets a 403); both settings pages gate the Save
// button on `user.role === 'admin'` to match, showing a read-only view
// otherwise. Either key alone is fine — the backend only writes what's
// actually sent.
export const updateOrganisation = createAsyncThunk<
  Organisation,
  Partial<Pick<Organisation, 'name' | 'currency' | 'default_lifecycle_stage' | 'ai_agent_enabled' | 'ai_agent_tone' | 'global_attributes'>>,
  { rejectValue: string }
>('auth/updateOrganisation', async (data, { rejectWithValue }) => {
  try {
    return await apiFetch<Organisation>('/auth/organisation/', { method: 'PATCH', body: data });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not update organisation settings.';
    return rejectWithValue(message);
  }
});

export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>('auth/changePassword', async ({ currentPassword, newPassword }, { rejectWithValue }) => {
  try {
    await apiFetch('/auth/me/change-password/', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Could not change your password.';
    return rejectWithValue(message);
  }
});

// Step 1 of the forgot-password flow (ForgotPassword.tsx) — requests a
// reset-link email. The backend always resolves 200 regardless of whether
// the address matches an account (see API_CONTRACTS.md), so a successful
// unwrap() here just means "the request was accepted", not "that email
// exists" — the UI should show the same generic message either way.
export const requestPasswordReset = createAsyncThunk<void, string, { rejectValue: string }>(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      await apiFetch('/auth/password-reset/', {
        method: 'POST',
        body: { email },
        skipAuthRetry: true, // unauthenticated endpoint — no token to retry with
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// Step 2 — consumes the uid/token pair from the emailed link (read off
// ResetPassword.tsx's own URL) to set a new password. Doesn't log the user
// in; they sign in at /login/ afterward same as any other time.
export const confirmPasswordReset = createAsyncThunk<
  void,
  { uid: string; token: string; newPassword: string },
  { rejectValue: string }
>('auth/confirmPasswordReset', async ({ uid, token, newPassword }, { rejectWithValue }) => {
  try {
    await apiFetch('/auth/password-reset/confirm/', {
      method: 'POST',
      body: { uid, token, new_password: newPassword },
      skipAuthRetry: true,
    });
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'This reset link is invalid or has expired.';
    return rejectWithValue(message);
  }
});

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
        await apiFetch('/auth/logout/', {
          method: 'POST',
          body: { refresh: refreshToken },
          accessToken,
          skipAuthRetry: true, // state is already cleared; nothing to retry with
        });
      } catch {
        // Refresh token may already be expired/blacklisted, or the server
        // is unreachable — the user is logged out client-side either way.
      }
    }
  }
);

// The backend rotates refresh tokens (SIMPLE_JWT.ROTATE_REFRESH_TOKENS): each
// refresh blacklists the token sent and returns a replacement, so the reply's
// `refresh` must be stored or the next refresh fails. (SOC2:AUTH-05)
export const refreshSession = createAsyncThunk<
  { accessToken: string; refreshToken?: string },
  void,
  { rejectValue: string }
>(
  'auth/refreshSession',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };
    if (!state.auth.refreshToken) {
      return rejectWithValue('No refresh token available');
    }
    try {
      const data = await apiFetch<{ access: string; refresh?: string }>('/auth/token/refresh/', {
        method: 'POST',
        body: { refresh: state.auth.refreshToken },
        skipAuthRetry: true, // this IS the refresh call — retrying it on 401 would recurse forever
      });
      return { accessToken: data.access, refreshToken: data.refresh };
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
    // Clears the session with no network call. Used by the `logout` thunk
    // (for the instant client-side part of a manual sign-out) and by
    // apiClient's onAuthFailure hook (session died because refresh failed —
    // nothing left to blacklist). For a manual sign-out from the UI, call
    // the `logout` thunk instead so the server-side blacklist call happens.
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
      // Provider sign-in — settles into exactly the same state as `login`.
      .addCase(loginWithHandoff.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithHandoff.fulfilled, (state, action: PayloadAction<LoginPayload>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        persistAuth(action.payload);
      })
      .addCase(loginWithHandoff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'INVALID_HANDOFF';
      })
      // Workspace creation ends in a session exactly like a login does.
      .addCase(createWorkspace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWorkspace.fulfilled, (state, action: PayloadAction<LoginPayload>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        persistAuth(action.payload);
      })
      .addCase(createWorkspace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'INVALID_SETUP';
      })
      .addCase(setTourCompleted.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        localStorage.setItem('revenact_user', JSON.stringify(action.payload));
      })
      // Own profile — fetchMe/updateProfile both just replace `user` with
      // whatever the server now says it is, and re-persist it.
      .addCase(fetchMe.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        localStorage.setItem('revenact_user', JSON.stringify(action.payload));
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        localStorage.setItem('revenact_user', JSON.stringify(action.payload));
      })
      .addCase(updateOrganisation.fulfilled, (state, action: PayloadAction<Organisation>) => {
        if (!state.user) return;
        state.user.organisation = action.payload;
        localStorage.setItem('revenact_user', JSON.stringify(state.user));
      })
      // Refresh session
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        localStorage.setItem('revenact_access_token', action.payload.accessToken);
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
          localStorage.setItem('revenact_refresh_token', action.payload.refreshToken);
        }
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

export const { loggedOut, clearError } = authSlice.actions;
export default authSlice.reducer;
