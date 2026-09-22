import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ReplyBox } from './ReplyBox';

const sources = [
  { type: 'note', id: 7, label: 'Billing preference', date: '2026-09-01', company: 'Pizza Hut', company_type: 'customer', company_id: 3 },
  { type: 'email', id: 9, label: 'Re: pricing', date: '2026-08-20', company: 'Pizza Hut', company_type: 'customer', company_id: 3 },
];

function mockDraft(status = 200, body: unknown = { draft: 'Hi Sam,\n\nYes, the multi-year option is available.', sources }) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? 'GET'} ${url} ${init?.body ?? ''}`);
      return Promise.resolve({ ok: status < 400, status, json: async () => body });
    })
  );
  return calls;
}

function renderBox(onSend = vi.fn()) {
  render(
    <MemoryRouter>
      <ReplyBox label="Reply" placeholder="Write your reply." hint="Sends from your mailbox" sendLabel="Send reply" draftSource={{ kind: 'email', id: 412 }} onSend={onSend} sending={false} />
    </MemoryRouter>
  );
  return onSend;
}

describe('ReplyBox', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('Draft with Copilot fills the box and cites its sources', async () => {
    const calls = mockDraft();
    renderBox();
    await userEvent.click(screen.getByRole('button', { name: /draft with copilot/i }));
    expect(await screen.findByDisplayValue(/multi-year option/)).toBeInTheDocument();
    expect(calls.some((c) => c.startsWith('POST') && c.includes('/copilot/draft-reply/') && c.includes('"kind":"email"') && c.includes('"id":412'))).toBe(true);
    expect(screen.getByText('2 sources used')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /view sources/i }));
    expect(screen.getByRole('link', { name: /Billing preference/ })).toHaveAttribute('href', '/organizations/3');
    expect(screen.getByRole('link', { name: /Re: pricing/ })).toBeInTheDocument();
  });

  it('a failed draft says why and leaves the box alone', async () => {
    mockDraft(429, { detail: 'Monthly budget reached.' });
    renderBox();
    await userEvent.type(screen.getByLabelText('Reply'), 'my own words');
    await userEvent.click(screen.getByRole('button', { name: /draft with copilot/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Monthly budget reached.');
    expect(screen.getByLabelText('Reply')).toHaveValue('my own words');
  });

  it('sends what is in the box', async () => {
    mockDraft();
    const onSend = renderBox();
    expect(screen.getByRole('button', { name: 'Send reply' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Reply'), 'Thursday works.');
    await userEvent.click(screen.getByRole('button', { name: 'Send reply' }));
    expect(onSend).toHaveBeenCalledWith('Thursday works.');
  });
});
