import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { AIAgentPage } from './AIAgentPage';
import { capabilitiesForRole } from '../../test/capabilities';

// Integration tier (see the `testing` skill): same convention as
// CurrencyPage.test.tsx's own.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeStore(role: 'admin' | 'csm' = 'admin', enabled = true, tone: 'professional' | 'friendly' | 'concise' = 'professional') {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role,
          role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM',
          permissions: capabilitiesForRole(role),
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '',
            ai_agent_enabled: enabled,
            ai_agent_tone: tone,
            ai_agent_tone_display: tone === 'professional' ? 'Professional' : tone === 'friendly' ? 'Friendly' : 'Concise',
          },
          is_active: true,
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderPage(store: ReturnType<typeof makeStore>) {
  render(
    <Provider store={store}>
      <AIAgentPage />
    </Provider>
  );
}

describe('AIAgentPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the tenant's own current enabled state and tone", () => {
    renderPage(makeStore('admin', false, 'friendly'));
    expect(screen.getByRole('switch', { name: 'AI Agent enabled' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByLabelText('Tone')).toHaveValue('friendly');
  });

  it('an admin can toggle, change tone, and save', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(200, {
      id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD', currency_display: 'US Dollar ($)',
      default_lifecycle_stage: '', ai_agent_enabled: false, ai_agent_tone: 'concise', ai_agent_tone_display: 'Concise',
    }))) as ReturnType<typeof vi.fn<(url: string, options?: { method?: string; body?: string }) => Promise<ReturnType<typeof jsonResponse>>>>;
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage(makeStore('admin', true, 'professional'));

    await user.click(screen.getByRole('switch', { name: 'AI Agent enabled' }));
    await user.selectOptions(screen.getByLabelText('Tone'), 'concise');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Saved.')).toBeInTheDocument();
    const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(options.body)).toEqual({ ai_agent_enabled: false, ai_agent_tone: 'concise' });
  });

  it('a CSM sees a read-only view with no Save button', () => {
    renderPage(makeStore('csm'));

    expect(screen.getByText(/You don't have permission to change this/)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'AI Agent enabled' })).toBeDisabled();
    expect(screen.getByLabelText('Tone')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
