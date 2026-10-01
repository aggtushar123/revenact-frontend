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

  it('adds the date line, and marks an open item past its date Overdue (pipelines spec §1)', () => {
    render(
      <Provider store={makeDetailStore()}>
        <ul>
          <DealItem deal={{ ...OPPORTUNITIES[0], expected_close: '2026-09-25' }} onOpen={vi.fn()} today="2026-09-30" />
          <DealItem deal={{ ...RISKS[0], due_by: '2026-10-20' }} onOpen={vi.fn()} today="2026-09-30" />
          <DealItem deal={OPPORTUNITIES[1]} onOpen={vi.fn()} today="2026-09-30" />
        </ul>
      </Provider>,
    );
    expect(screen.getByText('Overdue 5d')).toHaveClass('text-danger');
    expect(screen.getByText('Overdue')).toHaveClass('bg-danger-dim');
    expect(screen.getByText('Due in 20d')).toBeInTheDocument();
    expect(screen.getByText('No date')).toBeInTheDocument();
  });

  it('names the date a closed item passed, with no Overdue', () => {
    render(
      <Provider store={makeDetailStore()}>
        <ul>
          <DealItem
            deal={{ ...OPPORTUNITIES[1], stage: 'closed_lost', stage_display: 'Closed Lost', expected_close: '2026-09-05' }}
            onOpen={vi.fn()}
            today="2026-09-30"
          />
          <DealItem deal={{ ...RISKS[0], stage: 'mitigated', stage_display: 'Mitigated', due_by: '2026-09-05' }} onOpen={vi.fn()} today="2026-09-30" />
        </ul>
      </Provider>,
    );
    expect(screen.getByText('Expected 5 Sep 2026')).toHaveClass('text-ink-muted');
    expect(screen.getByText('Due by 5 Sep 2026')).toHaveClass('text-ink-muted');
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });
});
