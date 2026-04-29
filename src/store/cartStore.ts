import { create } from 'zustand';
import { Product, AddOn } from '../api/menu';

export interface CartItem {
  id: string; // local uuid
  product: Product;
  quantity: number;
  selectedAddOns: { group: string; addOn: AddOn }[];
  specialInstructions?: string;
  unitPrice: number; // product.price + addons
}

interface CartState {
  items: CartItem[];
  restaurantId: number | null;
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  paymentMethod: 'CASH' | 'CARD' | 'WALLET';
  deliveryAddress: string;
  deliveryCity: string;
  customerNotes: string;
  tip: number;

  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setOrderType: (type: CartState['orderType']) => void;
  setPaymentMethod: (method: CartState['paymentMethod']) => void;
  setDeliveryAddress: (address: string, city: string) => void;
  setCustomerNotes: (notes: string) => void;
  setTip: (tip: number) => void;
  setRestaurantId: (id: number) => void;

  // Computed
  subtotal: () => number;
  total: (deliveryFee: number) => number;
  itemCount: () => number;
}

let idCounter = 0;
const genId = () => `item-${++idCounter}`;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  orderType: 'DELIVERY',
  paymentMethod: 'CASH',
  deliveryAddress: '',
  deliveryCity: '',
  customerNotes: '',
  tip: 0,

  addItem: (item) => {
    set((state) => {
      // Check same restaurant
      if (state.restaurantId && state.restaurantId !== item.product.categoryId) {
        // different restaurant — clear
      }
      return { items: [...state.items, { ...item, id: genId() }] };
    });
  },

  updateQuantity: (id, quantity) => {
    set((state) => ({
      items: quantity <= 0
        ? state.items.filter((i) => i.id !== id)
        : state.items.map((i) => i.id === id ? { ...i, quantity } : i),
    }));
  },

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clearCart: () => set({ items: [], restaurantId: null, tip: 0, customerNotes: '' }),

  setOrderType: (orderType) => set({ orderType }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setDeliveryAddress: (deliveryAddress, deliveryCity) => set({ deliveryAddress, deliveryCity }),
  setCustomerNotes: (customerNotes) => set({ customerNotes }),
  setTip: (tip) => set({ tip }),
  setRestaurantId: (restaurantId) => set({ restaurantId }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
  total: (deliveryFee) => get().subtotal() + deliveryFee + get().tip,
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
