import { useState, useEffect } from 'react';
import { ChevronDown, Search, PlusCircle, HelpCircle, Bell, RotateCw, MessageSquare } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isOrganizations = location.pathname.startsWith('/organizations');
  const isCopilot = location.pathname === '/copilot';

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
    <header className="h-[64px] border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 transition-all duration-300">
      <div className="flex items-center gap-8 h-full">
        {isCopilot ? (
          <div className="flex flex-col">
            <span className="text-[12.5px] font-medium text-gray-500 tracking-wide mt-1">{formattedDate}</span>
            <h1 className="text-[20px] font-bold text-gray-900 tracking-tight leading-tight -mt-0.5">{greeting}, Daniel</h1>
          </div>
        ) : isOrganizations ? (
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
        {!isCopilot && (
          <button 
            onClick={() => navigate('/copilot')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 hover:bg-indigo-50 text-gray-700 text-[13px] font-semibold transition-all shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] text-[#fb7185] fill-current"><path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
            <span className="mt-[1px]">AI Copilot</span>
          </button>
        )}
        
        <div className="flex items-center gap-[6px] text-gray-500 ml-1">
          {isCopilot && (
            <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
              <RotateCw className="w-5 h-5 stroke-[1.5px]" />
            </button>
          )}
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
            <Search className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
            <PlusCircle className="w-5 h-5 stroke-[1.5px]" />
          </button>
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
             <HelpCircle className="w-5 h-5 stroke-[1.5px]" />
          </button>
          {isCopilot && (
            <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
               <MessageSquare className="w-5 h-5 stroke-[1.5px]" />
            </button>
          )}
          <button className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 stroke-[1.5px]" />
            {isCopilot ? (
              <span className="absolute top-[2px] right-[2px] min-w-[14px] h-[14px] bg-[#5850ec] text-white flex items-center justify-center text-[8px] font-bold rounded-full px-0.5 border border-white">27</span>
            ) : (
              <span className="absolute top-[8px] right-[8px] w-2 h-2 bg-indigo-500 border-2 border-white rounded-full"></span>
            )}
          </button>
        </div>
        
        {/* User avatar */}
        <div className="w-[28px] h-[28px] rounded-full bg-indigo-500 flex items-center justify-center ml-1 cursor-pointer select-none ring-[1.5px] ring-white shadow-sm overflow-hidden">
          <svg viewBox="0 0 24 24" fill="none" className="w-[18px] h-[18px] stroke-white stroke-2 mt-1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      </div>
    </header>
  );
}
