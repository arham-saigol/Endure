/* Endure service worker — app shell + static asset caching. */
const CACHE = "endure-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.add(new Request("/", { cache: "reload" })).catch(() => {});
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isCacheableAsset(req, url) {
  return (
    ["font", "image", "script", "style"].includes(req.destination) ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:css|js|mjs|png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)
  );
}

function isCacheableResponse(res) {
  return res?.ok && (res.type === "basic" || res.type === "default");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache the AI routes or InstantDB traffic.
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.endsWith("instantdb.com") ||
    url.hostname.endsWith("instantdb.net")
  ) {
    return;
  }

  // Navigations: network-first, fall back to the cached shell when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (isCacheableResponse(fresh)) {
            const cache = await caches.open(CACHE);
            cache.put(req, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Same-origin static assets (JS, CSS, self-hosted fonts): cache-first.
  if (url.origin === self.location.origin && isCacheableAsset(req, url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (isCacheableResponse(fresh)) {
            const cache = await caches.open(CACHE);
            cache.put(req, fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});
