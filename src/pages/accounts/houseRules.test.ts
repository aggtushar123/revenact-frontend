import { houseRuleSuite } from '../../test/houseRules';

// The Accounts pages: the portfolio List and Board, and the account page.
houseRuleSuite(
  'accounts pages house rules',
  import.meta.glob(['./List.tsx', './Board.tsx', './Details.tsx'], { query: '?raw', eager: true, import: 'default' }) as Record<string, string>,
);
