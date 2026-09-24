import type { DashboardArea } from '../../pages/copilot/types';

/** Three fixed questions per dashboard area, shown while a conversation is
 *  empty. Fixed text, no model call: each is answerable from that area's
 *  server digest (see the spec's §2 table). */
export const SUGGESTIONS: Record<DashboardArea, readonly [string, string, string]> = {
  overview: ['What should I act on first?', 'How much ARR is at risk right now?', 'Which accounts need action, and why?'],
  revenue: ['What is driving the forecast?', 'Why is at-risk ARR where it is?', 'Which accounts moved the most?'],
  health: ['Which accounts need action, and why?', 'What is behind the accounts trending down?', 'How healthy is this book overall?'],
  support: ['Which accounts have the most urgent open tickets?', 'What is the oldest open ticket about?', 'How are open tickets split by priority?'],
};
