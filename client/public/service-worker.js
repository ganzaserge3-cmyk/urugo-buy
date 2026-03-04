const CACHE_NAME = "urugobuy-cache-v1";
const URLS_TO_CACHE = ["/", "/shop", "/favicon.png", "/logo-house.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request).catch(() => caches.match("/"));
    }),
  );
});

