import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomObjectsTab } from './CustomObjectsTab';

// Integration tier (see the `testing` skill): no store needed — this
// component talks to apiFetch directly (see customObjectsApi.ts), same
// "self-contained feature fetches its own data" reasoning as
// CockpitView.tsx's own tests. Only the fetch boundary is mocked.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function lineItemDefinition(overrides: Record<string, unknown> = {}) {
  return {
    id: 4,
    name: 'Opportunity Line Item',
    api_name: 'opportunity_line_item',
    applies_to_customer: false,
    applies_to_account: true,
    fields: [
      {
        id: 9,
        name: 'Product',
        api_name: 'product',
        field_type: 'text',
        field_type_display: 'Text',
        is_required: true,
        picklist_options: [],
        order: 1,
        created_at: '2026-09-06T00:00:00Z',
      },
      {
        id: 10,
        name: 'Quantity',
        api_name: 'qty',
        field_type: 'number',
        field_type_display: 'Number',
        is_required: false,
        picklist_options: [],
        order: 2,
        created_at: '2026-09-06T00:00:00Z',
      },
    ],
    records_count: 1,
    created_at: '2026-09-06T00:00:00Z',
    ...overrides,
  };
}

function lineItemRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 21,
    object_definition_id: 4,
    customer_id: null,
    account_id: 17,
    data: { product: 'Seat License', qty: 50 },
    created_at: '2026-09-06T00:00:00Z',
    updated_at: '2026-09-06T00:00:00Z',
    ...overrides,
  };
}

function stubFetch(
  handler: (url: string, options?: RequestInit) => ReturnType<typeof jsonResponse> | undefined
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      const response = handler(url, options);
      return Promise.resolve(response ?? jsonResponse(404, { detail: 'unhandled in test' }));
    })
  );
}

describe('CustomObjectsTab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows an empty state when the org has defined no applicable objects', async () => {
    stubFetch((url) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, []);
      return undefined;
    });

    render(<CustomObjectsTab accountId={17} />);

    expect(await screen.findByText('No custom objects yet')).toBeInTheDocument();
  });

  it('only shows definitions that apply to the given parent type', async () => {
    stubFetch((url) => {
      if (url.includes('/custom-objects/definitions/')) {
        return jsonResponse(200, [
          lineItemDefinition(), // applies_to_account only
          { ...lineItemDefinition({ id: 5, name: 'Renewal Note', applies_to_customer: true, applies_to_account: false, fields: [], records_count: 0 }) },
        ]);
      }
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, []);
      return undefined;
    });

    render(<CustomObjectsTab accountId={17} />);

    expect(await screen.findByText('Opportunity Line Item')).toBeInTheDocument();
    expect(screen.queryByText('Renewal Note')).not.toBeInTheDocument();
  });

  it('renders real records in a table with columns for each real field', async () => {
    stubFetch((url) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, [lineItemDefinition()]);
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, [lineItemRecord()]);
      return undefined;
    });

    render(<CustomObjectsTab accountId={17} />);

    expect(await screen.findByText('Seat License')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
  });

  it('reports the real total record count once loaded', async () => {
    stubFetch((url) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, [lineItemDefinition()]);
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, [lineItemRecord(), lineItemRecord({ id: 22 })]);
      return undefined;
    });
    const onCountChange = vi.fn();

    render(<CustomObjectsTab accountId={17} onCountChange={onCountChange} />);
    await screen.findAllByText('Seat License');

    expect(onCountChange).toHaveBeenCalledWith(2);
  });

  it('adding a row posts real data and shows the new record', async () => {
    stubFetch((url, options) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, [lineItemDefinition({ records_count: 0 })]);
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body as string);
        return jsonResponse(201, lineItemRecord({ id: 30, data: body.data }));
      }
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, []);
      return undefined;
    });
    const user = userEvent.setup();

    render(<CustomObjectsTab accountId={17} />);
    await screen.findByText('Opportunity Line Item');

    await user.click(screen.getByRole('button', { name: /Add row/ }));
    await user.type(screen.getByLabelText('Product'), 'Enterprise Plan');
    await user.type(screen.getByLabelText('Quantity'), '10');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Enterprise Plan')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('a failed add shows the real backend error instead of silently closing', async () => {
    stubFetch((url, options) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, [lineItemDefinition({ records_count: 0 })]);
      if (options?.method === 'POST') return jsonResponse(400, { data: ['Product is required.'] });
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, []);
      return undefined;
    });
    const user = userEvent.setup();

    render(<CustomObjectsTab accountId={17} />);
    await screen.findByText('Opportunity Line Item');
    await user.click(screen.getByRole('button', { name: /Add row/ }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Product is required.')).toBeInTheDocument();
  });

  it('editing a record saves real changes', async () => {
    stubFetch((url, options) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, [lineItemDefinition()]);
      if (options?.method === 'PATCH') {
        const body = JSON.parse(options.body as string);
        return jsonResponse(200, lineItemRecord({ data: body.data }));
      }
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, [lineItemRecord()]);
      return undefined;
    });
    const user = userEvent.setup();

    render(<CustomObjectsTab accountId={17} />);
    await screen.findByText('Seat License');

    await user.click(screen.getByRole('button', { name: 'Edit record' }));
    const productInput = screen.getByLabelText('Product');
    await user.clear(productInput);
    await user.type(productInput, 'Seat License Renewed');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Seat License Renewed')).toBeInTheDocument();
  });

  it('deleting a record removes it after confirming', async () => {
    stubFetch((url, options) => {
      if (url.includes('/custom-objects/definitions/')) return jsonResponse(200, [lineItemDefinition()]);
      if (options?.method === 'DELETE') return jsonResponse(204, null);
      if (url.includes('/custom-objects/records/')) return jsonResponse(200, [lineItemRecord()]);
      return undefined;
    });
    const user = userEvent.setup();

    render(<CustomObjectsTab accountId={17} />);
    await screen.findByText('Seat License');

    await user.click(screen.getByRole('button', { name: 'Delete record' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('Seat License')).not.toBeInTheDocument();
  });
});
