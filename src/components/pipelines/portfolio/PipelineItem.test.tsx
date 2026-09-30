import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OPPORTUNITIES_KIND, RISKS_KIND } from '../../../features/pipelines/pipelineKinds';
import type { PipelineRow } from '../../../features/pipelines/pipelineTypes';
import { adminLeft, analyticsAddOn, emeaSeats, globexUplift, initechWin } from '../../../features/pipelines/testPipelines';
import { PipelineItem, type PipelineItemProps } from './PipelineItem';

function renderItem(row: PipelineRow, props: Partial<PipelineItemProps> = {}) {
  const onOpen = vi.fn();
  const onToggleSelect = vi.fn();
  render(
    <MemoryRouter>
      <ul>
        <PipelineItem
          row={row}
          kind={row.kind === 'risk' ? RISKS_KIND : OPPORTUNITIES_KIND}
          currency="USD"
          selecting={false}
          selected={false}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
          {...props}
        />
      </ul>
    </MemoryRouter>,
  );
  const item = document.querySelector(`[data-item-id="${row.id}"]`) as HTMLElement;
  return { item, onOpen, onToggleSelect };
}

describe('PipelineItem (spec §1 "List items")', () => {
  it('shows the title, Part of, MRR, stage, department, date and one signal', () => {
    const { item } = renderItem(emeaSeats);
    expect(within(item).getByRole('button', { name: 'EMEA seats' })).toHaveClass('min-h-11');
    expect(within(item).getByRole('link', { name: 'Pizza Hut EMEA' })).toHaveAttribute('href', '/accounts/12');
    expect(within(item).getByText('$2.0K')).toHaveClass('font-mono-brand', 'tabular-nums');
    for (const text of ['Negotiation', 'Customer Success', 'Closes in 7d']) expect(within(item).getByText(text)).toBeInTheDocument();
    // The signal says High priority; the tag would only repeat it (plan Decision 17).
    expect(within(item).getAllByText('High priority')).toHaveLength(1);
    expect(item.querySelector('table')).toBeNull();
  });

  it('marks an overdue item, and reads a whole-company, undated one', () => {
    renderItem(globexUplift);
    expect(screen.getByText('Overdue 5d')).toHaveClass('text-danger');
    expect(screen.getByText('Overdue')).toHaveClass('bg-danger-dim');
    expect(screen.getByText('Low priority')).toBeInTheDocument();
    renderItem(analyticsAddOn);
    expect(screen.getByText('Whole company')).toBeInTheDocument();
    expect(screen.getByText('No date')).toBeInTheDocument();
  });

  it("words a risk's date, and a closed item's past date", () => {
    renderItem(adminLeft);
    expect(screen.getByText('Due in 20d')).toBeInTheDocument();
    renderItem(initechWin);
    expect(screen.getByText('Expected 10 Sep 2026')).toBeInTheDocument();
    expect(screen.getByText('Medium priority')).toBeInTheDocument();
  });

  it('shows the High priority tag when the item has no signal', () => {
    const { item } = renderItem({ ...emeaSeats, open: false, stage: { value: 'closed_won', label: 'Closed Won' }, signal: null });
    expect(within(item).getByText('High priority')).toHaveAttribute('data-field', 'priority');
  });

  it('opens from its title or its body; the Part-of link does not open it', async () => {
    const { item, onOpen } = renderItem(emeaSeats);
    await userEvent.click(within(item).getByRole('button', { name: 'EMEA seats' }));
    expect(onOpen).toHaveBeenCalledWith(emeaSeats);
    await userEvent.click(within(item).getByText('Negotiation'));
    expect(onOpen).toHaveBeenCalledTimes(2);
    await userEvent.click(within(item).getByRole('link', { name: 'Pizza Hut EMEA' }));
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('selects instead of opening while selecting, with a 44px checkbox', async () => {
    const { item, onOpen, onToggleSelect } = renderItem(emeaSeats, { selecting: true });
    const checkbox = within(item).getByRole('checkbox', { name: 'Select EMEA seats' });
    expect(checkbox.closest('label')).toHaveClass('w-11', 'h-11', 'flex');
    await userEvent.click(within(item).getByRole('button', { name: 'EMEA seats' }));
    await userEvent.click(within(item).getByText('Negotiation'));
    expect(onToggleSelect).toHaveBeenCalledTimes(2);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('disables the checkbox while its list loads, and at the 500 limit unless selected', () => {
    renderItem(emeaSeats, { selectDisabled: true });
    expect(screen.getByRole('checkbox', { name: 'Select EMEA seats' })).toBeDisabled();
    renderItem(globexUplift, { atLimit: true });
    expect(screen.getByRole('checkbox', { name: 'Select Globex uplift' })).toBeDisabled();
    renderItem(adminLeft, { atLimit: true, selected: true });
    expect(screen.getByRole('checkbox', { name: 'Select Admin left' })).toBeEnabled();
  });
});
