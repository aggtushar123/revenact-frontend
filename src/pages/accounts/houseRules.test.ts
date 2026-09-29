import { houseRuleSuite } from '../../test/houseRules';

// The two portfolio pages. Details.tsx is the old account page, redesigned
// in delivery 2, and is not held to these rules yet.
houseRuleSuite(
  'accounts pages house rules',
  import.meta.glob(['./List.tsx', './Board.tsx'], { query: '?raw', eager: true, import: 'default' }) as Record<string, string>,
);
