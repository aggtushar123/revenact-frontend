import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { capabilitiesForRole } from '../../test/capabilities';
import { AnomaliesPage } from './Anomalies';
import type { AnomalyDetail, AnomalyRow } from '../../features/anomalies/anomaliesApi';

// Integration tier: the real page against the fetch boundary, responses
// shaped like docs/API_CONTRACTS.md's `anomalies` section.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

function row(overrides: Partial<AnomalyRow> = {}): AnomalyRow {
  return {
    id: 3,
    title: 'SSO login failures',
    summary: 'Six accounts cannot get past the identity provider since Tuesday.',
    status: 'live',
    arr: '300000',
    companies: 6,
    interactions: 11,
    first_seen_at: '2026-09-20T09:00:00Z',
    last_seen_at: '2026-09-23T09:00:00Z',
    acknowledged_by: null,
    ...overrides,
  };
}

function detail(overrides: Partial<AnomalyDetail> = {}): AnomalyDetail {
  return {
    ...row(),
    companies_hit: [
      { id: 12, name: 'Pizza Hut', arr: '120000' },
      { id: 13, name: 'Burger King', arr: '80000' },
    ],
    evidence: [
      { id: 1, kind: 'ticket', record_id: 9, snippet: 'SSO login fails after the update', occurred_at: '2026-09-22T09:00:00Z', company: { type: 'customer', id: 12, name: 'Pizza Hut' } },
      { id: 2, kind: 'email', record_id: 4, snippet: 'Nobody can sign in this morning', occurred_at: '2026-09-21T09:00:00Z', company: { type: 'customer', id: 13, name: 'Burger King' } },
    ],
    ...overrides,
  };
}

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
  render(
    <Provider store={makeStore(role)}>
      <MemoryRouter>
        <AnomaliesPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('AnomaliesPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('ranks clusters by the revenue behind them', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [row(), row({ id: 4, title: 'Billing double charges', arr: '45000', companies: 3, interactions: 4 })]));
    renderPage();
    const rows = await screen.findAllByRole('row');
    expect(within(rows[1]).getByText('SSO login failures')).toBeInTheDocument();
    expect(within(rows[1]).getByText('$300.0K')).toBeInTheDocument();
    expect(within(rows[1]).getByText(/6 companies/)).toBeInTheDocument();
    expect(within(rows[2]).getByText('Billing double charges')).toBeInTheDocument();
  });

  it('filters by status', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [row()]))
      .mockResolvedValueOnce(jsonResponse(200, [row({ id: 4, title: 'Billing double charges', status: 'resolved' })]));
    renderPage();
    await screen.findByText('SSO login failures');
    await userEvent.click(screen.getByRole('button', { name: 'Resolved' }));
    expect(await screen.findByText('Billing double charges')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/anomalies\/\?status=resolved$/);
  });

  it('opens one and shows the companies hit and the reports', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [row()]))
      .mockResolvedValueOnce(jsonResponse(200, detail()));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Open SSO login failures' }));
    expect(await screen.findByText(/cannot get past the identity provider/)).toBeInTheDocument();
    const hit = screen.getByRole('list', { name: 'Companies hit' });
    expect(within(hit).getByRole('link', { name: /Pizza Hut/ })).toHaveAttribute('href', '/organizations/12');
    const reports = screen.getByRole('list', { name: 'Reports' });
    expect(within(reports).getByText('SSO login fails after the update')).toBeInTheDocument();
  });

  it('acknowledges one from the detail pane', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [row()]))
      .mockResolvedValueOnce(jsonResponse(200, detail()))
      .mockResolvedValueOnce(jsonResponse(200, detail({ status: 'acknowledged' })))
      .mockResolvedValueOnce(jsonResponse(200, [row({ status: 'acknowledged' })]));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Open SSO login failures' }));
    await screen.findByRole('list', { name: 'Reports' });
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'acknowledged');
    const patch = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH');
    expect(JSON.parse((patch?.[1] as RequestInit).body as string)).toEqual({ status: 'acknowledged' });
    expect(await screen.findByText('Acknowledged')).toBeInTheDocument();
  });

  it('looks now and says what it found', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, []))
      .mockResolvedValueOnce(jsonResponse(200, { found: 2, attached: 5 }))
      .mockResolvedValueOnce(jsonResponse(200, [row()]));
    renderPage();
    await screen.findByText(/Nothing unusual/);
    await userEvent.click(screen.getByRole('button', { name: 'Look now' }));
    expect(await screen.findByRole('status')).toHaveTextContent('2 new clusters, 5 reports attached');
    expect(await screen.findByText('SSO login failures')).toBeInTheDocument();
  });

  it('reports a stopped run as an error, keeping what it found', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, []))
      .mockResolvedValueOnce(jsonResponse(429, { found: 1, attached: 0, detail: 'This organisation has spent its monthly model budget.' }))
      .mockResolvedValueOnce(jsonResponse(200, [row()]));
    renderPage();
    await screen.findByText(/Nothing unusual/);
    await userEvent.click(screen.getByRole('button', { name: 'Look now' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/1 new cluster was still found/);
  });

  it('hides looking and setting a status from a CSM', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, [row()]));
    renderPage('csm');
    await screen.findByText('SSO login failures');
    expect(screen.queryByRole('button', { name: 'Look now' })).not.toBeInTheDocument();
    expect(screen.getByText(/only the companies you can open/i)).toBeInTheDocument();
  });

  it('shows the error with a retry', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(500, { detail: 'Boom' }))
      .mockResolvedValueOnce(jsonResponse(200, [row()]));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('SSO login failures')).toBeInTheDocument();
  });
});
