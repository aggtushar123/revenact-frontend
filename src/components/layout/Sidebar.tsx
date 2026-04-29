import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { 
  LayoutGrid, MessageSquare, Network, Layers, Users, 
  Target, Globe, PieChart, GitBranch, List, ChevronDown, GitCommit,
  Columns, PenTool, Box, CircleDot, HeartPulse, UserCog, Plug, LogOut,
  Brain, GitMerge, BookOpen, CheckSquare, Zap
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { logout } from '../../features/auth/authSlice';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const isOrgsActive = location.pathname.includes('/organizations');
  const reviewCount = useAppSelector(s => s.brain.metrics.nodesPendingReview);

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`h-full border-r border-gray-200 bg-white flex flex-col transition-all duration-300 z-30 shrink-0 absolute md:relative ${
        isExpanded ? 'w-[240px] shadow-xl md:shadow-none' : 'w-[68px]'
      }`}
    >
      {/* Header section with Logo */}
      <div className={`flex items-center h-[60px] px-5 ${isExpanded ? 'justify-start' : 'justify-center'} border-b border-transparent shrink-0 mt-3 mb-8`}>
        <div className="flex items-center cursor-pointer w-full">
          {/* Revenact Logo */}
          {isExpanded ? (
            <img src={logoImg} alt="Revenact" className="w-[160px] max-w-full h-auto object-contain mix-blend-multiply" />
          ) : (
            <div className="w-7 h-7 shrink-0 bg-[#593d80] rounded-[7px] shadow-sm flex items-center justify-center text-white font-extrabold text-[15px] tracking-tighter mix-blend-multiply mx-auto">
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
          <div className="text-[10px] font-bold text-gray-400/80 mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            ENTITIES <div className="h-px bg-gray-100 flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-gray-100 mt-4 mb-2 mx-2"></div>
        )}
        
        <NavItem to="/organizations/list" icon={<Network className="w-[18px] h-[18px]" />} label="Organizations" isExpanded={isExpanded} isActiveOverride={isOrgsActive} />
        <NavItem to="/accounts" icon={<Layers className="w-[18px] h-[18px]" />} label="Accounts" isExpanded={isExpanded} />
        <NavItem to="/contacts" icon={<Users className="w-[18px] h-[18px]" />} label="Contacts" isExpanded={isExpanded} />
        <NavItem to="/pipelines" icon={<Target className="w-[18px] h-[18px]" />} label="Pipelines" isExpanded={isExpanded} />

        {/* CUSTOM OBJECTS Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-gray-400/80 mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-1.5 cursor-pointer hover:text-gray-600">
            CUSTOM OBJECTS <ChevronDown className="w-3 h-3 ml-0.5" /> <div className="h-px bg-gray-100 flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-gray-100 mt-4 mb-2 mx-2"></div>
        )}

        <NavItem 
          to="/sfdc" 
          icon={<div className="w-[18px] h-[18px] bg-gray-400 rounded-sm flex items-center justify-center text-white text-[10px] font-bold shadow-sm">S</div>} 
          label="SFDC Opportunity Line I..." 
          isExpanded={isExpanded} 
        />
        <NavItem to="/feedbacks" icon={<Globe className="w-[18px] h-[18px]" />} label="Product Feedbacks" isExpanded={isExpanded} />

        {/* TOOLS Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-gray-400/80 mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            TOOLS <div className="h-px bg-gray-100 flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-gray-100 mt-4 mb-2 mx-2"></div>
        )}

        <NavItem to="/segments" icon={<PieChart className="w-[18px] h-[18px]" />} label="Segments" isExpanded={isExpanded} />
        <NavItem to="/projects" icon={<GitCommit className="w-[18px] h-[18px]" />} label="Project Management" isExpanded={isExpanded} />
        <NavItem to="/scenarios/create" icon={<GitBranch className="w-[18px] h-[18px]" />} label="Scenarios" isExpanded={isExpanded} />
        <NavItem to="/surveys" icon={<List className="w-[18px] h-[18px]" />} label="Surveys" isExpanded={isExpanded} />
        <NavItem to="/campaigns" icon={<Columns className="w-[18px] h-[18px]" />} label="Campaigns" isExpanded={isExpanded} />
        <NavItem to="/canvas" icon={<PenTool className="w-[18px] h-[18px]" />} label="Canvas" isExpanded={isExpanded} />

        {/* KNOWLEDGE BRAIN Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-gray-400/80 mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            KNOWLEDGE BRAIN <div className="h-px bg-gray-100 flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-gray-100 mt-4 mb-2 mx-2"></div>
        )}

        <NavItem to="/brain/dashboard" icon={<Brain className="w-[18px] h-[18px]" />} label="Brain Overview" isExpanded={isExpanded} />
        <NavItem to="/brain/graph" icon={<GitMerge className="w-[18px] h-[18px]" />} label="Knowledge Graph" isExpanded={isExpanded} />
        <NavItem to="/brain/nodes" icon={<Network className="w-[18px] h-[18px]" />} label="Nodes" isExpanded={isExpanded} badge={reviewCount} />
        <NavItem to="/brain/skills" icon={<BookOpen className="w-[18px] h-[18px]" />} label="Skills" isExpanded={isExpanded} />
        <NavItem to="/brain/connectors" icon={<Plug className="w-[18px] h-[18px]" />} label="Connectors" isExpanded={isExpanded} />
        <NavItem to="/brain/review" icon={<CheckSquare className="w-[18px] h-[18px]" />} label="Review Queue" isExpanded={isExpanded} badge={reviewCount} />
        <NavItem to="/brain/feedback" icon={<Zap className="w-[18px] h-[18px]" />} label="Feedback" isExpanded={isExpanded} />

        {/* SETUP Section */}
        {isExpanded ? (
          <div className="text-[10px] font-bold text-gray-400/80 mt-5 mb-1.5 ml-3 tracking-[0.1em] flex items-center gap-3">
            SETUP <div className="h-px bg-gray-100 flex-1 ml-1 mr-2"></div>
          </div>
        ) : (
          <div className="h-px bg-gray-100 mt-4 mb-2 mx-2"></div>
        )}

        <NavItem to="/settings" icon={<Box className="w-[18px] h-[18px]" />} label="Settings" isExpanded={isExpanded} />
        <NavItem to="/lifecycle" icon={<CircleDot className="w-[18px] h-[18px]" />} label="Lifecycle" isExpanded={isExpanded} />
        <NavItem to="/health" icon={<HeartPulse className="w-[18px] h-[18px]" />} label="Health" isExpanded={isExpanded} />
        <NavItem to="/users" icon={<UserCog className="w-[18px] h-[18px]" />} label="Users" isExpanded={isExpanded} />
        <NavItem to="/integrations" icon={<Plug className="w-[18px] h-[18px]" />} label="Integrations" isExpanded={isExpanded} />

      </div>

      {/* User Footer */}
      <div className={`mt-auto border-t border-gray-100 shrink-0`}>
        <div className={`p-4 flex ${isExpanded ? 'items-center gap-3' : 'justify-center'} cursor-pointer hover:bg-gray-50 transition-colors`}>
          <img 
             src={user?.avatar || 'https://i.pravatar.cc/150?u=default'} 
             alt={user?.name || 'User'} 
             className="w-[34px] h-[34px] rounded-full object-cover shrink-0 shadow-sm"
          />
          {isExpanded && (
            <div className="flex flex-col overflow-hidden justify-center flex-1">
              <span className="text-[13px] font-bold text-gray-800 truncate leading-tight mt-0.5">{user?.name || 'User'}</span>
              <span className="text-[11px] text-gray-500 truncate leading-tight">{user?.email || 'My Workspace'}</span>
            </div>
          )}
        </div>
        {isExpanded && (
          <button
            onClick={() => { dispatch(logout()); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/60 transition-all border-t border-gray-100 cursor-pointer"
          >
            <LogOut className="w-[15px] h-[15px]" />
            Sign out
          </button>
        )}
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
            ? 'bg-rose-50/80' 
            : 'hover:bg-gray-50'
        }`;
      }}
      title={!isExpanded ? label : undefined}
    >
      {({ isActive }) => {
        const active = isActive || isActiveOverride;
        return (
          <>
            <div className={`shrink-0 transition-colors ${active ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
              {icon}
            </div>
            
            {isExpanded && (
              <span className={`text-[13px] font-semibold truncate transition-colors flex-1 ${active ? 'text-rose-500' : 'text-gray-600 group-hover:text-gray-900'}`}>
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
