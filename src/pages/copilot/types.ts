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
