const CACHE_NAME = 'agora-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/salles',
  '/reservations',
  '/profil',
  '/manifest.json'
]

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }
        return fetch(event.request)
      })
  )
})

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1',
        url: data.url || '/'
      },
      actions: [
        {
          action: 'explore',
          title: 'Voir',
          icon: '/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/icon-72x72.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Ouvrir la page spécifiée
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  } else if (event.action === 'close') {
    // Juste fermer la notification
    event.notification.close()
  } else {
    // Clic par défaut sur la notification
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})