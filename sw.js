// Service Worker for DNYF TETCH PWA
const CACHE_NAME = 'dnyf-tetch-v2.0';
const OFFLINE_URL = '/offline.html';
const GITHUB_CACHE_NAME = 'github-cache-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/js/app.js',
    '/js/github.js',
    '/js/pwa.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== GITHUB_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event with different strategies
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // GitHub API requests - cache first, then network
    if (url.hostname === 'api.github.com') {
        event.respondWith(
            caches.open(GITHUB_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(response => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        // Cache the response
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => {
                        // Return cached response if network fails
                        return response;
                    });
                    
                    return response || fetchPromise;
                });
            })
        );
        return;
    }
    
    // Static assets - cache first
    if (PRECACHE_ASSETS.some(asset => url.pathname.includes(asset))) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
        return;
    }
    
    // Navigation requests - network first, fallback to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/');
            })
        );
        return;
    }
    
    // Default: network first, cache fallback
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200) {
                    return response;
                }
                
                // Clone the response
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Background sync for GitHub data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-github-data') {
        event.waitUntil(syncGitHubData());
    }
});

async function syncGitHubData() {
    try {
        const cache = await caches.open(GITHUB_CACHE_NAME);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await fetch(request);
            await cache.put(request, response);
        }
        
        console.log('GitHub data synced in background');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    let data = {};
    
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'DNYF TETCH',
            body: 'New update available!',
            icon: '/icons/icon-192.png'
        };
    }
    
    const options = {
        body: data.body || 'Check out new updates',
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/view.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'DNYF TETCH', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Periodic background sync
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-github-cache') {
        event.waitUntil(updateGitHubCache());
    }
});

async function updateGitHubCache() {
    console.log('Periodic background sync running...');
    await syncGitHubData();
}