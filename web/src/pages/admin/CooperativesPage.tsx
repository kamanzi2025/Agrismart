import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Cooperative } from '../../types';

export function CooperativesPage() {
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/cooperatives').then(res => setCoops(res.data.data.cooperatives ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      {loading && <div className="text-center py-8 text-gray-400">Loading…</div>}
      {!loading && coops.length === 0 && <div className="text-center py-8 text-gray-400">No cooperatives</div>}
      {coops.map(c => (
        <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800">{c.name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{c.region} · Leader: {c.leader?.name ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}
