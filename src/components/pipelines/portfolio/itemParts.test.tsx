import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { analyticsAddOn, emeaSeats } from '../../../features/pipelines/testPipelines';
import { DateLine, PartOf, PipelineSignal, PriorityTag, StageTag } from './itemParts';

describe('the Pipelines item parts', () => {
  it("links Part of to the organisation's or account's page, naming an account's organisation", () => {
    render(
      <MemoryRouter>
        <PartOf row={emeaSeats} />
        <PartOf row={analyticsAddOn} />
      </MemoryRouter>,
    );
    const account = screen.getByRole('link', { name: 'Pizza Hut EMEA' });
    expect(account).toHaveAttribute('href', '/accounts/12');
    expect(account.closest('p')).toHaveTextContent('Part of Pizza Hut EMEA · Pizza Hut');
    expect(screen.getByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
  });

  it('shows the date in DM Mono, in danger when overdue, and one signal by kind', () => {
    render(
      <>
        <DateLine text="Overdue 5d" overdue />
        <DateLine text="Closes in 7d" overdue={false} />
        <PipelineSignal signal={{ kind: 'overdue', label: 'Overdue' }} />
        <PipelineSignal signal={{ kind: 'high_priority', label: 'High priority' }} />
        <PipelineSignal signal={null} />
        <PriorityTag priority={{ value: 'low', label: 'Low' }} />
        <StageTag label="Negotiation" />
      </>,
    );
    expect(screen.getByText('Overdue 5d')).toHaveClass('font-mono-brand', 'tabular-nums', 'text-danger');
    expect(screen.getByText('Closes in 7d')).toHaveClass('text-ink-muted');
    expect(screen.getByText('Overdue')).toHaveClass('bg-danger-dim');
    expect(screen.getByText('High priority')).toHaveClass('bg-warning-dim');
    expect(screen.getByText('Low priority')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toHaveAttribute('data-field', 'stage');
  });
});
