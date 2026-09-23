import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bot, Box, Boxes, Brain, CheckSquare, CircleDot, Columns, Flag, GitBranch, GitCommit, Globe, HeartPulse, Layers, LayoutGrid, Lightbulb, List, LogOut, MessageSquareWarning, Network, PenTool, PieChart, Plug, Radar, Sliders, Sparkles, Target, UserCog, Users, Wand2 } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchProposals } from '../../features/proposals/proposalsSlice';
import { fetchCustomObjectDefinitions } from '../../features/customObjects/customObjectsApi';
import type { CustomObjectDefinition } from '../../features/customObjects/types';
import { logout } from '../../features/auth/authSlice';
import { SourcesGroup } from './SourcesGroup';
import { useHoverLabel } from './useHoverLabel';

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

  // The org's own real custom object types (Settings > Custom Objects)
  // — replaces the single hardcoded "SFDC Opportunity Line Item" nav
  // item this section used to have, which linked to a dead /sfdc route
  // with nothing behind it. Fetched once (not per accordion toggle —
  // there's no accordion behavior wired to that chevron yet, same as
  // before) rather than kept in Redux: the sidebar is the second place
  // that needs this list (after Settings' own page), still not enough
  // call sites to justify a shared slice over a plain fetch.
  const [customObjects, setCustomObjects] = useState<CustomObjectDefinition[]>([]);
  const accountRef = useRef<HTMLButtonElement>(null);
  const account = useHoverLabel(accountRef, currentUser?.name || 'Your account');

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
      className="h-full w-[72px] border-r border-[var(--rv-sidebar-border)] bg-[var(--rv-sidebar-bg)] flex flex-col z-30 shrink-0 absolute md:relative"
    >
      {/* Header section with Logo */}
      <div className="flex items-center justify-center h-[60px] shrink-0 mt-3 mb-6">
        <div className="w-8 h-8 shrink-0 bg-brand rounded-[8px] shadow-sm flex items-center justify-center text-white font-extrabold text-[16px] tracking-tighter" aria-label="Revenact">
          R
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 flex flex-col items-center gap-1 px-2">
        
        {/* Top Links */}
        <NavItem to="/copilot" icon={<Sparkles className="w-5 h-5" />} label="Copilot" />
        <NavItem to="/dashboard" icon={<LayoutGrid className="w-5 h-5" />} label="Dashboard" />
        <SourcesGroup />

        {/* ENTITIES Section */}
        <div className="h-px bg-line my-2 w-8" role="separator"></div>
        
        <NavItem to="/organizations/list" icon={<Network className="w-5 h-5" />} label="Organizations" isActiveOverride={isOrgsActive} />
        <NavItem to="/accounts" icon={<Layers className="w-5 h-5" />} label="Accounts" />
        <NavItem to="/contacts" icon={<Users className="w-5 h-5" />} label="Contacts" />
        <NavItem to="/pipelines" icon={<Target className="w-5 h-5" />} label="Pipelines" />

        {/* CUSTOM OBJECTS Section */}
        <div className="h-px bg-line my-2 w-8" role="separator"></div>

        {customObjects.map((definition) => (
          <NavItem
            key={definition.id}
            to={`/custom-objects/${definition.id}`}
            icon={<Boxes className="w-5 h-5" />}
            label={definition.name}
           
          />
        ))}
        <NavItem to="/feedbacks" icon={<Globe className="w-5 h-5" />} label="Product Feedbacks" />

        {/* TOOLS Section */}
        <div className="h-px bg-line my-2 w-8" role="separator"></div>

        <NavItem to="/segments" icon={<PieChart className="w-5 h-5" />} label="Segments" />
        <NavItem to="/projects" icon={<GitCommit className="w-5 h-5" />} label="Project Management" />
        <NavItem to="/scenarios" icon={<GitBranch className="w-5 h-5" />} label="Scenarios" />
        <NavItem to="/surveys" icon={<List className="w-5 h-5" />} label="Surveys" />
        <NavItem to="/campaigns" icon={<Columns className="w-5 h-5" />} label="Campaigns" />
        <NavItem to="/canvas" icon={<PenTool className="w-5 h-5" />} label="Canvas" />

        {/* KNOWLEDGE BRAIN Section — organisation-wide figures and the
            agents that act on them. Hidden, not greyed, for anyone whose
            role cannot load any of it (view_all_accounts). */}
        {canSeeAll && (
          <>
          {/* KNOWLEDGE BRAIN Section */}
          <div className="h-px bg-line my-2 w-8" role="separator"></div>

          <NavItem to="/brain/dashboard" icon={<Brain className="w-5 h-5" />} label="Brain Overview" />
          <NavItem to="/brain/graph" icon={<Network className="w-5 h-5" />} label="Knowledge Graph" />
          <NavItem to="/brain/initiatives" icon={<Flag className="w-5 h-5" />} label="Initiatives" />
          <NavItem to="/brain/requests" icon={<Lightbulb className="w-5 h-5" />} label="Feature Requests" />
          <NavItem to="/brain/anomalies" icon={<Radar className="w-5 h-5" />} label="Anomalies" />
          <NavItem to="/brain/review" icon={<CheckSquare className="w-5 h-5" />} label="Review Queue" badge={pendingProposals} />
          <NavItem to="/brain/feedback" icon={<MessageSquareWarning className="w-5 h-5" />} label="Feedback Log" />
          <NavItem to="/brain/agents" icon={<Bot className="w-5 h-5" />} label="Agents" />
          <NavItem to="/brain/skills" icon={<Wand2 className="w-5 h-5" />} label="Skills" />

          </>
        )}

        {/* SETUP Section */}
        <div className="h-px bg-line my-2 w-8" role="separator"></div>

        <NavItem to="/settings" icon={<Box className="w-5 h-5" />} label="Settings" isActiveOverride={isSettingsActive} />
        <NavItem to="/lifecycle" icon={<CircleDot className="w-5 h-5" />} label="Lifecycle" />
        <NavItem to="/health" icon={<HeartPulse className="w-5 h-5" />} label="Health" />
        {canManageUsers && (
          <NavItem to="/users" icon={<UserCog className="w-5 h-5" />} label="Users" />
        )}
        <NavItem to="/integrations" icon={<Plug className="w-5 h-5" />} label="Integrations" />

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
          ref={accountRef}
          {...account.handlers}
          type="button"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          aria-label={currentUser?.name ? `${currentUser.name} — account settings` : 'Account settings'}
          className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-subtle transition-all cursor-pointer select-none"
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

        </button>
        {account.node}
      </div>
    </aside>
  );
}

function NavItem({ icon, to, label, isActiveOverride = false, badge }: { icon: React.ReactNode, to: string, label: string, isActiveOverride?: boolean, badge?: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const hover = useHoverLabel(ref, label);
  return (
    <>
      <NavLink
        ref={ref}
        {...hover.handlers}
        to={to}
        aria-label={label}
        className={({ isActive }) => {
          const active = isActive || isActiveOverride;
          return `relative w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-colors group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            active
              ? 'bg-[var(--rv-sidebar-active-bg)] border border-[var(--rv-sidebar-active-border)] shadow-xs text-ink'
              : 'border border-transparent text-ink-muted hover:text-ink hover:bg-black/5 dark:hover:bg-white/[0.06]'
          }`;
        }}
      >
        <span className="shrink-0 [&>svg]:w-5 [&>svg]:h-5" aria-hidden="true">{icon}</span>
        {badge !== undefined && badge > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-warning text-on-accent font-mono-brand text-[9.5px] font-bold leading-4 text-center" aria-label={`${badge} pending`}>
            {badge}
          </span>
        ) : null}
      </NavLink>
      {hover.node}
    </>
  );
}
