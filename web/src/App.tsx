import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { FarmersPage } from './pages/officer/FarmersPage';
import { PestReportsPage } from './pages/officer/PestReportsPage';
import { AdvisoriesPage } from './pages/officer/AdvisoriesPage';
import { NotificationsPage } from './pages/officer/NotificationsPage';
import { LeaderOverview } from './pages/leader/LeaderOverview';
import { MembersPage } from './pages/leader/MembersPage';
import { TrendsPage } from './pages/leader/TrendsPage';
import { ReportsPage } from './pages/leader/ReportsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { CooperativesPage } from './pages/admin/CooperativesPage';
import { AdminPestReportsPage } from './pages/admin/AdminPestReportsPage';
import { AdminAdvisoriesPage } from './pages/admin/AdminAdvisoriesPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { useAuthStore } from './store/authStore';

function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'EXTENSION_OFFICER') return <Navigate to="/officer/dashboard" replace />;
  if (user?.role === 'COOPERATIVE_LEADER') return <Navigate to="/leader/overview" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<RootRedirect />} />

        <Route path="/officer" element={
          <ProtectedRoute allowedRoles={['EXTENSION_OFFICER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<OfficerDashboard />} />
          <Route path="farmers" element={<FarmersPage />} />
          <Route path="pest-reports" element={<PestReportsPage />} />
          <Route path="advisories" element={<AdvisoriesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="/leader" element={
          <ProtectedRoute allowedRoles={['COOPERATIVE_LEADER', 'ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="overview" element={<LeaderOverview />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="cooperatives" element={<CooperativesPage />} />
          <Route path="pest-reports" element={<AdminPestReportsPage />} />
          <Route path="advisories" element={<AdminAdvisoriesPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
