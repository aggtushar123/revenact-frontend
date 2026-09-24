import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CopilotRail, type CopilotRailProps } from './CopilotRail';
import { postedBodies, stubCopilot } from './testCopilot';
import { useCopilotThread } from './useCopilotThread';
import type { Conversation, DashboardContext } from '../../pages/copilot/types';

const DASH: DashboardContext = {
  surface: 'dashboard',
  area: 'revenue',
  view: 'forecast',
  filters: { owner: '2', lifecycle: '', customer: '' },
  focus: null,
};

type Given = Omit<CopilotRailProps, 'conversation' | 'onConversation' | 'onClearContext'> & { onClearContext?: () => void };

function Harness(props: Given) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  return <CopilotRail onClearContext={() => {}} {...props} conversation={conversation} onConversation={setConversation} />;
}

function renderRail(props: Partial<Given> = {}) {
  const tree = (next: Partial<Given>) => (
    <MemoryRouter>
      <Harness context={null} {...next} />
    </MemoryRouter>
  );
  const view = render(tree(props));
  return { ...view, rerenderRail: (next: Partial<Given>) => view.rerender(tree(next)) };
}

describe('CopilotRail', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('sends a label context as the Communications text prefix and no context field', async () => {
    const { spy } = stubCopilot();
    renderRail({ context: { kind: 'label', label: 'Support desk' } });
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What is waiting?{enter}');
    expect(await screen.findByText('Answer to: [About: Support desk] What is waiting?')).toBeInTheDocument();
    expect(postedBodies(spy)).toEqual([{ content: '[About: Support desk] What is waiting?' }]);
  });

  it('sends a dashboard context as the structured field, with no text prefix', async () => {
    const { spy } = stubCopilot();
    renderRail({ label: 'Ask Revenact', variant: 'plain', context: { kind: 'dashboard', context: DASH, label: 'Revenue › Forecast · Owner: Priya' } });
    expect(screen.getByRole('complementary', { name: 'Ask Revenact' })).toBeInTheDocument();
    expect(screen.getByText('Revenue › Forecast · Owner: Priya')).toBeInTheDocument();
    // The screen itself cannot be removed from a question, only a focus can.
    expect(screen.queryByRole('button', { name: 'Remove focus' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'Why is at-risk ARR up?{enter}');
    expect(await screen.findByText('Answer to: Why is at-risk ARR up?')).toBeInTheDocument();
    expect(postedBodies(spy)).toEqual([{ content: 'Why is at-risk ARR up?', context: DASH }]);
  });

  it('offers to remove a focus, and only a focus', async () => {
    const onClearContext = vi.fn();
    const focused = { ...DASH, focus: { kind: 'companies' as const, ids: [3, 7] } };
    renderRail({ onClearContext, context: { kind: 'dashboard', context: focused, label: 'Revenue › Forecast · 2 accounts' } });
    await userEvent.click(screen.getByRole('button', { name: 'Remove focus' }));
    expect(onClearContext).toHaveBeenCalledOnce();
  });

  it('renders what it is given above the conversation', () => {
    renderRail({ top: <p>Top slot</p> });
    expect(screen.getByText('Top slot')).toBeInTheDocument();
  });

  it('shows a thinking skeleton while the answer is on its way', async () => {
    const { release } = stubCopilot({ hold: true });
    renderRail();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What is waiting?{enter}');
    expect(await screen.findByRole('status')).toHaveTextContent('Thinking…');
    release();
    expect(await screen.findByText('Answer to: What is waiting?')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('says the budget is used up on a 429, keeps the question, and offers no retry', async () => {
    stubCopilot({ statuses: [429] });
    renderRail();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What is waiting?{enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent("This month's AI budget is used up.");
    expect(screen.getByText('What is waiting?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('keeps the question after any other failure and sends the same body again on Retry', async () => {
    const { spy } = stubCopilot({ statuses: [500] });
    renderRail({ context: { kind: 'dashboard', context: DASH, label: 'Revenue › Forecast' } });
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'Why is at-risk ARR up?{enter}');
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Answer to: Why is at-risk ARR up?')).toBeInTheDocument();
    const bodies = postedBodies(spy);
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
  });

  it('puts focus back in the input after sending with the Send button', async () => {
    stubCopilot();
    renderRail();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What is waiting?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('Answer to: What is waiting?');
    expect(screen.getByPlaceholderText('Ask Revenact')).toHaveFocus();
  });

  it('lists the records an answer cites, as the Copilot page does', async () => {
    stubCopilot();
    renderRail();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'Please cite it{enter}');
    expect(await screen.findByText('Based on 1 record')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /SSO login fails/ })).toBeInTheDocument();
  });

  it('runs on a thread it is handed, so a caller can send without the composer', async () => {
    stubCopilot();
    function Outside() {
      const [conversation, setConversation] = useState<Conversation | null>(null);
      const thread = useCopilotThread(conversation, setConversation);
      return (
        <>
          <button type="button" onClick={() => void thread.send({ text: 'From outside', content: 'From outside' })}>Send from outside</button>
          <CopilotRail context={null} onClearContext={() => {}} conversation={conversation} onConversation={setConversation} thread={thread} />
        </>
      );
    }
    render(<MemoryRouter><Outside /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: 'Send from outside' }));
    expect(await screen.findByText('Answer to: From outside')).toBeInTheDocument();
  });

  it('each question shows the screen it was asked on, and a follow-up carries the new screen', async () => {
    const { spy } = stubCopilot();
    const names = { owner: { '2': 'Priya', '5': 'Omar' } };
    const { rerenderRail } = renderRail({ names, context: { kind: 'dashboard', context: DASH, label: 'Revenue › Forecast · Owner: Priya' } });
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'Why is at-risk ARR up?{enter}');
    await screen.findByText('Answer to: Why is at-risk ARR up?');

    const moved = { ...DASH, filters: { ...DASH.filters, owner: '5' } };
    rerenderRail({ names, context: { kind: 'dashboard', context: moved, label: 'Revenue › Forecast · Owner: Omar' } });
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'And now?{enter}');
    await screen.findByText('Answer to: And now?');

    expect((postedBodies(spy)[1].context as typeof DASH).filters.owner).toBe('5');
    const log = screen.getByRole('log', { name: 'Copilot messages' });
    expect(within(log).getByText('Revenue › Forecast · Owner: Priya')).toBeInTheDocument();
    expect(within(log).getByText('Revenue › Forecast · Owner: Omar')).toBeInTheDocument();
  });

  it('shows no per-message chip where no names are given (a dashboard thread reopened elsewhere is plain text)', async () => {
    stubCopilot();
    renderRail({ context: { kind: 'dashboard', context: DASH, label: 'Revenue › Forecast' } });
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'Why?{enter}');
    await screen.findByText('Answer to: Why?');
    expect(within(screen.getByRole('log', { name: 'Copilot messages' })).queryByText('Revenue › Forecast')).not.toBeInTheDocument();
  });

  it('shows Communications\' empty line on a dashboard rail too, and no suggestions', async () => {
    stubCopilot();
    renderRail({ context: { kind: 'dashboard', context: { ...DASH, area: 'overview', view: null }, label: 'Overview' } });
    const log = screen.getByRole('log', { name: 'Copilot messages' });
    expect(within(log).getByText('Ask about what is in front of you. Answers use your accounts, mail and tickets.')).toHaveClass('m-auto', 'text-center');
    expect(screen.queryByRole('list', { name: 'Suggested questions' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What should I act on first?{enter}');
    expect(await screen.findByText('Answer to: What should I act on first?')).toBeInTheDocument();
    expect(within(log).queryByText('Ask about what is in front of you. Answers use your accounts, mail and tickets.')).not.toBeInTheDocument();
  });

  it('prefills a draft, focused and editable, and sends nothing until asked', async () => {
    const { spy } = stubCopilot();
    const onSent = vi.fn();
    const { rerenderRail } = renderRail({ onSent });
    rerenderRail({ onSent, draft: { text: 'Why are these in At risk?', nonce: 1 } });
    const input = screen.getByPlaceholderText('Ask Revenact');
    expect(input).toHaveValue('Why are these in At risk?');
    expect(input).toHaveFocus();
    expect(postedBodies(spy)).toHaveLength(0);
    await userEvent.type(input, '{enter}');
    await screen.findByText('Answer to: Why are these in At risk?');
    expect(onSent).toHaveBeenCalledOnce();
  });

  it('shows a 400 as the generic error with Retry, not the budget message', async () => {
    stubCopilot({ statuses: [400] });
    renderRail({ context: { kind: 'dashboard', context: DASH, label: 'Revenue › Forecast' } });
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'Why is at-risk ARR up?{enter}');
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent("This month's AI budget is used up.");
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('leaves focus where the person moved it while the answer was on its way', async () => {
    const { release } = stubCopilot({ hold: true });
    render(
      <MemoryRouter>
        <button type="button">Elsewhere</button>
        <Harness context={null} />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What is waiting?{enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    release();
    await screen.findByText('Answer to: What is waiting?');
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
  });
});
