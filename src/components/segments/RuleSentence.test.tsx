import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { conditionParts, ruleSentence } from '../../features/segments/ruleSentence';
import { findField } from '../../features/segments/segmentFields';
import { EMEA_ACCOUNTS, RENEWAL_RISK } from '../../features/segments/testSegments';
import { NO_LABELS } from '../../features/segments/segmentTypes';
import { RuleSentence } from './RuleSentence';

describe('RuleSentence', () => {
  it('sets fields in ink, numbers (plain and day-counted alike) in DM Mono, and a record the reader cannot open apart', () => {
    const { unmount } = render(<RuleSentence parts={ruleSentence(RENEWAL_RISK.rules, 'customer', NO_LABELS, [])} />);
    expect(screen.getByText('CSAT %')).toHaveClass('font-semibold', 'text-ink');
    expect(screen.getByText('60')).toHaveClass('font-mono-brand', 'tabular-nums');
    expect(screen.getByText('90 days')).toHaveClass('font-mono-brand', 'tabular-nums');
    unmount();
    render(<RuleSentence parts={ruleSentence(EMEA_ACCOUNTS.rules, 'account', EMEA_ACCOUNTS.labels, [])} />);
    expect(screen.getByText("an organisation you can't open").tagName).toBe('EM');
  });

  it('puts a negative figure in DM Mono too, which a leading-digit guess would have missed', () => {
    const parts = conditionParts({ field: 'nps_score', op: 'lt', value: -20 }, findField('customer', 'nps_score', []), NO_LABELS);
    render(<RuleSentence parts={parts} />);
    expect(screen.getByText('-20')).toHaveClass('font-mono-brand', 'tabular-nums');
  });
});
