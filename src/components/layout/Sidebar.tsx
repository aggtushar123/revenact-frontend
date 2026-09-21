import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, MessageSquare, Network, Layers, Users,
  Target, Globe, PieChart, GitBranch, List, ChevronDown, GitCommit,
  Columns, PenTool, Box, Boxes, CircleDot, HeartPulse, UserCog, Plug,
  Brain, Flag, CheckSquare, MessageSquareWarning, Bot, Wand2,
  Sliders, LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchProposals } from '../../features/proposals/proposalsSlice';
import { fetchCustomObjectDefinitions } from '../../features/customObjects/customObjectsApi';
import type { CustomObjectDefinition } from '../../features/customObjects/types';
import { logout } from '../../features/auth/authSlice';

export function Sidebar() {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.auth.user);
  const pendingProposals = useAppSelector((state) => state.proposals?.pending ?? 0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // The badge is the real queue, so it needs the queue loaded on any page —
  // a paid model call is never made here, only a read; and only for those
  // who could open the queue at all.
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  useEffect(() => {
    if (canSeeAll) dispatch(fetchProposals());
  }, [dispatch, canSeeAll]);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const isOrgsActive = location.pathname.includes('/organizations');
  const isSettingsActive = location.pathname.startsWith('/settings');
  // The Users link gates on the capability its page actually needs, not
  // on holding a role called "admin" — an org can define any role it
  // likes now, including one that grants exactly this and nothing else.
  const canManageUsers = useCapability('manage_users');
  const isStaff = useAppSelector((state) => state.auth.user?.is_superuser === true);

  // The org's own real custom object types (Settings > Custom Objects)
  // — replaces the single hardcoded "SFDC Opportunity Line Item" nav
  // item this section used to have, which linked to a dead /sfdc route
  // with nothing behind it. Fetched once (not per accordion toggle —
  // there's no accordion behavior wired to that chevron yet, same as
  // before) rather than kept in Redux: the sidebar is the second place
  // that needs this list (after Settings' own page), still not enough
  // call sites to justify a shared slice over a plain fetch.
  const [customObjects, setCustomObjects] = useState<CustomObjectDefinition[]>([]);

  useEffect(() => {
    fetchCustomObjectDefinitions()
      .then(setCustomObjects)
      .catch(() => {
        // A failed fetch just leaves this section showing no items —
        // not worth a blocking error in a sidebar.
      });
  }, []);

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`h-full border-r border-[var(--rv-sidebar-border)] bg-[var(--rv-sidebar-bg)] flex flex-col transition-all duration-300 z-30 shrink-0 absolute md:relative ${
        isExpanded ? 'w-[240px] shadow-xl md:shadow-none' : 'w-[68px]'
      }`}
    >
      {/* Header section with Logo */}
      <div className={`flex items-center h-[60px] px-5 ${isExpanded ? 'justify-start' : 'justify-center'} border-b border-transparent shrink-0 mt-3 mb-8`}>
        <div className="flex items-center cursor-pointer w-full">
          {/* Revenact Logo */}
          {isExpanded ? (
            <span className="font-display text-[22px] text-ink tracking-tight leading-none" style={{ fontStyle: 'italic' }}>Revenact</span>
          ) : (
            <div className="w-7 h-7 shrink-0 bg-brand rounded-[7px] shadow-sm flex items-center justify-center text-white font-extrabold text-[15px] tracking-tighter mx-auto">
              R
            </div>
          )}
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 flex flex-col gap-0.5 px-3">
        
        {/* Top Links */}
        <NavItem to="/dashboard" icon={<LayoutGrid className="w-[18px] h-[18px]" />} label="Dashboard" isExpanded={isExpanded} />
        <NavItem to="/communications" icon={<MessageSquare className="w-[18px] h-[18px]" />} label="Communications" isExpanded={isExpanded} />

        {/* ENTITIES Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-ink-faint mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            ENTITIES <div className="h-px bg-line flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-line mt-4 mb-2 mx-2"></div>
        )}
        
        <NavItem to="/organizations/list" icon={<Network className="w-[18px] h-[18px]" />} label="Organizations" isExpanded={isExpanded} isActiveOverride={isOrgsActive} />
        <NavItem to="/accounts" icon={<Layers className="w-[18px] h-[18px]" />} label="Accounts" isExpanded={isExpanded} />
        <NavItem to="/contacts" icon={<Users className="w-[18px] h-[18px]" />} label="Contacts" isExpanded={isExpanded} />
        <NavItem to="/pipelines" icon={<Target className="w-[18px] h-[18px]" />} label="Pipelines" isExpanded={isExpanded} />

        {/* CUSTOM OBJECTS Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-ink-faint mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-1.5 cursor-pointer hover:text-ink-muted">
            CUSTOM OBJECTS <ChevronDown className="w-3 h-3 ml-0.5" /> <div className="h-px bg-line flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-line mt-4 mb-2 mx-2"></div>
        )}

        {customObjects.map((definition) => (
          <NavItem
            key={definition.id}
            to={`/custom-objects/${definition.id}`}
            icon={<Boxes className="w-[18px] h-[18px]" />}
            label={definition.name}
            isExpanded={isExpanded}
          />
        ))}
        <NavItem to="/feedbacks" icon={<Globe className="w-[18px] h-[18px]" />} label="Product Feedbacks" isExpanded={isExpanded} />

        {/* TOOLS Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-ink-faint mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            TOOLS <div className="h-px bg-line flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-line mt-4 mb-2 mx-2"></div>
        )}

        <NavItem to="/segments" icon={<PieChart className="w-[18px] h-[18px]" />} label="Segments" isExpanded={isExpanded} />
        <NavItem to="/projects" icon={<GitCommit className="w-[18px] h-[18px]" />} label="Project Management" isExpanded={isExpanded} />
        <NavItem to="/scenarios" icon={<GitBranch className="w-[18px] h-[18px]" />} label="Scenarios" isExpanded={isExpanded} />
        <NavItem to="/surveys" icon={<List className="w-[18px] h-[18px]" />} label="Surveys" isExpanded={isExpanded} />
        <NavItem to="/campaigns" icon={<Columns className="w-[18px] h-[18px]" />} label="Campaigns" isExpanded={isExpanded} />
        <NavItem to="/canvas" icon={<PenTool className="w-[18px] h-[18px]" />} label="Canvas" isExpanded={isExpanded} />

        {/* KNOWLEDGE BRAIN Section — organisation-wide figures and the
            agents that act on them. Hidden, not greyed, for anyone whose
            role cannot load any of it (view_all_accounts). */}
        {canSeeAll && (
          <>
          {/* KNOWLEDGE BRAIN Section */}
          {isExpanded ? (
            <div className="text-[10px] font-bold text-ink-faint mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
              KNOWLEDGE BRAIN <div className="h-px bg-line flex-1 ml-1 mr-2"></div>
            </div>
          ) : (
            <div className="h-px bg-line mt-4 mb-2 mx-2"></div>
          )}

          <NavItem to="/brain/dashboard" icon={<Brain className="w-[18px] h-[18px]" />} label="Brain Overview" isExpanded={isExpanded} />
          <NavItem to="/brain/graph" icon={<Network className="w-[18px] h-[18px]" />} label="Knowledge Graph" isExpanded={isExpanded} />
          <NavItem to="/brain/initiatives" icon={<Flag className="w-[18px] h-[18px]" />} label="Initiatives" isExpanded={isExpanded} />
          <NavItem to="/brain/review" icon={<CheckSquare className="w-[18px] h-[18px]" />} label="Review Queue" isExpanded={isExpanded} badge={pendingProposals} />
          <NavItem to="/brain/feedback" icon={<MessageSquareWarning className="w-[18px] h-[18px]" />} label="Feedback Log" isExpanded={isExpanded} />
          <NavItem to="/brain/agents" icon={<Bot className="w-[18px] h-[18px]" />} label="Agents" isExpanded={isExpanded} />
          <NavItem to="/brain/skills" icon={<Wand2 className="w-[18px] h-[18px]" />} label="Skills" isExpanded={isExpanded} />

          </>
        )}

        {/* SETUP Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-ink-faint mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            SETUP <div className="h-px bg-line flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-line mt-4 mb-2 mx-2"></div>
        )}

        <NavItem to="/settings" icon={<Box className="w-[18px] h-[18px]" />} label="Settings" isExpanded={isExpanded} isActiveOverride={isSettingsActive} />
        <NavItem to="/lifecycle" icon={<CircleDot className="w-[18px] h-[18px]" />} label="Lifecycle" isExpanded={isExpanded} />
        <NavItem to="/health" icon={<HeartPulse className="w-[18px] h-[18px]" />} label="Health" isExpanded={isExpanded} />
        {canManageUsers && (
          <NavItem to="/users" icon={<UserCog className="w-[18px] h-[18px]" />} label="Users" isExpanded={isExpanded} />
        )}
        <NavItem to="/integrations" icon={<Plug className="w-[18px] h-[18px]" />} label="Integrations" isExpanded={isExpanded} />
        {isStaff && (
          <NavItem to="/platform" icon={<ShieldCheck className="w-[18px] h-[18px]" />} label="Platform" isExpanded={isExpanded} />
        )}

      </div>

      {/* Bottom Avatar / Initials Icon (Purple circle 'T' with Account Settings & Sign Out) */}
      <div ref={userMenuRef} className="relative p-2 border-t border-line shrink-0 bg-surface">
        {isUserMenuOpen && (
          <div
            className="absolute bottom-[calc(100%+8px)] left-2 w-56 bg-surface border border-line rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="flex items-center gap-3 p-3 border-b border-line-subtle">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.name || 'User'}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs select-none">
                  {(currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || '?').toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-ink truncate">
                  {currentUser?.name || 'Your account'}
                </div>
                <div className="text-[11px] text-ink-muted truncate">
                  {currentUser?.email ?? ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                navigate('/account-settings');
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium transition-all cursor-pointer ${
                location.pathname.startsWith('/account-settings')
                  ? 'text-accent bg-accent-dim font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-subtle'
              }`}
            >
              <Sliders className="w-[15px] h-[15px]" />
              Settings
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
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

        <button
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          title={currentUser?.name ? `${currentUser.name} — account settings` : 'Account settings'}
          className={`w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-subtle transition-all cursor-pointer select-none ${
            !isExpanded ? 'justify-center' : ''
          }`}
        >
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-transparent hover:ring-accent/30 transition-all"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-xs hover:scale-105 transition-transform">
              {(currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || '?').toUpperCase()}
            </div>
          )}

          {isExpanded && (
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[13px] font-semibold text-ink truncate leading-tight">
                {currentUser?.name || 'Your account'}
              </div>
              <div className="text-[11px] text-ink-muted truncate leading-tight mt-0.5">
                Account Settings
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, to, label, isExpanded, isActiveOverride = false, badge }: { icon: React.ReactNode, to: string, label: string, isExpanded: boolean, isActiveOverride?: boolean, badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        const active = isActive || isActiveOverride;
        return `flex items-center gap-3.5 px-3 relative transition-colors group rounded-[6px] cursor-pointer overflow-hidden ${
          isExpanded ? 'h-[38px]' : 'h-10 justify-center mx-1 rounded-lg'
        } ${
          active
            ? 'bg-[var(--rv-sidebar-active-bg)] border border-[var(--rv-sidebar-active-border)] shadow-xs'
            : 'border border-transparent hover:bg-black/5 dark:hover:bg-white/[0.04]'
        }`;
      }}
      title={!isExpanded ? label : undefined}
    >
      {({ isActive }) => {
        const active = isActive || isActiveOverride;
        return (
          <>
            <div className={`shrink-0 transition-colors ${active ? 'text-ink' : 'text-ink-faint group-hover:text-ink-muted'}`}>
              {icon}
            </div>
            
            {isExpanded && (
              <span className={`text-[13px] font-semibold truncate transition-colors flex-1 ${active ? 'text-ink' : 'text-ink-muted group-hover:text-ink'}`}>
                {label}
              </span>
            )}

            {/* Badge */}
            {badge !== undefined && badge > 0 && isExpanded && (
              <span style={{ background: 'var(--warning)', color: '#ffffff', borderRadius: '3px', padding: '1px 5px', fontSize: '9px', fontFamily: "'DM Mono', monospace", fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>{badge}</span>
            )}
          </>
        );
      }}
    </NavLink>
  );
}
