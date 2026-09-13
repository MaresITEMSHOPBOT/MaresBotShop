/* Service worker pro aplikaci Kontrola dat spotřeby.
   Drží kopii aplikace v zařízení, takže funguje i bez internetu.
   Verzi zvyš při změně souborů – stará mezipaměť se pak smaže. */

const CACHE = 'spotreba-v1';
const ASSETS = [
    './',
    './spotreba.html',
    './manifest.webmanifest',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            // Chybějící soubor (např. './' na statickém hostingu) nesmí shodit instalaci.
            .then(cache => Promise.all(ASSETS.map(url => cache.add(url).catch(() => null))))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        caches.match(req, { ignoreSearch: true }).then(cached => {
            const fromNetwork = fetch(req).then(res => {
                if (res && res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then(cache => cache.put(req, copy));
                }
                return res;
            }).catch(() => cached);
            // Uložená kopie se vrátí hned, na pozadí se stáhne aktuální verze.
            return cached || fromNetwork;
        })
    );
});
