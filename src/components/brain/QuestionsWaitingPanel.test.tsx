import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuestionsWaitingPanel } from './QuestionsWaitingPanel';

const base = {
  customer: { id: 7, name: 'Pizza Hut' },
  asked_by: { id: 1, name: 'Alice Admin', function: 'leadership' as const },
  status: 'open' as const, status_display: 'Open', answer: null, message_id: null, answered_at: null,
  created_at: '2026-09-10T09:00:00Z',
};
const rows = [
  { ...base, id: 1, assignee: { id: 5, name: 'Mei Tanaka', function: 'analytics' as const }, text: 'Why is usage down?', days_open: 1 },
  { ...base, id: 2, assignee: { id: 6, name: 'Raj Mehta', function: 'sales' as const }, text: 'Renewal response?', days_open: 5 },
];

describe('QuestionsWaitingPanel', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('lists open questions oldest first and marks the stale ones', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => rows })));
    render(<MemoryRouter><QuestionsWaitingPanel /></MemoryRouter>);

    const items = await screen.findAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Renewal response?');
    expect(items[0]).toHaveTextContent('5 days waiting');
    expect(items[0]).toHaveClass('border-l-warning');
    expect(items[1]).toHaveTextContent('1 day waiting');
    expect(screen.getByText(/2 open/)).toBeInTheDocument();
    expect(screen.getByText(/1 over 3 days/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Pizza Hut' })[0]).toHaveAttribute('href', '/organizations/7');
  });

  it('says so when nothing is waiting', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => [] })));
    render(<MemoryRouter><QuestionsWaitingPanel /></MemoryRouter>);
    expect(await screen.findByText(/Every question asked has been answered/)).toBeInTheDocument();
  });
});
