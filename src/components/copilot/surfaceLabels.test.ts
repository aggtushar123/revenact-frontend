import { describe, expect, it } from 'vitest';
import { FILTER_OPTIONS } from '../../features/organizations/testPortfolio';
import type { DashboardContext, OrganizationsContext } from '../../pages/copilot/types';
import { originTag, surfaceLabel } from './surfaceLabels';

const DASH: DashboardContext = { surface: 'dashboard', area: 'revenue', view: 'forecast', filters: { owner: '2', lifecycle: '', customer: '' }, focus: null };
const ORG: OrganizationsContext = { surface: 'organizations', view: 'list', filters: { owner: '2' }, focus: null };

describe('surface labels', () => {
  it("names a question on either surface with that surface's names", () => {
    expect(surfaceLabel(DASH, { dashboard: { owner: { '2': 'Priya' } } })).toBe('Revenue › Forecast · Owner: Priya');
    expect(surfaceLabel(DASH)).toBe('Revenue › Forecast · Owner: 2');
    expect(surfaceLabel(ORG, { organizations: FILTER_OPTIONS })).toBe('Organizations · Owner: Carl CSM');
    expect(surfaceLabel({ ...ORG, focus: { kind: 'companies', ids: [7] } })).toBe('Organizations · Owner: User 2 · 1 account');
  });

  it('tags a conversation with where it started', () => {
    expect(originTag({ origin: { surface: 'dashboard', area: 'health', view: 'triage', filters: DASH.filters } })).toBe('Health › Triage');
    expect(
      originTag({ origin: { surface: 'organizations', view: 'list', filters: { owner: '2' }, labels: ['Owner: Carl CSM'] } }),
    ).toBe('Organizations · Owner: Carl CSM');
    expect(originTag({ origin: { surface: 'organizations', view: 'board', filters: {}, labels: [] } })).toBe('Organizations');
    expect(originTag({ origin: null })).toBeNull();
  });
});
