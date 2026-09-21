import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { Sidebar } from './Sidebar';
import { capabilitiesForRole } from '../../test/capabilities';

// Integration tier (see the `testing` skill): real store (auth for the
// admin-only Users link) + real
// router context; only the fetch boundary for the sidebar's own real
// "CUSTOM OBJECTS" section is mocked.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderSidebar(role?: 'admin' | 'csm') {
  const store = configureStore({
    reducer: { auth: authReducer },
    ...(role
      ? {
          preloadedState: {
            auth: {
              user: {
                id: 1, email: 'x@acme.io', name: 'X', avatar: '', role, role_id: 1,
                role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
                function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
                organisation: {
                  id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)',
                  default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional',
                },
                is_active: true,
              },
              accessToken: 'token', refreshToken: 'refresh', isAuthenticated: true, isLoading: false, error: null,
            },
          },
        }
      : {}),
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    </Provider>
  );
}

describe('Sidebar CUSTOM OBJECTS section', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the org’s own real custom object definitions, not a hardcoded SFDC item', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(200, [
            { id: 4, name: 'Salesforce.com', api_name: 'salesforce_com', applies_to_customer: true, applies_to_account: true, fields: [], records_count: 2, created_at: '2026-09-06T00:00:00Z' },
          ])
        )
      )
    );

    renderSidebar();
    // The rail is icons only; every item carries its name as its
    // accessible name, and shows it in a pill on hover.
    expect(await screen.findByRole('link', { name: 'Salesforce.com' })).toHaveAttribute('href', '/custom-objects/4');
    expect(screen.queryByRole('link', { name: /SFDC Opportunity/ })).not.toBeInTheDocument();
  });

  it('renders no custom object items when the org has defined none yet', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));

    renderSidebar();
    await screen.findByRole('link', { name: 'Dashboard' });

    expect(screen.queryByRole('link', { name: /SFDC Opportunity/ })).not.toBeInTheDocument();
  });

  it('a failed fetch leaves the rest of the sidebar working', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'error' }))));

    renderSidebar();

    expect(await screen.findByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });
});

describe('Sidebar hover labels', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
  });

  it('never widens; resting on an item shows its name in a pill, leaving hides it', async () => {
    renderSidebar();
    const rail = screen.getByRole('complementary');
    const dashboard = await screen.findByRole('link', { name: 'Dashboard' });
    await userEvent.hover(rail);
    expect(rail.className).not.toMatch(/w-\[240px\]/);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    await userEvent.hover(dashboard);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Dashboard');
    await userEvent.unhover(dashboard);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('keyboard focus shows the name too', async () => {
    renderSidebar();
    const copilot = await screen.findByRole('link', { name: 'Copilot' });
    copilot.focus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Copilot');
    copilot.blur();
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
  });

  it('the account button shows the person’s name', async () => {
    renderSidebar('csm');
    const account = await screen.findByRole('button', { name: /account settings/i });
    await userEvent.hover(account);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('X');
  });
});

describe('Sidebar and role-based access', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
  });

  it('hides the Knowledge Brain group from a role that cannot load it', async () => {
    renderSidebar('csm');
    expect(await screen.findByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Brain Overview/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Review Queue/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Users/ })).not.toBeInTheDocument();
  });

  it('shows it to a role that can', async () => {
    renderSidebar('admin');
    expect(await screen.findByRole('link', { name: /Brain Overview/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Users/ })).toBeInTheDocument();
  });
});
