// Service Worker per GMG Seoul 2027 (Don Bosco Asti) PWA & Web Push

const CACHE_NAME = 'gmg-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Gestione Notifiche Push
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'GMG Seoul 2027', body: event.data.text() };
    }
  }

  const title = data.title || 'GMG Seoul 2027 | Don Bosco Asti';
  const options = {
    body: data.body || 'Nuovo aggiornamento disponibile!',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'gmg-notification',
    renotify: true,
    data: {
      url: data.url || '/'
    },
    vibrate: [150, 80, 150]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta, portala in primo piano
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Altrimenti apri nuova finestra
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
