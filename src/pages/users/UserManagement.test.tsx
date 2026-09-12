import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userManagementReducer from '../../features/userManagement/userManagementSlice';
import { UserManagement } from './UserManagement';

// Integration tier (see the `testing` skill): no auth slice needed —
// the page itself isn't gated (RequireCapability in App.tsx and the
// Sidebar do that, each with their own tests), so only the fetch
// boundary is mocked. The page loads three endpoints on mount:
// /auth/users/, /auth/roles/ and /auth/capabilities/.

const alice = {
  id: 1,
  email: 'alice@acme.io',
  name: 'Alice Admin',
  avatar: 'https://i.pravatar.cc/150?u=alice@acme.io',
  role: 'admin' as const,
  role_id: 1,
  role_name: 'Admin',
  permissions: ['manage_users'],
  function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

const carl = {
  id: 2,
  email: 'carl@acme.io',
  name: 'Carl CSM',
  avatar: 'https://i.pravatar.cc/150?u=carl@acme.io',
  role: 'csm' as const,
  role_id: 2,
  role_name: 'CSM',
  permissions: [],
  function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

const adminRole = {
  id: 1,
  name: 'Admin',
  slug: 'admin',
  permissions: ['manage_users', 'manage_integrations'],
  function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
  is_system: true,
  users_count: 1,
  created_at: '2026-09-07T00:00:00Z',
};

const csmRole = {
  id: 2,
  name: 'CSM',
  slug: 'csm',
  permissions: [],
  function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
  is_system: true,
  users_count: 1,
  created_at: '2026-09-07T00:00:00Z',
};

const capabilities = [
  { key: 'manage_users', label: 'Manage users & roles' },
  { key: 'manage_integrations', label: 'Manage integrations & webhooks' },
];

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

/** Routes each of the page's three mount-time GETs to the right shape —
 * roles/capabilities are plain arrays, members is paginated. */
function stubFetch(
  handler?: (url: string, options?: RequestInit) => ReturnType<typeof jsonResponse> | undefined
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      const custom = handler?.(url, options);
      if (custom) return Promise.resolve(custom);
      if (url.includes('/auth/capabilities/')) return Promise.resolve(jsonResponse(200, capabilities));
      if (url.includes('/auth/roles/')) return Promise.resolve(jsonResponse(200, [adminRole, csmRole]));
      return Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [alice, carl] })
      );
    })
  );
}

function renderPage() {
  const store = configureStore({ reducer: { userManagement: userManagementReducer } });
  render(
    <Provider store={store}>
      <UserManagement />
    </Provider>
  );
}

describe('UserManagement page', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists every member on mount, admins included', async () => {
    // The old CSM-only list couldn't show an admin at all — not even
    // the person looking at the page.
    stubFetch();
    renderPage();

    expect(await screen.findAllByText('Alice Admin').then((els) => els[0])).toBeInTheDocument();
    expect(screen.getAllByText('Carl CSM')[0]).toBeInTheDocument();
    expect(screen.getByText('alice@acme.io')).toBeInTheDocument();
  });

  it('shows each member’s real role in an inline picker', async () => {
    stubFetch();
    renderPage();

    const picker = (await screen.findByLabelText('Role for Carl CSM')) as HTMLSelectElement;
    expect(picker.value).toBe('2');
    expect(screen.getByLabelText('Role for Alice Admin')).toHaveValue('1');
  });

  it('changing someone’s role PATCHes their real role_id', async () => {
    const fetchMock = vi.fn();
    stubFetch((url, options) => {
      fetchMock(url, options);
      if (options?.method === 'PATCH') return jsonResponse(200, { ...carl, role_id: 1, role_name: 'Admin', role: 'admin' });
      return undefined;
    });
    const user = userEvent.setup();

    renderPage();
    await user.selectOptions(await screen.findByLabelText('Role for Carl CSM'), '1');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/users/2/'),
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ role_id: 1 }) })
      )
    );
  });

  it('surfaces the backend’s last-user-manager guardrail instead of failing silently', async () => {
    stubFetch((_url, options) =>
      options?.method === 'PATCH'
        ? jsonResponse(400, {
            detail: 'This is the only person who can manage users — give someone else that permission first.',
          })
        : undefined
    );
    const user = userEvent.setup();

    renderPage();
    await user.selectOptions(await screen.findByLabelText('Role for Alice Admin'), '2');

    expect(await screen.findByText(/only person who can manage users/)).toBeInTheDocument();
  });

  it('adds a team member, in a chosen role, through the modal', async () => {
    const fetchMock = vi.fn();
    stubFetch((url, options) => {
      fetchMock(url, options);
      if (options?.method === 'POST') {
        return jsonResponse(201, { ...carl, id: 3, email: 'dana@acme.io', name: 'Dana New' });
      }
      return undefined;
    });
    const user = userEvent.setup();

    renderPage();
    await screen.findAllByText('Carl CSM').then((els) => els[0]);

    await user.click(screen.getByRole('button', { name: /Add Team Member/ }));
    await user.type(screen.getByLabelText('Name'), 'Dana New');
    await user.type(screen.getByLabelText('Email'), 'dana@acme.io');
    await user.selectOptions(screen.getByLabelText('Role'), '1');
    await user.type(screen.getByLabelText('Temporary password'), 'danapassword1');
    await user.click(screen.getByRole('button', { name: 'Add Member' }));

    expect((await screen.findAllByText('Dana New'))[0]).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/users/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Dana New',
            email: 'dana@acme.io',
            password: 'danapassword1',
            function: 'cs',
            role_id: 1,
          }),
        })
      )
    );
  });

  it('deactivates a member from the row action', async () => {
    stubFetch((_url, options) =>
      options?.method === 'PATCH' ? jsonResponse(200, { ...carl, is_active: false }) : undefined
    );
    const user = userEvent.setup();

    renderPage();
    await screen.findAllByText('Carl CSM').then((els) => els[0]);

    await user.click(screen.getAllByRole('button', { name: 'Deactivate' })[1]);

    expect(await screen.findByText('Deactivated')).toBeInTheDocument();
  });

  it('edits a member through the modal', async () => {
    stubFetch((_url, options) =>
      options?.method === 'PATCH' ? jsonResponse(200, { ...carl, name: 'Carl Renamed' }) : undefined
    );
    const user = userEvent.setup();

    renderPage();
    await screen.findAllByText('Carl CSM').then((els) => els[0]);

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    const nameInput = screen.getByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Carl Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect((await screen.findAllByText('Carl Renamed'))[0]).toBeInTheDocument();
  });
});

