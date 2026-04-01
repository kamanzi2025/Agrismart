import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { PestReport } from '../../types';

export function AdminPestReportsPage() {
  const [reports, setReports] = useState<PestReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    api.get(`/pest/reports?${params}`).then(res => { setReports(res.data.data.reports ?? []); setTotal(res.data.data.total ?? 0); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, status]);

  const statusBadge: Record<string, string> = { PENDING: 'bg-gray-100 text-gray-600', ANALYZED: 'bg-blue-100 text-blue-700', RESOLVED: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-4">
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
        <option value="">All statuses</option><option value="PENDING">Pending</option><option value="ANALYZED">Analyzed</option><option value="RESOLVED">Resolved</option>
      </select>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Farmer', 'Pest', 'Status', 'Date'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && reports.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No reports</td></tr>}
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.farmer?.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.pestName ?? 'Undiagnosed'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} reports</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Prev</button>
            <span className="px-2 py-1">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
