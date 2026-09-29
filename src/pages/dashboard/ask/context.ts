import { createContext } from 'react';
import type { CopilotThread } from '../../../components/copilot/useCopilotThread';
import { isStoryFocus } from '../../../features/organizations/detailAskContext';
import type { AskFocus, Conversation, SurfaceContext, SurfaceName } from '../../copilot/types';

/** One page's side of Ask Revenact: which surface it is, where the person is
 *  on it now (null off a real view, e.g. mid-redirect), and how it words a
 *  question's context as a chip. */
export interface AskSurface {
  name: SurfaceName;
  context: SurfaceContext | null;
  chipLabel: (context: SurfaceContext) => string;
}

export interface PendingDraft {
  text: string;
  nonce: number;
  edited?: boolean;
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
  focus: AskFocus | null;
  /** The chip's ×: drop the focus, keep the screen. */
  clearFocus: () => void;
  /** Narrow the next question to `focus` without opening the rail or
   *  prefilling anything (an opened Organizations row or card). */
  focusOn: (focus: AskFocus) => void;
  /** A question left: its focus and prefilled draft are spent. */
  markSent: () => void;
  /** The prefilled question; `edited` once the person has changed it. */
  pendingDraft: PendingDraft | null;
  /** The person changed the composer's text: a prefill is theirs now. */
  markDraftEdited: () => void;
  /** Prefill an editable question about `focus` and open the rail; never sends. */
  draft: (question: string, focus: AskFocus) => void;
  /** Open the rail and send `question` now, grounded in the screen as it is. */
  ask: (question: string, focus: AskFocus | null) => void;
  /** Start over: an empty conversation, with the rail shown for this visit. */
  newChat: () => void;
  /** Show a conversation picked in History. */
  openFromHistory: (conversation: Conversation) => void;
}

/** The surface's context narrowed by `focus`. Each screen takes only its
 *  own kind: the Dashboard a drill or attention item, the List and the Board
 *  a companies focus, an organisation's page a story item. Contacts' person
 *  view takes only the sentiment focus; its list takes none. */
export function withFocus(context: SurfaceContext, focus: AskFocus | null): SurfaceContext {
  if (context.surface === 'contacts') {
    return context.view === 'person' ? { ...context, focus: focus?.kind === 'sentiment' ? 'sentiment' : null } : context;
  }
  if (context.surface === 'dashboard') {
    return { ...context, focus: focus && (focus.kind === 'companies' || focus.kind === 'attention') ? focus : null };
  }
  if (context.view === 'detail') return { ...context, focus: isStoryFocus(focus) ? focus : null };
  return { ...context, focus: focus?.kind === 'companies' ? focus : null };
}

export const AskContext = createContext<AskState | null>(null);

/** Just `focusOn`, in its own context. Its identity never changes across an
 *  AskProvider render (it's a bare `useCallback` with no deps), so a
 *  component that only narrows the next question on open (a List row, a
 *  Board card) can read it here instead of the whole `AskState` and skip
 *  every re-render a send causes (pending, then the answer). */
export const AskFocusOnContext = createContext<((focus: AskFocus) => void) | null>(null);

/** Just `draft`, in its own context, for the same reason: its identity
 *  changes only with the viewport, so a story item's "Ask about this" can
 *  read it here without re-rendering the whole story on every send. */
export const AskDraftContext = createContext<((question: string, focus: AskFocus) => void) | null>(null);
