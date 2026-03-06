/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Ativa a limpeza de caches antigos
cleanupOutdatedCaches();

// Injeção do manifesto de precache do Vite
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = 'zelote-cache-v6';
const OFFLINE_URL = '/offline.html';

// Tipos de recursos que queremos cachear agressivamente (Cache First)
const cacheFirstTypes = ['font', 'image'];

// Ativação e limpeza de cache manual (se ainda necessário além do cleanupOutdatedCaches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
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

    // Ignorar requisições de API e externos (exceto fontes)
    if (!url.protocol.startsWith('http') || (url.origin !== location.origin && !url.origin.includes('fonts'))) {
        return;
    }

    // Cache First para imagens e fontes
    if (cacheFirstTypes.includes(request.destination)) {
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

    // Para navegação, se falhar o network, serve o offline.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match(OFFLINE_URL).then(res => res || new Response('Offline')))
        );
        return;
    }
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
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Listener vital para o prompt de atualização
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
