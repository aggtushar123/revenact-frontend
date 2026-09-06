import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CustomObjectRecordsPage } from './CustomObjectRecordsPage';

// Integration tier (see the `testing` skill): no store needed — this
// page talks to apiFetch directly (see customObjectsApi.ts), same
// "self-contained feature fetches its own data" reasoning as
// CustomObjectsTab.test.tsx's own. Only the fetch boundary and router
// context are mocked/real.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const lineItemDefinition = {
  id: 4,
  name: 'Salesforce.com',
  api_name: 'salesforce_com',
  applies_to_customer: true,
  applies_to_account: true,
  fields: [
    { id: 9, name: 'Product', api_name: 'product', field_type: 'text', field_type_display: 'Text', is_required: true, picklist_options: [], order: 1, created_at: '2026-09-06T00:00:00Z' },
    { id: 10, name: 'Price', api_name: 'price', field_type: 'currency', field_type_display: 'Currency', is_required: false, picklist_options: [], order: 2, created_at: '2026-09-06T00:00:00Z' },
  ],
  records_count: 2,
  created_at: '2026-09-06T00:00:00Z',
};

function paginatedRecords(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/custom-objects/4']}>
      <Routes>
        <Route path="/custom-objects/:id" element={<CustomObjectRecordsPage />} />
        <Route path="/organizations/:id" element={<div>ORG DETAIL PAGE</div>} />
        <Route path="/accounts/:id" element={<div>ACCOUNT DETAIL PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CustomObjectRecordsPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders every real record across the org with its own parent name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/definitions/4/')) return Promise.resolve(jsonResponse(200, lineItemDefinition));
        if (url.includes('/records/')) {
          return Promise.resolve(
            jsonResponse(
              200,
              paginatedRecords([
                {
                  id: 1,
                  object_definition_id: 4,
                  customer_id: 6,
                  account_id: null,
                  parent_name: 'Apple Inc',
                  parent_type: 'customer',
                  data: { product: 'Seat License', price: 12000 },
                  created_at: '2026-09-06T00:00:00Z',
                  updated_at: '2026-09-06T00:00:00Z',
                },
                {
                  id: 2,
                  object_definition_id: 4,
                  customer_id: null,
                  account_id: 17,
                  parent_name: 'North America',
                  parent_type: 'account',
                  data: { product: 'Add-on', price: 4000 },
                  created_at: '2026-09-06T00:00:00Z',
                  updated_at: '2026-09-06T00:00:00Z',
                },
              ])
            )
          );
        }
        return Promise.resolve(jsonResponse(404, { detail: 'unhandled' }));
      })
    );

    renderPage();

    expect(await screen.findByRole('heading', { name: 'Salesforce.com' })).toBeInTheDocument();
    expect(await screen.findByText('Apple Inc')).toBeInTheDocument();
    expect(screen.getByText('North America')).toBeInTheDocument();
    expect(screen.getByText('Seat License')).toBeInTheDocument();
    expect(screen.getByText('Add-on')).toBeInTheDocument();
  });

  it('clicking a customer-parented row navigates to its real Organization page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/definitions/4/')) return Promise.resolve(jsonResponse(200, lineItemDefinition));
        if (url.includes('/records/')) {
          return Promise.resolve(
            jsonResponse(
              200,
              paginatedRecords([
                {
                  id: 1,
                  object_definition_id: 4,
                  customer_id: 6,
                  account_id: null,
                  parent_name: 'Apple Inc',
                  parent_type: 'customer',
                  data: { product: 'Seat License' },
                  created_at: '2026-09-06T00:00:00Z',
                  updated_at: '2026-09-06T00:00:00Z',
                },
              ])
            )
          );
        }
        return Promise.resolve(jsonResponse(404, { detail: 'unhandled' }));
      })
    );
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Apple Inc'));

    expect(await screen.findByText('ORG DETAIL PAGE')).toBeInTheDocument();
  });

  it('clicking an account-parented row navigates to its real Account page', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/definitions/4/')) return Promise.resolve(jsonResponse(200, lineItemDefinition));
        if (url.includes('/records/')) {
          return Promise.resolve(
            jsonResponse(
              200,
              paginatedRecords([
                {
                  id: 2,
                  object_definition_id: 4,
                  customer_id: null,
                  account_id: 17,
                  parent_name: 'North America',
                  parent_type: 'account',
                  data: { product: 'Add-on' },
                  created_at: '2026-09-06T00:00:00Z',
                  updated_at: '2026-09-06T00:00:00Z',
                },
              ])
            )
          );
        }
        return Promise.resolve(jsonResponse(404, { detail: 'unhandled' }));
      })
    );
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('North America'));

    expect(await screen.findByText('ACCOUNT DETAIL PAGE')).toBeInTheDocument();
  });

  it('shows an empty state when the object has no records yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/definitions/4/')) {
          return Promise.resolve(jsonResponse(200, { ...lineItemDefinition, records_count: 0 }));
        }
        if (url.includes('/records/')) return Promise.resolve(jsonResponse(200, paginatedRecords([])));
        return Promise.resolve(jsonResponse(404, { detail: 'unhandled' }));
      })
    );

    renderPage();

    expect(await screen.findByText('No records yet.')).toBeInTheDocument();
  });

  it('shows the real backend error instead of crashing on a bad id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(404, { detail: 'Not found.' })))
    );

    renderPage();

    expect(await screen.findByText('Not found.')).toBeInTheDocument();
  });
});
