import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SessionsTab } from './SessionsTab';
import type { CopilotSession } from '../../../features/copilotSessions/types';

function session(overrides: Partial<CopilotSession> = {}): CopilotSession {
  return {
    id: 'sess-1',
    conversationId: 1,
    customerId: 7,
    accountName: 'Pizza Hut',
    ownerId: 1,
    ownerName: 'Carl',
    isLive: false,
    status: 'private',
    transcript: [{ kind: 'query', userId: 1, userName: 'Carl', text: 'Why is Pizza Hut at risk?', at: '2026-09-05T10:00:00Z' }],
    participants: [{ userId: 1, userName: 'Carl', joinedAt: '2026-09-05T10:00:00Z' }],
    createdAt: '2026-09-05T10:00:00Z',
    ...overrides,
  };
}

function renderTab(sessions: CopilotSession[]) {
  render(
    <MemoryRouter initialEntries={['/organizations/7']}>
      <Routes>
        <Route path="/organizations/7" element={<SessionsTab sessions={sessions} />} />
        <Route path="/copilot" element={<div>COPILOT PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SessionsTab', () => {
  it('shows an empty state with no sessions', () => {
    renderTab([]);
    expect(screen.getByText('No Copilot sessions yet')).toBeInTheDocument();
  });

  it('renders a session with its own query, owner, and status', () => {
    renderTab([session()]);
    expect(screen.getByText('Why is Pizza Hut at risk?')).toBeInTheDocument();
    expect(screen.getByText('Carl')).toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows a live session with a Live status pill', () => {
    renderTab([session({ isLive: true, status: 'live' })]);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('sorts sessions newest-first', () => {
    renderTab([
      session({ id: 'older', createdAt: '2026-09-01T00:00:00Z', transcript: [{ kind: 'query', userId: 1, userName: 'Carl', text: 'Older query', at: '2026-09-01T00:00:00Z' }] }),
      session({ id: 'newer', createdAt: '2026-09-05T00:00:00Z', transcript: [{ kind: 'query', userId: 1, userName: 'Carl', text: 'Newer query', at: '2026-09-05T00:00:00Z' }] }),
    ]);
    const rendered = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(rendered).toEqual(['Newer query', 'Older query']);
  });

  it('clicking a session navigates to its own real Copilot session link', async () => {
    const user = userEvent.setup();
    renderTab([session()]);

    await user.click(screen.getByText('Why is Pizza Hut at risk?'));

    expect(await screen.findByText('COPILOT PAGE')).toBeInTheDocument();
  });
});
