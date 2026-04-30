import api from './client';

export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PROMOTION'
  | 'SYSTEM'
  | string; // tolerate unknown server values

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body?: string;
  message?: string;
  data?: Record<string, unknown>;
  orderId?: number;
  isRead: boolean;
  read?: boolean; // accept both shapes
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

// ─── Inbox ────────────────────────────────────────────────────────────────

export const listNotifications = () =>
  api.get<Notification[]>('/notifications');

export const listUnreadNotifications = () =>
  api.get<Notification[]>('/notifications/unread');

export const getUnreadCount = () =>
  api.get<UnreadCount | number>('/notifications/unread/count');

export const listOrderNotifications = (orderId: number | string) =>
  api.get<Notification[]>(`/notifications/order/${orderId}`);

// ─── Push subscription ────────────────────────────────────────────────────

export interface VapidKeyResponse {
  publicKey?: string;
  vapidPublicKey?: string;
  key?: string;
}

export const getVapidKey = () => api.get<VapidKeyResponse | string>('/push/vapid-key');

// Web push subscription payload (PushSubscription.toJSON())
export interface WebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface SubscribePayload {
  platform: 'WEB' | 'IOS' | 'ANDROID';
  // Web fields
  endpoint?: string;
  keys?: { p256dh: string; auth: string };
  // Native fields
  deviceToken?: string;
}

export const subscribePush = (payload: SubscribePayload) =>
  api.post<{ success: boolean }>('/push/subscribe/customer', payload);

export const unsubscribePush = (endpoint?: string) =>
  api.post<{ success: boolean }>('/push/unsubscribe', endpoint ? { endpoint } : {});

export const getPushStatus = () =>
  api.get<{ subscribed: boolean }>('/push/status');
