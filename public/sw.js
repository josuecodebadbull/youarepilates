// Hand-rolled service worker for the student PWA shell.
//
// Firestore data (schedules, credits, bookings) is NOT handled here — it goes through
// the SDK's own IndexedDB persistence (see src/lib/firebase/client.ts), because a
// real-time `onSnapshot` listener isn't a plain cacheable HTTP request. This worker only
// caches static assets, which is what the spec's SWR/network-first/cache-first recipes
// actually apply to:
//   - cache-first:   fonts, icons, branding assets, hashed Next.js build chunks
//   - network-first: HTML navigations (so the app shell still opens once offline)
const CACHE_NAME = "yap-shell-v1";
const STATIC_CACHE_PATTERNS = [/\/icons\//, /\/_next\/static\//, /\.(woff2?|ttf|otf)$/];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(url));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  }
});
