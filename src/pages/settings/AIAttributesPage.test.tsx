import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { AIAttributesPage } from './AIAttributesPage';
import { attribute, jsonResponse, makeStore } from '../../test/attributesFixtures';

// Integration tier: real store for the admin gate, the fetch boundary
// mocked with contract-shaped responses.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function renderPage(role: 'admin' | 'csm' = 'admin') {
  render(
    <Provider store={makeStore(role)}>
      <MemoryRouter>
        <AIAttributesPage />
      </MemoryRouter>
    </Provider>
  );
}

describe('AIAttributesPage', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('tells a CSM to ask an admin', () => {
    renderPage('csm');
    expect(screen.getByText(/ask an admin/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists what is defined and adds a new attribute', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [attribute()]))
      .mockResolvedValueOnce(jsonResponse(201, attribute({ id: 5, name: 'Seats in use', value_type: 'number', picklist_options: [], refresh: 'manual' })));
    renderPage();
    expect(await screen.findByText('Product tier')).toBeInTheDocument();
    expect(screen.getByText('Nightly')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New attribute' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Seats in use');
    await userEvent.type(screen.getByLabelText('Question'), 'How many seats does this company actively use?');
    await userEvent.selectOptions(screen.getByLabelText('Answer type'), 'number');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Seats in use')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      name: 'Seats in use', prompt: 'How many seats does this company actively use?', value_type: 'number', applies_to_customer: true,
    });
  });

  it('fills every company from the row and reports the count', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [attribute()]))
      .mockResolvedValueOnce(jsonResponse(200, { filled: 25, remaining: 4, values: [] }));
    renderPage();
    await screen.findByText('Product tier');
    await userEvent.click(screen.getByRole('button', { name: 'Fill all for Product tier' }));
    expect(await screen.findByText(/25 filled, 4 left for tonight/)).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/attributes\/definitions\/3\/fill\/$/);
  });
});

describe('AIAttributesPage actions', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('deletes after confirmation, and keeps the list when a delete fails', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [attribute(), attribute({ id: 4, name: 'Seats in use' })]))
      .mockResolvedValueOnce(jsonResponse(500, { detail: 'Database busy' }))
      .mockResolvedValueOnce(jsonResponse(204, null));
    renderPage();
    await screen.findByText('Product tier');
    await userEvent.click(screen.getByRole('button', { name: 'Delete Product tier' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database busy');
    expect(screen.getByText('Product tier')).toBeInTheDocument();
    expect(screen.getByText('Seats in use')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete Seats in use' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Product tier')).toBeInTheDocument();
    expect(screen.queryByText('Seats in use')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/attributes\/definitions\/4\/$/);
  });

  it('reports a fill failure as an error', { timeout: 15000 }, async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, [attribute()]))
      .mockResolvedValueOnce(jsonResponse(429, { detail: 'This organisation has spent its monthly model budget.' }));
    renderPage();
    await screen.findByText('Product tier');
    await userEvent.click(screen.getByRole('button', { name: 'Fill all for Product tier' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/monthly model budget/);
  });
});
