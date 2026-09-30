import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import mailReducer from '../../features/mail/mailSlice';
import connectorsReducer from '../../features/connectors/connectorsSlice';
import { SourcesGroup } from './SourcesGroup';

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function WhereAmI() {
  const location = useLocation();
  return <div data-testid="where">{location.pathname + location.search}</div>;
}

function renderGroup(path = '/dashboard', mailbox: unknown = { id: 1, provider: 'google', provider_display: 'Google', address: 'a@acme.io', status: 'connected' }) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/mail/connection/')) return Promise.resolve(jsonResponse(200, { connection: mailbox, providers: [] }));
      if (url.includes('/connectors/')) {
        return Promise.resolve(
          jsonResponse(200, [
            { id: 4, provider: 'intercom', provider_display: 'Intercom', name: 'Intercom', status: 'connected', is_enabled: true, department: '', department_display: '', customers: [], accounts: [], is_organisation_wide: true, ticket_count: 0, call_count: 0, last_record_at: null, has_credentials: true, config: {} },
            { id: 5, provider: 'slack', provider_display: 'Slack', name: 'Slack', status: 'not_connected', is_enabled: true, department: '', department_display: '', customers: [], accounts: [], is_organisation_wide: true, ticket_count: 0, call_count: 0, last_record_at: null, has_credentials: true, config: {} },
            { id: 6, provider: 'zendesk', provider_display: 'Zendesk', name: 'Zendesk', status: 'not_connected', is_enabled: true, department: '', department_display: '', customers: [], accounts: [], is_organisation_wide: true, ticket_count: 0, call_count: 0, last_record_at: null, has_credentials: false, config: {} },
            { id: 7, provider: 'salesforce', provider_display: 'Salesforce', name: 'Salesforce', status: 'not_connected', is_enabled: true, department: '', department_display: '', customers: [], accounts: [], is_organisation_wide: true, ticket_count: 0, call_count: 0, last_record_at: null, has_credentials: false, config: {} },
          ])
        );
      }
      throw new Error(`unexpected request: ${url}`);
    })
  );
  const store = configureStore({ reducer: { mail: mailReducer, connectors: connectorsReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<><SourcesGroup /><WhereAmI /></>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Sidebar Communications group', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('shows the inbox and the first source when closed, everything connected when open', async () => {
    renderGroup();
    const group = screen.getByRole('group', { name: 'Communications' });
    expect(await within(group).findByRole('button', { name: 'Gmail' })).toBeInTheDocument();
    expect(within(group).queryByRole('button', { name: 'Slack' })).not.toBeInTheDocument();

    // A 44px touch target below sm, not the 32px `h-8` it used to be stuck at.
    expect(within(group).getByRole('button', { name: 'Show all sources' })).toHaveClass('min-h-11', 'sm:min-h-8');
    await userEvent.click(within(group).getByRole('button', { name: 'Show all sources' }));
    expect(within(group).getByRole('button', { name: 'Slack' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Calls' })).toBeInTheDocument();
    // Salesforce is set up and enabled: connected, the way Integrations says it is.
    expect(within(group).getByRole('button', { name: 'Salesforce' })).toBeInTheDocument();
    // Zendesk pulls tickets and has no credentials yet: shown dimmed, leads to Integrations.
    expect(within(group).queryByRole('button', { name: 'Zendesk' })).not.toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Connect Zendesk' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Connect Outlook' })).toBeInTheDocument();
    expect(localStorage.getItem('revenact_sidebar_sources_open')).toBe('true');

    await userEvent.click(within(group).getByRole('button', { name: 'Show fewer sources' }));
    expect(within(group).queryByRole('button', { name: 'Slack' })).not.toBeInTheDocument();
  });

  it('keeps Gmail second even when no mailbox is connected and another channel is', async () => {
    renderGroup('/dashboard', null);
    const group = screen.getByRole('group', { name: 'Communications' });
    // Intercom is connected, but mail leads: Gmail sits by the inbox, dimmed, and connects from Integrations.
    expect(await within(group).findByRole('button', { name: 'Connect Gmail' })).toBeInTheDocument();
    expect(within(group).queryByRole('button', { name: 'Intercom' })).not.toBeInTheDocument();
    await userEvent.click(within(group).getByRole('button', { name: 'Connect Gmail' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/integrations');
  });

  it('resting on a source shows its name in a pill', async () => {
    renderGroup();
    const group = screen.getByRole('group', { name: 'Communications' });
    const gmail = await within(group).findByRole('button', { name: 'Gmail' });
    expect(within(group).queryByText('Gmail')).not.toBeInTheDocument();
    await userEvent.hover(gmail);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Gmail');
    await userEvent.unhover(gmail);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('the inbox goes to Communications and a source narrows it by the URL', async () => {
    renderGroup();
    const group = screen.getByRole('group', { name: 'Communications' });
    await userEvent.click(within(group).getByRole('button', { name: 'Communications' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/communications');
    await userEvent.click(await within(group).findByRole('button', { name: 'Gmail' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/communications?source=mailbox%3Agoogle');
    expect(within(group).getByRole('button', { name: 'Gmail' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(group).getByRole('button', { name: 'Show all sources' }));
    await userEvent.click(within(group).getByRole('button', { name: 'Connect Zendesk' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/integrations');
  });
});
