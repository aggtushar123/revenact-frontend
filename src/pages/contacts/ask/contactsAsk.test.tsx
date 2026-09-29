import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { postedBodies } from '../../../components/copilot/testCopilot';
import { resetViewport } from '../../../test/viewport';
import { renderContactsPage } from '../testPage';
import { stubContactsAsk } from './testContactsAsk';

// Integration tier: the real Contacts page under ContactsAskLayout, the real
// rail and pill, store and router; fetch answers the Contacts API and the
// Copilot with contract-shaped bodies (backend #72).
const rail = () => screen.queryByRole('complementary', { name: 'Ask Revenact' });
const composer = () => screen.getByPlaceholderText('Ask Revenact');
const pill = () => within(screen.getByTestId('nav-actions'));

describe('Ask Revenact on Contacts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('puts the glass rail beside the page from xl, in one frame, with the pill in the top bar', async () => {
    stubContactsAsk();
    renderContactsPage('/contacts', { ask: true });
    await screen.findByText('Lukas Vermeer');
    expect(rail()).toHaveClass('w-[320px]');
    expect(document.querySelectorAll('[data-frame="contacts"]')).toHaveLength(1);
    expect(document.querySelectorAll('.rv-card-glass')).toHaveLength(1);
    expect(pill().getByRole('button', { name: 'Hide Copilot' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(pill().getByRole('button', { name: 'Hide Copilot' }));
    await waitFor(() => expect(rail()).not.toBeInTheDocument());
  });

  it('asks about the filtered list, sending only the set filters', async () => {
    const { copilot } = stubContactsAsk();
    renderContactsPage('/contacts?sentiment=negative', { ask: true });
    expect(await within(rail()!).findByText('Contacts · Negative')).toBeInTheDocument();
    await userEvent.type(composer(), 'Who is unhappy?{Enter}');
    await waitFor(() => expect(postedBodies(copilot)).toHaveLength(1));
    expect(postedBodies(copilot)[0].context).toEqual({ surface: 'contacts', view: 'list', filters: { sentiment: 'negative' } });
  });

  it('asks about the open person, named from the page before the server labels it', async () => {
    const { copilot } = stubContactsAsk();
    renderContactsPage('/contacts/41', { ask: true });
    expect(await within(rail()!).findByText('Lukas Vermeer · Kraft Heinz › Kraft Heinz EMEA')).toBeInTheDocument();
    await userEvent.type(composer(), 'How is Lukas?{Enter}');
    await waitFor(() => expect(postedBodies(copilot)).toHaveLength(1));
    expect(postedBodies(copilot)[0].context).toEqual({ surface: 'contacts', view: 'person', contact: 41, focus: null });
  });

  it('moves the chip to the next person without re-labelling an answer already given', async () => {
    stubContactsAsk({ copilot: { label: (c) => (c.view === 'person' ? `Person ${c.contact}` : 'Contacts') } });
    renderContactsPage('/contacts/41', { ask: true });
    await within(rail()!).findByText('Lukas Vermeer · Kraft Heinz › Kraft Heinz EMEA');
    await userEvent.type(composer(), 'How is Lukas?{Enter}');
    expect(await within(rail()!).findByText('Person 41')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /Mira Patel/ }));
    expect(await within(rail()!).findByText('Mira Patel · Pizza Hut')).toBeInTheDocument();
    expect(within(rail()!).getByText('Person 41')).toBeInTheDocument();
  });

  it("refuses a person the asker can't open, keeping the question", async () => {
    stubContactsAsk({ copilot: { refuse: { contact: ['Not a person you can open.'] } } });
    renderContactsPage('/contacts/41', { ask: true });
    await within(rail()!).findByText('Lukas Vermeer · Kraft Heinz › Kraft Heinz EMEA');
    await userEvent.type(composer(), 'How is Lukas?{Enter}');
    expect(await within(rail()!).findByText("You can't ask about this person here.")).toBeInTheDocument();
    expect(within(rail()!).getByText('How is Lukas?')).toBeInTheDocument();
  });

  it('opens as a sheet below sm, from the pill', async () => {
    stubContactsAsk();
    renderContactsPage('/contacts', { ask: true, width: 375 });
    await screen.findByText('Lukas Vermeer');
    expect(rail()).not.toBeInTheDocument();
    await userEvent.click(pill().getByRole('button', { name: 'Show Copilot' }));
    expect(await screen.findByRole('dialog', { name: 'Ask Revenact' })).toBeInTheDocument();
  });
});
