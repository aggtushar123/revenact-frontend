import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NO_FILTERS, type ContactsParams } from '../../features/contacts/contactsParams';
import { CUSTOMERS, stubContactsApi } from '../../features/contacts/testContacts';
import { ContactsToolbar } from './ContactsToolbar';

const SUMMARY = { total: 142, positive: 87, neutral: 43, negative: 12, decision_makers: 38, active: 120, growth_30d_pct: 12.5 };

function renderToolbar(params: ContactsParams = NO_FILTERS, extra: Partial<Parameters<typeof ContactsToolbar>[0]> = {}) {
  const handlers = { onChange: vi.fn(), onAdd: vi.fn() };
  const view = render(
    <ContactsToolbar params={params} summary={SUMMARY} organisations={CUSTOMERS} organisationName={null} isSm {...handlers} {...extra} />,
  );
  return { ...handlers, view };
}

describe('ContactsToolbar (spec 2026-09-28 §3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('leads with the summary line', () => {
    stubContactsApi();
    renderToolbar();
    expect(document.querySelector('[data-summary]')).toHaveTextContent(
      '142 people · 38 decision makers · 120 active · 61% positive · 12 negative · +12.5% growth (30d)',
    );
  });

  it('an organisation filters and clears the account; the account waits for an organisation', async () => {
    stubContactsApi();
    const { onChange } = renderToolbar({ ...NO_FILTERS, sentiment: 'negative' });
    expect(screen.getByLabelText('Account')).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Organisation'), 'Kraft Heinz');
    expect(onChange).toHaveBeenCalledWith({ ...NO_FILTERS, sentiment: 'negative', customer: '6' });
  });

  it("offers the chosen organisation's accounts", async () => {
    stubContactsApi();
    const { onChange } = renderToolbar({ ...NO_FILTERS, customer: '6' });
    const account = screen.getByLabelText('Account');
    expect(account).toBeEnabled();
    await within(account).findByRole('option', { name: 'Kraft Heinz EMEA' });
    await userEvent.selectOptions(account, 'Kraft Heinz EMEA');
    expect(onChange).toHaveBeenCalledWith({ ...NO_FILTERS, customer: '6', account: '31' });
  });

  it('keeps a chosen organisation that is not on the first page', () => {
    stubContactsApi();
    renderToolbar({ ...NO_FILTERS, customer: '99' }, { organisationName: 'Globex' });
    expect(screen.getByLabelText('Organisation')).toHaveDisplayValue('Globex');
  });

  it('names a deep-linked organisation that is not on the first page by reading it, never "Organisation 99"', async () => {
    const spy = stubContactsApi({ moreCustomers: [{ id: 99, name: 'Globex' }] });
    renderToolbar({ ...NO_FILTERS, customer: '99' });
    await waitFor(() => expect(screen.getByLabelText('Organisation')).toHaveDisplayValue('Globex'));
    expect(spy.mock.calls.map(([input]) => new URL(String(input)).pathname)).toContain('/api/v1/customers/99/');
    expect(screen.queryByText('Organisation 99')).toBeNull();
  });

  it('an organisation or account that cannot be found says so', async () => {
    stubContactsApi();
    renderToolbar({ ...NO_FILTERS, customer: '98', account: '97' });
    await waitFor(() => expect(screen.getByLabelText('Organisation')).toHaveDisplayValue('Organisation not found'));
    await waitFor(() => expect(screen.getByLabelText('Account')).toHaveDisplayValue('Account not found'));
    expect(screen.queryByText(/^(Organisation|Account) 9\d$/)).toBeNull();
  });

  it('a deep-linked account takes its name from the account list', async () => {
    const spy = stubContactsApi();
    renderToolbar({ ...NO_FILTERS, customer: '6', account: '32' });
    await waitFor(() => expect(screen.getByLabelText('Account')).toHaveDisplayValue('Kraft Heinz NA'));
    // The organisation is on the first page: it is not read again.
    expect(spy.mock.calls.map(([input]) => new URL(String(input)).pathname)).not.toContain('/api/v1/customers/6/');
  });

  it('filters by sentiment and role', async () => {
    stubContactsApi();
    const { onChange } = renderToolbar();
    await userEvent.selectOptions(screen.getByLabelText('Sentiment'), 'Negative');
    expect(onChange).toHaveBeenLastCalledWith({ ...NO_FILTERS, sentiment: 'negative' });
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'Champion');
    expect(onChange).toHaveBeenLastCalledWith({ ...NO_FILTERS, role: 'champion' });
  });

  it('searches once typing stops, replacing the history entry', async () => {
    stubContactsApi();
    const { onChange } = renderToolbar();
    await userEvent.type(screen.getByLabelText('Search people'), 'luk');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ ...NO_FILTERS, q: 'luk' }, true));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('the search box follows the URL', () => {
    stubContactsApi();
    const { view, onChange, onAdd } = renderToolbar({ ...NO_FILTERS, q: 'luk' });
    view.rerender(
      <ContactsToolbar params={NO_FILTERS} summary={SUMMARY} organisations={CUSTOMERS} organisationName={null} isSm onChange={onChange} onAdd={onAdd} />,
    );
    expect(screen.getByLabelText('Search people')).toHaveValue('');
  });

  it('shows a visible label above each filter select, tied to it (house rule §4.8, fix round 1)', () => {
    stubContactsApi();
    renderToolbar();
    for (const name of ['Organisation', 'Account', 'Sentiment', 'Role']) {
      const select = screen.getByLabelText(name);
      const label = screen.getByText(name, { selector: 'label' });
      expect(label).not.toHaveClass('sr-only');
      expect(label).toHaveClass('uppercase', 'text-ink-muted');
      expect(label).toHaveAttribute('for', select.id);
    }
  });

  it('+ Add opens the form; every control is a 44px target on phones', async () => {
    stubContactsApi();
    const { onAdd } = renderToolbar();
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalledOnce();
    for (const name of ['Organisation', 'Account', 'Sentiment', 'Role']) expect(screen.getByLabelText(name)).toHaveClass('min-h-11', 'sm:min-h-9');
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass('min-h-11');
  });
});
