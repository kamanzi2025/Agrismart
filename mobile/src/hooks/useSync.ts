import { useEffect, useRef } from 'react';
import { syncAll } from '../services/sync';
import { useAuthStore } from '../store/authStore';
import { useNetworkStatus } from './useNetworkStatus';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useSync() {
  const isOnline = useNetworkStatus();
  const farmerId = useAuthStore((s) => s.farmerId);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOnline || !farmerId) return;

    // Sync immediately when online
    syncAll(farmerId);

    timerRef.current = setInterval(() => {
      if (farmerId) syncAll(farmerId);
    }, SYNC_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOnline, farmerId]);
}
