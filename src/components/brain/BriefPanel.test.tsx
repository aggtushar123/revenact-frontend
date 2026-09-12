import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import metricsReducer from '../../features/metrics/metricsSlice';
import { BriefPanel } from './BriefPanel';
import { capabilitiesForRole } from '../../test/capabilities';

const brief = {
  id: 3,
  as_of: '2026-09-12',
  baseline: '2026-08-31',
  headline: 'ARR stable at $688,600 with no material changes since last month-end.',
  body: 'The book remains stable at $688,600.\n\nRisk sits with Product B.',
  watch: ['Monitor the $114,540 ARR at risk', 'Address seat utilisation at 59.6%'],
  generated_at: '2026-09-12T15:40:02Z',
  generated_by: 'Alice',
};

function mockApi(existing: unknown = brief, generate: { status: number; body: unknown } = { status: 201, body: { brief: { ...brief, id: 4, headline: 'A fresh headline.' } } }) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((_url, init) => {
    if (init?.method === 'POST') {
      return Promise.resolve({ ok: generate.status < 400, status: generate.status, json: async () => generate.body });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ brief: existing }) });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderPanel(role: 'admin' | 'csm' = 'admin') {
  const store = configureStore({
    reducer: { auth: authReducer, metrics: metricsReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1, email: 'alice@acme.io', name: 'Alice', avatar: '', role, role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM', permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success', reports_to: null,
          organisation: {
            id: 1, name: 'Acme Inc', slug: 'acme-inc', currency: 'USD' as const, currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '', ai_agent_enabled: true, ai_agent_tone: 'professional' as const, ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token', refreshToken: 'refresh', isAuthenticated: true, isLoading: false, error: null,
      },
    },
  });
  render(
    <Provider store={store}>
      <BriefPanel />
    </Provider>
  );
}

describe('BriefPanel', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows the latest brief: headline, paragraphs, watch list and provenance', async () => {
    mockApi();
    renderPanel();

    expect(await screen.findByText(brief.headline)).toBeInTheDocument();
    expect(screen.getByText('The book remains stable at $688,600.')).toBeInTheDocument();
    expect(screen.getByText('Risk sits with Product B.')).toBeInTheDocument();
    expect(screen.getByText('Monitor the $114,540 ARR at risk')).toBeInTheDocument();
    expect(screen.getByText(/Written .* by Alice from the figures as of .*, compared with Aug end\./)).toBeInTheDocument();
  });

  it('never regenerates on load — only reads', async () => {
    const spy = mockApi();
    renderPanel();

    await screen.findByText(brief.headline);
    expect(spy.mock.calls.every(([, init]) => init?.method !== 'POST')).toBe(true);
  });

  it('says so when no brief has been written, and offers to write the first', async () => {
    mockApi(null);
    renderPanel();

    expect(await screen.findByText('No brief written yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Write the first brief' })).toBeInTheDocument();
  });

  it('writes a new brief on click and shows it', async () => {
    const spy = mockApi();
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText(brief.headline);
    await user.click(screen.getByRole('button', { name: 'Write a new brief' }));

    expect(await screen.findByText('A fresh headline.')).toBeInTheDocument();
    const post = spy.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(String(post?.[0])).toContain('/metrics/brief/generate/');
  });

  it('surfaces the provider being unavailable', async () => {
    mockApi(brief, { status: 503, body: { detail: 'No LLM provider is configured.' } });
    const user = userEvent.setup();
    renderPanel();

    await screen.findByText(brief.headline);
    await user.click(screen.getByRole('button', { name: 'Write a new brief' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/No LLM provider is configured|Could not write/);
    // The old brief stays on screen.
    expect(screen.getByText(brief.headline)).toBeInTheDocument();
  });

  it('renders nothing for someone without view-all-accounts', () => {
    const spy = mockApi();
    renderPanel('csm');

    expect(screen.queryByText('Management brief')).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
