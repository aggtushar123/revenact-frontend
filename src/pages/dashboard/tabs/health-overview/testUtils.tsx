import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import healthReducer, { NO_FILTERS } from '../../../../features/health/healthSlice';
import type { HealthFilters } from '../../../../features/health/healthSlice';
import type { CurrencyCode } from '../../../../features/auth/authSlice';
import type { HealthDataRow } from '../../../../features/health/types';
import { AreaLayout } from '../../AreaLayout';
import { HealthOverviewContainer } from '../HealthOverviewContainer';
import { TriageView } from './TriageView';

/**
 * One `HealthDataRow` with sane defaults, overridable field by field.
 *
 * Every test file used to carry its own copy of this. They drifted the moment
 * the row type gained a field — five identical edits, four of which are easy to
 * forget — so it lives here now, next to the store helper the same tests use.
 */
export function healthRow(overrides: Partial<HealthDataRow> = {}): HealthDataRow {
  return {
    id: '1',
    account: 'Acme',
    owner: 'Gerry Hill',
    ownerKey: '1',
    lifecycleStage: 'Customer - Active',
    lifecycleKey: 'customer_active',
    renewalDate: 'Dec 31, 2026',
    healthStatus: 'Good',
    healthScore: 8,
    csmPulseScore: 4,
    aiPulseScore: 4,
    lastPulseModified: 'Feb 4, 2026',
    aiPulseReason: 'Seat utilisation at 94% of contract',
    arr: 100_000,
    daysSinceTouch: 10,
    riskOfLoss: 0.05,
    riskFactors: [{ label: 'Good health', points: 0.05 }],
    activeSeats: 20,
    history: [],
    ...overrides,
  };
}

/**
 * Render a Health Overview tab over a given book.
 *
 * The tabs read `state.health` now rather than importing a mock, so the tests
 * supply the rows. Preloading `loadedAt` is what stops the shared hook firing a
 * fetch: these tests are about what the tabs do with a book, not about loading
 * one, and an unmocked thunk would reach for the network.
 */
export function renderWithHealth(
  ui: ReactElement,
  {
    rows = [],
    isLoading = false,
    error = null,
    truncated = false,
    loaded = true,
    currency = 'USD',
    unconvertedCount = 0,
    filters = NO_FILTERS,
  }: {
    rows?: HealthDataRow[];
    isLoading?: boolean;
    error?: string | null;
    truncated?: boolean;
    loaded?: boolean;
    currency?: CurrencyCode;
    unconvertedCount?: number;
    filters?: HealthFilters;
  } = {},
) {
  const store = configureStore({
    reducer: { health: healthReducer },
    preloadedState: {
      health: {
        rows,
        isLoading,
        error,
        historyMonths: 12,
        truncated,
        loadedAt: loaded ? '2026-09-11T00:00:00.000Z' : null,
        currency,
        unconvertedCount,
        filters,
      },
    },
  });

  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}

/**
 * Render Health's real route tree — `/dashboard/health` -> `AreaLayout` ->
 * `HealthOverviewContainer` -> Triage — starting at `url`.
 *
 * Only Triage is wired: this is for tests of the container's own behaviour
 * (the URL -> Redux filter sync), not a general-purpose router harness for
 * every tab.
 */
export function renderHealthAt(
  url: string,
  options: Parameters<typeof renderWithHealth>[1] = {},
) {
  return renderWithHealth(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dashboard/health" element={<AreaLayout area="health" />}>
          <Route element={<HealthOverviewContainer />}>
            <Route path="triage" element={<TriageView />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
    options,
  );
}
