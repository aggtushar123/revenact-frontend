import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, MessageSquare, Network, Layers, Users, 
  Target, Globe, PieChart, GitBranch, List, ChevronDown, GitCommit,
  Columns, PenTool, Box, CircleDot, HeartPulse, UserCog, Plug
} from 'lucide-react';

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const isOrgsActive = location.pathname.includes('/organizations');

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`h-full border-r border-gray-200 bg-white flex flex-col transition-all duration-300 z-30 shrink-0 absolute md:relative ${
        isExpanded ? 'w-[240px] shadow-xl md:shadow-none' : 'w-[68px]'
      }`}
    >
      {/* Header section with Logo and Pin */}
      <div className={`flex items-center h-[60px] px-4 ${isExpanded ? 'justify-between' : 'justify-center'} border-b border-transparent shrink-0 mt-2`}>
        <div className="flex items-center gap-2.5 overflow-hidden cursor-pointer">
          {/* Velaris Logo Mock */}
          <div className="w-7 h-7 shrink-0 flex items-center justify-center relative">
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
              <path d="M12 22L2 6H22L12 22Z" fill="#3B82F6" opacity="0.9" />
              <path d="M2 6L12 12L22 6Z" fill="#EF4444" opacity="0.9" />
              <path d="M2 6L12 12V22L2 6Z" fill="#8B5CF6" opacity="0.8" />
            </svg>
          </div>
          {isExpanded && (
            <span className="font-semibold text-[22px] tracking-tight text-[#111827]">
              velaris
            </span>
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
        <NavItem to="/scenarios" icon={<GitBranch className="w-[18px] h-[18px]" />} label="Scenarios" isExpanded={isExpanded} />
        <NavItem to="/surveys" icon={<List className="w-[18px] h-[18px]" />} label="Surveys" isExpanded={isExpanded} />
        <NavItem to="/campaigns" icon={<Columns className="w-[18px] h-[18px]" />} label="Campaigns" isExpanded={isExpanded} />
        <NavItem to="/canvas" icon={<PenTool className="w-[18px] h-[18px]" />} label="Canvas" isExpanded={isExpanded} />

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
      <div className={`mt-auto border-t border-gray-100 p-4 flex ${isExpanded ? 'items-center gap-3' : 'justify-center'} cursor-pointer hover:bg-gray-50 transition-colors shrink-0`}>
        <img 
           src="https://i.pravatar.cc/150?u=daniel" 
           alt="Daniel Trial Test" 
           className="w-[34px] h-[34px] rounded-full object-cover shrink-0 shadow-sm"
        />
        {isExpanded && (
          <div className="flex flex-col overflow-hidden justify-center">
            <span className="text-[13px] font-bold text-gray-800 truncate leading-tight mt-0.5">Daniel Trial Test</span>
            <span className="text-[11px] text-gray-500 truncate leading-tight">My Workspace</span>
          </div>
        )}
      </div>

    </aside>
  );
}

function NavItem({ icon, to, label, isExpanded, isActiveOverride = false }: { icon: React.ReactNode, to: string, label: string, isExpanded: boolean, isActiveOverride?: boolean }) {
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
              <span className={`text-[13px] font-semibold truncate transition-colors ${active ? 'text-rose-500' : 'text-gray-600 group-hover:text-gray-900'}`}>
                {label}
              </span>
            )}
            
            {/* Soft left accent indicating selection optionally */}
          </>
        );
      }}
    </NavLink>
  );
}
