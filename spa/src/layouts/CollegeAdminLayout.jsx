import { Outlet } from 'react-router-dom';
import RoleBasedSidebar from '../components/common/RoleBasedSidebar';

export default function CollegeAdminLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <RoleBasedSidebar role="college_admin" />
      <main className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in relative z-10 bg-surface">
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-8 py-5 flex-shrink-0 z-20 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">College Dashboard</h1>
            <p className="text-sm font-bold text-gray-500 opacity-80 mt-1">Super Admin Controls</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative scroll-smooth">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
