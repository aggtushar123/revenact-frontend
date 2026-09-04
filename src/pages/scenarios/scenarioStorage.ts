import type { Scenario } from './types';

// Scenarios have no backend at all — no Scenario model, no automation
// engine, nothing in revenact-backend (a Scenario here is a fully
// client-side concept: a saved node graph). Persisted in localStorage
// instead, same "per-viewer convenience, not a real data store" caveat
// as any other browser-storage use in this codebase — it survives a
// refresh/reopen in this browser, but never syncs across devices, or
// to anyone else. Every read/write is wrapped in try/catch since
// localStorage can throw (private browsing, storage disabled, quota
// exceeded) — a scenario failing to load/save shouldn't crash the page.

const STORAGE_KEY = 'revenact.scenarios';

function readAll(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Scenario[]) : [];
  } catch {
    return [];
  }
}

function writeAll(scenarios: Scenario[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  } catch {
    // Storage full/unavailable — nothing more to do client-side.
  }
}

/** Every saved scenario, most recently updated first. */
export function listScenarios(): Scenario[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getScenario(id: string): Scenario | undefined {
  return readAll().find((s) => s.id === id);
}

/** Inserts or fully replaces the scenario with this id. */
export function upsertScenario(scenario: Scenario): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === scenario.id);
  if (idx === -1) {
    all.push(scenario);
  } else {
    all[idx] = scenario;
  }
  writeAll(all);
}

export function deleteScenario(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
