import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { usePortfolioParams } from './usePortfolioParams';

function Probe() {
  const { params, update, clearFilters } = usePortfolioParams();
  const location = useLocation();
  return (
    <div>
      <p data-testid="where">{location.search}</p>
      <p data-testid="health">{params.health.join(',')}</p>
      <button type="button" onClick={() => update({ health: ['poor'] })}>Poor</button>
      <button type="button" onClick={() => update({ group: '' })}>No groups</button>
      <button type="button" onClick={clearFilters}>Clear</button>
    </div>
  );
}

describe('usePortfolioParams', () => {
  it('writes filters to the URL, keeps sort and group when clearing filters', async () => {
    render(
      <MemoryRouter initialEntries={['/organizations/list?sort=name&ids=7']}>
        <Probe />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Poor' }));
    expect(screen.getByTestId('health')).toHaveTextContent('poor');
    expect(new URLSearchParams(screen.getByTestId('where').textContent!).get('health')).toBe('poor');

    await userEvent.click(screen.getByRole('button', { name: 'No groups' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    const search = new URLSearchParams(screen.getByTestId('where').textContent!);
    expect(search.get('sort')).toBe('name');
    expect(search.get('group')).toBe('none');
    expect(search.has('health')).toBe(false);
    expect(search.has('ids')).toBe(false);
  });
});
