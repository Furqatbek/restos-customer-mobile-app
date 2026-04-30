import { Platform } from 'react-native';
import {
  getVapidKey,
  subscribePush,
  unsubscribePush,
  WebPushSubscription,
} from '../api/notifications';
import { storage } from './storage';

// ─── helpers ──────────────────────────────────────────────────────────────

const SUBSCRIBED_ENDPOINT_KEY = 'push_endpoint';

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

const subscriptionToJSON = (sub: PushSubscription): WebPushSubscription => {
  const json = sub.toJSON() as WebPushSubscription;
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
};

const extractVapidKey = (response: unknown): string | null => {
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object') {
    const r = response as Record<string, unknown>;
    if (typeof r.publicKey === 'string') return r.publicKey;
    if (typeof r.vapidPublicKey === 'string') return r.vapidPublicKey;
    if (typeof r.key === 'string') return r.key;
  }
  return null;
};

// ─── Web push ──────────────────────────────────────────────────────────────

const registerWebPush = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[push] Web push not supported in this browser');
    return;
  }

  // Ask permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[push] Notification permission denied');
    return;
  }

  // Register service worker (served from /sw.js at site root)
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  // If already subscribed and we already POSTed it, nothing to do
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // Need VAPID public key from server
    const { data } = await getVapidKey();
    const vapidKey = extractVapidKey(data);
    if (!vapidKey) {
      console.warn('[push] No VAPID public key returned from server');
      return;
    }
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  }

  const json = subscriptionToJSON(subscription);
  await subscribePush({
    platform: 'WEB',
    endpoint: json.endpoint,
    keys: json.keys,
  });
  await storage.setItem(SUBSCRIBED_ENDPOINT_KEY, json.endpoint);
};

const unregisterWebPush = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    const endpoint = subscription?.endpoint ?? (await storage.getItem(SUBSCRIBED_ENDPOINT_KEY));
    if (endpoint) await unsubscribePush(endpoint);
    if (subscription) await subscription.unsubscribe();
    await storage.deleteItem(SUBSCRIBED_ENDPOINT_KEY);
  } catch {
    // best-effort
  }
};

// ─── Native push (iOS / Android via Expo) ─────────────────────────────────
// To enable native push, install:
//   npx expo install expo-notifications expo-device
// then replace this stub with the implementation below (kept commented to
// avoid metro bundler errors when the package isn't installed):
//
//   const Notifications = require('expo-notifications');
//   const Device = require('expo-device');
//   ...request permission, getExpoPushTokenAsync(), subscribePush({ platform, deviceToken })

const registerNativePush = async (): Promise<void> => {
  console.warn('[push] Native push not yet wired — install expo-notifications to enable');
};

const unregisterNativePush = async (): Promise<void> => {
  try {
    const token = await storage.getItem(SUBSCRIBED_ENDPOINT_KEY);
    if (token) await unsubscribePush(token);
    await storage.deleteItem(SUBSCRIBED_ENDPOINT_KEY);
  } catch {
    // best-effort
  }
};

// ─── Public API ───────────────────────────────────────────────────────────

export const registerPushNotifications = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await registerWebPush();
    } else {
      await registerNativePush();
    }
  } catch (e) {
    // Never let a push failure break the login flow
    console.warn('[push] Registration failed:', (e as Error).message);
  }
};

export const unregisterPushNotifications = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await unregisterWebPush();
    } else {
      await unregisterNativePush();
    }
  } catch {
    // ignore
  }
};
