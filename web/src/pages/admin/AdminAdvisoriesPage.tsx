import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Advisory } from '../../types';

export function AdminAdvisoriesPage() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/advisory?limit=100').then(res => setAdvisories(res.data.data.advisories ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-3">
      {loading && <div className="text-center py-8 text-gray-400">Loading…</div>}
      {!loading && advisories.length === 0 && <div className="text-center py-8 text-gray-400">No advisories</div>}
      {advisories.map(a => (
        <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">{a.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">By {a.author?.name ?? '—'} · {a.cropType}</p>
            </div>
            <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{a.content}</p>
        </div>
      ))}
    </div>
  );
}
