import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import { MIRA, requested, stubContactsApi, type ContactsStub } from '../../features/contacts/testContacts';
import { ContactProfile } from './ContactProfile';

function renderProfile(id = 41, stub: ContactsStub = {}) {
  const spy = stubContactsApi(stub);
  const store = configureStore({ reducer: { customers: customersReducer } });
  const onDeleted = vi.fn();
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ContactProfile id={id} onDeleted={onDeleted} />
      </MemoryRouter>
    </Provider>,
  );
  return { spy, store, onDeleted };
}

describe('ContactProfile (spec 2026-09-28 §3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a skeleton, then who they are, where they sit and how to reach them', async () => {
    renderProfile();
    expect(screen.getByRole('status', { name: 'Loading this person' })).toBeInTheDocument();
    const profile = await screen.findByRole('article', { name: 'Lukas Vermeer' });
    expect(within(profile).getByRole('heading', { level: 2, name: 'Lukas Vermeer' })).toHaveClass('text-[22px]');
    expect(within(profile).getByText('Champion')).toBeInTheDocument();
    expect(within(profile).getByRole('link', { name: 'Kraft Heinz' })).toHaveAttribute('href', '/organizations/6');
    expect(within(profile).getByRole('link', { name: 'Kraft Heinz EMEA' })).toHaveAttribute('href', '/organizations/6?account=31');
    expect(within(profile).getByRole('link', { name: 'lukas@kraftheinz.example' })).toHaveAttribute('href', 'mailto:lukas@kraftheinz.example');
    expect(within(profile).getByRole('link', { name: '+44 20 7946 0001' })).toHaveAttribute('href', 'tel:+442079460001');
  });

  it('says what the sentiment rests on; "Why this sentiment?" waits for Ask (delivery 2)', async () => {
    renderProfile();
    const sentiment = await screen.findByRole('region', { name: 'Sentiment' });
    expect(sentiment).toHaveTextContent('Neutral: 3 positive · 2 neutral · 1 negative across 6 calls and 2 emails, latest 12 Sep');
    expect(screen.queryByRole('button', { name: /why this sentiment/i })).toBeNull();
  });

  it('lists calls newest first with their reading, then emails and tickets', async () => {
    const { spy } = renderProfile();
    const calls = await screen.findByRole('region', { name: /^Calls/ });
    const items = within(calls).getAllByRole('listitem');
    expect(items.map((item) => within(item).getByRole('heading').textContent)).toEqual(['Renewal readiness', 'Call', 'Kick-off']);
    expect(within(items[0]).getByText('Positive')).toBeInTheDocument();
    expect(within(items[1]).getByText('Not enough to analyse')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /^Emails/ })).getByText('Thanks for the call')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /^Tickets/ })).getByText('ZD-1042')).toBeInTheDocument();
    expect(requested(spy)).toEqual(['/contacts/41/', '/contacts/41/history/']);
  });

  it('says when there is nothing yet, and when a hand-set sentiment rests on nothing', async () => {
    renderProfile(MIRA.id);
    await screen.findByRole('article', { name: 'Mira Patel' });
    expect(screen.getByText('Positive, set by hand. Nothing of theirs has been analysed yet.')).toBeInTheDocument();
    for (const text of ['No calls with them yet.', 'No emails from them you can see.', 'No tickets from them you can see.']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('a person the viewer cannot open reads as not here', async () => {
    renderProfile(999);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not open this person');
    expect(screen.getByRole('alert')).toHaveTextContent('on an account you cannot open');
  });

  it('a failed history read offers Try again', async () => {
    renderProfile(41, { failHistory: 1 });
    expect(await screen.findByRole('alert')).toHaveTextContent('Try later.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('article', { name: 'Lukas Vermeer' })).toBeInTheDocument();
  });

  it('edits through the existing form', async () => {
    const { store } = renderProfile();
    await screen.findByRole('article', { name: 'Lukas Vermeer' });
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const name = screen.getByLabelText(/^Name/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Lukas V.');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Lukas V.' })).toBeInTheDocument();
    expect(store.getState().customers.selectedContact?.name).toBe('Lukas V.');
  });

  it('deletes after confirming, then hands back to the page', async () => {
    const { spy, onDeleted } = renderProfile();
    await screen.findByRole('article', { name: 'Lukas Vermeer' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByText('Delete Lukas Vermeer?').closest('div')!.parentElement!;
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    expect(onDeleted).toHaveBeenCalledOnce();
    expect(spy.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === 'DELETE')).toBe(true);
  });

  it('keeps 44px targets on phones', async () => {
    renderProfile();
    await screen.findByRole('article', { name: 'Lukas Vermeer' });
    for (const name of ['Edit', 'Delete']) expect(screen.getByRole('button', { name })).toHaveClass('min-h-11', 'sm:min-h-9');
    expect(screen.getByRole('link', { name: 'Kraft Heinz' })).toHaveClass('min-h-11');
  });
});
