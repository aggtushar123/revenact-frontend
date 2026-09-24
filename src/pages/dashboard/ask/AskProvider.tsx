import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useCopilotThread } from '../../../components/copilot/useCopilotThread';
import { SM, XL, useMediaQuery } from '../../../lib/useMediaQuery';
import type { Conversation, DashboardFocus } from '../../copilot/types';
import { readAskPreference, writeAskPreference } from './askPreference';
import { AskContext, type AskState } from './context';
import { useDashboardContext } from './useDashboardContext';

/** Holds the dashboard's one conversation, above the areas, so it survives
 *  tab and filter changes. Also the rail's open state, the focus a drill or
 *  attention row hands it, and the question a drill prefills. */
export function AskProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const isSm = useMediaQuery(SM);
  const isXl = useMediaQuery(XL);
  const { context } = useDashboardContext();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const thread = useCopilotThread(conversation, setConversation);
  const [choice, setChoice] = useState<boolean | null>(readAskPreference);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focus, setFocus] = useState<DashboardFocus | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{ text: string; nonce: number } | null>(null);

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
  // sm the rail is a sheet, which always starts closed.
  const railOpen = choice ?? isXl;
  const open = isSm ? railOpen : sheetOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isSm) {
        setChoice(next);
        writeAskPreference(next);
      } else {
        setSheetOpen(next);
      }
    },
    [isSm],
  );

  const clearFocus = useCallback(() => setFocus(null), []);
  const markSent = useCallback(() => {
    setFocus(null);
    setPendingDraft(null);
  }, []);

  const value = useMemo<AskState>(
    () => ({
      open,
      setOpen,
      conversation,
      setConversation,
      thread,
      focus,
      clearFocus,
      markSent,
      pendingDraft,
      draft: (question, nextFocus) => {
        setFocus(nextFocus);
        // A new nonce remounts the composer with the new text. After markSent
        // the key is 0, so restarting at 1 still differs from the last key.
        setPendingDraft((prev) => ({ text: question, nonce: (prev?.nonce ?? 0) + 1 }));
        setOpen(true);
      },
      ask: (question, nextFocus) => {
        if (!context) return;
        setOpen(true);
        void thread.send({ text: question, content: question, context: { ...context, focus: nextFocus } });
      },
      openFromHistory: (next) => {
        setConversation(next);
        setOpen(true);
      },
    }),
    [open, setOpen, conversation, thread, focus, clearFocus, markSent, pendingDraft, context],
  );

  return <AskContext.Provider value={value}>{children}</AskContext.Provider>;
}
