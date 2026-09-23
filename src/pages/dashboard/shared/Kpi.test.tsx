import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Kpi, KpiStrip } from './Kpi';

describe('Kpi', () => {
  it('renders label, figure in the mono face, and detail', () => {
    render(<Kpi label="ARR today" value="$688.6K" detail="9 accounts" />);
    expect(screen.getByText('ARR today')).toBeInTheDocument();
    const figure = screen.getByText('$688.6K');
    expect(figure.className).toContain('font-mono-brand');
    expect(figure.className).toContain('tabular-nums');
    expect(screen.getByText('9 accounts')).toBeInTheDocument();
  });

  it('colours only the figure, and only for loss or gain', () => {
    render(<Kpi label="At risk" value="$114.5K" tone="loss" />);
    expect(screen.getByText('$114.5K').className).toContain('text-danger');
    render(<Kpi label="Expansion" value="$31K" tone="gain" />);
    expect(screen.getByText('$31K').className).toContain('text-success');
  });

  it('has no coloured left border', () => {
    const { container } = render(<Kpi label="x" value="1" tone="loss" />);
    expect(container.innerHTML).not.toMatch(/border-l-(danger|success|info)/);
  });

  it('KpiStrip lays out children in a list', () => {
    render(
      <KpiStrip>
        <Kpi label="a" value="1" />
        <Kpi label="b" value="2" />
      </KpiStrip>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('KpiStrip drops a conditionally-absent child instead of rendering an empty item', () => {
    const showThird = false;
    render(
      <KpiStrip>
        <Kpi label="a" value="1" />
        <Kpi label="b" value="2" />
        {showThird && <Kpi label="c" value="3" />}
      </KpiStrip>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('dashboard Tile guard', () => {
  it('no dashboard view defines its own Tile', () => {
    const modules = import.meta.glob('../tabs/**/*.tsx', {
      query: '?raw',
      eager: true,
      import: 'default',
    }) as Record<string, string>;

    const offenders = Object.entries(modules)
      .filter(([file]) => !file.endsWith('.test.tsx'))
      .filter(([, source]) => /function Tile\(/.test(source))
      .map(([file]) => file);

    expect(offenders).toEqual([]);
  });
});
