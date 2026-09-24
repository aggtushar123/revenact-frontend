import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import forecastReducer from '../../features/forecast/forecastSlice';
import healthReducer from '../../features/health/healthSlice';
import ticketsReducer from '../../features/tickets/ticketsSlice';
import { dashboardRoutes } from './routes';
import { mockOverviewFetch, urlsFor } from './overview/fixtures';

// End-to-end tier (DOM-level): the real dashboard route tree — frame, drill
// provider, Overview, toolbar, list and cards — with only fetch mocked.

function renderOverview(url: string) {
  const store = configureStore({
    reducer: { auth: authReducer, forecast: forecastReducer, health: healthReducer, tickets: ticketsReducer },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>{dashboardRoutes()}</Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('Overview', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the attention list with the shared filters', async () => {
    const spy = mockOverviewFetch();
    renderOverview('/dashboard/overview?owner=2');
    expect(await screen.findByRole('link', { name: 'Uber' })).toHaveAttribute('href', '/organizations/12');
    expect(urlsFor(spy, '/dashboard/attention/')[0]).toContain('owner=2');
  });

  it('renders the book filters with options from the response', async () => {
    mockOverviewFetch();
    renderOverview('/dashboard/overview');
    await screen.findByRole('link', { name: 'Uber' });
    expect(within(screen.getByLabelText('Primary Owner')).getByRole('option', { name: 'Carl CSM' })).toBeInTheDocument();
    expect(within(screen.getByLabelText('Lifecycle Stage')).getByRole('option', { name: 'Active' })).toBeInTheDocument();
    expect(within(screen.getByLabelText('Account')).getByRole('option', { name: 'Uber' })).toBeInTheDocument();
    // No sub-view switch on the Overview.
    expect(screen.queryByRole('navigation', { name: 'Views' })).not.toBeInTheDocument();
  });

  it('refetches when a filter changes', async () => {
    const spy = mockOverviewFetch();
    renderOverview('/dashboard/overview');
    await screen.findByRole('link', { name: 'Uber' });
    expect(urlsFor(spy, '/dashboard/attention/')).toHaveLength(1);
    await userEvent.selectOptions(screen.getByLabelText('Primary Owner'), '2');
    await waitFor(() => expect(urlsFor(spy, '/dashboard/attention/')).toHaveLength(2));
    expect(urlsFor(spy, '/dashboard/attention/')[1]).toContain('owner=2');
    // The previous list stays on screen while the refetch runs.
    expect(screen.getByRole('link', { name: 'Uber' })).toBeInTheDocument();
  });

  it('shows the error state when the list fails, not an empty list', async () => {
    mockOverviewFetch(['/dashboard/attention/']);
    renderOverview('/dashboard/overview');
    expect(await screen.findByText('Could not load what needs attention.')).toBeInTheDocument();
    expect(screen.queryByText('Nothing needs you right now.')).not.toBeInTheDocument();
  });
});
