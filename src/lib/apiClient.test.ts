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
