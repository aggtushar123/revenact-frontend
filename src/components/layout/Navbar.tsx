import { ChevronDown, Search, PlusCircle, HelpCircle, Bell } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const isOrganizations = location.pathname.startsWith('/organizations');

  return (
    <header className="h-[64px] border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 transition-all duration-300">
      <div className="flex items-center gap-8 h-full">
        {isOrganizations ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-gray-800 tracking-tight">Organizations</h1>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 stroke-[2.5px] mt-[1px]" />
            </div>
            
            <nav className="flex items-center gap-8 h-full mt-0.5 ml-2">
              <NavLink 
                to="/organizations/list" 
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-indigo-500 text-indigo-500 opacity-90' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                List
              </NavLink>
              <NavLink 
                to="/organizations/board" 
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-indigo-500 text-indigo-500 opacity-90' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                Board
              </NavLink>
            </nav>
          </>
        ) : (
          <div className="flex items-center gap-2 py-1.5 px-2 -ml-2 rounded-md">
            <h1 className="text-[17px] font-bold text-gray-800 tracking-tight capitalize">
               {location.pathname.split('/')[1] || 'Dashboard'}
            </h1>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Right side actions */}
        <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 hover:bg-indigo-50 text-gray-700 text-[13px] font-semibold transition-all shadow-sm">
          <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] text-[#fb7185] fill-current"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
          <span className="mt-[1px]">AI Copilot</span>
        </button>
        
        <div className="flex items-center gap-[6px] text-gray-500 ml-1">
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
            <Search className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
            <PlusCircle className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
             <HelpCircle className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 stroke-[1.5px]" />
            <span className="absolute top-[8px] right-[8px] w-2 h-2 bg-indigo-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
        
        {/* User avatar */}
        <div className="w-[28px] h-[28px] rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] ml-1 cursor-pointer select-none ring-[1.5px] ring-white shadow-sm">
          TA
        </div>
      </div>
    </header>
  );
}
