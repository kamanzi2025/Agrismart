import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';
import type { AuthState } from '../types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (phone: string, password: string) => {
        const res = await api.post('/auth/login', { phone, password });
        const { user, accessToken, refreshToken } = res.data.data;
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        try {
          const raw = localStorage.getItem('auth-storage');
          if (raw) {
            const state = JSON.parse(raw);
            const refreshToken = state?.state?.refreshToken;
            if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
          }
        } catch { /* ignore */ }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-storage' },
  ),
);
