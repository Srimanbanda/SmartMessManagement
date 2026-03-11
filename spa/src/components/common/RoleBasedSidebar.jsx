import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Coffee, MessageSquare, Monitor, LayoutList, Activity, Users, CreditCard, LogOut } from 'lucide-react';

const navs = {
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Meals', path: '/student/my-meals', icon: Coffee },
    { name: 'Feedback', path: '/student/feedback', icon: MessageSquare },
  ],
  mess_admin: [
    { name: 'Live Monitor', path: '/mess-admin/monitor', icon: Monitor },
    { name: 'Menu Editor', path: '/mess-admin/menu', icon: LayoutList },
  ],
  college_admin: [
    { name: 'Global Analytics', path: '/college-admin/analytics', icon: Activity },
    { name: 'Student Registry', path: '/college-admin/registry', icon: Users },
    { name: 'Wallet Recharge', path: '/college-admin/recharge', icon: CreditCard },
  ]
};

export default function RoleBasedSidebar({ role }) {
  const { logout } = useAuth();
  const links = navs[role] || [];

  return (
    <aside className="w-64 bg-primary text-white h-screen flex flex-col shadow-xl flex-shrink-0">
      <div className="p-6">
        <h2 className="text-xl font-bold tracking-wider">Smart Mess</h2>
        <p className="text-sm text-surface opacity-80 capitalize">{role.replace('_', ' ')} Portal</p>
      </div>

      <nav className="flex-1 mt-6">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) => 
              `flex items-center space-x-3 px-6 py-3 transition-colors ${
                isActive ? 'bg-white/10 border-l-4 border-success' : 'hover:bg-white/5 opacity-80 hover:opacity-100 border-l-4 border-transparent'
              }`
            }
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 w-full px-4 py-2 text-warning hover:bg-warning hover:text-white rounded-md transition-colors font-medium"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
