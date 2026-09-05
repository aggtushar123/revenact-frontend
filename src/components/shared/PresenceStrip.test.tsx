import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresenceStrip } from './PresenceStrip';

function participant(userId: number, userName: string) {
  return { userId, userName, joinedAt: '2026-09-05T10:00:00Z' };
}

describe('PresenceStrip', () => {
  it('renders nothing for an empty participant list', () => {
    const { container } = render(<PresenceStrip participants={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one avatar per participant up to the max', () => {
    render(
      <PresenceStrip
        participants={[participant(1, 'Carl'), participant(2, 'Priya')]}
      />
    );
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('collapses participants beyond max into a "+N" chip', () => {
    render(
      <PresenceStrip
        max={2}
        participants={[participant(1, 'Carl'), participant(2, 'Priya'), participant(3, 'Jordan')]}
      />
    );
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
