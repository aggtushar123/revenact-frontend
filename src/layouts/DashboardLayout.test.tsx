import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer from '../features/auth/authSlice';
import { DashboardLayout } from './DashboardLayout';

// The shell's own pieces have their own tests; this one is about the frame.
vi.mock('../components/layout/Sidebar', () => ({ Sidebar: () => <nav aria-label="Sidebar stub" /> }));
vi.mock('../components/layout/Navbar', () => ({ Navbar: () => <header>Navbar stub</header> }));

function renderAt(url: string) {
  // No access token: the layout fetches no notifications and opens no socket.
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="*" element={<div>Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return screen.getByRole('main');
}

describe('DashboardLayout', () => {
  // The dashboard's frame pads itself as Communications' body does (px-4
  // pb-4 under a transparent top bar), so <main> adds nothing around it.
  it.each([
    '/dashboard/overview',
    '/communications',
    '/organizations/list',
    '/organizations/board',
    '/organizations/7',
    '/contacts',
    '/contacts/41',
    // A trailing slash is still the same route (fix round 1, 2026-09-28).
    '/contacts/',
    '/contacts/41/',
    // The Accounts list and board wear the Organizations frame too, whose
    // own px-4 pb-4 already gutters them (fix round 1, 2026-09-30).
    '/accounts/list',
    '/accounts/board',
    // …and an account's page, the organization page's bleed frame (accounts
    // spec 2026-09-29 §2.1).
    '/accounts/12',
    '/accounts/12/',
  ])('adds no padding around %s', (url) => {
    const main = renderAt(url);
    expect(main).toHaveClass('p-0');
    expect(main).not.toHaveClass('p-2');
  });

  it('keeps the padding on other pages', () => {
    const main = renderAt('/pipelines/board');
    expect(main).toHaveClass('p-2', 'md:p-3', 'lg:p-4');
  });

  it('keeps the Navbar on the dashboard, not on Communications', () => {
    renderAt('/dashboard/overview');
    expect(screen.getByText('Navbar stub')).toBeInTheDocument();
  });
});
