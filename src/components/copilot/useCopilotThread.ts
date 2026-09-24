import { useState } from 'react';
import { ApiError } from '../../lib/apiClient';
import { sendMessage } from '../../pages/copilot/copilotApi';
import type { Conversation, DashboardContext } from '../../pages/copilot/types';

/** One question: what the bubble shows (`text`), what is sent (`content`,
 *  which carries Communications' prefix), and the dashboard context. */
export interface Turn {
  text: string;
  content: string;
  context?: DashboardContext;
}

export interface FailedTurn extends Turn {
  /** A 429: the month's AI budget is spent, so there is nothing to retry. */
  budget: boolean;
  message: string;
}

export interface CopilotThread {
  pending: Turn | null;
  failed: FailedTurn | null;
  send: (turn: Turn) => Promise<void>;
  retry: () => void;
}

export const BUDGET_MESSAGE = "This month's AI budget is used up.";

/** Sending on one conversation, with the states the rail shows: in flight,
 *  budget spent, or failed and retryable with the question kept. */
export function useCopilotThread(
  conversation: Conversation | null,
  onConversation: (conversation: Conversation) => void,
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
  }

  async function send(turn: Turn) {
    if (pending) return;
    setFailed(null);
    setPending(turn);
    try {
      onConversation(await sendMessage({ conversationId: conversation?.id, content: turn.content, context: turn.context }));
    } catch (err) {
      const budget = err instanceof ApiError && err.status === 429;
      const message = budget ? BUDGET_MESSAGE : err instanceof ApiError ? err.message : 'The Copilot did not answer.';
      setFailed({ ...turn, budget, message });
    } finally {
      setPending(null);
    }
  }

  // Retry resends the question as it was asked, context included (the chip
  // on the failed bubble), not the screen as it is now.
  function retry() {
    if (!failed || failed.budget) return;
    void send({ text: failed.text, content: failed.content, context: failed.context });
  }

  return { pending, failed, send, retry };
}
