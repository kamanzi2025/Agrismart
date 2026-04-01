import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { PestReport } from '../../types';

export function PestReportsPage() {
  const [reports, setReports] = useState<PestReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PestReport | null>(null);
  const [notes, setNotes] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    api.get(`/officer/pest-reports?${params}`)
      .then(res => { setReports(res.data.data.reports ?? []); setTotal(res.data.data.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status]);

  const handleDiagnose = async () => {
    if (!selected) return;
    setDiagnosing(true);
    try {
      await api.put(`/pest/report/${selected.id}/diagnose`, { officerNotes: notes, status: 'ANALYZED' });
      setSelected(null);
      setNotes('');
      load();
    } catch { /* ignore */ } finally { setDiagnosing(false); }
  };

  const severityBadge: Record<string, string> = { LOW: 'bg-yellow-100 text-yellow-700', MEDIUM: 'bg-orange-100 text-orange-700', HIGH: 'bg-red-100 text-red-700', CRITICAL: 'bg-red-200 text-red-900' };
  const statusBadge: Record<string, string> = { PENDING: 'bg-gray-100 text-gray-600', ANALYZED: 'bg-blue-100 text-blue-700', RESOLVED: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-4">
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="ANALYZED">Analyzed</option>
        <option value="RESOLVED">Resolved</option>
      </select>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Farmer', 'Pest', 'Severity', 'Status', 'Date', 'Action'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && reports.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No reports</td></tr>}
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.farmer?.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.pestName ?? 'Undiagnosed'}</td>
                <td className="px-4 py-3">{r.severity ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge[r.severity]}`}>{r.severity}</span> : '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[r.status]}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-gray-500 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.status === 'PENDING' && <button onClick={() => setSelected(r)} className="text-sm text-green-700 hover:text-green-800 font-medium">Diagnose</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Prev</button>
            <span className="px-2 py-1">Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Diagnose Report</h3>
            <p className="text-sm text-gray-600 mb-1"><strong>AI diagnosis:</strong> {selected.aiDiagnosis ?? 'None'}</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add officer notes…" className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-28 resize-none" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleDiagnose} disabled={diagnosing} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">{diagnosing ? 'Saving…' : 'Save diagnosis'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
