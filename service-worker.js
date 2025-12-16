const CACHE_NAME = 'crypto-station-v16';
const ASSETS_TO_CACHE = [
    './index.html',
    './css/style.css',
    './css/themes.css',
    './js/config.js',
    './js/charts.js',
    './js/app.js',
    './assets/icon.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js'
];

// INSTALL
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// ACTIVATE (Clean old caches)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// FETCH (Cache first, then network)
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non-GET ou externes dynamiques (API)
    if (event.request.method !== 'GET') return;
    if (event.request.url.includes('api.coingecko.com')) return;
    if (event.request.url.includes('firestore')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
