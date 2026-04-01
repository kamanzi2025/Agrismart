import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, Users, Bug, FileText, Bell, BarChart2, Building2, ClipboardList, LogOut } from 'lucide-react';

const officerLinks = [
  { to: '/officer/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/officer/farmers', label: 'Farmers', Icon: Users },
  { to: '/officer/pest-reports', label: 'Pest Reports', Icon: Bug },
  { to: '/officer/advisories', label: 'Advisories', Icon: FileText },
  { to: '/officer/notifications', label: 'Notifications', Icon: Bell },
];

const leaderLinks = [
  { to: '/leader/overview', label: 'Overview', Icon: Home },
  { to: '/leader/members', label: 'Members', Icon: Users },
  { to: '/leader/trends', label: 'Trends', Icon: BarChart2 },
  { to: '/leader/reports', label: 'Reports', Icon: ClipboardList },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', Icon: Home },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/cooperatives', label: 'Cooperatives', Icon: Building2 },
  { to: '/admin/pest-reports', label: 'Pest Reports', Icon: Bug },
  { to: '/admin/advisories', label: 'Advisories', Icon: FileText },
  { to: '/admin/audit-log', label: 'Audit Log', Icon: ClipboardList },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const links =
    user?.role === 'EXTENSION_OFFICER' ? officerLinks
    : user?.role === 'COOPERATIVE_LEADER' ? leaderLinks
    : adminLinks;

  return (
    <aside className="w-64 bg-green-800 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-green-700">
        <h1 className="text-xl font-bold">AgriSmart</h1>
        <p className="text-green-300 text-sm mt-1">{user?.name}</p>
        <span className="text-xs bg-green-600 px-2 py-0.5 rounded mt-1 inline-block">
          {user?.role?.replace(/_/g, ' ')}
        </span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              location.pathname.startsWith(to)
                ? 'bg-green-600 text-white'
                : 'text-green-200 hover:bg-green-700'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-green-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-200 hover:bg-green-700 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
