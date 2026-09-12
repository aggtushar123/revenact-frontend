import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ACCOUNTS_DATA } from '../organizations/accountsData';
import type { AccountRow } from '../organizations/accountsData';
import { mapCustomerToOrgRow } from '../../features/customers/mapToOrgRow';
import { companyLabel, formatRelativeTime } from '../../features/customers/formatters';
import { EntityAvatar } from '../shared';
import {
  ChevronLeft,
  ChevronDown,
  Search,
  PlusCircle,
  HelpCircle,
  Bell,
  MessageSquare,
  Sparkles,
  User as UserIcon,
  LogOut,
  Check,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { logout } from '../../features/auth/authSlice';
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '../../features/notifications/notificationApi';
import { notificationRead, allRead } from '../../features/notifications/notificationsSlice';

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


  // Detect organization details path. Reads the same selectedCustomer that
  // Details.tsx's own fetchCustomerById() populates (see customersSlice.ts)
  // rather than fetching independently — Navbar and Details are mounted
  // together under DashboardLayout for this route, so one fetch backs
  // both. The id check guards the moment right after navigating from one
  // org's page to another's, before the new fetch has resolved.
  const orgDetailMatch = location.pathname.match(/\/organizations\/(\d+)/);
  const orgId = orgDetailMatch ? parseInt(orgDetailMatch[1], 10) : null;
  const selectedCustomer = useAppSelector((state) => state.customers.selectedCustomer);
  const organization =
    orgId && selectedCustomer?.id === orgId ? mapCustomerToOrgRow(selectedCustomer) : null;

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

  // Detect contact details path (/contacts/:id — not /contacts/list,
  // which \d+ already excludes). Same "read the same fetch the Details
  // page itself already made" reasoning as organization/account above —
  // pages/contacts/Details.tsx's own fetchContactById() populates this.
  const contactDetailMatch = location.pathname.match(/\/contacts\/(\d+)/);
  const contactId = contactDetailMatch ? parseInt(contactDetailMatch[1], 10) : null;
  const selectedContact = useAppSelector((state) => state.customers.selectedContact);
  const contact = contactId && selectedContact?.id === contactId ? selectedContact : null;

  const isOrganizations = location.pathname.startsWith('/organizations');
  // Only /accounts/list and /accounts/board — never /accounts/:id,
  // which the `account` branch above already claims first (checked
  // earlier in the render chain below), same "detail page own header
  // wins" ordering as isOrganizations vs. the `organization` branch.
  const isAccountsList = location.pathname.startsWith('/accounts');
  const isCopilot = location.pathname === '/copilot';
  const isSettings = location.pathname.startsWith('/settings');
  const isPipelines = location.pathname.startsWith('/pipelines');
  const isDashboard = location.pathname.startsWith('/dashboard');

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[currentDate.getDay()];
  const monthName = months[currentDate.getMonth()];
  const dateNum = currentDate.getDate();
  
  const getOrdinalNum = (n: number) => {
    return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
  };

  const formattedDate = `${dayName}, ${getOrdinalNum(dateNum)} ${monthName}`;

  const hour = currentDate.getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 18) greeting = 'Good Afternoon';

  return (
    <header className="h-[64px] border-b border-line-subtle bg-surface flex items-center justify-between px-6 shrink-0 z-20 transition-all duration-300 shadow-sm">
      <div className="flex items-center gap-8 h-full">
        {isCopilot ? (
          <div className="flex flex-col">
            <span className="text-[12.5px] font-medium text-ink-muted tracking-wide mt-1">{formattedDate}</span>
            <h1 className="text-[20px] font-bold text-ink tracking-tight leading-tight -mt-0.5">
              {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
          </div>
        ) : account ? (
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
        ) : contact ? (
          <div className="flex items-center gap-4">
             <button
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-subtle rounded-lg transition-colors text-ink-faint hover:text-accent border border-transparent hover:border-line-subtle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                 <EntityAvatar
                    name={contact.name}
                    className="w-[36px] h-[36px] rounded-full border border-line-subtle shadow-sm"
                 />
                 <div className="flex items-center gap-3">
                    <h1 className="text-[16px] font-bold text-ink tracking-tight uppercase whitespace-nowrap">{contact.name}</h1>
                    <div className="w-px h-3.5 bg-line" />
                    <span className="text-[13.5px] font-bold text-ink-faint tracking-widest uppercase truncate max-w-[140px]">{companyLabel(contact.companies)}</span>
                 </div>
              </div>
          </div>
        ) : organization ? (
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate('/organizations/list')}
                className="p-1.5 hover:bg-subtle rounded-lg transition-colors text-ink-faint hover:text-accent border border-transparent hover:border-line-subtle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                 <EntityAvatar
                    name={organization.org}
                    logoUrl={organization.logo}
                    className="w-[36px] h-[36px] rounded-full border border-line-subtle shadow-sm"
                 />
                 <h1 className="text-[16px] font-bold text-ink tracking-tight uppercase">{organization.org}</h1>
              </div>
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
                { name: 'AI Agent', path: '/settings/ai-agent' }
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
            
            <div className="flex items-center p-1 rounded-lg">
              <NavLink
                to="/dashboard/advance"
                className={({ isActive }) => `text-[13px] font-bold px-3 py-1.5 rounded-md transition-colors ${isActive ? 'text-accent bg-accent-dim shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-accent/30' : 'text-ink-muted hover:text-ink hover:bg-subtle'}`}
              >
                Advance Dashboards
              </NavLink>
              <NavLink
                to="/dashboard/custom"
                className={({ isActive }) => `text-[13px] font-bold px-3 py-1.5 flex items-center gap-2 rounded-md transition-colors ${isActive ? 'text-accent bg-accent-dim shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-accent/30' : 'text-ink-muted hover:text-ink hover:bg-subtle'}`}
              >
                Custom Dashboard
                <span className="text-[9px] uppercase font-bold tracking-widest bg-warning-dim text-warning px-1 py-0.5 rounded shadow-sm">beta</span>
              </NavLink>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1.5 px-2 -ml-2 rounded-md">
            <h1 className="text-[17px] font-bold text-ink tracking-tight capitalize">
               {location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Right side actions */}
        <button
          onClick={() => navigate('/copilot')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-[#0D0F0E] text-[12px] font-bold shadow-md hover:scale-105 transition-all transform active:scale-95 border border-accent-hover/40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="mt-[1px]">AI Copilot</span>
        </button>

        <div className="flex items-center gap-1.5 text-ink-faint ml-1">
          <IconButton icon={<Search className="w-4 h-4" />} />
          <IconButton icon={<PlusCircle className="w-4 h-4" />} />
          <IconButton icon={<HelpCircle className="w-4 h-4" />} />
          <IconButton icon={<MessageSquare className="w-4 h-4" />} />

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen((open) => !open)}
              aria-label="Notifications"
              className="p-1.5 hover:text-ink hover:bg-subtle rounded-lg transition-all border border-transparent hover:border-line-subtle"
            >
              <Bell className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-0.5 min-w-[15px] h-[15px] bg-accent text-[#0D0F0E] flex items-center justify-center text-[9px] font-bold rounded-full px-0.5 border-2 border-surface shadow-sm">
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

        {/* User avatar + account menu */}
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
