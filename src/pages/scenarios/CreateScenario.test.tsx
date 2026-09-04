import { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CreateScenario } from './CreateScenario';
import type { Scenario } from './types';

// Integration tier (see the `testing` skill): real router context (the
// route param decides whether this loads an existing scenario), only
// the fetch boundary mocked — same convention as SettingsPage.test.tsx's
// own, now that a real Scenario model backs this (see
// docs/API_CONTRACTS.md's `scenarios` section) instead of localStorage.
// ReactFlow needs a ResizeObserver polyfill in jsdom — see
// src/test/setup.ts's own stub.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

interface FetchOptions {
  method?: string;
  body?: string;
}

function scenarioFixture(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 3,
    name: 'Renewal Flow',
    apply_to: 'organizations',
    apply_to_display: 'Organizations',
    nodes: [],
    edges: [],
    is_active: false,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

function renderNew(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  render(
    <MemoryRouter initialEntries={['/scenarios/create']}>
      <Routes>
        <Route path="/scenarios/create" element={<CreateScenario />} />
        <Route path="/scenarios/:id" element={<CreateScenario />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderExisting(id: string, fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  render(
    <MemoryRouter initialEntries={[`/scenarios/${id}`]}>
      <Routes>
        <Route path="/scenarios/:id" element={<CreateScenario />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CreateScenario builder', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts blank with a default name/applyTo for a new scenario', async () => {
    renderNew(vi.fn());

    expect(await screen.findByDisplayValue('Untitled Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Organizations')).toBeChecked();
  });

  it('Save POSTs a new scenario and swaps the URL to its own id', async () => {
    const created = scenarioFixture({ id: 7, name: 'My New Flow', apply_to: 'accounts' });
    const fetchMock = vi.fn((_url: string, options?: FetchOptions) => {
      if (options?.method === 'POST') return Promise.resolve(jsonResponse(201, created));
      return Promise.resolve(jsonResponse(200, created));
    });
    const user = userEvent.setup();
    renderNew(fetchMock);

    const nameInput = await screen.findByLabelText('Scenario name');
    await user.clear(nameInput);
    await user.type(nameInput, 'My New Flow');
    await user.click(screen.getByLabelText('Accounts'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const postCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall![1]!.body!);
    expect(body.name).toBe('My New Flow');
    expect(body.apply_to).toBe('accounts');
    // Run Now stays disabled once apply_to isn't organizations.
    expect(await screen.findByRole('button', { name: /Run Now/ })).toBeDisabled();
  });

  it('loading an existing scenario populates its own saved name/applyTo/active state', async () => {
    const existing = scenarioFixture({ apply_to: 'contacts', is_active: true });
    renderExisting('3', vi.fn(() => Promise.resolve(jsonResponse(200, existing))));

    expect(await screen.findByDisplayValue('Renewal Flow')).toBeInTheDocument();
    expect(screen.getByLabelText('Contacts')).toBeChecked();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('saving an existing scenario PATCHes its own id, not a new one', async () => {
    const existing = scenarioFixture();
    const fetchMock = vi.fn((_url: string, options?: FetchOptions) => {
      if (options?.method === 'PATCH') return Promise.resolve(jsonResponse(200, existing));
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Flow');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const patchCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
    expect(patchCall![0]).toContain('/scenarios/3/');
  });

  it("editing a node's label round-trips through Save & Close, then persists on the next scenario Save", async () => {
    const existing = scenarioFixture({
      nodes: [
        { id: 'node_1', type: 'action', position: { x: 0, y: 0 }, data: { action: 'Send Email', label: 'Old Label' } },
      ],
    });
    let patchedBody: { nodes: { data: { label: string } }[] } | null = null;
    const fetchMock = vi.fn((_url: string, options?: FetchOptions) => {
      if (options?.method === 'PATCH') {
        patchedBody = JSON.parse(options.body!);
        return Promise.resolve(jsonResponse(200, { ...existing, ...patchedBody }));
      }
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByRole('button', { name: 'Save' });

    // Same custom event CustomNodes.tsx's own Edit button dispatches on
    // click — triggered directly rather than through React Flow's own
    // rendered node, whose measurement lifecycle (ResizeObserver, only
    // stubbed as a no-op in jsdom — see src/test/setup.ts) makes its
    // own DOM unreliable to depend on in a test.
    act(() => {
      window.dispatchEvent(
        new CustomEvent('edit-node', {
          detail: { id: 'node_1', data: existing.nodes[0].data, type: 'action' },
        })
      );
    });

    const dialog = await screen.findByRole('dialog');
    const labelInput = within(dialog).getByLabelText('Node Label');
    expect(labelInput).toHaveValue('Old Label');
    await user.clear(labelInput);
    await user.type(labelInput, 'New Label');
    await user.click(within(dialog).getByRole('button', { name: 'Save & Close' }));

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(patchedBody).not.toBeNull();
    expect(patchedBody!.nodes[0].data.label).toBe('New Label');
  });

  it('Run Now is disabled until the scenario has a real id', async () => {
    renderNew(vi.fn());
    expect(await screen.findByRole('button', { name: /Run Now/ })).toBeDisabled();
  });

  it('Run Now opens the modal and runs against a selected organization once saved', async () => {
    const existing = scenarioFixture();
    const run = {
      id: 10,
      scenario: 3,
      customer: { id: 9, name: 'Globex' },
      triggered_by: 'manual',
      status: 'success',
      log: [{ node_id: 'n1', action: 'Send Email', status: 'ok', detail: 'Emailed ops@globex.io: "Hi"' }],
      started_at: '2026-09-04T00:00:00Z',
      finished_at: '2026-09-04T00:00:01Z',
    };
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.endsWith('/customers/')) {
        return Promise.resolve(jsonResponse(200, { count: 1, next: null, previous: null, results: [{ id: 9, name: 'Globex' }] }));
      }
      if (url.includes('/run/') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse(201, run));
      }
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Flow');

    await user.click(screen.getByRole('button', { name: /Run Now/ }));
    await user.selectOptions(await screen.findByLabelText('Organization'), '9');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByText('Run completed.')).toBeInTheDocument();
    expect(screen.getByText(/Emailed ops@globex.io/)).toBeInTheDocument();
  });
});
