import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login, logout, clearError } from './authSlice';

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

describe('authSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated with no user', () => {
    const state = makeStore().getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.error).toBeNull();
  });

  it('login with valid credentials authenticates and issues tokens', async () => {
    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'demo1234' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('demo@revenact.io');
    expect(state.accessToken).toMatch(/^access\./);
    expect(state.refreshToken).toMatch(/^refresh\./);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('login is case-insensitive on email', async () => {
    const store = makeStore();
    await store.dispatch(login({ email: 'DEMO@Revenact.IO', password: 'demo1234' }));
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });

  it('login with wrong password sets an error and stays unauthenticated', async () => {
    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'wrong' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid email or password. Please try again.');
    expect(state.accessToken).toBeNull();
  });

  it('persists session to localStorage on login and clears it on logout', async () => {
    const store = makeStore();
    await store.dispatch(login({ email: 'admin@revenact.io', password: 'password123' }));

    expect(localStorage.getItem('revenact_access_token')).not.toBeNull();
    expect(localStorage.getItem('revenact_refresh_token')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('revenact_user')!).email).toBe('admin@revenact.io');

    store.dispatch(logout());

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorage.getItem('revenact_access_token')).toBeNull();
    expect(localStorage.getItem('revenact_user')).toBeNull();
  });

  it('clearError resets the error message', async () => {
    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'wrong' }));
    expect(store.getState().auth.error).not.toBeNull();

    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});
