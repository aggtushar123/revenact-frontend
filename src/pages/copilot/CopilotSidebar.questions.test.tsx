import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import knowledgeReducer, { fetchMyQuestions } from '../../features/knowledge/knowledgeSlice';
import { CopilotSidebar } from './CopilotSidebar';

const question = {
  id: 1, customer: { id: 7, name: 'Pizza Hut' },
  asked_by: { id: 1, name: 'Alice Admin', function: 'leadership' as const },
  assignee: { id: 5, name: 'Mei Tanaka', function: 'analytics' as const },
  text: 'Why is usage down?', status: 'open' as const, status_display: 'Open',
  answer: null, message_id: null, days_open: 0, created_at: new Date().toISOString(), answered_at: null,
};

describe('CopilotSidebar questions inbox', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('lists the questions waiting on me and clears one once answered', async () => {
    const spy = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>((url) => {
      const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body });
      if (url.includes('/answer/')) return ok({ ...question, status: 'answered', status_display: 'Answered' });
      return ok([question]);
    });
    vi.stubGlobal('fetch', spy);
    const store = configureStore({ reducer: { knowledge: knowledgeReducer } });
    await store.dispatch(fetchMyQuestions());
    render(
      <Provider store={store}>
        <CopilotSidebar isExpanded setIsExpanded={() => {}} conversations={[]} activeConversationId={null} sessions={{}} myInvites={[]} />
      </Provider>
    );

    expect(screen.getByText('Questions for you · 1')).toBeInTheDocument();
    expect(screen.getByText('Why is usage down?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Answer' }));
    await userEvent.type(screen.getByLabelText('Answer Alice Admin'), 'Reporting module.');
    await userEvent.click(screen.getByRole('button', { name: 'Send answer' }));

    const post = spy.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({ body: 'Reporting module.' });
    expect(await screen.findByText('Chat history')).toBeInTheDocument();
    expect(screen.queryByText(/Questions for you/)).not.toBeInTheDocument();
  });
});
