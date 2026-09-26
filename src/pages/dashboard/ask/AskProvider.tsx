import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCopilotThread } from '../../../components/copilot/useCopilotThread';
import { SM, XL, useMediaQuery } from '../../../lib/useMediaQuery';
import { fetchConversation } from '../../copilot/copilotApi';
import type { Conversation, DashboardFocus, SurfaceContext } from '../../copilot/types';
import { ASK_PREFERENCE_KEY, readAskPreference, writeAskPreference } from './askPreference';
import { AskContext, type AskState, type AskSurface } from './context';
import { originPath } from './originPath';

/** The navigation state another surface's History sends with a conversation
 *  that started on this page. */
export interface AskHandover {
  askConversationId?: number;
}

/** Holds one surface's conversation (the Dashboard's above its areas,
 *  Organizations' above the List and the Board), so it survives tab and
 *  filter changes. Also the rail's open state, the focus an entry point hands
 *  it, and the question a drill prefills. `surface` is where the person is on
 *  that page and how its chips read; `preferenceKey` is where the rail's own
 *  open/closed choice is kept. */
export function AskProvider({
  surface,
  preferenceKey = ASK_PREFERENCE_KEY,
  children,
}: {
  surface: AskSurface;
  preferenceKey?: string;
  children: ReactNode;
}) {
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();
  const isSm = useMediaQuery(SM);
  const isXl = useMediaQuery(XL);
  // Read once, on arrival: a conversation another surface's History sent here.
  const [handedId] = useState<number | null>(() => (state as AskHandover | null)?.askConversationId ?? null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const thread = useCopilotThread(conversation, setConversation);
  // A handed-over conversation shows for this visit, whatever the saved choice.
  const [choice, setChoice] = useState<boolean | null>(() => (handedId !== null ? true : readAskPreference(preferenceKey)));
  const [sheetOpen, setSheetOpen] = useState(handedId !== null);
  const [focus, setFocus] = useState<DashboardFocus | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{ text: string; nonce: number } | null>(null);

  useEffect(() => {
    if (handedId === null) return;
    let cancelled = false;
    fetchConversation(handedId).then(
      (found) => {
        if (!cancelled) setConversation(found);
      },
      () => {
        // The rail opens empty; History still lists the conversation.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [handedId]);

  // A focus names accounts on the screen it came from, so another area or
  // filter drops it (a drill closes on the same change). Adjusted during
  // render, as DrillContext does. The typed draft stays: it is the person's text.
  const locationKey = pathname + search;
  const [madeAt, setMadeAt] = useState(locationKey);
  if (madeAt !== locationKey) {
    setMadeAt(locationKey);
    setFocus(null);
  }

  // Open by default from xl; the person's own choice wins once made. Below
  // sm the rail is a sheet, which always starts closed (unless a
  // conversation was handed over).
  const railOpen = choice ?? isXl;
  const open = isSm ? railOpen : sheetOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isSm) {
        setChoice(next);
        writeAskPreference(next, preferenceKey);
      } else {
        setSheetOpen(next);
      }
    },
    [isSm, preferenceKey],
  );

  // Entry points (a drill's "Ask about these", an attention row's "Why?",
  // New chat, a History pick) open the rail for this visit only; the saved choice is the person's own
  // toggle, so one click never overwrites a remembered "collapsed".
  const reveal = useCallback(() => {
    if (isSm) setChoice(true);
    else setSheetOpen(true);
  }, [isSm]);

  const clearFocus = useCallback(() => setFocus(null), []);
  const focusOn = useCallback((next: DashboardFocus) => setFocus(next), []);
  const markSent = useCallback(() => {
    setFocus(null);
    setPendingDraft(null);
  }, []);

  const value = useMemo<AskState>(
    () => ({
      surface,
      open,
      setOpen,
      conversation,
      setConversation,
      thread,
      focus,
      clearFocus,
      focusOn,
      markSent,
      pendingDraft,
      draft: (question, nextFocus) => {
        setFocus(nextFocus);
        // A new nonce remounts the composer with the new text. After markSent
        // the key is 0, so restarting at 1 still differs from the last key.
        setPendingDraft((prev) => ({ text: question, nonce: (prev?.nonce ?? 0) + 1 }));
        reveal();
      },
      ask: (question, nextFocus) => {
        // One question at a time: while an answer is on its way the thread
        // would drop this send, so leave the draft and its focus as they are.
        const context = surface.context;
        if (!context || thread.pending) return;
        reveal();
        // `focus` is the shared, surface-agnostic slot (the Dashboard also
        // offers an `attention` focus); on Organizations only
        // `useAskFocusOnOpen` ever writes here, and it only ever builds a
        // `{kind: 'companies'}` value, so this cast is safe in practice even
        // though `OrganizationsContext.focus` is typed narrower than
        // `DashboardFocus`.
        void thread.send({ text: question, content: question, context: { ...context, focus: nextFocus } as SurfaceContext });
        // The send above carries its own focus; an earlier draft's focus and
        // text are spent, or the chip would name accounts nobody asked about.
        setFocus(null);
        setPendingDraft(null);
      },
      newChat: () => {
        setConversation(null);
        reveal();
      },
      openFromHistory: (next) => {
        const origin = next.origin;
        if (origin && origin.surface !== surface.name) {
          // Started on the other surface: it reopens on that page, beside
          // what it was about, and that page's rail picks it up.
          const handover: AskHandover = { askConversationId: next.id };
          navigate(originPath(origin), { state: handover });
          return;
        }
        // One from this surface reopens where it was asked, so its first
        // answer sits beside the figures it was about.
        if (origin) navigate(originPath(origin));
        setConversation(next);
        reveal();
      },
    }),
    [surface, open, setOpen, reveal, conversation, thread, focus, clearFocus, focusOn, markSent, pendingDraft, navigate],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}
