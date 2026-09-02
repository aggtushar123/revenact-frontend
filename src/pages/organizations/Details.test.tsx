import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { Details } from './Details';

// Minimal but real shape, matching revenact-backend's CustomerSerializer —
// see customersSlice.test.ts / docs/API_CONTRACTS.md -> customers.
const globex = {
  id: 10,
  name: 'Globex Corp',
  address: '123 Main St',
  domain: 'globex.example',
  owner: null,
  created_by: null,
  modified_by: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'onboarding' as const,
  health_score: '5.0',
  health_category: 'average' as const,
  pulse: [],
  ai_pulse_score: '' as const,
  ai_pulse_reason: '',
  nps_score: null,
  csat_score: null,
  joined_date: null,
  renewal_date: null,
  contract_start_date: null,
  contract_end_date: null,
  arr_billed_at_account: '0.00',
  arr_billed_at_hq: '0.00',
  implementation_fee: '0.00',
  total_contract_value: '0.00',
  total_forecasted_renewal_revenue: '0.00',
  primary_product: '',
  additional_products_count: null,
  top_source_channel: '',
  total_contracted_seats: null,
  total_active_seats: null,
  seat_utilization_percentage: null,
  total_hires: null,
  scope_web_app: '',
  ces_percentage: null,
  churn_date: null,
  churn_reason: '',
  churn_comment: '',
  is_archived: false,
};

function renderDetails(id: string) {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/organizations/${id}`]}>
        <Routes>
          <Route path="/organizations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Organization Details page (/organizations/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the org by the id in the URL and renders its real data on the General tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        const body = url.includes('/accounts/') ? [] : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');

    // Lifecycle stage is derived straight from the fetched Customer, via
    // the same mapCustomerToOrgRow() the organizations list uses. It
    // renders twice (the metrics banner and the pinned attributes list).
    expect(await screen.findAllByText('Onboarding')).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/accounts/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('shows a loading state before the fetch resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    renderDetails('10');

    expect(screen.getByText('Loading organization…')).toBeInTheDocument();
  });

  it('shows the backend error instead of crashing (e.g. a 404 for another org\'s id)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: 'Not found.' }) })
    );

    renderDetails('999');

    expect(await screen.findByText('Not found.')).toBeInTheDocument();
  });

  describe('Accounts tab (one Customer has many Accounts)', () => {
    const account = {
      id: 1,
      customer: 10,
      name: 'North America Enterprise',
      domain: '',
      owner: null,
      created_at: '2026-08-31T00:00:00Z',
      updated_at: '2026-08-31T00:00:00Z',
      lifecycle_stage: 'live' as const,
      health_score: '9.5',
      health_category: 'good' as const,
      pulse: [1, 1, 1, 1, 0],
      ai_pulse_score: 'very_satisfied' as const,
      ai_pulse_reason: 'Strong executive sponsorship.',
      nps_score: 100,
      csat_score: '100.00',
      renewal_date: '2026-03-02',
      arr: '33600.00',
    };

    async function openAccountsTab(accounts: unknown[]) {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          const body = url.includes('/accounts/') ? accounts : globex;
          return Promise.resolve({ ok: true, status: 200, json: async () => body });
        })
      );
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Accounts/ }));
    }

    it('shows real accounts fetched for this organization, and reflects the count in the tab badge', async () => {
      await openAccountsTab([account]);

      expect(await screen.findByText('North America Enterprise')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Accounts\(1\)$/ })).toBeInTheDocument();
    });

    it('shows a loading state before the accounts fetch resolves', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url.includes('/accounts/')) return new Promise(() => {});
          return Promise.resolve({ ok: true, status: 200, json: async () => globex });
        })
      );
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Accounts/ }));

      expect(await screen.findByText('Loading accounts…')).toBeInTheDocument();
    });

    it('shows an empty state when the organization has no accounts yet', async () => {
      await openAccountsTab([]);

      expect(await screen.findByText('No accounts for this organization yet.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Accounts\(0\)$/ })).toBeInTheDocument();
    });

    it('shows the backend error instead of crashing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if (url.includes('/accounts/')) {
            return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: 'Not found.' }) });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => globex });
        })
      );
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Accounts/ }));

      expect(await screen.findAllByText('Not found.')).not.toHaveLength(0);
    });
  });
});
