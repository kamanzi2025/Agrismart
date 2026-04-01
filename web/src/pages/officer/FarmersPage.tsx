import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Farmer } from '../../types';

export function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    api.get(`/officer/farmers?${params}`)
      .then(res => { setFarmers(res.data.data.farmers ?? []); setTotal(res.data.data.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by name or phone…"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Phone', 'Location', 'Land (acres)', 'Joined'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && farmers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No farmers found</td></tr>}
            {farmers.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.user?.name}</td>
                <td className="px-4 py-3 text-gray-600">{f.user?.phone}</td>
                <td className="px-4 py-3 text-gray-600">{f.user?.location ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{f.totalLandAcres ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{new Date(f.user?.createdAt ?? '').toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} farmers</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="px-2 py-1">Page {page} of {Math.ceil(total / limit) || 1}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
