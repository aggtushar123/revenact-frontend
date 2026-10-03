// Mirrors revenact-backend's real NotificationSerializer field for
// field — see revenact-backend's docs/API_CONTRACTS.md. The first real
// backend behind the Navbar's own bell icon, which used to show a
// fixed, fake "25" badge.

export interface NotificationActor {
  id: number;
  name: string;
}

export type NotificationKind =
  | 'copilot_invite'
  | 'copilot_handoff'
  | 'customer_assigned'
  | 'account_assigned'
  | 'question_asked'
  | 'question_answered'
  // A segment's daily alert to its owner: "<name>: 3 entered, 1 left",
  // linking to /segments/<id>?tab=changes (backend PR #84).
  | 'segment_changes';

export interface Notification {
  id: number;
  kind: NotificationKind;
  /** A real string, rendered once by the backend at creation time —
   * see that model's own docstring for why this app never re-derives
   * it client-side. */
  message: string;
  /** A real relative frontend path to navigate to on click (e.g.
   * `/copilot?session=<id>`, `/organizations/<id>`) — empty string
   * when there's nowhere real to go. */
  link: string;
  actor: NotificationActor | null;
  is_read: boolean;
  created_at: string;
}
