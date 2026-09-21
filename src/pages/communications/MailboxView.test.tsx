import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import communicationsReducer from '../../features/communications/communicationsSlice';
import mailReducer from '../../features/mail/mailSlice';
import mailboxReducer from '../../features/mail/mailboxSlice';
import connectorsReducer from '../../features/connectors/connectorsSlice';
import CommunicationsPage from './CommunicationsPage';

const invoice = {
  id: 1,
  thread_id: 't1',
  direction: 'received' as const,
  from_name: 'Circleback',
  from_address: 'billing@circleback.ai',
  to: [['Dana', 'dana@acme.io']],
  subject: 'Subscription renewal',
  snippet: 'Your plan renews on 1 October.',
  sent_at: '2026-09-20T09:00:00Z',
  folder: 'inbox' as const,
  category: 'financial' as const,
  state: 'open' as const,
  is_read: false,
  is_starred: false,
  is_important: false,
  priority: false,
  account: null,
};

const pizza = {
  ...invoice,
  id: 2,
  from_name: 'Sam Pizza',
  from_address: 'sam@pizzahut.com',
  subject: 'Re: revised terms',
  snippet: 'Can we talk Thursday?',
  sent_at: '2026-08-14T09:00:00Z',
  category: 'general' as const,
  is_read: true,
  priority: true,
  account: { id: 3, name: 'Pizza Hut', type: 'customer' as const },
};

const summary = {
  has_mailbox: true,
  address: 'dana@acme.io',
  last_synced_at: '2026-09-21T10:00:00Z',
  folders: { inbox: 2, drafts: 1, sent: 4, done: 0, muted: 0 },
  unread: 1,
  categories: [{ category: 'financial', label: 'Financial', count: 2, subjects: ['Subscription renewal', 'Invoice 1042'], senders: ['Circleback'], more_senders: 1 }],
};

function mockApi() {
  const calls: string[] = [];
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url, init) => {
    calls.push(`${init?.method ?? 'GET'} ${url}`);
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: status < 400, status, json: async () => body });
    if (url.includes('/mail/messages/summary/')) return ok(summary);
    if (url.includes('/mail/messages/2/reply/')) return ok({ ...pizza, id: 9, direction: 'sent', folder: 'sent' }, 201);
    if (url.includes('/mail/messages/1/') && init?.method === 'PATCH') return ok({ ...invoice, ...JSON.parse(String(init.body)), body: 'Your plan renews on 1 October. Nothing to do.' });
    if (url.includes('/mail/messages/1/')) return ok({ ...invoice, body: 'Your plan renews on 1 October. Nothing to do.' });
    if (url.includes('/mail/messages/2/')) return ok({ ...pizza, body: 'Can we talk Thursday? Sam' });
    if (url.includes('/mail/messages/')) {
      const params = new URL(url, 'http://localhost').searchParams;
      let rows = [invoice, pizza];
      if (params.get('category') === 'financial') rows = [invoice];
      if (params.get('folder') === 'sent') rows = [];
      return ok({ count: rows.length, next: null, previous: null, results: rows });
    }
    if (url.includes('/communications/stats/')) return ok({ counts: { email: 0, question: 0, ticket: 0, call: 0 }, total: 0, oldest_waiting_days: null, stale_questions: 0, has_mailbox: true, scope: 'mine', ticket_scope_note: '' });
    if (url.includes('/communications/')) return ok({ count: 0, next: null, previous: null, results: [], truncated: false, mode: 'needs', scope: 'mine' });
    if (url.includes('/copilot/conversations/')) return ok([]);
    return ok({});
  });
  vi.stubGlobal('fetch', spy);
  return calls;
}

