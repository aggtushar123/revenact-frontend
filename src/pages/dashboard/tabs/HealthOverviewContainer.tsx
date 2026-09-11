import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';

export function HealthOverviewContainer() {
  const location = useLocation();

  if (location.pathname === '/dashboard/advance/health') {
    return <Navigate to="triage" replace />;
  }

  const subtabs = [
    { label: 'Triage', path: 'triage' },
    { label: 'Divergence', path: 'divergence' },
    { label: 'Movement', path: 'movement' },
    { label: 'Controls', path: 'controls' },
    { label: 'Renewal Date', suffix: 'All', path: 'renewal-date' },
    { label: 'Primary Owner', suffix: 'All', path: 'primary-owner' },
    { label: 'Lifecycle Stage', suffix: 'All', path: 'lifecycle-stage' },
    { label: 'Account', suffix: 'All', path: 'account' },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Sub-navigation bar mimicking former filter bar */}
      <div className="flex items-center px-4 bg-surface border-b border-line-subtle shrink-0 overflow-x-auto scrollbar-none shadow-[0_2px_4px_rgba(0,0,0,0.01)] mb-4 rounded-lg">
        <div className="flex items-center min-w-max h-[40px]">
          {subtabs.map((tab, idx) => (
            <div key={tab.path} className="flex items-center h-full">
              {idx > 0 && <div className="w-px h-3.5 mx-2 bg-line" />}
              <NavLink
                to={tab.path}
                className={({ isActive }) => `
                  h-full flex items-center px-2 text-[12.5px] font-bold transition-all whitespace-nowrap border-b-[2px]
                  ${isActive 
                    ? 'border-accent text-accent bg-accent-dim' 
                    : 'border-transparent text-ink-muted hover:text-ink hover:bg-subtle'
                  }
                `}
              >
                {tab.label}
                {tab.suffix && (
                  <span className="ml-1 text-[11px] font-normal text-ink-faint">
                    {tab.suffix}
                  </span>
                )}
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
