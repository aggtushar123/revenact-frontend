import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type User } from '../../features/auth/authSlice';
import platformReducer from '../../features/platform/platformSlice';
import { RequirePlatform } from '../../components/auth/RequirePlatform';
import { PlatformLayout } from '../../layouts/PlatformLayout';
import { PlatformOverview } from './PlatformOverview';
import { PlatformOrganisations } from './PlatformOrganisations';
import { PlatformOrganisationDetail } from './PlatformOrganisationDetail';

// Integration tier: the real guard, layout and pages over a store whose
// auth state says who this is and whether the session passed a second
// factor; fetch mocked with the shapes /api/v1/platform/ actually returns.

const staff = {
  id: 9,
  email: 'staff@revenact.io',
  name: 'Staff',
  avatar: '',
  role: '',
  role_id: null,
  role_name: '',
  permissions: [],
  function: 'other',
  function_display: 'Other',
  reports_to: null,
  organisation: null,
  is_active: true,
  is_superuser: true,
  mfa_enrolled: true,
} as unknown as User;

const acme = {
  id: 1,
  name: 'Acme Inc',
  slug: 'acme-inc',
  status: 'active',
  created_at: '2026-09-01T00:00:00Z',
  owner: { id: 2, name: 'Owner', email: 'owner@acme.io' },
  members_active: 2,
  pending_requests: 1,
  domains: [{ domain: 'acme.io', verification_status: 'verified' }],
  plan: null,
};

const acmeDetail = {
  ...acme,
  open_invitations: 0,
  memberships: [
    { id: 1, user_id: 2, name: 'Owner', email: 'owner@acme.io', role: 'Admin', department: null, status: 'active', is_owner: true, is_active: true, approved_at: null, last_login: null },
    { id: 2, user_id: 3, name: 'Carl', email: 'carl@acme.io', role: 'CSM', department: 'Success', status: 'active', is_owner: false, is_active: true, approved_at: null, last_login: null },
  ],
  domains: [{ id: 5, domain: 'acme.io', is_primary: true, verification_status: 'verified', verified_at: null }],
  recent_events: [{ action: 'auth.login', actor: 'owner@acme.io', outcome: 'success', target: '', at: '2026-09-20T10:00:00Z' }],
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderPortal(path: string, options: { user?: User; mfaVerified?: boolean; handler?: (url: string, init?: RequestInit) => ReturnType<typeof jsonResponse> | undefined } = {}) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const custom = options.handler?.(url, init);
    if (custom) return Promise.resolve(custom);
    if (url.includes('/platform/overview/')) {
      return Promise.resolve(jsonResponse(200, { organisations: { total: 1, pending: 0, active: 1, suspended: 0, archived: 0 }, members_active: 2, pending_requests: 1, open_invitations: 0, verified_domains: 1, staff: 1 }));
    }
    if (/\/platform\/organisations\/1\/$/.test(url)) return Promise.resolve(jsonResponse(200, acmeDetail));
    if (url.includes('/platform/organisations/')) return Promise.resolve(jsonResponse(200, [acme]));
    throw new Error(`unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);

  const store = configureStore({
    reducer: { auth: authReducer, platform: platformReducer },
    preloadedState: {
      auth: {
        user: options.user ?? staff,
        accessToken: 'a',
        refreshToken: 'r',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        mfaChallenge: null,
        mfaVerified: options.mfaVerified ?? true,
      },
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/platform" element={<RequirePlatform><PlatformLayout /></RequirePlatform>}>
            <Route index element={<PlatformOverview />} />
            <Route path="organisations" element={<PlatformOrganisations />} />
            <Route path="organisations/:id" element={<PlatformOrganisationDetail />} />
          </Route>
          <Route path="/dashboard" element={<div>Tenant Dashboard</div>} />
          <Route path="/login" element={<div>Sign-in Page</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { store, fetchMock };
}

describe('Platform portal', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a tenant user back to the app', async () => {
    const tenant = { ...staff, is_superuser: false } as User;
    renderPortal('/platform', { user: tenant });
    expect(await screen.findByText('Tenant Dashboard')).toBeInTheDocument();
  });

  it('tells staff whose session skipped the second factor what to do', async () => {
    const { fetchMock } = renderPortal('/platform', { mfaVerified: false });
    expect(await screen.findByText('Two-factor authentication needed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in again' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('points an unenrolled staff member at Account settings', async () => {
    const unenrolled = { ...staff, mfa_enrolled: false } as User;
    renderPortal('/platform', { user: unenrolled, mfaVerified: false });
    expect(await screen.findByRole('link', { name: 'Set up two-factor' })).toBeInTheDocument();
  });

  it('shows the overview numbers', async () => {
    renderPortal('/platform');
    expect(await screen.findByText('Organisations')).toBeInTheDocument();
    expect(await screen.findByText('1 active · 0 suspended')).toBeInTheDocument();
  });

  it('lists organisations with owner, domain and counts', async () => {
    renderPortal('/platform/organisations');
    expect(await screen.findByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('owner@acme.io')).toBeInTheDocument();
    expect(screen.getByText('acme.io')).toBeInTheDocument();
  });

  it('suspends an organisation with a reason, and reactivates it', async () => {
    const posts: string[] = [];
    const { fetchMock } = renderPortal('/platform/organisations/1', {
      handler: (url, init) => {
        if (url.includes('/status/') && init?.method === 'POST') {
          posts.push(String(init.body));
          const body = JSON.parse(String(init.body));
          return jsonResponse(200, { status: body.status });
        }
        return undefined;
      },
    });
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'Acme Inc' })).toBeInTheDocument();
    const suspend = screen.getByRole('button', { name: 'Suspend organisation' });
    expect(suspend).toBeDisabled();
    await user.type(screen.getByLabelText('Reason'), 'Non-payment');
    await user.click(suspend);

    expect(await screen.findByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
    expect(posts[0]).toBe(JSON.stringify({ status: 'suspended', reason: 'Non-payment' }));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/platform/organisations/1/status/'), expect.anything());
  });

  it('hands ownership to another active member', async () => {
    renderPortal('/platform/organisations/1', {
      handler: (url, init) => {
        if (url.includes('/owner/') && init?.method === 'POST') {
          expect(JSON.parse(String(init.body))).toEqual({ user_id: 3 });
          return jsonResponse(200, { owner: { id: 3, name: 'Carl', email: 'carl@acme.io' } });
        }
        return undefined;
      },
    });
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText('Hand over to'), '3');
    await user.click(screen.getByRole('button', { name: 'Transfer ownership' }));

    // The owner card now names Carl.
    await waitFor(() =>
      expect(within(screen.getByRole('region', { name: 'Owner' })).getByText('carl@acme.io')).toBeInTheDocument()
    );
  });

  it('shows a refused action in the backend’s words', async () => {
    renderPortal('/platform/organisations/1', {
      handler: (url, init) => {
        if (url.includes('/owner/') && init?.method === 'POST') {
          return jsonResponse(400, { success: false, error: { code: 'NOT_A_MEMBER', message: 'The new owner must be an active member.' } });
        }
        return undefined;
      },
    });
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText('Hand over to'), '3');
    await user.click(screen.getByRole('button', { name: 'Transfer ownership' }));
    expect(await screen.findByText('The new owner must be an active member.')).toBeInTheDocument();
  });
});
