import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import type { Opportunity, Risk } from '../../../features/customers/customersSlice';
import { OPPORTUNITIES, RISKS } from '../../../features/organizations/testStory';
import { makeDetailStore } from '../../../pages/organizations/testDetail';
import { DealItem } from './DealItem';

function renderItem(deal: Opportunity | Risk) {
  const onOpen = vi.fn();
  render(
    <Provider store={makeDetailStore()}>
      <ul>
        <DealItem deal={deal} onOpen={onOpen} />
      </ul>
    </Provider>,
  );
  return onOpen;
}

describe('DealItem (spec 2026-09-27 §3)', () => {
  it('shows title, MRR in DM Mono, stage, priority, department and account', () => {
    renderItem(OPPORTUNITIES[0]);
    const button = screen.getByRole('button', { name: /EMEA seat expansion/ });
    expect(within(button).getByText('$1,200.00')).toHaveClass('font-mono-brand', 'tabular-nums');
    for (const text of ['Negotiation', 'High priority', 'Customer Success', 'EMEA']) expect(within(button).getByText(text)).toBeInTheDocument();
  });

  it('says Whole company and Organization when the record has no department or account', () => {
    renderItem(OPPORTUNITIES[1]);
    expect(screen.getByText('Whole company')).toBeInTheDocument();
    expect(screen.getByText('Organization')).toBeInTheDocument();
  });

  it('renders a risk the same way', () => {
    renderItem(RISKS[0]);
    for (const text of ['Admin left', 'Open', '$800.00', 'North America']) expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('opens on select, with a 44px target', async () => {
    const onOpen = renderItem(OPPORTUNITIES[0]);
    const button = screen.getByRole('button', { name: /EMEA seat expansion/ });
    expect(button).toHaveClass('min-h-11');
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
