import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Advisory } from '../../types';

export function AdvisoriesPage() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', cropType: 'BEAN', season: '', targetLocation: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/advisory?limit=50').then(res => setAdvisories(res.data.data.advisories ?? [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/advisory', form);
      setShowForm(false);
      setForm({ title: '', content: '', cropType: 'BEAN', season: '', targetLocation: '' });
      load();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium">+ New Advisory</button>
      </div>
      {loading ? <div className="text-center py-8 text-gray-400">Loading…</div> : (
        <div className="space-y-3">
          {advisories.length === 0 && <p className="text-center py-8 text-gray-400">No advisories yet</p>}
          {advisories.map(a => (
            <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{a.cropType} · {a.season ?? 'All seasons'} · {a.targetLocation ?? 'All locations'}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-600 text-sm mt-3 line-clamp-3">{a.content}</p>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h3 className="font-semibold text-gray-800 mb-4">Create Advisory</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              <textarea placeholder="Content" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.cropType} onChange={e => setForm(f => ({ ...f, cropType: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="BEAN">Bean</option><option value="MAIZE">Maize</option><option value="SORGHUM">Sorghum</option>
                </select>
                <input placeholder="Season" value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <input placeholder="Target location" value={form.targetLocation} onChange={e => setForm(f => ({ ...f, targetLocation: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
