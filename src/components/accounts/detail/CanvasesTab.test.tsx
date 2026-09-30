import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ACCOUNT_LISTS, stubAccountPage } from '../../../features/accounts/testAccountPage';
import { requestPaths } from '../../../features/organizations/testStory';
import { makeDetailStore } from '../../../pages/organizations/testDetail';
import { CanvasesTab } from './CanvasesTab';

function Where() {
  const location = useLocation();
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>;
}

function renderCanvases() {
  render(
    <Provider store={makeDetailStore()}>
      <MemoryRouter initialEntries={['/accounts/12?tab=canvases']}>
        <Routes>
          <Route path="/accounts/:id" element={<CanvasesTab accountId={12} />} />
          <Route path="/canvas/*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('CanvasesTab (spec 2026-09-29 §2.9b)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists the account's canvases as items read by the account alone", async () => {
    const spy = stubAccountPage({ lists: ACCOUNT_LISTS });
    renderCanvases();
    const list = await screen.findByRole('list', { name: 'Canvases' });
    const item = within(list).getAllByRole('listitem')[0];
    expect(within(item).getByRole('link', { name: 'EMEA buying group' })).toHaveAttribute('href', '/canvas/301');
    expect(item).toHaveTextContent('2 contacts');
    expect(item).toHaveTextContent(/Updated /);
    expect(document.querySelector('[data-summary]')).toHaveTextContent('1 canvas');
    expect(requestPaths(spy)).toContain('GET /accounts/12/canvases/');
  });

  it('New canvas opens the editor for this account', async () => {
    stubAccountPage({ lists: ACCOUNT_LISTS });
    renderCanvases();
    await screen.findByRole('list', { name: 'Canvases' });
    await userEvent.click(screen.getByRole('button', { name: 'New canvas' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/canvas/create?accountId=12');
  });

  it('deletes a canvas after confirming', async () => {
    const spy = stubAccountPage({ lists: ACCOUNT_LISTS });
    renderCanvases();
    await screen.findByRole('list', { name: 'Canvases' });
    await userEvent.click(screen.getByRole('button', { name: 'Delete EMEA buying group' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByText('No canvases yet')).toBeInTheDocument());
    expect(requestPaths(spy)).toContain('DELETE /canvases/301/');
  });

  it('says there are none yet, and keeps New canvas', async () => {
    stubAccountPage();
    renderCanvases();
    expect(await screen.findByText('No canvases yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New canvas' })).toBeInTheDocument();
  });

  it('says so when the read fails, and Try again reads again', async () => {
    stubAccountPage({ row: null });
    renderCanvases();
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    stubAccountPage({ lists: ACCOUNT_LISTS });
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('list', { name: 'Canvases' })).toBeInTheDocument();
  });
});
