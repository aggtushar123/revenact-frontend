import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetMembersCache } from '../../features/knowledge/useMembers';
import { EMEA_ACCOUNTS, ME, RENEWAL_RISK, requests, stubSegments } from '../../features/segments/testSegments';
import { resetViewport } from '../../test/viewport';
import { renderSegments } from './testPages';

const where = () => screen.getByTestId('where').textContent;
const row = (n: number) => document.querySelectorAll('[data-condition]')[n - 1] as HTMLElement;
const matchCount = () => document.querySelector('[data-part="match-count"]');
const CHURNED_NOTE = 'Churned and archived organisations are left out unless a rule names them.';

describe('the segment builder (spec §3)', () => {
  afterEach(() => {
    resetMembersCache();
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('creates a segment from its basics, rules, sharing and alert, previewing it on the way, then opens it', async () => {
    const spy = stubSegments();
    renderSegments('/segments/new');
    expect(screen.getByRole('heading', { name: 'New segment' })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Renewals');
    expect(screen.getByRole('radio', { name: 'Organisations' })).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(screen.getByText('Finish each condition to see who matches.')).toBeInTheDocument();
    await userEvent.selectOptions(within(row(1)).getByRole('combobox', { name: 'Condition 1 value' }), 'Renewal');
    await waitFor(() => expect(matchCount()).toHaveTextContent('3 organisations match'));
    await userEvent.click(screen.getByRole('radio', { name: 'Chosen teammates' }));
    await screen.findByRole('option', { name: 'Dana CSM' });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Add a teammate' }), 'Dana CSM');
    expect(within(screen.getByRole('list', { name: 'Shared with' })).getByText('Dana CSM')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Alert me on changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    await waitFor(() => expect(where()).toBe('/segments/100'));
    expect(requests(spy, 'POST', /^\/segments\/$/)[0].body).toEqual({
      name: 'Renewals',
      kind: 'customer',
      description: '',
      rules: { match: 'all', conditions: [{ field: 'lifecycle_stage', op: 'is', value: 'renewal' }] },
      sharing: 'people',
      shared_with: [5],
      alert_on_changes: true,
    });
  });

  it('offers my teammates, not me, in the people picker', async () => {
    stubSegments();
    renderSegments('/segments/new');
    await userEvent.click(screen.getByRole('radio', { name: 'Chosen teammates' }));
    await screen.findByRole('option', { name: 'Dana CSM' });
    const picker = screen.getByRole('combobox', { name: 'Add a teammate' });
    expect(within(picker).getAllByRole('option').map((option) => option.textContent)).toEqual(['Add a teammate…', 'Carl CSM', 'Dana CSM']);
    expect(within(picker).queryByRole('option', { name: ME.name })).not.toBeInTheDocument();
  });

  it("starts from a list's filters, names the organisation they named, and says what did not carry over", async () => {
    stubSegments();
    renderSegments('/segments/new?kind=account&organisation=7&search=piz');
    expect(screen.getByRole('radio', { name: 'Accounts' })).toBeChecked();
    expect(
      within(screen.getByRole('list', { name: 'From the list' })).getByText('The search "piz" isn\'t carried over: a segment has no search rule.'),
    ).toBeInTheDocument();
    expect(within(row(1)).getByRole('combobox', { name: 'Condition 1 field' })).toHaveDisplayValue('Organisation');
    expect(await within(row(1)).findByText('Pizza Hut')).toBeInTheDocument();
  });

  it('names an organisation picked in a rule by its name', async () => {
    stubSegments();
    renderSegments('/segments/new?kind=account');
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    await userEvent.selectOptions(within(row(1)).getByRole('combobox', { name: 'Condition 1 field' }), 'Organisation');
    await userEvent.type(within(row(1)).getByRole('searchbox', { name: 'Condition 1 value: search' }), 'piz');
    const matches = await screen.findByRole('list', { name: 'Condition 1 value: matches' });
    await userEvent.click(within(matches).getByRole('button', { name: 'Pizza Hut' }));
    expect(within(within(row(1)).getByRole('list', { name: 'Condition 1 value' })).getByText('Pizza Hut')).toBeInTheDocument();
  });

  it('says under Rules that churned and archived organisations are left out, for organisation segments only', async () => {
    stubSegments();
    renderSegments('/segments/new');
    expect(screen.getByText(CHURNED_NOTE)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Contacts' }));
    expect(screen.queryByText(CHURNED_NOTE)).not.toBeInTheDocument();
  });

  it('asks for a name and a finished condition before saving, and sends nothing until then', async () => {
    const spy = stubSegments();
    renderSegments('/segments/new');
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    expect(screen.getByText('Give the segment a name.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('aria-invalid', 'true');
    expect(row(1)).toHaveClass('border-danger');
    expect(within(row(1)).getByText('Finish this condition, or remove it.')).toBeInTheDocument();
    expect(requests(spy, 'POST', /^\/segments\/$/)).toEqual([]);
  });

  it("shows the server's refusals at the fields they name, and the 50-segment limit above the form", async () => {
    let answer: { status: number; body: unknown } = {
      status: 400,
      body: { name: ['Ensure this field has no more than 120 characters.'], rules: ['"is" cannot be used with Health score.'] },
    };
    stubSegments({ create: () => answer });
    renderSegments('/segments/new');
    await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Too long');
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    expect(await screen.findByText('Ensure this field has no more than 120 characters.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Rules' })).getByRole('alert')).toHaveTextContent('"is" cannot be used with Health score.');
    answer = { status: 400, body: { detail: 'You can own at most 50 segments.' } };
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    expect(await screen.findByText('You can own at most 50 segments.')).toHaveAttribute('role', 'alert');
    expect(where()).toBe('/segments/new');
  });

  it('edits a segment I own, showing its kind as fixed, and a rename sends only the name', async () => {
    const spy = stubSegments();
    renderSegments('/segments/7/edit');
    const name = await screen.findByRole('textbox', { name: 'Name' });
    expect(name).toHaveValue('Renewal risk');
    expect(screen.getByText(/A segment's kind can't change\./)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: 'Accounts' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Everyone in the workspace' })).toBeChecked();
    await userEvent.clear(name);
    await userEvent.type(name, 'Renewal risk Q4');
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    await waitFor(() => expect(where()).toBe('/segments/7'));
    expect(requests(spy, 'PATCH', /^\/segments\/7\/$/).map((request) => request.body)).toEqual([{ name: 'Renewal risk Q4' }]);
  });

  it("renames a segment whose rule names a record I can't open without resending its rules", async () => {
    const spy = stubSegments({ segments: [{ ...EMEA_ACCOUNTS, owner: ME, is_owner: true }] });
    renderSegments('/segments/8/edit');
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.type(name, ' Q4');
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    await waitFor(() => expect(where()).toBe('/segments/8'));
    expect(requests(spy, 'PATCH', /^\/segments\/8\/$/).map((request) => request.body)).toEqual([{ name: 'EMEA accounts Q4' }]);
  });

  it('sends the rules, and sharing with its people, only when they changed', async () => {
    const spy = stubSegments();
    renderSegments('/segments/7/edit');
    await screen.findByRole('textbox', { name: 'Name' });
    await userEvent.click(within(row(1)).getByRole('button', { name: 'Remove condition 1' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Only me' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save segment' }));
    await waitFor(() => expect(where()).toBe('/segments/7'));
    expect(requests(spy, 'PATCH', /^\/segments\/7\/$/).map((request) => request.body)).toEqual([
      { rules: { match: 'all', conditions: [RENEWAL_RISK.rules.conditions[1]] }, sharing: 'private', shared_with: [] },
    ]);
  });

  it("keeps someone else's segment read-only, with Open segment and Duplicate to edit", async () => {
    const spy = stubSegments();
    renderSegments('/segments/8/edit');
    expect(await screen.findByText('Only Carl CSM can edit this segment')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Name' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open segment' })).toHaveAttribute('href', '/segments/8');
    await userEvent.click(screen.getByRole('button', { name: 'Duplicate to edit' }));
    await waitFor(() => expect(where()).toBe('/segments/200/edit'));
    expect(await screen.findByRole('textbox', { name: 'Name' })).toHaveValue('EMEA accounts (copy)');
    expect(requests(spy, 'POST', /^\/segments\/8\/duplicate\/$/)).toHaveLength(1);
  });

  it('reads a segment that is not there as not found, with a link to All segments', async () => {
    stubSegments();
    renderSegments('/segments/99/edit');
    expect(await screen.findByText('Segment not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'All segments' })).toHaveAttribute('href', '/segments');
  });

  it("reads Dana's private segment, which isn't shared with me, as not found", async () => {
    stubSegments({ segments: [{ ...RENEWAL_RISK, id: 10, owner: { id: 5, name: 'Dana CSM' }, is_owner: false, sharing: 'private' }] });
    renderSegments('/segments/10/edit');
    expect(await screen.findByText('Segment not found')).toBeInTheDocument();
    expect(screen.queryByText(/can edit this segment/)).not.toBeInTheDocument();
  });

  it("clears the rules when a new segment's kind changes, since each kind has its own fields", async () => {
    stubSegments();
    renderSegments('/segments/new');
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(document.querySelectorAll('[data-condition]')).toHaveLength(1);
    await userEvent.click(screen.getByRole('radio', { name: 'Contacts' }));
    expect(document.querySelectorAll('[data-condition]')).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'Add condition' }));
    expect(within(row(1)).getByRole('combobox', { name: 'Condition 1 field' })).toHaveDisplayValue('Role');
  });

  it('puts the preview after the rules, side by side only from lg (stacked on phones)', async () => {
    stubSegments();
    renderSegments('/segments/new', { width: 375 });
    const rules = screen.getByRole('region', { name: 'Rules' });
    const preview = screen.getByRole('region', { name: 'Preview' });
    expect(rules.compareDocumentPosition(preview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rules.closest('[data-part="rules-and-preview"]')).toHaveClass('grid', 'lg:grid-cols-[minmax(0,1fr)_20rem]');
    expect(rules.closest('[data-part="rules-and-preview"]')?.className).not.toMatch(/(^|\s)(sm|md):grid-cols/);
  });
});
