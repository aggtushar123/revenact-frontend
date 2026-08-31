import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { List } from './List';

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

const carl = {
  id: 2,
  email: 'carl@acme.io',
  name: 'Carl CSM',
  avatar: 'https://i.pravatar.cc/150?u=carl@acme.io',
  role: 'csm' as const,
  organisation: { id: 1, name: 'Acme Inc', slug: 'acme-inc' },
  is_active: true,
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

// Routes each fetch call by URL/method instead of call order — List.tsx
// hits both /customers/ (via the Redux thunk) and /auth/members/ (via the
// modal's own effect), and their relative timing isn't guaranteed.
function mockApi({
  customers = [globex],
  members = [carl],
  onCreate,
  onUpdate,
}: {
  customers?: typeof globex[];
  members?: typeof carl[];
  onCreate?: (body: unknown) => unknown;
  onUpdate?: (body: unknown) => unknown;
} = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options: RequestInit = {}) => {
      const method = options.method ?? 'GET';
      if (url.includes('/auth/members/')) {
        return Promise.resolve(jsonResponse(200, members));
      }
      if (url.includes('/customers/') && method === 'GET') {
        return Promise.resolve(jsonResponse(200, { count: customers.length, next: null, previous: null, results: customers }));
      }
      if (url.includes('/customers/') && method === 'POST') {
        const body = JSON.parse(options.body as string);
        return Promise.resolve(jsonResponse(201, onCreate ? onCreate(body) : { ...globex, id: 99, ...body }));
      }
      if (url.includes('/customers/') && method === 'PATCH') {
        const body = JSON.parse(options.body as string);
        return Promise.resolve(jsonResponse(200, onUpdate ? onUpdate(body) : { ...globex, ...body }));
      }
      throw new Error(`Unhandled request: ${method} ${url}`);
    })
  );
}

function renderPage() {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <List />
    </Provider>
  );
}

describe('Organizations List page', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the customers fetched on mount', async () => {
    mockApi();
    renderPage();

    expect(await screen.findByText('Globex Corp')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('filters the list client-side by name', async () => {
    mockApi({ customers: [globex, { ...globex, id: 2, name: 'Initech' }] });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Initech')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search by name'), 'globex');

    expect(screen.getByText('Globex Corp')).toBeInTheDocument();
    expect(screen.queryByText('Initech')).not.toBeInTheDocument();
  });

  it('adds an organization through the modal', async () => {
    mockApi({ customers: [], onCreate: (body) => ({ ...globex, id: 2, ...(body as object) }) });
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('No organizations yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /add organization/i }));
    await user.type(screen.getByLabelText('Name'), 'Initech');
    // Two "Add Organization" buttons exist now — the ActionBar trigger and
    // the modal's submit; the submit is the one inside the form.
    const submitButtons = screen.getAllByRole('button', { name: 'Add Organization' });
    await user.click(submitButtons[submitButtons.length - 1]);

    expect(await screen.findByText('Initech')).toBeInTheDocument();
  });

  it('edits an organization through the modal', async () => {
    mockApi({ onUpdate: (body) => ({ ...globex, ...(body as object) }) });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    const nameInput = await screen.findByLabelText('Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Globex Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByText('Edit Globex Corp')).not.toBeInTheDocument());
    expect(screen.getByText('Globex Renamed')).toBeInTheDocument();
  });

  it('populates the owner picker from /auth/members/ and assigns one', async () => {
    mockApi({ onUpdate: (body) => ({ ...globex, ...(body as object), owner: carl }) });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await screen.findByText('Carl CSM'); // option rendered once members load

    await user.selectOptions(screen.getByLabelText('Owner'), 'Carl CSM');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByText('Edit Globex Corp')).not.toBeInTheDocument());
    expect(screen.getAllByText('Carl CSM').length).toBeGreaterThan(0);
  });
});
