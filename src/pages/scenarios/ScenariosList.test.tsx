import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ScenariosList } from './ScenariosList';
import { upsertScenario } from './scenarioStorage';
import type { Scenario } from './types';

// Integration tier (see the `testing` skill): real router context (rows
// navigate on click), real localStorage (cleared after every test by
// src/test/setup.ts) — no fetch mocking needed at all, since Scenarios
// have no backend (see scenarioStorage.ts's own docstring).

const onboardingFlow: Scenario = {
  id: 'scenario_1',
  name: 'Onboarding Flow',
  applyTo: 'Organizations',
  nodes: [
    { id: 'n1', type: 'entry', position: { x: 0, y: 0 }, data: { action: 'Run Now', label: 'Start' } },
    { id: 'n2', type: 'action', position: { x: 0, y: 100 }, data: { action: 'Send Email', label: 'Welcome' } },
  ],
  edges: [],
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-31T00:00:00Z',
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/scenarios']}>
      <Routes>
        <Route path="/scenarios" element={<ScenariosList />} />
        <Route path="/scenarios/create" element={<div>CREATE PAGE</div>} />
        <Route path="/scenarios/:id" element={<div>BUILDER PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ScenariosList page (/scenarios)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the empty state when nothing has been saved yet', () => {
    renderPage();

    expect(screen.getByText('No scenarios yet.')).toBeInTheDocument();
  });

  it('renders every saved scenario with its own applyTo/node count/updated time', async () => {
    upsertScenario(onboardingFlow);
    renderPage();

    expect(await screen.findByText('Onboarding Flow')).toBeInTheDocument();
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // node count
  });

  it('clicking Create Scenario navigates to the builder', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Create Scenario/ }));

    expect(await screen.findByText('CREATE PAGE')).toBeInTheDocument();
  });

  it('clicking a row navigates to that scenario\'s own builder', async () => {
    upsertScenario(onboardingFlow);
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Onboarding Flow'));

    expect(await screen.findByText('BUILDER PAGE')).toBeInTheDocument();
  });

  it('deleting a scenario removes it from the list after confirming', async () => {
    upsertScenario(onboardingFlow);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Onboarding Flow');
    await user.click(screen.getByRole('button', { name: 'Delete Onboarding Flow' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No scenarios yet.')).toBeInTheDocument();
  });
});
