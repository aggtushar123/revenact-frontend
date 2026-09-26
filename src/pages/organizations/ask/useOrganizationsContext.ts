import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { usePortfolioParams } from '../../../components/organizations/portfolio/usePortfolioParams';
import { defaultGroupOf, toContextFilters } from '../../../features/organizations/askContext';
import { boardParams } from '../../../features/organizations/portfolioParams';
import type { OrganizationsContext, OrganizationsView } from '../../copilot/types';

/** Which Organizations page a URL shows, or null for any other. */
export function parseOrganizationsView(pathname: string): OrganizationsView | null {
  if (pathname === '/organizations/list') return 'list';
  if (pathname === '/organizations/board') return 'board';
  return null;
}

/** Where the person is on Organizations, as the server needs it (spec §3):
 *  the view, and the portfolio's params as that page reads them (the
 *  Board's with its lifecycle default, never ungrouped). Never figures: the
 *  server recomputes the list. Null off the two routes. */
export function useOrganizationsContext(): OrganizationsContext | null {
  const { pathname } = useLocation();
  const view = parseOrganizationsView(pathname);
  const { params } = usePortfolioParams(defaultGroupOf(view ?? 'list'));
  return useMemo(() => {
    if (!view) return null;
    const shown = view === 'board' ? boardParams(params) : params;
    return { surface: 'organizations', view, filters: toContextFilters(shown, view), focus: null };
  }, [view, params]);
}
