import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import communicationsReducer from '../../features/communications/communicationsSlice';
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

function mockApi(overrides: { rows?: unknown[]; stats?: Record<string, unknown> } = {}) {
  const spy = vi.fn<(url: string) => Promise<unknown>>((url) => {
    const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body });
    if (url.includes('/communications/stats/')) {
      return ok({ ...stats, ...(overrides.stats ?? {}) });
    }
    const results = overrides.rows ?? [emailRow, ticketRow];
    const kind = new URL(url, 'http://localhost').searchParams.get('kind');
    const filtered = kind ? results.filter((r) => (r as { kind: string }).kind === kind) : results;
    return ok({
      count: filtered.length,
      next: null,
      previous: null,
      results: filtered,
      truncated: false,
      mode: 'needs',
      scope: 'mine',
    });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPage() {
  const store = configureStore({ reducer: { communications: communicationsReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CommunicationsPage />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('CommunicationsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('says how much is waiting and how long the worst has waited', async () => {
    mockApi();
    renderPage();
    expect(await screen.findByText(/2 things are waiting on you/i)).toBeInTheDocument();
    expect(screen.getByText(/oldest has waited 9 days/i)).toBeInTheDocument();
  });

  it('lists the queue with its waiting time, longest first', async () => {
    mockApi();
    renderPage();
    const queue = await screen.findByRole('region', { name: /queue/i });
    const rows = within(queue).getAllByRole('button');
    expect(rows[0]).toHaveTextContent('Dana Whitfield');
    expect(rows[0]).toHaveTextContent('9d');
    expect(rows[1]).toHaveTextContent('Zendesk #4182');
  });

  it('shows the account context above the composer, which is the point of the page', async () => {
    mockApi();
    renderPage();
    const detail = await screen.findByRole('region', { name: /selected item/i });
    expect(within(detail).getByText('34d')).toBeInTheDocument();
    expect(within(detail).getByText('$128.4K')).toBeInTheDocument();
    expect(within(detail).getByText('5.2')).toBeInTheDocument();
    expect(within(detail).getByText('Carl')).toBeInTheDocument();
  });

  it('selects the first row without being asked, so the pane is never empty beside a full list', async () => {
    mockApi();
    renderPage();
    const detail = await screen.findByRole('region', { name: /selected item/i });
    expect(within(detail).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Re: revised renewal terms'
    );
  });

  it('changes the pane when another row is chosen', async () => {
    mockApi();
    renderPage();
    const queue = await screen.findByRole('region', { name: /queue/i });
    await userEvent.click(within(queue).getAllByRole('button')[1]);

    const detail = screen.getByRole('region', { name: /selected item/i });
    expect(within(detail).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Login fails for SSO users'
    );
  });

  it('offers the right composer per channel, and a link out for a ticket', async () => {
    mockApi();
    renderPage();
    const detail = await screen.findByRole('region', { name: /selected item/i });
    expect(within(detail).getByRole('button', { name: /send reply/i })).toBeInTheDocument();

    const queue = screen.getByRole('region', { name: /queue/i });
    await userEvent.click(within(queue).getAllByRole('button')[1]);
    expect(
      within(screen.getByRole('region', { name: /selected item/i })).getByRole('link', {
        name: /open in the source system/i,
      })
    ).toHaveAttribute('href', ticketRow.external_url);
  });

  it('cannot send an empty reply', async () => {
    mockApi();
    renderPage();
    const detail = await screen.findByRole('region', { name: /selected item/i });
    expect(within(detail).getByRole('button', { name: /send reply/i })).toBeDisabled();

    await userEvent.type(within(detail).getByLabelText(/reply/i), 'On its way.');
    expect(within(detail).getByRole('button', { name: /send reply/i })).toBeEnabled();
  });

  it('a tile filters the queue, and clicking it again clears the filter', async () => {
    const spy = mockApi();
    renderPage();
    await screen.findByRole('region', { name: /queue/i });

    const tile = screen.getByRole('button', { name: /open tickets/i });
    await userEvent.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    expect(spy.mock.calls.some(([url]) => String(url).includes('kind=ticket'))).toBe(true);

    const queue = screen.getByRole('region', { name: /queue/i });
    expect(within(queue).getAllByRole('button')).toHaveLength(1);

    await userEvent.click(tile);
    expect(tile).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows a dash rather than a zero when no mailbox has ever been read', async () => {
    mockApi({ stats: { has_mailbox: false, counts: { email: 0, question: 1, ticket: 0, call: 0 } } });
    renderPage();
    const tile = await screen.findByRole('button', { name: /replies owed/i });
    expect(tile).toHaveTextContent('—');
    expect(tile).toHaveTextContent(/no mailbox connected/i);
    expect(screen.getByRole('link', { name: /connect mailbox/i })).toBeInTheDocument();
  });

  it('treats an empty queue as an achievement, not a blank', async () => {
    mockApi({ rows: [], stats: { total: 0, oldest_waiting_days: null, counts: { email: 0, question: 0, ticket: 0, call: 0 } } });
    renderPage();
    expect(await screen.findByText(/you are clear/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /see everything/i })).toBeInTheDocument();
  });

  it('explains a failure rather than showing half a picture', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/stats/')) {
          return { ok: true, status: 200, json: async () => stats };
        }
        return { ok: false, status: 500, json: async () => ({ detail: 'Server error.' }) };
      })
    );
    renderPage();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not load your queue/i);
    expect(alert).toHaveTextContent(/rather than part of it/i);
    expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('switching scope refetches for the team', async () => {
    const spy = mockApi();
    renderPage();
    await screen.findByRole('region', { name: /queue/i });

    await userEvent.selectOptions(screen.getByLabelText(/showing/i), 'team');
    expect(spy.mock.calls.some(([url]) => String(url).includes('scope=team'))).toBe(true);
  });
});

describe('when one channel is over the cap', () => {
  it('does not let the queue header argue with the tile', async () => {
    // The server capped the merge at 203 rows while 283 are really waiting.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
        if (String(url).includes('/stats/')) {
          return ok({ ...stats, total: 283, counts: { email: 2, question: 1, ticket: 280, call: 0 } });
        }
        return ok({
          count: 203,
          next: null,
          previous: null,
          results: [emailRow],
          truncated: true,
          mode: 'needs',
          scope: 'mine',
        });
      })
    );
    renderPage();
    const queue = await screen.findByRole('region', { name: /queue/i });
    expect(within(queue).getByText(/1 shown of 283 waiting/i)).toBeInTheDocument();
    expect(screen.getByText(/more than we show is outstanding/i)).toBeInTheDocument();
  });
});
