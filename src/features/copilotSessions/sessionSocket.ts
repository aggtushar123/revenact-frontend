// Real-time push, Multiplayer Copilot Phase 2b — mirrors revenact-backend's
// services/copilot/consumers.py / routing.py. A thin WebSocket client: no
// framework, no library, matching how small this app's own real-time
// surface actually is (one route, one message shape). Sending actions
// still goes through the existing REST calls in sessionApi.ts — this
// connection only ever receives a pushed CopilotSession snapshot,
// identical in shape to what fetchSession() already returns.
import type { CopilotSession } from './types';

// Same origin as the REST API (see lib/apiClient.ts's own BASE_URL) but
// ws(s):// instead of http(s):// and no /api/v1 prefix — the WebSocket
// route is mounted directly on the ASGI app (config/asgi.py), not
// through Django's normal URLconf.
const WS_BASE_URL = `${import.meta.env.VITE_API_URL}`.replace(/^http/, 'ws');

const RECONNECT_DELAY_MS = 2000;

export interface SessionSocketHandle {
  disconnect: () => void;
}

// The JWT travels as a query param, not an Authorization header — a
// browser can't attach custom headers to a WebSocket handshake at all
// (see the backend's own jwt_auth_middleware.py docstring for the other
// half of this). `accessToken` is passed in by the caller
// (state.auth.accessToken) rather than read from the store directly
// here, so this module has no dependency on the store/authSlice.
export function connectSessionSocket(
  conversationId: number,
  accessToken: string,
  onUpdate: (session: CopilotSession) => void
): SessionSocketHandle {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    const url = `${WS_BASE_URL}/ws/copilot/sessions/${conversationId}/?token=${encodeURIComponent(accessToken)}`;
    socket = new WebSocket(url);

    socket.onmessage = (event) => {
      try {
        onUpdate(JSON.parse(event.data) as CopilotSession);
      } catch {
        // A malformed push is skipped, not fatal — the next real REST
        // poll (Index.tsx's own resilience fallback) still catches up.
      }
    };

    // Real reconnect on any drop (server restart, network blip, the
    // access token going stale) — a session that's still live is worth
    // reconnecting to; if it isn't (or access was revoked), the next
    // connect attempt's own real backend check just rejects it again,
    // same as the first one would have.
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
