import { create } from 'zustand';
import { CustomerInfo, AuthTokens, saveTokens, clearTokens, getAccessToken, logoutRemote } from '../api/auth';
import { storage } from '../utils/storage';

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
  },

  logout: async () => {
    await logoutRemote();      // best-effort server-side invalidation
    await clearTokens();
    // Keep hasOnboarded so we land on Login (not Splash) next time.
    set({ customer: null, isAuthenticated: false });
  },

  setCustomer: (customer) => set({ customer }),
}));
