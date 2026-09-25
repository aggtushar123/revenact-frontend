// Thin apiFetch wrappers over revenact-backend's portfolio endpoints (spec §2).
import { apiFetch } from '../../lib/apiClient';
import { downloadAttachment } from '../files/filesSlice';
import type { BulkRequest, BulkResult, PortfolioResponse } from './portfolioTypes';

export const PORTFOLIO_PATH = '/organizations/portfolio/';

export function fetchPortfolio(query: string): Promise<PortfolioResponse> {
  return apiFetch<PortfolioResponse>(query ? `${PORTFOLIO_PATH}?${query}` : PORTFOLIO_PATH);
}

/** Every row of the query as CSV with all 34 fields, fetched with the
 *  session's token (the API never exposes a URL a plain link could open). */
export function exportPortfolio(query: string, today: Date = new Date()): Promise<void> {
  const path = query ? `${PORTFOLIO_PATH}export.csv?${query}` : `${PORTFOLIO_PATH}export.csv`;
  return downloadAttachment({ download_url: path, name: `organizations-${today.toISOString().slice(0, 10)}.csv` });
}

export function bulkUpdate(body: BulkRequest): Promise<BulkResult> {
  return apiFetch<BulkResult>('/organizations/bulk/', { method: 'POST', body });
}
