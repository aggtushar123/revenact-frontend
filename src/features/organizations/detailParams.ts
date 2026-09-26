import type { StoryFilters } from './storyApi';
import { isStoryGroup, isStoryKind, kindsIn } from './storyKinds';
import type { StoryGroup, StoryKind } from './storyTypes';

// The organization page's URL state (spec §1.4 and §1.5): the tab, the
// account chip and the story's filters. Unknown values read as the default.

export type DetailTab = 'story' | 'details' | 'people' | 'deals' | 'knowledge' | 'files';

export const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'story', label: 'Story' },
  { key: 'details', label: 'Details' },
  { key: 'people', label: 'People' },
  { key: 'deals', label: 'Deals & risks' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'files', label: 'Files' },
];

export interface DetailParams {
  tab: DetailTab;
  /** An account id, 'none' (records on the organization itself), or '' for all. */
  account: string;
  group: StoryGroup | '';
  sources: StoryKind[];
  q: string;
}

const TAB_KEYS: string[] = DETAIL_TABS.map((tab) => tab.key);

const accountValue = (raw: string | null) => (raw && (/^[1-9]\d*$/.test(raw) || raw === 'none') ? raw : '');

/** Sources are unique and inside the chosen group. */
function normalise(p: DetailParams): DetailParams {
  const allowed = kindsIn(p.group);
  return { ...p, sources: [...new Set(p.sources)].filter((kind) => allowed.includes(kind)) };
}

export function parseDetailParams(search: URLSearchParams): DetailParams {
  const tab = search.get('tab') ?? '';
  const group = search.get('group') ?? '';
  return normalise({
    tab: TAB_KEYS.includes(tab) ? (tab as DetailTab) : 'story',
    account: accountValue(search.get('account')),
    group: isStoryGroup(group) ? group : '',
    sources: (search.get('source') ?? '').split(',').filter(isStoryKind),
    q: search.get('q') ?? '',
  });
}

export function toDetailSearch(p: DetailParams): URLSearchParams {
  const out = new URLSearchParams();
  if (p.tab !== 'story') out.set('tab', p.tab);
  if (p.account) out.set('account', p.account);
  if (p.group) out.set('group', p.group);
  if (p.sources.length) out.set('source', p.sources.join(','));
  if (p.q) out.set('q', p.q);
  return out;
}

export function withPatch(p: DetailParams, patch: Partial<DetailParams>): DetailParams {
  return normalise({ ...p, ...patch });
}

export function storyFilters(p: DetailParams): StoryFilters {
  return { group: p.group, sources: p.sources, account: p.account, q: p.q };
}

export function hasStoryFilters(p: DetailParams): boolean {
  return Boolean(p.account || p.group || p.sources.length || p.q.trim());
}

export const detailTabId = (base: string, tab: DetailTab) => `${base}-tab-${tab}`;
export const detailPanelId = (base: string) => `${base}-panel`;
