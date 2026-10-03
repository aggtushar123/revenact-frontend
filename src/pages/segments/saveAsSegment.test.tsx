import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { stubAccountsPortfolio } from '../../features/accounts/testPortfolio';
import { stubContactsApi } from '../../features/contacts/testContacts';
import { resetMembersCache } from '../../features/knowledge/useMembers';
import { stubPortfolio } from '../../features/organizations/testPortfolio';
import { resetViewport } from '../../test/viewport';
import { renderAccounts } from '../accounts/testList';
import { renderContactsPage } from '../contacts/testPage';
import { renderList } from '../organizations/testList';

const where = () => screen.getByTestId('where').textContent;

// Spec §3: "Save as segment" beside Filters turns the list's current URL
// filters into a new segment's rules and opens the builder (plan Decision 5).
describe('Save as segment on the lists', () => {
  afterEach(() => {
    resetMembersCache();
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('opens the builder from Organizations with the kind and the list\'s own filters, search included for its note', async () => {
    stubPortfolio();
    renderList('/organizations/list?owner=2&health=poor&search=pizza');
    await userEvent.click(await screen.findByRole('button', { name: 'Save as segment' }));
    await waitFor(() => expect(where()).toBe('/segments/new?kind=customer&search=pizza&owner=2&health=poor'));
  });

  it('opens the builder from Accounts with its organisation filter', async () => {
    stubAccountsPortfolio();
    renderAccounts('/accounts/list?organisation=7');
    await userEvent.click(await screen.findByRole('button', { name: 'Save as segment' }));
    await waitFor(() => expect(where()).toBe('/segments/new?kind=account&organisation=7'));
  });

  it('opens the builder from Contacts with its organisation and role', async () => {
    stubContactsApi();
    renderContactsPage('/contacts?customer=6&role=champion');
    await userEvent.click(await screen.findByRole('button', { name: 'Save as segment' }));
    await waitFor(() => expect(where()).toBe('/segments/new?kind=contact&customer=6&role=champion'));
  });
});
