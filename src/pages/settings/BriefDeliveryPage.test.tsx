import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { capabilitiesForRole } from '../../test/capabilities';
import { BriefDeliveryPage } from './BriefDeliveryPage';

// Integration tier: the real page against the fetch boundary, responses
// shaped like the contract.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) };
}

const nothing = { cadence: null, destination_hint: '', weekday: null, day: null, is_active: false, last_sent_at: null };
const weekly = { cadence: 'weekly', destination_hint: '…abcd', weekday: 1, day: 1, is_active: true, last_sent_at: '2026-09-22T08:00:00Z' };

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
      <BriefDeliveryPage />
    </Provider>
  );
}

describe('BriefDeliveryPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('tells a CSM to ask an admin and fetches nothing', () => {
    renderPage('csm');
    expect(screen.getByText(/ask an admin/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sets up a weekly delivery', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, nothing))
      .mockResolvedValueOnce(jsonResponse(201, weekly));
    renderPage();
    expect(await screen.findByText(/Nothing is scheduled/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Slack webhook URL'), 'https://hooks.slack.com/services/T/B/abcd');
    await userEvent.selectOptions(screen.getByLabelText('Day'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule it' }));
    expect(await screen.findByText(/Every Tuesday/)).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      destination: 'https://hooks.slack.com/services/T/B/abcd',
      cadence: 'weekly',
      weekday: 1,
    });
  });

  it('never shows the webhook back, only a hint', { timeout: 15000 }, async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, weekly));
    renderPage();
    expect(await screen.findByText(/…abcd/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/hooks.slack.com/)).not.toBeInTheDocument();
  });

  it('refuses a destination the backend rejects, without losing what is set', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, weekly))
      .mockResolvedValueOnce(jsonResponse(400, { detail: 'That must be an https://hooks.slack.com/... webhook URL.' }));
    renderPage();
    await screen.findByText(/Every Tuesday/);
    await userEvent.click(screen.getByRole('button', { name: 'Change the channel' }));
    await userEvent.type(screen.getByLabelText('Slack webhook URL'), 'https://example.com/hook');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/hooks.slack.com/);
    expect(screen.getByText(/Every Tuesday/)).toBeInTheDocument();
  });

  it('sends one now to prove it works', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, weekly))
      .mockResolvedValueOnce(jsonResponse(200, { sent: true, detail: 'Sent.' }));
    renderPage();
    await screen.findByText(/Every Tuesday/);
    await userEvent.click(screen.getByRole('button', { name: 'Send one now' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Sent/);
  });

  it('says when there is no brief to send yet', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, weekly))
      .mockResolvedValueOnce(jsonResponse(200, { sent: false, detail: 'No brief has been written yet.' }));
    renderPage();
    await screen.findByText(/Every Tuesday/);
    await userEvent.click(screen.getByRole('button', { name: 'Send one now' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/No brief has been written yet/);
  });

  it('stops the delivery', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, weekly))
      .mockResolvedValueOnce(jsonResponse(204, null))
      .mockResolvedValueOnce(jsonResponse(200, nothing));
    renderPage();
    await screen.findByText(/Every Tuesday/);
    await userEvent.click(screen.getByRole('button', { name: 'Stop sending' }));
    expect(await screen.findByText(/Nothing is scheduled/)).toBeInTheDocument();
  });
});
