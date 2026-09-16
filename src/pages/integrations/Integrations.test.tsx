import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import connectorsReducer from '../../features/connectors/connectorsSlice';
import mailReducer from '../../features/mail/mailSlice';
import { Integrations } from './Integrations';
import { capabilitiesForRole } from '../../test/capabilities';

const live = {
  department: '' as const, department_display: '', has_credentials: false, config: {}, status: 'not_connected' as const,
  error: '', last_synced_at: null, last_sync_note: '', setup: null,
};
const zendeskSetup = {
  key: 'zendesk', label: 'Zendesk', uses_oauth: false, help: 'Admin Center › APIs.',
  fields: [
    { name: 'subdomain', label: 'Zendesk subdomain', secret: false, placeholder: 'acme', required: true },
    { name: 'email', label: 'Agent email', secret: false, placeholder: '', required: true },
    { name: 'api_token', label: 'API token', secret: true, placeholder: '', required: true },
  ],
};
const slackSetup = {
  key: 'slack', label: 'Slack', uses_oauth: false, help: 'Invite the bot to the channel.',
  fields: [
    { name: 'channel', label: 'Channel ID', secret: false, placeholder: 'C0123ABCD', required: true },
    { name: 'bot_token', label: 'Bot token', secret: true, placeholder: 'xoxb-…', required: false },
  ],
};
const webhookSetup = { key: 'webhook', label: 'Any other system (webhook)', uses_oauth: false, help: '', fields: [] };
const zendesk = {
  id: 3, provider: 'zendesk' as const, provider_display: 'Zendesk', name: 'Zendesk (EU)', is_enabled: true,
  customers: [{ id: 1, name: 'Apple' }], accounts: [], is_organisation_wide: false,
  ticket_count: 42, call_count: 0, last_record_at: '2026-09-10', created_at: '2026-08-01T00:00:00Z',
  ...live, department: 'cs' as const, department_display: 'Customer Success', has_credentials: true, status: 'connected' as const,
  last_synced_at: '2026-09-16T09:00:00Z', last_sync_note: '3 new, 2 updated', setup: zendeskSetup, config: { host: 'acme.zendesk.com' },
};
const zoom = {
  id: 4, provider: 'zoom' as const, provider_display: 'Zoom', name: 'Zoom', is_enabled: false,
  customers: [], accounts: [], is_organisation_wide: true,
  ticket_count: 0, call_count: 7, last_record_at: '2026-09-01', created_at: '2026-08-01T00:00:00Z',
  ...live,
};
const setups: Record<string, unknown> = { slack: slackSetup, webhook: webhookSetup, zendesk: zendeskSetup };

function mockApi() {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url, init) => {
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: true, status, json: async () => body });
    if (init?.method === 'POST' && url.endsWith('/connect/')) {
      const id = Number(url.split('/connectors/')[1].split('/')[0]);
      const body = JSON.parse(String(init.body ?? '{}'));
      const base = { ...zoom, id, is_enabled: true, has_credentials: true, status: 'connected' as const };
      if (id === 9) return ok({ ...base, provider: 'webhook', name: 'Our helpdesk', setup: webhookSetup, token: 'shown-once-secret', inbound_url: 'http://localhost/api/v1/connectors/9/inbound/' }, 201);
      return ok({ ...zendesk, has_credentials: true, status: 'connected', config: { host: `${body.subdomain}.zendesk.com` } }, 201);
    }
    if (init?.method === 'POST' && url.endsWith('/sync/')) return ok({ ...zendesk, last_sync_note: '1 new, 0 updated', created: 1, updated: 0, unmatched: 0 });
    if (init?.method === 'DELETE') return Promise.resolve({ ok: true, status: 204, json: async () => undefined });
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      return ok({ ...zoom, id: 9, provider: body.provider, name: body.name, is_enabled: true, call_count: 0, last_record_at: null,
        department: body.department ?? '', department_display: body.department === 'cs' ? 'Customer Success' : '', setup: setups[body.provider] ?? null }, 201);
    }
    if (init?.method === 'PATCH') return ok({ ...zoom, is_enabled: JSON.parse(String(init.body)).is_enabled });
    return ok([zendesk, zoom]);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, connectors: connectorsReducer, mail: mailReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
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
    // A ticket source is created for a department — the caller's own by default.
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ provider: 'slack', name: 'Slack (CS team)', department: 'cs' });
    // …and its credentials form opens straight away.
    expect(within(card('Slack')).getByLabelText('Channel ID')).toBeInTheDocument();

    await user.click(within(card('Zoom')).getByRole('button', { name: 'Enable' }));
    expect(await within(card('Zoom')).findByText('Connected')).toBeInTheDocument();
  });

  it('offers no controls to someone without manage_integrations', async () => {
    mockApi();
    renderPage('csm');

    await screen.findByText('Zendesk (EU)');
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disable' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sync Zendesk/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
  });

  it('shows a ticket source its department, its last sync, and lets a manager sync or reconnect it', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPage();

    const z = card('Zendesk');
    expect(await within(z).findByText('Customer Success')).toBeInTheDocument();
    expect(within(z).getByText(/Synced 16 Sep 2026 · 3 new, 2 updated/)).toBeInTheDocument();

    await user.click(within(z).getByRole('button', { name: 'Sync Zendesk (EU) now' }));
    expect(await within(z).findByText(/1 new, 0 updated/)).toBeInTheDocument();
    expect(spy.mock.calls.some(([url, init]) => url.endsWith('/connectors/3/sync/') && init?.method === 'POST')).toBe(true);

    await user.click(within(z).getByText('Reconnect'));
    await user.type(within(z).getByLabelText('Zendesk subdomain'), 'acme');
    await user.type(within(z).getByLabelText('Agent email'), 'alice@acme.io');
    const token = within(z).getByLabelText('API token');
    expect(token).toHaveAttribute('type', 'password');
    await user.type(token, 'top-secret');
    await user.click(within(z).getByRole('button', { name: 'Connect' }));

    const connect = spy.mock.calls.find(([url, init]) => url.endsWith('/connectors/3/connect/') && init?.method === 'POST');
    expect(JSON.parse(String(connect?.[1]?.body))).toEqual({ subdomain: 'acme', email: 'alice@acme.io', api_token: 'top-secret' });
    expect(await within(z).findByText('Reconnect')).toBeInTheDocument(); // form closed again

    await user.click(within(z).getByRole('button', { name: 'Disconnect Zendesk (EU)' }));
    expect(await within(z).findByText('Not connected yet')).toBeInTheDocument();
  });

  it('mints a secret for any other system and shows it once', async () => {
    mockApi();
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Zendesk (EU)');
    const other = card('Any other system');
    await user.click(within(other).getByRole('button', { name: 'Connect' }));
    const input = screen.getByLabelText('Name for Any other system');
    await user.clear(input);
    await user.type(input, 'Our helpdesk');
    await user.selectOptions(screen.getByLabelText('Department for Any other system'), 'engineering');
    await user.click(within(other).getByRole('button', { name: 'Save' }));

    await user.click(await within(other).findByRole('button', { name: 'Generate secret' }));
    expect(await within(other).findByLabelText('Webhook secret')).toHaveTextContent('shown-once-secret');
    expect(within(other).getByText(/connectors\/9\/inbound/)).toBeInTheDocument();
    await user.click(within(other).getByRole('button', { name: 'Done' }));
    expect(within(other).queryByText('shown-once-secret')).not.toBeInTheDocument();
  });
});
