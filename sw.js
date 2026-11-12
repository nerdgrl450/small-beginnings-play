const RELEASE = '20d80efe605f4389';
const PREFIX = 'small-beginnings-';
const CACHE = PREFIX + RELEASE;
const ASSETS = ["app.js","art/cooler.webp","art/customer.webp","art/garland.webp","art/icon-192.png","art/icon-512.png","art/lantern.webp","art/market.webp","art/planter.webp","art/quilt.webp","art/room.webp","art/shelter.webp","art/stand-upgraded.webp","art/stand.webp","art/touch-icon.png","engine.js","icons.js","index.html","manifest.webmanifest","save.js","style.css"];
const root = new URL('./', self.location.href);
const shell = new URL('index.html', root).href;
const precached = new Set(ASSETS.map((path) => new URL(path, root).href));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([...precached].map((url) => new Request(url, { cache: 'reload' })));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== root.origin) return;
  const navigation = request.mode === 'navigate' &&
    (url.pathname === root.pathname || url.pathname === new URL(shell).pathname);
  if (!navigation && !precached.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(navigation ? shell : url.href);
    return saved ?? fetch(request);
  })());
});
