// Service Worker for Zelote PWA
const CACHE_NAME = 'zelote-cache-v5'; // Incrementando a versão do cache
const OFFLINE_URL = '/offline.html';

// Recursos essenciais para o shell do app
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/icons/icon.svg'
];

// Tipos de recursos que queremos cachear agressivamente (Cache First)
const cacheFirstTypes = ['font', 'image'];

// Install a service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching essential resources');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('[Service Worker] Pre-caching failed:', err))
  );
  self.skipWaiting();
});

// Activate event: limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch event: Estratégia de cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;

  // 1. Ignorar requisições de terceiros (exceto Google Fonts)
  if (!url.protocol.startsWith('http') || url.origin !== location.origin) {
    if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
      event.respondWith(
        caches.match(request).then(response => {
          return response || fetch(request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
      );
      return;
    }
    return;
  }

  // 2. Cache First para imagens e fontes
  if (cacheFirstTypes.includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(() => {
          if (request.destination === 'image') return caches.match('/icons/offline-image.png');
        });
      })
    );
    return;
  }

  // 3. Network First para HTML e Assets Críticos
  const isCriticalAsset = request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

  if (isCriticalAsset) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            if (request.mode === 'navigate') return caches.match(OFFLINE_URL);
            return new Response('Offline content not available');
          });
        })
    );
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// --- PUSH NOTIFICATIONS SUPPORT ---

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Zelote Notificação';

    const options = {
      body: data.body || 'Nova atualização disponível.',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      // Neo-Brutalist inspired actions potentially
      actions: [
        { action: 'open', title: 'Ver Detalhes' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Erro ao processar push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver uma aba aberta, foca nela
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});