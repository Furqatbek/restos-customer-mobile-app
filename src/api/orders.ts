import api from './client';

export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';
export type PaymentMethod = 'CASH' | 'CARD' | 'WALLET';
export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderItem {
  productId: number;
  quantity: number;
  specialInstructions?: string;
  addOns?: { addOnId: number; quantity: number }[];
}

export interface PlaceOrderPayload {
  restaurantId: number;
  orderSource: 'MOBILE';
  orderType: OrderType;
  customerInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  items: OrderItem[];
  deliveryInfo?: {
    address: string;
    city: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    deliveryInstructions?: string;
  };
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  scheduledFor?: string | null;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  estimatedDeliveryTime?: number;
  createdAt: string;
  timeline?: OrderTimeline[];
  items?: {
    id: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  deliveryInfo?: {
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
    courierName?: string;
    courierPhone?: string;
    courierLocation?: { latitude: number; longitude: number };
  };
}

export const placeOrder = (payload: PlaceOrderPayload) =>
  api.post<OrderResponse>('/consumer/orders', payload);

export const trackOrder = (orderNumber: string) =>
  api.get<OrderResponse>(`/consumer/orders/${orderNumber}`);

export const cancelOrder = (orderNumber: string, reason: string) =>
  api.post(`/consumer/orders/${orderNumber}/cancel`, { reason });
