import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type User } from '../../features/auth/authSlice';
import settingsReducer from '../../features/settings/settingsSlice';
import { AccountSettingsPage } from './AccountSettingsPage';
import { ALL_CAPABILITIES } from '../../test/capabilities';

const baseUser = {
  id: 1,
  email: 'alice@acme.io',
  name: 'Alice Admin',
  avatar: '',
  role: 'admin',
  role_id: 1,
  role_name: 'Admin',
  permissions: ALL_CAPABILITIES,
  function: 'cs' as const,
  function_display: 'Customer Success',
  reports_to: null,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

function renderPage(user: Partial<typeof baseUser> & Record<string, unknown> = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, settings: settingsReducer },
    preloadedState: {
      auth: {
        user: { ...baseUser, ...user } as User,
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <AccountSettingsPage />
    </Provider>
  );
  return store;
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

describe('Account settings', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a change-password submission when the new passwords do not match', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage({ has_password: true });

    await user.type(screen.getByLabelText('Current password'), 'supersecret1');
    await user.type(screen.getByLabelText('New password'), 'newpassword-12');
    await user.type(screen.getByLabelText('Confirm new password'), 'somethingelse1');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('The new passwords do not match.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('changes the password through the backend when the form is consistent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, null));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage({ has_password: true });

    await user.type(screen.getByLabelText('Current password'), 'supersecret1');
    await user.type(screen.getByLabelText('New password'), 'newpassword-12');
    await user.type(screen.getByLabelText('Confirm new password'), 'newpassword-12');
    await user.click(screen.getByRole('button', { name: 'Change password' }));

    expect(await screen.findByText('Password changed.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me/change-password/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ current_password: 'supersecret1', new_password: 'newpassword-12' }),
      })
    );
  });

  it('shows how a provider-only person signs in instead of a password form', () => {
    vi.stubGlobal('fetch', vi.fn());
    renderPage({ has_password: false, sign_in_providers: ['google'] });

    expect(screen.getByText('How you sign in')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
  });

  it('assumes a password for a user cached before the field existed', () => {
    vi.stubGlobal('fetch', vi.fn());
    renderPage();

    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
  });
});
