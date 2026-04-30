import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { isTokenExpiringSoon } from '../utils/jwt';

export const BASE_URL = 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Refresh-token coordination ────────────────────────────────────────────
// All concurrent callers that hit a 401/403 or a near-expiry token wait on
// a single in-flight refresh promise. Subsequent failures clear auth state
// and the auth store flips isAuthenticated → false, which makes the root
// navigator switch back to the auth stack (starting at Login, since
// hasOnboarded persists).

let refreshInFlight: Promise<string | null> | null = null;

const performRefresh = async (): Promise<string | null> => {
  const refreshToken = await storage.getItem('refresh_token');
  if (!refreshToken) return null;
  try {
    // Use a bare axios instance — bypasses our interceptors so we don't
    // recurse and don't attach the (likely-expired) access token.
    const { data } = await axios.post(
      `${BASE_URL}/consumer/auth/refresh`,
      { refreshToken },
    );
    const inner = data?.data ?? data; // unwrap envelope
    const accessToken: string | undefined = inner?.accessToken ?? inner?.access_token;
    const newRefresh: string | undefined = inner?.refreshToken ?? inner?.refresh_token;
    if (!accessToken || !newRefresh) return null;
    await storage.setItem('access_token', accessToken);
    await storage.setItem('refresh_token', newRefresh);
    return accessToken;
  } catch {
    return null;
  }
};

const refreshOnce = (): Promise<string | null> => {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const handleAuthFailure = async () => {
  // Lazy import to avoid the auth store ↔ api circular dep at module load.
  const { useAuthStore } = await import('../store/authStore');
  await useAuthStore.getState().logout();
};

const isAuthEndpoint = (url?: string) =>
  !!url && (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/verify'));

// ─── Request interceptor: proactive refresh ────────────────────────────────

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (isAuthEndpoint(config.url)) return config;

  let token = await storage.getItem('access_token');
  if (token && isTokenExpiringSoon(token)) {
    const refreshed = await refreshOnce();
    if (refreshed) token = refreshed;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: envelope unwrap + reactive refresh on 401/403 ──

const isEnvelope = (body: unknown): body is { success: boolean; data: unknown } =>
  !!body
  && typeof body === 'object'
  && 'success' in (body as object)
  && 'data' in (body as object);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap the standard backend envelope { success, message, data, ... }
    // so callers can treat response.data as the actual payload directly.
    if (isEnvelope(response.data)) {
      response.data = (response.data as { data: unknown }).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url) &&
      (status === 401 || status === 403)
    ) {
      original._retry = true;
      const newToken = await refreshOnce();
      if (newToken) {
        original.headers = original.headers ?? {} as any;
        (original.headers as any).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed — sign out so the navigator returns to Login.
      await handleAuthFailure();
    }
    return Promise.reject(error);
  },
);

export default api;
