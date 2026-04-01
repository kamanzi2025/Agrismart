import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface OverviewData {
  cooperative: { name: string; region: string };
  memberCount: number;
  currentSeason: string;
  financialSummary: { totalRevenue: number; totalExpenses: number; netProfit: number; byMember: Array<{ name: string; revenue: number; expenses: number }> };
  pendingPestReports: number;
}

export function LeaderOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cooperative/overview').then(res => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400">Loading…</div>;
  if (!data) return <div className="text-center py-8 text-gray-400">Failed to load</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 text-lg">{data.cooperative.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{data.cooperative.region} · {data.currentSeason}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Members', value: data.memberCount, color: 'text-green-700' },
          { label: 'Revenue (RWF)', value: data.financialSummary.totalRevenue.toLocaleString(), color: 'text-blue-600' },
          { label: 'Expenses (RWF)', value: data.financialSummary.totalExpenses.toLocaleString(), color: 'text-orange-600' },
          { label: 'Pending Pests', value: data.pendingPestReports, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Financial by Member</h3></div>
        <table className="w-full">
          <thead className="bg-gray-50"><tr>{['Farmer', 'Revenue', 'Expenses', 'Net'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {data.financialSummary.byMember.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-blue-600">{m.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-orange-600">{m.expenses.toLocaleString()}</td>
                <td className={`px-4 py-3 font-medium ${(m.revenue - m.expenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(m.revenue - m.expenses).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
