import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout, clearError } from './authSlice';

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

// Matches revenact-backend's UserSerializer/login response shape — see
// revenact-backend/docs/API_CONTRACTS.md.
const mockUser = {
  id: 1,
  email: 'demo@revenact.io',
  name: 'Demo User',
  avatar: 'https://i.pravatar.cc/150?u=demo@revenact.io',
  role: 'admin' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
};

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  );
}

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('starts unauthenticated with no user', () => {
    const state = makeStore().getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.error).toBeNull();
  });

  it('login with valid credentials authenticates and issues tokens', async () => {
    mockFetchOnce(200, { user: mockUser, access: 'access.jwt', refresh: 'refresh.jwt' });

    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'demo1234' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('demo@revenact.io');
    expect(state.user?.organisation.name).toBe('Acme Inc');
    expect(state.accessToken).toBe('access.jwt');
    expect(state.refreshToken).toBe('refresh.jwt');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('login with wrong password sets an error and stays unauthenticated', async () => {
    mockFetchOnce(401, { detail: 'No active account found with the given credentials' });

    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'wrong' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('No active account found with the given credentials');
    expect(state.accessToken).toBeNull();
  });

  it('login when the server is unreachable sets a generic error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'demo1234' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Could not reach the server. Please try again.');
  });

  it('persists session to localStorage on login and clears it on logout', async () => {
    mockFetchOnce(200, { user: mockUser, access: 'access.jwt', refresh: 'refresh.jwt' });

    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'demo1234' }));

    expect(localStorage.getItem('revenact_access_token')).toBe('access.jwt');
    expect(localStorage.getItem('revenact_refresh_token')).toBe('refresh.jwt');
    expect(JSON.parse(localStorage.getItem('revenact_user')!).email).toBe('demo@revenact.io');

    store.dispatch(logout());

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('revenact_access_token')).toBeNull();
    expect(localStorage.getItem('revenact_user')).toBeNull();
  });

  it('clearError resets the error message', async () => {
    mockFetchOnce(401, { detail: 'No active account found with the given credentials' });

    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'wrong' }));
    expect(store.getState().auth.error).not.toBeNull();

    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});
