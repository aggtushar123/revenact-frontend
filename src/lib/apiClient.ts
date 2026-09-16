// Thin fetch wrapper for revenact-backend's /api/v1/ — see
// revenact-backend/docs/API_CONTRACTS.md for the response/error shapes
// this follows.

// Same origin unless VITE_API_URL says otherwise: production serves the SPA
// and the API from one host (Caddy), and CI runs the tests without a .env.
export const API_ORIGIN = import.meta.env.VITE_API_URL || window.location.origin;
const BASE_URL = `${API_ORIGIN}/api/v1`;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Wired up once at app startup (see store.ts) so this module can attach/
// refresh tokens without importing the store or authSlice directly — that
// would create an import cycle, since authSlice's thunks call apiFetch.
interface AuthHooks {
  getAccessToken: () => string | null;
  /** Exchanges the stored refresh token for a new access token, or null if
   * refresh isn't possible (no refresh token, or it's dead too). */
  refreshAccessToken: () => Promise<string | null>;
  /** The session is unrecoverable (refresh failed) — clear it. */
  onAuthFailure: () => void;
}

let authHooks: AuthHooks | null = null;

export function setAuthHooks(hooks: AuthHooks) {
  authHooks = hooks;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
  /** Skip the auto-refresh-on-401 retry. Used by the auth endpoints
   * themselves (login/refresh/logout) — a 401 from them means "bad
   * credentials" or "this specific token is dead", never "attach a
   * different token and retry", and retrying /token/refresh/ on its own
   * 401 would recurse forever. */
  skipAuthRetry?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.accessToken !== undefined ? options.accessToken : (authHooks?.getAccessToken() ?? null);
  let response = await rawFetch(path, options, token);

  if (response.status === 401 && !options.skipAuthRetry && authHooks) {
    const newToken = await authHooks.refreshAccessToken();
    if (newToken) {
      response = await rawFetch(path, options, newToken);
    }
    if (response.status === 401) {
      authHooks.onAuthFailure();
    }
  }

  return parseResponse<T>(response);
}

function rawFetch(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // DRF's pagination `next`/`previous` links are full absolute URLs (they
  // include the scheme/host already) — pass those through as-is instead of
  // prefixing with BASE_URL again.
  const url = /^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`;

  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, data, extractErrorMessage(data) ?? `Request failed (${response.status})`);
  }

  return data as T;
}

// DRF error shapes: {"detail": "..."}, field-level
// {"field_name": ["message", ...]}, or a bare ["message", ...] array —
// that last one is what `raise ValidationError("…")` from a view body
// produces (as opposed to from a serializer, which DRF wraps in
// {"non_field_errors": [...]}). Pick out one human-readable message.
//
// Without the array case, every such error rendered as the useless
// "Request failed (400)" instead of the real reason — which is exactly
// what a user hits when a guardrail refuses their action.
function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;

  if (Array.isArray(body)) {
    return typeof body[0] === 'string' ? body[0] : null;
  }

  const record = body as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;

  const firstFieldErrors = Object.values(record)[0];
  if (Array.isArray(firstFieldErrors) && typeof firstFieldErrors[0] === 'string') {
    return firstFieldErrors[0];
  }
  return null;
}

interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Walks every page of a paginated (DRF-style {count,next,previous,results})
// endpoint — extracted from SettingsPage.tsx, which was the first caller to
// need "every record, not just the first page" (Usage% needs the real,
// whole-tenant fill rate). Not every list endpoint is paginated this way —
// Opportunity/Risk/Scenario return a plain array (see those views' own
// docstrings on why) — for those, call apiFetch<T[]> directly instead.
export async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let url: string | undefined = endpoint;
  while (url) {
    const page: Page<T> = await apiFetch<Page<T>>(url);
    all.push(...page.results);
    url = page.next ?? undefined;
  }
  return all;
}
