import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { healthRow, renderWithHealth } from './testUtils';
import { RenewalView } from './RenewalView';
import { HealthOverviewContainer } from '../HealthOverviewContainer';

// Integration tier. The two Recharts charts need a sized container jsdom won't
// give them, so they're asserted on by their headings and their own summary
// text; the owner bars and the work list are plain DOM and are asserted
// directly. The money maths is pinned to fixtures in renewal.test.ts.

/** A row renewing `days` from today, so the fixtures move with the clock the
 *  component reads rather than being pinned to a date that goes stale. */
function renewingIn(days: number, overrides: Parameters<typeof healthRow>[0] = {}) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return healthRow({
    renewalDate: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    ...overrides,
  });
}

const BOOK = [
  renewingIn(12, {
    id: '1',
    account: 'Nova Enterprises',
    owner: 'Gerry Hill',
    arr: 240_000,
    healthStatus: 'Poor',
    daysSinceTouch: 95,
  }),
  renewingIn(45, {
    id: '2',
    account: 'Hyatt Hotels',
    owner: 'Ada Lovelace',
    arr: 120_000,
    healthStatus: 'Good',
    daysSinceTouch: 4,
  }),
  renewingIn(200, {
    id: '3',
    account: 'Far Future Co',
    owner: 'Ada Lovelace',
    arr: 600_000,
    healthStatus: 'Average',
    daysSinceTouch: 20,
  }),
];

/** The stat tile carrying `label`, so a number that legitimately appears twice
 *  is still asserted against the right card. */
const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('RenewalView', () => {
  it('leads with the money renewing in the next 90 days, not the whole book', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    // 240k + 120k. The 600k renewing in 200 days is real revenue but it is not
    // this quarter's problem, and rolling it in makes the window meaningless.
    expect(within(tile('Up for renewal')).getByText('$360.0K')).toBeInTheDocument();
    expect(within(tile('Up for renewal')).getByText(/2 accounts/)).toBeInTheDocument();
  });

  it('shows forecast exposure as less than the window it came from', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    // Poor + cold is 0.6 of 240k, Good is 0.05 of 120k — $150K, not $360K.
    // A tab that called the whole window "at risk" would be ignored by week two.
    expect(within(tile('Forecast at risk')).getByText('$150.0K')).toBeInTheDocument();
  });

  it('calls out renewing money with nobody talking to it', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    const card = tile('No recent contact');
    expect(within(card).getByText('$240.0K')).toBeInTheDocument();
    expect(within(card).getByText(/1 renewing with nothing logged in 60 days/)).toBeInTheDocument();
  });

  it('reports overdue renewals separately from the window', () => {
    renderWithHealth(<RenewalView />, {
      rows: [...BOOK, renewingIn(-9, { id: '4', account: 'Slipped Ltd', arr: 80_000 })],
    });

    expect(within(tile('Past due')).getByText('1')).toBeInTheDocument();
    expect(within(tile('Past due')).getByText(/\$80\.0K past its renewal date/)).toBeInTheDocument();
    // Still $360K: an overdue renewal is not "due now".
    expect(within(tile('Up for renewal')).getByText('$360.0K')).toBeInTheDocument();
  });

  it('says so when every renewal date is still ahead', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    expect(within(tile('Past due')).getByText(/every renewal date is still ahead/)).toBeInTheDocument();
  });

  it('names what it cannot speak for rather than quietly dropping it', () => {
    renderWithHealth(<RenewalView />, {
      rows: [...BOOK, healthRow({ id: '5', renewalDate: '' })],
      unconvertedCount: 2,
    });

    expect(screen.getByText(/1 with no renewal date recorded/)).toBeInTheDocument();
    expect(screen.getByText(/2 excluded from money totals/)).toBeInTheDocument();
  });

  it('ranks the work list by expected loss rather than by contract size', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    const rows = screen.getAllByRole('row').slice(1); // drop the header row
    expect(within(rows[0]).getByText('Nova Enterprises')).toBeInTheDocument();
    // And it shows why it ranked that way.
    expect(within(rows[0]).getByText(/Poor health · No contact in 95 days/)).toBeInTheDocument();
  });

  it('keeps the work list to the accounts that renew soon', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    expect(screen.queryByText('Far Future Co')).not.toBeInTheDocument();
  });

  it('shows an unpriced renewal as a dash rather than as nothing at stake', () => {
    renderWithHealth(<RenewalView />, {
      rows: [renewingIn(10, { id: '9', account: 'Unpriced Co', arr: null })],
    });

    const row = screen.getByText('Unpriced Co').closest('tr')!;
    expect(within(row).getAllByText('—')).toHaveLength(2); // ARR and exposure
  });

  it('shows each owner their renewal load', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    // Ada's book is $120K here, not $720K: her other renewal is 200 days out,
    // past the two-quarter horizon this chart is a staffing decision for. Her
    // name also appears in the work list, so this asserts on the bar's own
    // label rather than on the text.
    expect(
      screen.getByRole('img', { name: /Ada Lovelace: \$120,000\.00 renewing/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Gerry Hill: \$240,000\.00 renewing/ })
    ).toBeInTheDocument();
  });

  it('draws the calendar and the coverage gap', () => {
    renderWithHealth(<RenewalView />, { rows: BOOK });

    expect(screen.getByText('Renewal calendar')).toBeInTheDocument();
    expect(screen.getByText('Coverage gap')).toBeInTheDocument();
    // The coverage chart's own headline: only the 240k inside 90 days counts,
    // not the 600k account that is also stale but far out.
    expect(screen.getByText(/\$240\.0K renewing in 90 days with no recent contact/)).toBeInTheDocument();
  });

  it('says the book is empty rather than drawing empty charts', () => {
    renderWithHealth(<RenewalView />, { rows: [] });

    expect(screen.queryByText('Renewal calendar')).not.toBeInTheDocument();
  });

  it('surfaces a failed load', () => {
    renderWithHealth(<RenewalView />, { rows: [], error: 'Could not load account health.' });

    expect(screen.getByText('Could not load account health.')).toBeInTheDocument();
  });

  it('is reachable from the tab bar as a tab, not as a filter chip', () => {
    // It used to render as a chip reading "All" and route to a placeholder.
    renderWithHealth(
      <MemoryRouter initialEntries={['/dashboard/advance/health/renewal-date']}>
        <Routes>
          <Route path="/dashboard/advance/health" element={<HealthOverviewContainer />}>
            <Route index element={<Navigate to="triage" replace />} />
            <Route path="renewal-date" element={<RenewalView />} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { rows: BOOK }
    );

    const link = screen.getByRole('link', { name: 'Renewal Date' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Renewal calendar')).toBeInTheDocument();
  });
});
