const RELEASE = '9c835b7b2956374f';
const PREFIX = 'small-beginnings-';
const CACHE = PREFIX + RELEASE;
const ASSETS = [["release-9c835b7b2956374f/app.js","sha256-whol5VZigeFGBqgZKqPC1YWhODh4Fz0vVICir+7dbxU="],["art/campaign-board-cutout.webp","sha256-ABHBs0FmYFqwuqJmZbKMtEQ7ycVL781ZJeiuL0XXv/A="],["art/campaign-board.webp","sha256-kbeZ05C6sxEeQbdT05Fyo5lh7CWbXRsuREJDFg9bRiQ="],["art/citrus-press-cutout.webp","sha256-qtbBsDl9bbS+6UjpmpcfL2wlkLzEXN7zSheqUYTII0A="],["art/citrus-press.webp","sha256-NgHMkyxrU1o+gTB9Wpw0gvNWHDZe8RZYm2lI3u/0z7o="],["art/cooler.webp","sha256-/NyJVNuY+I/lXpWTtfJfhH1V+QBQHwGQIUpPmvQWfj0="],["art/cottage-bedroom-empty.webp","sha256-v4t1JTZw6RYcplgrYTb1KIvZpR1jPG30Zfhw92WmJF4="],["art/cottage-bedroom.webp","sha256-bunttKU3iAB/xWraYhfoQIuDASTvNHxVcn+0MpCD4rE="],["art/cottage-garden.webp","sha256-PYXRu6k4ZHUfBfvyJEm3NBvFfLItDXfRljVN/TQtCRE="],["art/cottage-sitting.webp","sha256-PaALbEZSfG20JIB6Bq3tPrfhF7Ycsl13pW2gWJf4FDY="],["art/customer-arthur.webp","sha256-XlNxY6wW19h/clsBxXNetwgTjCGTjDL1Y+KnlwICgJY="],["art/customer-hazel.webp","sha256-45uuPavDpDSeTgpmOatmHuN2EleNcJQajcKrLBUldco="],["art/customer-kit.webp","sha256-rCIw7ZnX0ZaWiYKcheNPYG6300alysvmU3cS19/rQMs="],["art/customer-nora.webp","sha256-0eYABc8FgabD3bEkqdbAMpLVhatV8lUKjkspvFeSFXg="],["art/customer-ollie.webp","sha256-CZOQTB269IM56CGbuaB9fBQny9OoYIaXO+U0tAUy7DY="],["art/customer.webp","sha256-MF9WD3uSynSfHHN6sWXcNpZvvNhz/kG2e/WNfrUi5Eo="],["art/furniture-armchair.webp","sha256-bnqWH6pFbNP6qVGwOWuJGhG9XCcLVuMenh6UzhgiSEc="],["art/furniture-bookcase.webp","sha256-vHn35OjV4SXIZhN6pHciRg3+yBkcVIgPszjpb2BvfCo="],["art/furniture-botanical-print.webp","sha256-y4rb78YUbNO+ha3xXgIS6bdalVEWk+4wZ4OlDWq+0Xk="],["art/furniture-curtains.webp","sha256-eE/jfyWPKTPRdMkUpPxgYEGTB3DqbahXS9KDs0jOXHY="],["art/furniture-dresser.webp","sha256-bwe6kFgIXoRKurJNC6vtxfV1hAOn8PYopOOc7d3Mk5c="],["art/furniture-fern.webp","sha256-v7ZwTHsiKVV+mexDnG2DBie7diWXwfERFiPB7HeQW1c="],["art/furniture-floor-lamp.webp","sha256-M0F8bqA1wtwK/KQWp67VdkQ0YtmRBZ9GCKz7fZXMU/o="],["art/furniture-garden-pot.webp","sha256-yC34LAUqf6wthhIon2vvfNP2gB55SRQvisI5B1qJMAU="],["art/furniture-mirror.webp","sha256-IYSG2I3AtD8lvRboADm4uPfqSiJYNtWc6rP/s8+9KAg="],["art/furniture-oak-bed.webp","sha256-XjuhnXwoQDjFPhhxIft6Qq9hf1wEbAoDzLLTJ57mvno="],["art/furniture-rose-bedding.webp","sha256-oaIb5gV+yt2CgcBQx6zR9eeN8G66wuac8EOPpXohzoQ="],["art/furniture-side-table.webp","sha256-X8QaWdDxdV5d7SMKb+f8hgdDF5uKF6h6uJp6t5s96z4="],["art/furniture-sofa.webp","sha256-mLSeFyAR/yScrNYqsPo7Qs5v8dhhy4ThokmUeow/Zxc="],["art/furniture-striped-bench.webp","sha256-s81phLckL8d5vSyNEetPMIF+05ypli67/GRI2OxsZBg="],["art/furniture-wall-shelf.webp","sha256-4RhoxEigOBzrMuzFGM5VPa9bHn9JDqOw6MFN1sxGcK4="],["art/furniture-woven-rug.webp","sha256-66ki76b8S9seRhevxS2P1HCR52N3p+p2kOO0k5bqSVU="],["art/garland.webp","sha256-EQ96i9yNykRmpTvGq+/W7FsWkofHgtQSspSf0aMg+LE="],["art/icon-192.png","sha256-6eqKk7vXj9rGqE9YVUGGBb21bk0Q/uW9XApvoIiBHnQ="],["art/icon-512.png","sha256-c9ym0akV4Xjd8DnJ8fQGLZdJWl8c6POlUlD7RgUwFkQ="],["art/lantern.webp","sha256-3vdr+0790Kjsio7wwxEoojfbN4c+8n93xsxg4wNB5+o="],["art/lemonade-prep-empty.webp","sha256-Ja/3r6FRiiTqohYPq5QyiVUVEiner0wmYBcjcWAiJi8="],["art/lemonade-prep.webp","sha256-sFC8D9YHhjFFeItSKyGc/S9HAC/C9SGI/vhGBLtgNFk="],["art/market.webp","sha256-9paqPqOvjlmPtFd9qpytIAVvaR74f31Rlwm8LgmzBew="],["art/mint-cutout.webp","sha256-VQpo65jdwvbj+ARk1Yees0kwhzWNn4LZXg2coCvagpg="],["art/mint.webp","sha256-AaQaTyAmGWFVmq+x5455XE9MxM9J44pFk0G7CBCZd/I="],["art/planter.webp","sha256-h+TNjo0BcTezYZIoIdKpMP2XgYbWqyniHTMluVzP/1I="],["art/quilt.webp","sha256-qhiW9WM7ada91ml9RbxuFrVLf2n13kmmEDnx0uO09vs="],["art/room-basic-empty.webp","sha256-e3qSvAbSXK5YDLQzsx8eMf4yLjM/yvZdl9TXCb4OiCA="],["art/room-basic.webp","sha256-Qnsemdf3kg0XvXrGBwRG9llNWkQ1SH9di8M0sm2A9kU="],["art/room.webp","sha256-1QH6ev3Hc9ijor/Z7N323xNFHkM0O/VW+5ZuffRKIqk="],["art/shelter.webp","sha256-R3ba9wteD1u0Pu/NZ5bUdRhT8S5T77fZGWmfGQ0qQ70="],["art/staff-ellis.webp","sha256-vj/yZ+vIq2WQDOX6242xtfu/rb1LLBQexuIOSQbmGOQ="],["art/staff-mina.webp","sha256-UmJHdr5YxFV/HMk+mg41WZKQlsHthDbstzLqRa20b9U="],["art/staff-rowan.webp","sha256-CQ0XKSGtIhcz+Cz52zB9uj+shh91rfArm8jiAUpiO80="],["art/stand-expanded.webp","sha256-ZTCSfUqCx9ASQ3yBkPbKAVOF19XPawoeULyMdeQNQBE="],["art/stand-roadside.webp","sha256-dXaEb6JqnmvkiNHAak4CYFhiH/UXhDnbMsbP8BjiwRM="],["art/stand-storefront.webp","sha256-YKSgccclf+pRXFwLFUUDYNIj8/Rucw5dl9Agdxy+5ig="],["art/stand-table.webp","sha256-FT31AOSTr55rsgxiXvyzAVAYOQ52pWreLbMZ7MmUWqw="],["art/stand-upgraded.webp","sha256-bZjQNfWtdqw0NDemMkWgvpbuFPnyFruxxZpBNWYOLTg="],["art/stand.webp","sha256-MAF9FID6ZCS/XkADD0iUtUqNWsdESduO1xP3B0udnGo="],["art/touch-icon.png","sha256-C89DvjjrN8JiWbTq8osu4hIif8Yqe3o9lp8a7gIsv7c="],["release-9c835b7b2956374f/business.js","sha256-mbWMc+KzUPzXzI6cM5IJuYEp5TMWe+rv1FUy/PAbZcc="],["release-9c835b7b2956374f/engine.js","sha256-B741ams8pltt2TbrtRTMVPwHPPI/VLGlR6BgLABn1do="],["release-9c835b7b2956374f/housing.js","sha256-JTQsnb6UhRWaVB0enyRylGEOJ4t3LBm2jTSAajueRwE="],["release-9c835b7b2956374f/icons.js","sha256-K3RNzXF4pJUTkpDwhPGfQ1BBKwl/INa11S/w0SET5EY="],["index.html","sha256-vGlBa48ipvQEyR+c/QH/aC9cN6U8wKzqCNqgTTtOOtg="],["manifest.webmanifest","sha256-5MwGtb2X4d4gdpsyhQh1XhFrWT4WawJttQuKvDtJ4iM="],["release-9c835b7b2956374f/music-audio.js","sha256-gXz81fR6WqsDm2hdWr1KyVXxN4O6bfALRUufhU6GLhc="],["release-9c835b7b2956374f/music-store.js","sha256-03BiRQ19uU1OxuO+LW4q/yrt+WEr01RBgHyOCmQGjf8="],["release-9c835b7b2956374f/music.js","sha256-nKid022cRcmKz6Y6Kv/gOz9Ac9P5mbEisaWaHSToNJk="],["release-9c835b7b2956374f/prep.js","sha256-KqOB4l1U0yaRCQkZ6m9ydIlLw0NWCp6WnciYw1/PpwA="],["release-9c835b7b2956374f/save.js","sha256-b8ryOW+RZ8dW0xanI0Gcp1zapWv2fQmIY3ZZseCPduw="],["release-9c835b7b2956374f/staff.js","sha256-/hgXbB7vrzhWXJSSLJNZPXouUOwomygCNgKJso6IHGs="],["release-9c835b7b2956374f/style.css","sha256-X1lRH2ibG9xYPK7EwgKeXzOLiAkrCJ8ctvY1+F/XtKk="],["release-9c835b7b2956374f/traffic.js","sha256-ADoll7Cb62s6aIrna1NE6Kw764GCqIW1LnvLFu2j1iw="]];
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
