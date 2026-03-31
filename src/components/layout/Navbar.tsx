import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TABLE_DATA } from '../organizations/tableData';
import { ACCOUNTS_DATA } from '../organizations/accountsData';
import { 
  ChevronLeft, 
  ChevronDown, 
  Search, 
  PlusCircle, 
  HelpCircle, 
  Bell, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detect organization details path
  const orgDetailMatch = location.pathname.match(/\/organizations\/(\d+)/);
  const orgId = orgDetailMatch ? parseInt(orgDetailMatch[1], 10) : null;
  const organization = orgId ? TABLE_DATA.find(o => o.id === orgId) : null;

  // Detect account details path
  const accountMatch = location.pathname.match(/\/accounts\/([^/]+)/);
  const accountId = accountMatch ? accountMatch[1] : null;
  const account = accountId ? ACCOUNTS_DATA.find(a => a.id === accountId) : null;

  const isOrganizations = location.pathname.startsWith('/organizations');
  const isCopilot = location.pathname === '/copilot';
  const isSettings = location.pathname.startsWith('/settings');
  const isPipelines = location.pathname.startsWith('/pipelines');

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
    <header className="h-[64px] border-b border-gray-100 bg-white flex items-center justify-between px-6 shrink-0 z-20 transition-all duration-300 shadow-sm">
      <div className="flex items-center gap-8 h-full">
        {isCopilot ? (
          <div className="flex flex-col">
            <span className="text-[12.5px] font-medium text-gray-500 tracking-wide mt-1">{formattedDate}</span>
            <h1 className="text-[20px] font-bold text-gray-900 tracking-tight leading-tight -mt-0.5">{greeting}, Daniel</h1>
          </div>
        ) : account ? (
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                 <div className="w-[36px] h-[36px] flex items-center justify-center p-1 bg-white rounded-full border border-gray-100 shadow-sm overflow-hidden shrink-0">
                    <img src={account.logo} alt={account.name} className="w-full h-full object-contain" />
                 </div>
                 <div className="flex items-center gap-3">
                    <h1 className="text-[16px] font-bold text-gray-900 tracking-tight uppercase whitespace-nowrap">{account.name}</h1>
                    <div className="w-px h-3.5 bg-gray-200" />
                    <span className="text-[13.5px] font-bold text-gray-400 tracking-widest uppercase truncate max-w-[140px]">{account.orgName}</span>
                 </div>
              </div>
          </div>
        ) : organization ? (
          <div className="flex items-center gap-4">
             <button 
                onClick={() => navigate('/organizations/list')}
                className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600 border border-transparent hover:border-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                 <div className="w-[36px] h-[36px] flex items-center justify-center p-1 bg-white rounded-full border border-gray-100 shadow-sm overflow-hidden shrink-0">
                    <img src={organization.logo} alt={organization.org} className="w-full h-full object-contain mix-blend-multiply" />
                 </div>
                 <h1 className="text-[16px] font-bold text-gray-900 tracking-tight uppercase">{organization.org}</h1>
              </div>
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
        ) : isPipelines ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-gray-800 tracking-tight">Pipelines</h1>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 stroke-[2.5px] mt-[1px]" />
            </div>

            <nav className="flex items-center gap-8 h-full mt-0.5 ml-2">
              <NavLink
                to="/pipelines/list"
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-indigo-500 text-indigo-500 opacity-90' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                List
              </NavLink>
              <NavLink
                to="/pipelines/board"
                className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13px] px-1 pt-1 transition-colors ${isActive ? 'border-indigo-500 text-indigo-500 opacity-90' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                Board
              </NavLink>
            </nav>
          </>
        ) : isSettings ? (
          <>
            <div className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 py-1.5 px-2 -ml-2 rounded-md transition-colors">
              <h1 className="text-[17px] font-bold text-gray-800 tracking-tight">Settings</h1>
              <ChevronDown className="w-3.5 h-3.5 text-gray-600 stroke-[2.5px] mt-[1px]" />
            </div>
            
            <nav className="flex items-center gap-6 h-full mt-0.5 ml-2 overflow-x-auto scrollbar-none max-w-[60vw]">
              {[
                { name: 'Data', path: '/settings/data' },
                { name: 'Currency', path: '/settings/currency' },
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
                  className={({ isActive }) => `h-full flex items-center border-b-[3px] font-bold text-[13.5px] px-1 pt-1 transition-all whitespace-nowrap ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                  {tab.name}
                </NavLink>
              ))}
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
        <button 
          onClick={() => navigate('/copilot')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff5f6d] to-[#ffc371] text-white text-[12px] font-bold shadow-md shadow-orange-100 hover:scale-105 transition-all transform active:scale-95 border border-white/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="mt-[1px]">AI Copilot</span>
        </button>
        
        <div className="flex items-center gap-1.5 text-gray-400 ml-1">
          <IconButton icon={<Search className="w-4 h-4" />} />
          <IconButton icon={<PlusCircle className="w-4 h-4" />} />
          <IconButton icon={<HelpCircle className="w-4 h-4" />} />
          <IconButton icon={<MessageSquare className="w-4 h-4" />} />
          
          <div className="relative">
             <IconButton icon={<Bell className="w-4 h-4" />} />
             <span className="absolute -top-1 -right-0.5 min-w-[15px] h-[15px] bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold rounded-full px-0.5 border-2 border-white shadow-sm">25</span>
          </div>
        </div>
        
        {/* User avatar */}
        <div className="w-[30px] h-[30px] rounded-full bg-indigo-100 flex items-center justify-center ml-1 cursor-pointer select-none ring-2 ring-white shadow-sm overflow-hidden">
           <img src="https://i.pravatar.cc/150?u=Daniel" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-1.5 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all border border-transparent hover:border-gray-100">
      {icon}
    </button>
  );
}
