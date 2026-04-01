import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Stats { totalUsers: number; totalFarmers: number; totalCooperatives: number; pendingPestReports: number }

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalFarmers: 0, totalCooperatives: 0, pendingPestReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400">Loading…</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Users', value: stats.totalUsers, color: 'text-green-700' },
        { label: 'Farmers', value: stats.totalFarmers, color: 'text-blue-600' },
        { label: 'Cooperatives', value: stats.totalCooperatives, color: 'text-purple-600' },
        { label: 'Pending Pest Reports', value: stats.pendingPestReports, color: 'text-orange-600' },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
