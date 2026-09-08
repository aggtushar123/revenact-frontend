import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiFetch, ApiError, setAuthHooks } from './apiClient';

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('apiFetch', () => {
  let refreshAccessToken: ReturnType<typeof vi.fn<() => Promise<string | null>>>;
  let onAuthFailure: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    refreshAccessToken = vi.fn<() => Promise<string | null>>();
    onAuthFailure = vi.fn<() => void>();
    setAuthHooks({
      getAccessToken: () => 'stale.access.jwt',
      refreshAccessToken,
      onAuthFailure,
    });
  });

  it('attaches the access token from auth hooks automatically', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/some/protected/');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer stale.access.jwt' }) })
    );
  });

  it('an explicit accessToken option overrides the auto-attached one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/some/path/', { accessToken: 'explicit.jwt' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer explicit.jwt' }) })
    );
  });

  it('on 401, refreshes and retries once with the new token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'expired' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    refreshAccessToken.mockResolvedValue('fresh.access.jwt');

    const result = await apiFetch('/some/protected/');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh.access.jwt' }) })
    );
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('on 401 with no successful refresh, gives up and forces logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'expired' })));
    refreshAccessToken.mockResolvedValue(null);

    await expect(apiFetch('/some/protected/')).rejects.toThrow(ApiError);
    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it('on 401 when the retried request also 401s, forces logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'still expired' })));
    refreshAccessToken.mockResolvedValue('fresh.access.jwt');

    await expect(apiFetch('/some/protected/')).rejects.toThrow('still expired');
    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it('skipAuthRetry prevents any refresh attempt, even on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'bad credentials' })));

    await expect(apiFetch('/auth/login/', { skipAuthRetry: true })).rejects.toThrow('bad credentials');
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(onAuthFailure).not.toHaveBeenCalled();
  });
});

describe('apiFetch error messages', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    setAuthHooks({
      getAccessToken: () => 'access.jwt',
      refreshAccessToken: async () => null,
      onAuthFailure: () => {},
    });
  });

  async function messageFor(body: unknown, status = 400) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(status, body)));
    try {
      await apiFetch('/anything/');
      throw new Error('expected apiFetch to reject');
    } catch (err) {
      return (err as ApiError).message;
    }
  }

  it('reads DRF\'s {"detail": "..."} shape', async () => {
    expect(await messageFor({ detail: 'Not found.' }, 404)).toBe('Not found.');
  });

  it('reads a field-level {"field": ["..."]} shape', async () => {
    expect(await messageFor({ email: ['A user with this email already exists.'] })).toBe(
      'A user with this email already exists.'
    );
  });

  it('reads a serializer-level {"non_field_errors": ["..."]} shape', async () => {
    expect(await messageFor({ non_field_errors: ['This is the only person who can manage users.'] })).toBe(
      'This is the only person who can manage users.'
    );
  });

  it('reads a bare ["..."] array, which a view-body ValidationError produces', async () => {
    // Without this case these surfaced as the useless "Request failed
    // (400)" — exactly what a user sees when a guardrail refuses them.
    expect(await messageFor(['Move the people holding this role onto another one first.'])).toBe(
      'Move the people holding this role onto another one first.'
    );
  });

  it('falls back to a status message when the body has nothing readable', async () => {
    expect(await messageFor({ weird: { nested: true } }, 500)).toBe('Request failed (500)');
  });
});
