import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DrillRequest } from './types';
import { DrillContext } from './context';

/** Holds the one open drill for the whole dashboard. One panel, not one per
 *  view: opening another number replaces what is shown. */
export function DrillProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<DrillRequest | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const open = useCallback((request: DrillRequest, from?: HTMLElement | null) => {
    trigger.current = from ?? (document.activeElement as HTMLElement | null);
    setCurrent(request);
  }, []);

  const close = useCallback(() => {
    setCurrent(null);
    const back = trigger.current;
    trigger.current = null;
    // Synchronous, not requestAnimationFrame: the trigger is never part of
    // the dialog's own DOM, so it can be focused immediately, and jsdom
    // (unlike a real browser) never fires a queued rAF callback on its own.
    back?.focus();
  }, []);

  const value = useMemo(() => ({ current, open, close }), [current, open, close]);
  return <DrillContext.Provider value={value}>{children}</DrillContext.Provider>;
}
