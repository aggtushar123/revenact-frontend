import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { postedBodies } from '../../../components/copilot/testCopilot';
import { resetViewport } from '../../../test/viewport';
import { renderOrganizationPage } from '../testDetail';
import { stubOrganizationPageAsk } from './testOrganizationsAsk';

// Integration tier: the real organisation page under OrganizationsAskLayout,
// the real rail and pill, store and router; fetch answers the page and the
// Copilot with contract-shaped bodies (backend delivery 3).
const rail = () => screen.queryByRole('complementary', { name: 'Ask Revenact' });
const composer = () => screen.getByPlaceholderText('Ask Revenact');
const heading = () => screen.findByRole('heading', { level: 1, name: 'Pizza Hut' });
const column = () => document.querySelector('[data-part="column"]') as HTMLElement;
const page = { surface: 'organizations', view: 'detail', organization: 7 };

describe('Ask Revenact on the organisation page', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it("keeps the page's full width and 24px gutter while the rail is closed, in one frame", async () => {
    stubOrganizationPageAsk();
    renderOrganizationPage('/organizations/7', { ask: true, width: 1100 });
    await heading();
    expect(rail()).not.toBeInTheDocument();
    expect(within(screen.getByTestId('nav-actions')).getByRole('button', { name: 'Show Copilot' })).toHaveAttribute('aria-pressed', 'false');
    expect(column()).toHaveClass('w-full', 'max-w-[1800px]', 'mx-auto');
    expect(column().parentElement).toHaveClass('flex-1', 'min-w-0', 'px-4', 'sm:px-0');
    expect(column().parentElement!.parentElement).toHaveClass('px-0', 'sm:px-6');
    // The layout's frame is the only one: the page's own passes through.
    expect(document.querySelectorAll('[data-part="column"]')).toHaveLength(1);
    expect(column().parentElement!.parentElement!.parentElement!.closest('.sm\\:px-6')).toBeNull();
  });

  it('puts the glass rail beside the page from xl, and the page reflows beside it', async () => {
    stubOrganizationPageAsk();
    renderOrganizationPage('/organizations/7', { ask: true });
    await heading();
    const frame = column().parentElement!.parentElement!;
    expect(rail()).toHaveClass('w-[320px]');
    expect(frame).toContainElement(rail());
    expect(column().parentElement!.contains(rail())).toBe(false);
    expect(within(rail()!).getByRole('region', { name: 'Ask Revenact conversation' })).toHaveClass('rv-card-glass');
    // Glass is the rail's alone: the page's surfaces stay solid.
    expect(document.querySelectorAll('.rv-card-glass')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Hide Copilot' }));
    await waitFor(() => expect(rail()).not.toBeInTheDocument());
  });

  it('reads "Pizza Hut", then "Pizza Hut · EMEA" when the account chip is chosen', async () => {
    stubOrganizationPageAsk();
    renderOrganizationPage('/organizations/7', { ask: true });
    await heading();
    expect(await within(rail()!).findByText('Pizza Hut')).toBeInTheDocument();
    const chips = await screen.findByRole('group', { name: 'Filter by account' });
    await userEvent.click(await within(chips).findByRole('button', { name: /^EMEA/ }));
    expect(await within(rail()!).findByText('Pizza Hut · EMEA')).toBeInTheDocument();
    // Details is the whole organisation's: no chips there, and no account.
    await userEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(await within(rail()!).findByText('Pizza Hut')).toBeInTheDocument();
  });

  it("asks with the page's context, and the question keeps the server's label", async () => {
    const { copilot } = stubOrganizationPageAsk({ copilot: { label: () => 'Pizza Hut · EMEA' } });
    renderOrganizationPage('/organizations/7?account=31', { ask: true });
    await heading();
    await within(rail()!).findByText('Pizza Hut · EMEA');
    await userEvent.type(composer(), 'What changed this month?{enter}');
    await screen.findByText('Answer to: What changed this month?');
    expect(postedBodies(copilot)[0]).toEqual({ content: 'What changed this month?', context: { ...page, account: 31, focus: null } });
    const log = screen.getByRole('log', { name: 'Ask Revenact messages' });
    expect(within(log).getByText('Pizza Hut · EMEA')).toBeInTheDocument();
  });

  it('keeps one conversation from the List into the organisation and back', async () => {
    stubOrganizationPageAsk();
    renderOrganizationPage('/organizations/list', { ask: true, list: true, history: true });
    await screen.findByRole('link', { name: 'Pizza Hut' });
    await userEvent.type(composer(), 'Who renews first?{enter}');
    await screen.findByText('Answer to: Who renews first?');
    await userEvent.click(screen.getByRole('link', { name: 'Pizza Hut' }));
    await heading();
    const log = screen.getByRole('log', { name: 'Ask Revenact messages' });
    expect(within(log).getByText('Answer to: Who renews first?')).toBeInTheDocument();
    await userEvent.type(composer(), 'And here?{enter}');
    expect(await within(log).findByText('Answer to: And here?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }));
    await screen.findByRole('link', { name: 'Pizza Hut' });
    expect(within(screen.getByRole('log', { name: 'Ask Revenact messages' })).getByText('Answer to: And here?')).toBeInTheDocument();
  });
});
