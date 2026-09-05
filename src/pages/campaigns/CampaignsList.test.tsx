import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CampaignsList } from './CampaignsList';

// Integration tier (see the `testing` skill): only the fetch boundary
// is mocked — same convention as ScenariosList.test.tsx's own, the
// real Campaign model backs this (see docs/API_CONTRACTS.md's
// `campaigns` section).
function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

const draftCampaign = {
  id: 1,
  name: 'Q4 Renewal Outreach',
  subject: 'Your renewal is coming up',
  body: 'Hi there...',
  status: 'draft',
  status_display: 'Draft',
  recipients: [{ id: 2, name: 'James Wilson', email: 'james@apple.example' }],
  send_log: [],
  sent_count: 0,
  skipped_count: 0,
  sent_at: null,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-31T00:00:00Z',
};

const sentCampaign = {
  ...draftCampaign,
  id: 2,
  name: 'Product Update — September',
  status: 'sent',
  status_display: 'Sent',
  sent_count: 5,
  sent_at: '2026-09-01T00:00:00Z',
  recipients: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Contact ${i}`, email: `c${i}@x.com` })),
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/campaigns']}>
      <Routes>
        <Route path="/campaigns" element={<CampaignsList />} />
        <Route path="/campaigns/create" element={<div>CREATE PAGE</div>} />
        <Route path="/campaigns/:id" element={<div>EDITOR PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CampaignsList page (/campaigns)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the empty state when nothing has been saved yet', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    renderPage();

    expect(await screen.findByText('No campaigns yet.')).toBeInTheDocument();
  });

  it('renders every saved campaign with its own status/recipient count/sent count/updated time', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [draftCampaign, sentCampaign]))));
    renderPage();

    const draftRow = (await screen.findByText('Q4 Renewal Outreach')).closest('tr')!;
    expect(within(draftRow).getByText('Draft')).toBeInTheDocument();
    expect(within(draftRow).getByText('1')).toBeInTheDocument();
    expect(within(draftRow).getByText('—')).toBeInTheDocument();

    const sentRow = screen.getByText('Product Update — September').closest('tr')!;
    expect(within(sentRow).getByText('Sent')).toBeInTheDocument();
    expect(within(sentRow).getByText('5 sent')).toBeInTheDocument();
  });

  it('surfaces a fetch failure instead of silently showing an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(500, { detail: 'Server error.' }))));
    renderPage();

    expect(await screen.findByText('Server error.')).toBeInTheDocument();
  });

  it('clicking New Campaign navigates to the editor', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, []))));
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No campaigns yet.');
    await user.click(screen.getByRole('button', { name: /New Campaign/ }));

    expect(await screen.findByText('CREATE PAGE')).toBeInTheDocument();
  });

  it('clicking a row navigates to that campaign\'s own editor', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(200, [draftCampaign]))));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText('Q4 Renewal Outreach'));

    expect(await screen.findByText('EDITOR PAGE')).toBeInTheDocument();
  });

  it('deleting a campaign removes it from the list after confirming', async () => {
    const fetchMock = vi.fn((_url: string, options?: { method?: string }) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve(jsonResponse(204, null));
      }
      const alreadyDeleted = fetchMock.mock.calls.some(
        ([, o]: [string, { method?: string }?]) => o?.method === 'DELETE'
      );
      return Promise.resolve(jsonResponse(200, alreadyDeleted ? [] : [draftCampaign]));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Q4 Renewal Outreach');
    await user.click(screen.getByRole('button', { name: 'Delete Q4 Renewal Outreach' }));
    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No campaigns yet.')).toBeInTheDocument();
  });
});
