import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import metricsReducer from '../../features/metrics/metricsSlice';
import { ExplanationCard } from './ExplanationCard';

const explanation = {
  id: 3,
  metric: 'at_risk_arr',
  metric_label: 'ARR at risk',
  as_of: '2026-09-12',
  baseline: '2026-08-31',
  value: 114540,
  previous_value: 80000,
  text: 'ARR at risk rose because Product B renewals slipped; Pizza Hut carries most of it.',
  evidence: ['Product B: USD 64,090 (was USD 34,090)', 'Pizza Hut (owner Carl): downside USD 17,400'],
  generated_at: '2026-09-12T18:00:00Z',
  generated_by: 'Alice',
};

function mockApi(initial: typeof explanation | null) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((_url, init) => {
    const ok = (body: unknown, status = 200) => Promise.resolve({ ok: true, status, json: async () => body });
    if (init?.method === 'POST') return ok({ explanation }, 201);
    return ok({ explanation: initial });
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function renderCard(asOf?: string) {
  const store = configureStore({ reducer: { metrics: metricsReducer } });
  render(
    <Provider store={store}>
      <ExplanationCard metricKey="at_risk_arr" asOf={asOf} />
    </Provider>
  );
}

describe('ExplanationCard', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('reads for free, then writes only on the click', async () => {
    const spy = mockApi(null);
    renderCard('2026-09-12');

    await screen.findByText('Nobody has asked why yet.');
    expect(spy.mock.calls.every(([, init]) => init?.method !== 'POST')).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Ask Claude why' }));

    await screen.findByText(/Product B renewals slipped/);
    expect(screen.getByText('· Pizza Hut (owner Carl): downside USD 17,400')).toBeInTheDocument();
    expect(screen.getByText(/asked by Alice/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explain again' })).toBeInTheDocument();
    expect(spy.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
  });

  it('says plainly when the stored explanation is about another day', async () => {
    mockApi(explanation);
    renderCard('2026-09-13');

    await waitFor(() => expect(screen.getByText(/Explains .*, not today/)).toBeInTheDocument());
  });
});
