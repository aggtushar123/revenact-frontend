import { houseRuleSuite } from '../../../test/houseRules';

// The portfolio's house rules over the Accounts panels (the scanners live in
// src/test/houseRules.ts).
houseRuleSuite(
  'accounts portfolio house rules',
  import.meta.glob('./**/*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>,
);
