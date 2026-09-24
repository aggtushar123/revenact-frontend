import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import forecastReducer from '../../../features/forecast/forecastSlice';
import healthReducer from '../../../features/health/healthSlice';
import ticketsReducer from '../../../features/tickets/ticketsSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';
import { HeadlineCards } from './HeadlineCards';
import { mockOverviewFetch, urlsFor } from './fixtures';

// Integration tier: the three cards with the real slices, only fetch mocked.

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, forecast: forecastReducer, health: healthReducer, tickets: ticketsReducer },
  });
}

function renderCards(values = { owner: '2', lifecycle: '', customer: '' }, url = '/dashboard/overview?owner=2') {
  const store = makeStore();
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <HeadlineCards values={values} />
      </MemoryRouter>
    </Provider>,
  );
  return { store, ...view };
}

const card = (title: string) => screen.getByRole('heading', { name: title }).closest('section') as HTMLElement;

describe('HeadlineCards', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows each area’s figures, requested with the shared filters', async () => {
    const spy = mockOverviewFetch();
    renderCards();

    const revenue = card('Revenue');
    expect(await within(revenue).findByText('$924.7K')).toBeInTheDocument();
    expect(within(revenue).getByText(formatCompactMoney(175_430 + 33_120, 'USD'))).toBeInTheDocument();
    expect(within(revenue).getByText('At risk')).toBeInTheDocument();

    const health = card('Health');
    expect(await within(health).findByText('2/3')).toBeInTheDocument();
    expect(within(health).getByText('Book at Good')).toBeInTheDocument();
    expect(within(health).getByText('Needs action')).toBeInTheDocument();
    expect(within(health).getByText('1')).toBeInTheDocument();

    const support = card('Support');
    expect(await within(support).findByText('4')).toBeInTheDocument();
    expect(within(support).getByText('oldest 9 days')).toBeInTheDocument();

    const [forecastUrl] = urlsFor(spy, '/customers/forecast/');
    expect(forecastUrl).toContain('owner=2');
    expect(forecastUrl).toContain('horizon_days=365');
    const [ticketUrl] = urlsFor(spy, '/tickets/stats/');
    expect(ticketUrl).toContain('owner=2');
    expect(ticketUrl).not.toContain('lifecycle');
  });

  it('leaves lifecycle off the ticket request even when set', async () => {
    const spy = mockOverviewFetch();
    renderCards({ owner: '2', lifecycle: 'customer_active', customer: '12' }, '/dashboard/overview?owner=2&lifecycle=customer_active&customer=12');
    await waitFor(() => expect(urlsFor(spy, '/tickets/stats/')).toHaveLength(1));
    const [ticketUrl] = urlsFor(spy, '/tickets/stats/');
    expect(ticketUrl).toContain('customer=12');
    expect(ticketUrl).not.toContain('lifecycle');
    expect(urlsFor(spy, '/customers/forecast/')[0]).toContain('lifecycle=customer_active');
  });

  it('links each area carrying only the shared filters', async () => {
    mockOverviewFetch();
    renderCards({ owner: '2', lifecycle: '', customer: '' }, '/dashboard/overview?owner=2&days=30');
    expect(screen.getByRole('link', { name: 'Open Revenue →' })).toHaveAttribute('href', '/dashboard/revenue?owner=2');
    expect(screen.getByRole('link', { name: 'Open Health →' })).toHaveAttribute('href', '/dashboard/health?owner=2');
    expect(screen.getByRole('link', { name: 'Open Support →' })).toHaveAttribute('href', '/dashboard/support?owner=2');
    await screen.findByText('$924.7K');
  });

  it('copies the shared filters into Health and clears them on unmount', async () => {
    mockOverviewFetch();
    const { store, unmount } = renderCards();
    await waitFor(() => expect(store.getState().health.filters.owner).toBe('2'));
    unmount();
    expect(store.getState().health.filters).toEqual({ owner: null, lifecycle: null, account: null });
  });

  it('shows skeleton lines while loading', () => {
    // Never resolves: every card stays in its loading state.
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderCards();
    expect(screen.getAllByTestId('headline-skeleton')).toHaveLength(3);
  });

  it('shows a dash for a card whose fetch failed', async () => {
    mockOverviewFetch(['/tickets/stats/']);
    renderCards();
    const support = card('Support');
    expect(await within(support).findByText('—')).toBeInTheDocument();
    expect(await within(card('Revenue')).findByText('$924.7K')).toBeInTheDocument();
  });

  it('says none open when the queue is empty', async () => {
    const spy = mockOverviewFetch();
    const base = spy.getMockImplementation()!;
    spy.mockImplementation(async (url: string) => {
      if (!url.includes('/tickets/stats/')) return base(url);
      const { ticketStatsBody } = await import('./fixtures');
      const body = { ...ticketStatsBody, kpis: { ...ticketStatsBody.kpis, open_count: 0, oldest_open_days: null } };
      return { ok: true, status: 200, json: async () => body };
    });
    renderCards();
    expect(await within(card('Support')).findByText('none open')).toBeInTheDocument();
  });
});
