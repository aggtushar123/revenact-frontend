import { describe, it, expect } from 'vitest';
import type { HealthStatus } from '../../../../features/health/types';
import { healthRow } from './testUtils';
import {
  ACTION_THRESHOLD,
  daysToRenewal,
  scoreRow,
  summarise,
  trajectoryOf,
  triage,
} from './triage';

// Unit tier: the scoring is the product decision behind the Triage view, so
// it's tested on fixtures rather than on MOCK_HEALTH_DATA — that data is
// generated with Math.random() at import time and would make these flaky.

/** Local midnight, so date-fns' calendar-day maths doesn't straddle a TZ edge. */
const NOW = new Date(2026, 5, 15); // 15 Jun 2026

const makeRow = healthRow;

const history = (...statuses: HealthStatus[]) =>
  statuses.map((status, i) => ({ month: `M${i}`, status }));

describe('daysToRenewal', () => {
  it('counts calendar days to the renewal date', () => {
    expect(daysToRenewal(makeRow({ renewalDate: 'Dec 31, 2026' }), NOW)).toBe(199);
    expect(daysToRenewal(makeRow({ renewalDate: 'Jul 15, 2026' }), NOW)).toBe(30);
  });

  it('is negative once the renewal is in the past', () => {
    expect(daysToRenewal(makeRow({ renewalDate: 'Jun 1, 2026' }), NOW)).toBe(-14);
  });

  it('returns null rather than NaN for a missing or unparseable date', () => {
    expect(daysToRenewal(makeRow({ renewalDate: '' }), NOW)).toBeNull();
    expect(daysToRenewal(makeRow({ renewalDate: 'whenever' }), NOW)).toBeNull();
    expect(daysToRenewal(makeRow({ renewalDate: '2026-12-31' }), NOW)).toBeNull();
  });
});

describe('trajectoryOf', () => {
  it('reads direction from the first and last month recorded', () => {
    expect(trajectoryOf(makeRow({ history: history('Good', 'Good', 'Average') })).direction)
      .toBe('declining');
    expect(trajectoryOf(makeRow({ history: history('Average', 'Average', 'Good') })).direction)
      .toBe('improving');
    expect(trajectoryOf(makeRow({ history: history('Good', 'Average', 'Good') })).direction)
      .toBe('flat');
  });

  it('treats too little history as unknown rather than flat', () => {
    // One seeded row in mockData ships with history: [] — it must not read as
    // "stable", which is what a naive first-vs-last comparison would say.
    expect(trajectoryOf(makeRow({ history: [] })).direction).toBe('unknown');
    expect(trajectoryOf(makeRow({ history: history('Poor') })).direction).toBe('unknown');
  });

  it('exposes the trail oldest to newest', () => {
    expect(trajectoryOf(makeRow({ history: history('Good', 'Average', 'Poor') })).trail)
      .toEqual(['Good', 'Average', 'Poor']);
  });
});

describe('scoreRow', () => {
  it('scores a healthy, distant, agreed-on account at zero', () => {
    const t = scoreRow(makeRow({ renewalDate: 'Dec 31, 2026' }), NOW);
    expect(t.score).toBe(0);
    expect(t.factors).toEqual([]);
  });

  it('always adds up to the sum of its factors', () => {
    const t = scoreRow(
      makeRow({
        healthStatus: 'Poor',
        csmPulseScore: 4,
        aiPulseScore: 1,
        renewalDate: 'Jul 15, 2026',
        lifecycleStage: 'Pilot',
        history: history('Good', 'Average', 'Poor'),
      }),
      NOW,
    );
    expect(t.score).toBe(t.factors.reduce((sum, f) => sum + f.points, 0));
    expect(t.factors.length).toBe(5);
  });

  it('ranks a worse health status higher', () => {
    const good = scoreRow(makeRow({ healthStatus: 'Good' }), NOW).score;
    const average = scoreRow(makeRow({ healthStatus: 'Average' }), NOW).score;
    const poor = scoreRow(makeRow({ healthStatus: 'Poor' }), NOW).score;
    expect(poor).toBeGreaterThan(average);
    expect(average).toBeGreaterThan(good);
  });

  it('only charges for a colder AI read, not a colder CSM read', () => {
    const aiColder = scoreRow(makeRow({ csmPulseScore: 5, aiPulseScore: 2 }), NOW);
    const csmColder = scoreRow(makeRow({ csmPulseScore: 2, aiPulseScore: 5 }), NOW);

    expect(aiColder.pulseGap).toBe(3);
    expect(aiColder.score).toBeGreaterThan(0);
    // The CSM seeing risk first is a signal, but it isn't account risk.
    expect(csmColder.pulseGap).toBe(-3);
    expect(csmColder.score).toBe(0);
  });

  it('weights a near renewal above a merely upcoming one', () => {
    const urgent = scoreRow(makeRow({ renewalDate: 'Jul 15, 2026' }), NOW).score; // 30d
    const near = scoreRow(makeRow({ renewalDate: 'Oct 15, 2026' }), NOW).score; // 122d
    const distant = scoreRow(makeRow({ renewalDate: 'Dec 31, 2026' }), NOW).score; // 199d
    expect(urgent).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(distant);
    expect(distant).toBe(0);
  });

  it('charges a steeper fall more than a shallow one', () => {
    const toAverage = scoreRow(makeRow({ history: history('Good', 'Good', 'Average') }), NOW);
    const toPoor = scoreRow(makeRow({ history: history('Good', 'Good', 'Poor') }), NOW);
    expect(toPoor.score).toBeGreaterThan(toAverage.score);
  });

  it('names every factor it charged for', () => {
    const t = scoreRow(
      makeRow({ healthStatus: 'Average', csmPulseScore: 4, aiPulseScore: 2, lifecycleStage: 'Pilot' }),
      NOW,
    );
    const labels = t.factors.map((f) => f.label);
    expect(labels).toContain('Health is Average');
    expect(labels).toContain("AI Pulse 2 below CSM's");
    expect(labels).toContain('Still in pilot');
    // Largest contributor first, so the row's tooltip leads with the real reason.
    expect(t.factors[0].points).toBeGreaterThanOrEqual(t.factors[1].points);
  });

  it('scores a row with no history without throwing', () => {
    const t = scoreRow(makeRow({ history: [], healthStatus: 'Poor' }), NOW);
    expect(t.direction).toBe('unknown');
    expect(Number.isFinite(t.score)).toBe(true);
  });
});

