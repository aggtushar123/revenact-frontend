import { createContext } from 'react';

/** A place in the Navbar's right-hand actions that a page can portal its own
 *  controls into (the dashboard's Ask pill). DashboardLayout owns the element;
 *  the Navbar renders it on the routes that use it; `slot` is null anywhere
 *  else, and a page with nothing to portal into renders nothing there. */
export interface NavActionsSlot {
  slot: HTMLElement | null;
  setSlot: (element: HTMLElement | null) => void;
}

export const NavActionsSlotContext = createContext<NavActionsSlot>({ slot: null, setSlot: () => {} });
