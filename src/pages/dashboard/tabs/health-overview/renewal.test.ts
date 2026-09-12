import { describe, it, expect } from 'vitest';
import {
  BASE_RISK,
  CONTACT_COLD_DAYS,
  MAX_RISK,
  RISK_ADJUSTMENTS,
  coverageBands,
  coverageOf,
  ownerLoad,
  quarterColumns,
  renewalQueue,
  renewalRows,
  riskOfLoss,
  summarise,
} from './renewal';
import { healthRow } from './testUtils';

// Unit tier: the risk model and the money aggregation are the business
// decisions behind the Renewal tab, so they're tested on fixtures rather than
// on generated data.

/** Local midnight, matching the other suites, so calendar maths is stable. */
const NOW = new Date(2026, 5, 15); // 15 Jun 2026

/** A row renewing `days` from NOW. */
const renewingIn = (days: number, overrides = {}) => {
  const date = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + days);
  const label = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return healthRow({ renewalDate: label, ...overrides });
};

describe('coverageOf', () => {
  it('grades contact age, and keeps "never logged" distinct from "long ago"', () => {
    // An account with no activity at all isn't the same as one with an old
    // one: the first may be new, the second is being neglected.
    expect(coverageOf(healthRow({ daysSinceTouch: 3 }))).toBe('fresh');
    expect(coverageOf(healthRow({ daysSinceTouch: 45 }))).toBe('ageing');
    expect(coverageOf(healthRow({ daysSinceTouch: 120 }))).toBe('cold');
    expect(coverageOf(healthRow({ daysSinceTouch: null }))).toBe('unknown');
  });

  it('puts the thresholds on the inclusive side', () => {
    expect(coverageOf(healthRow({ daysSinceTouch: 30 }))).toBe('fresh');
    expect(coverageOf(healthRow({ daysSinceTouch: 60 }))).toBe('ageing');
    expect(coverageOf(healthRow({ daysSinceTouch: 61 }))).toBe('cold');
  });
});

describe('riskOfLoss', () => {
  it('starts from the health grade', () => {
    expect(riskOfLoss(healthRow({ healthStatus: 'Good' })).risk).toBe(BASE_RISK.Good);
    expect(riskOfLoss(healthRow({ healthStatus: 'Poor' })).risk).toBe(BASE_RISK.Poor);
  });

  it('adds for a cold account, and names the reason', () => {
    const { risk, factors } = riskOfLoss(
      healthRow({ healthStatus: 'Average', daysSinceTouch: CONTACT_COLD_DAYS + 1 })
    );

    expect(risk).toBeCloseTo(BASE_RISK.Average + RISK_ADJUSTMENTS.coldContact);
    expect(factors.map((f) => f.label)).toContain('No contact in 61 days');
  });

  it('adds when the two pulses disagree, because somebody is wrong', () => {
    const { risk } = riskOfLoss(
      healthRow({ healthStatus: 'Good', csmPulseScore: 5, aiPulseScore: 2 })
    );

    expect(risk).toBeCloseTo(BASE_RISK.Good + RISK_ADJUSTMENTS.pulseDisagreement);
  });

  it('treats one point of pulse difference as rounding, not disagreement', () => {
    const { risk } = riskOfLoss(
      healthRow({ healthStatus: 'Good', csmPulseScore: 4, aiPulseScore: 3 })
    );

    expect(risk).toBe(BASE_RISK.Good);
  });

  it('does not read an unrated pulse as agreement or as disagreement', () => {
    const { risk } = riskOfLoss(
      healthRow({ healthStatus: 'Good', csmPulseScore: null, aiPulseScore: 1 })
    );

    expect(risk).toBe(BASE_RISK.Good);
  });

  it('adds for an account that has not landed yet', () => {
    const { risk, factors } = riskOfLoss(
      healthRow({ healthStatus: 'Good', lifecycleStage: 'Kickoff', lifecycleKey: 'kickoff' })
    );

    expect(risk).toBeCloseTo(BASE_RISK.Good + RISK_ADJUSTMENTS.notEmbedded);
    expect(factors.map((f) => f.label)).toContain('Still in kickoff');
  });

  it('reads the stored stage, not the label', () => {
    // The factor used to test the label for "pilot" — a stage this product
    // does not have — so it never fired on real data. A renamed label must not
    // be able to break it again.
    const { risk } = riskOfLoss(
      healthRow({
        healthStatus: 'Good',
        lifecycleStage: 'Getting started (renamed)',
        lifecycleKey: 'onboarding',
      })
    );

    expect(risk).toBeCloseTo(BASE_RISK.Good + RISK_ADJUSTMENTS.notEmbedded);
  });

  it('does not add for an account that is live', () => {
    const { risk } = riskOfLoss(
      healthRow({ healthStatus: 'Good', lifecycleStage: 'Live', lifecycleKey: 'live' })
    );

    expect(risk).toBe(BASE_RISK.Good);
  });

  it('never reaches certainty while the renewal is still open', () => {
    const { risk } = riskOfLoss(
      healthRow({
        healthStatus: 'Poor',
        daysSinceTouch: 400,
        csmPulseScore: 5,
        aiPulseScore: 1,
        lifecycleStage: 'Onboarding',
        lifecycleKey: 'onboarding',
      })
    );

    expect(risk).toBeLessThanOrEqual(MAX_RISK);
  });
});

