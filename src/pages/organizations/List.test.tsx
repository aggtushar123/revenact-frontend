import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderList } from './testList';
import { resetViewport } from '../../test/viewport';
import {
  buildPortfolio,
  bulkBodies,
  customerFixture,
  portfolioQueries,
  stubPortfolio,
} from '../../features/organizations/testPortfolio';

// Integration tier: the real page, store and router; fetch stubbed with
// §2-shaped bodies (features/organizations/testPortfolio.ts).
const where = () => new URL(`http://x${screen.getByTestId('where').textContent}`);

describe('Organizations list (portfolio)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    resetViewport();
  });

  it('loads tiles, health sections and rows from the portfolio endpoint', async () => {
    const spy = stubPortfolio();
    renderList();
    expect(await screen.findByRole('button', { name: /^Average · 1/ })).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
    expect(screen.getByRole('region', { name: 'Health' })).toBeInTheDocument();
    const [frame] = portfolioQueries(spy);
    expect(frame.get('group')).toBe('health');
    expect(frame.get('sort')).toBe('-arr');
    expect(frame.get('limit')).toBe('1');
    expect(portfolioQueries(spy).some((q) => q.get('group_value') === 'average' && q.get('limit') === '25')).toBe(true);
    expect(screen.getByText('2 organizations')).toBeInTheDocument();
  });

  it('lands a dashboard drill as a chip; removing it drops ids and returns focus to Search', async () => {
    const spy = stubPortfolio();
    renderList('/organizations/list?ids=7,2');
    const chip = await screen.findByRole('button', { name: 'Remove Opened from the dashboard (2)' });
    expect(portfolioQueries(spy)[0].get('ids')).toBe('7,2');
    await userEvent.click(chip);
    expect(where().searchParams.has('ids')).toBe(false);
    expect(screen.getByRole('searchbox', { name: 'Search by name or Revenact ID' })).toHaveFocus();
  });

  it('filters from a tile, shows N of M, and clears the selection when filters change', async () => {
    stubPortfolio();
    renderList();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
    expect(screen.getByRole('region', { name: 'Selection' })).toHaveTextContent('1 selected');

    await userEvent.click(screen.getByRole('button', { name: 'Average 1' }));
    expect(where().searchParams.get('health')).toBe('average');
    expect(await screen.findByText('1 of 2 organizations')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Selection' })).not.toBeInTheDocument();
  });

  it('shows the designed empty state and clears filters from it', async () => {
    stubPortfolio();
    renderList('/organizations/list?search=zzz');
    expect(await screen.findByText('No organizations match these filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(where().searchParams.has('search')).toBe(false);
    expect(await screen.findByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
  });

  it('shows an error and recovers on Try again', async () => {
    let fail = true;
    stubPortfolio({ portfolio: (q) => (fail ? { status: 500, body: { detail: 'Boom' } } : buildPortfolio(q)) });
    renderList();
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: 'Pizza Hut' })).toBeInTheDocument();
  });

  it('exports the current query through the session', async () => {
    const spy = stubPortfolio();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderList('/organizations/list?health=average');
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
    const call = spy.mock.calls.find(([input]) => String(input).includes('export.csv'));
    expect(new URL(String(call?.[0])).searchParams.get('health')).toBe('average');
  });

  it('opens a row inline and edits it with the existing form', async () => {
    stubPortfolio({ customer: customerFixture });
    renderList();
    await userEvent.click(await screen.findByRole('button', { name: 'Open Pizza Hut' }));
    expect(screen.getByRole('button', { name: 'Close Pizza Hut' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: 'Commercial' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit details' }));
    expect(await screen.findByRole('heading', { name: 'Edit Pizza Hut' })).toBeInTheDocument();
  });

  it('adds an organization with the existing form', async () => {
    stubPortfolio();
    renderList();
    await userEvent.click(await screen.findByRole('button', { name: 'Add organization' }));
    expect(screen.getByRole('heading', { name: 'Add Organization' })).toBeInTheDocument();
  });

  it('moves focus to Search after removing any chip, not only the dashboard one', async () => {
    stubPortfolio();
    renderList('/organizations/list?health=average');
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Health: Average' }));
    expect(where().searchParams.has('health')).toBe(false);
    expect(screen.getByRole('searchbox', { name: 'Search by name or Revenact ID' })).toHaveFocus();
  });

  it('opens a row inline on desktop without a sheet', async () => {
    stubPortfolio();
    renderList();
    await userEvent.click(await screen.findByRole('button', { name: 'Open Pizza Hut' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-panel="commercial"]')).toHaveLength(1);
  });

  it('ungrouped, keeps selected rows that are still listed after a filter change', async () => {
    stubPortfolio();
    renderList('/organizations/list?group=none');
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Globex' }));
    expect(screen.getByRole('region', { name: 'Selection' })).toHaveTextContent('2 selected');
    await userEvent.click(screen.getByRole('button', { name: 'Average 1' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Globex' })).not.toBeInTheDocument());
    expect(screen.getByRole('region', { name: 'Selection' })).toHaveTextContent('1 selected');
    expect(screen.getByRole('checkbox', { name: 'Select Pizza Hut' })).toBeChecked();
  });

  it('disables selection and bulk actions while the list reloads', async () => {
    const spy = stubPortfolio();
    const waiting: (() => void)[] = [];
    let held = false;
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      if (held && String(input).includes('/organizations/portfolio/?')) {
        await new Promise<void>((resolve) => waiting.push(resolve));
      }
      return spy(input, init);
    });
    renderList();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
    held = true;
    await userEvent.click(screen.getByRole('button', { name: 'Good 1' }));
    const bar = screen.getByRole('region', { name: 'Selection' });
    expect(within(bar).getByRole('combobox', { name: 'Change owner' })).toBeDisabled();
    expect(within(bar).getByRole('button', { name: /Export/ })).toBeDisabled();
    held = false;
    waiting.forEach((resolve) => resolve());
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Selection' })).not.toBeInTheDocument());
  });

  describe('bulk actions', () => {
    it('unassigns with value null, lists failures by name, keeps them selected and reloads', async () => {
      const spy = stubPortfolio({
        bulk: (body) => ({ updated: body.ids.filter((id) => id !== 7), failed: [{ id: 7, reason: 'Not found.' }] }),
      });
      renderList();
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Select Globex' }));
      const before = portfolioQueries(spy).length;
      const bar = screen.getByRole('region', { name: 'Selection' });
      await userEvent.selectOptions(within(bar).getByRole('combobox', { name: 'Change owner' }), 'unassigned');
      await waitFor(() => expect(bulkBodies(spy)).toHaveLength(1));
      expect(bulkBodies(spy)[0]).toEqual({ ids: [7, 1], action: 'set_owner', value: null });
      expect(await within(bar).findByText(/Updated 1 organization\./)).toBeInTheDocument();
      expect(within(bar).getByText('Pizza Hut').closest('li')).toHaveTextContent('Pizza Hut: Not found.');
      await waitFor(() => expect(portfolioQueries(spy).length).toBeGreaterThan(before));
      await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Select Pizza Hut' })).not.toBeDisabled());
      expect(bar).toHaveTextContent('1 selected');
      expect(screen.getByRole('checkbox', { name: 'Select Pizza Hut' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Select Globex' })).not.toBeChecked();
    });

    it('archives after a confirm and names the account the server refused', async () => {
      const spy = stubPortfolio({
        bulk: (body) => ({ updated: [], failed: body.ids.map((id) => ({ id, reason: "You can't archive this organization." })) }),
      });
      renderList();
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
      await userEvent.click(within(screen.getByRole('region', { name: 'Selection' })).getByRole('button', { name: 'Archive' }));
      expect(screen.getByRole('heading', { name: 'Archive Pizza Hut?' })).toBeInTheDocument();
      const buttons = screen.getAllByRole('button', { name: 'Archive' });
      await userEvent.click(buttons[buttons.length - 1]);
      await waitFor(() => expect(bulkBodies(spy)).toEqual([{ ids: [7], action: 'archive', value: null }]));
      expect(await screen.findByText(/You can't archive this organization\./)).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Selection' })).toHaveTextContent('Pizza Hut: You can\'t archive this organization.');
    });

    it('offers churn only for exactly one account, in the existing churn modal', async () => {
      stubPortfolio();
      renderList();
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'Select Globex' }));
      const bar = screen.getByRole('region', { name: 'Selection' });
      expect(within(bar).queryByRole('button', { name: 'Churn' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('checkbox', { name: 'Select Globex' }));
      await userEvent.click(within(bar).getByRole('button', { name: 'Churn' }));
      expect(screen.getByRole('heading', { name: 'Churn Pizza Hut?' })).toBeInTheDocument();
    });

    it('exports the selected accounts, churned included', async () => {
      const spy = stubPortfolio();
      URL.createObjectURL = vi.fn(() => 'blob:x');
      URL.revokeObjectURL = vi.fn();
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      renderList();
      await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Pizza Hut' }));
      await userEvent.click(within(screen.getByRole('region', { name: 'Selection' })).getByRole('button', { name: 'Export' }));
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      const call = spy.mock.calls.find(([input]) => String(input).includes('export.csv'));
      const query = new URL(String(call?.[0])).searchParams;
      expect(query.get('ids')).toBe('7');
      expect(query.get('include_churned')).toBe('1');
    });
  });

  it('shows the export failing', async () => {
    const spy = stubPortfolio();
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) =>
      String(input).includes('export.csv')
        ? { ok: false, status: 500, json: async () => ({ detail: 'Export broke' }) }
        : spy(input, init),
    );
    renderList();
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Export broke');
    expect(screen.getByRole('button', { name: 'Export' })).not.toBeDisabled();
  });

  describe('on a phone (375px)', () => {
    it('collapses the toolbar and keeps group, sort, export and add in the Filters sheet', async () => {
      stubPortfolio();
      renderList('/organizations/list', { width: 375 });
      await screen.findByRole('link', { name: 'Pizza Hut' });
      expect(screen.queryByRole('combobox', { name: 'Group' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /^Filters/ }));
      const sheet = screen.getByRole('dialog', { name: 'Filters' });
      expect(sheet).toHaveAttribute('aria-modal', 'true');
      for (const name of ['Group', 'Sort by']) expect(within(sheet).getByRole('combobox', { name })).toBeInTheDocument();
      expect(within(sheet).getByRole('button', { name: 'Add organization' })).toBeInTheDocument();
      expect(within(sheet).getByRole('checkbox', { name: 'Include churned' })).toBeInTheDocument();
    });

    it('opens a row as a bottom sheet, and Escape closes it', async () => {
      stubPortfolio();
      renderList('/organizations/list', { width: 375 });
      await userEvent.click(await screen.findByRole('button', { name: 'Open Pizza Hut' }));
      const sheet = screen.getByRole('dialog', { name: 'Pizza Hut' });
      expect(within(sheet).getByRole('heading', { name: 'Commercial' })).toBeInTheDocument();
      expect(document.querySelectorAll('[data-panel="commercial"]')).toHaveLength(1);
      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('dialog', { name: 'Pizza Hut' })).not.toBeInTheDocument();
    });
  });
});
