import { useState, useEffect, useRef, useContext } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ACCOUNTS_DATA } from '../organizations/accountsData';
import type { AccountRow } from '../organizations/accountsData';
import { formatRelativeTime } from '../../features/customers/formatters';
import { EntityAvatar } from '../shared';
import {
  ChevronLeft,
  ChevronDown,
  Search,
  PlusCircle,
  HelpCircle,
  Bell,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Check,
  Sliders,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { logout } from '../../features/auth/authSlice';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '../../features/notifications/notificationApi';
import { notificationRead, allRead } from '../../features/notifications/notificationsSlice';
import { AREAS } from '../../pages/dashboard/areas';
import { sharedSearch } from '../../pages/dashboard/shared/useDashboardFilters';
import { NavActionsSlotContext } from '../../layouts/navActionsSlot';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const notifications = useAppSelector((state) => state.notifications.items);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { setSlot } = useContext(NavActionsSlotContext);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleNotificationClick(notification: (typeof notifications)[number]) {
    setIsNotificationsOpen(false);
    if (!notification.is_read) {
      dispatch(notificationRead({ id: notification.id }));
      markNotificationRead(notification.id).catch(() => {
        // The optimistic local read-state stands even if this particular
        // sync call fails — a stale unread badge is the worst case, not
        // a broken UI; the next real fetch reconciles it either way.
      });
    }
    if (notification.link) navigate(notification.link);
  }

  function handleMarkAllRead() {
    dispatch(allRead());
    markAllNotificationsRead().catch(() => {});
  }


  // Detect account details path (/accounts/:id — not /accounts/list,
  // which \d+ excludes, same reasoning as the Contacts breadcrumb
  // below). pages/accounts/Details.tsx itself still falls back to
  // ACCOUNTS_DATA mock data on a direct visit/refresh (a real backend
  // id from the Accounts tab never matches the mock's own 'acc-N'
  // string ids) — but a click through from that real Accounts tab (see
  // organizations/Details.tsx, or the standalone Accounts list page)
  // carries the real AccountRow via navigation `state`, the same one
  // that page's own body now renders, so this header shows the
  // org/account actually clicked instead of whatever the mock falls
  // back to.
  const accountMatch = location.pathname.match(/\/accounts\/(\d+)/);
  const accountId = accountMatch ? accountMatch[1] : null;
  const accountNavState = location.state as { account: AccountRow } | null;
  const account = accountId
    ? (accountNavState?.account ?? ACCOUNTS_DATA.find((a) => a.id === accountId) ?? ACCOUNTS_DATA[0])
    : null;

  const isOrganizations = location.pathname.startsWith('/organizations');
  // Only /accounts/list and /accounts/board — never /accounts/:id,
  // which the `account` branch above already claims first (checked
  // earlier in the render chain below), same "detail page own header
  // wins" ordering as isOrganizations vs. the `organization` branch.
  const isAccountsList = location.pathname.startsWith('/accounts');
  const isSettings = location.pathname.startsWith('/settings');
  const isAccountSettings = location.pathname.startsWith('/account-settings');
  const isPipelines = location.pathname.startsWith('/pipelines');
  const isDashboard = location.pathname.startsWith('/dashboard');
  // The Organizations list and board wear the dashboard's frame (portfolio
  // spec §1, owner decisions 2026-09-26): the transparent top bar, the
  // actions slot (empty until Ask Revenact lands on Organizations), and no
  // avatar.
  const isOrgView = location.pathname === '/organizations/list' || location.pathname === '/organizations/board';
  // An organization's page wears the same frame (organization page spec
  // §1.1): the page draws its own name row, so the bar only leads back.
  const isOrgDetail = /^\/organizations\/\d+$/.test(location.pathname);
  // Contacts wears the same frame (spec 2026-09-28 §3): the list and the
  // person open on it share one page, titled here; the page draws the rest.
  // A trailing slash still reads as the same route (fix round 1, 2026-09-28).
  const isContacts = /^\/contacts(\/\d+)?\/?$/.test(location.pathname);
  const isFramed = isDashboard || isOrgView || isOrgDetail || isContacts;
  const dashboardSharedSearch = sharedSearch(location.search);


  if (isAccountSettings) {
    return (
      <header className="h-[52px] border-b border-[var(--rv-header-border)] bg-[var(--rv-header-bg)] flex items-center justify-between px-4 md:px-6 shrink-0 z-20 transition-all select-none">
        {/* Search box matching user screenshot */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--rv-search-bg)] border border-[var(--rv-search-border)] text-[var(--rv-search-text)] text-[12px] w-[320px] sm:w-[420px] md:w-[460px] hover:border-[var(--rv-card-border-hover)] transition-all">
          <Search className="w-3.5 h-3.5 text-[var(--rv-text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search all conversations"
            className="bg-transparent text-[12px] text-[var(--rv-search-text)] placeholder:text-[var(--rv-search-placeholder)] outline-none w-full font-sans"
          />
          <kbd className="text-[10px] bg-[var(--rv-search-kbd-bg)] text-[var(--rv-search-kbd-text)] px-1.5 py-0.5 rounded border border-[var(--rv-search-kbd-border)] shrink-0 font-mono">
            ⌘ + F
          </kbd>
        </div>

        {/* Right icons: Feedback/MessageSquare icon + Status ring avatar indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors relative cursor-pointer"
            title="Messages and activity"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal-400" />
          </button>

          <div
            onClick={() => setIsAccountMenuOpen((open) => !open)}
            className="relative cursor-pointer"
            ref={accountMenuRef}
          >
            <div className="w-7 h-7 rounded-full p-[2px] bg-gradient-to-tr from-teal-500 via-amber-500 to-rose-500 flex items-center justify-center hover:scale-105 transition-transform shadow-xs">
              <div className="w-full h-full rounded-full bg-[var(--rv-header-bg)] flex items-center justify-center">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-400 to-rose-400" />
              </div>
            </div>

            {isAccountMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-[var(--rv-card-bg)] border border-[var(--rv-card-border)] rounded-xl shadow-2xl overflow-hidden z-50 text-[var(--rv-text)]">
                <div className="flex items-center gap-3 p-3 border-b border-[var(--rv-card-border)]">
                  <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(user?.name?.charAt(0) || 'T').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[var(--rv-text)] truncate">{user?.name || 'Your account'}</div>
                    <div className="text-[11px] text-[var(--rv-text-muted)] truncate">{user?.email ?? ''}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    navigate('/account-settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] hover:bg-black/5 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  <Sliders className="w-[15px] h-[15px]" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    dispatch(logout());
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all border-t border-[var(--rv-card-border)] cursor-pointer"
                >
                  <LogOut className="w-[15px] h-[15px]" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    // The dashboard's top bar is Communications' header, class for class:
    // transparent on the canvas, the Ask pill then the bell on the right, and
    // no avatar (the sidebar carries the account menu).
    <header
      className={
        isFramed
          ? 'h-16 shrink-0 flex items-center gap-3 px-4'
          : 'h-[64px] border-b border-line-subtle bg-surface flex items-center justify-between px-6 shrink-0 z-20 transition-all duration-300 shadow-sm'
      }
    >
      <div className="flex items-center gap-8 h-full">
        {account ? (
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-subtle rounded-lg transition-colors text-ink-faint hover:text-accent border border-transparent hover:border-line-subtle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                 <EntityAvatar
                    name={account.name}
                    logoUrl={account.logo}
                    className="w-[36px] h-[36px] rounded-full border border-line-subtle shadow-sm"
                 />
                 <div className="flex items-center gap-3">
                    <h1 className="text-[16px] font-bold text-ink tracking-tight uppercase whitespace-nowrap">{account.name}</h1>
                    <div className="w-px h-3.5 bg-line" />
                    <span className="text-[13.5px] font-bold text-ink-faint tracking-widest uppercase truncate max-w-[140px]">{account.orgName}</span>
                 </div>
              </div>
          </div>
        ) : isContacts ? (
          <div className="flex items-center gap-4 h-full">
            <h1 className="text-[17px] font-bold text-ink tracking-tight">Contacts</h1>
          </div>
        ) : isOrgDetail ? (
          <nav aria-label="Breadcrumb" className="flex items-center h-full">
            <Link
              to="/organizations/list"
              className="-ml-2 inline-flex min-h-11 sm:min-h-9 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-ink-muted hover:bg-subtle hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Organizations
            </Link>
          </nav>
        ) : isOrgView ? (
          <div className="flex items-center gap-4 h-full">
            <h1 className="text-[17px] font-bold text-ink tracking-tight">Organizations</h1>
            <nav aria-label="Organizations views" className="flex items-center gap-4 h-full">
              {[
                { to: '/organizations/list', label: 'List' },
                { to: '/organizations/board', label: 'Board' },
              ].map((view) => (
                <NavLink
                  key={view.to}
                  // The two views share their URL state (filters, sort,
                  // group), so switching tabs keeps it.
                  to={{ pathname: view.to, search: location.search }}
                  className={({ isActive }) =>
                    `h-full inline-flex items-center text-[13px] font-semibold border-b-2 transition-colors duration-[var(--dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      isActive ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                    }`
                  }
                >
                  {view.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : isOrganizations ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-subtle py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-ink tracking-tight">Organizations</h1>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[2.5px] mt-[1px]" />
            </div>
            
            <nav className="flex items-center gap-8 h-full mt-0.5 ml-2">
              <NavLink 
                to="/organizations/list" 
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-accent text-accent opacity-90' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                List
              </NavLink>
              <NavLink 
                to="/organizations/board" 
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-accent text-accent opacity-90' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                Board
              </NavLink>
            </nav>
          </>
        ) : isAccountsList ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-subtle py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-ink tracking-tight">Accounts</h1>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[2.5px] mt-[1px]" />
            </div>

            <nav className="flex items-center gap-8 h-full mt-0.5 ml-2">
              <NavLink
                to="/accounts/list"
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-accent text-accent opacity-90' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                List
              </NavLink>
              <NavLink
                to="/accounts/board"
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-accent text-accent opacity-90' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                Board
              </NavLink>
            </nav>
          </>
        ) : isPipelines ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-subtle py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-ink tracking-tight">Pipelines</h1>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[2.5px] mt-[1px]" />
            </div>

            <nav className="flex items-center gap-8 h-full mt-0.5 ml-2">
              <NavLink
                to="/pipelines/list"
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-accent text-accent opacity-90' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                List
              </NavLink>
              <NavLink
                to="/pipelines/board"
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-accent text-accent opacity-90' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                Board
              </NavLink>
            </nav>
          </>
        ) : isSettings ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-subtle py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-ink tracking-tight">Settings</h1>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted stroke-[2.5px] mt-[1px]" />
            </div>
            
            <nav className="flex items-center gap-6 h-full mt-0.5 ml-2 overflow-x-auto scrollbar-none max-w-[60vw]">
              {[
                { name: 'Data', path: '/settings/data' },
                { name: 'Currency', path: '/settings/currency' },
                { name: 'Products', path: '/settings/products' },
                { name: 'Entity Uploads', path: '/settings/entity-uploads' },
                { name: 'Webhooks', path: '/settings/webhooks' },
                { name: 'Activities', path: '/settings/activities' },
                { name: 'Global Presets', path: '/settings/global-presets' },
                { name: 'Connect Widget', path: '/settings/connect-widget' },
                { name: 'AI Agent', path: '/settings/ai-agent' },
                { name: 'AI Attributes', path: '/settings/ai-attributes' },
                { name: 'Brief Delivery', path: '/settings/brief-delivery' },
                { name: 'Agent Access', path: '/settings/agent-access' }
              ].map((tab) => (
                <NavLink 
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13.5px] px-1 pt-1 transition-all whitespace-nowrap ${isActive ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink'}`}
                >
                  {tab.name}
                </NavLink>
              ))}
            </nav>
          </>
        ) : isDashboard ? (
          <div className="flex items-center gap-4 h-full">
            <h1 className="text-[17px] font-bold text-ink tracking-tight">Dashboard</h1>

            <nav aria-label="Dashboard areas" className="flex items-center gap-4 h-full">
              {[{ key: 'overview', label: 'Overview' }, ...AREAS].map((area) => (
                <NavLink
                  key={area.key}
                  // Only the shared book filters travel between areas.
                  to={{ pathname: `/dashboard/${area.key}`, search: dashboardSharedSearch }}
                  className={({ isActive }) =>
                    `h-full inline-flex items-center text-[13px] font-semibold border-b-2 transition-colors duration-[var(--dur-fast)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                      isActive ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                    }`
                  }
                >
                  {area.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1.5 px-2 -ml-2 rounded-md">
            <h1 className="text-[17px] font-bold text-ink tracking-tight capitalize">
               {location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>
        )}
      </div>
      
      <div className={isFramed ? 'ml-auto flex items-center gap-3' : 'flex items-center gap-4'}>
        {/* Right side actions. The Copilot is the home page now, first in
            the sidebar; it no longer needs a button on every other page. */}
        <div className={isFramed ? 'flex items-center gap-3 text-ink-faint' : 'flex items-center gap-1.5 text-ink-faint ml-1'}>
          {/* The dashboard and the Organizations list and board put their
              Ask controls here (portaled by AskRail) in place of the
              decorative icons. */}
          {isFramed ? (
            <div ref={setSlot} data-nav-actions-slot="" className="flex items-center" />
          ) : (
            <>
              <IconButton icon={<Search className="w-4 h-4" />} />
              <IconButton icon={<PlusCircle className="w-4 h-4" />} />
              <IconButton icon={<HelpCircle className="w-4 h-4" />} />
              <IconButton icon={<MessageSquare className="w-4 h-4" />} />
            </>
          )}

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen((open) => !open)}
              aria-label="Notifications"
              className="p-1.5 hover:text-ink hover:bg-subtle rounded-lg transition-all border border-transparent hover:border-line-subtle"
            >
              <Bell className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-0.5 min-w-[15px] h-[15px] bg-accent text-on-accent flex items-center justify-center text-[9px] font-bold rounded-full px-0.5 border-2 border-surface shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}

            {isNotificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-surface border border-line rounded-xl shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line-subtle">
                  <span className="text-[12.5px] font-bold text-ink">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-[11px] font-semibold text-ink-faint hover:text-accent transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[12px] text-ink-faint font-medium px-3.5 py-6 text-center">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left flex items-start gap-2 px-3.5 py-2.5 border-b border-line-subtle last:border-b-0 transition-colors hover:bg-subtle ${
                          notification.is_read ? '' : 'bg-accent-dim/30'
                        }`}
                      >
                        {!notification.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        )}
                        <div className={`min-w-0 ${notification.is_read ? 'pl-3.5' : ''}`}>
                          <p className="text-[12.5px] text-ink font-medium leading-snug">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-ink-faint mt-0.5">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User avatar + account menu (not on the dashboard; see the header) */}
        {isFramed ? null : (
        <div className="relative ml-1" ref={accountMenuRef}>
          <button
            onClick={() => setIsAccountMenuOpen((open) => !open)}
            className="w-[30px] h-[30px] rounded-full bg-accent-dim flex items-center justify-center cursor-pointer select-none ring-2 ring-surface shadow-sm overflow-hidden"
          >
            <img
              src={user?.avatar || 'https://i.pravatar.cc/150?u=default'}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </button>

          {isAccountMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-56 bg-surface border border-line rounded-xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center gap-3 p-3 border-b border-line-subtle">
                <img
                  src={user?.avatar || 'https://i.pravatar.cc/150?u=default'}
                  alt={user?.name || 'User'}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink truncate">{user?.name || 'User'}</div>
                  <div className="text-[11px] text-ink-muted truncate">{user?.email || 'My Workspace'}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  navigate('/account-settings');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-ink-muted hover:text-ink hover:bg-subtle transition-all cursor-pointer"
              >
                <Sliders className="w-[15px] h-[15px]" />
                Settings
              </button>
              <button
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-ink-muted hover:text-ink hover:bg-subtle transition-all cursor-pointer"
              >
                <UserIcon className="w-[15px] h-[15px]" />
                My Profile
              </button>
              <button
                onClick={() => {
                  setIsAccountMenuOpen(false);
                  dispatch(logout());
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-ink-muted hover:text-danger hover:bg-danger-dim transition-all border-t border-line-subtle cursor-pointer"
              >
                <LogOut className="w-[15px] h-[15px]" />
                Sign out
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </header>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 hover:text-ink hover:bg-subtle rounded-lg transition-all border border-transparent hover:border-line-subtle">
      {icon}
    </button>
  );
}
