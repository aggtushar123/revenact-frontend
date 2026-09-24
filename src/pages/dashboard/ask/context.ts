import { createContext } from 'react';
import type { CopilotThread } from '../../../components/copilot/useCopilotThread';
import type { Conversation, DashboardFocus } from '../../copilot/types';

export interface AskState {
  /** The rail is expanded (sm and up) or the sheet is open (below sm). */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** The dashboard's one conversation; survives area and filter changes. */
  conversation: Conversation | null;
  setConversation: (conversation: Conversation | null) => void;
  thread: CopilotThread;
  /** What the next question is narrowed to, if anything. */
  focus: DashboardFocus | null;
  /** The chip's ×: drop the focus, keep the screen. */
  clearFocus: () => void;
  /** A question left: its focus and prefilled draft are spent. */
  markSent: () => void;
  pendingDraft: { text: string; nonce: number } | null;
  /** Prefill an editable question about `focus` and open the rail; never sends. */
  draft: (question: string, focus: DashboardFocus) => void;
  /** Open the rail and send `question` now, grounded in the screen as it is. */
  ask: (question: string, focus: DashboardFocus | null) => void;
  /** Show a conversation picked in History. */
  openFromHistory: (conversation: Conversation) => void;
}

export const AskContext = createContext<AskState | null>(null);
