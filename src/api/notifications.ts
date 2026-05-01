import api from './client';

// ─── Types ────────────────────────────────────────────────────────────────

export type NotificationRole = 'CUSTOMER' | 'ADMIN' | 'WAITER' | 'COURIER';

export type NotificationType =
  | 'ORDER_STATUS'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PREPARING'
  | 'ORDER_READY'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'PROMOTION'
  | 'SYSTEM'
  | string;

export interface Notification {
  id: number;
  title: string;
  message: string;
  userRole: NotificationRole;
  userId?: number;
  orderId?: number;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

// Spring Boot Page<T> shape
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  // also: number, size, first, last, etc. — ignore unless needed
}

export interface ListParams {
  role?: NotificationRole;
  userId?: number;
  page?: number;
  size?: number;
}

const buildListQuery = (p: ListParams = {}): string => {
  const params = new URLSearchParams();
  params.set('role', p.role ?? 'CUSTOMER');
  if (p.userId !== undefined) params.set('userId', String(p.userId));
  if (p.page !== undefined) params.set('page', String(p.page));
  if (p.size !== undefined) params.set('size', String(p.size));
  return params.toString();
};

// ─── Inbox ────────────────────────────────────────────────────────────────

export const listNotifications = (params: ListParams = {}) =>
  api.get<Page<Notification>>(`/notifications?${buildListQuery(params)}`);

export const listUnreadNotifications = (params: ListParams = {}) =>
  api.get<Notification[]>(`/notifications/unread?${buildListQuery(params)}`);

export const getUnreadCount = (params: ListParams = {}) =>
  api.get<{ count: number } | number>(`/notifications/unread/count?${buildListQuery(params)}`);

export const listOrderNotifications = (orderId: number | string) =>
  api.get<Notification[]>(`/notifications/order/${orderId}`);

// ─── Mutations ────────────────────────────────────────────────────────────

export const markNotificationRead = (id: number) =>
  api.patch<{ success: boolean }>(`/notifications/${id}/read`);

export const markAllNotificationsRead = (params: ListParams = {}) =>
  api.patch<{ success: boolean }>(`/notifications/mark-all-read?${buildListQuery(params)}`);

export const archiveNotification = (id: number) =>
  api.patch<{ success: boolean }>(`/notifications/${id}/archive`);

export const deleteNotification = (id: number) =>
  api.delete<{ success: boolean }>(`/notifications/${id}`);

// ─── Push subscription ────────────────────────────────────────────────────

export interface VapidKeyResponse {
  publicKey?: string;
  vapidPublicKey?: string;
  key?: string;
}

export const getVapidKey = () => api.get<VapidKeyResponse | string>('/push/vapid-key');

export interface WebPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
}

export interface SubscribePayload {
  platform: 'WEB' | 'IOS' | 'ANDROID';
  endpoint?: string;
  keys?: { p256dh: string; auth: string };
  deviceToken?: string;
}

export const subscribePush = (payload: SubscribePayload) =>
  api.post<{ success: boolean }>('/push/subscribe/customer', payload);

export const unsubscribePush = (endpoint?: string) =>
  api.post<{ success: boolean }>('/push/unsubscribe', endpoint ? { endpoint } : {});

export const getPushStatus = () =>
  api.get<{ subscribed: boolean }>('/push/status');
