import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, string> = {
  '/officer/dashboard': 'Dashboard',
  '/officer/farmers': 'Farmers',
  '/officer/pest-reports': 'Pest Reports',
  '/officer/advisories': 'Advisories',
  '/officer/notifications': 'Notifications',
  '/leader/overview': 'Cooperative Overview',
  '/leader/members': 'Members',
  '/leader/trends': 'Trends',
  '/leader/reports': 'Reports',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'Users',
  '/admin/cooperatives': 'Cooperatives',
  '/admin/pest-reports': 'Pest Reports',
  '/admin/advisories': 'Advisories',
  '/admin/audit-log': 'Audit Log',
};

export function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'AgriSmart';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
