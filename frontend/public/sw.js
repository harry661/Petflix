// Petflix Service Worker
// Version 2.0.0 - Enhanced with better caching

const CACHE_NAME = 'petflix-v2';
const OFFLINE_PAGE = '/offline.html';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/vite.svg',
  '/manifest.json',
  '/dogs-filter.png',
  '/cats-filter.png',
  '/birds-filter.png',
  '/smalls-filter.png',
  '/aquatic-filter.png',
  '/pet-of-the-week.png',
  '/clip-of-the-week.png',
  '/rising-star.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // If some assets fail to cache, continue anyway
        console.log('[Service Worker] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (always use network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip external requests (YouTube, etc.)
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version if available and not expired
      if (cachedResponse) {
        const cachedDate = cachedResponse.headers.get('sw-cached-date');
        if (cachedDate) {
          const cacheAge = Date.now() - parseInt(cachedDate);
          if (cacheAge < CACHE_DURATION) {
            return cachedResponse;
          }
        } else {
          // No date header, assume valid
          return cachedResponse;
        }
      }

      // Otherwise, fetch from network
      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response (stream can only be consumed once)
          const responseToCache = response.clone();

          // Add cache date header
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cached-date', Date.now().toString());

          // Create new response with cache date
          const modifiedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });

          // Cache the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, modifiedResponse);
          });

          return response;
        })
        .catch(() => {
          // Network failed, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }
          // For other requests, return a basic offline response
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
    })
  );
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  // Future: sync offline actions when back online
  // Example: sync likes, comments, etc. that were made offline
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Petflix';
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: data.tag || 'default',
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
