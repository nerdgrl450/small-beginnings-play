const RELEASE = 'ee43884ef0ad8115';
const PREFIX = 'small-beginnings-';
const CACHE = PREFIX + RELEASE;
const ASSETS = [["app.js","sha256-zhBJixJCW1qJhmtOS24bil6pFKLNbjzNTjxbOF/wpJk="],["art/cooler.webp","sha256-/NyJVNuY+I/lXpWTtfJfhH1V+QBQHwGQIUpPmvQWfj0="],["art/customer-arthur.webp","sha256-XlNxY6wW19h/clsBxXNetwgTjCGTjDL1Y+KnlwICgJY="],["art/customer-nora.webp","sha256-0eYABc8FgabD3bEkqdbAMpLVhatV8lUKjkspvFeSFXg="],["art/customer-ollie.webp","sha256-CZOQTB269IM56CGbuaB9fBQny9OoYIaXO+U0tAUy7DY="],["art/customer.webp","sha256-MF9WD3uSynSfHHN6sWXcNpZvvNhz/kG2e/WNfrUi5Eo="],["art/garland.webp","sha256-EQ96i9yNykRmpTvGq+/W7FsWkofHgtQSspSf0aMg+LE="],["art/icon-192.png","sha256-6eqKk7vXj9rGqE9YVUGGBb21bk0Q/uW9XApvoIiBHnQ="],["art/icon-512.png","sha256-c9ym0akV4Xjd8DnJ8fQGLZdJWl8c6POlUlD7RgUwFkQ="],["art/lantern.webp","sha256-3vdr+0790Kjsio7wwxEoojfbN4c+8n93xsxg4wNB5+o="],["art/lemonade-prep-empty.webp","sha256-Ja/3r6FRiiTqohYPq5QyiVUVEiner0wmYBcjcWAiJi8="],["art/lemonade-prep.webp","sha256-sFC8D9YHhjFFeItSKyGc/S9HAC/C9SGI/vhGBLtgNFk="],["art/market.webp","sha256-9paqPqOvjlmPtFd9qpytIAVvaR74f31Rlwm8LgmzBew="],["art/planter.webp","sha256-h+TNjo0BcTezYZIoIdKpMP2XgYbWqyniHTMluVzP/1I="],["art/quilt.webp","sha256-qhiW9WM7ada91ml9RbxuFrVLf2n13kmmEDnx0uO09vs="],["art/room.webp","sha256-1QH6ev3Hc9ijor/Z7N323xNFHkM0O/VW+5ZuffRKIqk="],["art/shelter.webp","sha256-R3ba9wteD1u0Pu/NZ5bUdRhT8S5T77fZGWmfGQ0qQ70="],["art/stand-upgraded.webp","sha256-bZjQNfWtdqw0NDemMkWgvpbuFPnyFruxxZpBNWYOLTg="],["art/stand.webp","sha256-MAF9FID6ZCS/XkADD0iUtUqNWsdESduO1xP3B0udnGo="],["art/touch-icon.png","sha256-C89DvjjrN8JiWbTq8osu4hIif8Yqe3o9lp8a7gIsv7c="],["engine.js","sha256-QBWyj4afKQugAFh8/zgzZ8mMTHAyDxd5bULFdpngg1g="],["icons.js","sha256-0gx+GQuDV8DfXiDCXN2C9w4SUxIgbPjReCsuWNz6gKs="],["index.html","sha256-AI6aHKXHPa2l7SM7foyqojlGgPpZGZOilOoj69EvqAo="],["manifest.webmanifest","sha256-5MwGtb2X4d4gdpsyhQh1XhFrWT4WawJttQuKvDtJ4iM="],["prep.js","sha256-knerQP4JV7ZjTeZJ54h8nbLiyt2k9lsyDkHGTNkyIfU="],["save.js","sha256-oD1Z2GpUBpFtwpPhH5m/nieTGKab4jorMR13qpfc9TM="],["style.css","sha256-Wg1GtcA3aEMfNc0fC+7tMuDiomZBPSa6s6RzTQD8biA="],["traffic.js","sha256-QGFqKbAlrHdoPY0pjaL2o7Ax0aWhSb5wP3WD+2ZLZS4="]];
const root = new URL('./', self.location.href);
const shell = new URL('index.html', root).href;
const precached = new Map(ASSETS.map(([path, integrity]) => [new URL(path, root).href, integrity]));

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([...precached].map(([url, integrity]) => new Request(url, { cache: 'reload', integrity })));
    await self.skipWaiting();
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
