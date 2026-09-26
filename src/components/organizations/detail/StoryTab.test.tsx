import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { parseDetailParams } from '../../../features/organizations/detailParams';
import type { StoryResponse } from '../../../features/organizations/storyTypes';
import {
  ACCOUNTS,
  PIZZA_ATTENTION,
  STORY_ITEMS,
  postBodies,
  storyQueries,
  stubOrganizationPage,
} from '../../../features/organizations/testStory';
import { makeDetailStore } from '../../../pages/organizations/testDetail';
import { StoryTab } from './StoryTab';
import type { StoryState } from './useStory';

const DATA: StoryResponse = {
  items: STORY_ITEMS,
  next_cursor: null,
  counts: {
    by_group: { all: 5, conversations: 2, tickets: 1, tasks: 1, feedback: 0, health: 1 },
    by_kind: { activity: 0, calendar_event: 0, call: 1, email: 1, health: 1, note: 0, survey: 0, task: 1, ticket: 1 },
    by_account: { all: 5, none: 3, '31': 1, '32': 1 },
  },
  attention: PIZZA_ATTENTION,
};

function story(partial: Partial<StoryState> = {}): StoryState {
  return {
    data: DATA,
    items: STORY_ITEMS,
    next: null,
    loading: false,
    error: null,
    loadingMore: false,
    moreError: null,
    loadMore: vi.fn(async () => {}),
    retry: vi.fn(),
    ...partial,
  };
}

function renderTab(state: StoryState = story(), search = '') {
  const handlers = { onUpdate: vi.fn(), onAdded: vi.fn(), onOpenTab: vi.fn(), onJump: vi.fn() };
  render(
    <Provider store={makeDetailStore()}>
      <MemoryRouter>
        <StoryTab
          orgId={7}
          story={state}
          params={parseDetailParams(new URLSearchParams(search))}
          accounts={ACCOUNTS}
          isSm
          {...handlers}
        />
      </MemoryRouter>
    </Provider>,
  );
  return handlers;
}

describe('StoryTab (spec §1.6)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.style.overflow = '';
  });

  it('shows Needs attention, the toolbar and the stream, and wires each to the URL', async () => {
    stubOrganizationPage();
    const { onUpdate, onOpenTab, onJump } = renderTab();
    expect(screen.getByRole('region', { name: 'Needs attention' })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-story-item]')).toHaveLength(5);
    await userEvent.click(screen.getByRole('button', { name: /^1 overdue task/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Tickets 1' }));
    await userEvent.click(screen.getByRole('button', { name: '3 unanswered questions' }));
    await userEvent.click(screen.getByRole('button', { name: /^Renewal 47d overdue/ }));
    expect(onUpdate.mock.calls.map(([patch]) => patch)).toEqual([{ group: 'tasks' }, { group: 'tickets' }]);
    expect(onOpenTab).toHaveBeenCalledWith('knowledge');
    expect(onJump).toHaveBeenCalledWith('contract');
  });

  it('writes the search with replace', async () => {
    stubOrganizationPage();
    const { onUpdate } = renderTab();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the story' }), 'quote{Enter}');
    expect(onUpdate).toHaveBeenCalledWith({ q: 'quote' }, { replace: true });
  });

  it('Clear filters clears the account, the filter, the sources and the search', async () => {
    stubOrganizationPage();
    const { onUpdate } = renderTab(story({ items: [] }), 'account=31&group=tasks&q=zzz');
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(onUpdate).toHaveBeenCalledWith({ account: '', group: '', sources: [], q: '' });
  });

  it('adds on the chosen account, closes the sheet, and says so', async () => {
    const spy = stubOrganizationPage();
    const { onAdded } = renderTab(story(), 'account=31');
    await userEvent.click(screen.getByRole('button', { name: 'Add to the story' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'New note' }));
    const dialog = screen.getByRole('dialog', { name: 'New note' });
    expect(dialog).toHaveAccessibleDescription('On EMEA');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Note title' }), 'Kickoff');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Note body' }), 'Met the new admin.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onAdded).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('Added to the story.');
    expect(postBodies(spy, '/customers/7/accounts/31/notes/')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Add to the story' })).toHaveFocus();
  });

  it('opens an email as its thread, read with ?thread= whatever account is chosen', async () => {
    const spy = stubOrganizationPage();
    renderTab(story(), 'account=31');
    await userEvent.click(screen.getByRole('button', { name: 'Re: Renewal pricing' }));
    const dialog = screen.getByRole('dialog', { name: 'Re: Renewal pricing' });
    expect(await within(dialog).findAllByRole('listitem')).toHaveLength(2);
    expect(Object.fromEntries(storyQueries(spy)[0])).toEqual({ thread: 't-1', limit: '100' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Re: Renewal pricing' })).toHaveFocus();
  });
});
