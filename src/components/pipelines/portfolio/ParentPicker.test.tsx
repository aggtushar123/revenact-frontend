import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PipelineParentChoice } from '../../../features/pipelines/pipelineApi';
import { stubPipelines } from '../../../features/pipelines/testPipelines';
import { ParentPicker } from './ParentPicker';

// Unit tier: the picker on its own, with fetch stubbed in the shapes of
// GET /customers/?search= and GET /accounts/?search= (testPipelines.ts).
type Spy = ReturnType<typeof stubPipelines>;
const searches = (spy: Spy) =>
  spy.mock.calls
    .map(([input]) => new URL(String(input)))
    .filter((url) => url.pathname === '/api/v1/customers/' || url.pathname === '/api/v1/accounts/')
    .map((url) => `${url.pathname.replace('/api/v1', '')}?${url.searchParams.get('search') ?? ''}`);

function Harness({ onPick = () => {} }: { onPick?: (choice: PipelineParentChoice | null) => void }) {
  const [value, setValue] = useState<PipelineParentChoice | null>(null);
  return (
    <ParentPicker
      value={value}
      onChange={(choice) => {
        setValue(choice);
        onPick(choice);
      }}
    />
  );
}

describe('ParentPicker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lists the organisations and accounts the server returns, then searches the server as you type', async () => {
    const spy = stubPipelines();
    render(<Harness />);
    const organisations = await screen.findByRole('group', { name: 'Organizations' });
    expect(within(organisations).getAllByRole('button').map((button) => button.textContent)).toEqual(['Pizza Hut', 'Globex']);
    const accounts = screen.getByRole('group', { name: 'Accounts' });
    expect(within(accounts).getByRole('button', { name: /^Pizza Hut EMEA/ })).toHaveTextContent('Pizza Hut EMEAPart of Pizza Hut');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Belongs to' }), 'glob');
    await waitFor(() => expect(searches(spy)).toContain('/customers/?glob'));
    expect(searches(spy)).toContain('/accounts/?glob');
    // One request per settled search, not one per key.
    expect(searches(spy).filter((search) => search.startsWith('/customers/'))).toEqual(['/customers/?', '/customers/?glob']);
    await waitFor(() => expect(within(screen.getByRole('group', { name: 'Organizations' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Globex']));
    expect(screen.queryByRole('group', { name: 'Accounts' })).toBeNull();
  });

  it('picks an account, shows it, and Change goes back to the search', async () => {
    stubPipelines();
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);
    await userEvent.click(await within(await screen.findByRole('group', { name: 'Accounts' })).findByRole('button', { name: /^Pizza Hut EMEA/ }));
    expect(onPick).toHaveBeenLastCalledWith({ type: 'account', id: 12, name: 'Pizza Hut EMEA', partOf: 'Pizza Hut' });
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getByText('Pizza Hut EMEA')).toBeInTheDocument();
    expect(screen.getByText('Account · Part of Pizza Hut')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(onPick).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('searchbox', { name: 'Belongs to' })).toHaveFocus();
  });

  it('says when nothing matches', async () => {
    stubPipelines();
    render(<Harness />);
    await screen.findByRole('group', { name: 'Organizations' });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Belongs to' }), 'zzz');
    expect(await screen.findByText('No organization or account matches “zzz”.')).toBeInTheDocument();
  });

  it('says when there are more matches than it shows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ count: 40, next: 'x', previous: null, results: [{ id: 1, name: 'Acme', customers: [] }] }) })),
    );
    render(<Harness />);
    expect(await screen.findByText('Showing the first matches. Keep typing to narrow them.')).toBeInTheDocument();
  });

  it('says when the search fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ detail: 'Server error' }) })));
    render(<Harness />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not search organizations and accounts.');
  });
});
