// Shared real-time WebSocket core — the reconnect-with-backoff plumbing
// every real-time feature in this app needs (Multiplayer Copilot's own
// features/copilotSessions/sessionSocket.ts, features/notifications/
// notificationSocket.ts), pulled out here once a second feature needed
// the exact same thing, rather than duplicated per feature. No framework,
// no library — this app's real real-time surface is still small enough
// (two routes, two message shapes) that a thin wrapper is all either
// needs; each caller supplies its own real WS path (already carrying
// whatever query params it needs, e.g. `?token=`) and its own typed
// `onMessage` parsing.

const RECONNECT_DELAY_MS = 2000;

export interface SocketHandle {
  disconnect: () => void;
}

// Same origin as the REST API (see lib/apiClient.ts's own BASE_URL) but
// ws(s):// instead of http(s):// and no /api/v1 prefix — every real WS
// route is mounted directly on the ASGI app (config/asgi.py), not
// through Django's normal URLconf.
export const WS_BASE_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/^http/, 'ws');

export function connectSocket(path: string, onMessage: (data: unknown) => void): SocketHandle {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    socket = new WebSocket(`${WS_BASE_URL}${path}`);

    socket.onmessage = (event) => {
      try {
        onMessage(JSON.parse(event.data));
      } catch {
        // A malformed push is skipped, not fatal — each caller's own
        // real REST fetch/poll still catches up independently.
      }
    };

    // Real reconnect on any drop (server restart, network blip, the
    // access token going stale) — if access was actually revoked, the
    // next connect attempt's own real backend check just rejects it
    // again, same as the first one would have.
    socket.onclose = scheduleReconnect;
    socket.onerror = () => socket?.close();
  }

  function scheduleReconnect() {
    if (stopped) return;
    reconnectTimer = window.setTimeout(connect, RECONNECT_DELAY_MS);
  }

  connect();

  return {
    disconnect() {
      stopped = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      socket?.close();
    },
  };
}
