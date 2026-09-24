import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithHealth, renderHealthAt, renderWithDrill, healthRow } from './testUtils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TriageView } from './TriageView';
import { HealthOverviewContainer } from '../HealthOverviewContainer';
import { MOCK_HEALTH_DATA } from './mockData';

/** The generated mock, used here purely as a fixture book — the tabs
 *  themselves read `state.health`, which the real app fills from
 *  /customers/health/. */
const BOOK = MOCK_HEALTH_DATA;
import { scoreRow } from './triage';

// Integration tier: view + queue + glyphs, and the container's routing into
// them. MOCK_HEALTH_DATA is generated with Math.random() at import time, so
// these assert on structure and on relationships between what's rendered —
// never on a specific account or count. (The scoring itself is pinned to
// fixtures in triage.test.ts.)

// Scoped to the risk-score list specifically: the KPI strip above it also
// renders `<li>` items now that `TriageTiles` shares `KpiStrip`, so an
// unscoped `listitem` query would double-count them as queue rows.
const queue = () => screen.getByRole('list', { name: /accounts by risk score/i });
const rows = () => within(queue()).queryAllByRole('listitem');
const statusOf = (row: HTMLElement) =>
  within(row).getByText(/^(Poor|Average|Good)$/).textContent as 'Poor' | 'Average' | 'Good';

describe('TriageView', () => {
  it('opens on the three summary figures and the ranked queue', () => {
    renderWithHealth(<TriageView />, { rows: BOOK });

    expect(screen.getByText(/needs action now/i)).toBeInTheDocument();
    expect(screen.getByText(/^declining$/i)).toBeInTheDocument();
    expect(screen.getByText(/book at good/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /accounts by risk score/i })).toBeInTheDocument();
  });

  it('ranks the queue by risk score, worst first', () => {
    renderWithHealth(<TriageView />, { rows: BOOK });

    // The invariant is the *score*, not the health chip: an Average account
    // with a wide pulse gap and a renewal next month legitimately outranks a
    // Poor one that is stable and renews in a year. Score each rendered
    // account against one clock and check the sequence never climbs.
    const now = new Date();
    const byAccount = new Map(MOCK_HEALTH_DATA.map((r) => [r.account, r]));
    // Longest name first, so "Nova Enterprises 19" matches ahead of the
    // hand-written "Nova Enterprises" it contains.
    const names = [...byAccount.keys()].sort((a, b) => b.length - a.length);
    const scores = rows().map((li) => {
      const text = li.textContent ?? '';
      const account = names.find((n) => text.includes(n));
      expect(account, `no known account in row: ${text}`).toBeDefined();
      return scoreRow(byAccount.get(account!)!, now).score;
    });

    expect(scores.length).toBeGreaterThan(1);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it('caps the queue until asked for the rest', async () => {
    const user = userEvent.setup();
    renderWithHealth(<TriageView />, { rows: BOOK });

    expect(rows()).toHaveLength(12);

    await user.click(screen.getByRole('button', { name: /show all \d+ accounts/i }));
    expect(rows()).toHaveLength(MOCK_HEALTH_DATA.length);

    await user.click(screen.getByRole('button', { name: /show top 12 only/i }));
    expect(rows()).toHaveLength(12);
  });

  it('filters the queue by health status and clears again', async () => {
    const user = userEvent.setup();
    renderWithHealth(<TriageView />, { rows: BOOK });

    const poor = screen.getByRole('button', { name: 'Poor' });
    expect(poor).toHaveAttribute('aria-pressed', 'false');

    await user.click(poor);
    expect(poor).toHaveAttribute('aria-pressed', 'true');

    // Every row left in the queue is Poor. mockData always seeds at least one.
    expect(rows().length).toBeGreaterThan(0);
    rows().forEach((row) => expect(statusOf(row)).toBe('Poor'));

    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(poor).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(`Showing ${MOCK_HEALTH_DATA.length} of ${MOCK_HEALTH_DATA.length}`))
      .toBeInTheDocument();
  });

  it('toggles a filter off when its own chip is clicked again', async () => {
    const user = userEvent.setup();
    renderWithHealth(<TriageView />, { rows: BOOK });

    const good = screen.getByRole('button', { name: 'Good' });
    await user.click(good);
    expect(good).toHaveAttribute('aria-pressed', 'true');
    await user.click(good);
    expect(good).toHaveAttribute('aria-pressed', 'false');
  });

  it('describes each row’s pulse pair and trajectory for assistive tech', () => {
    renderWithHealth(<TriageView />, { rows: BOOK });

    expect(screen.getAllByLabelText(/CSM Pulse (\d|not rated), AI Pulse (\d|not rated)/).length)
      .toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/^Trajectory: /).length).toBeGreaterThan(0);
  });
});

