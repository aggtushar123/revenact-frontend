import { describe, it, expect } from 'vitest';
import { healthByOwner } from './controls';
import { healthRow } from './testUtils';

const owned = (owner: string, healthStatus: 'Poor' | 'Average' | 'Good', id: string) =>
  healthRow({ id, owner, ownerKey: owner, healthStatus, account: `Co ${id}` });

describe('healthByOwner', () => {
  it('takes its owners from the rows handed in, not from a fixed list', () => {
    // The chart used to map a hard-coded list of four mock names and divide by
    // their row counts, so on the real book every bar computed to zero and the
    // card rendered empty with only its legend showing.
    const rows = healthByOwner([owned('Carl CSM', 'Poor', '1')]);

    expect(rows.map((row) => row.owner)).toEqual(['Carl CSM']);
    expect(rows[0].Poor).toBe(1);
    expect(rows[0].total).toBe(1);
  });

  it('counts accounts rather than reporting a share of each book', () => {
    // One poor account out of one and one out of twenty are the same
    // percentage and very different problems.
    const rows = healthByOwner([
      owned('Solo', 'Poor', '1'),
      ...Array.from({ length: 19 }, (_, index) => owned('Loaded', 'Good', `g${index}`)),
      owned('Loaded', 'Poor', '20'),
    ]);

    const byOwner = Object.fromEntries(rows.map((row) => [row.owner, row]));
    expect(byOwner.Solo.total).toBe(1);
    expect(byOwner.Loaded.total).toBe(20);
    expect(byOwner.Loaded.Poor).toBe(1);
  });

  it('puts the owner carrying the most poor accounts first', () => {
    const rows = healthByOwner([
      owned('Big and healthy', 'Good', '1'),
      owned('Big and healthy', 'Good', '2'),
      owned('Big and healthy', 'Good', '3'),
      owned('Needs help', 'Poor', '4'),
      owned('Needs help', 'Average', '5'),
    ]);

    expect(rows[0].owner).toBe('Needs help');
  });

  it('breaks a tie on poor accounts with average ones, then with book size', () => {
    const rows = healthByOwner([
      owned('One poor only', 'Poor', '1'),
      owned('Poor and average', 'Poor', '2'),
      owned('Poor and average', 'Average', '3'),
      owned('Poor and a big book', 'Poor', '4'),
      owned('Poor and a big book', 'Good', '5'),
      owned('Poor and a big book', 'Good', '6'),
    ]);

    expect(rows.map((row) => row.owner)).toEqual([
      'Poor and average',
      'Poor and a big book',
      'One poor only',
    ]);
  });

  it('orders by name when two owners carry identical books, so the chart is stable', () => {
    const rows = healthByOwner([owned('Zoe', 'Good', '1'), owned('Adam', 'Good', '2')]);

    expect(rows.map((row) => row.owner)).toEqual(['Adam', 'Zoe']);
  });

  it('returns nothing for an empty book rather than a row of zeroes', () => {
    expect(healthByOwner([])).toEqual([]);
  });
});
