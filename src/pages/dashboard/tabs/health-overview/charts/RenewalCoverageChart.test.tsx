import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithDrill, healthRow } from '../testUtils';
import { RenewalCoverageChart } from './RenewalCoverageChart';
import { coverageBands, renewalRows } from '../renewal';

/** Local midnight, matching the other suites, so calendar-day maths is stable. */
const NOW = new Date(2026, 5, 15); // 15 Jun 2026

describe('RenewalCoverageChart drill', () => {
  const freshSoon = healthRow({ id: '1', account: 'FreshSoon', renewalDate: 'Jun 25, 2026', arr: 10_000, daysSinceTouch: 2 }); // 10d, window '30'
  // Near miss: same window, a different contact age.
  const coldSoon = healthRow({ id: '2', account: 'ColdSoon', renewalDate: 'Jul 5, 2026', arr: 20_000, daysSinceTouch: 200 }); // 20d, window '30'
  // Near miss: same contact age, a different window.
  const coldLater = healthRow({ id: '3', account: 'ColdLater', renewalDate: 'Aug 15, 2026', arr: 5_000, daysSinceTouch: 200 }); // 61d, window '90'

  const { rows } = renewalRows([freshSoon, coldSoon, coldLater], NOW);
  const bands = coverageBands(rows);

  it('opens exactly the accounts in one window × contact-age segment', async () => {
    const user = userEvent.setup();
    renderWithDrill(<RenewalCoverageChart bands={bands} currency="USD" />);

    await user.click(screen.getByRole('button', { name: 'Next 30 days · Contacted <30d $10.0K, show accounts' }));
    const dialog = screen.getByRole('dialog');
    // The figure is the money the bar segment shows, not a count of accounts.
    expect(dialog).toHaveTextContent('Next 30 days · Contacted <30d $10.0K');

    expect(within(dialog).getByRole('link', { name: 'FreshSoon' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'ColdSoon' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'ColdLater' })).not.toBeInTheDocument();
  });

  it('opens a different segment for the same contact age in a different window', async () => {
    const user = userEvent.setup();
    renderWithDrill(<RenewalCoverageChart bands={bands} currency="USD" />);

    await user.click(screen.getByRole('button', { name: 'Next 30 days · No contact 60d+ $20.0K, show accounts' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('link', { name: 'ColdSoon' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'ColdLater' })).not.toBeInTheDocument();
  });

  it('offers no target for an empty window-contact-age segment', () => {
    renderWithDrill(<RenewalCoverageChart bands={bands} currency="USD" />);
    expect(screen.queryByRole('button', { name: /Overdue/ })).not.toBeInTheDocument();
  });
});
