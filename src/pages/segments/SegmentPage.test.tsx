import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DANA_PRIVATE, SEGMENTS, requests, stubSegments } from '../../features/segments/testSegments';
import { resetViewport } from '../../test/viewport';
import { renderSegments } from './testPages';

const where = () => screen.getByTestId('where').textContent;
const tile = (name: string) => screen.getByRole('group', { name });

describe('/segments/:id (spec §3)', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('heads my segment with its name, its rules as one sentence, owner and sharing, and Edit, Duplicate, Export CSV and Delete', async () => {
    stubSegments();
    renderSegments('/segments/7');
    expect(await screen.findByRole('heading', { level: 1, name: 'Renewal risk' })).toBeInTheDocument();
    expect(screen.getByText('Organisations').closest('p')).toHaveTextContent(
      'Organisations where CSAT % is less than 60 and (Renewal date is in the next 90 days or Health is Poor)',
    );
    expect(screen.getByText('Yours · Shared with the workspace')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/segments/7/edit');
    for (const name of ['Duplicate', 'Export CSV', 'Delete']) expect(screen.getByRole('button', { name })).toBeInTheDocument();
  });

  it('shows the tiles over every member: members, ARR covered, average health and CSAT, and the last 7 days', async () => {
    stubSegments();
    renderSegments('/segments/7');
    expect(await within(await screen.findByRole('group', { name: 'Members' })).findByText('3')).toHaveClass('font-mono-brand');
    expect(within(tile('ARR covered')).getByText('$512.0K')).toBeInTheDocument();
    expect(within(tile('Average health')).getByText('5.4')).toBeInTheDocument();
    expect(within(tile('Average CSAT')).getByText('71%')).toBeInTheDocument();
    expect(within(tile('Last 7 days')).getByText('+6 / −2')).toBeInTheDocument();
  });

  it('shows a shared reader the rules with what they cannot open unnamed, the count of the rest in mono, and no Edit or Delete', async () => {
    stubSegments();
    renderSegments('/segments/8');
    expect(await screen.findByText("an organisation you can't open")).toBeInTheDocument();
    expect(screen.getByText('Owned by Carl CSM · Shared with Alice')).toBeInTheDocument();
    const hidden = await screen.findByText(/more members you can't open\./);
    expect(hidden).toHaveTextContent("2 more members you can't open.");
    expect(within(hidden).getByText('2')).toHaveClass('font-mono-brand');
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
  });

  it('shows no hidden-members line to the owner', async () => {
    stubSegments();
    renderSegments('/segments/7');
    await within(await screen.findByRole('group', { name: 'Members' })).findByText('3');
    expect(screen.queryByText(/members? you can't open/)).not.toBeInTheDocument();
  });

  it('deletes after confirming, then returns to the list', async () => {
    const spy = stubSegments();
    renderSegments('/segments/7');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    expect(screen.getByText('Delete Renewal risk?')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);
    await waitFor(() => expect(where()).toBe('/segments'));
    expect(requests(spy, 'DELETE', /^\/segments\/7\/$/)).toHaveLength(1);
  });

  it('keeps the dialog open with the refusal, and stays on the segment, when the delete fails', async () => {
    const spy = stubSegments({ remove: () => ({ status: 403, body: { detail: "Only the segment's owner can change it." } }) });
    renderSegments('/segments/7');
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1)!);
    expect(await screen.findByText("Only the segment's owner can change it.")).toBeInTheDocument();
    expect(screen.getByText('Delete Renewal risk?')).toBeInTheDocument();
    expect(requests(spy, 'DELETE', /^\/segments\/7\/$/)).toHaveLength(1);
    expect(where()).toBe('/segments/7');
  });

  it('offers Try again when the totals fail, and shows the tiles once a retry succeeds', async () => {
    let failures = 1;
    stubSegments({
      members: (_id, query) =>
        query.get('limit') === '1' && failures-- > 0 ? { status: 500, body: { detail: 'Server error.' } } : undefined,
    });
    renderSegments('/segments/7');
    expect(await screen.findByText('Could not load the totals.')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Members' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await within(await screen.findByRole('group', { name: 'Members' })).findByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Could not load the totals.')).not.toBeInTheDocument();
  });

  it('duplicates into a copy of my own and opens it', async () => {
    stubSegments();
    renderSegments('/segments/8');
    await userEvent.click(await screen.findByRole('button', { name: 'Duplicate' }));
    await waitFor(() => expect(where()).toBe('/segments/200'));
    expect(await screen.findByRole('heading', { level: 1, name: 'EMEA accounts (copy)' })).toBeInTheDocument();
  });

  it('exports the members the way the tab lists them', async () => {
    const spy = stubSegments();
    renderSegments('/segments/7?search=piz&sort=name');
    await userEvent.click(await screen.findByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(requests(spy, 'GET', /^\/segments\/7\/members\/export\.csv$/)).toHaveLength(1));
    expect(requests(spy, 'GET', /export\.csv$/)[0].query.toString()).toBe('search=piz&sort=name');
    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
  });

  it("opens on the Changes tab from the alert's link, and switches tabs in the URL", async () => {
    stubSegments();
    renderSegments('/segments/7?tab=changes');
    expect(await screen.findByRole('tab', { name: 'Changes' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('tabpanel', { name: 'Changes' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Members' }));
    await waitFor(() => expect(where()).toBe('/segments/7'));
    expect(screen.getByRole('tabpanel', { name: 'Members' })).toBeInTheDocument();
  });

  it("names each tab's one panel by the tab that controls it, and moves to Changes with the right arrow", async () => {
    stubSegments();
    renderSegments('/segments/7');
    const members = await screen.findByRole('tab', { name: 'Members' });
    const panel = screen.getByRole('tabpanel', { name: 'Members' });
    expect(members).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', members.id);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    members.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(where()).toBe('/segments/7?tab=changes'));
    expect(screen.getByRole('tab', { name: 'Changes' })).toHaveFocus();
  });

  it('gives a contacts segment only the Members and Last 7 days tiles', async () => {
    stubSegments();
    renderSegments('/segments/9');
    await screen.findByRole('group', { name: 'Members' });
    expect(tile('Last 7 days')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'ARR covered' })).not.toBeInTheDocument();
  });

  it('reads a segment that is not there as not found', async () => {
    stubSegments();
    renderSegments('/segments/99');
    expect(await screen.findByText('Segment not found')).toBeInTheDocument();
  });

  it("reads someone else's private segment as not found, without its name", async () => {
    stubSegments({ segments: [...SEGMENTS, DANA_PRIVATE] });
    renderSegments('/segments/10');
    expect(await screen.findByText('Segment not found')).toBeInTheDocument();
    expect(screen.queryByText("Dana's pipeline")).not.toBeInTheDocument();
  });
});
