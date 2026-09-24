import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import communicationsReducer from '../../features/communications/communicationsSlice';
import mailReducer from '../../features/mail/mailSlice';
import connectorsReducer from '../../features/connectors/connectorsSlice';
import CommunicationsPage from './CommunicationsPage';

const emailRow = {
  id: 'email:412',
  kind: 'email' as const,
  who: 'Dana Whitfield',
  detail: 'Champion',
  subject: 'Re: revised renewal terms',
  snippet: 'We would need the revised terms before the board meets.',
  preview: 'Procurement came back with two problems.',
  sentiment: 'negative',
  waiting_since: '2026-09-09',
  waiting_days: 9,
  account: { id: 3, name: 'Pizza Hut', type: 'customer' as const },
  context: {
    health_score: 5.2,
    health_category: 'average',
    arr: 128400,
    renewal_date: '2026-10-22',
    days_to_renewal: 34,
    owner: 'Carl',
  },
  action: 'reply' as const,
  external_url: '',
};

const ticketRow = {
  ...emailRow,
  id: 'ticket:9',
  kind: 'ticket' as const,
  who: 'Zendesk #4182',
  detail: 'High',
  subject: 'Login fails for SSO users',
  snippet: 'Open for three days.',
  preview: 'SAML users land on a blank screen.',
  waiting_days: 3,
  action: 'open_external' as const,
  external_url: 'https://acme.zendesk.com/agent/tickets/4182',
};

const stats = {
  counts: { email: 1, question: 0, ticket: 1, call: 0 },
  total: 2,
  oldest_waiting_days: 9,
  stale_questions: 0,
  has_mailbox: true,
  scope: 'mine' as const,
  ticket_scope_note: 'Tickets are read by department.',
};

