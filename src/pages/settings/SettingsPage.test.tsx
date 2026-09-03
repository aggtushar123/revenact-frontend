import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';

// Integration tier (see the `testing` skill): no store needed at all —
// this page talks to apiFetch directly (there's no dedicated "walk
// every page of customers" thunk in customersSlice, see SettingsPage's
// own docstring on why), so only the fetch boundary needs mocking.
// Two customers, one with domain/renewal_date/churn_reason filled in
// and one without, pins down the real Usage% math (50%, not a
// fabricated per-row number the old mock had).
const filledOrg = {
  id: 1,
  name: 'Globex Corp',
  address: 'Chicago, IL',
  domain: 'globex.com',
  email: 'contact@globex.com',
  phone: '+1 555 0100',
  owner: { id: 1, name: 'Alice', email: 'alice@acme.io', avatar: '', role: 'admin', organisation: { id: 1, name: 'Acme', slug: 'acme' }, is_active: true },
  created_by: null,
  modified_by: null,
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'live',
  health_score: '8.0',
  health_category: 'good',
  pulse: [1, 1, 1, 0, 0],
  ai_pulse_score: 'satisfied',
  ai_pulse_reason: 'Steady usage.',
  nps_score: 40,
  csat_score: '80.00',
  joined_date: '2024-01-01',
  renewal_date: '2026-01-01',
  contract_start_date: '2024-01-01',
  contract_end_date: '2026-01-01',
  arr_billed_at_account: '60000.00',
  arr_billed_at_hq: '60000.00',
  implementation_fee: '10000.00',
  total_contract_value: '70000.00',
  total_forecasted_renewal_revenue: '73500.00',
  primary_product: 'Product A',
  additional_products_count: 2,
  top_source_channel: 'Direct Sales',
  total_contracted_seats: 100,
  total_active_seats: 80,
  seat_utilization_percentage: 80,
  total_hires: 10,
  scope_web_app: 'Full',
  ces_percentage: '90.00',
  churn_date: null,
  churn_reason: '',
  churn_comment: '',
  is_archived: false,
};

const blankOrg = {
  ...filledOrg,
  id: 2,
  name: 'Initech',
  domain: '',
  owner: null,
  renewal_date: null,
  arr_billed_at_account: '0.00',
  nps_score: null,
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('SettingsPage — Data tab, Organization sub-tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches every organization and renders real Custom/System attribute sections', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [filledOrg, blankOrg] })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<SettingsPage />);

    expect(await screen.findByText('Custom Attributes')).toBeInTheDocument();
    expect(screen.getByText('System Attributes')).toBeInTheDocument();
    // Real field names/counts, not the old mock's fabricated ones.
    expect(screen.queryByText('Starting SaaS MRR')).not.toBeInTheDocument();
    expect(screen.getByText('lifecycle_stage')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/customers/'), expect.anything());
  });

  it('walks every page of /customers/ via `next`, not just the first', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/customers/')) {
        return Promise.resolve(
          jsonResponse(200, {
            count: 2,
            next: 'http://localhost:8000/api/v1/customers/?page=2',
            previous: null,
            results: [filledOrg],
          })
        );
      }
      return Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [blankOrg] })
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<SettingsPage />);
    await screen.findByText('Custom Attributes');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/customers/?page=2',
        expect.anything()
      )
    );
  });

  it('computes a real Usage% from the fetched organizations, not a fabricated one', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [filledOrg, blankOrg] })
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<SettingsPage />);
    await screen.findByText('Domain');

    // Domain: filledOrg has one, blankOrg's is '' -- 1 of 2 = 50%.
    const domainRow = screen.getByText('Domain').closest('tr')!;
    expect(domainRow.textContent).toContain('50%');

    // Name: both set -- 2 of 2 = 100%. ("Name" also matches each
    // section's own column header <th> -- the attribute row's own is
    // the <span>.)
    const nameCell = screen.getAllByText('Name').find((el) => el.tagName === 'SPAN')!;
    expect(nameCell.closest('tr')!.textContent).toContain('100%');
  });

  it('shows the backend error message instead of crashing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));

    render(<SettingsPage />);

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching filters the attribute list by display name or field name', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(200, { count: 1, next: null, previous: null, results: [filledOrg] }))
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await screen.findByText('Custom Attributes');
    expect(screen.getByText('Lifecycle Stage')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Search from \d+ organization attributes/),
      'lifecycle'
    );

    expect(screen.queryByText('Domain')).not.toBeInTheDocument();
    expect(screen.getByText('Lifecycle Stage')).toBeInTheDocument();
  });

  it('switching to a still-unwired sub-tab shows the placeholder instead of the table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(jsonResponse(200, { count: 0, next: null, previous: null, results: [] })))
    );
    const user = userEvent.setup();

    render(<SettingsPage />);
    await screen.findByText('Custom Attributes');

    // Account/Contact have their own real attributes tables now too
    // (see their own describe blocks below) -- Pipeline is the one
    // still unwired.
    await user.click(screen.getByRole('button', { name: 'Pipeline' }));

    expect(screen.queryByText('Custom Attributes')).not.toBeInTheDocument();
    expect(screen.getByText(/under construction/i)).toBeInTheDocument();
  });
});

