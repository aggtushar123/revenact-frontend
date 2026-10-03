import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pizzaEmea } from '../../features/accounts/testPortfolio';
import { LUKAS } from '../../features/contacts/testContacts';
import { pizzaHut } from '../../features/organizations/testPortfolio';
import { parseSegmentPage, toSegmentPageSearch, type SegmentPageParams } from '../../features/segments/segmentParams';
import type { Segment } from '../../features/segments/segmentTypes';
import { CHAMPIONS, EMEA_ACCOUNTS, RENEWAL_RISK, requests, stubSegments } from '../../features/segments/testSegments';
import { renderInApp } from '../../pages/segments/testPages';
import { resetViewport } from '../../test/viewport';
import { MembersTab } from './MembersTab';

/** The page's part of the contract: the segment, its URL state, and a
 *  reload after a pin. */
function Host({ initial }: { initial: Segment }) {
  const [segment, setSegment] = useState(initial);
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useSearchParams();
  const params = parseSegmentPage(search, segment.kind);
  const update = (patch: Partial<SegmentPageParams>) => setSearch(toSegmentPageSearch({ ...params, ...patch }), { replace: true });
  return (
    <>
      <MembersTab
        segment={segment}
        params={params}
        update={update}
        version={version}
        onChanged={(state) => {
          setSegment((current) => ({ ...current, ...state }));
          setVersion((v) => v + 1);
        }}
        onNotice={setNotice}
      />
      {notice ? <p data-testid="notice">{notice}</p> : null}
    </>
  );
}

const where = () => screen.getByTestId('where').textContent;
const count = () => document.querySelector('[data-part="member-count"]');
const two = (i: number) => String(i).padStart(2, '0');

/** `n` records of a kind, named "<prefix> 00" onwards, ids from 1000. */
const many = <R extends { id: number; name: string }>(base: R, prefix: string, n: number): R[] =>
  Array.from({ length: n }, (_, i) => ({ ...base, id: 1000 + i, name: `${prefix} ${two(i)}` }));

