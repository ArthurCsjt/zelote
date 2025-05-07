
// Service Worker for Zelote PWA
const CACHE_NAME = 'zelote-cache-v2';
const OFFLINE_URL = '/offline.html';

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

// Cache and return requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request for the fetch call
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache if it's an API request
                if (!fetchRequest.url.includes('/api/')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            
            // Check if the request is for a page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return the offline image if the request is for an image
            if (event.request.destination === 'image') {
              return caches.match('/icons/offline-image.png');
            }
            
            // Return a simple offline response for other resources
            return new Response('Offline content not available');
          });
      })
  );
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
});
