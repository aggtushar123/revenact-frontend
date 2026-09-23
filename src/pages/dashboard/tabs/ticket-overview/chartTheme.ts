// Chart colours for the Ticket Overview dashboard, keyed by the
// display names the API returns.
//
// Colour lives here rather than in the payload because that is what
// every other real-data chart in this app already does — see
// SurveyTrendChart's own LINES and HealthPage's category map. Only the
// mock this replaced shipped `fill` alongside its numbers, which meant
// the backend had an opinion about the theme.
//
// Both maps are keyed by label, not by the raw enum value, because
// that's what the charts stack, legend and tooltip by.
//
// The actual colours and axis helpers live in the dashboard-wide
// `shared/chartPalette.ts` now — re-exported here so every chart in this tab
// keeps importing from `./chartTheme` rather than reaching across tabs.
import { ROLE, niceMax, ticksTo } from '../../shared/chartPalette';

export { niceMax, ticksTo };

/** Ticket.Status display labels. Shared by the status donut and the
 * assignee breakdown, which stack the same five states — a second copy
 * would drift the moment one of them changed. */
export const STATUS_COLORS: Record<string, string> = {
  Open: ROLE.ink,
  'In Progress': ROLE.muted,
  'On Hold': ROLE.faint,
  Resolved: ROLE.gain,
  Closed: ROLE.faint,
};

/** The order the assignee chart stacks its segments in — roughly the
 * life of a ticket, so a bar reads left to right as work progressing. */
export const STATUS_ORDER = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];

/** Ticket.Priority display labels, low to critical. Critical is the same
 * `--danger` token as High rather than a separate darker red — the twice-
 * filter rule this app holds AI features to applies to colour too: a
 * reader tells High and Critical apart from the label, not a second shade
 * of red the palette doesn't otherwise have. */
export const PRIORITY_COLORS: Record<string, string> = {
  Low: ROLE.faint,
  Medium: ROLE.muted,
  High: ROLE.caution,
  Critical: ROLE.loss,
};

/** A neutral for anything the maps don't recognise — a status or
 * priority added to the backend before this file catches up should
 * render in grey rather than vanish. */
export const FALLBACK_COLOR = ROLE.faint;
