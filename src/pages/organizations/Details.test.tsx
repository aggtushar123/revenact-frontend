import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import customersReducer from '../../features/customers/customersSlice';
import { Details } from './Details';

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
  nps_score: null,
  csat_score: null,
  joined_date: null,
  renewal_date: null,
  contract_start_date: null,
  contract_end_date: null,
  arr_billed_at_account: '0.00',
  arr_billed_at_hq: '0.00',
  implementation_fee: '0.00',
  total_contract_value: '0.00',
  total_forecasted_renewal_revenue: '0.00',
  primary_product: '',
  additional_products_count: null,
  top_source_channel: '',
  total_contracted_seats: null,
  total_active_seats: null,
  seat_utilization_percentage: null,
  total_hires: null,
  scope_web_app: '',
  ces_percentage: null,
  churn_date: null,
  churn_reason: '',
  churn_comment: '',
  is_archived: false,
};

function renderDetails(id: string) {
  const store = configureStore({ reducer: { customers: customersReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/organizations/${id}`]}>
        <Routes>
          <Route path="/organizations/:id" element={<Details />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Organization Details page (/organizations/:id)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the org by the id in the URL and renders its real data on the General tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        const body = url.includes('/accounts/') || (url.includes('/activities/') || (url.includes('/emails/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')))))) ? [] : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');

    // Lifecycle stage is derived straight from the fetched Customer, via
    // the same mapCustomerToOrgRow() the organizations list uses. It
    // renders twice (the metrics banner and the pinned attributes list).
    expect(await screen.findAllByText('Onboarding')).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/accounts/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches and renders this organization\'s own real activities on the General tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/activities/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                type: 'health_check_review',
                type_display: 'Health Check Review',
                occurred_at: '2026-02-28',
                links: 2,
                watchers: 3,
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || (url.includes('/emails/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/'))))) ? [] : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');

    expect(await screen.findByText('Health Check Review')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/activities/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches this organization\'s own real emails on the General tab, under the Emails filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/emails/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                subject: 'Quarterly Business Review - Q4 2025 Recap',
                sender_name: 'Edgar Holmes',
                recipient_name: 'Sarah Chen',
                body: 'Hi Sarah, please find attached the QBR deck for Q4.',
                sent_at: '2026-01-15T15:45:00Z',
                links: 5,
                watchers: 3,
                is_starred: true,
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/'))))
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Emails' }));

    expect(await screen.findByText('Quarterly Business Review - Q4 2025 Recap')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/emails/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches this organization\'s own real tasks on the General tab, under the Tasks filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/tasks/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                title: 'Prepare QBR deck for Q1',
                assignee_name: 'Edgar Holmes',
                due_date: '2026-03-15',
                priority: 'high',
                status: 'in-progress',
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/')))
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Tasks' }));

    expect(await screen.findByText('Prepare QBR deck for Q1')).toBeInTheDocument();
    expect(screen.getByText('Edgar Holmes')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/tasks/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches this organization\'s own real notes on the General tab, under the Notes filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/notes/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                title: 'Call Notes: Product Feedback Session',
                author_name: 'Edgar Holmes',
                body: 'Customer expressed interest in AI-powered analytics.',
                logged_at: '2026-03-04',
                links: 2,
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || (url.includes('/tickets/') || url.includes('/calendar-events/') || url.includes('/contacts/'))
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Notes' }));

    expect(await screen.findByText('Call Notes: Product Feedback Session')).toBeInTheDocument();
    expect(screen.getByText('2 Links')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/notes/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches this organization\'s own real tickets on the General tab, under the Tickets filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/tickets/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                ticket_number: 'TKT-1042',
                title: 'Dashboard loading slow on large datasets',
                assignee_name: 'Support Team',
                status: 'in-progress',
                priority: 'high',
                opened_at: '2026-03-03',
                links: 2,
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/calendar-events/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Tickets' }));

    expect(await screen.findByText(/Dashboard loading slow on large datasets/)).toBeInTheDocument();
    expect(screen.getByText('2 Links')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/tickets/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches this organization\'s own real calendar events on the General tab, under the Calendar Events filter', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/calendar-events/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                title: 'Quarterly Business Review',
                description: 'Q1 2026 QBR with stakeholders',
                type: 'review',
                event_date: '2026-03-15',
                start_time: '10:00:00',
                end_time: '11:30:00',
                attendee_count: 3,
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/contacts/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Calendar Events' }));

    expect(await screen.findByText('Quarterly Business Review')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM — 11:30 AM')).toBeInTheDocument();
    expect(screen.getByText('3 attendees')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/calendar-events/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetches and renders this organization\'s own real contacts on the Contacts tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/contacts/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => [
              {
                id: 1,
                name: 'Sarah Chen',
                role: 'executive_sponsor',
                role_display: 'Executive Sponsor',
                email: 'sarah.chen@globex.example',
                phone: '+1 (408) 555-0123',
                status: 'active',
                sentiment: 'positive',
                last_contacted_at: '2026-08-31T00:00:00Z',
                company_id: 10,
                company_name: 'Globex Corp',
                account_name: null,
              },
            ],
          });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      })
    );

    renderDetails('10');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /^Contacts/ }));

    expect(await screen.findByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('Executive Sponsor')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/customers/10/contacts/'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  describe('Contacts tab search/Add/Edit/Delete', () => {
    const sarahChen = {
      id: 1,
      name: 'Sarah Chen',
      role: 'executive_sponsor',
      role_display: 'Executive Sponsor',
      email: 'sarah.chen@globex.example',
      phone: '+1 (408) 555-0123',
      status: 'active',
      sentiment: 'positive',
      last_contacted_at: '2026-08-31T00:00:00Z',
      company_id: 10,
      company_name: 'Globex Corp',
      account_name: null,
    };
    const jamesWilson = {
      ...sarahChen,
      id: 2,
      name: 'James Wilson',
      role_display: 'Champion',
      email: 'j.wilson@globex.example',
    };

    async function openContactsTab(fetchMock: ReturnType<typeof vi.fn>) {
      vi.stubGlobal('fetch', fetchMock);
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Contacts/ }));
      await screen.findByText('Sarah Chen');
      return user;
    }

    function baseFetchMock(contactsResponse: unknown) {
      return vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'GET' && url.includes('/contacts/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => contactsResponse });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
    }

    it('filters the already-loaded contacts client-side as you type', async () => {
      const user = await openContactsTab(baseFetchMock([sarahChen, jamesWilson]));
      expect(screen.getByText('James Wilson')).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText('Search contacts by name, role or email...'), 'sarah');

      expect(screen.queryByText('James Wilson')).not.toBeInTheDocument();
      expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    });

    it('adding a contact posts to /customers/10/contacts/ (organization-level)', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'POST' && url.endsWith('/customers/10/contacts/')) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: async () => ({ ...sarahChen, id: 99, name: 'New Person' }),
          });
        }
        if (method === 'GET' && url.includes('/contacts/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [sarahChen] });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openContactsTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Add Contact' }));
      await user.type(screen.getByLabelText('Name *'), 'New Person');
      await user.type(screen.getByLabelText('Email *'), 'new.person@globex.example');
      const submitButton = screen
        .getAllByRole('button', { name: 'Add Contact' })
        .find((btn) => btn.closest('form'))!;
      await user.click(submitButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/customers/10/contacts/'),
          expect.objectContaining({ method: 'POST' })
        )
      );
    });

    it('editing a contact PATCHes /api/v1/contacts/<id>/ and updates it in place', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string; body?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'PATCH' && url.endsWith('/contacts/1/')) {
          const body = JSON.parse(options!.body!);
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ ...sarahChen, ...body }) });
        }
        if (method === 'GET' && url.includes('/contacts/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [sarahChen] });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openContactsTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Actions for Sarah Chen' }));
      await user.click(screen.getByRole('button', { name: 'Edit Contact' }));
      const nameInput = screen.getByLabelText('Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Sarah Chen-Wu');
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/contacts/1/'),
          expect.objectContaining({ method: 'PATCH' })
        )
      );
      expect(await screen.findByText('Sarah Chen-Wu')).toBeInTheDocument();
    });

    it('deleting a contact DELETEs /api/v1/contacts/<id>/ and removes the row', async () => {
      const fetchMock = vi.fn((url: string, options?: { method?: string }) => {
        const method = options?.method ?? 'GET';
        if (method === 'DELETE' && url.endsWith('/contacts/1/')) {
          return Promise.resolve({ ok: true, status: 204, json: async () => null });
        }
        if (method === 'GET' && url.includes('/contacts/')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => [sarahChen] });
        }
        const body = url.includes('/accounts/') || url.includes('/activities/') || url.includes('/emails/') || url.includes('/tasks/') || url.includes('/notes/') || url.includes('/tickets/') || url.includes('/calendar-events/')
          ? []
          : globex;
        return Promise.resolve({ ok: true, status: 200, json: async () => body });
      });
      const user = await openContactsTab(fetchMock);

      await user.click(screen.getByRole('button', { name: 'Actions for Sarah Chen' }));
      await user.click(screen.getByRole('button', { name: 'Delete Contact' }));
      await user.click(screen.getByRole('button', { name: 'Delete' }));

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/contacts/1/'),
          expect.objectContaining({ method: 'DELETE' })
        )
      );
      expect(screen.queryByText('Sarah Chen')).not.toBeInTheDocument();
    });
  });

  it('shows a loading state before the fetch resolves', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    renderDetails('10');

    expect(screen.getByText('Loading organization…')).toBeInTheDocument();
  });

  it('shows the backend error instead of crashing (e.g. a 404 for another org\'s id)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: 'Not found.' }) })
    );

    renderDetails('999');

    expect(await screen.findByText('Not found.')).toBeInTheDocument();
  });

  describe('Accounts tab (one Customer has many Accounts)', () => {
    const account = {
      id: 1,
      customer: 10,
      name: 'North America Enterprise',
      domain: '',
      owner: null,
      created_at: '2026-08-31T00:00:00Z',
      updated_at: '2026-08-31T00:00:00Z',
      lifecycle_stage: 'live' as const,
      health_score: '9.5',
      health_category: 'good' as const,
      pulse: [1, 1, 1, 1, 0],
      ai_pulse_score: 'very_satisfied' as const,
      ai_pulse_reason: 'Strong executive sponsorship.',
      nps_score: 100,
      csat_score: '100.00',
      renewal_date: '2026-03-02',
      arr: '33600.00',
    };

    async function openAccountsTab(accounts: unknown[]) {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          const body = (url.includes('/activities/') || (url.includes('/emails/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/')))))) ? [] : url.includes('/accounts/') ? accounts : globex;
          return Promise.resolve({ ok: true, status: 200, json: async () => body });
        })
      );
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Accounts/ }));
    }

    it('shows real accounts fetched for this organization, and reflects the count in the tab badge', async () => {
      await openAccountsTab([account]);

      expect(await screen.findByText('North America Enterprise')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Accounts\(1\)$/ })).toBeInTheDocument();
    });

    it('shows a loading state before the accounts fetch resolves', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if ((url.includes('/activities/') || (url.includes('/emails/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/'))))))) {
            return Promise.resolve({ ok: true, status: 200, json: async () => [] });
          }
          if (url.includes('/accounts/')) return new Promise(() => {});
          return Promise.resolve({ ok: true, status: 200, json: async () => globex });
        })
      );
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Accounts/ }));

      expect(await screen.findByText('Loading accounts…')).toBeInTheDocument();
    });

    it('shows an empty state when the organization has no accounts yet', async () => {
      await openAccountsTab([]);

      expect(await screen.findByText('No accounts for this organization yet.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Accounts\(0\)$/ })).toBeInTheDocument();
    });

    it('shows the backend error instead of crashing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn((url: string) => {
          if ((url.includes('/activities/') || (url.includes('/emails/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/'))))))) {
            return Promise.resolve({ ok: true, status: 200, json: async () => [] });
          }
          if (url.includes('/accounts/')) {
            return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: 'Not found.' }) });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => globex });
        })
      );
      renderDetails('10');
      const user = userEvent.setup();
      await user.click(await screen.findByRole('button', { name: /^Accounts/ }));

      expect(await screen.findAllByText('Not found.')).not.toHaveLength(0);
    });

    it('renders the CSM score without NaN when an account has no pulse history yet (a freshly-Added one)', async () => {
      // pulse: [] is the real default for a brand-new Account (see
      // customers/models.py) — the metrics banner's CSM average used to
      // divide 0/0 for a row like this, producing a NaN strokeDashoffset
      // React logs as an error. Guarding it is the fix; this pins it down.
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      await openAccountsTab([{ ...account, pulse: [] }]);
      await screen.findByText('North America Enterprise');

      const nanWarning = consoleError.mock.calls.find((args) =>
        args.some((arg) => String(arg).includes('strokeDashoffset'))
      );
      expect(nanWarning).toBeUndefined();
      consoleError.mockRestore();
    });

    describe('Add/Edit Account', () => {
      // Stateful mock: GET/POST/PATCH against /customers/10/accounts/...
      // all operate on the same in-memory list, mirroring the real
      // backend's behavior closely enough to drive the modal end to end.
      function makeAccountsMutationFetchMock(initial: (typeof account)[]) {
        let accounts = [...initial];
        let nextId = 1 + Math.max(0, ...accounts.map((a) => a.id));
        return vi.fn((url: string, options?: { method?: string; body?: string }) => {
          const method = options?.method ?? 'GET';
          if (url.includes('/auth/members/')) {
            return Promise.resolve({ ok: true, status: 200, json: async () => [] });
          }
          if (method === 'POST' && url.endsWith('/customers/10/accounts/')) {
            const body = JSON.parse(options!.body!);
            const created = { ...account, ...body, id: nextId++, customer: 10, owner: null };
            accounts = [created, ...accounts];
            return Promise.resolve({ ok: true, status: 201, json: async () => created });
          }
          const patchMatch = /\/customers\/10\/accounts\/(\d+)\/$/.exec(url);
          if (method === 'PATCH' && patchMatch) {
            const id = Number(patchMatch[1]);
            const body = JSON.parse(options!.body!);
            accounts = accounts.map((a) => (a.id === id ? { ...a, ...body } : a));
            return Promise.resolve({ ok: true, status: 200, json: async () => accounts.find((a) => a.id === id) });
          }
          if ((url.includes('/activities/') || (url.includes('/emails/') || (url.includes('/tasks/') || (url.includes('/notes/') || (url.includes('/tickets/') || url.includes('/calendar-events/'))))))) {
            return Promise.resolve({ ok: true, status: 200, json: async () => [] });
          }
          if (url.includes('/accounts/')) {
            return Promise.resolve({ ok: true, status: 200, json: async () => accounts });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => globex });
        });
      }

      it('adding an account posts to /customers/<id>/accounts/ and shows it in the table', async () => {
        vi.stubGlobal('fetch', makeAccountsMutationFetchMock([]));
        const user = userEvent.setup();

        renderDetails('10');
        await user.click(await screen.findByRole('button', { name: /^Accounts/ }));
        await screen.findByText('No accounts for this organization yet.');

        await user.click(screen.getByRole('button', { name: 'Add Account' }));
        await user.type(screen.getByLabelText('Name *'), 'EMEA');
        await user.click(screen.getByRole('button', { name: 'Create Account' }));

        expect(await screen.findByText('EMEA')).toBeInTheDocument();
        expect(screen.queryByText('Create Account')).not.toBeInTheDocument(); // modal closed
      });

      it('editing an account prefills the form and PATCHes the change', async () => {
        vi.stubGlobal('fetch', makeAccountsMutationFetchMock([account]));
        const user = userEvent.setup();

        renderDetails('10');
        await user.click(await screen.findByRole('button', { name: /^Accounts/ }));
        await screen.findByText('North America Enterprise');

        await user.click(screen.getByRole('button', { name: 'Edit North America Enterprise' }));

        const nameInput = await screen.findByLabelText('Name *');
        expect(nameInput).toHaveValue('North America Enterprise');
        await user.clear(nameInput);
        await user.type(nameInput, 'North America Renamed');
        await user.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByText('North America Renamed')).toBeInTheDocument();
      });
    });
  });
});
