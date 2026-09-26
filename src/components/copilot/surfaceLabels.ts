import { organizationsLabel } from '../../features/organizations/askContext';
import type { PortfolioResponse } from '../../features/organizations/portfolioTypes';
import type { ConversationSummary, SurfaceContext } from '../../pages/copilot/types';
import { contextLabel, viewLabel, type FilterNames } from './dashboardLabels';

/** What each surface names its filter values with: the dashboard views'
 *  filter options, and the portfolio's `filters` options. */
export interface SurfaceNames {
  dashboard?: FilterNames;
  organizations?: PortfolioResponse['filters'] | null;
}

/** A question's chip, on whichever surface it was asked. */
export function surfaceLabel(context: SurfaceContext, names: SurfaceNames = {}): string {
  return context.surface === 'organizations'
    ? organizationsLabel(context, names.organizations ?? null)
    : contextLabel(context, names.dashboard);
}

/** History's tag for a conversation: a dashboard one's area and view; an
 *  Organizations one's is "Organizations" followed by the server's own
 *  `labels` (it knows the owner's name), joined with " · ". Null for a
 *  conversation started anywhere else. */
export function originTag(summary: Pick<ConversationSummary, 'origin'>): string | null {
  const { origin } = summary;
  if (!origin) return null;
  if (origin.surface === 'organizations') return ['Organizations', ...origin.labels].join(' · ');
  return viewLabel(origin.area, origin.view);
}
