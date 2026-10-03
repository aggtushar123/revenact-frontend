import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CampaignEditor } from './CampaignEditor';
import type { Campaign } from './types';

// Integration tier (see the `testing` skill): real router context (the
// route param decides whether this loads an existing campaign), only
// the fetch boundary mocked — same convention as CreateScenario.test.tsx's
// own, now that a real Campaign model backs this (see
// docs/API_CONTRACTS.md's `campaigns` section).

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

// The hidden-recipients note splits its text across a `<span>` (the
// DM Mono count) and plain text nodes — RTL's default string matcher
// only reads an element's own direct text-node children, so it can
// never see the full sentence. A function matcher checking the whole
// element's own textContent instead is the documented workaround.
function fullText(expected: string) {
  return (_: string, element: Element | null) => element?.textContent === expected;
}

const EMPTY_CONTACTS_PAGE = { count: 0, next: null, previous: null, results: [] };

interface FetchOptions {
  method?: string;
  body?: string;
}

function campaignFixture(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 3,
    name: 'Renewal Reminder',
    subject: 'Your renewal',
    body: 'Hi there',
    status: 'draft',
    status_display: 'Draft',
    recipients: [],
    hidden_recipients: 0,
    send_log: [],
    sent_count: 0,
    skipped_count: 0,
    sent_at: null,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

function renderNew(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  render(
    <MemoryRouter initialEntries={['/campaigns/create']}>
      <Routes>
        <Route path="/campaigns/create" element={<CampaignEditor />} />
        <Route path="/campaigns/:id" element={<CampaignEditor />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderExisting(id: string, fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  render(
    <MemoryRouter initialEntries={[`/campaigns/${id}`]}>
      <Routes>
        <Route path="/campaigns/:id" element={<CampaignEditor />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CampaignEditor', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts blank with a default name for a new campaign', async () => {
    renderNew(vi.fn(() => Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE))));

    expect(await screen.findByDisplayValue('Untitled Campaign')).toBeInTheDocument();
  });

  it('Save POSTs a new campaign and swaps the URL to its own id', async () => {
    const created = campaignFixture({ id: 7, name: 'My New Campaign' });
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      if (options?.method === 'POST') return Promise.resolve(jsonResponse(201, created));
      return Promise.resolve(jsonResponse(200, created));
    });
    const user = userEvent.setup();
    renderNew(fetchMock);

    const nameInput = await screen.findByLabelText('Campaign name');
    await user.clear(nameInput);
    await user.type(nameInput, 'My New Campaign');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const postCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
    expect(postCall).toBeTruthy();
    const body = JSON.parse(postCall![1]!.body!);
    expect(body.name).toBe('My New Campaign');
  });

  it('loading an existing campaign populates its own saved name/subject/body', async () => {
    const existing = campaignFixture();
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      return Promise.resolve(jsonResponse(200, existing));
    });
    renderExisting('3', fetchMock);

    expect(await screen.findByDisplayValue('Renewal Reminder')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Your renewal')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hi there')).toBeInTheDocument();
  });

  it('saving an existing campaign PATCHes its own id, not a new one', async () => {
    const existing = campaignFixture();
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      if (options?.method === 'PATCH') return Promise.resolve(jsonResponse(200, existing));
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const patchCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
    expect(patchCall![0]).toContain('/campaigns/3/');
  });

  it('sending shows a confirm dialog, then renders the send report and locks the form', async () => {
    const existing = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
    });
    const sent = campaignFixture({
      status: 'sent',
      status_display: 'Sent',
      recipients: existing.recipients,
      send_log: [{ contact_id: 1, contact_name: 'Jane Doe', status: 'sent', detail: 'Emailed jane@x.com' }],
      sent_count: 1,
      skipped_count: 0,
      sent_at: '2026-09-05T00:00:00Z',
    });
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      if (url.endsWith('/campaigns/3/send/') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse(200, sent));
      }
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    await user.click(screen.getByRole('button', { name: 'Send Campaign' }));
    expect(await screen.findByText(/Send "Renewal Reminder" to 1 recipient\?/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/1 sent, 0 skipped/)).toBeInTheDocument();
    expect(screen.getByText(/Emailed jane@x.com/)).toBeInTheDocument();
    // The form is locked now — no more Save/Send Campaign buttons.
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send Campaign' })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Renewal Reminder')).toBeDisabled();
  });

  it('a failed send surfaces its error inside the confirm dialog', async () => {
    const existing = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
    });
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      if (url.endsWith('/campaigns/3/send/') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse(400, { detail: 'Add at least one recipient before sending.' }));
      }
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    await user.click(screen.getByRole('button', { name: 'Send Campaign' }));
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Add at least one recipient before sending.')).toBeInTheDocument();
    // Still on the editable form — the send didn't go through.
    expect(screen.getByRole('button', { name: 'Send Campaign' })).toBeInTheDocument();
  });

  it('the send confirmation states the true total, including recipients the sender can\'t see', async () => {
    const existing = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
      hidden_recipients: 3,
    });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    await user.click(screen.getByRole('button', { name: 'Send Campaign' }));

    expect(
      await screen.findByText('Send "Renewal Reminder" to 4 recipients, including 3 you can\'t see?')
    ).toBeInTheDocument();
  });

  it('shows a note below the recipient picker naming how many hidden recipients will also be sent to', async () => {
    const existing = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
      hidden_recipients: 3,
    });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      return Promise.resolve(jsonResponse(200, existing));
    });
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    expect(
      await screen.findByText(fullText('+3 recipients you can\'t see will also receive this.'))
    ).toBeInTheDocument();
  });

  it('shows no hidden-recipients note, and a plain send confirmation, when hidden_recipients is missing from the load reply', async () => {
    const existingWithoutHiddenField = {
      id: 3,
      name: 'Renewal Reminder',
      subject: 'Your renewal',
      body: 'Hi there',
      status: 'draft',
      status_display: 'Draft',
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
      send_log: [],
      sent_count: 0,
      skipped_count: 0,
      sent_at: null,
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      // hidden_recipients deliberately absent — an older reply shape.
    };
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      return Promise.resolve(jsonResponse(200, existingWithoutHiddenField));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    expect(screen.queryByText(/you can't see/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send Campaign' }));
    expect(await screen.findByText('Send "Renewal Reminder" to 1 recipient?')).toBeInTheDocument();
  });

  it('refreshes the hidden-recipients note from the save reply so it stays in sync', async () => {
    const existing = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
      hidden_recipients: 1,
    });
    const saved = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
      hidden_recipients: 4,
    });
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      if (options?.method === 'PATCH') return Promise.resolve(jsonResponse(200, saved));
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByText(fullText('+1 recipient you can\'t see will also receive this.'));

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText(fullText('+4 recipients you can\'t see will also receive this.'))
    ).toBeInTheDocument();
  });

  it('qualifies the editor\'s own sent count as covering only the recipients the sender can see, when some are hidden', async () => {
    const existing = campaignFixture({
      recipients: [{ id: 1, name: 'Jane Doe', email: 'jane@x.com' }],
      hidden_recipients: 2,
    });
    const sent = campaignFixture({
      status: 'sent',
      status_display: 'Sent',
      recipients: existing.recipients,
      hidden_recipients: 2,
      send_log: [{ contact_id: 1, contact_name: 'Jane Doe', status: 'sent', detail: 'Emailed jane@x.com' }],
      sent_count: 1,
      skipped_count: 0,
      sent_at: '2026-09-05T00:00:00Z',
    });
    const fetchMock = vi.fn((url: string, options?: FetchOptions) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      if (url.endsWith('/campaigns/3/send/') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse(200, sent));
      }
      return Promise.resolve(jsonResponse(200, existing));
    });
    const user = userEvent.setup();
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    await user.click(screen.getByRole('button', { name: 'Send Campaign' }));
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/1 of the recipients you can see were sent, 0 skipped/)).toBeInTheDocument();
  });

  it('treats a sending campaign as read-only, with no Save or Send Campaign buttons', async () => {
    const sending = campaignFixture({ status: 'sending', status_display: 'Sending' });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      return Promise.resolve(jsonResponse(200, sending));
    });
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save & Close' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send Campaign' })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Renewal Reminder')).toBeDisabled();
  });

  it('shows a sending note while a campaign is mid-send', async () => {
    const sending = campaignFixture({ status: 'sending', status_display: 'Sending' });
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/contacts/')) return Promise.resolve(jsonResponse(200, EMPTY_CONTACTS_PAGE));
      return Promise.resolve(jsonResponse(200, sending));
    });
    renderExisting('3', fetchMock);
    await screen.findByDisplayValue('Renewal Reminder');

    expect(await screen.findByText('Sending… this campaign is being sent.')).toBeInTheDocument();
  });
});
