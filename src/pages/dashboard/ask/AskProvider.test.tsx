import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { stubCopilot } from '../../../components/copilot/testCopilot';
import { resetViewport, setViewport } from '../../../test/viewport';
import type { Conversation, SurfaceName } from '../../copilot/types';
import { ASK_PREFERENCE_KEY, ORGANIZATIONS_ASK_KEY } from './askPreference';
import { AskProvider } from './AskProvider';
import type { AskSurface } from './context';
import { useAsk } from './useAsk';

const orgConversation: Conversation = {
  id: 9,
  title: 'Who renews first?',
  created_at: '',
  updated_at: '',
  origin: { surface: 'organizations', view: 'list', filters: { owner: '2' }, labels: ['Owner: Carl CSM'] },
  messages: [],
};
const dashConversation: Conversation = {
  id: 4,
  title: 'Why is at-risk ARR up?',
  created_at: '',
  updated_at: '',
  origin: { surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { owner: '2', lifecycle: '', customer: '' } },
  messages: [],
};

function Probe() {
  const ask = useAsk()!;
  const { pathname, search } = useLocation();
  return (
    <div>
      <p data-testid="where">{pathname + search}</p>
      <p data-testid="surface">{ask.surface.name}</p>
      <p data-testid="title">{ask.conversation?.title ?? 'none'}</p>
      <p data-testid="open">{String(ask.open)}</p>
      <p data-testid="focus">{JSON.stringify(ask.focus)}</p>
      <button type="button" onClick={() => ask.openFromHistory(orgConversation)}>Open organizations chat</button>
      <button type="button" onClick={() => ask.openFromHistory(dashConversation)}>Open dashboard chat</button>
      <button type="button" onClick={() => ask.focusOn({ kind: 'companies', ids: [7] })}>Focus Pizza Hut</button>
      <button type="button" onClick={() => ask.setOpen(true)}>Show rail</button>
    </div>
  );
}

const surfaceOf = (name: SurfaceName): AskSurface => ({ name, context: null, chipLabel: () => '' });

// Two component types, so moving between the routes mounts a fresh provider,
// as moving between DashboardFrame and OrganizationsAskLayout does.
function DashboardSide() {
  return (
    <AskProvider surface={surfaceOf('dashboard')}>
      <Probe />
    </AskProvider>
  );
}
function OrganizationsSide() {
  return (
    <AskProvider surface={surfaceOf('organizations')} preferenceKey={ORGANIZATIONS_ASK_KEY}>
      <Probe />
    </AskProvider>
  );
}

function renderAt(url: string, width: number) {
  setViewport(width);
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dashboard/*" element={<DashboardSide />} />
        <Route path="/organizations/*" element={<OrganizationsSide />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AskProvider', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => resetViewport());

  it('narrows the next question with focusOn, without opening the rail', async () => {
    renderAt('/organizations/list', 1100);
    await userEvent.click(screen.getByRole('button', { name: 'Focus Pizza Hut' }));
    expect(screen.getByTestId('focus')).toHaveTextContent('{"kind":"companies","ids":[7]}');
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });

  it("keeps each surface's open choice under its own key", async () => {
    renderAt('/organizations/list', 1100);
    await userEvent.click(screen.getByRole('button', { name: 'Show rail' }));
    expect(localStorage.getItem(ORGANIZATIONS_ASK_KEY)).toBe('open');
    expect(localStorage.getItem(ASK_PREFERENCE_KEY)).toBeNull();
  });

  it("reopens its own surface's conversation where it started, and shows it", async () => {
    renderAt('/organizations/board', 1100);
    await userEvent.click(screen.getByRole('button', { name: 'Open organizations chat' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/organizations/list?owner=2');
    expect(screen.getByTestId('title')).toHaveTextContent('Who renews first?');
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    expect(localStorage.getItem(ORGANIZATIONS_ASK_KEY)).toBeNull();
  });

  it("sends another surface's conversation to its own page, whose rail shows it for that visit", async () => {
    stubCopilot({ conversationById: { 9: orgConversation } });
    renderAt('/dashboard/overview', 1100);
    expect(screen.getByTestId('surface')).toHaveTextContent('dashboard');
    await userEvent.click(screen.getByRole('button', { name: 'Open organizations chat' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/organizations/list?owner=2');
    expect(screen.getByTestId('surface')).toHaveTextContent('organizations');
    await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent('Who renews first?'));
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    expect(localStorage.getItem(ORGANIZATIONS_ASK_KEY)).toBeNull();
  });

  it('hands a dashboard conversation picked on Organizations to the dashboard, as a sheet on a phone', async () => {
    stubCopilot({ conversationById: { 4: dashConversation } });
    renderAt('/organizations/list', 375);
    await userEvent.click(screen.getByRole('button', { name: 'Open dashboard chat' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/revenue/forecast?owner=2');
    await waitFor(() => expect(screen.getByTestId('title')).toHaveTextContent('Why is at-risk ARR up?'));
    expect(screen.getByTestId('open')).toHaveTextContent('true');
  });
});
