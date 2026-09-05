import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotIndex } from './Index';
import type { Conversation, ConversationSummary } from './types';

// Integration tier (see the `testing` skill): only the fetch boundary is
// mocked — real component tree, same convention as CampaignsList.test.tsx's
// own, now that a real copilot app backs this (see
// docs/API_CONTRACTS.md's `copilot` section).

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const PLACEHOLDER = "Type '/' to add variables, like {Account} and {Organization}";

const existingConversation: ConversationSummary = {
  id: 1,
  title: "What's my churn risk?",
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:05:00Z',
};

function conversationDetail(overrides: Partial<Conversation> = {}): Conversation {
  return {
    ...existingConversation,
    messages: [
      { id: 1, role: 'user', content: "What's my churn risk?", created_at: '2026-09-01T00:00:00Z' },
      { id: 2, role: 'assistant', content: 'Two accounts look at risk.', created_at: '2026-09-01T00:00:05Z' },
    ],
    ...overrides,
  };
}

async function expandSidebar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText('Expand sidebar'));
}

describe('Copilot (/copilot)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    // jsdom doesn't implement scrollIntoView — HomeView's own
    // selected-skill effect calls it (pre-existing, unrelated to this
    // feature) once a skill card is actually selected.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('loads real conversation history on mount and renders it in the sidebar', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [existingConversation]))));
    const user = userEvent.setup();
    render(<CopilotIndex />);

    await expandSidebar(user);

    expect(await screen.findByText("What's my churn risk?")).toBeInTheDocument();
  });

  it('sending a message POSTs to /copilot/messages/ and renders the real assistant reply', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      if (url.endsWith('/copilot/conversations/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse(200, conversationDetail()));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CopilotIndex />);

    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    await user.type(input, "What's my churn risk?");
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Two accounts look at risk.')).toBeInTheDocument();
    const postCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall![1]!.body!);
    expect(body).toEqual({ conversation_id: undefined, content: "What's my churn risk?" });
  });

  it('selecting a past conversation loads its real messages', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/copilot/conversations/')) {
        return Promise.resolve(jsonResponse(200, [existingConversation]));
      }
      if (url.endsWith('/copilot/conversations/1/')) {
        return Promise.resolve(jsonResponse(200, conversationDetail()));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CopilotIndex />);

    await expandSidebar(user);
    await user.click(await screen.findByText("What's my churn risk?"));

    expect(await screen.findByText('Two accounts look at risk.')).toBeInTheDocument();
  });

  it('a disabled-Copilot 403 surfaces as a real error message, not a crash', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
      if (url.endsWith('/copilot/conversations/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(403, { detail: 'AI Copilot is disabled for your organisation.' })
        );
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CopilotIndex />);

    const input = await screen.findByPlaceholderText(PLACEHOLDER);
    await user.type(input, 'Hello');
    await user.keyboard('{Enter}');

    expect(
      await screen.findByText('AI Copilot is disabled for your organisation.')
    ).toBeInTheDocument();
  });

  it('a Built-in Skill card can be run for a real send', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      if (url.endsWith('/copilot/conversations/')) {
        return Promise.resolve(jsonResponse(200, []));
      }
      if (url.endsWith('/copilot/messages/') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse(200, conversationDetail({ title: 'Skill run' })));
      }
      return Promise.resolve(jsonResponse(200, []));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<CopilotIndex />);

    await user.click(await screen.findByRole('heading', { name: 'Internal Business Review', level: 4 }));
    await user.click(await screen.findByRole('button', { name: 'Run' }));

    const postCall = await vi.waitFor(() => {
      const call = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
      expect(call).toBeTruthy();
      return call!;
    });
    const body = JSON.parse((postCall[1] as { body: string }).body);
    expect(body.content).toContain('Internal Business Review');
  });
});
