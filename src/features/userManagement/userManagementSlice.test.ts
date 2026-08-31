import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import userManagementReducer, { fetchCSMs, addCSM, updateCSM } from './userManagementSlice';

function makeStore() {
  return configureStore({ reducer: { userManagement: userManagementReducer } });
}

// Matches revenact-backend's UserSerializer — see docs/API_CONTRACTS.md.
const carl = {
  id: 2,
  email: 'carl@acme.io',
  name: 'Carl CSM',
  avatar: 'https://i.pravatar.cc/150?u=carl@acme.io',
  role: 'csm' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
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

describe('userManagementSlice', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with an empty list', () => {
    const state = makeStore().getState().userManagement;
    expect(state.csms).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchCSMs loads the list from the paginated envelope', async () => {
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [carl] });

    const store = makeStore();
    await store.dispatch(fetchCSMs());

    const state = store.getState().userManagement;
    expect(state.isLoading).toBe(false);
    expect(state.csms).toEqual([carl]);
  });

  it('fetchCSMs sets an error on failure (e.g. a CSM hitting this admin-only endpoint)', async () => {
    mockFetchOnce(403, { detail: 'Only an organisation admin can do this.' });

    const store = makeStore();
    await store.dispatch(fetchCSMs());

    expect(store.getState().userManagement.error).toBe('Only an organisation admin can do this.');
  });

  it('addCSM appends the new member, keeping the list sorted by name', async () => {
    const store = makeStore();
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [carl] });
    await store.dispatch(fetchCSMs());

    const dana = { ...carl, id: 3, email: 'dana@acme.io', name: 'Dana New' };
    mockFetchOnce(201, dana);
    await store.dispatch(addCSM({ name: 'Dana New', email: 'dana@acme.io', password: 'danapassword1' }));

    const names = store.getState().userManagement.csms.map((csm) => csm.name);
    expect(names).toEqual(['Carl CSM', 'Dana New']);
  });

  it('updateCSM replaces the matching member in place', async () => {
    const store = makeStore();
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [carl] });
    await store.dispatch(fetchCSMs());

    mockFetchOnce(200, { ...carl, is_active: false });
    await store.dispatch(updateCSM({ id: carl.id, is_active: false }));

    expect(store.getState().userManagement.csms[0].is_active).toBe(false);
  });

  it('a failed updateCSM (e.g. deactivate) surfaces an error, since its button has no form of its own', async () => {
    const store = makeStore();
    mockFetchOnce(200, { count: 1, next: null, previous: null, results: [carl] });
    await store.dispatch(fetchCSMs());

    mockFetchOnce(404, { detail: 'Not found.' });
    await store.dispatch(updateCSM({ id: 999, is_active: false }));

    expect(store.getState().userManagement.error).toBe('Not found.');
    // The existing list is untouched — no matching entry to replace.
    expect(store.getState().userManagement.csms).toEqual([carl]);
  });
});
