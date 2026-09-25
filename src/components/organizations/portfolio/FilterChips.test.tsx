import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips } from './FilterChips';
import { parseParams } from '../../../features/organizations/portfolioParams';
import { FILTER_OPTIONS } from '../../../features/organizations/testPortfolio';

describe('FilterChips', () => {
  it('removes a chip, clears all, and says N of M', async () => {
    const onChange = vi.fn();
    const onClearAll = vi.fn();
    render(
      <FilterChips
        params={parseParams(new URLSearchParams('owner=2&ids=7'))}
        options={FILTER_OPTIONS}
        count={1}
        total={2}
        onChange={onChange}
        onClearAll={onClearAll}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 organizations');
    await userEvent.click(screen.getByRole('button', { name: 'Remove Opened from the dashboard (1)' }));
    expect(onChange).toHaveBeenCalledWith({ ids: [] });
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('shows only the count with no filters', () => {
    render(<FilterChips params={parseParams(new URLSearchParams())} options={null} count={2} total={null} onChange={vi.fn()} onClearAll={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 organizations');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
