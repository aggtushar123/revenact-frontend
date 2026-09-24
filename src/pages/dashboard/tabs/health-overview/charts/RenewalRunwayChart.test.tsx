import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithDrill, healthRow } from '../testUtils';
import { RenewalRunwayChart } from './RenewalRunwayChart';
import { renewalBuckets } from '../movement';

/** Local midnight, matching the other suites, so calendar-day maths is stable. */
const NOW = new Date(2026, 5, 15); // 15 Jun 2026

// Recharts' <Bar onClick> only fires on a real, sized SVG layout, which jsdom
// doesn't give it — same limitation ControlsCharts.test.tsx and
// MovementView.test.tsx work around. `DrillTargets` renders plain buttons
// alongside the chart precisely so keyboard users (and these tests) have a
// real, clickable element regardless of chart layout.

describe('RenewalRunwayChart drill', () => {
  const soonPoor = healthRow({ id: '1', account: 'SoonPoor', renewalDate: 'Jul 1, 2026', healthStatus: 'Poor' }); // 16d
  // Near miss: same bucket, different health status.
  const soonGood = healthRow({ id: '2', account: 'SoonGood', renewalDate: 'Jul 2, 2026', healthStatus: 'Good' }); // 17d
  // Near miss: same health status, a different (much later) bucket.
  const farPoor = healthRow({ id: '3', account: 'FarPoor', renewalDate: 'Dec 1, 2027', healthStatus: 'Poor' }); // 534d

  const buckets = renewalBuckets([soonPoor, soonGood, farPoor], NOW);

  it('opens exactly the accounts in one bucket × health segment via the keyboard target', async () => {
    const user = userEvent.setup();
    renderWithDrill(<RenewalRunwayChart buckets={buckets} />);

    await user.click(screen.getByRole('button', { name: '0–90 days · Poor 1, show accounts' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('link', { name: 'SoonPoor' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'SoonGood' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'FarPoor' })).not.toBeInTheDocument();
  });

  it('opens a different segment for the same status in a later bucket', async () => {
    const user = userEvent.setup();
    renderWithDrill(<RenewalRunwayChart buckets={buckets} />);

    await user.click(screen.getByRole('button', { name: '271+ days · Poor 1, show accounts' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('link', { name: 'FarPoor' })).toBeInTheDocument();
    expect(within(dialog).queryByRole('link', { name: 'SoonPoor' })).not.toBeInTheDocument();
  });

  it('offers no target for an empty bucket-status segment', () => {
    renderWithDrill(<RenewalRunwayChart buckets={buckets} />);
    // No account in this book renews in 91-180 or 181-270 days at all.
    expect(screen.queryByRole('button', { name: /91–180 days/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /181–270 days/ })).not.toBeInTheDocument();
  });
});
