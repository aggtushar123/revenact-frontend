import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import accessReducer from '../../features/access/accessSlice';
import authReducer, { type User } from '../../features/auth/authSlice';
import { AccessTab } from './AccessTab';

// Integration tier: real store, fetch mocked at the boundary with the
// shapes revenact-backend's /identity/ endpoints actually return.

const roles = [
  { id: 1, name: 'Admin', slug: 'admin', permissions: ['manage_users'], is_system: true, users_count: 1, created_at: '' },
  { id: 2, name: 'CSM', slug: 'csm', permissions: [], is_system: true, users_count: 3, created_at: '' },
] as never;

const pendingRequest = {
  id: 7,
  email: 'new@acme.io',
  user_name: 'New Person',
  status: 'pending',
  requested_at: '2026-09-20T10:00:00Z',
  reviewed_at: null,
  rejection_reason: '',
};

const invitation = {
  id: 3,
  email: 'invited@acme.io',
  role_id: 2,
  role_name: 'CSM',
  department_id: null,
  department_name: '',
  status: 'pending',
  invited_by_name: 'Alice Admin',
  invited_at: '2026-09-20T10:00:00Z',
  expires_at: '2026-09-27T10:00:00Z',
  accepted_at: null,
};

const pendingDomain = {
  id: 5,
  domain: 'acme.io',
  is_primary: true,
  verification_status: 'pending',
  verified_at: null,
  dns_record: { type: 'TXT', name: 'acme.io', value: 'revenact-site-verification=tok-123' },
  created_at: '',
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function stubFetch(handler?: (url: string, options?: RequestInit) => ReturnType<typeof jsonResponse> | undefined) {
  const impl = vi.fn((url: string, options?: RequestInit) => {
    const custom = handler?.(url, options);
    if (custom) return Promise.resolve(custom);
    if (url.includes('/identity/access-requests/')) return Promise.resolve(jsonResponse(200, [pendingRequest]));
    if (url.includes('/identity/invitations/')) return Promise.resolve(jsonResponse(200, [invitation]));
    if (url.includes('/identity/domains/')) return Promise.resolve(jsonResponse(200, [pendingDomain]));
    throw new Error(`unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', impl);
  return impl;
}

function renderTab(permissions: string[] = ['manage_users', 'manage_org_settings']) {
  const user = {
    id: 1,
    email: 'alice@acme.io',
    name: 'Alice Admin',
    avatar: '',
    role: 'admin',
    role_id: 1,
    role_name: 'Admin',
    permissions,
    function: 'cs',
    function_display: 'Customer Success',
    reports_to: null,
    organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
    is_active: true,
  } as unknown as User;
  const store = configureStore({
    reducer: { access: accessReducer, auth: authReducer },
    preloadedState: {
      auth: { user, accessToken: 'a', refreshToken: 'r', isAuthenticated: true, isLoading: false, error: null },
    },
  });
  render(
    <Provider store={store}>
      <AccessTab roles={roles} />
    </Provider>
  );
  return store;
}

describe('Access tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists who is waiting and approves them with a chosen role', async () => {
    const fetchMock = stubFetch((url, options) => {
      if (url.includes('/access-requests/7/approve/')) {
        expect(JSON.parse(String(options?.body))).toEqual({ role_id: 1 });
        return jsonResponse(200, { status: 'approved' });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderTab();

    expect(await screen.findByText('New Person')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Role for New Person'), '1');
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(screen.queryByText('New Person')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/identity/access-requests/7/approve/'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('surfaces the backend’s reason when an approval is refused', async () => {
    stubFetch((url) => {
      if (url.includes('/approve/')) {
        return jsonResponse(403, {
          success: false,
          error: { code: 'INSUFFICIENT_PERMISSION', message: 'You cannot grant a capability you do not hold yourself.' },
        });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(await screen.findByText(/cannot grant a capability/)).toBeInTheDocument();
    expect(screen.getByText('New Person')).toBeInTheDocument();
  });

  it('sends an invitation and shows it in the list', async () => {
    stubFetch((url, options) => {
      if (url.includes('/identity/invitations/') && options?.method === 'POST') {
        expect(JSON.parse(String(options.body))).toEqual({ email: 'raj@acme.io', role_id: 2 });
        return jsonResponse(201, { ...invitation, id: 9, email: 'raj@acme.io' });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderTab();

    await user.type(await screen.findByLabelText('Work email'), 'raj@acme.io');
    await user.click(screen.getByRole('button', { name: 'Send invitation' }));

    expect(await screen.findByText('Invitation sent to raj@acme.io.')).toBeInTheDocument();
    expect(screen.getByText('raj@acme.io')).toBeInTheDocument();
  });

  it('cancels an invitation', async () => {
    const fetchMock = stubFetch((url) => {
      if (url.includes('/invitations/3/cancel/')) return jsonResponse(200, { status: 'cancelled' });
      return undefined;
    });
    const user = userEvent.setup();
    renderTab();

    expect(await screen.findByText('invited@acme.io')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('invited@acme.io')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/identity/invitations/3/cancel/'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('shows the exact TXT record to publish and checks it on request', async () => {
    stubFetch((url) => {
      if (url.includes('/domains/5/verify/')) {
        return jsonResponse(200, { ...pendingDomain, verification_status: 'verified', verified_at: '2026-09-21T00:00:00Z', dns_record: null });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderTab();

    expect(await screen.findByText('revenact-site-verification=tok-123')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Check DNS' }));

    expect(await screen.findByText('Verified')).toBeInTheDocument();
    expect(screen.queryByText('revenact-site-verification=tok-123')).not.toBeInTheDocument();
  });

  it('tells the truth when the record is not published yet', async () => {
    stubFetch((url) => {
      if (url.includes('/verify/')) {
        return jsonResponse(400, {
          success: false,
          error: { code: 'DOMAIN_NOT_VERIFIED', message: 'That TXT record is not published yet. DNS can take a while to propagate.' },
        });
      }
      return undefined;
    });
    const user = userEvent.setup();
    renderTab();

    await user.click(await screen.findByRole('button', { name: 'Check DNS' }));

    expect(await screen.findByText(/not published yet/)).toBeInTheDocument();
  });

  it('hides domains from someone without manage_org_settings', async () => {
    const fetchMock = stubFetch();
    renderTab(['manage_users']);

    expect(await screen.findByText('New Person')).toBeInTheDocument();
    expect(screen.queryByText('Email domains')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/identity/domains/'), expect.anything());
  });
});
