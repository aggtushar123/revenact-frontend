import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { healthRow, renderWithHealth } from './testUtils';
import { filterOptions } from './useHealthOverview';
import { HealthOverviewContainer } from '../HealthOverviewContainer';
import { TriageView } from './TriageView';
import { RenewalView } from './RenewalView';
import { UNASSIGNED_KEY, UNASSIGNED_LABEL } from '../../../../features/health/toHealthDataRow';
import healthReducer, {
  NO_FILTERS,
  pruneFilters,
  setHealthFilter,
} from '../../../../features/health/healthSlice';

// The bar's three filters live on the container and are applied in the shared
// hook, so these tests drive them through the real bar and assert on two
// different tabs — the thing worth proving is that a chip narrows every view
// under it, not that one component filtered an array.

const BOOK = [
  healthRow({
    id: '1',
    account: 'Nova Enterprises',
    owner: 'Gerry Hill',
    ownerKey: '7',
    lifecycleStage: 'Pilot',
    lifecycleKey: 'pilot',
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

const owners = (rows = BOOK, filters = NO_FILTERS) =>
  filterOptions(rows, 'owner', filters, (row) => row.owner);

describe('filterOptions', () => {
  it("counts each value's share of the book", () => {
    const options = owners([
      ...BOOK,
      healthRow({ id: '4', owner: 'Ada Lovelace', ownerKey: '3' }),
    ]);

    expect(options.find((o) => o.key === '3')).toMatchObject({ name: 'Ada Lovelace', count: 2 });
    expect(options.find((o) => o.key === '7')).toMatchObject({ count: 1 });
  });

  it('sorts by name and puts Unassigned last', () => {
    // Unassigned isn't a person; a book with many unowned accounts shouldn't
    // push the actual owners down the list.
    expect(owners().map((o) => o.name)).toEqual(['Ada Lovelace', 'Gerry Hill', UNASSIGNED_LABEL]);
  });

  it('offers only values that actually appear in this book', () => {
    expect(owners([]).length).toBe(0);
  });

  it('narrows one dropdown by what the other filters already selected', () => {
    // Offering a company the selected owner doesn't hold is offering a choice
    // whose only outcome is an empty dashboard.
    const accounts = filterOptions(
      BOOK,
      'account',
      { ...NO_FILTERS, owner: '3' },
      (row) => row.account
    );

    expect(accounts.map((o) => o.name)).toEqual(['Hyatt Hotels']);
  });

  it('does not narrow a dropdown by its own current selection', () => {
    // Otherwise picking one owner would leave that dropdown offering only the
    // owner already chosen, with no way back.
    expect(owners(BOOK, { ...NO_FILTERS, owner: '7' }).length).toBe(3);
  });

  it('does not narrow a broad dropdown by a narrower selection', () => {
    // Narrowing Owner by the selected Account is the one arrangement that can
    // strand someone: one company, one owner on offer, no way to switch.
    expect(owners(BOOK, { ...NO_FILTERS, account: '2' }).length).toBe(3);
  });
});

describe('pruneFilters', () => {
  it('keeps a combination the book can honour', () => {
    const filters = { owner: '3', lifecycle: 'customer_active', account: '2' };

    expect(pruneFilters(BOOK, filters)).toEqual(filters);
  });

  it('drops the narrower filter when two contradict', () => {
    // Gerry doesn't hold Hyatt. The owner is the choice just made, so the
    // account filter is what gives way.
    expect(pruneFilters(BOOK, { owner: '7', lifecycle: null, account: '2' })).toEqual({
      owner: '7',
      lifecycle: null,
      account: null,
    });
  });

  it('drops a filter for something no longer in the book at all', () => {
    expect(pruneFilters(BOOK, { ...NO_FILTERS, owner: '99' }).owner).toBeNull();
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
    await user.click(screen.getByRole('button', { name: 'Clear 1' }));

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
    const { store } = renderTab(<RenewalView />, 'renewal-date', {
      filters: { ...NO_FILTERS, owner: '3' },
    });

    expect(store.getState().health.filters.owner).toBe('3');
    expect(within(tile('Up for renewal')).getByText('$50.0K')).toBeInTheDocument();
  });
});

describe('Lifecycle Stage filter', () => {
  it('narrows the book to one stage', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Lifecycle Stage'), 'pilot');

    expect(screen.getByText('Nova Enterprises')).toBeInTheDocument();
    expect(screen.queryByText('Hyatt Hotels')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3 accounts')).toBeInTheDocument();
  });

  it('keys on the stored value, not the label people read', async () => {
    // "Customer - Active" is a label someone renames; `customer_active` is not.
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    const select = screen.getByLabelText('Lifecycle Stage');
    expect(within(select).getByRole('option', { name: /Pilot/ })).toHaveValue('pilot');

    await user.selectOptions(select, 'pilot');
    const chip = select.parentElement as HTMLElement;
    expect(within(chip).getByText('Pilot')).toBeInTheDocument();
  });
});

describe('Account filter', () => {
  it('narrows every tab to one company', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Account'), '2');

    // The company name is also on the chip now, so this asserts on the queue
    // rather than on the page — the triage list is divs, not a table.
    expect(screen.getByText('Accounts by risk score').closest('div')!.parentElement)
      .toHaveTextContent('Hyatt Hotels');
    expect(screen.queryByText('Nova Enterprises')).not.toBeInTheDocument();
    expect(screen.getByText('1 of 3 accounts')).toBeInTheDocument();
  });

  it('only offers companies the other filters leave standing', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '3');

    const accounts = screen.getByLabelText('Account');
    expect(within(accounts).getByRole('option', { name: /Hyatt Hotels/ })).toBeInTheDocument();
    expect(within(accounts).queryByRole('option', { name: /Nova/ })).not.toBeInTheDocument();
  });
});