describe('MembersTab (spec §3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('lists an organisations segment\'s members as Organizations rows, never selectable', async () => {
    stubSegments();
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    expect(await screen.findByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
    expect(screen.getByRole('link', { name: 'Globex' })).toBeInTheDocument();
    expect(count()).toHaveTextContent('3 organisations');
    expect(screen.queryByRole('checkbox', { name: 'Select Pizza Hut' })).not.toBeInTheDocument();
  });

  it('pins a member from its row menu, and the menu then offers Unpin', async () => {
    const spy = stubSegments();
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Pizza Hut' }));
    await userEvent.click(within(screen.getByRole('menu', { name: 'Pizza Hut actions' })).getByRole('menuitem', { name: 'Pin' }));
    await waitFor(() => expect(requests(spy, 'PATCH', /^\/segments\/7\/members\/7\/$/).map((r) => r.body)).toEqual([{ state: 'pinned' }]));
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Pizza Hut' }));
    expect(within(screen.getByRole('menu', { name: 'Pizza Hut actions' })).getByRole('menuitem', { name: 'Unpin' })).toBeInTheDocument();
  });

  it('keeps a member out, lists it under Kept out, and lets it back in', async () => {
    const spy = stubSegments();
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Globex' }));
    await userEvent.click(within(screen.getByRole('menu', { name: 'Globex actions' })).getByRole('menuitem', { name: 'Keep out' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Globex' })).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^Kept out/ }));
    const kept = await screen.findByRole('list', { name: 'Kept out' });
    await userEvent.click(within(kept).getByRole('button', { name: 'Let Globex back in' }));
    expect(await screen.findByRole('link', { name: 'Globex' })).toBeInTheDocument();
    expect(requests(spy, 'PATCH', /^\/segments\/7\/members\/1\/$/).map((r) => r.body)).toEqual([{ state: 'excluded' }, { state: 'none' }]);
    expect(requests(spy, 'POST', /^\/segments\/preview\/$/)[0].body).toEqual({ kind: 'customer', rules: { match: 'all', conditions: [] }, pinned_ids: [1] });
  });

  it("sends focus to the members count line once Keep out unmounts the row that held it, instead of <body>", async () => {
    stubSegments();
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Globex' }));
    await userEvent.click(within(screen.getByRole('menu', { name: 'Globex actions' })).getByRole('menuitem', { name: 'Keep out' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Globex' })).not.toBeInTheDocument());
    expect(count()).toHaveFocus();
  });

  it("sends focus to the Kept out toggle once Let back in unmounts the row that held it, while others stay kept out", async () => {
    stubSegments({ segments: [{ ...RENEWAL_RISK, excluded_ids: [1, 2] }] });
    renderInApp(<Host initial={{ ...RENEWAL_RISK, excluded_ids: [1, 2] }} />, { url: '/segments/7' });
    const toggle = await screen.findByRole('button', { name: /^Kept out/ });
    await userEvent.click(toggle);
    await userEvent.click(await screen.findByRole('button', { name: 'Let Globex back in' }));
    // The preview that names the one id still kept out reloads (its own
    // answer cache is keyed by the whole excluded set), so the row reappears
    // asynchronously.
    expect(await screen.findByRole('button', { name: 'Let Initech back in' })).toBeInTheDocument();
    expect(toggle).toHaveFocus();
  });

  it("sends focus to the members count line once Let back in unmounts the last kept-out record, toggle and all", async () => {
    stubSegments();
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Globex' }));
    await userEvent.click(within(screen.getByRole('menu', { name: 'Globex actions' })).getByRole('menuitem', { name: 'Keep out' }));
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Globex' })).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^Kept out/ }));
    const kept = await screen.findByRole('list', { name: 'Kept out' });
    await userEvent.click(within(kept).getByRole('button', { name: 'Let Globex back in' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Kept out/ })).not.toBeInTheDocument());
    expect(count()).toHaveFocus();
  });

  it('shows the server\'s refusal word for word, reloads nothing, and enables the menu again', async () => {
    const detail = 'A segment can pin at most 500 records, and keep out as many.';
    const spy = stubSegments({ member: () => ({ status: 400, body: { detail } }) });
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Pizza Hut' }));
    const reads = () => requests(spy, 'GET', /^\/segments\/7\/members\/$/).length;
    const before = reads();
    await userEvent.click(within(screen.getByRole('menu', { name: 'Pizza Hut actions' })).getByRole('menuitem', { name: 'Pin' }));
    expect(await screen.findByTestId('notice')).toHaveTextContent(detail);
    expect(screen.getByTestId('notice').textContent).toBe(detail);
    expect(requests(spy, 'PATCH', /^\/segments\/7\/members\/7\/$/)).toHaveLength(1);
    expect(reads()).toBe(before);
    expect(screen.getByRole('button', { name: 'Actions for Pizza Hut' })).toBeEnabled();
  });

  it('names kept-out records ten ids at a time, and Show more reaches the rest (Ruling G2)', async () => {
    const rows = many(pizzaHut, 'Org', 12);
    const kept = rows.slice(0, 11).map((row) => row.id);
    const segment = { ...RENEWAL_RISK, excluded_ids: kept };
    const spy = stubSegments({ segments: [segment], rows: { customer: rows } });
    renderInApp(<Host initial={segment} />, { url: '/segments/7' });
    await userEvent.click(await screen.findByRole('button', { name: /^Kept out/ }));
    const list = await screen.findByRole('list', { name: 'Kept out' });
    expect(within(list).getAllByRole('button', { name: /^Let Org \d\d back in$/ })).toHaveLength(10);
    expect(within(list).queryByRole('button', { name: 'Let Org 10 back in' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show more kept-out records' }));
    expect(await within(list).findByRole('button', { name: 'Let Org 10 back in' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more kept-out records' })).not.toBeInTheDocument();
    expect(requests(spy, 'POST', /^\/segments\/preview\/$/).map((r) => (r.body as { pinned_ids: number[] }).pinned_ids)).toEqual([
      kept.slice(0, 10),
      kept.slice(10),
    ]);
  });

  it('searches, sorts and groups in the URL, asking the endpoint only for the names it reads', async () => {
    const spy = stubSegments();
    renderInApp(<Host initial={RENEWAL_RISK} />, { url: '/segments/7' });
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search members by name' }), 'piz');
    await waitFor(() => expect(where()).toBe('/segments/7?search=piz'));
    await waitFor(() => expect(count()).toHaveTextContent('1 of 3 organisations'));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'Name');
    await waitFor(() => expect(where()).toBe('/segments/7?search=piz&sort=-name'));
    const reads = () => requests(spy, 'GET', /^\/segments\/7\/members\/$/).map((r) => r.query);
    await waitFor(() => expect(reads().some((q) => q.get('sort') === '-name')).toBe(true));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Group' }), 'Health');
    await waitFor(() => expect(where()).toBe('/segments/7?search=piz&sort=-name&group=health'));
    await waitFor(() => expect(reads().some((q) => q.get('group') === 'health' && !q.has('group_value'))).toBe(true));
    const frame = reads().find((q) => q.get('group') === 'health' && !q.has('group_value'))!;
    expect([...frame.keys()].sort()).toEqual(['group', 'limit', 'search', 'sort']);
    expect(frame.get('limit')).toBe('1');
    expect(frame.get('sort')).toBe('-name');
    const allowed = ['sort', 'group', 'group_value', 'search', 'cursor', 'limit'];
    expect(reads().every((q) => [...q.keys()].every((key) => allowed.includes(key)))).toBe(true);
  });

  it('gives a segment shared with me its rows but no row menu, and no Kept out though it keeps some out', async () => {
    stubSegments();
    expect(EMEA_ACCOUNTS.excluded_ids.length).toBeGreaterThan(0);
    renderInApp(<Host initial={EMEA_ACCOUNTS} />, { url: '/segments/8' });
    expect(await screen.findByRole('link', { name: 'Pizza EMEA' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Kept out/ })).not.toBeInTheDocument();
  });

  it('lists a contacts segment\'s members as Contacts rows, searched by name, with no grouping, in an unclipped list', async () => {
    stubSegments();
    renderInApp(<Host initial={CHAMPIONS} />, { url: '/segments/9' });
    expect(await screen.findByRole('link', { name: /Lukas Vermeer/ })).toHaveAttribute('href', '/contacts/41');
    expect(count()).toHaveTextContent('3 contacts');
    expect(screen.queryByRole('combobox', { name: 'Group' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Lukas Vermeer' })).toBeInTheDocument();
    // Ruling G13: the row menu hangs below its button, so the list may not clip it.
    expect(screen.getByRole('list', { name: 'Members' })).not.toHaveClass('overflow-hidden');
  });

  it.each([
    ['organisations', RENEWAL_RISK, { customer: many(pizzaHut, 'Item', 52) }],
    ['accounts', EMEA_ACCOUNTS, { account: many(pizzaEmea, 'Item', 52) }],
    ['contacts', CHAMPIONS, { contact: many(LUKAS, 'Item', 52) }],
  ] as const)('pages %s members by the cursor, with Show more', async (_noun, segment, rows) => {
    const spy = stubSegments({ rows });
    renderInApp(<Host initial={segment} />, { url: `/segments/${segment.id}` });
    const items = () => screen.getAllByRole('link', { name: /^Item \d\d/ });
    await waitFor(() => expect(items()).toHaveLength(50));
    await userEvent.click(screen.getByRole('button', { name: /^Show more/ }));
    await waitFor(() => expect(items()).toHaveLength(52));
    const reads = requests(spy, 'GET', new RegExp(`^/segments/${segment.id}/members/$`)).map((r) => r.query);
    expect(reads.map((q) => q.get('cursor'))).toEqual([null, '50']);
    expect(screen.queryByRole('button', { name: /^Show more/ })).not.toBeInTheDocument();
  });
});
