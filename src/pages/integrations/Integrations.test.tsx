import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import connectorsReducer from '../../features/connectors/connectorsSlice';
import { Integrations } from './Integrations';
import { capabilitiesForRole } from '../../test/capabilities';

const zendesk = {
  id: 3, provider: 'zendesk' as const, provider_display: 'Zendesk', name: 'Zendesk (EU)', is_enabled: true,
  customers: [{ id: 1, name: 'Apple' }], accounts: [], is_organisation_wide: false,
  ticket_count: 42, call_count: 0, last_record_at: '2026-09-10', created_at: '2026-08-01T00:00:00Z',
};
const zoom = {
  id: 4, provider: 'zoom' as const, provider_display: 'Zoom', name: 'Zoom', is_enabled: false,
  customers: [], accounts: [], is_organisation_wide: true,
  ticket_count: 0, call_count: 7, last_record_at: '2026-09-01', created_at: '2026-08-01T00:00:00Z',
};

function mockApi() {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((_url, init) => {
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: true, status, json: async () => body });
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      return ok({ ...zoom, id: 9, provider: body.provider, name: body.name, is_enabled: true, call_count: 0, last_record_at: null }, 201);
    }
    if (init?.method === 'PATCH') return ok({ ...zoom, is_enabled: JSON.parse(String(init.body)).is_enabled });
    return ok([zendesk, zoom]);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, connectors: connectorsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success',
          organisation: {
            id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token', refreshToken: 'refresh', isAuthenticated: true, isLoading: false, error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <Integrations />
    </Provider>
  );
}

const card = (name: string) => screen.getByLabelText(name);

describe('Integrations', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows each provider with its real connectors, scope and what they brought in', async () => {
    mockApi();
    renderPage();

    await screen.findByText('Zendesk (EU)');
    const z = card('Zendesk');
    expect(within(z).getByText('Connected')).toBeInTheDocument();
    expect(within(z).getByText(/1 organization/)).toBeInTheDocument();
    expect(within(z).getByText(/42 tickets · last/)).toBeInTheDocument();

    const zm = card('Zoom');
    expect(within(zm).getByText('Disabled')).toBeInTheDocument();
    expect(within(zm).getByText(/whole organisation/)).toBeInTheDocument();
    expect(within(zm).getByText(/7 calls/)).toBeInTheDocument();

    expect(within(card('Slack')).getByText('Not set up')).toBeInTheDocument();
    expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
  });

  it('lets an integrations manager connect a system and re-enable one', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Zendesk (EU)');
    await user.click(within(card('Slack')).getByRole('button', { name: 'Connect' }));
    const input = screen.getByLabelText('Name for Slack');
    await user.clear(input);
    await user.type(input, 'Slack (CS team)');
    await user.click(within(card('Slack')).getByRole('button', { name: 'Save' }));

    expect(await within(card('Slack')).findByText('Slack (CS team)')).toBeInTheDocument();
    const post = spy.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ provider: 'slack', name: 'Slack (CS team)' });

    await user.click(within(card('Zoom')).getByRole('button', { name: 'Enable' }));
    expect(await within(card('Zoom')).findByText('Connected')).toBeInTheDocument();
  });

  it('offers no controls to someone without manage_integrations', async () => {
    mockApi();
    renderPage('csm');

    await screen.findByText('Zendesk (EU)');
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disable' })).not.toBeInTheDocument();
  });
});
