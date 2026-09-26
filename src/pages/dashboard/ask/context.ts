import { createContext } from 'react';
import type { CopilotThread } from '../../../components/copilot/useCopilotThread';
import type { Conversation, DashboardFocus, SurfaceContext, SurfaceName } from '../../copilot/types';

/** One page's side of Ask Revenact: which surface it is, where the person is
 *  on it now (null off a real view, e.g. mid-redirect), and how it words a
 *  question's context as a chip. */
export interface AskSurface {
  name: SurfaceName;
  context: SurfaceContext | null;
  chipLabel: (context: SurfaceContext) => string;
}

export interface AskState {
  /** The surface this rail asks from. */
  surface: AskSurface;
  /** The rail is expanded (sm and up) or the sheet is open (below sm). */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** The surface's one conversation; survives tab and filter changes. */
  conversation: Conversation | null;
  setConversation: (conversation: Conversation | null) => void;
  thread: CopilotThread;
  /** What the next question is narrowed to, if anything. */
  focus: DashboardFocus | null;
  /** The chip's ×: drop the focus, keep the screen. */
  clearFocus: () => void;
  /** Narrow the next question to `focus` without opening the rail or
   *  prefilling anything (an opened Organizations row or card). */
  focusOn: (focus: DashboardFocus) => void;
  /** A question left: its focus and prefilled draft are spent. */
  markSent: () => void;
  pendingDraft: { text: string; nonce: number } | null;
  /** Prefill an editable question about `focus` and open the rail; never sends. */
  draft: (question: string, focus: DashboardFocus) => void;
  /** Open the rail and send `question` now, grounded in the screen as it is. */
  ask: (question: string, focus: DashboardFocus | null) => void;
  /** Start over: an empty conversation, with the rail shown for this visit. */
  newChat: () => void;
  /** Show a conversation picked in History. */
  openFromHistory: (conversation: Conversation) => void;
}

/** The surface's context narrowed by `focus`. The shared slot is a
 *  DashboardFocus; Organizations only takes a companies focus, so any other
 *  kind (never written there) reads as no focus rather than a cast. */
export function withFocus(context: SurfaceContext, focus: DashboardFocus | null): SurfaceContext {
  if (context.surface === 'dashboard') return { ...context, focus };
  return { ...context, focus: focus?.kind === 'companies' ? focus : null };
}

export const AskContext = createContext<AskState | null>(null);
