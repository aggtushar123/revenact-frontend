import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithHealth } from './testUtils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MovementView } from './MovementView';
import { HealthFlowChart } from './charts/HealthFlowChart';
import { HealthOverviewContainer } from '../HealthOverviewContainer';
import { MOCK_HEALTH_DATA, HISTORY_MONTHS } from './mockData';

/** The generated mock, used here purely as a fixture book — the tab itself
 *  reads `state.health`, which the real app fills from /customers/health/. */
const BOOK = MOCK_HEALTH_DATA;
import { buildFlow, netMovement } from './movement';

// Integration tier. The renewal chart is recharts and needs a sized container
// jsdom won't give it, so it is asserted on by heading only; the flow chart is
// hand-drawn SVG and *can* be asserted on directly. The maths is pinned to
// fixtures in movement.test.ts.

const flowFig = () => screen.getByRole('img', { name: /Health state flow/i });

/** The stat tile carrying `label`. Scoping to it keeps the assertion honest
 *  when two tiles happen to show the same number — a bare getByText on the
 *  value throws on that collision, which the random mock draw makes sporadic. */
const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('MovementView', () => {
  it('opens on the six-month window', () => {
    renderWithHealth(<MovementView />, { rows: BOOK });
    expect(screen.getByRole('button', { name: '6 months' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '3 months' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows both directions of movement and the net', () => {
    renderWithHealth(<MovementView />, { rows: BOOK });
    const expected = netMovement(buildFlow(BOOK, 6));

    expect(within(tile('Downgrades')).getByText(String(expected.declined))).toBeInTheDocument();
    expect(within(tile('Upgrades')).getByText(String(expected.improved))).toBeInTheDocument();
    expect(within(tile('Net movement')).getByText(
      expected.net > 0 ? `+${expected.net}` : String(expected.net),
    )).toBeInTheDocument();
  });

  it('draws one column per month in the chosen window', async () => {
    const user = userEvent.setup();
    renderWithHealth(<MovementView />, { rows: BOOK });

    // Month labels are <text> nodes; count them rather than the stacked rects,
    // which vary with how many states are present in a given month.
    const labels = () => flowFig().querySelectorAll('text').length;
    const columnsFor = (months: number) => months; // one label per month

    await user.click(screen.getByRole('button', { name: '3 months' }));
    const threeMonth = labels();

    await user.click(screen.getByRole('button', { name: '12 months' }));
    expect(labels()).toBeGreaterThan(threeMonth);
    expect(flowFig()).toHaveAttribute(
      'aria-label',
      expect.stringContaining(`${columnsFor(HISTORY_MONTHS)} months`),
    );
  });

  it('narrows the window when asked', async () => {
    const user = userEvent.setup();
    renderWithHealth(<MovementView />, { rows: BOOK });

    await user.click(screen.getByRole('button', { name: '3 months' }));
    expect(screen.getByRole('button', { name: '3 months' })).toHaveAttribute('aria-pressed', 'true');
    expect(flowFig()).toHaveAttribute('aria-label', expect.stringContaining('3 months'));

    const expected = netMovement(buildFlow(BOOK, 3));
    expect(within(tile('Downgrades')).getByText(String(expected.declined))).toBeInTheDocument();
  });

  it('reports the window’s span and how many accounts it tracks', () => {
    renderWithHealth(<MovementView />, { rows: BOOK });
    const flow = buildFlow(BOOK, 6);
    expect(
      screen.getByText(new RegExp(`${flow.tracked} accounts tracked`)),
    ).toBeInTheDocument();
  });

  it('keeps the renewal runway alongside the flow', () => {
    renderWithHealth(<MovementView />, { rows: BOOK });
    expect(screen.getByRole('heading', { name: /renewal runway/i })).toBeInTheDocument();
  });
});

describe('HealthFlowChart', () => {
  it('says so rather than drawing an empty axis when nothing has history', () => {
    renderWithHealth(<HealthFlowChart flow={{ months: [], steps: [], tracked: 0 }} />);
    expect(screen.getByText(/No health history recorded/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('titles every ribbon and column so the numbers are reachable on hover', () => {
    renderWithHealth(<HealthFlowChart flow={buildFlow(BOOK, 3)} />);
    const titles = [...flowFig().querySelectorAll('title')].map((t) => t.textContent ?? '');

    expect(titles.length).toBeGreaterThan(0);
    expect(titles.some((t) => /\d+ accounts?: \w+ → \w+/.test(t))).toBe(true);
    expect(titles.some((t) => /: \d+ (Good|Average|Poor)$/.test(t))).toBe(true);
  });
});

describe('Health Overview routing with Movement', () => {
  const renderAt = (path: string) =>
    renderWithHealth(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/advance/health" element={<HealthOverviewContainer />}>
            <Route index element={<Navigate to="triage" replace />} />
            <Route path="triage" element={<p>Triage stub</p>} />
            <Route path="divergence" element={<p>Divergence stub</p>} />
            <Route path="movement" element={<MovementView />} />
            <Route path="controls" element={<p>Controls stub</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { rows: BOOK },
    );

  it('lists all four tabs in order', () => {
    renderAt('/dashboard/advance/health/triage');
    const tabs = screen.getAllByRole('link').map((a) => a.textContent?.trim());
    expect(tabs.slice(0, 4)).toEqual(['Triage', 'Divergence', 'Movement', 'Controls']);
  });

  it('routes into the movement view', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard/advance/health/triage');

    await user.click(screen.getByRole('link', { name: 'Movement' }));
    expect(screen.getByRole('heading', { name: /health transitions/i })).toBeInTheDocument();
    expect(screen.queryByText('Triage stub')).not.toBeInTheDocument();
  });
});

describe('mock history', () => {
  it('carries enough months for a flow diagram to be worth drawing', () => {
    // The Movement tab was held back while accounts carried three months;
    // at that length the chart is mostly whitespace.
    const withHistory = MOCK_HEALTH_DATA.filter((r) => (r.history?.length ?? 0) > 0);
    expect(withHistory.length).toBeGreaterThan(0);
    withHistory.forEach((r) => expect(r.history).toHaveLength(HISTORY_MONTHS));
  });

  it('gives every account the same month labels, so columns align', () => {
    const withHistory = MOCK_HEALTH_DATA.filter((r) => (r.history?.length ?? 0) > 0);
    const reference = withHistory[0].history.map((h) => h.month);
    withHistory.forEach((r) => expect(r.history.map((h) => h.month)).toEqual(reference));
  });
});
