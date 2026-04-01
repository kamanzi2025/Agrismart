import { api } from './api';
import { getPendingRecords, markSynced, saveAdvisories } from './database';
import { useSyncStore } from '../store/syncStore';

export async function syncAll(farmerId: string) {
  const { setIsSyncing, setLastSyncedAt, setPendingCount } = useSyncStore.getState();
  setIsSyncing(true);
  try {
    const { financials, pestReports } = await getPendingRecords();
    setPendingCount(financials.length + pestReports.length);

    // Push financial records
    for (const r of financials) {
      try {
        await api.post('/sync/batch', {
          records: [{
            clientUuid: r.client_uuid,
            farmerId: r.farmer_id,
            type: r.type,
            amount: r.amount,
            description: r.description,
            category: r.category,
            season: r.season,
            date: r.date,
          }],
        });
        await markSynced('financial', r.client_uuid);
      } catch { /* skip failed, will retry next cycle */ }
    }

    // Push pest reports (text-only for now, image sync via multipart would need FormData)
    for (const r of pestReports) {
      try {
        await api.post('/sync/batch', {
          pestReports: [{
            clientUuid: r.client_uuid,
            farmerId: r.farmer_id,
            notes: r.notes,
          }],
        });
        await markSynced('pest', r.client_uuid);
      } catch { /* skip */ }
    }

    // Pull advisories
    try {
      const res = await api.get('/advisory?limit=50');
      const advisories = res.data.data.advisories ?? [];
      await saveAdvisories(advisories.map((a: {
        id: string; title: string; content: string; cropType?: string;
        season?: string; targetLocation?: string; createdAt: string;
      }) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        cropType: a.cropType,
        season: a.season,
        targetLocation: a.targetLocation,
        createdAt: a.createdAt,
      })));
    } catch { /* ignore */ }

    setLastSyncedAt(new Date());
    setPendingCount(0);
  } finally {
    setIsSyncing(false);
  }
}
