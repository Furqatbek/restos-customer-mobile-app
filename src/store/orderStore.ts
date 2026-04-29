import { create } from 'zustand';
import { OrderResponse } from '../api/orders';

interface OrderState {
  activeOrder: OrderResponse | null;
  orderHistory: OrderResponse[];
  setActiveOrder: (order: OrderResponse) => void;
  clearActiveOrder: () => void;
  addToHistory: (order: OrderResponse) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrder: null,
  orderHistory: [],
  setActiveOrder: (order) => set({ activeOrder: order }),
  clearActiveOrder: () => set({ activeOrder: null }),
  addToHistory: (order) =>
    set((state) => ({ orderHistory: [order, ...state.orderHistory] })),
}));
