import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import interactionsReducer from '../../../../features/interactions/interactionsSlice';
import { AITrendingTopics } from '../AITrendingTopics';
import { ControlsView } from './ControlsView';
import { compact, niceMax, percentOf } from './chartTheme';

// Integration tier: container + view + charts through the real router, with only
// the fetch boundary mocked. Recharts needs a sized container, which jsdom
// doesn't give it — so these assert on the numbers, labels and controls, not on
// rendered SVG paths.

const stats = {
  total: 981,
  classified: 981,
  by_type: [
    { key: 'email', name: 'Email', value: 64 },
    { key: 'call', name: 'Call', value: 182 },
    { key: 'ticket', name: 'Ticket', value: 735 },
  ],
  sentiment: [
    { key: 'positive', name: 'Positive', value: 578 },
    { key: 'neutral', name: 'Neutral', value: 246 },
    { key: 'negative', name: 'Negative', value: 157 },
  ],
  areas: [
    { key: 'product_growth', name: 'Product & Growth', value: 407 },
    { key: 'support_operations', name: 'Support & Operations', value: 309 },
    { key: 'customer_success', name: 'Customer Success', value: 265 },
  ],
  categories: [
    { key: 'account_management', name: 'Account Management', value: 235 },
    { key: 'reporting_analytics', name: 'Reporting & Analytics', value: 195 },
  ],
  subcategories: [
    { key: 'user_access', name: 'User Access', value: 165 },
    { key: 'export_problem', name: 'Export Problem', value: 132 },
  ],
  sentiment_timeline: [
    { date: 'Sep 15, 2025', positive: 2, neutral: 1, negative: 0 },
    { date: 'Sep 22, 2025', positive: 1, neutral: 3, negative: 1 },
  ],
  recent: [
    {
      id: 'call:93',
      source: 'Call',
      account: 'WeWork',
      title: 'Expansion Discovery Call',
      sentiment: 'Neutral',
      area: 'Customer Success',
      category: 'Account Management',
      subcategory: 'User Access',
      keys: { sentiment: 'neutral', area: 'product_growth', category: 'bug_report', subcategory: 'ui_bug' },
      corrected: false,
      occurred_on: '2026-09-10',
    },
    {
      id: 'email:12',
      source: 'Email',
      account: 'Apple Inc',
      title: 'Export to CSV is missing columns',
      sentiment: 'Negative',
      area: '',
      category: '',
      subcategory: '',
      keys: { sentiment: 'neutral', area: 'product_growth', category: 'bug_report', subcategory: 'ui_bug' },
      corrected: false,
      occurred_on: '2026-09-08',
    },
  ],
  filters: {
    customers: [{ id: 7, name: 'Pizza Hut' }],
    accounts: [{ id: 2, name: 'Apple EMEA' }],
    types: [
      { value: 'email', name: 'Email' },
      { value: 'call', name: 'Call' },
      { value: 'ticket', name: 'Ticket' },
    ],
    sentiments: [
      { value: 'positive', name: 'Positive' },
      { value: 'negative', name: 'Negative' },
    ],
    areas: [{ value: 'product_growth', name: 'Product & Growth' }],
    categories: [
      { value: 'bug_report', name: 'Bug Report' },
      { value: 'onboarding', name: 'Onboarding' },
    ],
    subcategories: [
      { value: 'ui_bug', name: 'UI Bug', category: 'bug_report' },
      { value: 'setup_assistance', name: 'Setup Assistance', category: 'onboarding' },
    ],
    revenue_brackets: [
      { value: 'under_25k', name: 'Under $25K' },
      { value: 'over_100k', name: '$100K and above' },
    ],
  },
};

