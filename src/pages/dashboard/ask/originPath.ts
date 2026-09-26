import { organizationsPath } from '../../../features/organizations/askContext';
import type { DashboardOrigin, SurfaceOrigin } from '../../copilot/types';
import { toQuery } from '../shared/useDashboardFilters';

/** A dashboard view with its shared filters. A missing view lands on the
 *  area, which redirects to its first view. */
function dashboardPath(origin: DashboardOrigin): string {
  const path =
    origin.area === 'overview'
      ? '/dashboard/overview'
      : origin.view
        ? `/dashboard/${origin.area}/${origin.view}`
        : `/dashboard/${origin.area}`;
  const query = toQuery({ owner: origin.filters.owner, lifecycle: origin.filters.lifecycle, customer: origin.filters.customer });
  return query ? `${path}?${query}` : path;
}

/** The page a conversation started on, with its filters: a dashboard view,
 *  or the Organizations list or board. */
export function originPath(origin: SurfaceOrigin): string {
  return origin.surface === 'organizations' ? organizationsPath(origin) : dashboardPath(origin);
}
