import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  axisLabel,
  AXIS_TICK,
  AXIS_BASE,
  CHART_MARGIN,
  chartMargin,
  moneyTick,
  pctTick,
  dateTick,
  truncate,
  truncTick,
} from './chartAxis';
import { formatCompactMoney } from '../../../features/customers/formatters';

describe('axisLabel', () => {
  it('lays a left title along the axis, rotated, in the secondary ink', () => {
    expect(axisLabel('Accounts')).toEqual({
      value: 'Accounts',
      position: 'left',
      angle: -90,
      offset: 10,
      fill: 'var(--text-secondary)',
      fontSize: 11,
      textAnchor: 'middle',
    });
  });

  it('sets the x title flat under the axis and the right title the other way round', () => {
    expect(axisLabel('Month', 'x')).toMatchObject({ position: 'bottom', angle: 0, offset: 4 });
    expect(axisLabel('ARR', 'right')).toMatchObject({ position: 'right', angle: 90, offset: 10 });
  });
});

// Renders a real chart: the title must land in the margin `chartMargin`
// reserves, outside the tick band, never over the tick numbers.
describe('axis titles in a real chart', () => {
  const data = [
    { month: 'Jan', value: 1200 },
    { month: 'Feb', value: 900 },
  ];
  const drawn = () =>
    render(
      <BarChart width={400} height={240} data={data} margin={chartMargin({ left: true, x: true })}>
        <XAxis {...AXIS_BASE} dataKey="month" label={axisLabel('Month', 'x')} />
        <YAxis {...AXIS_BASE} width={38} label={axisLabel('Accounts')} />
        <Bar dataKey="value" isAnimationActive={false} />
      </BarChart>,
    ).container;

  const title = (container: HTMLElement, text: string) =>
    [...container.querySelectorAll('text')].find((node) => node.textContent === text)!;

  it('puts the y title left of every y tick, inside the chart', () => {
    const container = drawn();
    const ticks = [...container.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')];
    expect(ticks.length).toBeGreaterThan(0);
    const labelX = Number(title(container, 'Accounts').getAttribute('x'));
    // Ticks are end-anchored at their x; the rotated title is centred on its
    // x, so half its 11px line sits either side.
    const tickRight = Math.min(...ticks.map((tick) => Number(tick.getAttribute('x'))));
    const widestTick = Math.max(...ticks.map((tick) => (tick.textContent ?? '').length)) * 6;
    expect(labelX + 5.5).toBeLessThan(tickRight - widestTick);
    expect(labelX - 5.5).toBeGreaterThan(0);
  });

  it('puts the x title below every x tick, inside the chart', () => {
    const container = drawn();
    const ticks = [...container.querySelectorAll('.recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value')];
    expect(ticks.length).toBeGreaterThan(0);
    const labelY = Number(title(container, 'Month').getAttribute('y'));
    const tickY = Math.max(...ticks.map((tick) => Number(tick.getAttribute('y'))));
    expect(labelY).toBeGreaterThan(tickY);
    expect(labelY).toBeLessThan(240);
  });
});

describe('axis defaults', () => {
  it('never draws a tick under 10px', () => {
    expect(AXIS_TICK.fontSize).toBeGreaterThanOrEqual(10);
    expect(AXIS_TICK.fill).toMatch(/^var\(--/);
    expect(AXIS_BASE).toMatchObject({ axisLine: false, tickLine: false, tick: AXIS_TICK });
  });

  it('has no negative margin anywhere', () => {
    for (const side of Object.values(CHART_MARGIN)) expect(side).toBeGreaterThanOrEqual(0);
  });

  it('chartMargin reserves room for the titles it is told about, and only those', () => {
    expect(chartMargin()).toEqual(CHART_MARGIN);
    const withTitles = chartMargin({ x: true, left: true });
    expect(withTitles.bottom).toBeGreaterThan(CHART_MARGIN.bottom);
    expect(withTitles.left).toBeGreaterThan(CHART_MARGIN.left);
    expect(withTitles.right).toBe(CHART_MARGIN.right);
    expect(chartMargin({ right: true }).right).toBeGreaterThan(CHART_MARGIN.right);
  });
});

describe('tick formatters', () => {
  it('money reuses the compact money format', () => {
    expect(moneyTick('USD')(1_800_000)).toBe('$1.8M');
    expect(moneyTick('USD')(450_000)).toBe(formatCompactMoney(450_000, 'USD'));
  });

  it('percent appends the sign', () => expect(pctTick(42)).toBe('42%'));

  it('date reads a day as "1 Sep" and a month as "Sep \'26"', () => {
    expect(dateTick('2026-09-01')).toBe('1 Sep');
    expect(dateTick('2026-09')).toBe("Sep '26");
    expect(dateTick('2026-12-31T10:00:00Z')).toBe('31 Dec');
  });

  it('date leaves anything it cannot read alone', () => expect(dateTick('Q3')).toBe('Q3'));
});

describe('truncTick', () => {
  it('truncate keeps short names and shortens long ones with an ellipsis', () => {
    expect(truncate('Support', 14)).toBe('Support');
    expect(truncate('Implementation services', 14)).toBe('Implementatio…');
    expect(truncate('Implementation services', 14)).toHaveLength(14);
  });

  it('draws the short name and keeps the full one in a <title>', () => {
    const Tick = truncTick(10);
    const { container } = render(
      <svg>
        <Tick x={40} y={20} payload={{ value: 'Customer success operations' }} textAnchor="end" />
      </svg>,
    );
    const text = container.querySelector('text')!;
    expect(text).toHaveAttribute('x', '40');
    expect(text).toHaveAttribute('text-anchor', 'end');
    expect(text).toHaveAttribute('font-size', String(AXIS_TICK.fontSize));
    expect(text.querySelector('title')!.textContent).toBe('Customer success operations');
    expect(text.textContent).toContain('Customer …');
  });

  it('adds no <title> when nothing was cut', () => {
    const Tick = truncTick();
    const { container } = render(
      <svg>
        <Tick x={0} y={0} payload={{ value: 'Email' }} />
      </svg>,
    );
    expect(container.querySelector('title')).toBeNull();
    expect(container.querySelector('text')!.textContent).toBe('Email');
  });
});