describe('triage', () => {
  it('ranks worst first', () => {
    const rows = [
      makeRow({ id: '1', account: 'Calm', healthStatus: 'Good' }),
      makeRow({ id: '2', account: 'Burning', healthStatus: 'Poor', renewalDate: 'Jul 1, 2026' }),
      makeRow({ id: '3', account: 'Wobbly', healthStatus: 'Average' }),
    ];
    expect(triage(rows, NOW).map((t) => t.row.account)).toEqual(['Burning', 'Wobbly', 'Calm']);
  });

  it('breaks ties on account name so the order is stable', () => {
    const rows = [
      makeRow({ id: '1', account: 'Zeta', healthStatus: 'Average' }),
      makeRow({ id: '2', account: 'Alpha', healthStatus: 'Average' }),
      makeRow({ id: '3', account: 'Mid', healthStatus: 'Average' }),
    ];
    const once = triage(rows, NOW).map((t) => t.row.account);
    const again = triage([...rows].reverse(), NOW).map((t) => t.row.account);
    expect(once).toEqual(['Alpha', 'Mid', 'Zeta']);
    expect(again).toEqual(once);
  });
});

describe('summarise', () => {
  it('counts the figures the tiles show', () => {
    const rows = [
      makeRow({
        id: '1',
        account: 'A',
        healthStatus: 'Poor',
        renewalDate: 'Jul 1, 2026',
        history: history('Good', 'Average', 'Poor'),
      }),
      makeRow({ id: '2', account: 'B', healthStatus: 'Good', csmPulseScore: 5, aiPulseScore: 2 }),
      makeRow({ id: '3', account: 'C', healthStatus: 'Good', history: history('Good', 'Good', 'Good') }),
    ];
    const s = summarise(triage(rows, NOW));

    expect(s.total).toBe(3);
    expect(s.atGood).toBe(2);
    expect(s.declining).toBe(1);
    expect(s.blindSpots).toBe(1); // B: CSM 5 vs AI 2
    expect(s.needsAction).toBe(1); // only A clears the threshold
    expect(s.needsActionRenewingSoon).toBe(1);
    // Prior month across the rows that carry two months: A was Average, C Good.
    expect(s.atGoodPreviousMonth).toBe(1);
  });

  it('reports no prior month when nothing carries history', () => {
    const s = summarise(triage([makeRow({ history: [] })], NOW));
    expect(s.atGoodPreviousMonth).toBeNull();
  });

  it('counts needsAction against the exported threshold', () => {
    const justUnder = summarise(triage([makeRow({ healthStatus: 'Average' })], NOW));
    expect(justUnder.needsAction).toBe(0);
    const over = summarise(
      triage([makeRow({ healthStatus: 'Poor', renewalDate: 'Jul 1, 2026' })], NOW),
    );
    expect(over.needsAction).toBe(1);
    expect(triage([makeRow({ healthStatus: 'Poor' })], NOW)[0].score)
      .toBeGreaterThanOrEqual(ACTION_THRESHOLD);
  });
});

describe('overdue renewals', () => {
  // Real books carry renewal dates in the past. The scoring has always handled
  // them (a negative day count is inside every urgency window); these pin that
  // it stays that way, since the display now words them differently.
  it('counts a past renewal as urgent, not as distant', () => {
    const overdue = scoreRow(makeRow({ renewalDate: 'Jan 1, 2026' }), NOW); // 165d ago
    const soon = scoreRow(makeRow({ renewalDate: 'Jul 1, 2026' }), NOW); // 16d away
    expect(overdue.daysToRenewal).toBeLessThan(0);
    expect(overdue.score).toBe(soon.score);
  });

  it('ranks an overdue renewal alongside an imminent one', () => {
    const rows = [
      makeRow({ id: '1', account: 'Overdue', renewalDate: 'Jan 1, 2026' }),
      makeRow({ id: '2', account: 'Distant', renewalDate: 'Dec 31, 2026' }),
    ];
    expect(triage(rows, NOW)[0].row.account).toBe('Overdue');
  });
});