// Minimal but real shape, matching revenact-backend's AccountSerializer
// — see docs/API_CONTRACTS.md -> customers -> Account.
const filledAccount = {
  id: 1,
  customers: [{ id: 6, name: 'Apple Inc' }],
  name: 'North America Enterprise',
  domain: 'na.acme.com',
  address: 'Austin, TX',
  email: 'na@acme.com',
  phone: '+1 555 0100',
  owner: { id: 1, name: 'Alice', email: 'alice@acme.io', avatar: '', role: 'admin', organisation: { id: 1, name: 'Acme', slug: 'acme' }, is_active: true },
  created_at: '2026-08-31T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
  lifecycle_stage: 'live',
  health_score: '9.5',
  health_category: 'good',
  pulse: [1, 1, 1, 1, 0],
  ai_pulse_score: 'very_satisfied',
  ai_pulse_reason: 'Strong engagement.',
  nps_score: 100,
  csat_score: '100.00',
  renewal_date: '2026-03-02',
  arr: '33600.00',
};

const blankAccount = {
  ...filledAccount,
  id: 2,
  name: 'EMEA',
  domain: '',
  owner: null,
  renewal_date: null,
  arr: '0.00',
};

describe('SettingsPage — Data tab, Account sub-tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches every account and renders real Custom/System attribute sections', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [filledAccount, blankAccount] })
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(await screen.findByText('Custom Attributes')).toBeInTheDocument();
    expect(screen.getByText('lifecycle_stage')).toBeInTheDocument();
    // Account's own "Organizations" (customers) field, System not
    // Custom -- no current form actually sends customer_ids.
    expect(screen.getByText('Organizations')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/accounts/'), expect.anything());
  });

  it('walks every page of /accounts/ via `next`, not just the first', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/accounts/')) {
        return Promise.resolve(
          jsonResponse(200, {
            count: 2,
            next: 'http://localhost:8000/api/v1/accounts/?page=2',
            previous: null,
            results: [filledAccount],
          })
        );
      }
      return Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [blankAccount] })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await screen.findByText('Custom Attributes');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/accounts/?page=2',
        expect.anything()
      )
    );
  });

  it('computes a real Usage% from the fetched accounts, not a fabricated one', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [filledAccount, blankAccount] })
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await screen.findByText('Domain');

    // Domain: filledAccount has one, blankAccount's is '' -- 1 of 2 = 50%.
    const domainRow = screen.getByText('Domain').closest('tr')!;
    expect(domainRow.textContent).toContain('50%');

    // Name: both set -- 2 of 2 = 100%.
    const nameCell = screen.getAllByText('Name').find((el) => el.tagName === 'SPAN')!;
    expect(nameCell.closest('tr')!.textContent).toContain('100%');
  });

  it('shows the backend error message instead of crashing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching filters the attribute list by display name or field name', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(200, { count: 1, next: null, previous: null, results: [filledAccount] }))
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Account' }));
    await screen.findByText('Custom Attributes');
    expect(screen.getByText('Lifecycle Stage')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Search from \d+ account attributes/),
      'lifecycle'
    );

    expect(screen.queryByText('Domain')).not.toBeInTheDocument();
    expect(screen.getByText('Lifecycle Stage')).toBeInTheDocument();
  });
});

// Minimal but real shape, matching revenact-backend's ContactSerializer
// — see docs/API_CONTRACTS.md -> customers -> Contact.
const filledContact = {
  id: 1,
  name: 'Sarah Chen',
  role: 'executive_sponsor',
  role_display: 'Executive Sponsor',
  email: 'sarah.chen@acme.io',
  phone: '+1 555 0100',
  status: 'active',
  sentiment: 'positive',
  last_contacted_at: '2026-08-31T00:00:00Z',
  companies: [{ id: 6, name: 'Apple Inc' }],
  account_name: null,
};

const blankContact = {
  ...filledContact,
  id: 2,
  name: 'James Wilson',
  phone: '',
  last_contacted_at: null,
};

describe('SettingsPage — Data tab, Contact sub-tab', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches every contact and renders real Custom/System attribute sections', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [filledContact, blankContact] })
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Contact' }));

    expect(await screen.findByText('Custom Attributes')).toBeInTheDocument();
    expect(screen.getByText('sentiment')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/v1/contacts/'), expect.anything());
  });

  it('walks every page of /contacts/ via `next`, not just the first', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.endsWith('/contacts/')) {
        return Promise.resolve(
          jsonResponse(200, {
            count: 2,
            next: 'http://localhost:8000/api/v1/contacts/?page=2',
            previous: null,
            results: [filledContact],
          })
        );
      }
      return Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [blankContact] })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Contact' }));
    await screen.findByText('Custom Attributes');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/contacts/?page=2',
        expect.anything()
      )
    );
  });

  it('computes a real Usage% from the fetched contacts, not a fabricated one', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        jsonResponse(200, { count: 2, next: null, previous: null, results: [filledContact, blankContact] })
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Contact' }));
    await screen.findByText('Phone');

    // Phone: filledContact has one, blankContact's is '' -- 1 of 2 = 50%.
    const phoneRow = screen.getByText('Phone').closest('tr')!;
    expect(phoneRow.textContent).toContain('50%');

    // Name: both set -- 2 of 2 = 100%.
    const nameCell = screen.getAllByText('Name').find((el) => el.tagName === 'SPAN')!;
    expect(nameCell.closest('tr')!.textContent).toContain('100%');
  });

  it('shows the backend error message instead of crashing', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Contact' }));

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('searching filters the attribute list by display name or field name', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse(200, { count: 1, next: null, previous: null, results: [filledContact] }))
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: 'Contact' }));
    await screen.findByText('Custom Attributes');
    expect(screen.getByText('Sentiment')).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText(/Search from \d+ contact attributes/),
      'sentiment'
    );

    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.getByText('Sentiment')).toBeInTheDocument();
  });
});
