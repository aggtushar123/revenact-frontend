import { contactsLabel, type ContactsNames } from '../../features/contacts/askContext';
import { organizationsLabel } from '../../features/organizations/askContext';
import { detailLabel, type DetailNames } from '../../features/organizations/detailAskContext';
import type { PortfolioResponse } from '../../features/organizations/portfolioTypes';
import type { ConversationSummary, SurfaceContext } from '../../pages/copilot/types';
import { contextLabel, viewLabel, type FilterNames } from './dashboardLabels';

/** What each surface names its filter values with: the dashboard views'
 *  filter options, the portfolio's `filters` options, the names the
 *  organisation page reports, and the names the Contacts page reports. */
export interface SurfaceNames {
  dashboard?: FilterNames;
  organizations?: PortfolioResponse['filters'] | null;
  detail?: DetailNames | null;
  contacts?: ContactsNames | null;
}

/** A question's chip, on whichever surface it was asked. */
export function surfaceLabel(context: SurfaceContext, names: SurfaceNames = {}): string {
  if (context.surface === 'contacts') return contactsLabel(context, names.contacts ?? null);
  if (context.surface === 'dashboard') return contextLabel(context, names.dashboard);
  if (context.view === 'detail') return detailLabel(context, names.detail ?? null);
  return organizationsLabel(context, names.organizations ?? null);
}

/** History's tag for a conversation: a dashboard one's area and view; an
 *  Organizations list or board one's is "Organizations" followed by the
 *  server's own `labels` (it knows the owner's name), joined with " · "; an
 *  organisation page's is the server's `label`, "Pizza Hut" or "Pizza Hut ·
 *  EMEA"; a Contacts one's is the server's own `label` too. Null for a
 *  conversation started anywhere else. */
export function originTag(summary: Pick<ConversationSummary, 'origin'>): string | null {
  const { origin } = summary;
  if (!origin) return null;
  if (origin.surface === 'dashboard') return viewLabel(origin.area, origin.view);
  if (origin.surface === 'contacts') return origin.label;
  if (origin.view === 'detail') return origin.label;
  return ['Organizations', ...origin.labels].join(' · ');
}
