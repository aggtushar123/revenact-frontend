import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { requests, stubSegments } from '../../features/segments/testSegments';
import { resetViewport } from '../../test/viewport';
import { renderSegments } from './testPages';

const where = () => screen.getByTestId('where').textContent;
const row = (id: number) => document.querySelector(`[data-segment="${id}"]`) as HTMLElement;

describe('/segments (spec §3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('shows each segment\'s kind, owner, count, today\'s change and 30-day size, with a badge when shared', async () => {
    stubSegments();
    renderSegments('/segments');
    await waitFor(() => expect(row(7)).not.toBeNull());
    const mine = row(7);
    expect(within(mine).getByRole('link', { name: 'Renewal risk' })).toHaveAttribute('href', '/segments/7');
    expect(mine).toHaveTextContent('Organisations · You');
    expect(within(mine).getByText('Workspace')).toBeInTheDocument();
    expect(within(mine).getByText('3')).toHaveClass('font-mono-brand');
    expect(within(mine).getByText('+3 / −1')).toHaveClass('font-mono-brand');
    expect(within(mine).getByRole('img', { name: 'Size over 30 days: 1 to 3' })).toBeInTheDocument();
    expect(row(9)).toHaveTextContent('Contacts · You');
    expect(within(row(9)).queryByText('Shared')).not.toBeInTheDocument();
  });

  it('shows a dash, never a guess, for the owner\'s figures on a segment shared with me', async () => {
    stubSegments();
    renderSegments('/segments');
    await waitFor(() => expect(row(8)).not.toBeNull());
    const shared = row(8);
    expect(shared).toHaveTextContent('Accounts · Carl CSM');
    expect(within(shared).getByText('Shared')).toBeInTheDocument();
    expect(within(shared).getAllByText('—')).toHaveLength(3);
    expect(within(shared).getAllByText('Only the owner sees this figure')).toHaveLength(3);
    expect(within(shared).queryByRole('img')).not.toBeInTheDocument();
  });

  it('switches between All, Mine and Shared with me in the URL, asking the server for each', async () => {
    const spy = stubSegments();
    renderSegments('/segments');
    await waitFor(() => expect(row(7)).not.toBeNull());
    await userEvent.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Shared with me' }));
    await waitFor(() => expect(where()).toBe('/segments?scope=shared'));
    await waitFor(() => expect(row(7)).toBeNull());
    expect(row(8)).not.toBeNull();
    expect(requests(spy, 'GET', /^\/segments\/$/).map((r) => r.query.get('scope'))).toEqual([null, 'shared']);
  });

  it('searches by name once typing stops', async () => {
    const spy = stubSegments();
    renderSegments('/segments');
    await waitFor(() => expect(row(7)).not.toBeNull());
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search segments by name' }), 'champ');
    await waitFor(() => expect(where()).toBe('/segments?search=champ'));
    await waitFor(() => expect(row(7)).toBeNull());
    expect(row(9)).not.toBeNull();
    expect(requests(spy, 'GET', /^\/segments\/$/).at(-1)?.query.get('search')).toBe('champ');
  });

  it('explains what a segment is when there are none, with New segment and the Organizations shortcut', async () => {
    stubSegments({ segments: [] });
    renderSegments('/segments');
    expect(await screen.findByText('No segments yet')).toBeInTheDocument();
    expect(screen.getByText(/A segment is a saved group of organisations, accounts or contacts/)).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'New segment' });
    expect(links.every((link) => link.getAttribute('href') === '/segments/new')).toBe(true);
    expect(screen.getByRole('link', { name: 'Filter Organizations, then Save as segment' })).toHaveAttribute('href', '/organizations/list');
  });

  it('says so when nothing matches a search, and Clear search clears it', async () => {
    stubSegments();
    renderSegments('/segments?search=zzz');
    expect(await screen.findByText('No segments match "zzz"')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    await waitFor(() => expect(where()).toBe('/segments'));
  });

  it('shows the failure with Try again, and the list once it works', async () => {
    let fail = true;
    stubSegments({ list: () => (fail ? { status: 500, body: { detail: 'Server error.' } } : { status: 200, body: [] }) });
    renderSegments('/segments');
    expect(await screen.findByText('Server error.')).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No segments yet')).toBeInTheDocument();
  });
});
