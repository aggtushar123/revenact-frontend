// Test-only helpers, never hot-reloaded.
/* eslint-disable react-refresh/only-export-components */
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import authReducer from '../../features/auth/authSlice';
import customersReducer from '../../features/customers/customersSlice';
import notificationsReducer from '../../features/notifications/notificationsSlice';
import { Navbar } from '../../components/layout/Navbar';
import { ALL_CAPABILITIES } from '../../test/capabilities';
import { SlotHost } from '../../test/SlotHost';
import { setViewport } from '../../test/viewport';
import { Board } from './Board';
import { List } from './List';

// Test-only. Both Accounts routes on the real auth, customers and
// notifications slices and the real router, as App.tsx routes them. Only
// fetch is stubbed, by the caller, with stubAccountPortfolio().

export function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

/** Stands in for /accounts/:id (Details.tsx), saying which row it was handed. */
function AccountPage() {
  const location = useLocation();
  const account = (location.state as { account?: { name: string; orgId: number } } | null)?.account;
  return <p data-testid="account-page">{account ? `${account.name} · organization ${account.orgId}` : 'No account state'}</p>;
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

/** Both Accounts views (and the pages they link to) on the real store and
 *  router. `nav` adds the real Navbar, whose List/Board tabs switch views
 *  carrying the query. */
export function renderAccounts(url: string, { width = 1440, nav = false }: { width?: number; nav?: boolean } = {}) {
  setViewport(width);
  const store = makeStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <SlotHost bare={!nav}>
          {nav ? <Navbar /> : null}
          <Routes>
            <Route
              path="/accounts/list"
              element={
                <>
                  <List />
                  <Where />
                </>
              }
            />
            <Route
              path="/accounts/board"
              element={
                <>
                  <Board />
                  <Where />
                </>
              }
            />
            <Route
              path="/accounts/:id"
              element={
                <>
                  <AccountPage />
                  <Where />
                </>
              }
            />
            <Route path="/organizations/:id" element={<p>Organization page</p>} />
          </Routes>
        </SlotHost>
      </MemoryRouter>
    </Provider>,
  );
  return { store };
}
