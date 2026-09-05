import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../features/auth/authSlice';
import copilotSessionsReducer from '../../features/copilotSessions/copilotSessionsSlice';
import { CopilotIndex } from './Index';
import type { Conversation } from './types';

// Integration tier — the "Ask Copilot about this account" entry point
// through to a real session: Make Live, a redirect, and a hand-off. Only
// the fetch boundary is mocked; the session itself is real Redux state
// (features/copilotSessions/), not the real backend (see the plan this
// was built from — Phase 1 is deliberately frontend-only).

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const PLACEHOLDER = "Type '/' to add variables, like {Account} and {Organization}";

function conversationWith(userMessages: string[]): Conversation {
  const messages: Conversation['messages'] = [];
  userMessages.forEach((text, i) => {
    messages.push({ id: i * 2 + 1, role: 'user', content: text, created_at: '2026-09-05T10:00:00Z' });
    messages.push({ id: i * 2 + 2, role: 'assistant', content: `Real reply #${i + 1}`, created_at: '2026-09-05T10:00:05Z' });
  });
  return { id: 99, title: userMessages[0], messages, created_at: '2026-09-05T10:00:00Z', updated_at: '2026-09-05T10:00:05Z' };
}

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer, copilotSessions: copilotSessionsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role: 'admin' as const,
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '',
            ai_agent_enabled: true,
            ai_agent_tone: 'professional' as const,
            ai_agent_tone_display: 'Professional',
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

function renderAtEntryPoint() {
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={['/copilot?forCustomerId=7&forCustomerName=Pizza%20Hut']}>
        <CopilotIndex />
      </MemoryRouter>
    </Provider>
  );
}

describe('Multiplayer Copilot', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the "About" chip before the first message, from the entry-point query params', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    renderAtEntryPoint();

    expect(await screen.findByText('About: Pizza Hut')).toBeInTheDocument();
  });

  it('the first real message starts a real session, offering "Make this a live session"', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options?: { method?: string }) => {
        if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
          return Promise.resolve(jsonResponse(200, conversationWith(['Why is Pizza Hut at risk?'])));
        }
        return Promise.resolve(jsonResponse(200, []));
      })
    );
    const user = userEvent.setup();
    renderAtEntryPoint();

    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    await user.type(input, 'Why is Pizza Hut at risk?');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Make this a live session')).toBeInTheDocument();
  });

  it('"Make this a live session" is explicit opt-in and shows a real Live badge once clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options?: { method?: string }) => {
        if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
          return Promise.resolve(jsonResponse(200, conversationWith(['Why is Pizza Hut at risk?'])));
        }
        return Promise.resolve(jsonResponse(200, []));
      })
    );
    const user = userEvent.setup();
    renderAtEntryPoint();

    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), 'Why is Pizza Hut at risk?');
    await user.keyboard('{Enter}');
    expect(screen.queryByText('Live')).not.toBeInTheDocument();

    await user.click(await screen.findByText('Make this a live session'));

    expect(await screen.findByText('Live')).toBeInTheDocument();
  });

  it('a second real message is tagged as a real redirect into the same conversation', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
        const body = JSON.parse(options.body!);
        if (!body.conversation_id) {
          return Promise.resolve(jsonResponse(200, conversationWith(['Why is Pizza Hut at risk?'])));
        }
        return Promise.resolve(
          jsonResponse(200, conversationWith(['Why is Pizza Hut at risk?', 'Focus on the champion leaving']))
        );
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAtEntryPoint();

    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    await user.type(input, 'Why is Pizza Hut at risk?');
    await user.keyboard('{Enter}');
    await screen.findByText('Real reply #1');

    await user.type(input, 'Focus on the champion leaving');
    await user.keyboard('{Enter}');

    expect(await screen.findByText('↳ Redirected by Alice')).toBeInTheDocument();
  });

  it('hand-off picks a real teammate via /auth/members/ and sets the session to awaiting hand-off', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options?: { method?: string }) => {
        if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
          return Promise.resolve(jsonResponse(200, conversationWith(['Why is Pizza Hut at risk?'])));
        }
        if (url.endsWith('/auth/members/')) {
          return Promise.resolve(jsonResponse(200, [{ id: 2, name: 'Priya', email: 'priya@acme.io' }]));
        }
        return Promise.resolve(jsonResponse(200, []));
      })
    );
    const user = userEvent.setup();
    renderAtEntryPoint();

    await user.type(await screen.findByPlaceholderText(PLACEHOLDER), 'Why is Pizza Hut at risk?');
    await user.keyboard('{Enter}');
    await screen.findByText('Real reply #1');

    await user.click(screen.getByText('Hand off to…'));
    await user.selectOptions(await screen.findByLabelText('Hand off to'), '2');
    await user.type(screen.getByLabelText('Next action'), 'Own the recovery call.');
    await user.click(screen.getByRole('button', { name: 'Hand off' }));

    expect(await screen.findByText('Awaiting hand-off')).toBeInTheDocument();
    expect(screen.getByText(/Priya/)).toBeInTheDocument();
  });
});
