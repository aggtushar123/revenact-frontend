import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { KnowledgeByFunctionPanel } from './KnowledgeByFunctionPanel';

const payload = {
  days: 30, since: '2026-08-14',
  functions: [
    { function: 'cs', label: 'Customer Success', members: 2, contributors: 0, contributions: 0, questions_asked: 0, questions_answered: 0, questions_waiting: 0, avg_days_to_answer: null },
    { function: 'analytics', label: 'Analytics', members: 1, contributors: 1, contributions: 3, questions_asked: 2, questions_answered: 1, questions_waiting: 1, avg_days_to_answer: 2 },
    { function: 'other', label: 'Other', members: 0, contributors: 0, contributions: 0, questions_asked: 0, questions_answered: 0, questions_waiting: 0, avg_days_to_answer: null },
  ],
};

describe('KnowledgeByFunctionPanel', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows each staffed function, flags the silent ones, and hides the empty ones', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => payload })));
    render(<KnowledgeByFunctionPanel />);

    const analytics = await screen.findByRole('row', { name: 'Analytics' });
    const cells = within(analytics).getAllByRole('cell').map((c) => c.textContent);
    expect(cells).toEqual(['Analytics', '1', '1', '3', '2', '1', '1', '2']);
    const cs = screen.getByRole('row', { name: 'Customer Success' });
    expect(cs).toHaveTextContent('nothing yet');
    expect(screen.queryByRole('row', { name: 'Other' })).not.toBeInTheDocument();
    expect(screen.getByText(/last 30 days/)).toBeInTheDocument();
  });
});
