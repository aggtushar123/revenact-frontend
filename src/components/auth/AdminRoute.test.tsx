import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { AdminRoute } from './AdminRoute';

const baseUser = {
  id: 1,
  email: 'a@acme.io',
  name: 'Someone',
  avatar: 'https://i.pravatar.cc/150?u=a@acme.io',
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)', default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional' },
  is_active: true,
};

function renderAsRole(role: 'admin' | 'csm') {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { ...baseUser, role },
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
      <MemoryRouter initialEntries={['/users']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Home</div>} />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <div>User Management</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('AdminRoute', () => {
  it('renders the page for an admin', () => {
    renderAsRole('admin');
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('redirects a CSM to the dashboard', () => {
    renderAsRole('csm');
    expect(screen.getByText('Dashboard Home')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });
});
