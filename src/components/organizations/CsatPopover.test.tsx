import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { CsatPopover } from './CsatPopover';
import type { CsatBreakdown } from '../../features/customers/customersSlice';

// Every row here used to be hardcoded — the same "23 Responses" and the same
// five counts under every customer in the table, with bar widths drawn at
// twice the percentage they were labelled with. These pin that it reports
// what the API gives it, at the scale it claims.

const band = (key: string, label: string, count: number, share: number) => ({
  key,
  label,
  count,
  share,
});

/** Hyatt's real distribution, as the backend returns it. */
const BREAKDOWN: CsatBreakdown = {
  responses: 8,
  bands: [
    band('very_satisfied', 'Very Satisfied', 3, 37.5),
    band('satisfied', 'Satisfied', 3, 37.5),
    band('neutral', 'Neutral', 2, 25),
    band('dissatisfied', 'Dissatisfied', 0, 0),
    band('very_dissatisfied', 'Very Dissatisfied', 0, 0),
  ],
};

const row = (label: string) => screen.getByText(`${label}:`).closest('div')!.parentElement!;

describe('CsatPopover', () => {
  it('reports the response count it was given', () => {
    render(<CsatPopover breakdown={BREAKDOWN} style={{}} />);
    expect(screen.getByText('8 Responses')).toBeInTheDocument();
  });

  it('says "Response" for a single answer', () => {
    render(<CsatPopover breakdown={{ ...BREAKDOWN, responses: 1 }} style={{}} />);
    expect(screen.getByText('1 Response')).toBeInTheDocument();
  });

  it('lists every band with its own count and share', () => {
    render(<CsatPopover breakdown={BREAKDOWN} style={{}} />);

    expect(within(row('Very Satisfied')).getByText('3')).toBeInTheDocument();
    expect(within(row('Very Satisfied')).getByText('37.5%')).toBeInTheDocument();
    expect(within(row('Neutral')).getByText('25%')).toBeInTheDocument();
    expect(within(row('Dissatisfied')).getByText('0%')).toBeInTheDocument();
  });

  it('draws each bar at the share it is labelled with', () => {
    // The old version used `fill * 2` so the bars "didn't look too tiny",
    // which made every bar overstate its own number.
    const { container } = render(<CsatPopover breakdown={BREAKDOWN} style={{}} />);
    const widths = [...container.querySelectorAll<HTMLElement>('div[style*="width"]')]
      .map((el) => el.style.width)
      .filter(Boolean);

    expect(widths).toContain('37.5%');
    expect(widths).toContain('25%');
    expect(widths).not.toContain('75%');
  });

  it('the shares it shows add up to 100', () => {
    render(<CsatPopover breakdown={BREAKDOWN} style={{}} />);
    const total = BREAKDOWN.bands.reduce((sum, b) => sum + b.share, 0);
    expect(total).toBe(100);
  });

  it('says so when nobody has answered, rather than inventing a spread', () => {
    render(<CsatPopover breakdown={{ responses: 0, bands: [] }} style={{}} />);
    expect(screen.getByText('0 Responses')).toBeInTheDocument();
    expect(screen.getByText(/No CSAT survey has been answered/i)).toBeInTheDocument();
  });

  it('renders no bars at all for an unanswered account', () => {
    const { container } = render(
      <CsatPopover breakdown={{ responses: 0, bands: [] }} style={{}} />,
    );
    const widths = [...container.querySelectorAll<HTMLElement>('div[style*="width"]')];
    expect(widths).toHaveLength(0);
  });
});
