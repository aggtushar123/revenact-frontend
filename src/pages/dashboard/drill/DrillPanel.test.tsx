import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../features/auth/authSlice';
import { ALL_CAPABILITIES } from '../../../test/capabilities';
import { DrillProvider } from './DrillContext';
import { useDrill } from './useDrill';
import { DrillPanel } from './DrillPanel';

// A minimal store with the auth currency the panel's money formatter reads
// (useOrgCurrency, src/hooks.ts:12, reads state.auth.user.organisation.currency)
// — same preloaded auth shape src/components/accounts/MetricsPanel.test.tsx uses.
function authStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role: 'admin',
          role_id: 1,
          role_name: 'Admin',
          permissions: ALL_CAPABILITIES,
          function: 'cs' as const,
          function_display: 'Customer Success',
          reports_to: null,
          organisation: {
            id: 1,
            name: 'Acme Inc',
            slug: 'acme-inc',
            currency: 'USD' as const,
            currency_display: 'US Dollar ($)',
            default_lifecycle_stage: '',
            ai_agent_enabled: true,
            ai_agent_tone: 'professional' as const,
            ai_agent_tone_display: 'Professional',
          },
          is_active: true,
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
}

// The panel only has a real matchMedia to read in a browser; jsdom has none
// (window.matchMedia is undefined), which DrillPanel treats as "not lg" —
// the tests that care about the `lg`/sheet distinction stub it explicitly,
// and every other test here relies on that same "missing = not lg" default.
function stubMatchMedia(matchesLarge: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: matchesLarge,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  // @ts-expect-error -- undo the stub so later tests see jsdom's real "no matchMedia"
  delete window.matchMedia;
});

const rows = [
  { id: '3', name: 'Uber', owner: 'Carl CSM', arr: 42000, detail: '197 days to renewal' },
  { id: '7', name: 'Pizza Hut', owner: 'Carl CSM', arr: 38100, detail: '45 days overdue' },
];

function Opener() {
  const { open } = useDrill();
  return (
    <button onClick={(e) => open({ title: 'At risk', figure: '$114.5K', source: { kind: 'rows', rows } }, e.currentTarget)}>
      At risk
    </button>
  );
}

function renderPanel() {
  const store = authStore();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <DrillProvider>
          <Opener />
          <DrillPanel />
        </DrillProvider>
      </MemoryRouter>
    </Provider>,
  );
}

describe('DrillPanel', () => {
  it('opens as a labelled dialog listing each company with a link', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'At risk' }));
    const dialog = screen.getByRole('dialog', { name: /At risk/ });
    expect(dialog).toHaveTextContent('$114.5K');
    expect(screen.getByRole('link', { name: 'Uber' })).toHaveAttribute('href', '/organizations/3');
    expect(screen.getByText('45 days overdue')).toBeInTheDocument();
  });

  it('offers Open as a list with every id', async () => {
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'At risk' }));
    expect(screen.getByRole('link', { name: /Open as a list/ })).toHaveAttribute(
      'href',
      '/organizations/list?ids=3,7',
    );
  });

  it('moves focus in, closes on Escape and returns focus to the trigger', async () => {
    renderPanel();
    const trigger = screen.getByRole('button', { name: 'At risk' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('says so when a number has no companies behind it', async () => {
    function EmptyOpener() {
      const { open } = useDrill();
      return <button onClick={() => open({ title: 'Declining', figure: '0', source: { kind: 'rows', rows: [] } })}>Declining</button>;
    }
    const store = authStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <DrillProvider>
            <EmptyOpener />
            <DrillPanel />
          </DrillProvider>
        </MemoryRouter>
      </Provider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Declining' }));
    expect(screen.getByText('No accounts behind this number.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open as a list/ })).not.toBeInTheDocument();
  });

  it('is aria-modal and traps Tab inside the sheet below lg', async () => {
    stubMatchMedia(false);
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'At risk' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const closeButton = screen.getByRole('button', { name: 'Close' });
    const links = screen.getAllByRole('link');
    const last = links[links.length - 1];

    last.focus();
    await userEvent.tab();
    expect(closeButton).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('leaves focus free between the panel and the page at lg', async () => {
    stubMatchMedia(true);
    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'At risk' }));

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
  });
});
