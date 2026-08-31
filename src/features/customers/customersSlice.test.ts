import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer, { fetchCustomers, addCustomer, updateCustomer } from './customersSlice';

function makeStore() {
  return configureStore({ reducer: { customers: customersReducer } });
}

// Matches revenact-backend's CustomerSerializer — see docs/API_CONTRACTS.md.
const globex = {
  id: 1,
  name: 'Globex Corp',
  health_score: 82,
  health_category: 'good' as const,
  arr: '45000.00',
  renewal_date: '2027-01-15',
  lifecycle_stage: 'live' as const,
  owner: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
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
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchCustomers loads the paginated envelope', async () => {
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });

    const store = makeStore();
    await store.dispatch(fetchCustomers());

    const state = store.getState().customers;
    expect(state.customers).toEqual([globex]);
    expect(state.count).toBe(1);
    expect(state.next).toBeNull();
  });

  it('fetchCustomers follows a next/previous URL verbatim (no re-prefixing)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ count: 1, next: null, previous: null, results: [globex] }) });
    vi.stubGlobal('fetch', fetchMock);

    const store = makeStore();
    await store.dispatch(fetchCustomers('http://localhost:8000/api/v1/customers/?page=2'));

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/customers/?page=2',
      expect.anything()
    );
  });

  it('fetchCustomers sets an error on failure', async () => {
    mockFetchOnce(401, { detail: 'Authentication credentials were not provided.' });

    const store = makeStore();
    await store.dispatch(fetchCustomers());

    expect(store.getState().customers.error).toBe('Authentication credentials were not provided.');
  });

  it('addCustomer appends and keeps the list sorted by name', async () => {
    const store = makeStore();
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    await store.dispatch(fetchCustomers());

    const initech = { ...globex, id: 2, name: 'Initech', health_category: 'poor' as const };
    mockFetchOnce(201, initech);
    await store.dispatch(addCustomer({ name: 'Initech' }));

    const names = store.getState().customers.customers.map((c) => c.name);
    expect(names).toEqual(['Globex Corp', 'Initech']);
    expect(store.getState().customers.count).toBe(2);
  });

  it('updateCustomer replaces the matching entry in place', async () => {
    const store = makeStore();
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [globex] });
    await store.dispatch(fetchCustomers());

    mockFetchOnce(200, { ...globex, health_score: 20, health_category: 'poor' });
    await store.dispatch(updateCustomer({ id: globex.id, health_score: 20 }));

    expect(store.getState().customers.customers[0].health_category).toBe('poor');
  });
});
