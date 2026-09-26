import { focusLabel } from '../../components/copilot/dashboardLabels';
import type { OrganizationsFilters, OrganizationsFocus, OrganizationsOrigin, OrganizationsView } from '../../pages/copilot/types';
import { filterChips } from './filterChips';
import { BOARD_GROUP, DEFAULT_GROUP, DEFAULT_SORT, parseParams, type PortfolioParams } from './portfolioParams';
import type { GroupKey, PortfolioResponse } from './portfolioTypes';

/** Each view's own default grouping (an absent `group` in a stored context
 *  means this). */
export function defaultGroupOf(view: OrganizationsView): GroupKey {
  return view === 'board' ? BOARD_GROUP : DEFAULT_GROUP;
}

/** The params as a question carries them (spec §3: every portfolio param
 *  except the cursor), in the API's own string form — **only the set keys**.
 *  Backend ruling: an unset key is never sent as `''` (the backend reads a
 *  literal `ids: ''` as "names nothing"). `group` is sent only when it
 *  differs from `defaultGroupOf(view)`, and `group: ''` only for an explicit
 *  "None" (the Board never reaches that branch: `boardParams` keeps its
 *  group non-empty). */
export function toContextFilters(p: PortfolioParams, view: OrganizationsView): OrganizationsFilters {
  const filters: OrganizationsFilters = {};
  if (p.search) filters.search = p.search;
  if (p.owner) filters.owner = p.owner;
  if (p.lifecycle.length) filters.lifecycle = p.lifecycle.join(',');
  if (p.health.length) filters.health = p.health.join(',');
  if (p.product.length) filters.product = p.product.join(',');
  if (p.renews_within) filters.renews_within = p.renews_within;
  if (p.nps) filters.nps = p.nps;
  if (p.ids.length) filters.ids = p.ids.join(',');
  if (p.include_churned) filters.include_churned = '1';
  if (p.sort !== DEFAULT_SORT) filters.sort = p.sort;
  const defaultGroup = defaultGroupOf(view);
  if (p.group === '') filters.group = '';
  else if (p.group !== defaultGroup) filters.group = p.group;
  return filters;
}

/** A context's filters back to params, through the URL parser, so a value
 *  the page would not accept is dropped the same way. A key left out behaves
 *  as it would off the URL; `group: ''` is "no grouping" (the URL's
 *  `group=none`), and a missing `group` is the view's own default. */
export function fromContextFilters(filters: OrganizationsFilters, view: OrganizationsView): PortfolioParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) search.set(key, value);
  if (filters.group === '') search.set('group', 'none');
  return parseParams(search, defaultGroupOf(view));
}

/** The page a conversation started on, with its filters (History restore).
 *  `origin.filters` is already the page's own URL parameters, only the set
 *  keys present (backend ruling), so it is used as-is rather than round-
 *  tripped through the params parser — except `group: ''` (the stored
 *  "None"), which the URL spells `group=none`, as `fromContextFilters`
 *  already does; the page only reads that sentinel as ungrouped, and would
 *  otherwise fall back to its own default group for a bare `group=`. */
export function organizationsPath(origin: OrganizationsOrigin): string {
  const filters = origin.filters.group === '' ? { ...origin.filters, group: 'none' } : origin.filters;
  const query = new URLSearchParams(filters as Record<string, string>).toString();
  return query ? `/organizations/${origin.view}?${query}` : `/organizations/${origin.view}`;
}

/** The chip: "Organizations · Owner: Carl CSM · 1 account". When the server
 *  already stored `labels` on this context (a past message, or an origin,
 *  which always carries them), those are used as-is (C2) — the asker's own
 *  filter options at the time, which may differ from (or be unavailable to)
 *  whoever is reading the chip now. Only a live, still-being-asked context
 *  (`labels` absent) falls back to recomputing the filter chips here, named
 *  from the portfolio's options; an unknown value then shows as those chips
 *  show it ("User 9"). The focus part is never stored in `labels` (it is
 *  spent by the send), so it is always named fresh, from `focus`. */
export function organizationsLabel(
  context: Omit<OrganizationsOrigin, 'labels'> & { labels?: string[]; focus?: OrganizationsFocus | null },
  options: PortfolioResponse['filters'] | null = null,
): string {
  const parts = context.labels?.length
    ? ['Organizations', ...context.labels]
    : ['Organizations', ...filterChips(fromContextFilters(context.filters, context.view), options).map((chip) => chip.label)];
  const focus = focusLabel(context.focus ?? null);
  if (focus) parts.push(focus);
  return parts.join(' · ');
}
