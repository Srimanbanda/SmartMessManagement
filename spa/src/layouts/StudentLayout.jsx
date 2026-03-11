import { Outlet } from 'react-router-dom';
import RoleBasedSidebar from '../components/common/RoleBasedSidebar';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Coins } from 'lucide-react';

export default function StudentLayout() {
  const { user } = useAuth();
  const { coins } = useWallet();

  return (
    <div className="flex min-h-screen bg-surface">
      <RoleBasedSidebar role="student" />
      <main className="flex-1 flex flex-col h-screen overflow-hidden animate-fade-in relative z-10 bg-surface">
        {/* Header Ribbon */}
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-8 py-5 flex-shrink-0 z-20 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Welcome back, {user?.name || 'Student'}!</h1>
            <p className="text-sm text-primary font-bold opacity-70 mt-0.5">Roll No: {user?.roll_no}</p>
          </div>
          <div className="flex shadow-sm items-center bg-amber-50 border border-amber-200/60 rounded-full px-5 py-2 transform transition-all hover:scale-105">
            <Coins className="text-amber-500 w-5 h-5 mr-2 animate-pulse" />
            <span className="font-extrabold text-amber-700 text-lg">{coins}</span>
            <span className="text-sm text-amber-600 ml-1.5 font-bold uppercase tracking-wide">Coins</span>
          </div>
        </header>

        {/* Dynamic Outlet Scope */}
        <div className="flex-1 overflow-auto p-8 relative scroll-smooth">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
