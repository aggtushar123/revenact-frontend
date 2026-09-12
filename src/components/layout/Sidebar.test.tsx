import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { Sidebar } from './Sidebar';

// Integration tier (see the `testing` skill): real store (auth for the
// admin-only Users link) + real
// router context; only the fetch boundary for the sidebar's own real
// "CUSTOM OBJECTS" section is mocked.

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function renderSidebar() {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    </Provider>
  );
}

describe('Sidebar CUSTOM OBJECTS section', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists the org’s own real custom object definitions, not a hardcoded SFDC item', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse(200, [
            { id: 4, name: 'Salesforce.com', api_name: 'salesforce_com', applies_to_customer: true, applies_to_account: true, fields: [], records_count: 2, created_at: '2026-09-06T00:00:00Z' },
          ])
        )
      )
    );

    renderSidebar();
    // Labels only render in the DOM once expanded (a real hover, same
    // as a user resting their pointer on the sidebar) — collapsed, a
    // NavItem exposes its label as a `title` tooltip attribute instead.
    await userEvent.hover(screen.getByRole('complementary'));

    expect(await screen.findByText('Salesforce.com')).toBeInTheDocument();
    expect(screen.queryByText(/SFDC Opportunity/)).not.toBeInTheDocument();
    expect(screen.getByText('Salesforce.com').closest('a')).toHaveAttribute(
      'href',
      '/custom-objects/4'
    );
  });

  it('renders no custom object items when the org has defined none yet', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));

    renderSidebar();
    await userEvent.hover(screen.getByRole('complementary'));
    await screen.findByText('Dashboard');

    expect(screen.queryByText(/SFDC Opportunity/)).not.toBeInTheDocument();
  });

  it('a failed fetch leaves the rest of the sidebar working', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'error' }))));

    renderSidebar();
    await userEvent.hover(screen.getByRole('complementary'));

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});
