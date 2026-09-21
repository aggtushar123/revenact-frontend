import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { Login } from './Login';

// Integration tier (see the `testing` skill): real store, real routing
// around the page, network mocked at the fetch boundary with responses
// shaped exactly like revenact-backend's real contract — the provider
// list, the start call and the password login all have to be answered,
// because the page asks for the provider list on mount.
const mockUser = {
  id: 1,
  email: 'alice@acme.io',
  name: 'Alice Admin',
  avatar: 'https://i.pravatar.cc/150?u=alice@acme.io',
  role: 'admin' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

/** One fetch stub that routes by URL, so a test only states the answers
 *  it cares about and every other endpoint still behaves. */
function stubFetch(routes: Record<string, { ok?: boolean; status?: number; body: unknown }>) {
  const impl = vi.fn(async (url: string) => {
    const match = Object.keys(routes).find((path) => String(url).includes(path));
    if (!match) throw new Error(`unexpected request: ${url}`);
    const { ok = true, status = 200, body } = routes[match];
    return { ok, status, json: async () => body };
  });
  vi.stubGlobal('fetch', impl);
  return impl;
}

const NO_PROVIDERS = { '/auth/oauth/providers/': { body: { providers: [] } } };

function renderLogin() {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Dashboard Home</div>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return store;
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>, email: string, password: string) {
  await user.type(await screen.findByLabelText('Work email'), email);
  await user.type(screen.getByLabelText('Password'), password);
}

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('logs in with valid credentials and redirects onward', async () => {
    const fetchMock = stubFetch({
      ...NO_PROVIDERS,
      '/auth/login/': { body: { user: mockUser, access: 'access.jwt', refresh: 'refresh.jwt' } },
    });
    const user = userEvent.setup();

    renderLogin();
    await fillCredentials(user, 'alice@acme.io', 'supersecret1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.getByText('Dashboard Home')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login/'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows the backend error message on invalid credentials and stays on the page', async () => {
    stubFetch({
      ...NO_PROVIDERS,
      '/auth/login/': {
        ok: false,
        status: 401,
        body: { detail: 'No active account found with the given credentials' },
      },
    });
    const user = userEvent.setup();

    renderLogin();
    await fillCredentials(user, 'alice@acme.io', 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('No active account found with the given credentials')
    ).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Home')).not.toBeInTheDocument();
  });

  it('validates fields client-side before ever calling the login endpoint', async () => {
    const fetchMock = stubFetch(NO_PROVIDERS);
    const user = userEvent.setup();

    renderLogin();
    await fillCredentials(user, 'not-an-email', 'short');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/auth/login/'),
      expect.anything()
    );
  });

  it('links "Forgot password?" to the forgot-password page', async () => {
    stubFetch(NO_PROVIDERS);
    const user = userEvent.setup();

    renderLogin();
    await user.click(await screen.findByText('Forgot password?'));

    await waitFor(() => expect(screen.getByText('Forgot Password Page')).toBeInTheDocument());
  });

  it('opens the password form by itself when the server offers no providers', async () => {
    stubFetch(NO_PROVIDERS);

    renderLogin();

    expect(await screen.findByLabelText('Work email')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Continue with/ })).not.toBeInTheDocument();
  });

  it('renders a button per provider the server offers, and hides the password form behind a toggle', async () => {
    stubFetch({
      '/auth/oauth/providers/': {
        body: {
          providers: [
            { key: 'google', label: 'Google' },
            { key: 'microsoft', label: 'Microsoft' },
          ],
        },
      },
    });

    renderLogin();

    expect(await screen.findByRole('button', { name: /Continue with Google/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Microsoft/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Work email')).not.toBeInTheDocument();
  });

  it('sends the browser to the authorize URL the server returns', async () => {
    stubFetch({
      '/auth/oauth/providers/': { body: { providers: [{ key: 'google', label: 'Google' }] } },
      '/auth/oauth/google/start/': {
        body: { authorize_url: 'https://accounts.google.com/o/oauth2/v2/auth?state=abc' },
      },
    });
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    const user = userEvent.setup();

    renderLogin();
    await user.click(await screen.findByRole('button', { name: /Continue with Google/ }));

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/v2/auth?state=abc')
    );
  });

  it('explains a refused start instead of leaving the button spinning', async () => {
    stubFetch({
      '/auth/oauth/providers/': { body: { providers: [{ key: 'google', label: 'Google' }] } },
      '/auth/oauth/google/start/': {
        ok: false,
        status: 400,
        body: {
          success: false,
          error: { code: 'PROVIDER_NOT_AVAILABLE', message: 'not enabled' },
        },
      },
    });
    const user = userEvent.setup();

    renderLogin();
    await user.click(await screen.findByRole('button', { name: /Continue with Google/ }));

    expect(
      await screen.findByText(/That sign-in method is not enabled/)
    ).toBeInTheDocument();
  });

  it('never writes a session without the server saying so', async () => {
    stubFetch({
      '/auth/oauth/providers/': { body: { providers: [{ key: 'google', label: 'Google' }] } },
      '/auth/oauth/google/start/': { body: { authorize_url: 'https://example.test/authorize' } },
    });
    vi.stubGlobal('location', { ...window.location, assign: vi.fn() });
    const user = userEvent.setup();

    renderLogin();
    await user.click(await screen.findByRole('button', { name: /Continue with Google/ }));

    // The old page faked a session here. Starting a sign-in must leave
    // storage untouched; only a real token exchange fills it.
    expect(localStorage.getItem('revenact_access_token')).toBeNull();
    expect(localStorage.getItem('revenact_user')).toBeNull();
  });
});
