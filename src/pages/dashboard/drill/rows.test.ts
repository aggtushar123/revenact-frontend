import { describe, it, expect } from 'vitest';
import { healthRow } from '../tabs/health-overview/testUtils';
import { fromHealthRows } from './rows';

describe('fromHealthRows', () => {
  it('maps id, account, owner and arr onto a DrillRow', () => {
    const row = healthRow({ id: '9', account: 'Acme', owner: 'Sam CSM', arr: 50_000 });
    expect(fromHealthRows([row])).toEqual([
      { id: '9', name: 'Acme', owner: 'Sam CSM', arr: 50_000, detail: undefined },
    ]);
  });

  it('carries a null arr through rather than coercing it', () => {
    const row = healthRow({ id: '1', arr: null });
    expect(fromHealthRows([row])[0].arr).toBeNull();
  });

  it('leaves detail undefined when no detail function is given', () => {
    const row = healthRow({ id: '1' });
    expect(fromHealthRows([row])[0].detail).toBeUndefined();
  });

  it('calls the detail function per row when given', () => {
    const a = healthRow({ id: '1', account: 'A', healthScore: 7 });
    const b = healthRow({ id: '2', account: 'B', healthScore: 3 });
    const rows = fromHealthRows([a, b], (r) => `risk ${r.healthScore}`);
    expect(rows.map((r) => r.detail)).toEqual(['risk 7', 'risk 3']);
  });

  it('maps many rows in order, and returns nothing for an empty list', () => {
    const a = healthRow({ id: '1', account: 'A' });
    const b = healthRow({ id: '2', account: 'B' });
    expect(fromHealthRows([a, b]).map((r) => r.name)).toEqual(['A', 'B']);
    expect(fromHealthRows([])).toEqual([]);
  });
});
