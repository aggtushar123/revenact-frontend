import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChatView } from './ChatView';
import type { CopilotSession } from '../../features/copilotSessions/types';
import type { Proposal } from '../../features/proposals/proposalsSlice';

const session: CopilotSession = {
  id: 1,
  conversation_id: 9,
  owner: { id: 1, name: 'Alice' },
  customer_id: 3,
  customer_name: 'Fine',
  account_id: null,
  account_name: null,
  status: 'live',
  participants: [{ user: { id: 1, name: 'Alice' }, joined_at: '2026-09-12T10:00:00Z', left_at: null }],
  events: [],
  created_at: '2026-09-12T10:00:00Z',
  closed_at: null,
};

const decision: Proposal = {
  id: 41,
  batch: 'b',
  kind: 'task',
  kind_display: 'Task on an account',
  title: 'Book the exec sponsor call with Fine',
  rationale: 'Carl agreed to book it.',
  evidence: [],
  action: { customer_id: 3, customer_name: 'Fine', title: 'Exec sponsor call: Fine', assignee_name: 'Carl', due_date: '2026-09-19', priority: 'high' },
  initiative: null,
  status: 'proposed',
  status_display: 'Proposed',
  decided_by: null,
  decided_at: null,
  decision_note: '',
  result: {},
  generated_by: 'Carl',
  source: { session_id: 1, conversation_id: 9, title: 'What do we do about Fine?' },
  created_at: '2026-09-12T10:05:00Z',
};

const message = { id: 1, role: 'user' as const, content: 'What do we do about Fine?', sources: [], created_at: '2026-09-12T10:00:00Z' };

function renderView(props: Partial<React.ComponentProps<typeof ChatView>> = {}) {
  return render(
    <MemoryRouter>
      <ChatView messages={[message]} onSendPrompt={() => {}} session={session} currentUserId={1} {...props} />
    </MemoryRouter>
  );
}

describe('ChatView decisions', () => {
  it('offers Capture decisions on a live session and lists what the facilitator wrote', async () => {
    const onCapture = vi.fn();
    renderView({ onCaptureDecisions: onCapture, decisions: [decision] });

    await userEvent.click(screen.getByRole('button', { name: 'Capture decisions' }));
    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Decisions from this session')).toBeInTheDocument();
    expect(screen.getByText('Book the exec sponsor call with Fine')).toBeInTheDocument();
    expect(screen.getByText('Proposed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review queue' })).toHaveAttribute('href', '/brain/review');
  });

  it('shows the facilitator busy and its error, and hides the control on a private session', () => {
    renderView({ onCaptureDecisions: () => {}, isCapturing: true, captureError: 'Monthly token budget spent.' });
    expect(screen.getByRole('button', { name: 'Reading the session…' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Monthly token budget spent.');

    renderView({ onCaptureDecisions: () => {}, session: { ...session, status: 'private' } });
    expect(screen.queryByRole('button', { name: 'Capture decisions' })).not.toBeInTheDocument();
  });
});
