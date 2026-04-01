import { create } from 'zustand';

interface AuthState {
  user: { id: string; name: string; phone: string; role: string; location?: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  farmerId: string | null;
  setAuth: (user: AuthState['user'], accessToken: string, refreshToken: string, farmerId?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  farmerId: null,
  setAuth: (user, accessToken, refreshToken, farmerId) =>
    set({ user, accessToken, refreshToken, isAuthenticated: true, farmerId: farmerId ?? null }),
  clearAuth: () =>
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, farmerId: null }),
}));
