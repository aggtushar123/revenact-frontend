import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import { useDrill } from '../drill/useDrill';
import { useAsk } from './useAsk';
import { resetViewport } from '../../../test/viewport';
import { postedBodies, stubCopilot } from '../../../components/copilot/testCopilot';
import { renderDashboard, Where } from './testAsk';
import { ASK_PREFERENCE_KEY } from './askPreference';

function Probe() {
  const { open } = useDrill();
  return (
    <div>
      <Link to="/dashboard/revenue/forecast?owner=2">Go to forecast for owner 2</Link>
      <button
        type="button"
        onClick={(event) => open({ title: 'At risk', figure: '$1', source: { kind: 'rows', rows: [{ id: '3', name: 'Uber' }] } }, event.currentTarget)}
      >
        Open drill
      </button>
      <Where />
    </div>
  );
}

function EntryProbe() {
  const ask = useAsk();
  return (
    <div>
      <button type="button" onClick={() => ask?.draft('Why these?', { kind: 'companies', ids: [3] })}>
        Draft A
      </button>
      <button type="button" onClick={() => ask?.ask('What about this?', { kind: 'attention', key: 'renewal:9' })}>
        Ask B
      </button>
    </div>
  );
}

const rail = () => screen.queryByRole('complementary', { name: 'Ask Revenact' });

describe('the Ask rail on the dashboard', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => {
    resetViewport();
    vi.restoreAllMocks();
  });

  it('is open by default at xl, beside the scroll area', () => {
    stubCopilot();
    renderDashboard('/dashboard/overview', () => <Probe />, 1440);
    expect(rail()).toBeInTheDocument();
    expect(within(rail()!).getByText('Overview')).toBeInTheDocument();
    expect(within(rail()!).getByRole('list', { name: 'Suggested questions' })).toBeInTheDocument();
  });

  it('is a slim tab below xl, and remembers the choice either way', async () => {
    stubCopilot();
    const first = renderDashboard('/dashboard/overview', () => <Probe />, 1100);
    expect(rail()).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Ask Revenact' }));
    expect(rail()).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask Revenact')).toHaveFocus();
    expect(localStorage.getItem(ASK_PREFERENCE_KEY)).toBe('open');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Ask Revenact' }));
    expect(localStorage.getItem(ASK_PREFERENCE_KEY)).toBe('closed');
    expect(screen.getByRole('button', { name: 'Open Ask Revenact' })).toHaveFocus();
    first.unmount();

    renderDashboard('/dashboard/overview', () => <Probe />, 1440);
    expect(rail()).not.toBeInTheDocument();
  });

  it('falls back to the default when storage fails', async () => {
    stubCopilot();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    renderDashboard('/dashboard/overview', () => <Probe />, 1440);
    expect(rail()).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Ask Revenact' }));
    expect(rail()).not.toBeInTheDocument();
  });

  it('keeps the conversation across areas, and a follow-up carries the new screen', async () => {
    const { spy } = stubCopilot();
    renderDashboard('/dashboard/overview', () => <Probe />, 1440);
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'What needs me?{enter}');
    await screen.findByText('Answer to: What needs me?');
    await userEvent.click(screen.getByRole('link', { name: 'Go to forecast for owner 2' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/dashboard/revenue/forecast?owner=2');
    expect(screen.getByText('Answer to: What needs me?')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Ask Revenact'), 'And here?{enter}');
    await screen.findByText('Answer to: And here?');
    const [first, second] = postedBodies(spy);
    expect(first.context).toEqual({ surface: 'dashboard', area: 'overview', view: null, filters: { owner: '', lifecycle: '', customer: '' }, focus: null });
    expect(second.context).toEqual({ surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { owner: '2', lifecycle: '', customer: '' }, focus: null });
    const log = screen.getByRole('log', { name: 'Ask Revenact messages' });
    expect(within(log).getByText('Overview')).toBeInTheDocument();
    expect(within(log).getByText('Revenue › Forecast · Owner: 2')).toBeInTheDocument();
  });

  it('opens the drill panel over the rail, not beside it', async () => {
    stubCopilot();
    renderDashboard('/dashboard/overview', () => <Probe />, 1440);
    await userEvent.click(screen.getByRole('button', { name: 'Open drill' }));
    const drill = screen.getByRole('dialog', { name: /At risk/ });
    expect(drill).toHaveClass('lg:absolute');
    expect(drill).not.toHaveClass('lg:static');
    expect(rail()).toBeInTheDocument();
  });

  it('an entry point opens the rail without changing the remembered choice', async () => {
    stubCopilot();
    localStorage.setItem(ASK_PREFERENCE_KEY, 'closed');
    renderDashboard('/dashboard/overview', () => <EntryProbe />, 1440);
    expect(rail()).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Draft A' }));
    expect(rail()).toBeInTheDocument();
    expect(localStorage.getItem(ASK_PREFERENCE_KEY)).toBe('closed');
  });

  it('an ask replaces an earlier draft focus, and leaves no focus behind', async () => {
    const { spy } = stubCopilot();
    renderDashboard('/dashboard/overview', () => <EntryProbe />, 1440);
    await userEvent.click(screen.getByRole('button', { name: 'Draft A' }));
    expect(within(rail()!).getByRole('button', { name: 'Remove focus' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ask B' }));
    await screen.findByText('Answer to: What about this?');
    const [sent] = postedBodies(spy);
    expect((sent.context as { focus: unknown }).focus).toEqual({ kind: 'attention', key: 'renewal:9' });
    expect(within(rail()!).queryByRole('button', { name: 'Remove focus' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask Revenact')).toHaveValue('');
  });
});
