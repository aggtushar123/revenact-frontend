import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithHealth } from './testUtils';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DivergenceView } from './DivergenceView';
import { DivergenceList } from './charts/DivergenceList';
import { HealthOverviewContainer } from '../HealthOverviewContainer';
import { MOCK_HEALTH_DATA } from './mockData';

/** The generated mock, used here purely as a fixture book — the tabs
 *  themselves read `state.health`, which the real app fills from
 *  /customers/health/. */
const BOOK = MOCK_HEALTH_DATA;
import { layOut, splitDivergent, summariseDivergence } from './divergence';

// Integration tier. Recharts needs a sized container, which jsdom doesn't
// give it, so — as in TicketOverview.test.tsx — these assert on the lists,
// the counts and the routing rather than on rendered SVG. The layout and
// classification maths is pinned to fixtures in divergence.test.ts.

const expected = (() => {
  const laid = layOut(MOCK_HEALTH_DATA, new Date());
  return { ...splitDivergent(laid), summary: summariseDivergence(laid) };
})();

const listNamed = (name: RegExp) =>
  screen.getByRole('heading', { name }).closest('section') as HTMLElement;

describe('DivergenceView', () => {
  it('leads with how many accounts the two pulses disagree on', () => {
    renderWithHealth(<DivergenceView />, { rows: BOOK });
    expect(
      screen.getByText(
        (_, el) =>
          el?.tagName === 'P' &&
          /have a CSM and AI pulse \d\+ points apart/.test(el.textContent ?? ''),
      ),
    ).toBeInTheDocument();
  });

  it('lists both directions of disagreement separately', () => {
    renderWithHealth(<DivergenceView />, { rows: BOOK });

    const blindSpots = listNamed(/AI sees risk the CSM/i);
    const humanFirst = listNamed(/CSM sees risk the AI/i);

    expect(within(blindSpots).queryAllByRole('listitem')).toHaveLength(expected.aiColder.length);
    expect(within(humanFirst).queryAllByRole('listitem')).toHaveLength(expected.csmColder.length);
  });

  it('names the accounts the model reads colder, soonest renewal first', () => {
    renderWithHealth(<DivergenceView />, { rows: BOOK });
    const blindSpots = listNamed(/AI sees risk the CSM/i);
    const rendered = within(blindSpots)
      .queryAllByRole('listitem')
      .map((li) => li.textContent ?? '');

    expected.aiColder.forEach((d, i) => {
      expect(rendered[i]).toContain(d.row.account);
    });
  });

  it('shows each row’s two scores and its renewal countdown', () => {
    renderWithHealth(<DivergenceView />, { rows: BOOK });
    const rows = within(listNamed(/AI sees risk the CSM/i)).queryAllByRole('listitem');
    if (rows.length === 0) return; // covered by the empty-state test below

    expect(rows[0].textContent).toMatch(/CSM \d/);
    expect(rows[0].textContent).toMatch(/AI \d/);
    expect(rows[0].textContent).toMatch(/\d+d/);
  });

  it('never files the same account under both directions', () => {
    renderWithHealth(<DivergenceView />, { rows: BOOK });
    const named = (section: HTMLElement) =>
      within(section).queryAllByRole('listitem').map((li) => li.textContent ?? '');

    const blind = named(listNamed(/AI sees risk the CSM/i));
    const human = named(listNamed(/CSM sees risk the AI/i));
    expect(blind.filter((t) => human.includes(t))).toEqual([]);
  });
});

describe('DivergenceList', () => {
  it('explains itself when a direction has no accounts', () => {
    renderWithHealth(
      <DivergenceList
        title="AI sees risk the CSM doesn’t"
        caption="The model is reading these colder."
        rows={[]}
        tone="danger"
        emptyMessage="No account currently has an AI Pulse that far below its CSM Pulse."
      />,
    );
    expect(screen.getByText(/No account currently has an AI Pulse/)).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});

describe('Health Overview routing with Divergence', () => {
  const renderAt = (path: string) =>
    renderWithHealth(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard/advance/health" element={<HealthOverviewContainer />}>
            <Route index element={<Navigate to="triage" replace />} />
            <Route path="triage" element={<p>Triage stub</p>} />
            <Route path="divergence" element={<DivergenceView />} />
            <Route path="controls" element={<p>Controls stub</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
      { rows: BOOK },
    );

  it('offers Divergence second, straight after Triage', () => {
    // The full tab order is pinned in MovementView.test.tsx; this only claims
    // Divergence's own position, so adding a later tab doesn't fail it.
    renderAt('/dashboard/advance/health/triage');
    const tabs = screen.getAllByRole('link').map((a) => a.textContent?.trim());
    expect(tabs.slice(0, 2)).toEqual(['Triage', 'Divergence']);
    expect(tabs).toContain('Controls');
  });

  it('routes into the divergence view', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard/advance/health/triage');

    await user.click(screen.getByRole('link', { name: 'Divergence' }));
    expect(screen.getByRole('heading', { name: /AI sees risk the CSM/i })).toBeInTheDocument();
    expect(screen.queryByText('Triage stub')).not.toBeInTheDocument();
  });

  it('still lands on Triage by default', () => {
    renderAt('/dashboard/advance/health');
    expect(screen.getByText('Triage stub')).toBeInTheDocument();
  });
});
