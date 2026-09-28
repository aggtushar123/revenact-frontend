import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CONTACTS } from '../../../features/organizations/testStory';
import { PersonItem } from './PersonItem';

function renderItem(index: number, isSm = true, extra = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn() };
  render(
    <ul>
      <PersonItem contact={{ ...CONTACTS[index], ...extra }} isSm={isSm} {...handlers} />
    </ul>,
  );
  return handlers;
}

describe('PersonItem (spec 2026-09-27 §2)', () => {
  it('shows initials, name and role, how to reach them, the account, status, sentiment and last contact', () => {
    renderItem(0);
    const item = screen.getByRole('listitem');
    expect(within(item).getByText('DB')).toHaveClass('font-mono-brand');
    expect(within(item).getByRole('heading', { name: 'Dana Buyer' })).toBeInTheDocument();
    expect(within(item).getByText('Decision Maker')).toBeInTheDocument();
    expect(within(item).getByRole('link', { name: 'dana@emea.northwind.example' })).toHaveAttribute('href', 'mailto:dana@emea.northwind.example');
    expect(within(item).getByRole('link', { name: '+44 20 7946 0000' })).toHaveAttribute('href', 'tel:+442079460000');
    for (const text of ['EMEA', 'Active', 'Positive sentiment']) expect(within(item).getByText(text)).toBeInTheDocument();
    expect(within(item).getByText(/^Contacted .+ ago$/)).toBeInTheDocument();
  });

  it('tags a person on the organization itself, and says when nobody has been in touch', () => {
    renderItem(2);
    const item = screen.getByRole('listitem');
    for (const text of ['Organization', 'Inactive', 'Negative sentiment', 'Not contacted yet']) {
      expect(within(item).getByText(text)).toBeInTheDocument();
    }
    expect(within(item).queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows an address that could carry its own mailto query as text', () => {
    renderItem(0, true, { email: 'dana?cc=x@emea.northwind.example' });
    expect(screen.queryByRole('link', { name: /dana\?cc/ })).not.toBeInTheDocument();
    expect(screen.getByText('dana?cc=x@emea.northwind.example')).toBeInTheDocument();
  });

  it('edits and deletes through ⋯', async () => {
    const { onEdit, onDelete } = renderItem(0);
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Dana Buyer' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Dana Buyer' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('on phones: the links take their own line as 44px targets, and ⋯ is 44px', () => {
    renderItem(0, false);
    const email = screen.getByRole('link', { name: 'dana@emea.northwind.example' });
    expect(email).toHaveClass('min-h-11');
    expect(email.closest('[data-links]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Actions for Dana Buyer' })).toHaveClass('h-11', 'w-11');
  });
});
