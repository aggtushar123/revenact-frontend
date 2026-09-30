// Thin apiFetch wrappers over revenact-backend's Pipelines endpoints.
import { apiFetch } from '../../lib/apiClient';
import { downloadAttachment } from '../files/filesSlice';
import { localDay } from '../organizations/storyDays';
import type { BulkResult } from '../organizations/portfolioTypes';
import type { PipelineBulkRequest, PipelineKindKey, PipelinePage } from './pipelineTypes';

export const pipelinePath = (kind: PipelineKindKey) => `/pipelines/${kind}/`;

export function fetchPipeline(kind: PipelineKindKey, query: string): Promise<PipelinePage> {
  const path = pipelinePath(kind);
  return apiFetch<PipelinePage>(query ? `${path}?${query}` : path);
}

/** Every row of the query as CSV with every field, fetched with the
 *  session's token (the API never exposes a URL a plain link could open).
 *  Named for the viewer's own calendar day, not UTC's. */
export function exportPipeline(kind: PipelineKindKey, query: string, today: Date = new Date()): Promise<void> {
  const path = `${pipelinePath(kind)}export.csv`;
  return downloadAttachment({ download_url: query ? `${path}?${query}` : path, name: `${kind}-${localDay(today)}.csv` });
}

export function bulkUpdatePipeline(kind: PipelineKindKey, body: PipelineBulkRequest): Promise<BulkResult> {
  return apiFetch<BulkResult>(`${pipelinePath(kind)}bulk/`, { method: 'POST', body });
}
