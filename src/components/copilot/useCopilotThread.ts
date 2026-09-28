import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import { sendMessage } from '../../pages/copilot/copilotApi';
import type { Conversation, SurfaceContext } from '../../pages/copilot/types';

/** One question: what the bubble shows (`text`), what is sent (`content`,
 *  which carries Communications' prefix), and the Dashboard's or
 *  Organizations' structured context. */
export interface Turn {
  text: string;
  content: string;
  context?: SurfaceContext;
}

export interface FailedTurn extends Turn {
  /** A 429: the month's AI budget is spent, so there is nothing to retry. */
  budget: boolean;
  /** A 400 refusing the page itself (an organisation or account the asker
   *  may no longer open): asking again would ask the same, so no retry. */
  refused: boolean;
  message: string;
}

export interface CopilotThread {
  pending: Turn | null;
  failed: FailedTurn | null;
  send: (turn: Turn) => Promise<void>;
  retry: () => void;
}

export const BUDGET_MESSAGE = "This month's AI budget is used up.";

/** What a `400 {"context": {"organization" | "account": [...]}}` means to the
 *  asker (backend delivery 3): the page is no longer theirs to ask about.
 *  Null for any other failure. */
export function refusalMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.status !== 400) return null;
  const context = (err.body as { context?: unknown } | null)?.context;
  if (!context || typeof context !== 'object') return null;
  if ('organization' in context) return 'You can no longer ask about this organization.';
  if ('account' in context) return 'You can no longer ask about this account. Choose All and ask again.';
  return null;
}

/** Sending on one conversation, with the states the rail shows: in flight,
 *  budget spent, or failed and retryable with the question kept. */
export function useCopilotThread(
  conversation: Conversation | null,
  onConversation: (conversation: Conversation) => void,
  context?: SurfaceContext | null,
): CopilotThread {
  const [pending, setPending] = useState<Turn | null>(null);
  const [failed, setFailed] = useState<FailedTurn | null>(null);

  // Another conversation (New chat, one reopened from History) starts clean.
  // Adjusted during render, as DrillContext does, so no frame shows the old failure.
  const id = conversation?.id ?? null;
  const [threadId, setThreadId] = useState(id);
  if (threadId !== id) {
    setThreadId(id);
    setFailed(null);
    setPending(null);
  }

  // Moving to another organisation or account keeps the same conversation
  // (spec: it lasts from the List into an organisation and back), but a
  // refusal there says nothing about the page the person has moved to, so it
  // does not linger once the context has changed. `context` is undefined for
  // a caller with nothing structured to ask about (Communications), which
  // never triggers this.
  const contextKey = context ? JSON.stringify(context) : null;
  const [threadContext, setThreadContext] = useState(contextKey);
  if (threadContext !== contextKey) {
    setThreadContext(contextKey);
    setFailed(null);
  }

  // Which conversation is on screen now, for a send that outlives it: an
  // answer that lands after New chat or a History pick belongs to the
  // conversation it was asked in, not the one the person moved to.
  const liveId = useRef(id);
  useEffect(() => {
    liveId.current = id;
  }, [id]);
  // The latest send, so an earlier one finishing late can't clear its pending.
  const latest = useRef(0);

  async function send(turn: Turn) {
    if (pending) return;
    const askedIn = conversation?.id ?? null;
    const mine = ++latest.current;
    const stillHere = () => liveId.current === askedIn;
    setFailed(null);
    setPending(turn);
    try {
      const answered = await sendMessage({ conversationId: conversation?.id, content: turn.content, context: turn.context });
      if (stillHere()) onConversation(answered);
    } catch (err) {
      if (!stillHere()) return;
      const budget = err instanceof ApiError && err.status === 429;
      const refusal = refusalMessage(err);
      const message = budget
        ? BUDGET_MESSAGE
        : (refusal ?? (err instanceof ApiError ? err.message : 'The Copilot did not answer.'));
      setFailed({ ...turn, budget, refused: refusal !== null, message });
    } finally {
      if (latest.current === mine) setPending(null);
    }
  }

  // Retry resends the question as it was asked, context included (the chip
  // on the failed bubble), not the screen as it is now.
  function retry() {
    if (!failed || failed.budget || failed.refused) return;
    void send({ text: failed.text, content: failed.content, context: failed.context });
  }

  return { pending, failed, send, retry };
}
