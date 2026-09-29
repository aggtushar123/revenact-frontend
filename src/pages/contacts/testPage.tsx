// Test-only: the Contacts page on the real store and router, as App.tsx
// routes it. Only fetch is stubbed, by the caller (stubContactsApi).
/* eslint-disable react-refresh/only-export-components */
import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import customersReducer from '../../features/customers/customersSlice';
import { setViewport } from '../../test/viewport';
import { ContactsListRedirect } from './ContactsListRedirect';
import { ContactsPage } from './ContactsPage';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

export function renderContactsPage(url = '/contacts', { width = 1440 }: { width?: number } = {}) {
  setViewport(width);
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/contacts/list" element={<ContactsListRedirect />} />
          <Route
            path="/contacts/:id?"
            element={
              <>
                <ContactsPage />
                <Where />
              </>
            }
          />
          <Route path="/organizations/:id" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store };
}