describe('UserManagement page — Roles tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  async function openRolesTab() {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText('Carl CSM').then((els) => els[0]);
    await user.click(screen.getByRole('button', { name: 'roles' }));
    return user;
  }

  it('lists the org’s roles with their real capabilities ticked', async () => {
    stubFetch();
    await openRolesTab();

    expect(await screen.findByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('CSM')).toBeInTheDocument();
    // Admin holds manage_users + manage_integrations in this fixture.
    const adminChecks = screen.getAllByRole('checkbox');
    expect(adminChecks[0]).toBeChecked();
    expect(adminChecks[1]).toBeChecked();
  });

  it('marks the built-in roles as such and offers no delete for them', async () => {
    stubFetch();
    await openRolesTab();

    expect(await screen.findAllByText('Built-in')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /^Delete/ })).not.toBeInTheDocument();
    // …and their capability checkboxes can't be edited.
    expect(screen.getAllByRole('checkbox')[0]).toBeDisabled();
  });

  it('creates a new role with the capabilities ticked for it', async () => {
    const fetchMock = vi.fn();
    stubFetch((url, options) => {
      fetchMock(url, options);
      if (options?.method === 'POST') {
        return jsonResponse(201, {
          id: 3,
          name: 'Support Lead',
          slug: 'support-lead',
          permissions: ['manage_integrations'],
          function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
          is_system: false,
          users_count: 0,
          created_at: '2026-09-07T00:00:00Z',
        });
      }
      return undefined;
    });
    const user = await openRolesTab();

    await user.click(screen.getByRole('button', { name: /New Role/ }));
    // Scoped to the create form — the role cards below render the same
    // capability labels for their own checkboxes.
    const form = screen.getByLabelText('Role name').closest('form') as HTMLFormElement;
    await user.type(within(form).getByLabelText('Role name'), 'Support Lead');
    await user.click(within(form).getByLabelText('Manage integrations & webhooks'));
    await user.click(within(form).getByRole('button', { name: 'Create Role' }));

    expect((await screen.findAllByText('Support Lead'))[0]).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/roles/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Support Lead', permissions: ['manage_integrations'] }),
        })
      )
    );
  });

  it('a custom role can be deleted, and offers a real confirm first', async () => {
    const customRole = {
      id: 3,
      name: 'Support Lead',
      slug: 'support-lead',
      permissions: [],
      function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
      is_system: false,
      users_count: 0,
      created_at: '2026-09-07T00:00:00Z',
    };
    stubFetch((url, options) => {
      if (options?.method === 'DELETE') return jsonResponse(204, null);
      if (url.includes('/auth/roles/')) return jsonResponse(200, [adminRole, csmRole, customRole]);
      return undefined;
    });
    const user = await openRolesTab();

    await user.click(await screen.findByRole('button', { name: 'Delete Support Lead' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Support Lead')).not.toBeInTheDocument());
  });
});
