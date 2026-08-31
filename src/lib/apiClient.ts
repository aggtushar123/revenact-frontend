// Thin fetch wrapper for revenact-backend's /api/v1/ — see
// revenact-backend/docs/API_CONTRACTS.md for the response/error shapes
// this follows.

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1`;

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

  return fetch(`${BASE_URL}${path}`, {
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

// DRF error shape is either {"detail": "..."} or field-level
// {"field_name": ["message", ...]} — pick out one human-readable message.
function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === 'string') return record.detail;

  const firstFieldErrors = Object.values(record)[0];
  if (Array.isArray(firstFieldErrors) && typeof firstFieldErrors[0] === 'string') {
    return firstFieldErrors[0];
  }
  return null;
}
