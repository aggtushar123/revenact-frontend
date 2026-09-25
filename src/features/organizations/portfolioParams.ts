import { NPS_BANDS, RENEWAL_WINDOWS, type RenewalWindow } from './portfolioLabels';
import type { GroupKey, HealthBand, LifecycleValue, NpsBand } from './portfolioTypes';

/** Everything the portfolio page reads from the URL. Every filter, sort and
 *  group lives there (spec §1), so a view can be linked and survives reload. */
export interface PortfolioParams {
  search: string;
  /** A user id, 'unassigned', or '' for everyone. */
  owner: string;
  lifecycle: LifecycleValue[];
  health: HealthBand[];
  product: string[];
  renews_within: '' | RenewalWindow;
  nps: '' | NpsBand;
  ids: number[];
  include_churned: boolean;
  sort: string;
  /** '' is "no grouping" (URL `group=none`). */
  group: GroupKey | '';
}

export const DEFAULT_SORT = '-arr';
export const DEFAULT_GROUP: GroupKey = 'health';
export const MAX_IDS = 500;

export const LIFECYCLE_VALUES: LifecycleValue[] = [
  'onboarding', 'kickoff', 'adoption', 'live', 'renewal', 'churn', 'expansion', 'other',
];
export const HEALTH_BANDS: HealthBand[] = ['poor', 'average', 'good'];
export const GROUP_KEYS: GroupKey[] = ['health', 'owner', 'lifecycle', 'product', 'renewal'];

export const BASE_SORT_KEYS = ['arr', 'health', 'renewal', 'touch', 'risk', 'name'] as const;
/** The Customer field names the backend sorts on (plan pre-flight #4). */
export const NUMERIC_SORT_KEYS = [
  'arr_billed_at_hq', 'total_contract_value', 'total_forecasted_renewal_revenue', 'implementation_fee',
  'total_contracted_seats', 'total_active_seats', 'seat_utilization_percentage', 'total_hires',
  'nps_score', 'csat_score', 'ces_percentage', 'ai_pulse_value', 'csm_pulse_score',
] as const;
const SORT_KEYS: readonly string[] = [...BASE_SORT_KEYS, ...NUMERIC_SORT_KEYS];

export const EMPTY_FILTERS: Partial<PortfolioParams> = {
  search: '', owner: '', lifecycle: [], health: [], product: [], renews_within: '', nps: '', ids: [], include_churned: false,
};

const list = (raw: string | null) =>
  (raw ?? '').split(',').map((value) => value.trim()).filter(Boolean);

function only<T extends string>(values: string[], allowed: readonly T[]): T[] {
  return values.filter((value): value is T => (allowed as readonly string[]).includes(value));
}

function parseSort(raw: string | null): string {
  if (!raw) return DEFAULT_SORT;
  return SORT_KEYS.includes(raw.replace(/^-/, '')) ? raw : DEFAULT_SORT;
}

export function parseParams(search: URLSearchParams): PortfolioParams {
  const owner = search.get('owner') ?? '';
  const renews = search.get('renews_within') ?? '';
  const nps = search.get('nps') ?? '';
  const group = search.get('group');
  return {
    search: (search.get('search') ?? '').trim(),
    owner: owner === 'unassigned' || /^\d+$/.test(owner) ? owner : '',
    lifecycle: only(list(search.get('lifecycle')), LIFECYCLE_VALUES),
    health: only(list(search.get('health')), HEALTH_BANDS),
    product: list(search.get('product')).filter((value) => /^\d+$/.test(value)),
    renews_within: only([renews], RENEWAL_WINDOWS)[0] ?? '',
    nps: only([nps], NPS_BANDS)[0] ?? '',
    ids: list(search.get('ids')).filter((value) => /^\d+$/.test(value)).map(Number).slice(0, MAX_IDS),
    include_churned: search.get('include_churned') === '1',
    sort: parseSort(search.get('sort')),
    group: group === 'none' ? '' : (only([group ?? ''], GROUP_KEYS)[0] ?? DEFAULT_GROUP),
  };
}

function setFilters(query: URLSearchParams, p: PortfolioParams) {
  if (p.search) query.set('search', p.search);
  if (p.owner) query.set('owner', p.owner);
  if (p.lifecycle.length) query.set('lifecycle', p.lifecycle.join(','));
  if (p.health.length) query.set('health', p.health.join(','));
  if (p.product.length) query.set('product', p.product.join(','));
  if (p.renews_within) query.set('renews_within', p.renews_within);
  if (p.nps) query.set('nps', p.nps);
  if (p.ids.length) query.set('ids', p.ids.join(','));
  if (p.include_churned) query.set('include_churned', '1');
}

/** The page URL's query: defaults left out, "no grouping" written as none. */
export function toUrlSearch(p: PortfolioParams): URLSearchParams {
  const query = new URLSearchParams();
  setFilters(query, p);
  if (p.sort !== DEFAULT_SORT) query.set('sort', p.sort);
  if (p.group === '') query.set('group', 'none');
  else if (p.group !== DEFAULT_GROUP) query.set('group', p.group);
  return query;
}

/** The API's query: sort always, group when grouping, then `extra`
 *  (limit, cursor, group_value) as given. */
export function toApiQuery(p: PortfolioParams, extra: Record<string, string> = {}): string {
  const query = new URLSearchParams();
  setFilters(query, p);
  query.set('sort', p.sort);
  if (p.group) query.set('group', p.group);
  for (const [key, value] of Object.entries(extra)) query.set(key, value);
  return query.toString();
}

/** The filters alone: a change here clears a selection (spec §1). */
export function filterQuery(p: PortfolioParams): string {
  const query = new URLSearchParams();
  setFilters(query, p);
  return query.toString();
}

export function hasFilters(p: PortfolioParams): boolean {
  return filterQuery(p) !== '';
}

export function toggleIn<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}
