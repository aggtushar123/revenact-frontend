// Thin wrappers over apiClient's apiFetch — same pattern as
// copilotApi.ts/campaignApi.ts's own.
import { apiFetch } from '../../lib/apiClient';
import type { CockpitSummary, CockpitTask } from './cockpitTypes';

export function fetchCockpitSummary(): Promise<CockpitSummary> {
  return apiFetch<CockpitSummary>('/cockpit/summary/');
}

// `?mine=true` — see TaskListView's own docstring: without it, this
// endpoint is a plain tenant-wide Task list; Cockpit's own "My Tasks"
// wants only the caller's own owned book of business.
export function fetchMyTasks(): Promise<CockpitTask[]> {
  return apiFetch<CockpitTask[]>('/tasks/?mine=true');
}
