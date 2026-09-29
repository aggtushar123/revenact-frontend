import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Contact } from '../../features/customers/customersSlice';
import { LUKAS, MIRA, OWEN } from '../../features/contacts/testContacts';
import { ContactListItem } from './ContactListItem';

function renderItem(contact: Contact, selected = false) {
  render(
    <MemoryRouter>
      <ul>
        <ContactListItem contact={contact} to={{ pathname: `/contacts/${contact.id}`, search: '?role=champion' }} selected={selected} />
      </ul>
    </MemoryRouter>,
  );
  return screen.getByRole('listitem');
}

describe('ContactListItem (spec 2026-09-28 §3)', () => {
  it('shows initials, name and role, organisation › account, sentiment with n calls, and last contact', () => {
    const item = renderItem(LUKAS);
    expect(within(item).getByText('LV')).toHaveClass('font-mono-brand');
    for (const text of ['Lukas Vermeer', 'Champion', 'Kraft Heinz › Kraft Heinz EMEA', '6 calls']) {
      expect(within(item).getByText(text)).toBeInTheDocument();
    }
    expect(within(item).getByText('Neutral')).toHaveClass('text-ink-muted');
    expect(within(item).getByText(/^Contacted .+ ago$/)).toBeInTheDocument();
    expect(within(item).getByText('Active')).toBeInTheDocument();
  });

  it('says when someone is inactive', () => {
    const owen = renderItem(OWEN);
    expect(within(owen).getByText('Inactive')).toBeInTheDocument();
    expect(within(owen).queryByText('Active')).toBeNull();
  });

  it('names the organisation alone when they are on it, says where a hand-set sentiment came from, and when nobody has been in touch', () => {
    const mira = renderItem(MIRA);
    expect(within(mira).getByText('Pizza Hut')).toBeInTheDocument();
    expect(within(mira).getByText('Positive')).toHaveClass('text-success');
    expect(within(mira).getByText('set by hand')).toBeInTheDocument();
    expect(within(mira).getByText('Not contacted yet')).toBeInTheDocument();
    document.body.innerHTML = '';
    expect(within(renderItem(OWEN)).getByText('Negative')).toHaveClass('text-danger');
  });

  it('falls back to the old sentiment_evidence shape for the calls count, and never throws with neither', () => {
    const old = { ...LUKAS, calls: undefined, sentiment_evidence: { score: 0.1, calls: 4, emails: 2, tickets: 0, positive: 2, neutral: 1, negative: 1, latest_at: null } };
    expect(within(renderItem(old)).getByText('4 calls')).toBeInTheDocument();
    document.body.innerHTML = '';
    const bare = { ...LUKAS, calls: undefined, sentiment_evidence: undefined };
    expect(() => renderItem(bare)).not.toThrow();
    expect(within(screen.getByRole('listitem')).getByText('no calls')).toBeInTheDocument();
  });

  it('opens their profile, keeping the filters, and marks the one open', () => {
    const item = renderItem(LUKAS, true);
    const link = within(item).getByRole('link');
    expect(link).toHaveAttribute('href', '/contacts/41?role=champion');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveClass('min-h-11', 'bg-subtle');
    document.body.innerHTML = '';
    expect(within(renderItem(LUKAS)).getByRole('link')).not.toHaveAttribute('aria-current');
  });
});
