import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { fetchOpportunitiesForCustomer, fetchRisksForCustomer } from '../../features/customers/customersSlice';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { makeDetailStore } from '../../pages/organizations/testDetail';
import { PipelinesTab } from './PipelinesTab';

// These tests pinned the organization page's Deals & risks tab while it
// rendered this shared tab (delivery 1). The account page still renders
// PipelinesTab, so they stay here, on a harness that reads one
// organization's opportunities and risks the way the old tab did.
function Harness({ customerId }: { customerId: number }) {
  const dispatch = useAppDispatch();
  const {
    pipelineOpportunities,
    pipelineOpportunitiesLoading,
    pipelineOpportunitiesError,
    pipelineRisks,
    pipelineRisksLoading,
    pipelineRisksError,
  } = useAppSelector((state) => state.customers);
  useEffect(() => {
    dispatch(fetchOpportunitiesForCustomer(customerId));
    dispatch(fetchRisksForCustomer(customerId));
  }, [dispatch, customerId]);
  return (
    <PipelinesTab
      opportunities={pipelineOpportunities}
      opportunitiesLoading={pipelineOpportunitiesLoading}
      opportunitiesError={pipelineOpportunitiesError}
      risks={pipelineRisks}
      risksLoading={pipelineRisksLoading}
      risksError={pipelineRisksError}
      customerId={customerId}
    />
  );
}

function renderDeals() {
  render(
    <Provider store={makeDetailStore()}>
      <MemoryRouter>
        <Harness customerId={10} />
      </MemoryRouter>
    </Provider>,
  );
}


// Minimal but real shape, matching revenact-backend's CustomerSerializer —
// see customersSlice.test.ts / docs/API_CONTRACTS.md -> customers.
const globex = {
  id: 10,
  name: 'Globex Corp',
  address: '123 Main St',
  domain: 'globex.example',
  owner: null,
  created_by: null,
  modified_by: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'onboarding' as const,
  health_score: '5.0',
  health_category: 'average' as const,
  pulse: [],
  ai_pulse_score: '' as const,
  ai_pulse_reason: '',
  account_pulse: {
    value: '2.3',
    label: 'At risk' as const,
    category: 2 as const,
    breakdown: [
      { key: 'ai_pulse' as const, label: 'AI pulse', weight: '3.0', reading: '2.0', note: 'what the model reads' },
      { key: 'csm_pulse' as const, label: 'CSM pulse', weight: '2.5', reading: null, note: 'not set' },
      { key: 'sentiment' as const, label: 'Recent sentiment', weight: '2.0', reading: '3.0', note: '1 positive, 1 negative of 2 in the last 30 days' },
      { key: 'touch' as const, label: 'Last contact', weight: '1.5', reading: '4.8', note: '4 days ago' },
      { key: 'support' as const, label: 'Open tickets', weight: '1.0', reading: '1.0', note: '12 open' },
    ],
  },
  nps_score: null,
  csat_score: null,
  joined_date: null,
  renewal_date: null,
  contract_start_date: null,
  contract_end_date: null,
  currency: 'USD' as const,
  currency_display: 'US Dollar ($)',
  arr_billed_at_account: '0.00',
  arr_billed_at_hq: '0.00',
  implementation_fee: '0.00',
  total_contract_value: '0.00',
  total_forecasted_renewal_revenue: '0.00',
  primary_product: null,
  primary_product_name: '',
  additional_products_count: null,
  top_source_channel: '',
  total_contracted_seats: null,
  total_active_seats: null,
  seat_utilization_percentage: null,
  total_hires: null,
  scope_web_app: '',
  ces_percentage: null,
  churn_date: null,
  churn_reason: '' as const,
  churn_reason_display: '',
  churn_comment: '',
  is_archived: false,
};

