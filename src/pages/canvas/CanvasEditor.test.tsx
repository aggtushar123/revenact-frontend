import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import authReducer from '../../features/auth/authSlice';
import { CanvasEditor } from './CanvasEditor';
import type { Canvas } from '../../features/customers/customersSlice';

// Integration tier (see the `testing` skill): real router context (the
// route param/query string decide whether this loads an existing
// canvas or starts a new one under a known parent), only the fetch
// boundary mocked — same convention as CreateScenario.test.tsx's own.
// React Flow needs a ResizeObserver polyfill in jsdom — see
// src/test/setup.ts's own stub. Adding a node via actual drag-and-drop
// and deleting one via its own rendered button are *not* unit-tested
// here, for the same jsdom/React-Flow-measurement-lifecycle reasons
// CreateScenario.test.tsx's own suite doesn't test those either.

const jamesContact = {
  id: 2,
  name: 'James Wilson',
  role: 'champion',
  role_display: 'Champion',
  email: 'james@apple.example',
  phone: '',
  status: 'active',
  sentiment: 'positive',
  last_contacted_at: null,
  companies: [{ id: 6, name: 'Apple Inc' }],
  account_name: null,
};

function canvasFixture(overrides: Partial<Canvas> = {}): Canvas {
  return {
    id: 3,
    name: 'Renewal Strategy Q3',
    nodes: [{ id: 'n1', type: 'contact', position: { x: 0, y: 0 }, data: { contact_id: 2 } }],
    edges: [],
    companies: [{ id: 6, name: 'Apple Inc' }],
    account_id: null,
    account_name: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

interface FetchOptions {
  method?: string;
  body?: string;
}

function contactsResponder(url: string) {
  if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, [jamesContact]));
  return null;
}

function renderNew(customerId: number, fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  render(
    <Provider store={configureStore({ reducer: { customers: customersReducer, auth: authReducer } })}>
      <MemoryRouter initialEntries={[`/canvas/create?customerId=${customerId}`]}>
        <Routes>
          <Route path="/canvas/create" element={<CanvasEditor />} />
          <Route path="/canvas/:id" element={<CanvasEditor />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function renderExisting(id: string, fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  render(
    <Provider store={configureStore({ reducer: { customers: customersReducer, auth: authReducer } })}>
      <MemoryRouter initialEntries={[`/canvas/${id}`]}>
        <Routes>
          <Route path="/canvas/:id" element={<CanvasEditor />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('CanvasEditor', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts blank with a default name for a new canvas under a known company', async () => {
    const fetchMock = vi.fn((url: string) => contactsResponder(url) ?? Promise.resolve(jsonResponse(200, [])));
    renderNew(6, fetchMock);

    expect(await screen.findByDisplayValue('Untitled Canvas')).toBeInTheDocument();
  });

  it('shows an error instead of a blank canvas when no company was chosen', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    render(
      <Provider store={configureStore({ reducer: { customers: customersReducer, auth: authReducer } })}>
        <MemoryRouter initialEntries={['/canvas/create']}>
          <Routes>
            <Route path="/canvas/create" element={<CanvasEditor />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(
      await screen.findByText('No company was chosen for this canvas — go back and pick one.')
    ).toBeInTheDocument();
  });

  it('Save POSTs a new canvas and swaps the URL to its own id', async () => {
    const created = canvasFixture({ id: 9, name: 'My New Canvas' });
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      const contacts = contactsResponder(url);
      if (contacts) return contacts;
      if (options?.method === 'POST') return Promise.resolve(jsonResponse(201, created));
      return Promise.resolve(jsonResponse(200, created));
    });
    const user = userEvent.setup();
    renderNew(6, fetchMock);

    const nameInput = await screen.findByLabelText('Canvas name');
    await user.clear(nameInput);
    await user.type(nameInput, 'My New Canvas');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const postCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall![1]!.body!);
    expect(body.name).toBe('My New Canvas');
    expect(body.customer_id).toBe(6);
  });

  it('loading an existing canvas populates its own saved name/nodes', async () => {
    const existing = canvasFixture();
    const fetchMock = vi.fn((url: string) => contactsResponder(url) ?? Promise.resolve(jsonResponse(200, existing)));
    renderExisting('3', fetchMock);

    expect(await screen.findByDisplayValue('Renewal Strategy Q3')).toBeInTheDocument();
    expect(await screen.findByText('James Wilson')).toBeInTheDocument();
  });

  it('saving an existing canvas PATCHes its own id, not a new one', async () => {
    const existing = canvasFixture();
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      const contacts = contactsResponder(url);
      if (contacts) return contacts;
      if (options?.method === 'PATCH') return Promise.resolve(jsonResponse(200, existing));
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Strategy Q3');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const patchCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
    expect(patchCall![0]).toContain('/canvases/3/');
    // The loaded node survives the round-trip untouched.
    const patchedBody = JSON.parse(patchCall![1]!.body!);
    expect(patchedBody.nodes).toEqual(existing.nodes);
  });
});