describe('renewalRows', () => {
  it('counts accounts with no renewal date rather than sorting them to the end', () => {
    const { rows, withoutDate } = renewalRows(
      [renewingIn(10), healthRow({ id: '2', renewalDate: '' })],
      NOW
    );

    expect(rows).toHaveLength(1);
    expect(withoutDate).toBe(1);
  });

  it('multiplies ARR by risk to get exposure', () => {
    const [item] = renewalRows([renewingIn(10, { arr: 200_000, healthStatus: 'Poor' })], NOW).rows;

    expect(item.exposure).toBeCloseTo(200_000 * BASE_RISK.Poor);
  });

  it('leaves exposure null when the ARR could not be converted', () => {
    // Not zero: the contract has a value, we just can't state it in this
    // currency, and a zero would quietly shrink every total it lands in.
    const [item] = renewalRows([renewingIn(10, { arr: null })], NOW).rows;

    expect(item.exposure).toBeNull();
  });
});

describe('summarise', () => {
  const book = () =>
    renewalRows(
      [
        renewingIn(10, { id: '1', arr: 100_000, healthStatus: 'Poor', daysSinceTouch: 90 }),
        renewingIn(80, { id: '2', arr: 50_000, healthStatus: 'Good', daysSinceTouch: 5 }),
        renewingIn(200, { id: '3', arr: 900_000, healthStatus: 'Poor' }),
        renewingIn(-12, { id: '4', arr: 30_000 }),
        renewingIn(20, { id: '5', arr: null }),
      ],
      NOW
    ).rows;

  it('counts only the headline window, not the whole book', () => {
    const summary = summarise(book());

    // Rows 1, 2 and 5 — row 3 renews beyond 90 days, row 4 is overdue.
    expect(summary.count).toBe(3);
    expect(summary.arr).toBe(150_000);
  });

  it('excludes an unpriced row from the money but still counts it', () => {
    const summary = summarise(book());

    expect(summary.unpriced).toBe(1);
    expect(summary.arr).toBe(150_000);
  });

  it('reports overdue renewals separately rather than as due now', () => {
    const summary = summarise(book());

    expect(summary.overdueCount).toBe(1);
    expect(summary.overdueArr).toBe(30_000);
    // And the overdue row is not in the window's own figures.
    expect(summary.count).toBe(3);
  });

  it('flags the money renewing soon with nobody talking to it', () => {
    const summary = summarise(book());

    expect(summary.coldCount).toBe(1);
    expect(summary.coldArr).toBe(100_000);
  });

  it('weights exposure by risk rather than calling the whole window at risk', () => {
    const summary = summarise(book());

    // 100k Poor + cold (0.5 + 0.1) + 50k Good (0.05).
    expect(summary.exposure).toBeCloseTo(100_000 * 0.6 + 50_000 * 0.05);
    expect(summary.exposure).toBeLessThan(summary.arr);
  });
});

describe('quarterColumns', () => {
  it('runs continuously from the current quarter, empty quarters included', () => {
    const { rows } = renewalRows([renewingIn(200, { arr: 10_000 })], NOW);

    const columns = quarterColumns(rows, NOW, 4);

    expect(columns.map((c) => c.label)).toEqual(["Q2 '26", "Q3 '26", "Q4 '26", "Q1 '27"]);
  });

  it('splits a quarter by the health of what renews in it', () => {
    const { rows } = renewalRows(
      [
        renewingIn(5, { id: '1', arr: 80_000, healthStatus: 'Poor' }),
        renewingIn(6, { id: '2', arr: 20_000, healthStatus: 'Good' }),
      ],
      NOW
    );

    const [current] = quarterColumns(rows, NOW, 4);

    expect(current.arr.Poor).toBe(80_000);
    expect(current.arr.Good).toBe(20_000);
    expect(current.total).toBe(100_000);
    expect(current.count).toBe(2);
  });

  it('keeps overdue renewals out of the forecast', () => {
    // Hanging a missed date off the current quarter inflates a number people
    // commit to in a forecast review.
    const { rows } = renewalRows([renewingIn(-30, { arr: 500_000 })], NOW);

    expect(quarterColumns(rows, NOW, 4).every((c) => c.total === 0)).toBe(true);
  });
});

