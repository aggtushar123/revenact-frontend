// Mirrors revenact-backend's copilot serializers field-for-field — see
// docs/API_CONTRACTS.md -> copilot.

export type MessageRole = 'user' | 'assistant';

/** The dashboard areas a question can be asked from. Mirrors the backend's
 *  DASHBOARD_VIEWS keys and src/pages/dashboard/areas.ts plus the Overview. */
export type DashboardArea = 'overview' | 'revenue' | 'health' | 'support';

/** What a dashboard question is narrowed to: the accounts behind a drilled
 *  number, or one item on the viewer's own attention list. */
export type DashboardFocus = { kind: 'companies'; ids: number[] } | { kind: 'attention'; key: string };

/** The three shared book filters; '' means "All". */
export interface DashboardFilters {
  owner: string;
  lifecycle: string;
  customer: string;
}

/** Where a dashboard question was asked. The server recomputes what that
 *  screen shows; the client never sends figures. */
export interface DashboardContext {
  surface: 'dashboard';
  area: DashboardArea;
  /** One of the area's sub-views; null on the Overview. */
  view: string | null;
  filters: DashboardFilters;
  focus: DashboardFocus | null;
}

/** A conversation's first dashboard context without its focus. Set once by
 *  the server, never overwritten. */
export type DashboardOrigin = Omit<DashboardContext, 'focus'>;

/** The Organizations pages a question can be asked from. */
export type OrganizationsView = 'list' | 'board';

/** The portfolio's params as GET /organizations/portfolio/ reads them (spec
 *  §2), **only the set keys present** — an unset key is left out, never sent
 *  as `''` (the backend reads a literal `ids: ''` as "names nothing", and a
 *  missing `group` as the view's own default). Lists are comma-joined,
 *  `include_churned` is present only as `'1'`, `sort` only when it differs
 *  from the default, `group` only when it differs from the view's default
 *  (or `''` for an explicit "None", which the Board never offers). The
 *  paging params (`cursor`, `group_value`, `limit`) are never part of it. */
export interface OrganizationsFilters {
  search?: string;
  owner?: string;
  lifecycle?: string;
  health?: string;
  product?: string;
  renews_within?: string;
  nps?: string;
  ids?: string;
  include_churned?: string;
  sort?: string;
  group?: string;
}

/** The only focus shape Organizations ever sends; the server `400`s on any
 *  other `kind` (e.g. the Dashboard's `attention`). */
export interface OrganizationsFocus {
  kind: 'companies';
  ids: number[];
}

/** Where an Organizations question was asked (spec §3). The server
 *  recomputes the filtered list for the asker; the client never sends
 *  figures, and never sends `labels` — the server builds them from the
 *  asker's own filter options and echoes them back on a stored context. */
export interface OrganizationsContext {
  surface: 'organizations';
  view: OrganizationsView;
  filters: OrganizationsFilters;
  focus: OrganizationsFocus | null;
  labels?: string[];
}

/** A conversation's first Organizations context without its focus. Unlike
 *  `OrganizationsContext`, `labels` is required: an origin is only ever
 *  built server-side, from the first message's validated context, which
 *  always carries them. */
export interface OrganizationsOrigin {
  surface: 'organizations';
  view: OrganizationsView;
  filters: OrganizationsFilters;
  labels: string[];
}

/** Every structured context a question can carry, told apart by `surface`. */
export type SurfaceContext = DashboardContext | OrganizationsContext;
export type SurfaceOrigin = DashboardOrigin | OrganizationsOrigin;
export type SurfaceName = SurfaceContext['surface'];

/** A record an answer was built from. A snapshot taken when the
 * answer was written, not a live reference — see the backend's
 * `_source_ref` for why. `id` is kept so the UI can still offer a link,
 * which simply won't resolve if the record has since been deleted. */
export interface MessageSource {
  type: 'email' | 'note' | 'ticket' | 'activity' | 'contribution';
  id: number;
  label: string;
  date: string;
  company: string;
  company_type: 'customer' | 'account';
  company_id: number;
}

/** What `POST /copilot/draft-reply/` returns: the reply written as the
 *  person, and the records it was built from. */
export interface DraftReply {
  draft: string;
  sources: MessageSource[];
}

export interface CopilotMessage {
  id: number;
  role: MessageRole;
  content: string;
  /** Always present; empty on user turns and on answers that had
   * nothing specific to quote. */
  sources: MessageSource[];
  /** The people this turn @mentioned — each became a routed question
   * (see services.knowledge). Empty on assistant turns. */
  questions: { id: number; assignee: { id: number; name: string }; status: 'open' | 'answered' }[];
  /** Assistant turns: the people responsible for the customer this answer
   * was about, offered as one-click "ask" — see services.knowledge. */
  ask_suggestions?: AskSuggestion[];
  /** Who wrote a user turn; null on assistant turns. */
  author?: { id: number; name: string; function: string } | null;
  /** User turns asked on the dashboard: the context as the server validated
   *  it (focus ids already intersected with the viewer's book). Null or
   *  absent everywhere else. */
  context?: DashboardContext | null;
  created_at: string;
}

export interface AskSuggestion {
  user_id: number;
  name: string;
  function: string;
  function_display: string;
  customer_id: number;
  customer_name: string;
}

// No nested `messages` — the shape `fetchConversations` returns, for the
// sidebar's own "Chat history" list.
export interface ConversationSummary {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  /** Where a dashboard conversation started; null for every other one. */
  origin?: DashboardOrigin | null;
}

// Adds `messages` — the shape `fetchConversation`/`sendMessage` return.
export interface Conversation extends ConversationSummary {
  messages: CopilotMessage[];
  /** "full" for the owner and session participants; "partial" for someone who was only mentioned and sees a slice. */
  visibility?: 'full' | 'partial';
}
