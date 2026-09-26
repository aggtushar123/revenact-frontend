// Test-only helpers, never hot-reloaded: Where sits beside the render
// helpers so a test imports one module, not two.
/* eslint-disable react-refresh/only-export-components */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import notificationsReducer from '../../features/notifications/notificationsSlice';
import { Navbar } from '../../components/layout/Navbar';
import { ALL_CAPABILITIES } from '../../test/capabilities';
import { setViewport } from '../../test/viewport';
import { Board } from './Board';
import { List } from './List';

// Test-only. The real auth, customers and notifications slices (the modals
// dispatch into customers; the Navbar reads notifications). Only fetch is
// stubbed, by the caller, with stubPortfolio().

export function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

function makeStore() {
  return configureStore({
    reducer: { customers: customersReducer, auth: authReducer, notifications: notificationsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role: 'admin' as const,
          role_id: 1,
          role_name: 'Admin',
          permissions: ALL_CAPABILITIES,
          function: 'cs' as const,
          function_display: 'Customer Success',
          reports_to: null,
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '',
            ai_agent_enabled: true,
            ai_agent_tone: 'professional' as const,
            ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
}

/** Both Organizations routes (and the organization page they link to) on the
 *  real store and router. `nav` adds the real Navbar, whose List/Board tabs
 *  switch between them carrying the query. */
export function renderOrganizations(url: string, { width = 1440, nav = false }: { width?: number; nav?: boolean } = {}) {
  setViewport(width);
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        {nav ? <Navbar /> : null}
        <Routes>
          <Route
            path="/organizations/list"
            element={
              <>
                <List />
                <Where />
              </>
            }
          />
          <Route
            path="/organizations/board"
            element={
              <>
                <Board />
                <Where />
              </>
            }
          />
          <Route path="/organizations/:id" element={<p>Organization page</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store };
}

export function renderList(url = '/organizations/list', { width = 1440 }: { width?: number } = {}) {
  return renderOrganizations(url, { width });
}

export function renderBoard(url = '/organizations/board', { width = 1440 }: { width?: number } = {}) {
  return renderOrganizations(url, { width });
}
