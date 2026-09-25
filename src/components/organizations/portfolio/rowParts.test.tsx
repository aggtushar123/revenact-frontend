import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  HealthRing,
  PulsePair,
  RenewalRunway,
  SignalTag,
  TrendLine,
  renewalText,
  touchText,
  trendLabel,
} from './rowParts';
import { pizzaHut } from '../../../features/organizations/testPortfolio';

describe('row parts', () => {
  it('names the ring by score and band, so colour is never the only signal', () => {
    render(<HealthRing score={4.9} category="average" />);
    expect(screen.getByRole('img', { name: 'Health 4.9, Average' })).toBeInTheDocument();
    expect(screen.getByText('4.9')).toHaveClass('font-mono-brand', 'tabular-nums');
  });

  it('says so when there is no score', () => {
    render(<HealthRing score={null} category="poor" />);
    expect(screen.getByRole('img', { name: 'Health not scored' })).toBeInTheDocument();
  });

  it('labels the trend in words', () => {
    expect(trendLabel([6.2, 5.8, 5.5, 5.1, 5.0, 4.9])).toBe('Health falling from 6.2 to 4.9 over 6 months');
    expect(trendLabel([4, 5])).toBe('Health rising from 4.0 to 5.0 over 2 months');
    expect(trendLabel([5, 5])).toBe('Health steady at 5.0 over 2 months');
    expect(trendLabel([5])).toBe('Not enough health history for a trend');
    render(<TrendLine trend={[6.2, 4.9]} category="average" />);
    expect(screen.getByRole('img', { name: 'Health falling from 6.2 to 4.9 over 2 months' })).toBeInTheDocument();
  });

  it('writes the renewal runway and marks overdue in words and colour', () => {
    expect(renewalText(-47)).toBe('47d overdue');
    expect(renewalText(0)).toBe('Renews today');
    expect(renewalText(12)).toBe('in 12d');
    expect(renewalText(null)).toBe('No renewal date');
    render(<RenewalRunway renewal={{ date: '2026-08-09', days: -47 }} />);
    expect(screen.getByText('47d overdue')).toHaveClass('text-danger', 'font-mono-brand', 'tabular-nums');
  });

  it('writes last touch, and says so when never contacted', () => {
    expect(touchText(null)).toBe('Never contacted');
    expect(touchText(0)).toBe('Touched today');
    expect(touchText(33)).toBe('Touched 33d ago');
  });

  it('shows both pulses, the stored dots and the AI label, and says in text when they disagree', () => {
    const { container, rerender } = render(<PulsePair pulse={pizzaHut.pulse} />);
    expect(container).toHaveTextContent('AI 1 · CSM 3');
    expect(screen.getByRole('img', { name: 'Pulse history: good, poor, poor' })).toBeInTheDocument();
    expect(screen.getByText('High Risk')).toBeInTheDocument();
    expect(screen.getByText('pulses disagree')).toBeInTheDocument();
    rerender(<PulsePair pulse={{ ...pizzaHut.pulse, disagree: false }} />);
    expect(screen.queryByText('pulses disagree')).not.toBeInTheDocument();
  });

  it('renders at most one signal, toned by kind', () => {
    const { rerender } = render(<SignalTag signal={{ kind: 'renewal_overdue', label: 'Renewal overdue' }} />);
    expect(screen.getByText('Renewal overdue')).toHaveClass('text-danger');
    rerender(<SignalTag signal={{ kind: 'tickets', label: '2 open tickets' }} />);
    expect(screen.getByText('2 open tickets')).toHaveClass('text-warning');
    rerender(<SignalTag signal={null} />);
    expect(screen.queryByText('2 open tickets')).not.toBeInTheDocument();
  });
});