function mockFetch(body: unknown = stats, status = 200) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(() =>
    Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body })
  );
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderDashboard() {
  const store = configureStore({ reducer: { interactions: interactionsReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/ai-trending/controls']}>
        <Routes>
          <Route path="/ai-trending" element={<AITrendingTopics />}>
            <Route path="controls" element={<ControlsView />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

/** The last URL fetch was called with, for asserting on the query string. */
function lastUrl(spy: ReturnType<typeof mockFetch>) {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}

describe('AI Trending Topics', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches real stats on mount instead of reading a fixture', async () => {
    const fetchMock = mockFetch();
    renderDashboard();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/interactions/stats/'),
        expect.objectContaining({ method: 'GET' })
      )
    );
  });

  it('renders the real source counts', async () => {
    mockFetch();
    renderDashboard();

    // Three donut centres legitimately read 981: source and sentiment each
    // partition every interaction, and area does too when all of them are
    // classified. That agreement is the point — if one disagreed, one of the
    // three aggregations would be wrong — so this asserts all three summed
    // what the API sent rather than that the number is unique on the page.
    expect(await screen.findAllByText('981')).toHaveLength(3);
  });

  it('renders the detail table from the API, including a classified row', async () => {
    mockFetch();
    renderDashboard();

    const row = (await screen.findByText('Expansion Discovery Call')).closest('tr')!;

    expect(within(row).getByText('Call')).toBeInTheDocument();
    expect(within(row).getByText('WeWork')).toBeInTheDocument();
    expect(within(row).getByText('Account Management')).toBeInTheDocument();
    expect(within(row).getByText('User Access')).toBeInTheDocument();
  });

  it('shows a dash rather than a blank for an unclassified row', async () => {
    mockFetch();
    renderDashboard();

    const row = (await screen.findByText('Export to CSV is missing columns')).closest('tr')!;

    // Three taxonomy columns, all empty in the payload.
    expect(within(row).getAllByText('—')).toHaveLength(3);
  });

  it('says how much of the book is classified when some of it is not', async () => {
    mockFetch({ ...stats, classified: 600 });
    renderDashboard();

    // Three taxonomy charts, each carrying the same note.
    const notes = await screen.findAllByText(/600 of 981 classified/);
    expect(notes).toHaveLength(3);
    expect(notes[0]).toHaveTextContent('381 not yet counted here');
  });

  it('says nothing about classification when everything is classified', async () => {
    mockFetch();
    renderDashboard();

    await screen.findByText('Expansion Discovery Call');
    expect(screen.queryByText(/classified/)).not.toBeInTheDocument();
  });

  // ── the filter bar ────────────────────────────────────────────────

  it('offers the real filter options rather than a hardcoded list', async () => {
    mockFetch();
    renderDashboard();

    const sentiment = await screen.findByLabelText('Sentiment');
    expect(within(sentiment).getByRole('option', { name: 'Positive' })).toBeInTheDocument();
    expect(within(sentiment).getByRole('option', { name: 'Negative' })).toBeInTheDocument();

    const brackets = screen.getByLabelText('Revenue Bracket');
    expect(within(brackets).getByRole('option', { name: 'Under $25K' })).toBeInTheDocument();
  });

  it('refetches with a query string when a filter changes', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Sentiment');
    await user.selectOptions(screen.getByLabelText('Sentiment'), 'negative');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('sentiment=negative'));
  });

  it('sends the right param for an organisation and for an account', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Account Name');
    await user.selectOptions(screen.getByLabelText('Account Name'), 'customer:7');
    await waitFor(() => expect(lastUrl(fetchMock)).toContain('customer=7'));

    await user.selectOptions(screen.getByLabelText('Account Name'), 'account:2');
    await waitFor(() => expect(lastUrl(fetchMock)).toContain('account=2'));
  });

  it('narrows the subcategory options to the chosen category', async () => {
    mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('AI Category');
    await user.selectOptions(screen.getByLabelText('AI Category'), 'bug_report');

    const subcategory = screen.getByLabelText('AI Subcategory');
    expect(within(subcategory).getByRole('option', { name: 'UI Bug' })).toBeInTheDocument();
    expect(
      within(subcategory).queryByRole('option', { name: 'Setup Assistance' })
    ).not.toBeInTheDocument();
  });

  it('clears a subcategory that no longer belongs to the chosen category', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('AI Subcategory');
    await user.selectOptions(screen.getByLabelText('AI Subcategory'), 'ui_bug');
    await waitFor(() => expect(lastUrl(fetchMock)).toContain('subcategory=ui_bug'));

    // Picking a category the subcategory doesn't belong to would otherwise send
    // a self-contradicting pair and empty every chart for no visible reason.
    await user.selectOptions(screen.getByLabelText('AI Category'), 'onboarding');

    await waitFor(() => expect(lastUrl(fetchMock)).toContain('category=onboarding'));
    expect(lastUrl(fetchMock)).not.toContain('subcategory=');
  });

  it('counts the active filters and clears them all', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByLabelText('Sentiment');
    await user.selectOptions(screen.getByLabelText('Sentiment'), 'negative');
    await user.selectOptions(screen.getByLabelText('Activity Type'), 'call');

    await user.click(await screen.findByRole('button', { name: 'Clear 2' }));

    await waitFor(() => expect(lastUrl(fetchMock)).toMatch(/\/interactions\/stats\/$/));
  });

  // ── failure and empty states ──────────────────────────────────────

  it('surfaces a failed fetch rather than rendering empty charts silently', async () => {
    mockFetch({ detail: 'Server exploded' }, 500);
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });

  it('says so when nothing matches the filters', async () => {
    mockFetch({
      ...stats,
      total: 0,
      classified: 0,
      by_type: [],
      sentiment: [],
      areas: [],
      categories: [],
      subcategories: [],
      sentiment_timeline: [],
      recent: [],
    });
    renderDashboard();

    expect(
      await screen.findByText('No emails, calls or tickets match these filters.')
    ).toBeInTheDocument();
    expect(screen.getByText('No activity matches these filters.')).toBeInTheDocument();
    expect(screen.getByText('No activity in this period.')).toBeInTheDocument();
  });

  it('keeps the previous numbers on screen when a refetch fails', async () => {
    const fetchMock = mockFetch();
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Expansion Discovery Call');

    // A filter change that 500s shouldn't blank a dashboard that was showing
    // real numbers a moment ago.
    fetchMock.mockImplementation(() =>
      Promise.resolve({ ok: false, status: 500, json: async () => ({ detail: 'Nope' }) })
    );
    await user.selectOptions(screen.getByLabelText('Sentiment'), 'negative');

    await screen.findByRole('alert');
    expect(screen.getByText('Expansion Discovery Call')).toBeInTheDocument();
  });
});

describe('chartTheme', () => {
  it('niceMax rounds up past the data rather than clipping it', () => {
    // The mock's own `domain={[0, 150]}` silently cut anything taller.
    expect(niceMax([142, 65, 31])).toBe(200);
    // A single-digit peak is already a clean axis maximum, so it stays put.
    expect(niceMax([4, 7])).toBe(7);
  });

  it('niceMax falls back rather than returning zero for an empty chart', () => {
    expect(niceMax([])).toBe(10);
    expect(niceMax([0, 0])).toBe(10);
  });

  it('percentOf says 0 rather than NaN for an empty total', () => {
    expect(percentOf(0, 0)).toBe('0');
    expect(percentOf(157, 981)).toBe('16');
  });

  it('compact leaves counts under a thousand alone', () => {
    // The mock divided unconditionally, so 300 rendered as the longer "0.3K".
    expect(compact(300)).toBe('300');
    expect(compact(2090)).toBe('2.09K');
  });
});
