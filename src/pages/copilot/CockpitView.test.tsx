import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { CockpitView } from './CockpitView';

// Integration tier (see the `testing` skill): only the fetch boundary is
// mocked — real Cockpit backing data now (see docs/API_CONTRACTS.md ->
// customers -> Task / Cockpit summary), replacing the old fully-mock
// Redux tasksSlice this page used to read from.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const EMPTY_SUMMARY = {
  customers: { count: 0, value: 0, health: { good: 0, average: 0, poor: 0 } },
  accounts: { count: 0, value: 0, health: { good: 0, average: 0, poor: 0 } },
  renewals_next_30_days: {
    customers: { count: 0, value: 0 },
    accounts: { count: 0, value: 0 },
  },
};

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'alice@acme.io',
          name: 'Alice',
          avatar: '',
          role: 'admin' as const,
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

function renderCockpit() {
  render(
    <Provider store={makeStore()}>
      <CockpitView />
    </Provider>
  );
}

describe('CockpitView', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders real portfolio/renewal numbers from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/cockpit/summary/')) {
          return Promise.resolve(
            jsonResponse(200, {
              customers: { count: 4, value: 12000, health: { good: 3, average: 1, poor: 0 } },
              accounts: { count: 2, value: 5000, health: { good: 2, average: 0, poor: 0 } },
              renewals_next_30_days: {
                customers: { count: 1, value: 1200 },
                accounts: { count: 0, value: 0 },
              },
            })
          );
        }
        return Promise.resolve(jsonResponse(200, []));
      })
    );
    renderCockpit();

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('$12.0K')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$5.0K')).toBeInTheDocument();
  });

  it('surfaces a fetch failure instead of silently showing zeros', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));
    renderCockpit();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('buckets real tasks into Overdue/Upcoming by due_date, excluding completed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/cockpit/summary/')) return Promise.resolve(jsonResponse(200, EMPTY_SUMMARY));
        if (url.includes('/tasks/')) {
          return Promise.resolve(
            jsonResponse(200, [
              {
                id: 1,
                title: 'Overdue Task',
                assignee_name: 'Edgar',
                due_date: '2020-01-01',
                priority: 'high',
                priority_display: 'High',
                status: 'pending',
                status_display: 'Pending',
                parent_name: 'Globex',
                parent_type: 'customer',
              },
              {
                id: 2,
                title: 'Future Task',
                assignee_name: 'Edgar',
                due_date: '2099-01-01',
                priority: 'medium',
                priority_display: 'Medium',
                status: 'in-progress',
                status_display: 'In Progress',
                parent_name: 'North America',
                parent_type: 'account',
              },
              {
                id: 3,
                title: 'Done Task',
                assignee_name: 'Edgar',
                due_date: '2020-01-01',
                priority: 'low',
                priority_display: 'Low',
                status: 'completed',
                status_display: 'Completed',
                parent_name: 'Globex',
                parent_type: 'customer',
              },
            ])
          );
        }
        return Promise.resolve(jsonResponse(200, []));
      })
    );
    const user = userEvent.setup();
    renderCockpit();

    expect(await screen.findByText('Overdue (1)')).toBeInTheDocument();
    expect(screen.getByText('Upcoming (1)')).toBeInTheDocument();
    expect(screen.getByText('Overdue Task')).toBeInTheDocument();
    expect(screen.queryByText('Done Task')).not.toBeInTheDocument();

    await user.click(screen.getByText('Upcoming (1)'));
    expect(await screen.findByText('Future Task')).toBeInTheDocument();
    expect(screen.getByText('North America')).toBeInTheDocument();
  });
});
