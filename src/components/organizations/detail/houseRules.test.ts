import { houseRuleSuite } from '../../../test/houseRules';

// Spec 2026-09-26 §1 and the design skill's §4 over every part of the
// organization page, and the page itself.
houseRuleSuite('organization page house rules', {
  ...(import.meta.glob('./**/*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>),
  ...(import.meta.glob('../../../pages/organizations/Details.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<
    string,
    string
  >),
});
