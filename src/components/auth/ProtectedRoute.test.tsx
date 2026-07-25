import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { login } from '../../features/auth/authSlice';
import { ProtectedRoute } from './ProtectedRoute';

function renderAt(path: string, store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated visitors to the login page', () => {
    renderAt('/dashboard', makeStore());
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('renders protected content once the user is logged in', async () => {
    const store = makeStore();
    await store.dispatch(login({ email: 'demo@revenact.io', password: 'demo1234' }));

    renderAt('/dashboard', store);
    expect(screen.getByText('Secret Dashboard')).toBeInTheDocument();
  });
});
