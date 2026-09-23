import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, useLocation } from 'react-router-dom';
import { dashboardRoutes } from './routes';

function Where() {
  const l = useLocation();
  return <span data-testid="where">{l.pathname + l.search}</span>;
}

// Each view is stubbed: this test is about where URLs land, not what renders.
const stub = () => <Where />;

const cases: [string, string][] = [
  ['/dashboard', '/dashboard/overview'],
  ['/dashboard/advance', '/dashboard/overview'],
  ['/dashboard/advance/health', '/dashboard/health/triage'],
  ['/dashboard/advance/health/triage', '/dashboard/health/triage'],
  ['/dashboard/advance/health/divergence', '/dashboard/health/divergence'],
  ['/dashboard/advance/health/movement', '/dashboard/health/movement'],
  ['/dashboard/advance/health/renewal-date', '/dashboard/health/renewals'],
  ['/dashboard/advance/health/controls', '/dashboard/health/distribution'],
  ['/dashboard/advance/health/primary-owner', '/dashboard/health/triage'],
  ['/dashboard/advance/usage/controls', '/dashboard/health/usage'],
  ['/dashboard/advance/activity/controls', '/dashboard/health/activity'],
  ['/dashboard/advance/revenue/controls', '/dashboard/revenue/forecast'],
  ['/dashboard/advance/customer/controls', '/dashboard/revenue/customers'],
  ['/dashboard/advance/product/controls', '/dashboard/revenue/products'],
  ['/dashboard/advance/ticket/ticket-priority', '/dashboard/support/tickets'],
  ['/dashboard/advance/ai-trending/controls', '/dashboard/support/topics'],
  ['/dashboard/custom', '/dashboard/overview'],
  ['/dashboard/revenue', '/dashboard/revenue/forecast'],
  ['/dashboard/health', '/dashboard/health/triage'],
  ['/dashboard/support', '/dashboard/support/tickets'],
  ['/health', '/dashboard/health/distribution'],
];

describe('dashboard routes', () => {
  it.each(cases)('%s lands on %s', (from, to) => {
    render(
      <MemoryRouter initialEntries={[from]}>
        <Routes>{dashboardRoutes(stub)}</Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('where').textContent).toBe(to);
  });

  it('keeps the query string through a legacy redirect', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/advance/revenue/controls?owner=7']}>
        <Routes>{dashboardRoutes(stub)}</Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('where').textContent).toBe('/dashboard/revenue/forecast?owner=7');
  });
});

describe('dashboard frame', () => {
  // The layout's <main> is overflow-hidden, so the dashboard has to own its
  // own scroll — without it a long view is simply cut off.
  it.each(['/dashboard/overview', '/dashboard/health/triage', '/dashboard/support/tickets'])(
    '%s renders inside a scroll container with page padding',
    (url) => {
      render(
        <MemoryRouter initialEntries={[url]}>
          <Routes>{dashboardRoutes(stub)}</Routes>
        </MemoryRouter>,
      );
      const scroller = screen.getByTestId('where').closest('.overflow-y-auto');
      expect(scroller).not.toBeNull();
      expect(scroller).toHaveClass('p-4', 'min-h-0');
    },
  );
});
