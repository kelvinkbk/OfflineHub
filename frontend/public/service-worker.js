// Service Worker for offline support
const CACHE_NAME = "offlinehub-v1";
const urlsToCache = ["/", "/index.html", "/src/main.jsx", "/src/App.jsx"];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()),
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Only cache http/https requests (ignore chrome-extension, data, etc.)
  const url = new URL(event.request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();

        // Cache successful responses only for http/https
        if (response.status === 200) {
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              try {
                cache.put(event.request, responseClone);
              } catch (error) {
                console.warn(
                  "Failed to cache request:",
                  event.request.url,
                  error,
                );
              }
            })
            .catch((error) => {
              console.warn("Cache error:", error);
            });
        }

        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((response) => {
          return response || new Response("Offline - resource not available");
        });
      }),
  );
});
