import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetViewport } from '../../../test/viewport';
import { renderOrganizations } from '../testList';
import { stubOrganizationsAsk } from './testOrganizationsAsk';

const where = () => screen.getByTestId('where').textContent;
const log = () => screen.getByRole('log', { name: 'Ask Revenact messages' });

// filters carry only the set keys, and group is sent only when it differs from
// the view's own default (backend ruling), and labels are server-built.
const listOrigin = { surface: 'organizations', view: 'list', filters: { owner: '2' }, labels: ['Owner: Carl CSM'] };
const boardOrigin = { surface: 'organizations', view: 'board', filters: { owner: '2', group: 'owner' }, labels: ['Owner: Carl CSM'] };
const dashOrigin = { surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { owner: '2', lifecycle: '', customer: '' } };

function chat(id: number, title: string, origin: unknown, answer: string) {
  const summary = { id, title, created_at: '', updated_at: '', origin };
  const full = {
    ...summary,
    messages: [
      { id: 1, role: 'user', content: title, context: origin ? { ...(origin as object), focus: null } : null, sources: [], questions: [], created_at: '' },
      { id: 2, role: 'assistant', content: answer, sources: [], questions: [], created_at: '' },
    ],
  };
  return { summary, full };
}

const renews = chat(9, 'Who renews first?', listOrigin, 'Pizza Hut, and it is overdue.');
const byOwner = chat(10, 'Whose book is riskiest?', boardOrigin, 'Carl CSM, by ARR at risk.');
const atRisk = chat(4, 'Why is at-risk ARR up?', dashOrigin, 'Two renewals slipped.');
const elsewhere = chat(5, 'Pizza Hut mail', null, 'They replied.');

function stubHistory() {
  return stubOrganizationsAsk({
    copilot: {
      conversations: [renews.summary, byOwner.summary, atRisk.summary, elsewhere.summary],
      conversationById: { 9: renews.full, 10: byOwner.full, 4: atRisk.full, 5: elsewhere.full },
    },
  });
}

async function pick(title: RegExp) {
  await userEvent.click(screen.getByRole('button', { name: 'History' }));
  const panel = screen.getByRole('dialog', { name: 'History' });
  const item = await within(panel).findByRole('button', { name: title });
  await userEvent.click(item);
}

describe('History on Organizations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it("tags an Organizations conversation with the server's tag, and reopens it on its view with its filters", async () => {
    stubHistory();
    renderOrganizations('/organizations/board', { ask: true });
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await userEvent.click(screen.getByRole('button', { name: 'History' }));
    const item = await within(screen.getByRole('dialog', { name: 'History' })).findByRole('button', { name: /Who renews first\?/ });
    expect(within(item).getByText('Organizations · Owner: Carl CSM')).toBeInTheDocument();
    await userEvent.click(item);
    expect(await within(log()).findByText('Pizza Hut, and it is overdue.')).toBeInTheDocument();
    await waitFor(() => expect(where()).toBe('/organizations/list?owner=2'));
    // The question's own chip, named from the list's options.
    expect(await within(log()).findByText('Organizations · Owner: Carl CSM')).toBeInTheDocument();
  });

  it('restores the board with its grouping', async () => {
    stubHistory();
    renderOrganizations('/organizations/list', { ask: true });
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await pick(/Whose book is riskiest\?/);
    expect(await within(log()).findByText('Carl CSM, by ARR at risk.')).toBeInTheDocument();
    await waitFor(() => expect(where()).toBe('/organizations/board?owner=2&group=owner'));
  });

  it('sends a dashboard conversation to the dashboard, whose rail shows it', async () => {
    stubHistory();
    renderOrganizations('/organizations/list', { ask: true });
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await pick(/Why is at-risk ARR up\?/);
    await waitFor(() => expect(where()).toBe('/dashboard/revenue/forecast?owner=2'));
    expect(await within(log()).findByText('Two renewals slipped.')).toBeInTheDocument();
  });

  it('brings an Organizations conversation picked on the dashboard back to its view', async () => {
    stubHistory();
    renderOrganizations('/dashboard/overview', { ask: true });
    await pick(/Who renews first\?/);
    await waitFor(() => expect(where()).toBe('/organizations/list?owner=2'));
    expect(await within(log()).findByText('Pizza Hut, and it is overdue.')).toBeInTheDocument();
  });

  it('opens a conversation from elsewhere where you are', async () => {
    stubHistory();
    renderOrganizations('/organizations/board?owner=2', { ask: true });
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await pick(/Pizza Hut mail/);
    expect(await within(log()).findByText('They replied.')).toBeInTheDocument();
    expect(where()).toBe('/organizations/board?owner=2');
  });
});
