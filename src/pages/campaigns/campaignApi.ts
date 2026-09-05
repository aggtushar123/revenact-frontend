// Thin wrappers over apiClient's apiFetch — same pattern as
// scenarios/scenarioApi.ts's own, for the same reason: Campaign is
// organisation-flat like Scenario, not Customer/Account-scoped like
// Canvas/Survey, so it lives here rather than as thunks in
// features/customers/customersSlice.ts.
import { apiFetch } from '../../lib/apiClient';
import type { Campaign, CampaignWritePayload } from './types';

// Pagination is off on this endpoint (see CampaignListCreateView's own
// docstring) — a plain array, not fetchAllPages's {count,next,...} shape.
export function fetchCampaigns(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>('/campaigns/');
}

export function fetchCampaign(id: number | string): Promise<Campaign> {
  return apiFetch<Campaign>(`/campaigns/${id}/`);
}

export function createCampaign(payload: CampaignWritePayload): Promise<Campaign> {
  return apiFetch<Campaign>('/campaigns/', { method: 'POST', body: payload });
}

export function updateCampaign(id: number, payload: Partial<CampaignWritePayload>): Promise<Campaign> {
  return apiFetch<Campaign>(`/campaigns/${id}/`, { method: 'PATCH', body: payload });
}

export function deleteCampaign(id: number): Promise<null> {
  return apiFetch<null>(`/campaigns/${id}/`, { method: 'DELETE' });
}

export function sendCampaign(id: number): Promise<Campaign> {
  return apiFetch<Campaign>(`/campaigns/${id}/send/`, { method: 'POST' });
}
