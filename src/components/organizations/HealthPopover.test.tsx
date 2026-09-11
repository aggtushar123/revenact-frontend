import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HealthPopover } from './HealthPopover';
import type { HealthComponent } from '../../features/customers/customersSlice';

// The popover used to invent its five rows by branching on the score itself,
// so the parts could never add up to the total. It renders `health_breakdown`
// from the API now; these pin that it reports what it is given.

const component = (
  key: string,
  label: string,
  weight: string,
  points: string,
  ratio: number | null,
): HealthComponent => ({
  key,
  label,
  weight,
  points,
  ratio,
  available: ratio !== null,
});

/** Apple Inc's real breakdown, as the backend returns it. Sums to 5.4. */
const BREAKDOWN: HealthComponent[] = [
  component('customer_touch', 'Customer Touch', '4.0', '0.0', 0),
  component('ai_pulse', 'AI Pulse', '2.0', '2.0', 1),
  component('licence_utilization', 'Licence Utilization', '2.0', '1.7', 0.841),
  component('adoption', 'Aggregate Adoption Score', '1.5', '1.5', 1),
  component('support_tickets', 'Support Tickets Volume', '0.5', '0.2', 0.5),
];

const row = (label: string) => screen.getByText(label).closest('div')!.parentElement!;

describe('HealthPopover', () => {
  it('lists every component it is given', () => {
    render(<HealthPopover val={5.4} breakdown={BREAKDOWN} style={{}} />);

    BREAKDOWN.forEach((c) => expect(screen.getByText(c.label)).toBeInTheDocument());
    expect(screen.getByText('Overall health score')).toBeInTheDocument();
  });

  it('shows each component out of its own weight', () => {
    render(<HealthPopover val={5.4} breakdown={BREAKDOWN} style={{}} />);

    expect(within(row('Customer Touch')).getByText('0.0/4.0')).toBeInTheDocument();
    expect(within(row('AI Pulse')).getByText('2.0/2.0')).toBeInTheDocument();
    expect(within(row('Support Tickets Volume')).getByText('0.2/0.5')).toBeInTheDocument();
  });

  it('the components it shows add up to the headline score', () => {
    // The property the old version could never satisfy: it showed a 7.0 with
    // components summing to 8.3.
    render(<HealthPopover val={5.4} breakdown={BREAKDOWN} style={{}} />);

    const total = BREAKDOWN.reduce((sum, c) => sum + Number(c.points), 0);
    expect(Number(total.toFixed(1))).toBe(5.4);
    expect(screen.getByText('5.4/10')).toBeInTheDocument();
  });

  it('reports a component with nothing to measure as no data, not as a failure', () => {
    // Unmeasurable components are excluded from the score rather than scored
    // zero, so rendering one as a red "Poor" bar would misstate it.
    const breakdown = [
      ...BREAKDOWN.slice(0, 2),
      component('licence_utilization', 'Licence Utilization', '2.0', '0.0', null),
    ];
    render(<HealthPopover val={6.7} breakdown={breakdown} style={{}} />);

    const licence = row('Licence Utilization');
    expect(within(licence).getByText('No data')).toBeInTheDocument();
    expect(within(licence).getByText('—')).toBeInTheDocument();
    expect(within(licence).queryByText('0.0/2.0')).not.toBeInTheDocument();
  });

  it('grades each component on its own ratio, not on the overall score', () => {
    // A poor account can still be doing one thing well, and vice versa —
    // the old version painted every row from the headline number.
    render(<HealthPopover val={5.4} breakdown={BREAKDOWN} style={{}} />);

    expect(within(row('AI Pulse')).getByText('Good')).toBeInTheDocument();
    expect(within(row('Customer Touch')).getByText('Poor')).toBeInTheDocument();
  });

  it('says so when the score was pinned by hand', () => {
    render(<HealthPopover val={9.9} breakdown={BREAKDOWN} isOverridden style={{}} />);
    expect(screen.getByText(/set by hand/i)).toBeInTheDocument();
    expect(screen.getByText(/what the\s+calculation would have given/i)).toBeInTheDocument();
  });

  it('stays quiet about overrides when the score is the calculated one', () => {
    render(<HealthPopover val={5.4} breakdown={BREAKDOWN} style={{}} />);
    expect(screen.queryByText(/set by hand/i)).not.toBeInTheDocument();
  });
});

describe('HealthPopover rescaling', () => {
  it('explains why the rows total less than the headline', () => {
    // Oracle's real shape: four components measured, one with no data, so the
    // score is marked out of the weight that could be measured.
    const breakdown = [
      ...BREAKDOWN.slice(0, 4),
      component('support_tickets', 'Support Tickets Volume', '0.5', '0.0', null),
    ];
    render(<HealthPopover val={5.2} breakdown={breakdown} style={{}} />);

    expect(screen.getByText(/Scored on the 4 components with data/)).toBeInTheDocument();
    expect(screen.getByText(/left out\s+rather than counted as zero/)).toBeInTheDocument();
  });

  it('says nothing when every component was measured', () => {
    render(<HealthPopover val={5.4} breakdown={BREAKDOWN} style={{}} />);
    expect(screen.queryByText(/components with data/)).not.toBeInTheDocument();
  });

  it('prefers the override note over the rescale note', () => {
    // Both could apply; a pinned score makes the rescale detail irrelevant.
    const breakdown = [...BREAKDOWN.slice(0, 4), component('x', 'Missing', '0.5', '0.0', null)];
    render(<HealthPopover val={9.9} breakdown={breakdown} isOverridden style={{}} />);

    expect(screen.getByText(/set by hand/i)).toBeInTheDocument();
    expect(screen.queryByText(/components with data/)).not.toBeInTheDocument();
  });
});
