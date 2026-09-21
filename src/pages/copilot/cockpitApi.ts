// Thin wrappers over apiClient's apiFetch — same pattern as
// copilotApi.ts/campaignApi.ts's own.
import { apiFetch } from '../../lib/apiClient';
import type { CockpitSummary, CockpitTask } from './cockpitTypes';

// `days` controls the Renewals window (backend defaults to 30 — see
// CockpitSummaryView's own `?days=` docstring) — Renewals' own "Next
// N Days" dropdown passes this for real now.
export function fetchCockpitSummary(days?: number): Promise<CockpitSummary> {
  return apiFetch<CockpitSummary>(`/cockpit/summary/${days ? `?days=${days}` : ''}`);
}

// `?mine=true` — see TaskListView's own docstring: without it, this
// endpoint is a plain tenant-wide Task list; Cockpit's own "My Tasks"
// wants only the caller's own owned book of business.
export function fetchMyTasks(): Promise<CockpitTask[]> {
  return apiFetch<CockpitTask[]>('/tasks/?mine=true');
}

// Cockpit's tick-off: the one write on a Task outside its parent's own tab.
// PATCH /api/v1/tasks/<id>/ accepts `status` only and answers the list shape.
export function updateTaskStatus(id: number, status: CockpitTask['status']): Promise<CockpitTask> {
  return apiFetch<CockpitTask>(`/tasks/${id}/`, { method: 'PATCH', body: { status } });
}
