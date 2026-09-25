import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis } from 'recharts';
import { sizeCharts } from '../../../test/chartSize';
import {
  HEALTH_STACK,
  emptyStackMarker,
  makeStackedTotalLabel,
  stackedTotalLabelList,
  topSegment,
} from './stackedTotalLabel';

const data = [
  { Good: 0, Average: 2, Poor: 1, total: 3 },
  { Good: 0, Average: 0, Poor: 0, total: 0 },
];

const draw = (node: React.ReactNode) => render(<svg>{node}</svg>).container.querySelector('text');

describe('makeStackedTotalLabel', () => {
  it('draws the total on the topmost non-empty segment only', () => {
    expect(topSegment(data[0])).toBe('Average');
    const OnAverage = makeStackedTotalLabel('Average', data);
    const OnGood = makeStackedTotalLabel('Good', data);
    const text = draw(<OnAverage x={10} y={50} width={20} index={0} />);
    expect(text).toHaveTextContent('3');
    expect(text).toHaveAttribute('x', '20');
    expect(text).toHaveAttribute('y', '44');
    expect(draw(<OnGood x={10} y={50} width={20} index={0} />)).toBeNull();
  });

  it('draws nothing for an empty bar', () => {
    const OnPoor = makeStackedTotalLabel('Poor', data);
    expect(draw(<OnPoor index={1} />)).toBeNull();
  });
});

describe('stackedTotalLabelList', () => {
  // A real, sized chart: Recharts hands a LabelList `index` counted over the
  // bars it drew, skipping zero-height ones, not over `data`. Only a render
  // shows whether a total lands on the right column.
  sizeCharts();

  const rows = [
    { name: 'a', Good: 0, Average: 0, Poor: 2, total: 2 },
    { name: 'b', Good: 0, Average: 0, Poor: 0, total: 0 },
    { name: 'c', Good: 4, Average: 0, Poor: 1, total: 5 },
  ];

  const labels = (container: HTMLElement) =>
    [...container.querySelectorAll('.recharts-label-list text')].map((t) => t.textContent);

  it('puts each total on its own column even when a series skips an empty one', () => {
    const { container } = render(
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <XAxis dataKey="name" />
          {HEALTH_STACK.map((status) => (
            <Bar key={status} dataKey={status} stackId="s" isAnimationActive={false}>
              <LabelList {...stackedTotalLabelList(status, rows)} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>,
    );
    // "c"'s Good segment is the first Good bar drawn (index 0), yet its
    // total is 5, not "a"'s 2.
    expect(labels(container)).toEqual(['2', '5']);
  });

  it('marks an empty column with a hairline and a zero label', () => {
    const { container } = render(
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <XAxis dataKey="name" />
          {HEALTH_STACK.map((status) => (
            <Bar key={status} dataKey={status} stackId="s" isAnimationActive={false} />
          ))}
          <Bar {...emptyStackMarker(rows.map((r) => r.total), '0')} stackId="s" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>,
    );
    expect(labels(container)).toEqual(['0']);
    const marker = container.querySelectorAll('.recharts-bar')[3].querySelectorAll('path');
    expect(marker).toHaveLength(1);
    expect(marker[0]).toHaveAttribute('name', 'b');
  });
});