describe('coverageBands', () => {
  it('splits each window by contact age', () => {
    const { rows } = renewalRows(
      [
        renewingIn(10, { id: '1', arr: 10_000, daysSinceTouch: 2 }),
        renewingIn(20, { id: '2', arr: 20_000, daysSinceTouch: 45 }),
        renewingIn(25, { id: '3', arr: 40_000, daysSinceTouch: 200 }),
        renewingIn(70, { id: '4', arr: 5_000, daysSinceTouch: null }),
      ],
      NOW
    );

    const bands = Object.fromEntries(coverageBands(rows).map((b) => [b.key, b]));

    expect(bands['30'].fresh).toBe(10_000);
    expect(bands['30'].ageing).toBe(20_000);
    expect(bands['30'].cold).toBe(40_000);
    expect(bands['30'].count).toBe(3);
    expect(bands['90'].unknown).toBe(5_000);
  });

  it('gives overdue renewals their own band', () => {
    const { rows } = renewalRows([renewingIn(-5, { arr: 1_000 })], NOW);

    const overdue = coverageBands(rows).find((b) => b.key === 'overdue')!;
    expect(overdue.total).toBe(1_000);
  });
});

describe('ownerLoad', () => {
  it('ranks owners by the ARR they are carrying, heaviest first', () => {
    const { rows } = renewalRows(
      [
        renewingIn(10, { id: '1', owner: 'Ada', arr: 300_000 }),
        renewingIn(20, { id: '2', owner: 'Grace', arr: 100_000 }),
        renewingIn(30, { id: '3', owner: 'Grace', arr: 50_000 }),
      ],
      NOW
    );

    const load = ownerLoad(rows);

    expect(load.map((l) => l.owner)).toEqual(['Ada', 'Grace']);
    expect(load[1].count).toBe(2);
    expect(load[1].arr).toBe(150_000);
  });

  it('ignores renewals beyond the horizon', () => {
    const { rows } = renewalRows([renewingIn(400, { owner: 'Ada', arr: 1_000_000 })], NOW);

    expect(ownerLoad(rows, 180)).toEqual([]);
  });
});

describe('renewalQueue', () => {
  it('ranks by expected loss, not by contract size', () => {
    // The biggest contract is not the one most likely to leave.
    const { rows } = renewalRows(
      [
        renewingIn(30, { id: 'big-healthy', arr: 500_000, healthStatus: 'Good' }),
        renewingIn(30, { id: 'small-sick', arr: 200_000, healthStatus: 'Poor' }),
      ],
      NOW
    );

    expect(renewalQueue(rows).map((item) => item.row.id)).toEqual(['small-sick', 'big-healthy']);
  });

  it('puts overdue renewals first whatever they are worth', () => {
    const { rows } = renewalRows(
      [
        renewingIn(30, { id: 'large', arr: 900_000, healthStatus: 'Poor' }),
        renewingIn(-3, { id: 'overdue', arr: 1_000, healthStatus: 'Good' }),
      ],
      NOW
    );

    expect(renewalQueue(rows)[0].row.id).toBe('overdue');
  });

  it('keeps an unpriced renewal in the list rather than dropping it', () => {
    // It still needs working; it just can't be ranked by money.
    const { rows } = renewalRows(
      [
        renewingIn(30, { id: 'priced', arr: 10_000, healthStatus: 'Good' }),
        renewingIn(30, { id: 'unpriced', arr: null, healthStatus: 'Poor' }),
      ],
      NOW
    );

    const queue = renewalQueue(rows);

    expect(queue.map((item) => item.row.id)).toEqual(['priced', 'unpriced']);
  });

  it('stops at the horizon', () => {
    const { rows } = renewalRows([renewingIn(120, { arr: 10_000 })], NOW);

    expect(renewalQueue(rows)).toHaveLength(0);
    expect(renewalQueue(rows, 180)).toHaveLength(1);
  });
});
