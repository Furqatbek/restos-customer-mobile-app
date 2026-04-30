import { create } from 'zustand';
import { CustomerInfo, AuthTokens, saveTokens, clearTokens, getAccessToken, logoutRemote } from '../api/auth';
import { storage } from '../utils/storage';
import { registerPushNotifications, unregisterPushNotifications } from '../utils/push';

const HAS_ONBOARDED_KEY = 'has_onboarded';

interface AuthState {
  isReady: boolean;          // hydrate() finished
  isAuthenticated: boolean;
  hasOnboarded: boolean;     // ever completed login → skip Splash/Onboarding
  customer: CustomerInfo | null;

  hydrate: () => Promise<void>;
  loginSuccess: (params: { customer: CustomerInfo; tokens: AuthTokens }) => Promise<void>;
  logout: () => Promise<void>;
  setCustomer: (customer: CustomerInfo) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isReady: false,
  isAuthenticated: false,
  hasOnboarded: false,
  customer: null,

  hydrate: async () => {
    const [token, hasOnboarded] = await Promise.all([
      getAccessToken(),
      storage.getItem(HAS_ONBOARDED_KEY),
    ]);
    set({
      isReady: true,
      isAuthenticated: !!token,
      hasOnboarded: !!hasOnboarded,
    });
  },

  loginSuccess: async ({ customer, tokens }) => {
    await saveTokens(tokens);
    await storage.setItem(HAS_ONBOARDED_KEY, '1');
    set({ customer, isAuthenticated: true, hasOnboarded: true });
    // Best-effort push registration. Never blocks login completion.
    void registerPushNotifications();
  },

  logout: async () => {
    // Capture the token BEFORE clearing local state so we can still tell
    // the server to invalidate the session.
    const token = await getAccessToken();
    // Best-effort unregister of push subscription (uses the still-valid token).
    void unregisterPushNotifications();
    // Clear local state immediately — UI responds instantly, the root
    // navigator subscribes to isAuthenticated and swaps to the auth stack.
    await clearTokens();
    set({ customer: null, isAuthenticated: false });
    // Fire-and-forget server invalidation. Keep hasOnboarded so we land
    // on Login (not Splash) next time.
    if (token) logoutRemote(token);
  },

  setCustomer: (customer) => set({ customer }),
}));
