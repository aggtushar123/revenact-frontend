import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Customer } from '../../../features/customers/customersSlice';
import { pizzaHut } from '../../../features/organizations/testPortfolio';
import type { PortfolioRow } from '../../../features/organizations/portfolioTypes';
import { pizzaHutCustomer } from '../../../features/organizations/testStory';
import { HeaderTiles } from './HeaderTiles';

function renderTiles({
  row = pizzaHut,
  customer = pizzaHutCustomer as Customer | null,
  customerError = null as string | null,
  isSm = true,
} = {}) {
  const onJump = vi.fn();
  render(<HeaderTiles row={row} customer={customer} customerError={customerError} isSm={isSm} onJump={onJump} />);
  return onJump;
}

describe('HeaderTiles (spec §1.3)', () => {
  it('shows health as a ring and a trend, ARR, the renewal runway and the pulse pair', () => {
    renderTiles();
    expect(screen.getByRole('img', { name: 'Health 4.9, Average' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /^Health falling from 6\.2 to 4\.9/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ARR $69.6K. Show commercial details' })).toBeInTheDocument();
    expect(screen.getByText('47d overdue')).toBeInTheDocument();
    expect(screen.getByText('9 Aug 2026')).toBeInTheDocument();
    expect(screen.getByText('AI 1 · CSM 3')).toBeInTheDocument();
    expect(screen.getByText('pulses disagree')).toBeInTheDocument();
  });

  it("shows ARR in the customer's own currency", () => {
    const euros: PortfolioRow = {
      ...pizzaHut,
      details: { ...pizzaHut.details, commercial: { ...pizzaHut.details.commercial, currency: 'EUR' } },
    };
    renderTiles({ row: euros });
    expect(screen.getByRole('button', { name: /^ARR €69\.6K/ })).toBeInTheDocument();
    expect(screen.getByText('Billed at account, in EUR')).toBeInTheDocument();
  });

  it('ARR, Renewal and Pulse jump to their Details panels', async () => {
    const onJump = renderTiles();
    await userEvent.click(screen.getByRole('button', { name: /^ARR/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Renewal/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Pulse/ }));
    expect(onJump.mock.calls.map(([panel]) => panel)).toEqual(['commercial', 'contract', 'voice']);
  });

  it('Health opens and closes the five-part breakdown', async () => {
    renderTiles();
    const health = screen.getByRole('button', { name: /^Health 4\.9, Average/ });
    expect(health).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(health);
    expect(health).toHaveAttribute('aria-expanded', 'true');
    const breakdown = screen.getByRole('region', { name: 'Health breakdown' });
    expect(health).toHaveAttribute('aria-controls', breakdown.id);
    expect(within(breakdown).getAllByRole('listitem')).toHaveLength(5);
    expect(within(breakdown).getByText('Product usage').closest('li')).toHaveTextContent('1.2/3.0 · Average');
    expect(within(breakdown).getByText('Support load').closest('li')).toHaveTextContent('1.6/2.0 · Good');
    expect(within(breakdown).getByText('NPS').closest('li')).toHaveTextContent('No data');
    expect(breakdown).toHaveTextContent('Scored on the 4 components with data; the other is left out rather than counted as zero.');
    await userEvent.click(health);
    expect(screen.queryByRole('region', { name: 'Health breakdown' })).not.toBeInTheDocument();
  });

  it('says so while the breakdown loads', async () => {
    renderTiles({ customer: null });
    await userEvent.click(screen.getByRole('button', { name: /^Health/ }));
    expect(screen.getByRole('status', { name: 'Loading the health breakdown' })).toBeInTheDocument();
  });

  it('shows the read error in place of the breakdown', async () => {
    renderTiles({ customer: null, customerError: 'Could not load the health breakdown.' });
    await userEvent.click(screen.getByRole('button', { name: /^Health/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the health breakdown.');
  });

  it('is a four-column grid from sm', () => {
    renderTiles({ isSm: true });
    expect(screen.getByRole('button', { name: /^ARR/ }).parentElement).toHaveClass('grid', 'grid-cols-4');
  });

  it('is a snapping strip on phones', () => {
    renderTiles({ isSm: false });
    const strip = screen.getByRole('button', { name: /^ARR/ }).parentElement;
    expect(strip).toHaveClass('overflow-x-auto', 'snap-x', 'snap-mandatory');
    expect(strip).not.toHaveClass('grid');
  });
});
