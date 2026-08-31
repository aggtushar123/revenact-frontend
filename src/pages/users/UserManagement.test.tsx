import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userManagementReducer from '../../features/userManagement/userManagementSlice';
import { UserManagement } from './UserManagement';

const carl = {
  id: 2,
  email: 'carl@acme.io',
  name: 'Carl CSM',
  avatar: 'https://i.pravatar.cc/150?u=carl@acme.io',
  role: 'csm' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

function renderPage() {
  const store = configureStore({ reducer: { userManagement: userManagementReducer } });
  render(
    <Provider store={store}>
      <UserManagement />
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('UserManagement page', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the CSMs fetched on mount', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { count: 1, next: null, previous: null, results: [carl] }))
    );

    renderPage();

    expect(await screen.findByText('Carl CSM')).toBeInTheDocument();
    expect(screen.getByText('carl@acme.io')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('adds a team member through the modal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { count: 0, next: null, previous: null, results: [] })) // initial fetchCSMs
      .mockResolvedValueOnce(
        jsonResponse(201, { ...carl, id: 3, email: 'dana@acme.io', name: 'Dana New' })
      ); // POST /csms/
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('No team members yet. Add your first Customer Success Manager.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add team member/i }));
    await user.type(screen.getByLabelText('Name'), 'Dana New');
    await user.type(screen.getByLabelText('Email'), 'dana@acme.io');
    await user.type(screen.getByLabelText('Temporary password'), 'danapassword1');
    await user.click(screen.getByRole('button', { name: 'Add Member' }));

    expect(await screen.findByText('Dana New')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/csms/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Dana New', email: 'dana@acme.io', password: 'danapassword1' }),
      })
    );
  });

  it('deactivates a member from the row action', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { count: 1, next: null, previous: null, results: [carl] }))
      .mockResolvedValueOnce(jsonResponse(200, { ...carl, is_active: false }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    expect(await screen.findByText('Active')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    expect(await screen.findByText('Deactivated')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/csms/2/'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ is_active: false }) })
    );
  });

  it('edits a member through the modal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { count: 1, next: null, previous: null, results: [carl] }))
      .mockResolvedValueOnce(jsonResponse(200, { ...carl, name: 'Carl Renamed' }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const nameInput = await screen.findByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Carl Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByText('Edit Carl CSM')).not.toBeInTheDocument());
    expect(screen.getByText('Carl Renamed')).toBeInTheDocument();
  });
});
