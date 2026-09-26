import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderBoard } from './testList';
import { resetViewport } from '../../test/viewport';
import {
  buildPortfolio,
  customerFixture,
  patchBodies,
  portfolioQueries,
  stubPortfolio,
} from '../../features/organizations/testPortfolio';

// Integration tier: the real page, store and router; fetch stubbed with
// §2-shaped bodies, and PATCH /customers/<id>/ writing into the stub's book
// (features/organizations/testPortfolio.ts).
const where = () => new URL(`http://x${screen.getByTestId('where').textContent}`);
const column = (key: string) => document.querySelector(`[data-column="${key}"]`) as HTMLElement;
const heading = (key: string) => within(column(key)).getByRole('heading');
const card = (id: number) => document.querySelector(`[data-card-id="${id}"]`) as HTMLElement;
const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: 'all', dropEffect: 'none' });
const moveButton = (id: number) => within(card(id)).queryByRole('button', { name: 'Move to…' });
/** Ruling R1: Move to… is a button opening a menu; nothing moves until a stage is chosen. */
const chooseMove = async (id: number, name: string, stage: string) => {
  await userEvent.click(moveButton(id) as HTMLElement);
  await userEvent.click(within(screen.getByRole('menu', { name: `Move ${name} to` })).getByRole('menuitem', { name: stage }));
};
const ready = async () => {
  await screen.findByRole('link', { name: 'Pizza Hut' });
  await screen.findByRole('link', { name: 'Globex' });
};

/** Holds every PATCH until release(); everything else goes straight to the stub. */
function holdPatches(spy: ReturnType<typeof stubPortfolio>) {
  const waiting: (() => void)[] = [];
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === 'PATCH') await new Promise<void>((resolve) => waiting.push(resolve));
    return spy(input, init);
  });
  return { release: () => waiting.splice(0).forEach((resolve) => resolve()) };
}

