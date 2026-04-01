import { useState } from 'react';
import { api } from '../../services/api';

export function NotificationsPage() {
  const [form, setForm] = useState({ message: '', targetRole: 'FARMER', phone: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      if (form.phone) {
        await api.post('/notifications/sms', { phone: form.phone, message: form.message });
      } else {
        await api.post('/notifications/broadcast', { message: form.message, targetRole: form.targetRole });
      }
      setResult('Notification sent successfully');
      setForm({ message: '', targetRole: 'FARMER', phone: '' });
    } catch { setResult('Failed to send notification'); } finally { setSending(false); }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Send Notification</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required placeholder="Type your message…" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-28 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="FARMER">All Farmers</option>
              <option value="EXTENSION_OFFICER">Officers</option>
              <option value="COOPERATIVE_LEADER">Leaders</option>
            </select>
            <input placeholder="Or specific phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          {result && <p className={`text-sm px-3 py-2 rounded-lg ${result.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{result}</p>}
          <button type="submit" disabled={sending} className="w-full py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium">{sending ? 'Sending…' : 'Send notification'}</button>
        </form>
      </div>
    </div>
  );
}
