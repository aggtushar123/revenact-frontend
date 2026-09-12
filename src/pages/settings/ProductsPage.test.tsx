import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { ProductsPage } from './ProductsPage';
import { capabilitiesForRole } from '../../test/capabilities';
import type { Product } from './productsApi';

// Integration tier, same convention as CurrencyPage.test.tsx: a real auth
// store for the capability gate, the fetch boundary mocked.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: 'Product A',
  is_active: true,
  customers: 5,
  created_at: '2026-09-12T13:51:02Z',
  updated_at: '2026-09-12T13:51:02Z',
  ...overrides,
});

const CATALOGUE = [
  product(),
  product({ id: 2, name: 'Legacy Suite', is_active: false, customers: 1 }),
  product({ id: 3, name: 'Pilot Add-on', customers: 0 }),
];

/** One mock for the whole page: GET returns the catalogue, everything else
 *  is routed by method so a test can assert on the write it caused. */
function mockApi(
  writes: Partial<Record<'POST' | 'PATCH' | 'DELETE', (url: string, body: unknown) => ReturnType<typeof jsonResponse>>> = {},
  catalogue: Product[] = CATALOGUE
) {
  const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url, init) => {
    const method = (init?.method ?? 'GET') as 'GET' | 'POST' | 'PATCH' | 'DELETE';
    if (method === 'GET') return Promise.resolve(jsonResponse(200, catalogue));
    const handler = writes[method];
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    return Promise.resolve(handler ? handler(url, body) : jsonResponse(500, { detail: 'unhandled' }));
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}

function makeStore(role: 'admin' | 'csm' = 'admin') {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role,
          role_id: 1,
          role_name: role === 'admin' ? 'Admin' : 'CSM',
          permissions: capabilitiesForRole(role),
          function: 'cs' as const, function_display: 'Customer Success',
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '',
            ai_agent_enabled: true,
            ai_agent_tone: 'professional' as const,
            ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
}

function renderPage(role: 'admin' | 'csm' = 'admin') {
  render(
    <Provider store={makeStore(role)}>
      <ProductsPage />
    </Provider>
  );
}

const rowOf = (name: string) => screen.getByText(name).closest('li') as HTMLElement;

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the catalogue with how many customers are on each product', async () => {
    mockApi();
    renderPage();

    expect(await screen.findByText('Product A')).toBeInTheDocument();
    expect(within(rowOf('Product A')).getByText('5 customers')).toBeInTheDocument();
    expect(within(rowOf('Legacy Suite')).getByText('1 customer')).toBeInTheDocument();
    expect(within(rowOf('Pilot Add-on')).getByText('nobody on it')).toBeInTheDocument();
  });

  it('puts retired products after the live ones and marks them', async () => {
    mockApi();
    renderPage();

    await screen.findByText('Product A');
    const names = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(names[names.length - 1]).toContain('Legacy Suite');
    expect(within(rowOf('Legacy Suite')).getByText('Retired')).toBeInTheDocument();
    expect(
      screen.getByText(/Retired products stay on the customers already recorded/)
    ).toBeInTheDocument();
  });

  it('lets a CSM see the list but not touch it', async () => {
    // Reads are open because the pickers need the list; writes are org
    // configuration. A CSM adding "Prodcut A" would be the free-text problem
    // this table replaced.
    mockApi();
    renderPage('csm');

    expect(await screen.findByText('Product A')).toBeInTheDocument();
    expect(screen.getByText(/You can see the list but not change it/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add product' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rename/ })).not.toBeInTheDocument();
  });

  it('adds a product and shows it in the list', async () => {
    const api = mockApi({
      POST: (_url, body) =>
        jsonResponse(201, product({ id: 9, name: (body as { name: string }).name, customers: 0 })),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Product A');
    await user.click(screen.getByRole('button', { name: 'Add product' }));
    await user.type(screen.getByLabelText('Name'), '  Product D ');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Product D')).toBeInTheDocument();
    const post = api.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ name: 'Product D' });
  });

  it('shows the backend saying a name is already taken', async () => {
    mockApi({
      POST: () =>
        jsonResponse(400, {
          name: ['"Product A" already exists — products are unique per organisation, ignoring case.'],
        }),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Product A');
    await user.click(screen.getByRole('button', { name: 'Add product' }));
    await user.type(screen.getByLabelText('Name'), 'product a');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
  });

  it('renames a product in place', async () => {
    // The point of products being rows: one edit here renames it on every
    // customer at once.
    const api = mockApi({
      PATCH: (_url, body) => jsonResponse(200, product({ name: (body as { name: string }).name })),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Product A');
    await user.click(screen.getByRole('button', { name: 'Rename Product A' }));
    const input = screen.getByLabelText('New name for Product A');
    await user.clear(input);
    await user.type(input, 'Product Alpha');
    await user.click(screen.getByRole('button', { name: 'Save name for Product A' }));

    expect(await screen.findByText('Product Alpha')).toBeInTheDocument();
    const patch = api.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patch?.[0]).toContain('/products/1/');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ name: 'Product Alpha' });
  });

  it('retires a product rather than deleting one customers are on', async () => {
    const api = mockApi({
      PATCH: () => jsonResponse(200, product({ is_active: false })),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Product A');
    // Five customers are on it, so there is no delete button to be refused.
    expect(
      within(rowOf('Product A')).queryByRole('button', { name: 'Delete Product A' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retire Product A' }));

    expect(await within(rowOf('Product A')).findByText('Retired')).toBeInTheDocument();
    const patch = api.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(String(patch?.[1]?.body))).toEqual({ is_active: false });
  });

  it('brings a retired product back', async () => {
    mockApi({
      PATCH: () => jsonResponse(200, product({ id: 2, name: 'Legacy Suite', is_active: true })),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Legacy Suite');
    await user.click(screen.getByRole('button', { name: 'Bring back Legacy Suite' }));

    await waitFor(() =>
      expect(within(rowOf('Legacy Suite')).queryByText('Retired')).not.toBeInTheDocument()
    );
  });

  it('deletes a product nobody is on, after confirming', async () => {
    const api = mockApi({ DELETE: () => jsonResponse(204, null) });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Pilot Add-on');
    await user.click(screen.getByRole('button', { name: 'Delete Pilot Add-on' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Pilot Add-on')).not.toBeInTheDocument());
    const del = api.mock.calls.find(([, init]) => init?.method === 'DELETE');
    expect(del?.[0]).toContain('/products/3/');
  });

  it('shows the backend refusal if a delete is rejected anyway', async () => {
    // Somebody was put on it between the page loading and the click.
    mockApi({
      DELETE: () =>
        jsonResponse(400, [
          '1 customer is recorded against "Pilot Add-on". Retire it instead (is_active=false) so their history keeps saying what they bought.',
        ]),
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Pilot Add-on');
    await user.click(screen.getByRole('button', { name: 'Delete Pilot Add-on' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(/Retire it instead/)).toBeInTheDocument();
    expect(screen.getByText('Pilot Add-on')).toBeInTheDocument();
  });

  it('explains an empty catalogue', async () => {
    mockApi({}, []);
    renderPage();

    expect(await screen.findByText(/No products yet/)).toBeInTheDocument();
  });

  it('surfaces a failed load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server exploded' })))
    );
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/Server exploded|Could not load/);
  });
});
