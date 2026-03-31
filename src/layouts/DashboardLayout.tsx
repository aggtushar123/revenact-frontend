import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';

export function DashboardLayout() {
  const location = useLocation();
  const isScenarios = location.pathname.includes('/scenarios');

  return (
    <div className="flex bg-white h-screen w-screen overflow-hidden text-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden bg-gray-50/50">
        {!isScenarios && <Navbar />}
        <main className={`flex-1 overflow-hidden h-full flex flex-col ${isScenarios ? 'p-0' : 'p-2 md:p-3 lg:p-4'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
