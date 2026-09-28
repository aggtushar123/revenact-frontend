import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Call } from '../../../features/calls/callsSlice';
import { CALLS, FILES } from '../../../features/organizations/testStory';
import { CallItem } from './CallItem';

function renderItem(call: Call) {
  render(
    <ul>
      <CallItem call={call} />
    </ul>,
  );
  return screen.getByRole('listitem');
}

describe('CallItem (spec 2026-09-27 §4)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows title, time, a one-line summary, then the account, host, duration and sentiment', () => {
    const item = renderItem(CALLS[1]);
    expect(within(item).getByRole('heading', { name: 'EMEA renewal call' })).toBeInTheDocument();
    expect(within(item).getByText('Quote accepted in principle.')).toHaveClass('truncate');
    for (const text of ['EMEA', 'Carl CSM · 45 min', 'Positive']) expect(within(item).getByText(text)).toBeInTheDocument();
    expect(item.querySelector('time')).toHaveClass('font-mono-brand', 'tabular-nums');
  });

  it('opens the whole summary in place from its title', async () => {
    const item = renderItem(CALLS[0]);
    const title = within(item).getByRole('button', { name: 'Quarterly check-in' });
    expect(title).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(title);
    expect(title).toHaveAttribute('aria-expanded', 'true');
    expect(within(item).getByText('The admin left and usage fell. Agreed a retraining session.')).toHaveClass('whitespace-pre-line');
  });

  it('names who was on it, and links the recording in a new tab', () => {
    const item = renderItem({ ...CALLS[1], participants: CALLS[0].participants });
    expect(within(item).getByText('With Pat Finance')).toBeInTheDocument();
    const recording = within(item).getByRole('link', { name: 'Recording' });
    expect(recording).toHaveAttribute('href', 'https://recordings.example/13');
    expect(recording).toHaveAttribute('target', '_blank');
  });

  it('never links a recording that is not http(s), and says when there is no summary', () => {
    const item = renderItem({ ...CALLS[1], recording_url: 'javascript:alert(1)', summary: '' });
    expect(within(item).queryByRole('link')).not.toBeInTheDocument();
    expect(within(item).getByText('No summary yet.')).toBeInTheDocument();
    expect(within(item).queryByRole('button', { name: 'EMEA renewal call' })).not.toBeInTheDocument();
  });

  it('downloads the transcript, and says when that fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ detail: 'Try later.' }) })));
    const item = renderItem({ ...CALLS[0], transcript: { ...FILES[0], name: 'Transcript.vtt', source: 'transcript' } });
    await userEvent.click(within(item).getByRole('button', { name: 'Transcript' }));
    expect(await within(item).findByRole('alert')).toHaveTextContent('Could not download the transcript.');
  });
});
