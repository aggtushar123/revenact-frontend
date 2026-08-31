import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import brainReducer from '../../features/brain/brainSlice';
import { Navbar } from './Navbar';

const mockUser = {
  id: 1,
  email: 'alice@acme.io',
  name: 'Alice Admin',
  avatar: 'https://i.pravatar.cc/150?u=alice@acme.io',
  role: 'admin' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

function renderNavbar() {
  const store = configureStore({
    reducer: { auth: authReducer, brain: brainReducer },
    preloadedState: {
      auth: {
        user: mockUser,
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Marker</div>} />
          <Route path="/profile" element={<div>Profile Marker</div>} />
          <Route path="/login" element={<div>Login Marker</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Navbar account menu', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('is closed by default', () => {
    renderNavbar();
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('opens on avatar click and shows the real logged-in user', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));

    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.io')).toBeInTheDocument();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('navigates to /profile and closes the menu', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));
    await user.click(screen.getByText('My Profile'));

    expect(await screen.findByText('Profile Marker')).toBeInTheDocument();
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  });

  it('signs out and redirects to /login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 205, json: async () => null })
    );
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));
    await user.click(screen.getByText('Sign out'));

    expect(await screen.findByText('Login Marker')).toBeInTheDocument();
  });

  it('closes when clicking outside the menu', async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByAltText('Alice Admin'));
    expect(screen.getByText('My Profile')).toBeInTheDocument();

    await user.click(screen.getByText('Dashboard Marker'));

    await waitFor(() => expect(screen.queryByText('My Profile')).not.toBeInTheDocument());
  });
});