function renderMailbox() {
  const store = configureStore({
    reducer: { communications: communicationsReducer, mail: mailReducer, mailbox: mailboxReducer, connectors: connectorsReducer },
    preloadedState: {
      mail: { connection: { id: 1, provider: 'google', provider_display: 'Google', address: 'dana@acme.io', status: 'connected' }, providers: [], loaded: true, saving: false, error: null, sending: false, sendError: null } as unknown as ReturnType<typeof mailReducer>,
      connectors: { items: [], isLoading: false, error: null, saving: false, saveError: null } as unknown as ReturnType<typeof connectorsReducer>,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/communications?source=mailbox:google']}>
        <CommunicationsPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('MailboxView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows the whole mailbox: folders with counts, the categories block, and the list by month', { timeout: 15000 }, async () => {
    mockApi();
    renderMailbox();
    const mailbox = await screen.findByRole('region', { name: 'Mailbox' });
    const folders = within(mailbox).getByRole('navigation', { name: 'Folders' });
    expect(within(folders).getByRole('button', { name: /^Inbox/ })).toHaveTextContent('2');
    expect(within(folders).getByRole('button', { name: /^Sent/ })).toHaveTextContent('4');
    expect(within(mailbox).getByText('dana@acme.io')).toBeInTheDocument();
    expect(within(mailbox).getByText('1 unread')).toBeInTheDocument();

    const block = await within(mailbox).findByRole('region', { name: 'Waiting by category' });
    expect(within(block).getByText('Subscription renewal, Invoice 1042')).toBeInTheDocument();
    expect(within(block).getByText(/Circleback · \+1/)).toBeInTheDocument();

    expect(await within(mailbox).findByRole('region', { name: 'September' })).toBeInTheDocument();
    expect(within(mailbox).getByRole('region', { name: 'August' })).toBeInTheDocument();
    expect(within(mailbox).getByRole('img', { name: 'Unread message' })).toBeInTheDocument();
    expect(within(mailbox).getByText('Pizza Hut')).toBeInTheDocument();
  });

  it('a category block narrows the list, and the switches are real parameters', { timeout: 15000 }, async () => {
    const calls = mockApi();
    renderMailbox();
    const mailbox = await screen.findByRole('region', { name: 'Mailbox' });
    await within(mailbox).findByRole('region', { name: 'August' });
    await userEvent.click(within(mailbox).getByRole('button', { name: /Subscription renewal, Invoice 1042/ }));
    await waitFor(() => expect(calls.some((c) => c.includes('/mail/messages/?category=financial'))).toBe(true));
    await waitFor(() => expect(within(mailbox).queryByRole('region', { name: 'August' })).not.toBeInTheDocument());
    await userEvent.click(within(mailbox).getByRole('switch', { name: 'Unread' }));
    await waitFor(() => expect(calls.some((c) => c.includes('category=financial&unread=true'))).toBe(true));
    await userEvent.click(within(mailbox).getByRole('button', { name: /^Sent/ }));
    await waitFor(() => expect(calls.some((c) => c.includes('/mail/messages/?folder=sent'))).toBe(true));
    expect(await within(mailbox).findByText('Nothing here')).toBeInTheDocument();
  });

  it('opens a message in place, marks it read, and replies from the mailbox', { timeout: 15000 }, async () => {
    const calls = mockApi();
    renderMailbox();
    const mailbox = await screen.findByRole('region', { name: 'Mailbox' });
    await within(mailbox).findByRole('region', { name: 'September' });
    await userEvent.click(within(mailbox).getByRole('button', { name: /Subscription renewal: Your plan renews/ }));
    expect(await within(mailbox).findByText('Your plan renews on 1 October. Nothing to do.')).toBeInTheDocument();
    await waitFor(() => expect(calls.some((c) => c.startsWith('PATCH') && c.includes('/mail/messages/1/'))).toBe(true));

    await userEvent.click(within(mailbox).getByRole('button', { name: /^Inbox$/ }));
    await userEvent.click(await within(mailbox).findByRole('button', { name: /Re: revised terms/ }));
    const message = await within(mailbox).findByRole('region', { name: 'Message' });
    expect(await within(message).findByText('Can we talk Thursday? Sam')).toBeInTheDocument();
    expect(within(message).getByRole('link', { name: /Pizza Hut/ })).toHaveAttribute('href', '/organizations/3');
    expect(within(message).getByText(/filed on Pizza Hut/)).toBeInTheDocument();
    await userEvent.type(within(message).getByLabelText('Reply'), 'Thursday works.');
    await userEvent.click(within(message).getByRole('button', { name: 'Send reply' }));
    expect(await within(message).findByRole('status')).toHaveTextContent('Sent from your mailbox.');
    expect(calls.some((c) => c.startsWith('POST') && c.includes('/mail/messages/2/reply/'))).toBe(true);
  });
});
