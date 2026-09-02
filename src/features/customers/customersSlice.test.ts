import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer, {
  fetchCustomers,
  fetchUpcomingRenewals,
  fetchCustomerStats,
  fetchCustomerById,
  fetchAccountsForCustomer,
  createAccount,
  updateAccount,
  createCustomer,
  updateCustomer,
  fetchActivitiesForCustomer,
  fetchActivitiesForAccount,
  clearActivities,
} from './customersSlice';

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
  is_archived: false,
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

  it('createCustomer POSTs to /customers/ and unshifts the result, bumping count and totalCount', async () => {
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    const initech = { ...globex, id: 2, name: 'Initech' };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => initech });
    vi.stubGlobal('fetch', fetchMock);

    await store.dispatch(createCustomer({ name: 'Initech' }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/customers/'),
      expect.objectContaining({ method: 'POST' })
    );
    const state = store.getState().customers;
    expect(state.customers).toEqual([initech, globex]);
    expect(state.count).toBe(2);
    expect(state.totalCount).toBe(2);
  });

  it('updateCustomer PATCHes /customers/<id>/ and replaces the matching entry in place', async () => {
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    const renamed = { ...globex, name: 'Globex Renamed' };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => renamed });
    vi.stubGlobal('fetch', fetchMock);

    await store.dispatch(updateCustomer({ id: globex.id, name: 'Globex Renamed' }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/customers/${globex.id}/`),
      expect.objectContaining({ method: 'PATCH' })
    );
    const state = store.getState().customers;
    expect(state.customers).toEqual([renamed]);
    expect(state.count).toBe(1);
  });

  it('updateCustomer with is_archived:true removes the row from the list and decrements counts', async () => {
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    const store = makeStore();
    await store.dispatch(fetchCustomers());

    const archived = { ...globex, is_archived: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => archived }));

    await store.dispatch(updateCustomer({ id: globex.id, is_archived: true }));

    const state = store.getState().customers;
    expect(state.customers).toEqual([]);
    expect(state.count).toBe(0);
    expect(state.totalCount).toBe(0);
  });

  describe('fetchCustomerById (Details.tsx)', () => {
    it('GETs /customers/<id>/ and stores the result as selectedCustomer', async () => {
      mockFetchOnce(200, globex);
      const store = makeStore();

      await store.dispatch(fetchCustomerById(globex.id));

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${globex.id}/`),
        expect.objectContaining({ method: 'GET' })
      );
      const state = store.getState().customers;
      expect(state.selectedCustomer).toEqual(globex);
      expect(state.selectedCustomerLoading).toBe(false);
      expect(state.selectedCustomerError).toBeNull();
    });

    it('sets an error and leaves selectedCustomer null on a 404 (out-of-org or nonexistent id)', async () => {
      mockFetchOnce(404, { detail: 'Not found.' });
      const store = makeStore();

      await store.dispatch(fetchCustomerById(999));

      const state = store.getState().customers;
      expect(state.selectedCustomer).toBeNull();
      expect(state.selectedCustomerError).toBe('Not found.');
    });

    it('clears a previous selectedCustomer as soon as a new fetch starts', async () => {
      mockFetchOnce(200, globex);
      const store = makeStore();
      await store.dispatch(fetchCustomerById(globex.id));
      expect(store.getState().customers.selectedCustomer).toEqual(globex);

      // Simulate navigating straight from this org's Details page to
      // another's — dispatch a second fetch without awaiting it yet.
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
      store.dispatch(fetchCustomerById(2));

      expect(store.getState().customers.selectedCustomer).toBeNull();
    });

    it('updateCustomer keeps selectedCustomer in sync when it edits the currently-viewed organization', async () => {
      mockFetchOnce(200, globex);
      const store = makeStore();
      await store.dispatch(fetchCustomerById(globex.id));

      const renamed = { ...globex, name: 'Globex Renamed' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => renamed }));
      await store.dispatch(updateCustomer({ id: globex.id, name: 'Globex Renamed' }));

      expect(store.getState().customers.selectedCustomer).toEqual(renamed);
    });
  });

  describe('fetchAccountsForCustomer (Details.tsx Accounts tab)', () => {
    const account = {
      id: 1,
      customer: globex.id,
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
      ai_pulse_reason: '',
      nps_score: 100,
      csat_score: '100.00',
      renewal_date: '2026-03-02',
      arr: '33600.00',
    };

    it('GETs /customers/<id>/accounts/ and stores the plain array as accountsForCustomer', async () => {
      mockFetchOnce(200, [account]);
      const store = makeStore();

      await store.dispatch(fetchAccountsForCustomer(globex.id));

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${globex.id}/accounts/`),
        expect.objectContaining({ method: 'GET' })
      );
      const state = store.getState().customers;
      expect(state.accountsForCustomer).toEqual([account]);
      expect(state.accountsLoading).toBe(false);
      expect(state.accountsError).toBeNull();
    });

    it('sets an error and leaves accountsForCustomer empty on a 404', async () => {
      mockFetchOnce(404, { detail: 'Not found.' });
      const store = makeStore();

      await store.dispatch(fetchAccountsForCustomer(999));

      const state = store.getState().customers;
      expect(state.accountsForCustomer).toEqual([]);
      expect(state.accountsError).toBe('Not found.');
    });

    it('clears a previous accountsForCustomer as soon as a new fetch starts', async () => {
      mockFetchOnce(200, [account]);
      const store = makeStore();
      await store.dispatch(fetchAccountsForCustomer(globex.id));
      expect(store.getState().customers.accountsForCustomer).toEqual([account]);

      // Simulate navigating straight from this org's Accounts tab to
      // another's — dispatch a second fetch without awaiting it yet.
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
      store.dispatch(fetchAccountsForCustomer(2));

      expect(store.getState().customers.accountsForCustomer).toEqual([]);
    });

    describe('createAccount/updateAccount (Add/Edit Account)', () => {
      it('createAccount POSTs to /customers/<id>/accounts/ and unshifts the result', async () => {
        mockFetchOnce(200, [account]);
        const store = makeStore();
        await store.dispatch(fetchAccountsForCustomer(globex.id));

        const created = { ...account, id: 2, name: 'EMEA' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => created }));

        await store.dispatch(createAccount({ customerId: globex.id, name: 'EMEA' }));

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/customers/${globex.id}/accounts/`),
          expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'EMEA' }) })
        );
        expect(store.getState().customers.accountsForCustomer).toEqual([created, account]);
      });

      it('updateAccount PATCHes /customers/<id>/accounts/<id>/ and replaces the matching entry in place', async () => {
        mockFetchOnce(200, [account]);
        const store = makeStore();
        await store.dispatch(fetchAccountsForCustomer(globex.id));

        const renamed = { ...account, name: 'North America Renamed' };
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => renamed });
        vi.stubGlobal('fetch', fetchMock);

        await store.dispatch(
          updateAccount({ customerId: globex.id, id: account.id, name: 'North America Renamed' })
        );

        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining(`/customers/${globex.id}/accounts/${account.id}/`),
          expect.objectContaining({ method: 'PATCH' })
        );
        expect(store.getState().customers.accountsForCustomer).toEqual([renamed]);
      });

      it('createAccount surfaces the backend error on rejection', async () => {
        mockFetchOnce(400, { name: ['This field is required.'] });
        const store = makeStore();

        const result = await store.dispatch(createAccount({ customerId: globex.id, name: '' }));

        expect(createAccount.rejected.match(result)).toBe(true);
        expect(result.payload).toBe('This field is required.');
      });
    });
  });

  describe('fetchActivitiesForCustomer / fetchActivitiesForAccount (ActivityFeed\'s Activities filter)', () => {
    const orgActivity = {
      id: 1,
      type: 'health_check_review',
      type_display: 'Health Check Review',
      occurred_at: '2026-02-28',
      links: 2,
      watchers: 3,
    };
    const accountActivity = {
      id: 2,
      type: 'renewal_proposal_submitted',
      type_display: 'Renewal Proposal Submitted',
      occurred_at: '2026-03-15',
      links: 1,
      watchers: 4,
    };

    it('fetchActivitiesForCustomer GETs /customers/<id>/activities/ and stores the result', async () => {
      mockFetchOnce(200, [orgActivity]);
      const store = makeStore();

      await store.dispatch(fetchActivitiesForCustomer(globex.id));

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${globex.id}/activities/`),
        expect.objectContaining({ method: 'GET' })
      );
      const state = store.getState().customers;
      expect(state.activities).toEqual([orgActivity]);
      expect(state.activitiesLoading).toBe(false);
      expect(state.activitiesError).toBeNull();
    });

    it('fetchActivitiesForAccount GETs the nested account endpoint and stores the result', async () => {
      mockFetchOnce(200, [accountActivity]);
      const store = makeStore();

      await store.dispatch(fetchActivitiesForAccount({ customerId: globex.id, accountId: 17 }));

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/customers/${globex.id}/accounts/17/activities/`),
        expect.objectContaining({ method: 'GET' })
      );
      expect(store.getState().customers.activities).toEqual([accountActivity]);
    });

    // This is the direct regression guard for the bug that prompted this
    // feature: every real account used to show the exact same hardcoded
    // mock activities (ACCOUNT_ID_MAP's `?? 101` fallback). Dispatching
    // for two different accounts back to back must leave each one's own,
    // distinct activities in the single `activities` slot — not a stale
    // mix or the first account's data reused for the second.
    it('activities for one account never leak into another account\'s fetch', async () => {
      mockFetchOnce(200, [accountActivity]);
      const store = makeStore();
      await store.dispatch(fetchActivitiesForAccount({ customerId: globex.id, accountId: 17 }));
      expect(store.getState().customers.activities).toEqual([accountActivity]);

      const otherAccountActivity = { ...orgActivity, id: 3, type_display: 'Success Plan Updated' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [otherAccountActivity] })
      );
      await store.dispatch(fetchActivitiesForAccount({ customerId: globex.id, accountId: 6 }));

      expect(store.getState().customers.activities).toEqual([otherAccountActivity]);
    });

    it('sets an error and leaves activities empty on a 404', async () => {
      mockFetchOnce(404, { detail: 'Not found.' });
      const store = makeStore();

      await store.dispatch(fetchActivitiesForCustomer(999));

      const state = store.getState().customers;
      expect(state.activities).toEqual([]);
      expect(state.activitiesError).toBe('Not found.');
    });

    it('clears a previous fetch\'s activities as soon as a new one starts', async () => {
      mockFetchOnce(200, [orgActivity]);
      const store = makeStore();
      await store.dispatch(fetchActivitiesForCustomer(globex.id));
      expect(store.getState().customers.activities).toEqual([orgActivity]);

      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
      store.dispatch(fetchActivitiesForCustomer(2));

      expect(store.getState().customers.activities).toEqual([]);
    });

    it('clearActivities empties the slot outright (ActivityFeed\'s no-resolvable-id fallback)', async () => {
      mockFetchOnce(200, [orgActivity]);
      const store = makeStore();
      await store.dispatch(fetchActivitiesForCustomer(globex.id));
      expect(store.getState().customers.activities).toEqual([orgActivity]);

      store.dispatch(clearActivities());

      const state = store.getState().customers;
      expect(state.activities).toEqual([]);
      expect(state.activitiesError).toBeNull();
    });
  });
});
