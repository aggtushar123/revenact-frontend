import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORY_ITEMS } from '../../../features/organizations/testStory';
import { AskDraftContext } from '../../../pages/dashboard/ask/context';
import { StoryItemRow } from './StoryItemRow';

const call = STORY_ITEMS.find((item) => item.kind === 'call')!;

function renderRow(draft: ((question: string, focus: unknown) => void) | null) {
  return render(
    <AskDraftContext.Provider value={draft}>
      <ul>
        <StoryItemRow item={call} onOpenEmail={() => {}} />
      </ul>
    </AskDraftContext.Provider>,
  );
}

describe('StoryItemRow: Ask about this', () => {
  it('prefills a question about this one item, focused on it', async () => {
    const draft = vi.fn();
    renderRow(draft);
    await userEvent.click(screen.getByRole('button', { name: 'Ask about this: Quarterly check-in' }));
    expect(draft).toHaveBeenCalledWith('What should I know about this call?', { kind: 'call', id: 12 });
  });

  it('is a 44px target on phones, the meta line size from sm', () => {
    renderRow(vi.fn());
    const button = screen.getByRole('button', { name: /^Ask about this/ });
    expect(button).toHaveClass('min-h-11', 'sm:min-h-0');
    expect(button).toHaveTextContent('Ask about this');
  });

  it('is not offered outside an Ask provider', () => {
    renderRow(null);
    expect(screen.queryByRole('button', { name: /^Ask about this/ })).not.toBeInTheDocument();
  });
});
