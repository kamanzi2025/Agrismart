import { useState } from 'react';
import { api } from '../../services/api';

interface Report {
  cooperative: { name: string; region: string };
  season: string;
  memberCount: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pestSummary: { pending: number; analyzed: number; resolved: number };
  memberBreakdown: Array<{ name: string; revenue: number; expenses: number; netProfit: number; pestReports: number }>;
}

const SEASONS = ['Season B 2023', 'Season A 2024', 'Season B 2024', 'Season A 2025'];

export function ReportsPage() {
  const [season, setSeason] = useState(SEASONS[SEASONS.length - 1]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cooperative/report/${encodeURIComponent(season)}`);
      setReport(res.data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
          <select value={season} onChange={e => setSeason(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={loadReport} disabled={loading} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium">{loading ? 'Loading…' : 'Generate Report'}</button>
      </div>
      {report && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800">{report.cooperative.name} — {report.season}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{report.cooperative.region} · {report.memberCount} members</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div><p className="text-xs text-gray-500">Revenue</p><p className="text-lg font-bold text-blue-600">{report.totalRevenue.toLocaleString()} RWF</p></div>
              <div><p className="text-xs text-gray-500">Expenses</p><p className="text-lg font-bold text-orange-600">{report.totalExpenses.toLocaleString()} RWF</p></div>
              <div><p className="text-xs text-gray-500">Net Profit</p><p className={`text-lg font-bold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{report.netProfit.toLocaleString()} RWF</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-medium text-gray-800 mb-3">Pest Reports</h4>
            <div className="flex gap-6">
              <div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold text-orange-600">{report.pestSummary.pending}</p></div>
              <div><p className="text-xs text-gray-500">Analyzed</p><p className="text-xl font-bold text-blue-600">{report.pestSummary.analyzed}</p></div>
              <div><p className="text-xs text-gray-500">Resolved</p><p className="text-xl font-bold text-green-600">{report.pestSummary.resolved}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h4 className="font-medium text-gray-800">Member Breakdown</h4></div>
            <table className="w-full">
              <thead className="bg-gray-50"><tr>{['Farmer', 'Revenue', 'Expenses', 'Net', 'Pest Reports'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-50">
                {report.memberBreakdown.map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-800">{m.name}</td>
                    <td className="px-4 py-3 text-blue-600">{m.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-orange-600">{m.expenses.toLocaleString()}</td>
                    <td className={`px-4 py-3 font-medium ${m.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{m.netProfit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{m.pestReports}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
