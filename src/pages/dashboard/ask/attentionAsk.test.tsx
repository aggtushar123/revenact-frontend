import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttentionList } from '../overview/AttentionList';
import type { AttentionItem } from '../../../features/attention/attentionApi';
import { resetViewport } from '../../../test/viewport';
import { postedBodies, stubCopilot } from '../../../components/copilot/testCopilot';
import { renderDashboard } from './testAsk';

const items: AttentionItem[] = [
  { key: 'renewal:12', kind: 'renewal', title: 'Uber', reason: 'renewal 45 days overdue', at_stake: 42_000, urgency: 1, score: 42_000, customer_id: 12, companies: [] },
];

describe('"Why?" on an attention row', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => resetViewport());

  it('opens a collapsed rail and asks at once, about that item', async () => {
    const { spy } = stubCopilot();
    renderDashboard('/dashboard/overview?owner=2', () => <AttentionList items={items} currency="USD" loading={false} error={false} />, 1100);
    expect(screen.queryByRole('complementary', { name: 'Ask Revenact' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ask why Uber is on my list' }));
    expect(screen.getByRole('complementary', { name: 'Ask Revenact' })).toBeInTheDocument();
    expect(await screen.findByText('Answer to: Why is this on my list?')).toBeInTheDocument();
    expect(postedBodies(spy)).toEqual([
      {
        content: 'Why is this on my list?',
        context: { surface: 'dashboard', area: 'overview', view: null, filters: { owner: '2', lifecycle: '', customer: '' }, focus: { kind: 'attention', key: 'renewal:12' } },
      },
    ]);
  });

  it('is off while the list is stale', () => {
    stubCopilot();
    renderDashboard('/dashboard/overview', () => <AttentionList items={items} currency="USD" loading error={false} />, 1440);
    expect(screen.getByRole('button', { name: 'Ask why Uber is on my list' })).toBeDisabled();
  });
});