describe('the three filters together', () => {
  it('combine, and count how many are on', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');
    await user.selectOptions(screen.getByLabelText('Lifecycle Stage'), 'pilot');

    expect(screen.getByRole('button', { name: 'Clear 2' })).toBeInTheDocument();
    expect(screen.getByText('1 of 3 accounts')).toBeInTheDocument();
  });

  it('drops a stranded account filter rather than emptying the dashboard', async () => {
    // Pick Hyatt, then pick the owner who doesn't hold it. Keeping both would
    // show nothing, with two chips that each look perfectly reasonable.
    const user = userEvent.setup();
    const { store } = renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Account'), '2');
    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');

    expect(store.getState().health.filters).toEqual({
      owner: '7',
      lifecycle: null,
      account: null,
    });
    expect(screen.getByText('Nova Enterprises')).toBeInTheDocument();
  });

  it('clears all of them at once', async () => {
    const user = userEvent.setup();
    renderTab(<TriageView />, 'triage');

    await user.selectOptions(screen.getByLabelText('Primary Owner'), '7');
    await user.selectOptions(screen.getByLabelText('Lifecycle Stage'), 'pilot');
    await user.click(screen.getByRole('button', { name: 'Clear 2' }));

    expect(screen.getByText('Hyatt Hotels')).toBeInTheDocument();
    expect(screen.getByText('Orphan Co')).toBeInTheDocument();
  });
});

describe('healthSlice filters', () => {
  const loaded = (rows: typeof BOOK, owner: string | null) =>
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
        filters: { ...NO_FILTERS, owner },
      },
      {
        type: 'health/fetchHealthOverview/fulfilled',
        payload: { rows, historyMonths: 12, truncated: false, currency: 'USD', unconvertedCount: 0 },
      }
    );

  it('keeps a filter the refreshed book can still honour', () => {
    expect(loaded(BOOK, '3').filters.owner).toBe('3');
  });

  it('drops a filter for an owner who is no longer in the book', () => {
    // A CSM who left, or whose last account was reassigned. Keeping it would
    // leave every tab empty with their name on the chip and no way to tell
    // that the filter, not the book, is what emptied them.
    expect(loaded(BOOK, '99').filters.owner).toBeNull();
  });

  it('setHealthFilter round-trips', () => {
    const withRows = healthReducer(undefined, {
      type: 'health/fetchHealthOverview/fulfilled',
      payload: {
        rows: BOOK,
        historyMonths: 12,
        truncated: false,
        currency: 'USD',
        unconvertedCount: 0,
      },
    });

    const set = healthReducer(withRows, setHealthFilter({ key: 'owner', value: '7' }));
    expect(set.filters.owner).toBe('7');
    expect(
      healthReducer(set, setHealthFilter({ key: 'owner', value: null })).filters.owner
    ).toBeNull();
  });
});

/** The stat tile carrying `label`. */
const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;