describe('Organizations board (portfolio)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("shares the List's top half and groups by lifecycle by default", async () => {
    const spy = stubPortfolio();
    renderBoard();
    await ready();
    expect(screen.getByRole('group', { name: 'Health' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search by name or Revenact ID' })).toBeInTheDocument();
    expect(screen.getByText('2 organizations')).toBeInTheDocument();
    const [frame] = portfolioQueries(spy);
    expect(frame.get('group')).toBe('lifecycle');
    expect(frame.get('limit')).toBe('1');
    expect(column('live')).toContainElement(screen.getByRole('link', { name: 'Pizza Hut' }));
    expect(heading('adoption')).toHaveTextContent('Adoption · 1 · $120.0K');
    expect(screen.getByRole('combobox', { name: 'Group' })).toHaveValue('lifecycle');
    // No selection mode and no pinned fields on the Board.
    expect(screen.queryByRole('button', { name: 'Pin fields' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /^Select / })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Selection' })).not.toBeInTheDocument();
    expect(where().search).toBe('');
  });

  it('filters through the URL like the List; group=none still shows lifecycle columns', async () => {
    const spy = stubPortfolio();
    renderBoard('/organizations/board?group=none&owner=2');
    expect(await screen.findByText('1 of 2 organizations')).toBeInTheDocument();
    expect(portfolioQueries(spy)[0].get('group')).toBe('lifecycle');
    expect(screen.getByRole('combobox', { name: 'Group' })).toHaveValue('lifecycle');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Owner: Carl CSM' }));
    expect(where().searchParams.has('owner')).toBe(false);
    expect(where().searchParams.get('group')).toBe('none');

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'health');
    expect(where().searchParams.get('group')).toBe('health');
    await waitFor(() => expect(heading('average')).toHaveTextContent('Average · 1 · $69.6K'));
    await within(column('average')).findByRole('link', { name: 'Pizza Hut' });
    expect(moveButton(7)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Add organization to / })).not.toBeInTheDocument();
  });

  it('moves a card optimistically with Move to…, saves one PATCH, then reloads the frame and the two columns', async () => {
    const spy = stubPortfolio();
    const gate = holdPatches(spy);
    renderBoard();
    await ready();
    const before = portfolioQueries(spy).length;
    await chooseMove(7, 'Pizza Hut', 'Renewal');

    // At once: the card sits in Renewal, the counts follow, and moving is off while it saves.
    expect(within(column('renewal')).getByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
    expect(within(column('live')).queryByRole('link', { name: 'Pizza Hut' })).not.toBeInTheDocument();
    expect(heading('renewal')).toHaveTextContent('Renewal · 1 · $69.6K');
    expect(heading('live')).toHaveTextContent('Live · 0 · $0');
    expect(moveButton(1)).toBeDisabled();

    gate.release();
    await waitFor(() => expect(patchBodies(spy)).toEqual([{ id: 7, body: { lifecycle_stage: 'renewal' } }]));
    expect(await screen.findByText('Moved Pizza Hut to Renewal.')).toHaveAttribute('aria-live', 'polite');
    await waitFor(() => {
      const after = portfolioQueries(spy).slice(before);
      expect(after.some((q) => q.get('limit') === '1' && !q.has('group_value'))).toBe(true);
      expect(after.some((q) => q.get('group_value') === 'renewal')).toBe(true);
    });
    // Only the columns the move touched reload.
    expect(portfolioQueries(spy).slice(before).some((q) => q.get('group_value') === 'adoption')).toBe(false);
    await waitFor(() => expect(moveButton(1)).toBeEnabled());
    expect(heading('renewal')).toHaveTextContent('Renewal · 1 · $69.6K');
    expect(heading('live')).toHaveTextContent('Live · 0 · $0');
    expect(within(column('renewal')).getByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
  });

  it("puts the card back with the server's reason when the save fails", async () => {
    stubPortfolio({ patch: () => ({ status: 403, body: { detail: 'You do not have permission to perform this action.' } }) });
    renderBoard();
    await ready();
    await chooseMove(7, 'Pizza Hut', 'Adoption');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't move Pizza Hut to Adoption. You do not have permission to perform this action.",
    );
    expect(within(column('live')).getByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
    expect(within(column('adoption')).queryByRole('link', { name: 'Pizza Hut' })).not.toBeInTheDocument();
    expect(heading('live')).toHaveTextContent('Live · 1 · $69.6K');
    expect(heading('adoption')).toHaveTextContent('Adoption · 1 · $120.0K');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('drags a card between lifecycle columns', async () => {
    const spy = stubPortfolio();
    renderBoard();
    await ready();
    const dt = dataTransfer();
    fireEvent.dragStart(card(1), { dataTransfer: dt });
    fireEvent.dragOver(column('live'), { dataTransfer: dt });
    fireEvent.drop(column('live'), { dataTransfer: dt });
    await waitFor(() => expect(patchBodies(spy)).toEqual([{ id: 1, body: { lifecycle_stage: 'live' } }]));
    await waitFor(() => expect(within(column('live')).getByRole('link', { name: 'Globex' })).toBeInTheDocument());
    await waitFor(() => expect(heading('live')).toHaveTextContent('Live · 2 · $189.6K'));
  });

  it('opens the churn modal on a drop into Churn: cancel changes nothing, confirming churns and reloads', async () => {
    const spy = stubPortfolio();
    renderBoard();
    await ready();
    const dt = dataTransfer();
    fireEvent.dragStart(card(7), { dataTransfer: dt });
    fireEvent.dragOver(column('churn'), { dataTransfer: dt });
    fireEvent.drop(column('churn'), { dataTransfer: dt });
    expect(screen.getByRole('heading', { name: 'Churn Pizza Hut?' })).toBeInTheDocument();
    const before = portfolioQueries(spy).length;
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('heading', { name: 'Churn Pizza Hut?' })).not.toBeInTheDocument();
    expect(patchBodies(spy)).toEqual([]);
    expect(portfolioQueries(spy)).toHaveLength(before);
    expect(within(column('live')).getByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();

    // The same modal from the Move to… menu; confirming PATCHes churn and reloads the board.
    await chooseMove(7, 'Pizza Hut', 'Churn');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Churn' }));
    await waitFor(() => expect(patchBodies(spy)).toHaveLength(1));
    expect(patchBodies(spy)[0]).toMatchObject({ id: 7, body: { lifecycle_stage: 'churn', churn_reason: '' } });
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Pizza Hut' })).not.toBeInTheDocument());
    expect(heading('live')).toHaveTextContent('Live · 0 · $0');
    expect(screen.getByText('1 organization')).toBeInTheDocument();
  });

  it('lists churned cards in Churn once the view includes them', async () => {
    stubPortfolio();
    renderBoard();
    await ready();
    expect(within(column('churn')).getByText('Churned accounts are hidden.')).toBeInTheDocument();
    await userEvent.click(within(column('churn')).getByRole('button', { name: 'Show churned' }));
    expect(where().searchParams.get('include_churned')).toBe('1');
    expect(screen.getByRole('button', { name: 'Remove Includes churned' })).toBeInTheDocument();
    expect(column('churn')).toContainElement(await screen.findByRole('link', { name: 'Initech' }));
    expect(heading('churn')).toHaveTextContent('Churn · 1 · $30.0K');
  });

  it('opens a card beside the board from sm, with Edit details, and keeps the board in place', async () => {
    stubPortfolio({ customer: customerFixture });
    renderBoard();
    await ready();
    await userEvent.click(screen.getByRole('button', { name: 'Open Pizza Hut' }));
    const panel = screen.getByRole('complementary', { name: 'Pizza Hut' });
    expect(within(panel).getByText('Detractor')).toBeInTheDocument();
    expect(column('live')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Pizza Hut' })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(within(panel).getByRole('button', { name: 'Edit details' }));
    expect(await screen.findByRole('heading', { name: 'Edit Pizza Hut' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Edit Pizza Hut' })).not.toBeInTheDocument());

    await userEvent.click(within(screen.getByRole('complementary', { name: 'Pizza Hut' })).getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('complementary', { name: 'Pizza Hut' })).not.toBeInTheDocument();
  });

  it('lays columns out as snapping panels with column tabs on phones, and opens cards in the bottom sheet', async () => {
    const spy = stubPortfolio();
    renderBoard('/organizations/board', { width: 375 });
    await ready();
    const tabs = screen.getByRole('navigation', { name: 'Board columns' });
    expect(column('live')).toHaveClass('w-full', 'snap-start');
    expect(card(7)).toHaveAttribute('draggable', 'false');

    await userEvent.click(within(column('live')).getByRole('button', { name: 'Open Pizza Hut' }));
    expect(screen.getByRole('dialog', { name: 'Pizza Hut' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Pizza Hut' })).not.toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Pizza Hut' })).not.toBeInTheDocument();

    await chooseMove(7, 'Pizza Hut', 'Renewal');
    await waitFor(() => expect(patchBodies(spy)).toHaveLength(1));
    expect(within(tabs).getByRole('button', { name: 'Renewal 1' })).toBeInTheDocument();
    await waitFor(() => expect(within(column('renewal')).getByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument());
  });

  it("adds into a stage from a column's +, and without a stage from the toolbar (ruling R2)", async () => {
    stubPortfolio();
    renderBoard();
    await ready();
    expect(within(column('churn')).queryByRole('button', { name: /^Add organization to / })).not.toBeInTheDocument();
    await userEvent.click(within(column('renewal')).getByRole('button', { name: 'Add organization to Renewal' }));
    expect(await screen.findByRole('combobox', { name: /lifecycle/i })).toHaveValue('renewal');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('combobox', { name: /lifecycle/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Add organization$/ }));
    expect(await screen.findByRole('combobox', { name: /lifecycle/i })).toHaveValue('onboarding');
  });

  it('moves focus to Search after a chip is removed, and links a card name to its page', async () => {
    stubPortfolio();
    renderBoard('/organizations/board?owner=2&health=average');
    expect(await screen.findByText('1 of 2 organizations')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^Remove Health/ }));
    expect(screen.getByRole('searchbox', { name: 'Search by name or Revenact ID' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Owner: Carl CSM' }));
    expect(screen.getByRole('searchbox', { name: 'Search by name or Revenact ID' })).toHaveFocus();

    await userEvent.click(await screen.findByRole('link', { name: 'Pizza Hut' }));
    expect(screen.getByText('Organization page')).toBeInTheDocument();
  });

  it('shows a designed error with Try again when the board cannot load', async () => {
    let fail = true;
    stubPortfolio({ portfolio: (q) => (fail ? { status: 500, body: { detail: 'Server error' } } : buildPortfolio(q)) });
    renderBoard();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    expect(screen.getByText('Summary unavailable')).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
  });
});
