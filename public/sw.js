// ============================================
// 環島コックピット - Service Worker
// オフライン対応 + 天気 API キャッシュ
// ============================================

const VERSION = 'v1';
const SHELL_CACHE = `huandao-shell-${VERSION}`;       // App shell (HTML/JS/CSS)
const ASSET_CACHE = `huandao-assets-${VERSION}`;      // Static assets (JSON/PNG/fonts)
const API_CACHE = `huandao-api-${VERSION}`;           // Open-Meteo responses
const ALL_CACHES = [SHELL_CACHE, ASSET_CACHE, API_CACHE];

// Precache minimum set — the SPA shell and manifest/icons.
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// ---------- Install ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Use { cache: 'reload' } to bypass HTTP cache on precache
      Promise.all(
        PRECACHE.map((url) =>
          cache
            .add(new Request(url, { cache: 'reload' }))
            .catch((err) => console.warn('[SW] Precache skip:', url, err)),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

// ---------- Activate ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// ---------- Fetch ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Open-Meteo API: stale-while-revalidate
  if (
    url.hostname === 'api.open-meteo.com' ||
    url.hostname.endsWith('.open-meteo.com')
  ) {
    event.respondWith(staleWhileRevalidate(req, API_CACHE));
    return;
  }

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first (to get latest shell), fall back to cached '/'
  if (req.mode === 'navigate') {
    event.respondWith(navigationHandler(req));
    return;
  }

  // Static assets (JS/CSS/JSON/fonts/images): cache-first
  event.respondWith(cacheFirst(req, pickCacheForAsset(url)));
});

function pickCacheForAsset(url) {
  const p = url.pathname;
  if (
    p.endsWith('.json') ||
    p.endsWith('.png') ||
    p.endsWith('.jpg') ||
    p.endsWith('.svg') ||
    p.endsWith('.woff') ||
    p.endsWith('.woff2') ||
    p.endsWith('.ttf')
  ) {
    return ASSET_CACHE;
  }
  return SHELL_CACHE;
}

// ---------- Strategies ----------
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    // Last-resort fallback: anything in any cache
    const any = await caches.match(request);
    if (any) return any;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  // If we have a cached response, return it immediately; otherwise wait for network.
  return cached || networkFetch || new Response('Offline', { status: 503 });
}

async function navigationHandler(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put('/', res.clone());
    return res;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    const cached = (await cache.match(request)) || (await cache.match('/'));
    if (cached) return cached;
    return new Response(
      '<!DOCTYPE html><html lang="ja"><meta charset="utf-8"><title>Offline</title><body style="font-family:system-ui;padding:2rem"><h1>オフラインです</h1><p>一度オンラインで起動すると、以後はオフラインでもアプリが動作します。</p></body></html>',
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
}

// Allow the page to trigger an immediate activation after update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
