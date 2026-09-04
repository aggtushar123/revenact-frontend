import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';

export function DashboardLayout() {
  const location = useLocation();
  // Only the builder (/scenarios/create, /scenarios/:id) wants the
  // full-canvas, no-Navbar treatment — /scenarios itself is a plain
  // list page like any other, with the shared Navbar above it.
  const isScenarios = location.pathname.startsWith('/scenarios/');

  return (
    <div className="flex bg-surface h-screen w-screen overflow-hidden text-ink font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden bg-subtle/50">
        {!isScenarios && <Navbar />}
        <main className={`flex-1 overflow-hidden h-full flex flex-col ${isScenarios ? 'p-0' : 'p-2 md:p-3 lg:p-4'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
