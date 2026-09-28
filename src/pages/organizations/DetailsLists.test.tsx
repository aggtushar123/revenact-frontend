import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ORGANIZATION_LISTS, postBodies, stubOrganizationPage } from '../../features/organizations/testStory';
import { resetViewport } from '../../test/viewport';
import { renderOrganizationPage } from './testDetail';

// End to end in jsdom (spec 2026-09-27 §7): the real page, store and router;
// only fetch is stubbed. Choosing an account on the Story narrows People,
// Deals & risks and Files, the chips count each tab, and a file uploaded
// while the account is chosen lands on it.
const where = () => new URL(`http://x${screen.getByTestId('where').textContent}`);
const chips = () => screen.getByRole('group', { name: 'Filter by account' });
const chip = (name: string) => within(chips()).getByRole('button', { name });

describe('the organization page, delivery 2: the lists and the account chips', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it('narrows People, Deals & risks and Files to the chosen account, counting each tab, and uploads to it', async () => {
    const spy = stubOrganizationPage({ lists: ORGANIZATION_LISTS });
    renderOrganizationPage();
    await screen.findByRole('heading', { level: 1, name: 'Pizza Hut' });
    await userEvent.click(await within(chips()).findByRole('button', { name: 'EMEA 1' }));
    expect(where().searchParams.get('account')).toBe('31');

    await userEvent.click(screen.getByRole('tab', { name: 'People' }));
    const people = screen.getByRole('tabpanel', { name: 'People' });
    expect(await within(people).findByRole('heading', { name: 'Dana Buyer' })).toBeInTheDocument();
    expect(within(people).queryByText('Sam Admin')).not.toBeInTheDocument();
    await waitFor(() => expect(chip('All 3')).toBeInTheDocument());
    expect(chip('EMEA 1')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('North America 1')).toBeInTheDocument();
    expect(chip('Organization 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Deals & risks' }));
    const deals = screen.getByRole('tabpanel', { name: 'Deals & risks' });
    expect(await within(deals).findByText('EMEA seat expansion')).toBeInTheDocument();
    expect(within(deals).queryByText('Analytics add-on')).not.toBeInTheDocument();
    await waitFor(() => expect(chip('All 3')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('tab', { name: 'Files' }));
    const files = screen.getByRole('tabpanel', { name: 'Files' });
    expect(await within(files).findByText('Order form.pdf')).toBeInTheDocument();
    expect(within(files).queryByText('QBR deck.pptx')).not.toBeInTheDocument();
    expect(await within(files).findByText('EMEA renewal call')).toBeInTheDocument();
    expect(within(files).queryByText('Quarterly check-in')).not.toBeInTheDocument();
    await waitFor(() => expect(chip('All 4')).toBeInTheDocument());
    expect(chip('EMEA 2')).toBeInTheDocument();

    await userEvent.upload(within(files).getByLabelText('Choose files'), new File(['x'], 'Notes.txt', { type: 'text/plain' }));
    expect(await within(files).findByText('Notes.txt')).toBeInTheDocument();
    expect(postBodies(spy, '/customers/7/accounts/31/files/')).toHaveLength(1);
    await waitFor(() => expect(chip('EMEA 3')).toBeInTheDocument());
    expect(where().searchParams.get('account')).toBe('31');

    // Back on the Story, the chips count story items again.
    await userEvent.click(screen.getByRole('tab', { name: 'Story' }));
    expect(chip('EMEA 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(screen.queryByRole('group', { name: 'Filter by account' })).not.toBeInTheDocument();
  });

  it('renders the phone layouts at 375px: links on their own line, no board, 44px chips', async () => {
    stubOrganizationPage({ lists: ORGANIZATION_LISTS });
    renderOrganizationPage('/organizations/7?tab=people', { width: 375 });
    const email = await screen.findByRole('link', { name: 'dana@emea.northwind.example' });
    expect(email).toHaveClass('min-h-11');
    expect(email.closest('[data-links]')).not.toBeNull();
    for (const button of within(chips()).getAllByRole('button')) expect(button).toHaveClass('min-h-11');
    const header = document.querySelector('[data-part="header"]') as HTMLElement;
    expect(within(header).getByRole('button', { name: 'Add account' })).toHaveClass('min-w-11');
    await userEvent.click(screen.getByRole('tab', { name: 'Deals & risks' }));
    expect(await screen.findByText('EMEA seat expansion')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'View' })).not.toBeInTheDocument();
  });
});
