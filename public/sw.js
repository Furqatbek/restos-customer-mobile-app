// Service worker for Web Push notifications.
// Served from /sw.js at the site root (Expo's metro web copies public/ to the
// build output). Kept tiny on purpose — anything app-specific should go
// through the message channel below.

self.addEventListener('install', (event) => {
  // Activate immediately on first install (don't wait for old SW to die)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Show a notification when the server sends a push event.
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'Notification', body: event.data.text() };
    }
  }

  const title = payload.title || payload.notification?.title || "Jangirov's";
  const body = payload.body || payload.notification?.body || payload.message || '';
  const data = payload.data || payload || {};

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data,
      tag: data.notificationId ? String(data.notificationId) : undefined,
    }),
  );
});

// When the user clicks a notification: focus an existing tab or open a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if ('focus' in client) {
          client.focus();
          // Hand the click data to the page so it can route the user.
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return;
        }
      }
      // No tab open — open a new one
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
