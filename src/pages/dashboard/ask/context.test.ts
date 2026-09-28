import { describe, expect, it } from 'vitest';
import type { DashboardContext, OrganizationDetailContext, OrganizationsContext } from '../../copilot/types';
import { withFocus } from './context';

const DASH: DashboardContext = { surface: 'dashboard', area: 'health', view: 'triage', filters: { owner: '', lifecycle: '', customer: '' }, focus: null };
const LIST: OrganizationsContext = { surface: 'organizations', view: 'list', filters: {}, focus: null };
const PAGE: OrganizationDetailContext = { surface: 'organizations', view: 'detail', organization: 7, account: null, focus: null };

describe('withFocus', () => {
  it('gives each screen only its own kind of focus', () => {
    const companies = { kind: 'companies' as const, ids: [7] };
    const attention = { kind: 'attention' as const, key: 'renewal' };
    const note = { kind: 'note' as const, id: 4 };
    expect(withFocus(DASH, companies)).toEqual({ ...DASH, focus: companies });
    expect(withFocus(DASH, attention)).toEqual({ ...DASH, focus: attention });
    expect(withFocus(DASH, note)).toEqual(DASH);
    expect(withFocus(LIST, companies)).toEqual({ ...LIST, focus: companies });
    expect(withFocus(LIST, note)).toEqual(LIST);
    expect(withFocus(PAGE, note)).toEqual({ ...PAGE, focus: note });
    expect(withFocus(PAGE, companies)).toEqual(PAGE);
    expect(withFocus(PAGE, null)).toEqual(PAGE);
  });
});
