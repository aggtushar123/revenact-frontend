import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeadlinesTab } from './HeadlinesTab';
import type { Headline } from '../../../features/customers/customersSlice';

// Unit tier (see the `testing` skill): the tab is fully presentational
// — ActivityFeed owns the fetch and passes the three props down, the
// same shape as NotesTab/TicketsTab.

function headline(overrides: Partial<Headline> = {}): Headline {
  return {
    id: 1,
    kind: 'headline',
    kind_display: 'Headline',
    title: 'Apple EMEA Retail Operations Renewal and Expansion',
    content: 'Comprehensive renewal process showing exceptional account health.',
    status: 'open',
    status_display: 'Open',
    period_start: '2025-11-20',
    period_end: '2026-01-21',
    time_period_label: '',
    data_sources: ['notes', 'emails'],
    data_sources_display: 'Notes and Emails',
    group: 'January 2026',
    generated_at: null,
    created_at: '2026-01-21T00:00:00Z',
    ...overrides,
  };
}

function summary(overrides: Partial<Headline> = {}): Headline {
  return headline({
    id: 2,
    kind: 'summary',
    kind_display: 'Summary',
    title: 'TL;DR (Last 3 months)',
    content: 'Account shows exceptional health with strong renewal momentum.',
    status: '',
    status_display: '',
    period_start: null,
    period_end: null,
    time_period_label: 'Last 3 months',
    data_sources: ['notes', 'emails', 'call_transcripts', 'tickets'],
    data_sources_display: 'Notes, Emails, Call Transcripts and Tickets',
    group: '',
    ...overrides,
  });
}

describe('HeadlinesTab', () => {
  it('shows a loading state while fetching', () => {
    render(<HeadlinesTab headlines={[]} isLoading error={null} />);
    expect(screen.getByText('Loading headlines…')).toBeInTheDocument();
  });

  it('shows the error instead of an empty tab when the fetch fails', () => {
    render(<HeadlinesTab headlines={[]} isLoading={false} error="Could not load headlines." />);
    expect(screen.getByText('Could not load headlines.')).toBeInTheDocument();
  });

  it('shows an empty state for an account with no headlines yet', () => {
    // The mock fell back to rendering *every* headline when its filter
    // came up empty, which is how one account's cards ended up on all
    // of them. An account with nothing now says so.
    render(<HeadlinesTab headlines={[]} isLoading={false} error={null} />);
    expect(screen.getByText('No headlines yet')).toBeInTheDocument();
  });

  it('renders the TL;DR above the feed, with its sources and time period', () => {
    render(<HeadlinesTab headlines={[summary(), headline()]} isLoading={false} error={null} />);

    expect(screen.getByText('TL;DR (Last 3 months)')).toBeInTheDocument();
    expect(screen.getByText('Notes, Emails, Call Transcripts and Tickets')).toBeInTheDocument();
    expect(screen.getByText('Last 3 months')).toBeInTheDocument();
  });

  it('groups feed cards under the pill the backend derived', () => {
    render(<HeadlinesTab headlines={[headline()]} isLoading={false} error={null} />);
    expect(screen.getByText('January 2026')).toBeInTheDocument();
  });

  it('gives a storyline card its date span, not the summary footer', () => {
    // A generated headline carries data_sources too, so the mock's
    // "has sources? then it's the TL;DR" proxy would have swallowed
    // this card's dates.
    render(<HeadlinesTab headlines={[headline()]} isLoading={false} error={null} />);

    expect(screen.getByText(/20 Nov 2025/)).toBeInTheDocument();
    expect(screen.getByText(/21 Jan 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Data sources:/)).not.toBeInTheDocument();
  });

  it('shows the real status label, not a hardcoded one', () => {
    render(
      <HeadlinesTab
        headlines={[headline({ status: 'closed', status_display: 'Closed' })]}
        isLoading={false}
        error={null}
      />
    );
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('collapses and reopens a card', async () => {
    const user = userEvent.setup();
    render(<HeadlinesTab headlines={[headline()]} isLoading={false} error={null} />);

    await user.click(screen.getByRole('button', { name: /Hide details/ }));
    expect(
      screen.queryByText('Comprehensive renewal process showing exceptional account health.')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show details/ }));
    expect(
      screen.getByText('Comprehensive renewal process showing exceptional account health.')
    ).toBeInTheDocument();
  });

  it('orders groups newest-first', () => {
    const older = headline({ id: 3, period_end: '2025-06-30', group: 'June 2025' });
    render(<HeadlinesTab headlines={[older, headline()]} isLoading={false} error={null} />);

    const pills = screen.getAllByText(/^(January 2026|June 2025)$/);
    expect(pills.map((el) => el.textContent)).toEqual(['January 2026', 'June 2025']);
  });

  it('still renders a card with no period to group under', () => {
    render(
      <HeadlinesTab
        headlines={[headline({ group: '', period_start: null, period_end: null })]}
        isLoading={false}
        error={null}
      />
    );
    expect(
      screen.getByText('Apple EMEA Retail Operations Renewal and Expansion')
    ).toBeInTheDocument();
  });
});
