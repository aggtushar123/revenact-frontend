import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Customer } from '../../../features/customers/customersSlice';
import { pizzaHutCustomer } from '../../../features/organizations/testStory';
import { CustomerFacts } from './CustomerFacts';

const band = (key: string, label: string, count: number, share: number) => ({ key, label, count, share });

const FULL = {
  ...pizzaHutCustomer,
  email: 'ap@pizzahut.example',
  phone: '+1 972 555 0100',
  industry: 'Restaurants',
  csat_breakdown: {
    responses: 8,
    bands: [
      band('very_satisfied', 'Very Satisfied', 3, 37.5),
      band('satisfied', 'Satisfied', 3, 37.5),
      band('neutral', 'Neutral', 2, 25),
      band('dissatisfied', 'Dissatisfied', 0, 0),
      band('very_dissatisfied', 'Very Dissatisfied', 0, 0),
    ],
  },
} as Customer;

function renderFacts(props: Partial<ComponentProps<typeof CustomerFacts>> = {}) {
  const onRetry = vi.fn();
  render(<CustomerFacts customer={FULL} error={null} stacked={false} onRetry={onRetry} {...props} />);
  return onRetry;
}

const value = (term: string) => screen.getByText(term).nextElementSibling as HTMLElement;

describe('CustomerFacts (spec §2: what GET /customers/{id}/ adds)', () => {
  it('shows the email and phone as links, and the industry', () => {
    renderFacts();
    const section = screen.getByRole('region', { name: 'Contact and CSAT' });
    expect(within(section).getByRole('link', { name: 'ap@pizzahut.example' })).toHaveAttribute('href', 'mailto:ap@pizzahut.example');
    expect(within(section).getByRole('link', { name: '+1 972 555 0100' })).toHaveAttribute('href', 'tel:+19725550100');
    expect(value('Industry')).toHaveTextContent('Restaurants');
  });

  // Round-1 fix, 2026-09-27: a stray "?"/"&"/"=" in the local part must not
  // be read as the mailto URL's own query string.
  it("encodes the email's local part before building its mailto: link", () => {
    renderFacts({ customer: { ...FULL, email: 'a?bcc=x@y.z' } });
    const section = screen.getByRole('region', { name: 'Contact and CSAT' });
    const link = within(section).getByRole('link', { name: 'a?bcc=x@y.z' });
    expect(link).toHaveAttribute('href', 'mailto:a%3Fbcc%3Dx@y.z');
  });

  it('shows a blank field as "—" with no link', () => {
    renderFacts({ customer: pizzaHutCustomer });
    for (const term of ['Email', 'Phone', 'Industry']) expect(value(term)).toHaveTextContent('—');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('spreads the CSAT responses across their bands at their true share', () => {
    renderFacts();
    expect(screen.getByText('CSAT responses').closest('p')).toHaveTextContent('8 CSAT responses');
    const rows = within(screen.getByRole('list', { name: 'CSAT responses by band' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Very Satisfied3 · 37.5%',
      'Satisfied3 · 37.5%',
      'Neutral2 · 25%',
      'Dissatisfied0 · 0%',
      'Very Dissatisfied0 · 0%',
    ]);
    expect(rows[2].querySelector('[data-share]')).toHaveStyle({ width: '25%' });
  });

  it('says when no CSAT survey has been answered', () => {
    renderFacts({ customer: pizzaHutCustomer });
    expect(screen.getByText('No CSAT survey has been answered yet.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'CSAT responses by band' })).not.toBeInTheDocument();
  });

  it('shows a skeleton while the record loads', () => {
    renderFacts({ customer: null });
    expect(screen.getByRole('status', { name: 'Loading contact details and CSAT' })).toBeInTheDocument();
  });

  it('shows the read error with Try again', async () => {
    const onRetry = renderFacts({ customer: null, error: 'Try later.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Try later.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('puts the two halves side by side from md unless stacked', () => {
    renderFacts({ stacked: true });
    expect(screen.getByText('Email').closest('[data-facts]')).not.toHaveClass('md:grid-cols-2');
  });
});
