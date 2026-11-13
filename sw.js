const RELEASE = '5518eee11741a1a2';
const PREFIX = 'small-beginnings-';
const CACHE = PREFIX + RELEASE;
const ASSETS = [["release-5518eee11741a1a2/app.js","sha256-V6WBaLDQBi7NIyzwVd4VGgG6wMwjCMAca8E24pqS05s="],["art/campaign-board-cutout.webp","sha256-ABHBs0FmYFqwuqJmZbKMtEQ7ycVL781ZJeiuL0XXv/A="],["art/campaign-board.webp","sha256-kbeZ05C6sxEeQbdT05Fyo5lh7CWbXRsuREJDFg9bRiQ="],["art/citrus-press-cutout.webp","sha256-qtbBsDl9bbS+6UjpmpcfL2wlkLzEXN7zSheqUYTII0A="],["art/citrus-press.webp","sha256-NgHMkyxrU1o+gTB9Wpw0gvNWHDZe8RZYm2lI3u/0z7o="],["art/cooler.webp","sha256-/NyJVNuY+I/lXpWTtfJfhH1V+QBQHwGQIUpPmvQWfj0="],["art/customer-arthur.webp","sha256-XlNxY6wW19h/clsBxXNetwgTjCGTjDL1Y+KnlwICgJY="],["art/customer-hazel.webp","sha256-45uuPavDpDSeTgpmOatmHuN2EleNcJQajcKrLBUldco="],["art/customer-kit.webp","sha256-rCIw7ZnX0ZaWiYKcheNPYG6300alysvmU3cS19/rQMs="],["art/customer-nora.webp","sha256-0eYABc8FgabD3bEkqdbAMpLVhatV8lUKjkspvFeSFXg="],["art/customer-ollie.webp","sha256-CZOQTB269IM56CGbuaB9fBQny9OoYIaXO+U0tAUy7DY="],["art/customer.webp","sha256-MF9WD3uSynSfHHN6sWXcNpZvvNhz/kG2e/WNfrUi5Eo="],["art/garland.webp","sha256-EQ96i9yNykRmpTvGq+/W7FsWkofHgtQSspSf0aMg+LE="],["art/icon-192.png","sha256-6eqKk7vXj9rGqE9YVUGGBb21bk0Q/uW9XApvoIiBHnQ="],["art/icon-512.png","sha256-c9ym0akV4Xjd8DnJ8fQGLZdJWl8c6POlUlD7RgUwFkQ="],["art/lantern.webp","sha256-3vdr+0790Kjsio7wwxEoojfbN4c+8n93xsxg4wNB5+o="],["art/lemonade-prep-empty.webp","sha256-Ja/3r6FRiiTqohYPq5QyiVUVEiner0wmYBcjcWAiJi8="],["art/lemonade-prep.webp","sha256-sFC8D9YHhjFFeItSKyGc/S9HAC/C9SGI/vhGBLtgNFk="],["art/market.webp","sha256-9paqPqOvjlmPtFd9qpytIAVvaR74f31Rlwm8LgmzBew="],["art/mint-cutout.webp","sha256-VQpo65jdwvbj+ARk1Yees0kwhzWNn4LZXg2coCvagpg="],["art/mint.webp","sha256-AaQaTyAmGWFVmq+x5455XE9MxM9J44pFk0G7CBCZd/I="],["art/planter.webp","sha256-h+TNjo0BcTezYZIoIdKpMP2XgYbWqyniHTMluVzP/1I="],["art/quilt.webp","sha256-qhiW9WM7ada91ml9RbxuFrVLf2n13kmmEDnx0uO09vs="],["art/room.webp","sha256-1QH6ev3Hc9ijor/Z7N323xNFHkM0O/VW+5ZuffRKIqk="],["art/shelter.webp","sha256-R3ba9wteD1u0Pu/NZ5bUdRhT8S5T77fZGWmfGQ0qQ70="],["art/stand-expanded.webp","sha256-ZTCSfUqCx9ASQ3yBkPbKAVOF19XPawoeULyMdeQNQBE="],["art/stand-roadside.webp","sha256-dXaEb6JqnmvkiNHAak4CYFhiH/UXhDnbMsbP8BjiwRM="],["art/stand-storefront.webp","sha256-YKSgccclf+pRXFwLFUUDYNIj8/Rucw5dl9Agdxy+5ig="],["art/stand-table.webp","sha256-FT31AOSTr55rsgxiXvyzAVAYOQ52pWreLbMZ7MmUWqw="],["art/stand-upgraded.webp","sha256-bZjQNfWtdqw0NDemMkWgvpbuFPnyFruxxZpBNWYOLTg="],["art/stand.webp","sha256-MAF9FID6ZCS/XkADD0iUtUqNWsdESduO1xP3B0udnGo="],["art/touch-icon.png","sha256-C89DvjjrN8JiWbTq8osu4hIif8Yqe3o9lp8a7gIsv7c="],["release-5518eee11741a1a2/business.js","sha256-mbWMc+KzUPzXzI6cM5IJuYEp5TMWe+rv1FUy/PAbZcc="],["release-5518eee11741a1a2/engine.js","sha256-vn0n2v41mLNYHiQ5LHg18eKSXMdGakalhnUTOWo/zjE="],["release-5518eee11741a1a2/icons.js","sha256-0gx+GQuDV8DfXiDCXN2C9w4SUxIgbPjReCsuWNz6gKs="],["index.html","sha256-i9kM9sQFXv37G46sKA0S9jyB5pGqPxcAebQo2wc0sFA="],["manifest.webmanifest","sha256-5MwGtb2X4d4gdpsyhQh1XhFrWT4WawJttQuKvDtJ4iM="],["release-5518eee11741a1a2/prep.js","sha256-KqOB4l1U0yaRCQkZ6m9ydIlLw0NWCp6WnciYw1/PpwA="],["release-5518eee11741a1a2/save.js","sha256-FWpK32psU4L3fDBratwiJAt/P7j7J7uDuEE8y7ZKP2w="],["release-5518eee11741a1a2/style.css","sha256-I99jXvUriLCq/jWpX0PYoJ5Y/Q97IZ7b+YKB7VsdxjQ="],["release-5518eee11741a1a2/traffic.js","sha256-ADoll7Cb62s6aIrna1NE6Kw764GCqIW1LnvLFu2j1iw="]];
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
