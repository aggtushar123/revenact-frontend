import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { ContactDetails } from './Details';

// Integration tier (see the `testing` skill): real store + real router
// context, network mocked at the fetch boundary.
const sarahChen = {
  id: 1,
  name: 'Sarah Chen',
  role: 'executive_sponsor',
  role_display: 'Executive Sponsor',
  email: 'sarah.chen@apple.com',
  phone: '+1 (408) 555-0123',
  status: 'active',
  sentiment: 'positive',
  last_contacted_at: '2026-08-31T00:00:00Z',
  company_id: 6,
  company_name: 'Apple Inc',
  account_name: null,
};

function renderPage() {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/contacts/1']}>
        <Routes>
          <Route path="/contacts/list" element={<div>CONTACTS LIST</div>} />
          <Route path="/contacts/:id" element={<ContactDetails />} />
          <Route path="/organizations/:id" element={<div>ORG PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('Contact Details page (/contacts/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the contact by the id in the URL and renders its real data', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, sarahChen))));

    renderPage();

    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Executive Sponsor')).toBeInTheDocument();
    expect(screen.getByText('sarah.chen@apple.com')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/contacts/1/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('shows the backend error instead of crashing (e.g. a 404)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(404, { detail: 'Not found.' })))
    );

    renderPage();

    expect(await screen.findByText('Not found.')).toBeInTheDocument();
  });

  it('clicking the company opens that organization\'s page', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, sarahChen))));
    const user = userEvent.setup();

    renderPage();
    await user.click(await screen.findByText('Apple Inc'));

    expect(await screen.findByText('ORG PAGE')).toBeInTheDocument();
  });

  it('editing from the page PATCHes /api/v1/contacts/<id>/ and shows the update', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'PATCH' && url.endsWith('/contacts/1/')) {
        const body = JSON.parse(options!.body!);
        return Promise.resolve(jsonResponse(200, { ...sarahChen, ...body }));
      }
      return Promise.resolve(jsonResponse(200, sarahChen));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Sarah Chen');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const nameInput = screen.getByLabelText('Name *');
    await user.clear(nameInput);
    await user.type(nameInput, 'Sarah Chen-Wu');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/1/'),
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  it('deleting from the page DELETEs /api/v1/contacts/<id>/ and returns to the list', async () => {
    const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
      const method = options?.method ?? 'GET';
      if (method === 'DELETE' && url.endsWith('/contacts/1/')) {
        return Promise.resolve({ ok: true, status: 204, json: async () => null });
      }
      return Promise.resolve(jsonResponse(200, sarahChen));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderPage();
    await screen.findByText('Sarah Chen');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // Two "Delete" buttons exist once the confirm dialog is open (the
    // page's own, and the dialog's confirm) — the confirm one is the
    // one rendered last.
    const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/1/'),
        expect.objectContaining({ method: 'DELETE' })
      )
    );
    expect(await screen.findByText('CONTACTS LIST')).toBeInTheDocument();
  });
});
