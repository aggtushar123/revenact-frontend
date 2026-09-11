import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import healthReducer from '../../../../features/health/healthSlice';
import type { HealthDataRow } from '../../../../features/health/types';

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
  }: {
    rows?: HealthDataRow[];
    isLoading?: boolean;
    error?: string | null;
    truncated?: boolean;
    loaded?: boolean;
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
      },
    },
  });

  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
