import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { parseOrganizationsView, useOrganizationsContext } from './useOrganizationsContext';

const at = (url: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  };

describe('useOrganizationsContext', () => {
  it.each([
    ['/organizations/list', { view: 'list', filters: {} }],
    [
      '/organizations/list?owner=2&lifecycle=live,renewal&sort=name&include_churned=1',
      { view: 'list', filters: { owner: '2', lifecycle: 'live,renewal', include_churned: '1', sort: 'name' } },
    ],
    // An explicit "None" is sent as '', never omitted.
    ['/organizations/list?group=none&ids=3,7', { view: 'list', filters: { ids: '3,7', group: '' } }],
    // The List's own default (health) and the Board's (lifecycle) are omitted, never sent as themselves.
    ['/organizations/board', { view: 'board', filters: {} }],
    // The Board never asks ungrouped: group=none there reads back as lifecycle, its own default, so it too is omitted.
    ['/organizations/board?group=none&owner=unassigned', { view: 'board', filters: { owner: 'unassigned' } }],
    ['/organizations/board?group=owner&search=pizza', { view: 'board', filters: { search: 'pizza', group: 'owner' } }],
  ])('%s', (url, expected) => {
    const { result } = renderHook(() => useOrganizationsContext(), { wrapper: at(url) });
    expect(result.current).toEqual({ surface: 'organizations', focus: null, ...expected });
  });

  it('has no context off the list and the board', () => {
    expect(parseOrganizationsView('/organizations/7')).toBeNull();
    const { result } = renderHook(() => useOrganizationsContext(), { wrapper: at('/organizations/7') });
    expect(result.current).toBeNull();
  });
});
