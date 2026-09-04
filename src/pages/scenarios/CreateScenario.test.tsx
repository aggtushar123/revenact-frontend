import { act } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CreateScenario } from './CreateScenario';
import { getScenario, listScenarios, upsertScenario } from './scenarioStorage';
import type { Scenario } from './types';

// Integration tier (see the `testing` skill): real router context (the
// route param decides whether this loads an existing scenario), real
// localStorage (cleared after every test by src/test/setup.ts) — no
// backend to mock at all (see scenarioStorage.ts's own docstring).
// ReactFlow needs a ResizeObserver polyfill in jsdom — see
// src/test/setup.ts's own stub.

function renderNew() {
  render(
    <MemoryRouter initialEntries={['/scenarios/create']}>
      <Routes>
        <Route path="/scenarios/create" element={<CreateScenario />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderExisting(id: string) {
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
    localStorage.clear();
  });

  it('starts blank with a default name/applyTo for a new scenario', async () => {
    renderNew();

    expect(await screen.findByDisplayValue('Untitled Scenario')).toBeInTheDocument();
    expect(screen.getByLabelText('Organizations')).toBeChecked();
  });

  it('Save persists a new scenario to storage under its own name/applyTo', async () => {
    const user = userEvent.setup();
    renderNew();

    const nameInput = await screen.findByLabelText('Scenario name');
    await user.clear(nameInput);
    await user.type(nameInput, 'My New Flow');
    await user.click(screen.getByLabelText('Accounts'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const saved = listScenarios();
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('My New Flow');
    expect(saved[0].applyTo).toBe('Accounts');
  });

  it('loading an existing scenario populates its own saved name/applyTo', async () => {
    upsertScenario({
      id: 'scenario_2',
      name: 'Existing Flow',
      applyTo: 'Contacts',
      nodes: [],
      edges: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    renderExisting('scenario_2');

    expect(await screen.findByDisplayValue('Existing Flow')).toBeInTheDocument();
    expect(screen.getByLabelText('Contacts')).toBeChecked();
  });

  it('saving an existing scenario keeps its own id, not a duplicate', async () => {
    upsertScenario({
      id: 'scenario_3',
      name: 'Renewal Flow',
      applyTo: 'Organizations',
      nodes: [],
      edges: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });
    const user = userEvent.setup();
    renderExisting('scenario_3');
    await screen.findByDisplayValue('Renewal Flow');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(listScenarios()).toHaveLength(1);
    expect(getScenario('scenario_3')?.name).toBe('Renewal Flow');
  });

  it("editing a node's label round-trips through Save & Close, then persists on the next scenario Save", async () => {
    const scenario: Scenario = {
      id: 'scenario_4',
      name: 'Email Flow',
      applyTo: 'Organizations',
      nodes: [
        { id: 'node_1', type: 'action', position: { x: 0, y: 0 }, data: { action: 'Send Email', label: 'Old Label' } },
      ],
      edges: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    };
    upsertScenario(scenario);
    const user = userEvent.setup();
    renderExisting('scenario_4');
    await screen.findByRole('button', { name: 'Save' });

    // Same custom event CustomNodes.tsx's own Edit button dispatches on
    // click — triggered directly rather than through React Flow's own
    // rendered node, whose measurement lifecycle (ResizeObserver, only
    // stubbed as a no-op in jsdom — see src/test/setup.ts) makes its
    // own DOM unreliable to depend on in a test.
    act(() => {
      window.dispatchEvent(
        new CustomEvent('edit-node', {
          detail: { id: 'node_1', data: scenario.nodes[0].data, type: 'action' },
        })
      );
    });

    const dialog = await screen.findByRole('dialog');
    const labelInput = within(dialog).getByLabelText('Node Label');
    expect(labelInput).toHaveValue('Old Label');
    await user.clear(labelInput);
    await user.type(labelInput, 'New Label');
    await user.click(within(dialog).getByRole('button', { name: 'Save & Close' }));

    // Not yet written back to storage until the scenario itself is saved.
    expect(getScenario('scenario_4')?.nodes[0].data.label).toBe('Old Label');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(getScenario('scenario_4')?.nodes[0].data.label).toBe('New Label');
  });
});
