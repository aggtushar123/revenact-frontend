// Test-only: DashboardLayout's Navbar actions slot, where an Ask pill
// portals. Shared by every page's test render (organization, Contacts, …)
// so a rail's pill has somewhere real to land.
import { useMemo, useState, type ReactNode } from 'react';
import { NavActionsSlotContext } from '../layouts/navActionsSlot';

/** With the real Navbar (`nav`) the Navbar renders the slot element; without
 *  it a bare one stands in (`data-testid="nav-actions"`). */
export function SlotHost({ bare, children }: { bare: boolean; children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const value = useMemo(() => ({ slot, setSlot }), [slot]);
  return (
    <NavActionsSlotContext.Provider value={value}>
      {bare ? <div ref={setSlot} data-testid="nav-actions" /> : null}
      {children}
    </NavActionsSlotContext.Provider>
  );
}
