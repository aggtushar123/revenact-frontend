import { houseRuleSuite, sizeAndTokenSuite } from '../../../test/houseRules';

// Spec 2026-09-26 §1 and the design skill's §4 over every part of the
// organization page, and the page itself.
houseRuleSuite('organization page house rules', {
  ...(import.meta.glob('./**/*.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<string, string>),
  ...(import.meta.glob('../../../pages/organizations/Details.tsx', { query: '?raw', eager: true, import: 'default' }) as Record<
    string,
    string
  >),
});

// The four tabs whose forms + Add shows in its sheet (and whose own tabs the
// account page still renders). Their colours and type sizes follow the page.
// Only these two rules: TasksTab and NotesTab still load a pravatar avatar
// for the account page's feed (spec §6 plans that page), which is not this
// page's to remove.
sizeAndTokenSuite(
  'the + Add forms\' tabs: colour tokens and type sizes',
  import.meta.glob(['../activity/CallSenseTab.tsx', '../activity/SurveysTab.tsx', '../activity/TasksTab.tsx', '../activity/NotesTab.tsx'], {
    query: '?raw',
    eager: true,
    import: 'default',
  }) as Record<string, string>,
);