describe('TriageView drill', () => {
  // Renewal always distant, so a row's score comes only from the factor
  // under test — a default `renewalDate` close enough to trigger the
  // renewal-proximity weighting would contaminate every row identically.
  const FAR = 'Dec 31, 2099';

  it('"Needs action now" opens exactly the accounts scoring at or above the threshold', async () => {
    const user = userEvent.setup();
    const rows = [
      // Poor alone already clears the threshold (severity 3 * 22 = 66).
      healthRow({ id: '1', account: 'ActionPoor', healthStatus: 'Poor', renewalDate: FAR }),
      // Average (22) + a 2-point AI-colder gap (2 * 11 = 22) = 44.
      healthRow({
        id: '2',
        account: 'ActionGap',
        healthStatus: 'Average',
        csmPulseScore: 5,
        aiPulseScore: 3,
        renewalDate: FAR,
      }),
      // Average (22) + pilot (6) + a 2-point gap (22) = 50.
      healthRow({
        id: '3',
        account: 'ActionCombo',
        healthStatus: 'Average',
        csmPulseScore: 4,
        aiPulseScore: 2,
        lifecycleStage: 'Pilot',
        renewalDate: FAR,
      }),
      // Near miss: Average alone is only 22 — well short of 40.
      healthRow({ id: '4', account: 'BelowThreshold', healthStatus: 'Average', renewalDate: FAR }),
      // Near miss: pilot (6) + a 1-point gap (11) on an otherwise Good
      // account is 17 — nowhere near the threshold.
      healthRow({
        id: '5',
        account: 'BelowThresholdGood',
        healthStatus: 'Good',
        lifecycleStage: 'Pilot',
        csmPulseScore: 4,
        aiPulseScore: 3,
        renewalDate: FAR,
      }),
      // Near miss, right at the boundary: Average (22) + a 1-point gap
      // (11) = 33 — the closest a row gets to 40 without clearing it.
      healthRow({
        id: '6',
        account: 'AlmostThere',
        healthStatus: 'Average',
        csmPulseScore: 4,
        aiPulseScore: 3,
        renewalDate: FAR,
      }),
    ];

    renderWithDrill(<TriageView />, { rows });

    await user.click(screen.getByRole('button', { name: 'Needs action now 3, show accounts' }));
    const dialog = screen.getByRole('dialog');

    ['ActionPoor', 'ActionGap', 'ActionCombo'].forEach((name) =>
      expect(within(dialog).getByRole('link', { name })).toBeInTheDocument(),
    );
    ['BelowThreshold', 'BelowThresholdGood', 'AlmostThere'].forEach((name) =>
      expect(within(dialog).queryByRole('link', { name })).not.toBeInTheDocument(),
    );
  });

  it('"Declining" opens exactly the accounts whose trajectory fell', async () => {
    const user = userEvent.setup();
    const trail = (...statuses: ('Good' | 'Average' | 'Poor')[]) =>
      statuses.map((status, i) => ({ month: `M${i}`, status }));
    const rows = [
      healthRow({
        id: '1',
        account: 'DownTrend',
        healthStatus: 'Poor',
        renewalDate: FAR,
        history: trail('Good', 'Average', 'Poor'),
      }),
      // Near miss: flat, never moves.
      healthRow({
        id: '2',
        account: 'FlatTrend',
        healthStatus: 'Good',
        renewalDate: FAR,
        history: trail('Good', 'Good', 'Good'),
      }),
      // Near miss: the opposite direction.
      healthRow({
        id: '3',
        account: 'UpTrend',
        healthStatus: 'Good',
        renewalDate: FAR,
        history: trail('Poor', 'Average', 'Good'),
      }),
      // Near miss: one data point is 'unknown', not 'declining'.
      healthRow({
        id: '4',
        account: 'ShortHistory',
        healthStatus: 'Poor',
        renewalDate: FAR,
        history: trail('Poor'),
      }),
    ];

    renderWithDrill(<TriageView />, { rows });

    await user.click(screen.getByRole('button', { name: 'Declining 1, show accounts' }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('link', { name: 'DownTrend' })).toBeInTheDocument();
    ['FlatTrend', 'UpTrend', 'ShortHistory'].forEach((name) =>
      expect(within(dialog).queryByRole('link', { name })).not.toBeInTheDocument(),
    );
  });

  it('"Book at Good" opens exactly the accounts currently at Good', async () => {
    const user = userEvent.setup();
    const rows = [
      healthRow({ id: '1', account: 'GoodOne', healthStatus: 'Good', renewalDate: FAR }),
      healthRow({ id: '2', account: 'GoodTwo', healthStatus: 'Good', renewalDate: FAR }),
      healthRow({ id: '3', account: 'AverageOne', healthStatus: 'Average', renewalDate: FAR }),
      healthRow({ id: '4', account: 'PoorOne', healthStatus: 'Poor', renewalDate: FAR }),
    ];

    renderWithDrill(<TriageView />, { rows });

    await user.click(screen.getByRole('button', { name: 'Book at Good 2/4, show accounts' }));
    const dialog = screen.getByRole('dialog');

    ['GoodOne', 'GoodTwo'].forEach((name) =>
      expect(within(dialog).getByRole('link', { name })).toBeInTheDocument(),
    );
    ['AverageOne', 'PoorOne'].forEach((name) =>
      expect(within(dialog).queryByRole('link', { name })).not.toBeInTheDocument(),
    );
  });
});

describe('Health Overview routing', () => {
  const renderAt = (path: string) =>
    renderWithHealth(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/health" element={<HealthOverviewContainer />}>
            <Route index element={<Navigate to="triage" replace />} />
            <Route path="triage" element={<TriageView />} />
            <Route path="distribution" element={<p>Distribution stub</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { rows: BOOK },
    );

  it('lands on Triage rather than Distribution', () => {
    renderAt('/dashboard/health');
    expect(screen.getByRole('heading', { name: /accounts by risk score/i })).toBeInTheDocument();
  });

  // Tab order and cross-tab navigation now live in the shared sub-view nav
  // (`DashboardToolbar`, fed by `AREAS` in `areas.ts`), which has its own
  // tests — the container no longer renders a tab bar of its own for this
  // to reach through.

  // DashboardToolbar's own test mounts it one level deep
  // (`/dashboard/health/:view`), which doesn't match production: the real
  // tree is `health` (AreaLayout) -> a pathless container route -> the view
  // route. Only this shape — the real route tree, via `renderHealthAt` —
  // catches a toolbar link that resolves against the wrong ancestor.
  it('links every sub-view to its own area path through the real route tree', () => {
    renderHealthAt('/dashboard/health/triage', { rows: BOOK });

    const nav = screen.getByRole('navigation', { name: /views/i });
    expect(within(nav).getByRole('link', { name: 'Triage' })).toHaveAttribute(
      'href',
      '/dashboard/health/triage',
    );
    expect(within(nav).getByRole('link', { name: 'Triage' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Divergence' })).toHaveAttribute(
      'href',
      '/dashboard/health/divergence',
    );
    expect(within(nav).getByRole('link', { name: 'Divergence' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(within(nav).getByRole('link', { name: 'Distribution' })).toHaveAttribute(
      'href',
      '/dashboard/health/distribution',
    );
  });
});

describe('TriageView data states', () => {
  // The tabs read a real endpoint now, so they have to say what's happening
  // rather than render an empty queue that looks like a healthy book.
  it('says it is loading before the first book arrives', () => {
    renderWithHealth(<TriageView />, { rows: [], loaded: false, isLoading: true });
    expect(screen.getByText(/loading account health/i)).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows the failure rather than an empty queue', () => {
    // An empty triage queue means "nothing needs attention", which is the
    // opposite of what a failed fetch means.
    renderWithHealth(<TriageView />, { rows: [], error: 'Could not load account health.' });
    expect(screen.getByText('Could not load account health.')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('distinguishes an empty book from a failure', () => {
    renderWithHealth(<TriageView />, { rows: [] });
    expect(screen.getByText(/no accounts to show yet/i)).toBeInTheDocument();
  });

  it('warns when the book was larger than one request returns', () => {
    renderWithHealth(<TriageView />, { rows: BOOK, truncated: true });
    expect(screen.getByText(/showing the first accounts only/i)).toBeInTheDocument();
  });

  it('keeps the queue on screen while a refresh is in flight', () => {
    // isLoading with rows already loaded is a refresh, not a first load —
    // blanking the screen for it would be worse than a slightly stale number.
    renderWithHealth(<TriageView />, { rows: BOOK, isLoading: true, loaded: true });
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    expect(screen.queryByText(/loading account health/i)).not.toBeInTheDocument();
  });
});
