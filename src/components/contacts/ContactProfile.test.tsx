import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import { LUKAS, MIRA, emptyHistory, requested, stubContactsApi, type ContactsStub } from '../../features/contacts/testContacts';
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

  it('says whether they are active, when they were last contacted and when their sentiment was read, on phones too', async () => {
    renderProfile();
    const profile = await screen.findByRole('article', { name: 'Lukas Vermeer' });
    expect(within(profile).getByText('Active')).toBeInTheDocument();
    const contacted = within(profile).getByText(/^Last contacted .+ ago$/);
    const read = within(profile).getByText(/^Sentiment read .+ ago$/);
    for (const el of [contacted, read]) {
      for (let node: Element | null = el; node && node !== profile; node = node.parentElement) {
        expect(node.className).not.toMatch(/(^|\s)hidden(\s|$)/);
      }
    }
  });

  it('a hand-set sentiment has no reading time; nobody in touch says so; inactive shows', async () => {
    renderProfile(MIRA.id, { people: [{ ...MIRA, status: 'inactive' }] });
    const profile = await screen.findByRole('article', { name: 'Mira Patel' });
    expect(within(profile).getByText('Inactive')).toBeInTheDocument();
    expect(within(profile).getByText('Not contacted yet')).toBeInTheDocument();
    expect(within(profile).queryByText(/^Sentiment read/)).toBeNull();
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
    expect(screen.getByText('Positive. Set by hand.')).toBeInTheDocument();
    for (const text of ['No calls with them yet.', 'No emails from them you can see.', 'No tickets from them you can see.']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('a hand-set sentiment over analysed calls says they will be read again tonight', async () => {
    renderProfile(41, { people: [{ ...LUKAS, sentiment: 'negative', sentiment_source: 'manual', sentiment_evidence: {}, sentiment_computed_at: null }] });
    const sentiment = await screen.findByRole('region', { name: 'Sentiment' });
    expect(sentiment).toHaveTextContent('Negative. Set by hand; their calls will be read again tonight.');
    expect(sentiment).not.toHaveTextContent(/nothing of theirs/i);
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

  it('a phone telHref cannot use shows as plain text, like the email fallback (fix round 1, 2026-09-28)', async () => {
    renderProfile(41, { people: [{ ...LUKAS, phone: 'Ask reception' }] });
    const profile = await screen.findByRole('article', { name: 'Lukas Vermeer' });
    expect(within(profile).queryByRole('link', { name: 'Ask reception' })).toBeNull();
    expect(within(profile).getByText('Ask reception')).toBeInTheDocument();
  });

  it("switching people: the previous person's stale error and history never show, and the new person's own history lands (fix round 1, 2026-09-28)", async () => {
    const attrIds = (attr: string) => [...document.querySelectorAll(`[${attr}]`)].map((el) => el.getAttribute(attr));
    let releaseLukasHistory: () => void = () => {};
    const heldLukasHistory = new Promise<void>((resolve) => {
      releaseLukasHistory = resolve;
    });
    const spy = vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname.replace(/^\/api\/v1/, '');
      if (path === '/contacts/41/') return { ok: true, status: 200, json: async () => LUKAS };
      if (path === '/contacts/41/history/') {
        await heldLukasHistory;
        return { ok: false, status: 500, json: async () => ({ detail: 'Try later.' }) };
      }
      if (path === '/contacts/42/') return { ok: true, status: 200, json: async () => MIRA };
      if (path === '/contacts/42/history/') return { ok: true, status: 200, json: async () => emptyHistory(MIRA) };
      return { ok: false, status: 404, json: async () => ({ detail: 'Not found.' }) };
    });
    vi.stubGlobal('fetch', spy);
    const store = configureStore({ reducer: { customers: customersReducer } });
    const wrap = (id: number) => (
      <Provider store={store}>
        <MemoryRouter>
          <ContactProfile id={id} onDeleted={vi.fn()} />
        </MemoryRouter>
      </Provider>
    );
    const view = render(wrap(41));
    // Lukas's contact loads, but his history is held: still the skeleton,
    // not his profile (which needs both) — the same moment a real user
    // could click away to another person.
    await screen.findByRole('status', { name: 'Loading this person' });
    expect(screen.queryByRole('article')).toBeNull();

    // Move to Mira while Lukas's history is still in flight (and about to fail).
    view.rerender(wrap(42));
    await screen.findByRole('article', { name: 'Mira Patel' });
    expect(attrIds('data-history-call')).toEqual([]);
    expect(screen.queryByRole('alert')).toBeNull();

    // Lukas's slow, failing history reply lands late: it must never surface.
    await act(async () => releaseLukasHistory());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(attrIds('data-history-call')).toEqual([]);
    expect(screen.getByRole('article', { name: 'Mira Patel' })).toBeInTheDocument();
  });
});
