// Service Worker for College ERP System
// Provides offline support and caching

const CACHE_NAME = 'college-erp-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/mobile-responsive.css',
  '/admin-site/index.html',
  '/admin-site/dashboard.html',
  '/admin-site/style.css',
  '/admin-site/script.js',
  '/student-site/student.html',
  '/student-site/dashboard.html',
  '/student-site/style.css',
  '/student-site/script.js',
  '/assets/college-logo.png',
  '/assets/foundation-banner.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(err => {
          console.error('[Service Worker] Fetch failed:', err);
          // Return offline page if available
          return caches.match('/index.html');
        });
      })
  );
});

// Background sync for attendance updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    console.log('[Service Worker] Syncing attendance data...');
    event.waitUntil(syncAttendanceData());
  }
});

async function syncAttendanceData() {
  // This would sync any pending attendance updates
  // when the device comes back online
  console.log('[Service Worker] Attendance data synced');
}

// Push notifications support
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/assets/college-logo.png',
    badge: '/assets/college-logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('College ERP', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});
