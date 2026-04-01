import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface DashboardData {
  totalFarmers: number;
  pendingPestReports: number;
  recentPestReports: Array<{
    id: string;
    pestName?: string;
    status: string;
    severity?: string;
    createdAt: string;
    farmer?: { user: { name: string } };
  }>;
}

export function OfficerDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>({ totalFarmers: 0, pendingPestReports: 0, recentPestReports: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/officer/farmers?limit=1'),
      api.get('/officer/pest-reports?limit=5&status=PENDING'),
    ])
      .then(([farmersRes, pestRes]) => {
        setData({
          totalFarmers: farmersRes.data.data.total ?? 0,
          pendingPestReports: pestRes.data.data.total ?? 0,
          recentPestReports: pestRes.data.data.reports ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const severityColor: Record<string, string> = {
    LOW: 'bg-yellow-100 text-yellow-800',
    MEDIUM: 'bg-orange-100 text-orange-800',
    HIGH: 'bg-red-100 text-red-800',
    CRITICAL: 'bg-red-200 text-red-900',
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <p className="text-gray-600">Welcome back, {user?.name}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Farmers</p>
          <p className="text-3xl font-bold text-green-700 mt-1">{data.totalFarmers}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pending Pest Reports</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{data.pendingPestReports}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Pending Pest Reports</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {data.recentPestReports.length === 0 && (
            <p className="px-5 py-8 text-center text-gray-400">No pending reports</p>
          )}
          {data.recentPestReports.map(r => (
            <div key={r.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">{r.farmer?.user.name ?? 'Unknown'}</p>
                <p className="text-sm text-gray-500">{r.pestName ?? 'Undiagnosed'}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.severity && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor[r.severity] ?? ''}`}>
                    {r.severity}
                  </span>
                )}
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
