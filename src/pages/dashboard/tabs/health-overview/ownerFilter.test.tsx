import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { healthRow, renderWithHealth } from './testUtils';
import { ownerOptions } from './useHealthOverview';
import { HealthOverviewContainer } from '../HealthOverviewContainer';
import { TriageView } from './TriageView';
import { RenewalView } from './RenewalView';
import { UNASSIGNED_KEY, UNASSIGNED_LABEL } from '../../../../features/health/toHealthDataRow';
import healthReducer, { setOwnerFilter } from '../../../../features/health/healthSlice';

// The Primary Owner filter lives on the container's bar and is applied in the
// shared hook, so these tests drive it through the real bar and assert on two
// different tabs — the thing worth proving is that one chip narrows every view
// under it, not that one component filtered an array.

const BOOK = [
  healthRow({
    id: '1',
    account: 'Nova Enterprises',
    owner: 'Gerry Hill',
    ownerKey: '7',
    healthStatus: 'Poor',
    arr: 200_000,
    renewalDate: renewalIn(20),
  }),
  healthRow({
    id: '2',
    account: 'Hyatt Hotels',
    owner: 'Ada Lovelace',
    ownerKey: '3',
    healthStatus: 'Good',
    arr: 50_000,
    renewalDate: renewalIn(30),
  }),
  healthRow({
    id: '3',
    account: 'Orphan Co',
    owner: UNASSIGNED_LABEL,
    ownerKey: UNASSIGNED_KEY,
    healthStatus: 'Average',
    arr: 10_000,
    renewalDate: renewalIn(40),
  }),
];

function renewalIn(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** The container plus one tab, through the real router. */
function renderTab(element: React.ReactElement, path: string, options = {}) {
  return renderWithHealth(
    <MemoryRouter initialEntries={[`/dashboard/advance/health/${path}`]}>
      <Routes>
        <Route path="/dashboard/advance/health" element={<HealthOverviewContainer />}>
          <Route index element={<Navigate to="triage" replace />} />
          <Route path={path} element={element} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { rows: BOOK, ...options }
  );
}

describe('ownerOptions', () => {
  it('counts each owner\'s book', () => {
    const options = ownerOptions([...BOOK, healthRow({ id: '4', owner: 'Ada Lovelace', ownerKey: '3' })]);

    expect(options.find((o) => o.key === '3')).toMatchObject({ name: 'Ada Lovelace', count: 2 });
    expect(options.find((o) => o.key === '7')).toMatchObject({ count: 1 });
  });

  it('sorts owners by name and puts Unassigned last', () => {
    // Unassigned isn't a person; a book with many unowned accounts shouldn't
    // push the actual owners down the list.
    expect(ownerOptions(BOOK).map((o) => o.name)).toEqual([
      'Ada Lovelace',
      'Gerry Hill',
      UNASSIGNED_LABEL,
    ]);
  });

  it('offers only owners who actually hold something in this book', () => {
    expect(ownerOptions([]).length).toBe(0);
  });
});

describe('Primary Owner filter', () => {
  it('is a filter on the bar, not a tab that replaces the dashboard', async () => {
    renderTab(<TriageView />, 'triage');

    expect(screen.getByLabelText('Primary Owner')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Primary Owner/ })).not.toBeInTheDocument();
  });

  it('narrows the accounts every tab is reading', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    expect(screen.getByText('Nova Enterprises')).toBeInTheDocument();
    expect(screen.getByText('Hyatt Hotels')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');

    expect(screen.getByText('Nova Enterprises')).toBeInTheDocument();
    expect(screen.queryByText('Hyatt Hotels')).not.toBeInTheDocument();
  });

  it('narrows the money on the Renewal tab too, from the same chip', async () => {
    const user = userEvent.setup();
    renderTab(<RenewalView />, 'renewal-date');

    // $260K across all three accounts renewing inside 90 days.
    expect(within(tile('Up for renewal')).getByText('$260.0K')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '3');

    expect(within(tile('Up for renewal')).getByText('$50.0K')).toBeInTheDocument();
    expect(within(tile('Up for renewal')).getByText('1 account')).toBeInTheDocument();
  });

  it('says how much of the book is on screen while a filter is on', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    expect(screen.queryByText(/of 3 accounts/)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');

    // A dashboard that looks whole while showing a third of the book is
    // exactly what this screen exists to avoid.
    expect(screen.getByText('1 of 3 accounts')).toBeInTheDocument();
  });

  it('can single out the accounts nobody owns', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Primary Owner'), UNASSIGNED_KEY);

    expect(screen.getByText('Orphan Co')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 accounts')).toBeInTheDocument();
  });

  it('clears back to the whole book', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByText('Hyatt Hotels')).toBeInTheDocument();
    expect(screen.queryByText(/of 3 accounts/)).not.toBeInTheDocument();
  });

  it('shows the owner name on the chip, keyed by id', async () => {
    // Two CSMs sharing a name is ordinary; the label is for people, the key is
    // for the filter.
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');

    // Scoped to the chip: the name also appears in the triage queue's own
    // owner column, which is the point — both are reading the same row.
    const chip = screen.getByLabelText('Primary Owner').parentElement as HTMLElement;
    expect(within(chip).getByText('Gerry Hill')).toBeInTheDocument();
  });

  it('survives moving between tabs', () => {
    // Narrowing to one CSM and then moving from Triage to Renewal Date is one
    // thought, not two — so the filter lives in the store, not in the view.
    const { store } = renderTab(<RenewalView />, 'renewal-date', { ownerFilter: '3' });

    expect(store.getState().health.ownerFilter).toBe('3');
    expect(within(tile('Up for renewal')).getByText('$50.0K')).toBeInTheDocument();
  });
});

describe('healthSlice owner filter', () => {
  const loaded = (rows: typeof BOOK, ownerFilter: string | null) =>
    healthReducer(
      {
        rows: [],
        isLoading: false,
        error: null,
        historyMonths: 12,
        truncated: false,
        loadedAt: null,
        currency: 'USD' as const,
        unconvertedCount: 0,
        ownerFilter,
      },
      {
        type: 'health/fetchHealthOverview/fulfilled',
        payload: { rows, historyMonths: 12, truncated: false, currency: 'USD', unconvertedCount: 0 },
      }
    );

  it('keeps a filter the refreshed book can still honour', () => {
    expect(loaded(BOOK, '3').ownerFilter).toBe('3');
  });

  it('drops a filter for an owner who is no longer in the book', () => {
    // A CSM who left, or whose last account was reassigned. Keeping it would
    // leave every tab empty with their name on the chip and no way to tell
    // that the filter, not the book, is what emptied them.
    expect(loaded(BOOK, '99').ownerFilter).toBeNull();
  });

  it('setOwnerFilter round-trips', () => {
    const state = healthReducer(undefined, setOwnerFilter('7'));
    expect(state.ownerFilter).toBe('7');
    expect(healthReducer(state, setOwnerFilter(null)).ownerFilter).toBeNull();
  });
});

/** The stat tile carrying `label`. */
const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;
