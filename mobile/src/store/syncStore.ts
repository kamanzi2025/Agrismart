import { create } from 'zustand';

interface SyncState {
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  pendingCount: number;
  setIsSyncing: (v: boolean) => void;
  setLastSyncedAt: (d: Date) => void;
  setPendingCount: (n: number) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  lastSyncedAt: null,
  isSyncing: false,
  pendingCount: 0,
  setIsSyncing: (v) => set({ isSyncing: v }),
  setLastSyncedAt: (d) => set({ lastSyncedAt: d }),
  setPendingCount: (n) => set({ pendingCount: n }),
}));
