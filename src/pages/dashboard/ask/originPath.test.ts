import { describe, it, expect } from 'vitest';
import { originPath } from './originPath';

const filters = { owner: '', lifecycle: '', customer: '' };

describe('originPath', () => {
  it('goes back to the view with its filters', () => {
    expect(originPath({ surface: 'dashboard', area: 'overview', view: null, filters })).toBe('/dashboard/overview');
    expect(originPath({ surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { ...filters, owner: '2', lifecycle: 'customer' } })).toBe(
      '/dashboard/revenue/forecast?owner=2&lifecycle=customer',
    );
    expect(originPath({ surface: 'dashboard', area: 'health', view: null, filters })).toBe('/dashboard/health');
  });

  it('goes back to an Organizations view with its filters', () => {
    expect(
      originPath({ surface: 'organizations', view: 'board', filters: { owner: '2' }, labels: ['Owner: Carl CSM'] }),
    ).toBe('/organizations/board?owner=2');
  });
});
