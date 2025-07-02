
// Service Worker for Zelote PWA
const CACHE_NAME = 'zelote-cache-v3';
const OFFLINE_URL = '/offline.html';
const UPDATE_CHECK_INTERVAL = 30000; // 30 seconds

// Resources to pre-cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/index.js',
  '/assets/index.css',
  '/offline.html',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192.png'
];

// Install a service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache open failed:', err))
  );
  self.skipWaiting();
});

// Network First strategy for critical assets, Cache First for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isCriticalAsset = url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/';
  
  if (isCriticalAsset) {
    // Network First for critical assets
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache First for non-critical assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }

          const fetchRequest = event.request.clone();
          return fetch(fetchRequest)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  if (!fetchRequest.url.includes('/api/')) {
                    cache.put(event.request, responseToCache);
                  }
                });

              return response;
            })
            .catch(error => {
              console.error('Fetch failed:', error);
              
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              if (event.request.destination === 'image') {
                return caches.match('/icons/offline-image.png');
              }
              
              return new Response('Offline content not available');
            });
        })
    );
  }
});

// Update a service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
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

// Periodic update check for mobile devices
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Force cache refresh for critical assets
    const criticalUrls = ['/', '/assets/index.js', '/assets/index.css'];
    Promise.all(
      criticalUrls.map(url => 
        fetch(url, { cache: 'no-cache' })
          .then(response => {
            if (response.ok) {
              return caches.open(CACHE_NAME).then(cache => cache.put(url, response));
            }
          })
          .catch(() => {})
      )
    );
  }
});
