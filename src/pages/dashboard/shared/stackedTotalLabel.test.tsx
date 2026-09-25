import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { makeStackedTotalLabel, topSegment } from './stackedTotalLabel';

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
