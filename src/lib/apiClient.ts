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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

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
