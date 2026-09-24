import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import { formatCompactMoney } from '../../../features/customers/formatters';

// Unit tier: the list on its own, with the snooze wrappers mocked at the
// module boundary (their paths are asserted in attentionApi.test.ts).
vi.mock('../../../features/attention/attentionApi', () => ({
  snooze: vi.fn(async () => undefined),
  unsnooze: vi.fn(async () => undefined),
}));

import { snooze, unsnooze } from '../../../features/attention/attentionApi';
import type { AttentionItem } from '../../../features/attention/attentionApi';
import { DrillProvider } from '../drill/DrillContext';
import { DrillPanel } from '../drill/DrillPanel';
import { AttentionList } from './AttentionList';

const items: AttentionItem[] = [
  {
    key: 'renewal:12',
    kind: 'renewal',
    title: 'Uber',
    reason: 'renewal 45 days overdue · health Average',
    at_stake: 42_000,
    urgency: 1,
    score: 42_000,
    customer_id: 12,
    companies: [],
    fingerprint: { band: 'average' },
  },
  {
    key: 'anomaly:3',
    kind: 'anomaly',
    title: 'Similar reports across 2 of your companies',
    reason: 'first seen 3 days ago',
    at_stake: 30_000,
    urgency: 1,
    score: 30_000,
    customer_id: null,
    companies: [
      { id: 12, name: 'Uber' },
      { id: 7, name: 'Pizza Hut' },
    ],
  },
  {
    key: 'going_quiet:7',
    kind: 'going_quiet',
    title: 'Pizza Hut',
    reason: 'no touch in 80 days',
    at_stake: 9_500,
    urgency: 0.5,
    score: 4_750,
    customer_id: 7,
    companies: [],
  },
];

function renderList(props: Partial<Parameters<typeof AttentionList>[0]> = {}) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <DrillProvider>
          <AttentionList items={items} currency="USD" loading={false} error={false} {...props} />
          <DrillPanel />
        </DrillProvider>
      </MemoryRouter>
    </Provider>,
  );
}

const rows = () => within(screen.getByRole('list', { name: 'Needs attention' })).getAllByRole('listitem');

describe('AttentionList', () => {
  beforeEach(() => {
    vi.mocked(snooze).mockReset().mockResolvedValue(undefined);
    vi.mocked(unsnooze).mockReset().mockResolvedValue(undefined);
  });

  it('renders items in order with tag, reason and money, and never the fingerprint', () => {
    renderList();
    const [first, second, third] = rows();
    expect(first).toHaveTextContent('Renewal');
    expect(first).toHaveTextContent('Uber');
    expect(first).toHaveTextContent('renewal 45 days overdue · health Average');
    expect(first).toHaveTextContent(formatCompactMoney(42_000, 'USD'));
    expect(second).toHaveTextContent('Anomaly');
    expect(third).toHaveTextContent('Going quiet');
    expect(third).toHaveTextContent(formatCompactMoney(9_500, 'USD'));
    expect(screen.queryByText(/average"/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain('band');
  });

  it('shows the count in the header', () => {
    renderList();
    expect(screen.getByRole('heading', { name: 'Needs attention' })).toBeInTheDocument();
    expect(screen.getByTestId('attention-count')).toHaveTextContent('3');
  });

  it('links a company title to its page', () => {
    renderList();
    expect(screen.getByRole('link', { name: 'Uber' })).toHaveAttribute('href', '/organizations/12');
  });

  it('opens the drill panel listing an anomaly’s companies', async () => {
    renderList();
    await userEvent.click(screen.getByRole('button', { name: 'Similar reports across 2 of your companies' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('2 companies');
    expect(within(dialog).getByText('Pizza Hut')).toBeInTheDocument();
    expect(within(dialog).getByText('Uber')).toBeInTheDocument();
  });

  it('snoozes for 7 days, hides the row, and Undo restores it in place', async () => {
    renderList();
    const first = rows()[0];
    await userEvent.click(within(first).getByRole('button', { name: 'Snooze 7 days' }));
    expect(snooze).toHaveBeenCalledWith('renewal:12', { days: 7 });
    expect(screen.queryByRole('link', { name: 'Uber' })).not.toBeInTheDocument();
    expect(rows()[0]).toHaveTextContent('Snoozed');
    expect(screen.getByTestId('attention-count')).toHaveTextContent('2');

    await userEvent.click(within(rows()[0]).getByRole('button', { name: 'Undo' }));
    expect(unsnooze).toHaveBeenCalledWith('renewal:12');
    expect(within(rows()[0]).getByRole('link', { name: 'Uber' })).toBeInTheDocument();
    expect(screen.getByTestId('attention-count')).toHaveTextContent('3');
  });

  it('marks an item done', async () => {
    renderList();
    await userEvent.click(within(rows()[2]).getByRole('button', { name: 'Done' }));
    expect(snooze).toHaveBeenCalledWith('going_quiet:7', { done: true });
    expect(rows()[2]).toHaveTextContent('Marked done');
    expect(within(rows()[2]).getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('restores the row and shows an alert when the snooze fails', async () => {
    vi.mocked(snooze).mockRejectedValueOnce(new Error('network'));
    renderList();
    await userEvent.click(within(rows()[0]).getByRole('button', { name: 'Snooze 7 days' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not snooze Uber');
    await waitFor(() => expect(within(rows()[0]).getByRole('link', { name: 'Uber' })).toBeInTheDocument());
  });

  it('says so when nothing needs attention', () => {
    renderList({ items: [] });
    expect(screen.getByText('Nothing needs you right now.')).toBeInTheDocument();
  });

  it('shows an error rather than an empty list', () => {
    renderList({ items: null, error: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load what needs attention.');
    expect(screen.queryByText('Nothing needs you right now.')).not.toBeInTheDocument();
  });

  it('keeps stale items visible under an error', () => {
    renderList({ error: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load what needs attention.');
    expect(screen.getByRole('link', { name: 'Uber' })).toBeInTheDocument();
  });

  it('shows five skeleton rows while loading, never a spinner', () => {
    renderList({ items: null, loading: true });
    expect(screen.getAllByTestId('attention-skeleton-row')).toHaveLength(5);
    expect(screen.getByRole('status')).toHaveTextContent('Loading what needs attention');
  });
});
