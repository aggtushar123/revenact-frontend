import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer, { fetchCustomers, fetchUpcomingRenewals, fetchCustomerStats } from './customersSlice';

function makeStore() {
  return configureStore({ reducer: { customers: customersReducer } });
}

// Minimal but real shape, matching revenact-backend's CustomerSerializer —
// see docs/API_CONTRACTS.md -> customers.
const globex = {
  id: 1,
  name: 'Globex Corp',
  address: '',
  domain: '',
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
};

function mockFetchOnce(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  );
}

describe('customersSlice', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts empty', () => {
    const state = makeStore().getState().customers;
    expect(state.customers).toEqual([]);
    expect(state.count).toBe(0);
    expect(state.totalCount).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchCustomers loads a page and tracks the pagination envelope', async () => {
    mockFetchOnce(200, {
      count: 30,
      next: 'http://localhost:8000/api/v1/customers/?page=2',
      previous: null,
      results: [globex],
    });

    const store = makeStore();
    await store.dispatch(fetchCustomers());

    const state = store.getState().customers;
    expect(state.isLoading).toBe(false);
    expect(state.customers).toEqual([globex]);
    expect(state.count).toBe(30);
    expect(state.next).toBe('http://localhost:8000/api/v1/customers/?page=2');
    expect(state.previous).toBeNull();
  });

  it('paging forward calls fetch with the exact next URL the server gave back, unprefixed', async () => {
    mockFetchOnce(200, {
      count: 30,
      next: 'http://localhost:8000/api/v1/customers/?page=2',
      previous: null,
      results: [globex],
    });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 30, next: null, previous: 'http://localhost:8000/api/v1/customers/', results: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await store.dispatch(fetchCustomers(store.getState().customers.next!));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/customers/?page=2',
      expect.anything()
    );
  });

  it('sets an error on failure without clearing already-loaded data', async () => {
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    mockFetchOnce(500, { detail: 'Server error.' });
    await store.dispatch(fetchCustomers());

    const state = store.getState().customers;
    expect(state.error).toBe('Server error.');
    expect(state.customers).toEqual([globex]);
  });

  it('an unfiltered fetch updates totalCount ("organisations onboarded")', async () => {
    mockFetchOnce(200, { count: 12, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    expect(store.getState().customers.totalCount).toBe(12);
  });

  it('a search-filtered fetch updates count but leaves totalCount alone', async () => {
    mockFetchOnce(200, { count: 12, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    await store.dispatch(fetchCustomers('/customers/?search=globex'));

    const state = store.getState().customers;
    expect(state.count).toBe(1);
    expect(state.totalCount).toBe(12);
  });

  it('a page reached mid-search (next link still carrying ?search=) also leaves totalCount alone', async () => {
    mockFetchOnce(200, { count: 12, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    mockFetchOnce(200, {
      count: 2,
      next: 'http://localhost:8000/api/v1/customers/?search=globex&page=2',
      previous: null,
      results: [globex],
    });
    await store.dispatch(fetchCustomers('/customers/?search=globex'));

    mockFetchOnce(200, { count: 2, next: null, previous: null, results: [globex] });
    await store.dispatch(fetchCustomers(store.getState().customers.next!));

    expect(store.getState().customers.totalCount).toBe(12);
  });

  it('fetchUpcomingRenewals hits ?renewal_within= with the given window and stores the results separately', async () => {
    const wework = { ...globex, id: 3, name: 'WeWork' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ count: 1, next: null, previous: null, results: [wework] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const store = makeStore();
    await store.dispatch(fetchUpcomingRenewals(30));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/customers/?renewal_within=30'),
      expect.anything()
    );
    const state = store.getState().customers;
    expect(state.renewals).toEqual([wework]);
    expect(state.renewalsCount).toBe(1);
    expect(state.renewalsLoading).toBe(false);
    // Doesn't touch the main table's own list/count/totalCount.
    expect(state.customers).toEqual([]);
    expect(state.totalCount).toBe(0);
  });

  it('fetchUpcomingRenewals sets its own error, separate from the main list error', async () => {
    mockFetchOnce(500, { detail: 'Server error.' });
    const store = makeStore();
    await store.dispatch(fetchUpcomingRenewals(90));

    const state = store.getState().customers;
    expect(state.renewalsError).toBe('Server error.');
    expect(state.error).toBeNull();
  });

  it('fetchCustomerStats hits /customers/stats/ and stores the health/nps/lifecycle rollup', async () => {
    const stats = {
      health: {
        good: { count: 9, mrr: 1000, arr: 12000 },
        average: { count: 2, mrr: 200, arr: 2400 },
        poor: { count: 3, mrr: 300, arr: 3600 },
      },
      nps: { promoters: 9, passives: 1, detractors: 4, score: 36 },
      lifecycle: {
        onboarding: { count: 1, mrr: 0, arr: 0 },
        kickoff: { count: 0, mrr: 0, arr: 0 },
        adoption: { count: 0, mrr: 0, arr: 0 },
        live: { count: 10, mrr: 0, arr: 0 },
        renewal: { count: 0, mrr: 0, arr: 0 },
        churn: { count: 3, mrr: 0, arr: 0 },
        expansion: { count: 0, mrr: 0, arr: 0 },
        other: { count: 0, mrr: 0, arr: 0 },
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => stats });
    vi.stubGlobal('fetch', fetchMock);

    const store = makeStore();
    await store.dispatch(fetchCustomerStats());

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/customers/stats/'), expect.anything());
    const state = store.getState().customers;
    expect(state.stats).toEqual(stats);
    expect(state.statsLoading).toBe(false);
    expect(state.statsError).toBeNull();
  });

  it('fetchCustomerStats sets its own error, separate from the main list and renewals errors', async () => {
    mockFetchOnce(500, { detail: 'Server error.' });
    const store = makeStore();
    await store.dispatch(fetchCustomerStats());

    const state = store.getState().customers;
    expect(state.statsError).toBe('Server error.');
    expect(state.stats).toBeNull();
    expect(state.error).toBeNull();
    expect(state.renewalsError).toBeNull();
  });
});
