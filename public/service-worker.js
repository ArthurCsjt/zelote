// Service Worker for Zelote PWA
const CACHE_NAME = 'zelote-cache-v5'; // Incrementando a versão do cache para forçar a atualização
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

// URL base do Supabase para APIs (ajustar se necessário, mas o padrão é /rest/v1/ e /rpc/)
const SUPABASE_API_PATH = '/rest/v1/';
const SUPABASE_RPC_PATH = '/rpc/';

// Função auxiliar para aplicar a estratégia Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const networkFetch = fetch(request).then(async (response) => {
    // Se a rede for bem-sucedida, atualiza o cache
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Se a rede falhar, e não houver cache, retorna um erro 503
    return new Response(JSON.stringify({ error: 'Offline: Falha ao buscar dados da API.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  });

  // Retorna o cache imediatamente se disponível, senão espera pela rede
  return cachedResponse || networkFetch;
}

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
  
  // 2. Estratégia Stale-While-Revalidate para APIs do Supabase (GET requests)
  // Aplicamos apenas para GETs, pois POST/PUT/DELETE devem sempre ir para a rede.
  if (request.method === 'GET' && (url.pathname.startsWith(SUPABASE_API_PATH) || url.pathname.startsWith(SUPABASE_RPC_PATH))) {
    // Excluir chamadas de autenticação (auth) do cache de dados
    if (!url.pathname.includes('/auth/v1/')) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }
  }

  // 3. Estratégia Cache First para imagens e fontes
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

  // 4. Estratégia Network First para HTML e Assets Críticos (JS/CSS)
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
  
  // 5. Para o resto: Network First (sem cache persistente)
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