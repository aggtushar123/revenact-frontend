import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartCard } from './ChartCard';
import { ChartLegend } from './ChartLegend';
import { DrillTargets } from '../drill/DrillTargets';
import { CHART_HEIGHT, HEALTH_LEGEND } from './chartPalette';

const plotOf = () => screen.getByTestId('chart').parentElement as HTMLElement;

describe('ChartCard', () => {
  it('sits in the dashboard panel with its title as a heading', () => {
    render(
      <ChartCard title="Health by owner">
        <div data-testid="chart" />
      </ChartCard>,
    );
    const heading = screen.getByRole('heading', { name: 'Health by owner' });
    const card = heading.closest('section')!;
    expect(card).toHaveClass('bg-surface', 'border-line', 'rounded-xl');
    expect(card).toContainElement(screen.getByTestId('chart'));
  });

  it('gives the plot a definite height, md by default', () => {
    render(
      <ChartCard title="t">
        <div data-testid="chart" />
      </ChartCard>,
    );
    expect(plotOf().style.height).toBe(`${CHART_HEIGHT.md}px`);
  });

  it('takes a named or a numeric height', () => {
    const { unmount } = render(
      <ChartCard title="t" height="lg">
        <div data-testid="chart" />
      </ChartCard>,
    );
    expect(plotOf().style.height).toBe('400px');
    unmount();
    render(
      <ChartCard title="t" height={284}>
        <div data-testid="chart" />
      </ChartCard>,
    );
    expect(plotOf().style.height).toBe('284px');
  });

  it('renders the subtitle, action, legend and footer around the plot', () => {
    render(
      <ChartCard
        title="Current health"
        subtitle="All accounts"
        action={<button type="button">Expand</button>}
        legend={<ChartLegend items={HEALTH_LEGEND} />}
        footer={<p>Updated today</p>}
      >
        <div data-testid="chart" />
      </ChartCard>,
    );
    expect(screen.getByText('All accounts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveTextContent('GoodAveragePoor');
    const footer = screen.getByText('Updated today');
    // Legend above the plot, footer below it.
    expect(screen.getByRole('list').compareDocumentPosition(plotOf()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(plotOf().compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('anchors drill targets to the card, outside the plot, so revealing them never resizes it', () => {
    render(
      <ChartCard
        title="Priority"
        drill={<DrillTargets label="Priority" items={[{ name: 'High', figure: '3', onSelect: () => {} }]} />}
      >
        <div data-testid="chart" />
      </ChartCard>,
    );
    const drill = screen.getByRole('list', { name: 'Priority' });
    expect(drill.closest('section')).toHaveClass('relative');
    expect(plotOf()).not.toContainElement(drill);
  });
});
