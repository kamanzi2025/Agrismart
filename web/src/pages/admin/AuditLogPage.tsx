import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface AuditEntry { id: string; userId?: string; action: string; entity: string; entityId?: string; createdAt: string; user?: { name: string; phone: string } }

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/audit-log?page=${page}&limit=${limit}`).then(res => { setLogs(res.data.data.logs ?? []); setTotal(res.data.data.total ?? 0); }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Time', 'User', 'Action', 'Entity'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && logs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No audit logs</td></tr>}
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-700">{l.user?.name ?? l.userId ?? 'System'}</td>
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{l.action}</td>
                <td className="px-4 py-3 text-gray-600">{l.entity}{l.entityId ? ` (${l.entityId.slice(0, 8)}…)` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} entries</span>
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
