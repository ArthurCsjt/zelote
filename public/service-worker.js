// Service Worker for Zelote PWA
const CACHE_NAME = 'zelote-cache-v4'; // Incrementando a versão do cache
const OFFLINE_URL = '/offline.html';

// Recursos essenciais para o shell do app
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192.png'
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
            console.log('[Service Worker] Deleting old cache:', cacheName);
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
  
  // 1. Ignorar requisições de terceiros (exceto Google Fonts) e extensões
  if (!url.protocol.startsWith('http') || url.origin !== location.origin) {
    // Exceção para Google Fonts (Cache First)
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

  // 2. Estratégia Cache First para imagens e fontes
  if (cacheFirstTypes.includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(() => {
          // Fallback para imagens offline
          if (request.destination === 'image') {
            return caches.match('/icons/offline-image.png');
          }
        });
      })
    );
    return;
  }

  // 3. Estratégia Network First para HTML e Assets Críticos (JS/CSS)
  // Isso garante que o usuário obtenha a versão mais recente do app shell
  const isCriticalAsset = request.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
  
  if (isCriticalAsset) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se a rede funcionar, cacheia a nova versão e retorna
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Se a rede falhar, retorna a versão em cache
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            
            // Se for uma navegação e não houver cache, retorna a página offline
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Offline content not available');
          });
        })
    );
    return;
  }
  
  // 4. Para o resto (APIs, etc.): Network First (sem cache persistente para APIs)
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    // Clear all caches and force update
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
    self.skipWaiting();
  }
});

// Removida a lógica de 'CHECK_UPDATE' baseada em setInterval