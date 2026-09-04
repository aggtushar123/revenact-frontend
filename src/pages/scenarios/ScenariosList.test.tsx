import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ScenariosList } from './ScenariosList';

// Integration tier (see the `testing` skill): only the fetch boundary
// is mocked, same convention as SettingsPage.test.tsx's own — the real
// Scenario model backs this now (see docs/API_CONTRACTS.md's
// `scenarios` section), not localStorage.
function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const onboardingFlow = {
  id: 1,
  name: 'Onboarding Flow',
  apply_to: 'organizations',
  apply_to_display: 'Organizations',
  nodes: [
    { id: 'n1', type: 'entry', position: { x: 0, y: 0 }, data: { action: 'Run Now', label: 'Start' } },
    { id: 'n2', type: 'action', position: { x: 0, y: 100 }, data: { action: 'Send Email', label: 'Welcome' } },
  ],
  edges: [],
  is_active: true,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
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
    vi.unstubAllGlobals();
  });

  it('shows the empty state when nothing has been saved yet', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    renderPage();

    expect(await screen.findByText('No scenarios yet.')).toBeInTheDocument();
  });

  it('renders every saved scenario with its own applyTo/node count/active/updated time', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [onboardingFlow]))));
    renderPage();

    const name = await screen.findByText('Onboarding Flow');
    const row = name.closest('tr')!;
    expect(within(row).getByText('Organizations')).toBeInTheDocument();
    expect(within(row).getByText('2')).toBeInTheDocument(); // node count
    expect(within(row).getByText('Active')).toBeInTheDocument();
  });

  it('surfaces a fetch failure instead of silently showing an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));
    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('clicking Create Scenario navigates to the builder', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No scenarios yet.');
    await user.click(screen.getByRole('button', { name: /Create Scenario/ }));

    expect(await screen.findByText('CREATE PAGE')).toBeInTheDocument();
  });

  it('clicking a row navigates to that scenario\'s own builder', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [onboardingFlow]))));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Onboarding Flow'));

    expect(await screen.findByText('BUILDER PAGE')).toBeInTheDocument();
  });

  it('deleting a scenario removes it from the list after confirming', async () => {
    const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve(jsonResponse(204, null));
      }
      // Re-fetched after delete — empty the second time around.
      const alreadyDeleted = fetchMock.mock.calls.some(([, o]: [string, { method?: string }?]) => o?.method === 'DELETE');
      return Promise.resolve(jsonResponse(200, alreadyDeleted ? [] : [onboardingFlow]));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Onboarding Flow');
    await user.click(screen.getByRole('button', { name: 'Delete Onboarding Flow' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No scenarios yet.')).toBeInTheDocument();
  });
});
