import { describe, expect, it } from 'vitest';
import { fromContextFilters, organizationsLabel, organizationsPath, toContextFilters } from './askContext';
import { BOARD_GROUP, boardParams, parseParams } from './portfolioParams';
import { FILTER_OPTIONS } from './testPortfolio';

const listParams = (query: string) => parseParams(new URLSearchParams(query));
const boardOf = (query: string) => boardParams(parseParams(new URLSearchParams(query), BOARD_GROUP));

describe('organizations ask context', () => {
  it("carries only the set portfolio params, in the API's own string form", () => {
    expect(toContextFilters(listParams(''), 'list')).toEqual({});
    expect(
      toContextFilters(
        listParams('search=pizza&owner=2&lifecycle=live,renewal&health=poor&product=1&renews_within=90&nps=detractor&ids=3,7&include_churned=1&sort=-renewal&group=owner'),
        'list',
      ),
    ).toEqual({
      search: 'pizza', owner: '2', lifecycle: 'live,renewal', health: 'poor', product: '1', renews_within: '90', nps: 'detractor', ids: '3,7', include_churned: '1', sort: '-renewal', group: 'owner',
    });
    // An explicit "None" is sent as '', never omitted.
    expect(toContextFilters(listParams('group=none'), 'list')).toEqual({ group: '' });
    // The view's own default is omitted, never sent as itself.
    expect(toContextFilters(listParams(''), 'list')).not.toHaveProperty('group');
    // The board never asks ungrouped: group=none reads as lifecycle there, its own default, so it too is omitted.
    expect(toContextFilters(boardOf('group=none'), 'board')).not.toHaveProperty('group');
  });

  it('never sends an unset key as an empty string (the backend reads ids: "" as "names nothing")', () => {
    const none = toContextFilters(listParams(''), 'list');
    expect(none).not.toHaveProperty('ids');
    expect(none).not.toHaveProperty('include_churned');
    expect(none).not.toHaveProperty('sort');
    expect(none).not.toHaveProperty('search');
  });

  it('reads a context back to the same params', () => {
    const list = listParams('owner=2&lifecycle=live&group=none&sort=name');
    expect(fromContextFilters(toContextFilters(list, 'list'), 'list')).toEqual(list);
    const board = boardOf('health=good');
    expect(fromContextFilters(toContextFilters(board, 'board'), 'board')).toEqual(board);
  });

  it('drops a value the page would not accept', () => {
    expect(fromContextFilters({ lifecycle: 'live,bogus', owner: 'x' }, 'list')).toMatchObject({ lifecycle: ['live'], owner: '' });
  });

  it('goes back to the view with its filters, using the stored filters as-is', () => {
    expect(organizationsPath({ surface: 'organizations', view: 'list', filters: {}, labels: [] })).toBe('/organizations/list');
    expect(organizationsPath({ surface: 'organizations', view: 'list', filters: { owner: '2', lifecycle: 'live,renewal' }, labels: [] })).toBe(
      '/organizations/list?owner=2&lifecycle=live%2Crenewal',
    );
    // An explicit "None" round-trips as the stored empty value, not the URL's 'none' sentinel.
    expect(organizationsPath({ surface: 'organizations', view: 'list', filters: { group: '' }, labels: [] })).toBe('/organizations/list?group=');
    expect(organizationsPath({ surface: 'organizations', view: 'board', filters: {}, labels: [] })).toBe('/organizations/board');
    expect(organizationsPath({ surface: 'organizations', view: 'board', filters: { sort: 'name', group: 'owner' }, labels: [] })).toBe(
      '/organizations/board?sort=name&group=owner',
    );
  });

  it('names the chip from the filter options, then the focus', () => {
    const base = { surface: 'organizations' as const, view: 'list' as const, labels: [] };
    expect(organizationsLabel({ ...base, filters: {} })).toBe('Organizations');
    expect(organizationsLabel({ ...base, filters: { owner: '2', lifecycle: 'live' } }, FILTER_OPTIONS)).toBe(
      'Organizations · Owner: Carl CSM · Lifecycle: Live',
    );
    // No options yet: the value shows as the page's own chip would show it.
    expect(organizationsLabel({ ...base, filters: { owner: '2' } })).toBe('Organizations · Owner: User 2');
    expect(organizationsLabel({ ...base, filters: { ids: '3,7' }, focus: { kind: 'companies', ids: [7] } })).toBe(
      'Organizations · Opened from the dashboard (2) · 1 account',
    );
  });
});
