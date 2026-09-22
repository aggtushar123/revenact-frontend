import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { capabilitiesForRole } from '../../test/capabilities';
import { FeatureRequestsPage } from './FeatureRequests';
import { jsonResponse, requestFull, requestRow } from '../../test/requestsFixtures';

// Integration tier: the real page against the fetch boundary, responses
// shaped like the contract, a real store for the leadership gate.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function makeStore(role: 'admin' | 'csm' = 'admin') {
  return configureStore({
    reducer: { auth: authReducer },
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
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  return render(
    <Provider store={makeStore(role)}>
      <MemoryRouter>
        <FeatureRequestsPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('FeatureRequestsPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('ranks requests by the revenue behind them', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [
      requestRow(),
      requestRow({ id: 5, title: 'CSV export', arr: '45000', companies: 1, interactions: 1, last_90_days: 1, previous_90_days: 0 }),
    ]));
    renderPage();
    const rows = await screen.findAllByRole('row');
    expect(within(rows[1]).getByText('Slack alerts')).toBeInTheDocument();
    expect(within(rows[1]).getByText('$200.0K')).toBeInTheDocument();
    expect(within(rows[1]).getByText('2 companies')).toBeInTheDocument();
    expect(within(rows[2]).getByText('CSV export')).toBeInTheDocument();
  });

  it('filters by status', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [requestRow()]))
      .mockResolvedValueOnce(jsonResponse(200, [requestRow({ id: 5, title: 'CSV export', status: 'planned' })]));
    renderPage();
    await screen.findByText('Slack alerts');
    await userEvent.click(screen.getByRole('button', { name: 'Planned' }));
    expect(await screen.findByText('CSV export')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/requests\/\?status=planned$/);
  });

  it('opens one and shows the companies asking and the evidence', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [requestRow()]))
      .mockResolvedValueOnce(jsonResponse(200, requestFull()));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Open Slack alerts' }));
    expect(await screen.findByText('Push health alerts into a shared Slack channel.')).toBeInTheDocument();
    const companies = screen.getByRole('list', { name: 'Companies asking' });
    expect(within(companies).getAllByRole('listitem')).toHaveLength(2);
    expect(within(companies).getByRole('link', { name: /Pizza Hut/ })).toHaveAttribute('href', '/organizations/12');
    const evidence = screen.getByRole('list', { name: 'Evidence' });
    expect(within(evidence).getByText('Can we get alerts in Slack?')).toBeInTheDocument();
    expect(within(evidence).getByText('Slack notifications please')).toBeInTheDocument();
  });

  it('gathers and reports what it filed', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, []))
      .mockResolvedValueOnce(jsonResponse(200, { created: 2, linked: 5, remaining: 0 }))
      .mockResolvedValueOnce(jsonResponse(200, [requestRow()]));
    renderPage();
    await screen.findByText(/No feature requests yet/);
    await userEvent.click(screen.getByRole('button', { name: 'Gather asks' }));
    expect(await screen.findByRole('status')).toHaveTextContent('2 new requests from 5 asks');
    expect(await screen.findByText('Slack alerts')).toBeInTheDocument();
  });

  it('reports a gather that ran out of budget as an error, keeping what it filed', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, []))
      .mockResolvedValueOnce(jsonResponse(429, { created: 1, linked: 2, remaining: 3, detail: 'This organisation has spent its monthly model budget.' }));
    renderPage();
    await screen.findByText(/No feature requests yet/);
    await userEvent.click(screen.getByRole('button', { name: 'Gather asks' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/monthly model budget/);
  });

  it('changes a status from the detail pane', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [requestRow()]))
      .mockResolvedValueOnce(jsonResponse(200, requestFull()))
      .mockResolvedValueOnce(jsonResponse(200, requestFull({ status: 'planned' })))
      .mockResolvedValueOnce(jsonResponse(200, [requestRow({ status: 'planned' })]));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Open Slack alerts' }));
    await screen.findByRole('list', { name: 'Evidence' });
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'planned');
    const patch = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH');
    expect(JSON.parse((patch?.[1] as RequestInit).body as string)).toEqual({ status: 'planned' });
    expect(await screen.findByText('Planned')).toBeInTheDocument();
  });

  it('hides gathering and curating from a CSM but still shows the list', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, [requestRow()]));
    renderPage('csm');
    await screen.findByText('Slack alerts');
    expect(screen.queryByRole('button', { name: 'Gather asks' })).not.toBeInTheDocument();
    expect(screen.getByText(/only the companies you can open/i)).toBeInTheDocument();
  });

  it('shows the error with a retry', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, { detail: 'Boom' }))
      .mockResolvedValueOnce(jsonResponse(200, [requestRow()]));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Slack alerts')).toBeInTheDocument();
  });
});
