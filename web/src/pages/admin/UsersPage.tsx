import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    api.get(`/admin/users?${params}`).then(res => { setUsers(res.data.data.users ?? []); setTotal(res.data.data.total ?? 0); }).catch(() => {}).finally(() => setLoading(false));
  }, [page, search, role]);

  const roleBadge: Record<string, string> = { FARMER: 'bg-green-100 text-green-700', EXTENSION_OFFICER: 'bg-blue-100 text-blue-700', COOPERATIVE_LEADER: 'bg-purple-100 text-purple-700', ADMIN: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input type="text" placeholder="Search users…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All roles</option>
          <option value="FARMER">Farmer</option>
          <option value="EXTENSION_OFFICER">Extension Officer</option>
          <option value="COOPERATIVE_LEADER">Cooperative Leader</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Name', 'Phone', 'Role', 'Location'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>}
            {!loading && users.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No users</td></tr>}
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role] ?? ''}`}>{u.role.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3 text-gray-600">{u.location ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} users</span>
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
