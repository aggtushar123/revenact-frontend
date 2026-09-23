import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DashboardToolbar } from './DashboardToolbar';

function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.search}</span>;
}

const filters = [
  { key: 'days', label: 'Window', clearable: false, options: [{ value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }] },
  { key: 'owner', label: 'Primary Owner', options: [{ value: '', label: 'All' }, { value: '7', label: 'Carl CSM' }] },
];

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/dashboard/health/:view"
          element={
            <>
              <DashboardToolbar
                subViews={[
                  { label: 'Usage', path: '/dashboard/health/usage' },
                  { label: 'Activity', path: '/dashboard/health/activity' },
                ]}
                filters={filters}
                defaults={{ days: '90' }}
                count="3 of 9 accounts"
              />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardToolbar', () => {
  it('marks the current sub-view and keeps filters when switching', async () => {
    renderAt('/dashboard/health/usage?owner=7');
    expect(screen.getByRole('link', { name: 'Usage' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('link', { name: 'Activity' }));
    expect(screen.getByTestId('where').textContent).toBe('/dashboard/health/activity?owner=7');
  });

  it('writes a picked filter to the URL', async () => {
    renderAt('/dashboard/health/usage');
    await userEvent.selectOptions(screen.getByLabelText('Primary Owner'), '7');
    expect(screen.getByTestId('where').textContent).toContain('owner=7');
  });

  it('shows the count and a Clear that leaves the period alone', async () => {
    renderAt('/dashboard/health/usage?owner=7&days=30');
    expect(screen.getByText('3 of 9 accounts')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear 1' }));
    expect(screen.getByTestId('where').textContent).toBe('/dashboard/health/usage?days=30');
  });

  it('hides the count and Clear with no active filter', () => {
    renderAt('/dashboard/health/usage?days=30');
    expect(screen.queryByText('3 of 9 accounts')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Clear/ })).not.toBeInTheDocument();
  });
});
