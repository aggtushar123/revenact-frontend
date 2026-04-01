import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';

export function AdvanceDashboard() {
  const location = useLocation();

  if (location.pathname === '/dashboard/advance') {
    return <Navigate to="ai-trending" replace />;
  }

  const tabs = [
    { label: 'Health Overview(TT)', path: 'health' },
    { label: 'Usage Overview(TT)', path: 'usage' },
    { label: 'Revenue Forecast (TT)', path: 'revenue' },
    { label: 'AI Trending Topics Analysis', path: 'ai-trending' },
    { label: 'Activity Tracking', path: 'activity' },
    { label: 'Ticket Overview', path: 'ticket' },
    { label: 'Customer Overview', path: 'customer' },
    { label: 'Product Usage', path: 'product' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
      {/* Top Tabs Bar */}
      <div className="bg-white border-b border-gray-200 px-6 shrink-0 flex items-center overflow-x-auto scrollbar-none shadow-sm relative z-10">
        <div className="flex items-center gap-1.5 min-w-max h-[44px]">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `
                relative h-full flex items-center px-4 pt-1 border-b-[3px] text-[13px] font-bold transition-all whitespace-nowrap
                ${isActive 
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {tab.label}
              {/* Optional tooltip on hover (as shown in screenshot) */}
              {tab.path === 'ai-trending' && (
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none transition-opacity">
                   AI Trending Topics Analysis
                 </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto w-full p-4 relative bg-[#f8fafc]">
        <Outlet />
      </div>
    </div>
  );
}