describe('Deals & risks tab (the Pipelines tab inside the organization page)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and renders this organization\'s own real opportunities and risks on the Pipelines tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.endsWith('/customers/10/opportunities/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                title: 'Renewal Expansion Opportunity',
                mrr: '30000.00',
                stage: 'qualification',
                stage_display: 'Qualification',
                priority: 'high',
                priority_display: 'High',
                department: '' as const, department_display: '',
                companies: [{ id: 10, name: 'Globex Corp' }],
                account_name: null,
              },
            ],
          });
        }
        if (url.endsWith('/customers/10/risks/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                title: 'Renewal Risk — Contract Expiry',
                mrr: '8500.00',
                stage: 'open',
                stage_display: 'Open',
                priority: 'high',
                priority_display: 'High',
                department: '' as const, department_display: '',
                companies: [{ id: 10, name: 'Globex Corp' }],
                account_name: null,
              },
            ],
          });
        }
        const body = url.includes('/attributes/') || url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDeals();
    const user = userEvent.setup();

    expect(await screen.findByText('Renewal Expansion Opportunity')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/opportunities/'),
      expect.objectContaining({ method: 'GET' })
    );

    await user.click(screen.getByRole('button', { name: /^Risks/ }));
    expect(await screen.findByText('Renewal Risk — Contract Expiry')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/risks/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  describe('Pipelines tab search/Add/Edit/Delete', () => {
    const orgOpp = {
      id: 1,
      title: 'Renewal Expansion Opportunity',
      mrr: '30000.00',
      stage: 'qualification',
      stage_display: 'Qualification',
      priority: 'high',
      priority_display: 'High',
      department: '' as const, department_display: '',
      companies: [{ id: 10, name: 'Globex Corp' }],
      account_name: null,
    };
    const accountLevelOpp = {
      ...orgOpp,
      id: 2,
      title: 'Seat Expansion Opportunity',
      account_name: 'North America',
    };
    const orgRisk = {
      id: 1,
      title: 'Renewal Risk — Contract Expiry',
      mrr: '8500.00',
      stage: 'open',
      stage_display: 'Open',
      priority: 'high',
      priority_display: 'High',
      department: '' as const, department_display: '',
      companies: [{ id: 10, name: 'Globex Corp' }],
      account_name: null,
    };

    async function openPipelinesTab(fetchMock: ReturnType<typeof vi.fn>) {
      vi.stubGlobal('fetch', fetchMock);
      renderDeals();
      const user = userEvent.setup();
      await screen.findByText('Renewal Expansion Opportunity');
      return user;
    }

    function baseFetchMock({ opportunities, risks }: { opportunities: unknown; risks: unknown }) {
      return vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'GET' && url.endsWith('/customers/10/opportunities/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => opportunities });
        }
        if (method === 'GET' && url.endsWith('/customers/10/risks/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => risks });
        }
        const body = url.includes('/attributes/') || url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
    }

    it('filters the already-loaded opportunities client-side as you type', async () => {
      const user = await openPipelinesTab(
        baseFetchMock({ opportunities: [orgOpp, accountLevelOpp], risks: [] })
      );
      expect(screen.getByText('Seat Expansion Opportunity')).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText('Search opportunities by title...'), 'Seat');

      expect(screen.queryByText('Renewal Expansion Opportunity')).not.toBeInTheDocument();
      expect(screen.getByText('Seat Expansion Opportunity')).toBeInTheDocument();
    });

    it('shows both organisation-level and account-level opportunities together, labeled by Account', async () => {
      await openPipelinesTab(baseFetchMock({ opportunities: [orgOpp, accountLevelOpp], risks: [] }));

      expect(screen.getByText('Seat Expansion Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Globex Corp')).toBeInTheDocument();
      expect(screen.getByText('Globex Corp • North America')).toBeInTheDocument();
    });

    it('the Board toggle switches to a Kanban board grouped by stage', async () => {
      await openPipelinesTab(baseFetchMock({ opportunities: [orgOpp, accountLevelOpp], risks: [] }));

      // List (the default) has no stage-column headers of its own —
      // stage is just a per-row pill.
      expect(screen.queryByText('Discovery')).not.toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByTitle('Board view'));

      // Both opportunities are 'qualification' — same column, both
      // cards still visible (not narrowed by drag state or anything).
      expect(screen.getByText('Qualification')).toBeInTheDocument();
      expect(screen.getByText('Renewal Expansion Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Seat Expansion Opportunity')).toBeInTheDocument();
      // Every other stage column still renders, just empty — "Closed
      // Won" isn't checked here since it collides with the summary
      // banner's own "Closed Won" stat card title above the board.
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Negotiation')).toBeInTheDocument();
    });

    it('the Board toggle works for Risks too, grouped by its own 4 stages', async () => {
      await openPipelinesTab(baseFetchMock({ opportunities: [orgOpp], risks: [orgRisk] }));
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /^Risks/ }));
      await user.click(screen.getByTitle('Board view'));

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Renewal Risk — Contract Expiry')).toBeInTheDocument();
      expect(screen.getByText('Mitigated')).toBeInTheDocument();
      expect(screen.getByText('Abandoned')).toBeInTheDocument();
    });

    it('clicking a column\'s own + opens Add with that column\'s stage preselected', async () => {
      await openPipelinesTab(baseFetchMock({ opportunities: [orgOpp], risks: [] }));
      const user = userEvent.setup();
      await user.click(screen.getByTitle('Board view'));

      // "Negotiation" column's own + button, not the toolbar's "Add
      // Opportunity" (which defaults to Discovery).
      // "Negotiation" text sits in an inner wrapper alongside the
      // count pill; its own "+" button is a sibling one level up, in
      // the column header row both share.
      const negotiationHeader = screen.getByText('Negotiation').closest('div')!.parentElement!;
      await user.click(within(negotiationHeader).getByRole('button'));

      expect(await screen.findByRole('heading', { name: 'Add Opportunity' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /stage/i })).toHaveValue('negotiation');
    });

    it('adding an opportunity posts to /customers/10/opportunities/ (organization-level)', async () => {
      // A reassignable backing array (not mutated in place — Redux
      // freezes whatever a fulfilled action's payload was, so a later
      // .push() against that same frozen array reference throws) — the
      // refetch that follows a successful create (see
      // OpportunityFormModal's own `onSaved`) needs its own GET to
      // actually reflect the new row, same as a real backend would.
      let opportunitiesData: unknown[] = [orgOpp];
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'POST' && url.endsWith('/customers/10/opportunities/')) {
          const created = { ...orgOpp, id: 99, title: 'New Opp' };
          opportunitiesData = [...opportunitiesData, created];
          return Promise.resolve({ ok: true, status: 201, json: async () => created });
        }
        if (method === 'GET' && url.endsWith('/customers/10/opportunities/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => opportunitiesData });
        }
        if (method === 'GET' && url.endsWith('/customers/10/risks/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        }
        const body = url.includes('/attributes/') || url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Add Opportunity' }));
      await user.type(screen.getByLabelText('Title *'), 'New Opp');
      const submitButton = screen
        .getAllByRole('button', { name: 'Add Opportunity' })
        .find((btn) => btn.closest('form'))!;
      await user.click(submitButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/customers/10/opportunities/'),
          expect.objectContaining({ method: 'POST' })
        )
      );
      expect(await screen.findByText('New Opp')).toBeInTheDocument();
    });

    it('editing an opportunity PATCHes /api/v1/opportunities/<id>/ and updates it in place', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'PATCH' && url.endsWith('/opportunities/1/')) {
          const body = JSON.parse(options!.body!);
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ...orgOpp, ...body }) });
        }
        if (method === 'GET' && url.endsWith('/customers/10/opportunities/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [orgOpp] });
        }
        if (method === 'GET' && url.endsWith('/customers/10/risks/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        }
        const body = url.includes('/attributes/') || url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByText('Renewal Expansion Opportunity'));
      const titleInput = screen.getByLabelText('Title *');
      await user.clear(titleInput);
      await user.type(titleInput, 'Renamed Opportunity');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/opportunities/1/'),
          expect.objectContaining({ method: 'PATCH' })
        )
      );
      expect(await screen.findByText('Renamed Opportunity')).toBeInTheDocument();
    });

    it('deleting an opportunity from its edit modal DELETEs /api/v1/opportunities/<id>/ and removes the row', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'DELETE' && url.endsWith('/opportunities/1/')) {
          return Promise.resolve({ ok: true, status: 204, json: async () => null });
        }
        if (method === 'GET' && url.endsWith('/customers/10/opportunities/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [orgOpp] });
        }
        if (method === 'GET' && url.endsWith('/customers/10/risks/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [] });
        }
        const body = url.includes('/attributes/') || url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByText('Renewal Expansion Opportunity'));
      await user.click(screen.getByRole('button', { name: 'Delete' }));
      const confirmButtons = screen.getAllByRole('button', { name: 'Delete' });
      await user.click(confirmButtons[confirmButtons.length - 1]);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/opportunities/1/'),
          expect.objectContaining({ method: 'DELETE' })
        )
      );
      expect(screen.queryByText('Renewal Expansion Opportunity')).not.toBeInTheDocument();
    });

    it('switching to the Risks sub-tab shows risks instead, and Add Risk posts to /customers/10/risks/', async () => {
      // Same reassignable-backing-array reasoning as the Opportunity
      // Add test above.
      let risksData: unknown[] = [orgRisk];
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'POST' && url.endsWith('/customers/10/risks/')) {
          const created = { ...orgRisk, id: 99, title: 'New Risk' };
          risksData = [...risksData, created];
          return Promise.resolve({ ok: true, status: 201, json: async () => created });
        }
        if (method === 'GET' && url.endsWith('/customers/10/opportunities/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [orgOpp] });
        }
        if (method === 'GET' && url.endsWith('/customers/10/risks/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => risksData });
        }
        const body = url.includes('/attributes/') || url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openPipelinesTab(fetchMock);

      await user.click(screen.getByRole('button', { name: /^Risks/ }));
      expect(await screen.findByText('Renewal Risk — Contract Expiry')).toBeInTheDocument();
      expect(screen.queryByText('Renewal Expansion Opportunity')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Add Risk' }));
      await user.type(screen.getByLabelText('Title *'), 'New Risk');
      const submitButton = screen
        .getAllByRole('button', { name: 'Add Risk' })
        .find((btn) => btn.closest('form'))!;
      await user.click(submitButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/customers/10/risks/'),
          expect.objectContaining({ method: 'POST' })
        )
      );
      expect(await screen.findByText('New Risk')).toBeInTheDocument();
    });
  });
});