function mockApi(overrides: { rows?: unknown[]; stats?: Record<string, unknown>; mailbox?: unknown; connectors?: unknown[]; conversations?: unknown[]; conversation?: unknown } = {}) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url, init) => {
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: async () => body });
    if (url.includes('/communications/stats/')) return ok({ ...stats, ...(overrides.stats ?? {}) });
    if (url.includes('/mail/connection/')) return ok({ connection: overrides.mailbox ?? { id: 1, provider: 'google', provider_display: 'Google', address: 'alice@acme.io', status: 'connected' }, providers: [] });
    if (url.includes('/connectors/')) return ok(overrides.connectors ?? [{ id: 5, provider: 'zendesk', provider_display: 'Zendesk', name: 'Support desk', status: 'connected', is_enabled: true, department: '', department_display: '', customers: [], accounts: [], is_organisation_wide: true, ticket_count: 3, call_count: 0, last_record_at: null, has_credentials: true, config: {} }]);
    if (url.includes('/copilot/messages/') && init?.method === 'POST') {
      const content = JSON.parse(String(init.body)).content as string;
      return ok({ id: 1, title: 'Chat', created_at: '', updated_at: '', messages: [{ id: 1, role: 'user', content, sources: [], questions: [] }, { id: 2, role: 'assistant', content: 'Two tickets and one reply.', sources: [], questions: [] }] });
    }
    if (/\/copilot\/conversations\/\d+\/$/.test(url)) return ok(overrides.conversation ?? { id: 1, title: 'Chat', created_at: '', updated_at: '', messages: [] });
    if (url.includes('/copilot/conversations/')) return ok(overrides.conversations ?? []);
    if (url.includes('/communications/emails/412/reply/')) return ok({ id: 900, direction: 'sent', subject: 'Re: revised renewal terms' }, 201);
    const results = overrides.rows ?? [emailRow, ticketRow];
    const kind = new URL(url, 'http://localhost').searchParams.get('kind');
    const filtered = kind ? results.filter((r) => (r as { kind: string }).kind === kind) : results;
    return ok({ count: filtered.length, next: null, previous: null, results: filtered, truncated: false, mode: 'needs', scope: 'mine' });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage(path = '/communications') {
  const store = configureStore({
    reducer: { communications: communicationsReducer, mail: mailReducer, connectors: connectorsReducer },
    // The sidebar's group normally fetches these; the page only reads them.
    preloadedState: {
      mail: { connection: { id: 1, provider: 'google', provider_display: 'Google', address: 'alice@acme.io', status: 'connected' }, providers: [], loaded: true, saving: false, error: null, sending: false, sendError: null } as unknown as ReturnType<typeof mailReducer>,
      connectors: { items: [{ id: 5, provider: 'zendesk', provider_display: 'Zendesk', name: 'Support desk', status: 'connected', is_enabled: true, department: '', department_display: '', customers: [], accounts: [], is_organisation_wide: true, ticket_count: 3, call_count: 0, last_record_at: null, has_credentials: true, config: {} }], isLoading: false, error: null, saving: false, saveError: null } as unknown as ReturnType<typeof connectorsReducer>,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <CommunicationsPage />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('CommunicationsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('lists the inbox with its waiting time, grouped by month', async () => {
    mockApi();
    renderPage();
    const queue = await screen.findByRole('region', { name: /queue/i });
    expect(await within(queue).findByText('Dana Whitfield')).toBeInTheDocument();
    expect(within(queue).getByText('9d waiting')).toBeInTheDocument();
    expect(within(queue).getByText('Zendesk #4182')).toBeInTheDocument();
    expect(within(queue).getByRole('heading', { level: 3, name: /September/ })).toBeInTheDocument();
  });

  it('shows the folders with their counts and a dash for replies when no mailbox has been read, and no nag', async () => {
    mockApi({ stats: { has_mailbox: false, counts: { email: 0, question: 0, ticket: 1, call: 0 }, total: 1 } });
    renderPage();
    const folders = await screen.findByRole('navigation', { name: /folders/i });
    expect(within(folders).getByRole('button', { name: /Replies owed/ })).toHaveTextContent('–');
    expect(within(folders).getByRole('button', { name: /Open tickets/ })).toHaveTextContent('1');
    expect(screen.queryByRole('button', { name: /connect mailbox/i })).not.toBeInTheDocument();
  });

  it('a folder narrows the inbox to one kind', async () => {
    const spy = mockApi();
    renderPage();
    await screen.findByText('Dana Whitfield');
    await userEvent.click(screen.getByRole('button', { name: /Open tickets/ }));
    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.stringContaining('kind=ticket'), expect.anything()));
    const queue = await screen.findByRole('region', { name: /queue/i });
    await waitFor(() => expect(within(queue).queryByText('Dana Whitfield')).not.toBeInTheDocument());
    expect(within(queue).getByText('Zendesk #4182')).toBeInTheDocument();
  });

  it('opens an item in place, with the account context above the composer, and goes back', async () => {
    mockApi();
    renderPage();
    await userEvent.click(await screen.findByText('Dana Whitfield'));
    const detail = await screen.findByRole('region', { name: /selected item/i });
    expect(within(detail).getByText('34d')).toBeInTheDocument();
    expect(within(detail).getByText('$128.4K')).toBeInTheDocument();
    expect(within(detail).getByRole('button', { name: /send reply/i })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /^Inbox$/ }));
    expect(await screen.findByRole('region', { name: /queue/i })).toBeInTheDocument();
  });

  it('arriving from a source in the sidebar narrows the inbox and becomes the Copilot context', async () => {
    const spy = mockApi();
    renderPage('/communications?source=connector%3A5');
    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.stringContaining('kind=ticket'), expect.anything()));
    const copilot = await screen.findByRole('complementary', { name: /copilot/i });
    expect(await within(copilot).findByText('Support desk')).toBeInTheDocument();
  });

  it('the Copilot rail sends a real message and can be hidden from the top bar', async () => {
    mockApi();
    renderPage();
    const copilot = await screen.findByRole('complementary', { name: /copilot/i });
    await userEvent.type(within(copilot).getByPlaceholderText('Ask Revenact'), 'What is waiting?{enter}');
    expect(await within(copilot).findByText('Two tickets and one reply.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /hide copilot/i }));
    expect(screen.queryByRole('complementary', { name: /copilot/i })).not.toBeInTheDocument();
    expect(localStorage.getItem('revenact_comms_copilot')).toBe('off');
  });

  it('History opens as a panel of scheduled tasks and searchable, collapsible recents', async () => {
    mockApi({
      conversations: [
        { id: 1, title: 'Which renewals are at risk?', created_at: '', updated_at: '' },
        { id: 2, title: 'What is going on with Pizza Hut?', created_at: '', updated_at: '' },
      ],
    });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /^history$/i }));
    const panel = screen.getByRole('dialog', { name: 'History' });
    // Scheduling does not exist yet, so the plus is honest about it rather than opening a form.
    expect(within(panel).getByText('No scheduled tasks yet')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: /new scheduled task/i })).toBeDisabled();
    expect(await within(panel).findByText('Which renewals are at risk?')).toBeInTheDocument();

    await userEvent.type(within(panel).getByPlaceholderText('Search chats…'), 'pizza');
    expect(within(panel).queryByText('Which renewals are at risk?')).not.toBeInTheDocument();
    expect(within(panel).getByText('What is going on with Pizza Hut?')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('button', { name: /collapse recents/i }));
    expect(within(panel).queryByText('What is going on with Pizza Hut?')).not.toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: /expand recents/i }));
    expect(within(panel).getByText('What is going on with Pizza Hut?')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('button', { name: /close history/i }));
    expect(screen.queryByRole('dialog', { name: 'History' })).not.toBeInTheDocument();
  });

  it('replies to a queue email from the mailbox and says so', { timeout: 15000 }, async () => {
    const spy = mockApi();
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Dana Whitfield/ }));
    const pane = await screen.findByRole('region', { name: 'Conversation' });
    await userEvent.type(within(pane).getByLabelText('Reply'), 'Thursday works.');
    await userEvent.click(within(pane).getByRole('button', { name: 'Send reply' }));
    expect(await within(pane).findByRole('status')).toHaveTextContent(/Sent/);
    const call = spy.mock.calls.find(([url, init]) => String(url).includes('/communications/emails/412/reply/') && init?.method === 'POST');
    expect(call).toBeTruthy();
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ body: 'Thursday works.' });
  });

  it('treats an empty inbox as inbox zero', async () => {
    mockApi({ rows: [], stats: { total: 0, oldest_waiting_days: null, counts: { email: 0, question: 0, ticket: 0, call: 0 } } });
    renderPage();
    expect(await screen.findByText('Inbox zero')).toBeInTheDocument();
    expect(screen.getByText(/nothing between you and the rest of the day/i)).toBeInTheDocument();
  });

  it('regression: the rail still sends the source as a text prefix and no structured context', async () => {
    const spy = mockApi();
    renderPage('/communications?source=connector%3A5');
    const copilot = await screen.findByRole('complementary', { name: /copilot/i });
    expect(await within(copilot).findByText('Support desk')).toBeInTheDocument();
    expect(within(copilot).getByText('Nothing scheduled')).toBeInTheDocument();
    await userEvent.type(within(copilot).getByPlaceholderText('Ask Revenact'), 'What is waiting?{enter}');
    expect(await within(copilot).findByText('Two tickets and one reply.')).toBeInTheDocument();
    const call = spy.mock.calls.find(([url, init]) => String(url).includes('/copilot/messages/') && init?.method === 'POST');
    expect(JSON.parse(String(call?.[1]?.body))).toEqual({ content: '[About: Support desk] What is waiting?' });
  });

  it('opens a dashboard conversation as plain text, with its tag, without leaving Communications', async () => {
    const origin = { surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { owner: '2', lifecycle: '', customer: '' } };
    mockApi({
      conversations: [{ id: 9, title: 'Why is at-risk ARR up?', created_at: '', updated_at: '', origin }],
      conversation: {
        id: 9, title: 'Why is at-risk ARR up?', created_at: '', updated_at: '', origin,
        messages: [
          { id: 1, role: 'user', content: 'Why is at-risk ARR up?', context: { ...origin, focus: null }, sources: [], questions: [] },
          { id: 2, role: 'assistant', content: 'Two renewals slipped.', sources: [], questions: [] },
        ],
      },
    });
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /^history$/i }));
    const panel = screen.getByRole('dialog', { name: 'History' });
    expect(await within(panel).findByText('Revenue › Forecast')).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: /Why is at-risk ARR up\?/ }));
    const copilot = await screen.findByRole('complementary', { name: /copilot/i });
    expect(await within(copilot).findByText('Two renewals slipped.')).toBeInTheDocument();
    expect(within(copilot).queryByText('Revenue › Forecast · Owner: 2')).not.toBeInTheDocument();
  });

  it('explains a failure rather than showing half a picture', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/communications/stats/')) return Promise.resolve({ ok: true, status: 200, json: async () => stats });
        if (url.includes('/communications/')) return Promise.resolve({ ok: false, status: 500, json: async () => ({ detail: 'Server error.' }) });
        if (url.includes('/connectors/')) return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ connection: null, providers: [] }) });
      })
    );
    renderPage();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not load your inbox/i);
    expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
