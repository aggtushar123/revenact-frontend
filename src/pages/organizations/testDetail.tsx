// Test-only helpers for the organization page: its store and its render.
// Never hot-reloaded: Where sits beside the helpers so a test imports one module.
/* eslint-disable react-refresh/only-export-components */
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import authReducer from '../../features/auth/authSlice';
import callsReducer from '../../features/calls/callsSlice';
import customersReducer from '../../features/customers/customersSlice';
import filesReducer from '../../features/files/filesSlice';
import knowledgeReducer from '../../features/knowledge/knowledgeSlice';
import notificationsReducer from '../../features/notifications/notificationsSlice';
import { ALL_CAPABILITIES } from '../../test/capabilities';
import { setViewport } from '../../test/viewport';
import { Details } from './Details';
import { List } from './List';

/** The real slices the organization page and its tabs dispatch into. Only
 *  fetch is stubbed, by the caller (stubOrganizationPage, or a test's own). */
export function makeDetailStore() {
  return configureStore({
    reducer: {
      customers: customersReducer,
      auth: authReducer,
      notifications: notificationsReducer,
      knowledge: knowledgeReducer,
      files: filesReducer,
      calls: callsReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@company.example',
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
            name: 'Example Co',
            slug: 'example-co',
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

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

/** The browser's Back button, and a link elsewhere, for tests that move
 *  through history the way a person does outside the page. */
function History({ goTo }: { goTo?: string }) {
  const navigate = useNavigate();
  return (
    <p>
      <button type="button" onClick={() => navigate(-1)}>
        Browser back
      </button>
      {goTo ? <Link to={goTo}>Go to {goTo}</Link> : null}
    </p>
  );
}

/** The organization page on the real store and router. `list` puts the real
 *  List at /organizations/list (a marker otherwise); `nav` adds the real
 *  Navbar. Only fetch is stubbed, by the caller (stubOrganizationPage). */
export function renderOrganizationPage(
  url = '/organizations/7',
  {
    width = 1440,
    nav = false,
    list = false,
    history = false,
    goTo,
  }: { width?: number; nav?: boolean; list?: boolean; history?: boolean; goTo?: string } = {},
) {
  setViewport(width);
  const store = makeDetailStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        {nav ? <Navbar /> : null}
        <Routes>
          <Route
            path="/organizations/:id"
            element={
              <>
                <Details />
                <Where />
                {history || goTo ? <History goTo={goTo} /> : null}
              </>
            }
          />
          <Route
            path="/organizations/list"
            element={
              <>
                {list ? <List /> : <p>Organizations list</p>}
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store };
}
