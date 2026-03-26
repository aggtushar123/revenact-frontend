import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';

export function DashboardLayout() {
  return (
    <div className="flex bg-white h-screen w-screen overflow-hidden text-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden bg-gray-50/50">
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
