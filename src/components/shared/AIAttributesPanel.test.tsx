import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AIAttributesPanel } from './AIAttributesPanel';
import { attribute, jsonResponse, value, withLatest } from '../../test/attributesFixtures';

// Integration tier: the real panel against the fetch boundary, responses
// shaped like the contract.

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function respond(routes: Record<string, (init?: RequestInit) => unknown>) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url.replace(/^.*\/api\/v1/, '')}`;
    const handler = routes[key];
    if (!handler) throw new Error(`unexpected ${key}`);
    return jsonResponse(key.startsWith('POST') ? 201 : 200, handler(init));
  });
}

function renderPanel(props: { customerId?: number; accountId?: number } = { customerId: 12 }) {
  return render(
    <MemoryRouter>
      <AIAttributesPanel {...props} />
    </MemoryRouter>
  );
}

describe('AIAttributesPanel', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('shows each attribute with its latest value, why and sources', { timeout: 15000 }, async () => {
    const seats = attribute({ id: 4, name: 'Seats in use', value_type: 'number', picklist_options: [] });
    respond({
      'GET /attributes/values/?customer=12': () => [withLatest(attribute(), value()), withLatest(seats, null)],
    });
    renderPanel();
    expect(await screen.findByText('Product tier')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Not filled yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Why Enterprise?' }));
    expect(screen.getByText('Two notes and a ticket mention the Enterprise tier.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Product usage/ })).toHaveAttribute('href', '/organizations/12');
  });

  it('refreshes one attribute and shows the new answer', { timeout: 15000 }, async () => {
    respond({
      'GET /attributes/values/?customer=12': () => [withLatest(attribute(), value({ value: 'SMB' }))],
      'POST /attributes/definitions/3/fill/': () => value({ id: 91, value: 'Enterprise' }),
    });
    renderPanel();
    expect(await screen.findByText('SMB')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh Product tier' }));
    expect(await screen.findByText('Enterprise')).toBeInTheDocument();
    const call = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST');
    expect(JSON.parse((call?.[1] as RequestInit).body as string)).toEqual({ customer: 12 });
  });

  it('lets a person override, and marks the row as theirs', { timeout: 15000 }, async () => {
    respond({
      'GET /attributes/values/?customer=12': () => [withLatest(attribute(), value())],
      'POST /attributes/values/': () => value({ id: 92, value: 'SMB', origin: 'human', reasoning: '', sources: [], set_by: { id: 1, name: 'Alice' } }),
    });
    renderPanel();
    await screen.findByText('Enterprise');
    await userEvent.click(screen.getByRole('button', { name: 'Edit Product tier' }));
    await userEvent.selectOptions(screen.getByLabelText('Product tier'), 'SMB');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('SMB')).toBeInTheDocument();
    expect(screen.getByText('Set by Alice')).toBeInTheDocument();
  });

  it('shows the history newest first', { timeout: 15000 }, async () => {
    respond({
      'GET /attributes/values/?customer=12': () => [withLatest(attribute(), value())],
      'GET /attributes/values/history/?attribute=3&customer=12': () => [
        value({ id: 92, value: 'Enterprise', origin: 'human', set_by: { id: 1, name: 'Alice' }, computed_at: '2026-09-22T10:00:00Z' }),
        value({ id: 90, value: 'SMB', computed_at: '2026-09-20T09:00:00Z' }),
      ],
    });
    renderPanel();
    await screen.findByText('Enterprise');
    await userEvent.click(screen.getByRole('button', { name: 'History of Product tier' }));
    const list = await screen.findByRole('list', { name: 'History of Product tier' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Enterprise');
    expect(items[0]).toHaveTextContent('Alice');
    expect(items[1]).toHaveTextContent('SMB');
  });

  it('says when the reasoning is withheld because the reader cannot see its records', { timeout: 15000 }, async () => {
    respond({
      'GET /attributes/values/?customer=12': () => [withLatest(attribute(), value({ reasoning: '', sources: [], hidden_sources: 2 }))],
    });
    renderPanel();
    await screen.findByText('Enterprise');
    await userEvent.click(screen.getByRole('button', { name: 'Why Enterprise?' }));
    expect(screen.getByText(/Based on 2 records you cannot see/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Product usage/ })).not.toBeInTheDocument();
  });

  it('points at settings when nothing is defined, and reads an account', { timeout: 15000 }, async () => {
    respond({ 'GET /attributes/values/?account=7': () => [] });
    renderPanel({ accountId: 7 });
    expect(await screen.findByRole('link', { name: /Define one/ })).toHaveAttribute('href', '/settings/ai-attributes');
  });
});
