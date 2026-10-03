import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSearchParams } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseSegmentPage, toSegmentPageSearch } from '../../features/segments/segmentParams';
import type { Segment } from '../../features/segments/segmentTypes';
import { RENEWAL_RISK, requests, stubSegments } from '../../features/segments/testSegments';
import { renderInApp } from '../../pages/segments/testPages';
import { resetViewport } from '../../test/viewport';
import { ChangesTab } from './ChangesTab';

function Host({ segment }: { segment: Segment }) {
  const [search, setSearch] = useSearchParams();
  const params = parseSegmentPage(search, segment.kind);
  return (
    <ChangesTab
      segment={segment}
      days={params.days}
      onDays={(days) => setSearch(toSegmentPageSearch({ ...params, days }), { replace: true })}
      attributes={[]}
    />
  );
}

const day = (date: string) => document.querySelector(`[data-day="${date}"]`) as HTMLElement;

describe('ChangesTab (spec §3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetViewport();
  });

  it('lists each day, newest first, with its totals, who entered and left and why, and the rest as +N more', async () => {
    stubSegments();
    renderInApp(<Host segment={RENEWAL_RISK} />, { url: '/segments/7?tab=changes' });
    await waitFor(() => expect(day('2026-10-03')).not.toBeNull());
    expect([...document.querySelectorAll('[data-day]')].map((li) => li.getAttribute('data-day'))).toEqual(['2026-10-03', '2026-10-01']);
    const newest = day('2026-10-03');
    expect(within(newest).getByRole('heading')).toHaveTextContent('3 Oct 2026 · 2 entered · 1 left');
    const entered = within(newest).getByRole('list', { name: 'Entered' });
    expect(within(entered).getByRole('link', { name: 'Pizza Hut' })).toHaveAttribute('href', '/organizations/7');
    expect(within(entered).getByText('CSAT %, Health')).toBeInTheDocument();
    expect(within(newest).getByRole('list', { name: 'Left' })).toHaveTextContent("Globex No longer in the owner's book");
    expect(newest.querySelector('[data-part="more"]')).toHaveTextContent('+1 more');
    expect(within(day('2026-10-01')).getByText('Pinned')).toBeInTheDocument();
    expect(day('2026-10-01').querySelector('[data-part="more"]')).toBeNull();
    expect(screen.getByText(/more changes involve records you can't open\./)).toHaveTextContent("3 more changes involve records you can't open.");
  });

  it('reads 7, 30 or 90 days from its switch, kept in the URL', async () => {
    const spy = stubSegments();
    renderInApp(<Host segment={RENEWAL_RISK} />, { url: '/segments/7?tab=changes' });
    await waitFor(() => expect(day('2026-10-03')).not.toBeNull());
    await userEvent.click(within(screen.getByRole('group', { name: 'Changes window' })).getByRole('button', { name: '90 days' }));
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/segments/7?tab=changes&days=90'));
    await waitFor(() => expect(requests(spy, 'GET', /^\/segments\/7\/changes\/$/).map((r) => r.query.get('days'))).toEqual(['30', '90']));
  });

  it("says nobody moved in the window, and that a paused segment records nothing", async () => {
    stubSegments({ changes: () => ({ status: 200, body: { kind: 'customer', days: [], hidden_count: 0 } }) });
    renderInApp(<Host segment={{ ...RENEWAL_RISK, paused: true }} />, { url: '/segments/7?tab=changes&days=7' });
    expect(await screen.findByText('Nobody entered or left in the last 7 days.')).toBeInTheDocument();
    expect(screen.getByText('Paused: its owner is inactive, so no changes are recorded until they are back.')).toBeInTheDocument();
    expect(screen.queryByText(/records you can't open/)).not.toBeInTheDocument();
  });
});
