import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { Login } from './Login';

// Integration tier (see the `testing` skill): real store, real routing
// around the page, network mocked at the fetch boundary with a response
// shaped exactly like revenact-backend's real contract (see
// revenact-backend/docs/API_CONTRACTS.md) — not an arbitrary shape.
const mockUser = {
  id: 1,
  email: 'alice@acme.io',
  name: 'Alice Admin',
  avatar: 'https://i.pravatar.cc/150?u=alice@acme.io',
  role: 'admin' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

function renderLogin() {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard Home</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('logs in with valid credentials and redirects to the dashboard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user: mockUser, access: 'access.jwt', refresh: 'refresh.jwt' }),
      })
    );
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByPlaceholderText('Email Address'), 'alice@acme.io');
    await user.type(screen.getByPlaceholderText('••••••••'), 'supersecret1');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(screen.getByText('Dashboard Home')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login/'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows the backend error message on invalid credentials and stays on the page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'No active account found with the given credentials' }),
      })
    );
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByPlaceholderText('Email Address'), 'alice@acme.io');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(
      await screen.findByText('No active account found with the given credentials')
    ).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Home')).not.toBeInTheDocument();
  });

  it('validates fields client-side before ever calling the backend', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const user = userEvent.setup();

    renderLogin();
    await user.type(screen.getByPlaceholderText('Email Address'), 'not-an-email');
    await user.type(screen.getByPlaceholderText('••••••••'), 'short');
    await user.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
