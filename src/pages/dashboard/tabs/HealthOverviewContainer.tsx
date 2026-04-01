import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';

export function HealthOverviewContainer() {
  const location = useLocation();

  if (location.pathname === '/dashboard/advance/health') {
    return <Navigate to="controls" replace />;
  }

  const subtabs = [
    { label: 'Controls', path: 'controls' },
    { label: 'Renewal Date All', path: 'renewal-date' },
    { label: 'Primary Owner All', path: 'primary-owner' },
    { label: 'Lifecycle Stage All', path: 'lifecycle-stage' },
    { label: 'Account All', path: 'account' },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Sub-navigation bar mimicking former filter bar */}
      <div className="flex items-center px-4 bg-white border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none shadow-[0_2px_4px_rgba(0,0,0,0.01)] mb-4 rounded-lg">
        <div className="flex items-center min-w-max h-[40px]">
          {subtabs.map((tab, idx) => (
            <div key={tab.path} className="flex items-center h-full">
              {idx > 0 && <div className="w-px h-3.5 mx-2 bg-gray-200" />}
              <NavLink
                to={tab.path}
                className={({ isActive }) => `
                  h-full flex items-center px-2 text-[12.5px] font-bold transition-all whitespace-nowrap border-b-[2px]
                  ${isActive 
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                  }
                `}
              >
                {tab.label}
              </NavLink>
            </div>
          ))}
        </div>
      </div>

      {/* Renders ControlsView or PlaceholderView for Health */}
      <div className="flex-1 w-full h-full">
        <Outlet />
      </div>
    </div>
  );
}
