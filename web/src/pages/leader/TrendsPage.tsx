import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendEntry { season: string; totalRevenue: number; totalExpenses: number; netProfit: number; memberCount: number }

export function TrendsPage() {
  const [trends, setTrends] = useState<TrendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cooperative/trends').then(res => setTrends(res.data.data.trends ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue vs Expenses by Season</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={trends} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="season" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => typeof v === 'number' ? v.toLocaleString() : v} />
            <Legend />
            <Bar dataKey="totalRevenue" name="Revenue" fill="#16a34a" radius={[4,4,0,0]} />
            <Bar dataKey="totalExpenses" name="Expenses" fill="#ea580c" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Season', 'Members', 'Revenue', 'Expenses', 'Net Profit'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {trends.map(t => (
              <tr key={t.season}>
                <td className="px-4 py-3 font-medium text-gray-800">{t.season}</td>
                <td className="px-4 py-3 text-gray-600">{t.memberCount}</td>
                <td className="px-4 py-3 text-blue-600">{t.totalRevenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-orange-600">{t.totalExpenses.toLocaleString()}</td>
                <td className={`px-4 py-3 font-medium ${t.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{t.netProfit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
