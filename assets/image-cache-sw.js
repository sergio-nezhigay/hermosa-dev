// Service Worker for Image Caching
const CACHE_NAME = 'shopify-images-v1';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Image Cache Service Worker installed');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Image Cache Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept image requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only cache image requests
  if (event.request.destination === 'image' || 
      url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          
          // If we have a cached response, check if it's still valid
          if (cachedResponse) {
            const cachedDate = new Date(cachedResponse.headers.get('date'));
            const now = new Date();
            
            // If cache is still fresh, return it
            if (now.getTime() - cachedDate.getTime() < CACHE_EXPIRY) {
              console.log('Serving cached image:', url.pathname);
              return cachedResponse;
            }
          }
          
          // Fetch from network and cache
          return fetch(event.request).then((response) => {
            // Clone the response before caching
            const responseToCache = response.clone();
            
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(event.request, responseToCache);
              console.log('Cached new image:', url.pathname);
            }
            
            return response;
          }).catch(() => {
            // If network fails and we have a cached version, return it
            if (cachedResponse) {
              console.log('Network failed, serving stale cache:', url.pathname);
              return cachedResponse;
            }
            throw new Error('Image not available');
          });
        });
      })
    );
  }
});

// Message handler for manual cache operations
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_IMAGES') {
    const urls = event.data.urls;
    
    caches.open(CACHE_NAME).then((cache) => {
      const fetchPromises = urls.map((url) => {
        return fetch(url).then((response) => {
          if (response.status === 200) {
            cache.put(url, response.clone());
            console.log('Manually cached image:', url);
          }
          return response;
        }).catch((error) => {
          console.warn('Failed to cache image:', url, error);
        });
      });
      
      return Promise.all(fetchPromises);
    });
  }
}); 