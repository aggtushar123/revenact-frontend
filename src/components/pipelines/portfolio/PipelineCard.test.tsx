import type { ContextType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OPPORTUNITIES_KIND } from '../../../features/pipelines/pipelineKinds';
import { globexUplift } from '../../../features/pipelines/testPipelines';
import { AskDraftContext } from '../../../pages/dashboard/ask/context';
import { PipelineCard } from './PipelineCard';

function renderCard(draft: ContextType<typeof AskDraftContext>) {
  const onOpen = vi.fn();
  render(
    <MemoryRouter>
      <AskDraftContext.Provider value={draft}>
        <ul>
          <PipelineCard
            row={globexUplift}
            kind={OPPORTUNITIES_KIND}
            currency="USD"
            isSm
            canMove
            moveDisabled={false}
            onOpen={onOpen}
            onMove={vi.fn()}
            onDragStart={vi.fn()}
            onDragEnd={vi.fn()}
          />
        </ul>
      </AskDraftContext.Provider>
    </MemoryRouter>,
  );
  return { onOpen };
}

describe('PipelineCard: Ask about this (spec §3)', () => {
  it('prefills a question about this card, focused on it, without opening its form; the button itself is draggable=false', async () => {
    const draft = vi.fn();
    const { onOpen } = renderCard(draft);
    const button = screen.getByRole('button', { name: 'Ask about this: Globex uplift' });
    expect(button).toHaveAttribute('draggable', 'false');
    await userEvent.click(button);
    expect(draft).toHaveBeenCalledWith('What should I know about this opportunity?', { kind: 'opportunity', id: 43 });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('ends the facts row, pushed right', () => {
    renderCard(vi.fn());
    const facts = document.querySelector('[data-card-id="43"] [data-part="facts"]') as HTMLElement;
    const button = screen.getByRole('button', { name: 'Ask about this: Globex uplift' });
    expect(facts).not.toBeNull();
    expect(button.parentElement).toBe(facts);
    expect(facts.lastElementChild).toBe(button);
    expect(button).toHaveClass('ml-auto');
  });

  it('is not offered outside an Ask provider', () => {
    renderCard(null);
    expect(screen.getByRole('button', { name: 'Globex uplift' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Ask about this/ })).not.toBeInTheDocument();
  });
});
