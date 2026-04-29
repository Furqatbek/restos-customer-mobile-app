import { create } from 'zustand';
import { CustomerInfo } from '../api/auth';

interface AuthState {
  customer: CustomerInfo | null;
  isAuthenticated: boolean;
  setCustomer: (customer: CustomerInfo) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  customer: null,
  isAuthenticated: false,
  setCustomer: (customer) => set({ customer, isAuthenticated: true }),
  clearAuth: () => set({ customer: null, isAuthenticated: false }),
}));
