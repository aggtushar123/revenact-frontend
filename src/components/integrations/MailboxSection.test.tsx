import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import mailReducer from '../../features/mail/mailSlice';
import { MailboxSection } from './MailboxSection';

const connected = {
  id: 1, provider: 'imap', provider_display: 'IMAP / SMTP', address: 'dana@acme.io', display_name: 'Dana',
  status: 'connected', error: '', last_synced_at: null, created_at: '2026-09-16T09:00:00Z',
};

function renderSection(search = '') {
  vi.stubGlobal('location', { ...window.location, search, assign: vi.fn() });
  const store = configureStore({ reducer: { auth: authReducer, mail: mailReducer } });
  return render(
    <Provider store={store}>
      <MailboxSection />
    </Provider>,
  );
}

describe('MailboxSection', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('offers IMAP when no OAuth provider is configured, verifies the login and shows the connection', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        calls.push({ url: String(url), init });
        const ok = (body: unknown, status = 200) => Promise.resolve({ ok: true, status, json: async () => body });
        if (init?.method === 'POST' && String(url).includes('/mail/connect/imap/')) return ok(connected, 201);
        return ok({ connection: null, providers: [{ key: 'imap', label: 'IMAP / SMTP', uses_oauth: false }] });
      }),
    );
    const user = userEvent.setup();
    renderSection();

    expect(await screen.findByText(/Google and Microsoft sign-in are not set up/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Connect another mailbox/ }));
    await user.type(screen.getByLabelText('Email address'), 'dana@acme.io');
    await user.type(screen.getByLabelText('Password or app password'), 'app-pass');
    await user.type(screen.getByLabelText('IMAP host'), 'imap.acme.io');
    await user.type(screen.getByLabelText('SMTP host'), 'smtp.acme.io');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => expect(screen.getByText(/dana@acme.io/)).toBeInTheDocument());
    const post = calls.find((c) => c.init?.method === 'POST');
    expect(JSON.parse(String(post?.init?.body))).toEqual({
      address: 'dana@acme.io', password: 'app-pass', imap_host: 'imap.acme.io', imap_port: 993, smtp_host: 'smtp.acme.io', smtp_port: 587,
    });
    expect(screen.getByRole('button', { name: /Disconnect/ })).toBeInTheDocument();
  });

  it('sends the browser to the provider for an OAuth connection and reports the outcome on return', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body });
        if (init?.method === 'POST') return ok({ authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth?state=x' });
        return ok({ connection: null, providers: [{ key: 'google', label: 'Google Workspace / Gmail', uses_oauth: true }, { key: 'imap', label: 'IMAP / SMTP', uses_oauth: false }] });
      }),
    );
    const user = userEvent.setup();
    renderSection('?mailbox=error&detail=denied');
    const assign = (window.location as unknown as { assign: ReturnType<typeof vi.fn> }).assign;

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not connect: denied');
    await user.click(screen.getByRole('button', { name: 'Connect Google Workspace / Gmail' }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?state=x'));
  });
});
