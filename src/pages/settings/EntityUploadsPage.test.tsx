import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { EntityUploadsPage } from './EntityUploadsPage';

// Integration tier (see the `testing` skill): no new backend endpoint —
// each mapped row POSTs to the real /customers/ endpoint via the same
// createCustomer thunk OrganizationFormModal's own "Add Organization"
// uses, so only the fetch boundary needs mocking (same convention as
// List.test.tsx's own Add/Edit tests).

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function csvFile(contents: string, name = 'orgs.csv') {
  return new File([contents], name, { type: 'text/csv' });
}

function renderPage() {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <EntityUploadsPage />
    </Provider>
  );
}

describe('EntityUploadsPage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a CSV, auto-maps recognizable columns, and shows a preview', async () => {
    const user = userEvent.setup();
    renderPage();

    const file = csvFile('Name,Domain\nGlobex,globex.com\nInitech,initech.com');
    await user.upload(screen.getByLabelText(/Click to choose a CSV file/), file);

    expect(await screen.findByText('orgs.csv — 2 rows')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
    expect(screen.getByText('globex.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import 2 Organizations' })).toBeEnabled();
  });

  it('disables Import until a column is mapped to Name', async () => {
    const user = userEvent.setup();
    renderPage();

    // No header looks like "name" at all, so every column auto-maps to skip.
    const file = csvFile('Website,City\nglobex.com,Chicago');
    await user.upload(screen.getByLabelText(/Click to choose a CSV file/), file);

    await screen.findByText(/1 row/);
    expect(screen.getByText('Map a column to "Name" to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import 1 Organization/ })).toBeDisabled();
  });

  it('imports each row as a real POST /customers/, reporting per-row success', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(201, { id: 1, name: 'Globex' }))) as ReturnType<
      typeof vi.fn<(url: string, options?: { method?: string; body?: string }) => Promise<ReturnType<typeof jsonResponse>>>
    >;
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    const file = csvFile('Name\nGlobex\nInitech');
    await user.upload(screen.getByLabelText(/Click to choose a CSV file/), file);
    await screen.findByText('orgs.csv — 2 rows');

    await user.click(screen.getByRole('button', { name: 'Import 2 Organizations' }));

    expect(await screen.findByText('2 created')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(options.body)).toEqual({ name: 'Globex' });
  });

  it("a row that fails doesn't block the others, and is reported with the server's own error", async () => {
    const fetchMock = vi.fn((_url: string, options?: { body?: string }) => {
      const body = options?.body ? JSON.parse(options.body) : {};
      if (body.name === 'Bad Co') {
        return Promise.resolve(jsonResponse(400, { name: ['A customer with this name already exists.'] }));
      }
      return Promise.resolve(jsonResponse(201, { id: 1, name: body.name }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    const file = csvFile('Name\nGood Co\nBad Co');
    await user.upload(screen.getByLabelText(/Click to choose a CSV file/), file);
    await screen.findByText('orgs.csv — 2 rows');
    await user.click(screen.getByRole('button', { name: 'Import 2 Organizations' }));

    expect(await screen.findByText('1 created')).toBeInTheDocument();
    expect(screen.getByText('1 failed')).toBeInTheDocument();
    const badRow = screen.getByText('Bad Co').closest('tr')!;
    expect(within(badRow).getByText('A customer with this name already exists.')).toBeInTheDocument();
  });

  it('a blank name in a row is reported without calling the API for that row', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(201, { id: 1, name: 'Globex' })));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    const file = csvFile('Name\nGlobex\n');
    await user.upload(screen.getByLabelText(/Click to choose a CSV file/), file);
    await screen.findByText(/1 row/);

    await user.click(screen.getByRole('button', { name: /Import 1 Organization/ }));

    expect(await screen.findByText('1 created')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a file with no data rows', async () => {
    const user = userEvent.setup();
    renderPage();

    const file = csvFile('Name,Domain');
    await user.upload(screen.getByLabelText(/Click to choose a CSV file/), file);

    expect(await screen.findByText(/only has a header row/)).toBeInTheDocument();
  });
});
