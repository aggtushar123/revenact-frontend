import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import knowledgeReducer from '../../features/knowledge/knowledgeSlice';
import { CopilotSidebar } from './CopilotSidebar';

describe('CopilotSidebar chat history', () => {
  it('shows where a dashboard conversation started beside its time', () => {
    const store = configureStore({ reducer: { knowledge: knowledgeReducer } });
    const conversations = [
      { id: 1, title: 'Why is at-risk ARR up?', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), origin: { surface: 'dashboard' as const, area: 'health' as const, view: 'triage', filters: { owner: '', lifecycle: '', customer: '' } } },
    ];
    render(
      <Provider store={store}>
        <CopilotSidebar isExpanded setIsExpanded={() => {}} conversations={conversations} activeConversationId={null} sessions={{}} myInvites={[]} />
      </Provider>,
    );
    expect(screen.getByText(/^Health › Triage · /)).toBeInTheDocument();
  });

  it("shows the server's tag for an Organizations conversation", () => {
    const store = configureStore({ reducer: { knowledge: knowledgeReducer } });
    const conversations = [
      {
        id: 2,
        title: 'Who renews first?',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        origin: { surface: 'organizations' as const, view: 'list' as const, filters: { owner: '2' }, labels: ['Owner: Carl CSM'] },
      },
    ];
    render(
      <Provider store={store}>
        <CopilotSidebar isExpanded setIsExpanded={() => {}} conversations={conversations} activeConversationId={null} sessions={{}} myInvites={[]} />
      </Provider>,
    );
    expect(screen.getByText(/^Organizations · Owner: Carl CSM · /)).toBeInTheDocument();
  });
});
