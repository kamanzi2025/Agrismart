import axios from 'axios';

const BASE_URL = (import.meta as Record<string, any>).env?.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const state = JSON.parse(raw);
      const token = state?.state?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch { /* ignore */ }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem('auth-storage');
        if (!raw) throw new Error();
        const state = JSON.parse(raw);
        const refreshToken = state?.state?.refreshToken;
        if (!refreshToken) throw new Error();
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;
        state.state.accessToken = accessToken;
        state.state.refreshToken = newRefresh;
        localStorage.setItem('auth-storage', JSON.stringify(state));
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
