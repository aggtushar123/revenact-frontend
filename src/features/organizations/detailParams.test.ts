import { describe, expect, it } from 'vitest';
import {
  DETAIL_TABS,
  detailPanelId,
  detailTabId,
  hasStoryFilters,
  parseDetailParams,
  storyFilters,
  toDetailSearch,
  withPatch,
} from './detailParams';

const parse = (search: string) => parseDetailParams(new URLSearchParams(search));

describe('the organization page URL state', () => {
  it('has six tabs, Story first (spec §1)', () => {
    expect(DETAIL_TABS.map((tab) => tab.label)).toEqual(['Story', 'Details', 'People', 'Deals & risks', 'Knowledge', 'Files']);
  });

  it('reads defaults, and drops unknown values rather than failing', () => {
    expect(parse('')).toEqual({ tab: 'story', account: '', group: '', sources: [], q: '' });
    expect(parse('tab=overview&account=emea&group=sessions&source=slack,email')).toEqual({
      tab: 'story',
      account: '',
      group: '',
      sources: ['email'],
      q: '',
    });
    expect(parse('tab=deals&account=31&q=renewal').tab).toBe('deals');
    expect(parse('account=none').account).toBe('none');
    expect(parse('account=0').account).toBe('');
  });

  it('keeps only the sources inside the chosen group', () => {
    expect(parse('group=tickets&source=email,ticket').sources).toEqual(['ticket']);
    const p = parse('source=email,ticket,email');
    expect(p.sources).toEqual(['email', 'ticket']);
    expect(withPatch(p, { group: 'conversations' }).sources).toEqual(['email']);
  });

  it('writes only what differs from the default, in one order', () => {
    expect(toDetailSearch(parse('')).toString()).toBe('');
    const p = parse('q=quote&source=task&group=tasks&account=31&tab=story');
    expect([...toDetailSearch(p).keys()]).toEqual(['account', 'group', 'source', 'q']);
    expect(toDetailSearch({ ...p, tab: 'files' }).get('tab')).toBe('files');
  });

  it('hands the story its filters and says when any is set', () => {
    const p = parse('account=31&group=tasks&source=note&q=kickoff');
    expect(storyFilters(p)).toEqual({ group: 'tasks', sources: ['note'], account: '31', q: 'kickoff' });
    expect(hasStoryFilters(p)).toBe(true);
    expect(hasStoryFilters(parse('tab=files'))).toBe(false);
  });

  it('names the tab and its panel for aria wiring', () => {
    expect(detailTabId('x', 'people')).toBe('x-tab-people');
    expect(detailPanelId('x')).toBe('x-panel');
  });
});
