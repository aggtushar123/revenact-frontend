import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchNotifications } from '../features/notifications/notificationApi';
import { connectNotificationSocket } from '../features/notifications/notificationSocket';
import {
  notificationsReceived,
  notificationAdded,
} from '../features/notifications/notificationsSlice';
import { NavActionsSlotContext } from './navActionsSlot';

export function DashboardLayout() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  // Only the builder (/scenarios/create, /scenarios/:id) wants the
  // full-canvas, no-Navbar treatment — /scenarios itself is a plain
  // list page like any other, with the shared Navbar above it.
  const isScenarios = location.pathname.startsWith('/scenarios/');
  // The Copilot is the home page: nothing above it, nothing framing it.
  // Communications brings its own top bar for the same reason.
  const isCopilot = location.pathname === '/copilot';
  const isCommunications = location.pathname.startsWith('/communications');
  const isSettings = location.pathname.startsWith('/settings');
  const isAccountSettings = location.pathname.startsWith('/account-settings');
  // The dashboard's frame pads itself the way Communications' body does.
  const isDashboard = location.pathname.startsWith('/dashboard');
  // The Organizations frame: the list, the board and an organization's page.
  const isOrgView =
    location.pathname === '/organizations/list' ||
    location.pathname === '/organizations/board' ||
    /^\/organizations\/\d+$/.test(location.pathname);
  // The Contacts frame (spec 2026-09-28 §3): the list, and a person on it.
  // A trailing slash still reads as the same route (fix round 1, 2026-09-28).
  const isContacts = /^\/contacts(\/\d+)?\/?$/.test(location.pathname);
  // The Accounts list and board wear the Organizations frame too (accounts
  // spec 2026-09-29 §1), whose own px-4 pb-4 already gutters them — without
  // this <main> doubled the side padding and added a gap under the
  // transparent bar (fix round 1, 2026-09-30). An account's page wears the
  // organization page's bleed frame (§2.1), so it takes no padding either.
  const isAccountsView = /^\/accounts\/(list|board|\d+)\/?$/.test(location.pathname);
  // The Navbar's actions slot, which a page below (the dashboard) portals into.
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const slotValue = useMemo(() => ({ slot, setSlot }), [slot]);

  // Real notifications — fetched once and pushed live for as long as
  // this layout is mounted, i.e. the whole logged-in session (not
  // Navbar itself, which unmounts on /scenarios/* routes above and
  // would otherwise disconnect the socket every time a CSM opens the
  // scenario builder). A deliberate contrast with Multiplayer
  // Copilot's own session socket (features/copilotSessions/
  // sessionSocket.ts), which only connects while one specific
  // conversation is open.
  useEffect(() => {
    if (!accessToken) return;

    fetchNotifications()
      .then((notifications) => dispatch(notificationsReceived(notifications)))
      .catch(() => {
        // A failed initial load just leaves the bell showing nothing —
        // the next real WebSocket push (or a manual refresh) still
        // catches up, not worth a blocking error banner for this.
      });

    const socket = connectNotificationSocket(accessToken, (notification) =>
      dispatch(notificationAdded(notification))
    );
    return () => socket.disconnect();
  }, [accessToken, dispatch]);

  return (
    <NavActionsSlotContext.Provider value={slotValue}>
      <div className="flex bg-surface h-screen w-screen overflow-hidden text-ink font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden rv-canvas">
          {!isScenarios && !isCopilot && !isCommunications && <Navbar />}
          <main className={`flex-1 overflow-hidden h-full flex flex-col ${(isScenarios || isSettings || isAccountSettings || isCopilot || isCommunications || isDashboard || isOrgView || isContacts || isAccountsView) ? 'p-0' : 'p-2 md:p-3 lg:p-4'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </NavActionsSlotContext.Provider>
  );
}
