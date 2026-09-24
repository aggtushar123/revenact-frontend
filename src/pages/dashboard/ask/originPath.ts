import type { DashboardOrigin } from '../../copilot/types';
import { toQuery } from '../shared/useDashboardFilters';

/** The dashboard URL a conversation started on: its area and view, with its
 *  shared filters. A missing view lands on the area, which redirects to its
 *  first view. */
export function originPath(origin: DashboardOrigin): string {
  const path =
    origin.area === 'overview'
      ? '/dashboard/overview'
      : origin.view
        ? `/dashboard/${origin.area}/${origin.view}`
        : `/dashboard/${origin.area}`;
  const query = toQuery({ owner: origin.filters.owner, lifecycle: origin.filters.lifecycle, customer: origin.filters.customer });
  return query ? `${path}?${query}` : path;
}
