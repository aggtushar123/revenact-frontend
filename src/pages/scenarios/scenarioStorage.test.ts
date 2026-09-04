import { describe, it, expect } from 'vitest';
import { deleteScenario, getScenario, listScenarios, upsertScenario } from './scenarioStorage';
import type { Scenario } from './types';

// Unit tier (see the `testing` skill): pure localStorage plumbing, no
// rendering — src/test/setup.ts clears localStorage after every test.

function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario_1',
    name: 'Onboarding Flow',
    applyTo: 'Organizations',
    nodes: [],
    edges: [],
    createdAt: '2026-08-31T00:00:00Z',
    updatedAt: '2026-08-31T00:00:00Z',
    ...overrides,
  };
}

describe('scenarioStorage', () => {
  it('returns an empty list when nothing has been saved yet', () => {
    expect(listScenarios()).toEqual([]);
  });

  it('upsertScenario inserts a new scenario and getScenario finds it by id', () => {
    const scenario = makeScenario();
    upsertScenario(scenario);

    expect(getScenario('scenario_1')).toEqual(scenario);
    expect(listScenarios()).toEqual([scenario]);
  });

  it('upsertScenario replaces an existing scenario with the same id, not duplicates it', () => {
    upsertScenario(makeScenario({ name: 'Original Name' }));
    upsertScenario(makeScenario({ name: 'Renamed', updatedAt: '2026-09-01T00:00:00Z' }));

    const all = listScenarios();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Renamed');
  });

  it('listScenarios sorts most recently updated first', () => {
    upsertScenario(makeScenario({ id: 'a', name: 'Older', updatedAt: '2026-08-01T00:00:00Z' }));
    upsertScenario(makeScenario({ id: 'b', name: 'Newer', updatedAt: '2026-09-01T00:00:00Z' }));

    const all = listScenarios();
    expect(all.map((s) => s.name)).toEqual(['Newer', 'Older']);
  });

  it('deleteScenario removes only the matching scenario', () => {
    upsertScenario(makeScenario({ id: 'a', name: 'Keep' }));
    upsertScenario(makeScenario({ id: 'b', name: 'Remove' }));

    deleteScenario('b');

    const all = listScenarios();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Keep');
  });

  it('getScenario returns undefined for an id that was never saved', () => {
    expect(getScenario('does-not-exist')).toBeUndefined();
  });

  it('tolerates malformed JSON already in localStorage rather than throwing', () => {
    localStorage.setItem('revenact.scenarios', 'not valid json{{{');

    expect(listScenarios()).toEqual([]);
    // Still writable afterwards -- a bad read doesn't wedge future saves.
    upsertScenario(makeScenario());
    expect(listScenarios()).toHaveLength(1);
  });
});
