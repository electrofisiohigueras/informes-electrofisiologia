// ===================================================================
// Service Worker - Informes Electrofisiología (PWA)
// ===================================================================
// Estrategias:
//  - data.json: network-first (catálogos siempre frescos; offline cae al caché)
//  - js/css de la app: network-first (UNA recarga basta para ver la versión
//    publicada; offline cae al caché)
//  - navegación (index.html): network-first con respaldo en caché
//  - vendor/webfonts: cache-first con precache en install
// Solo se activa en HTTPS; la copia local (file://) no lo registra.
//
// Al publicar una nueva versión de la app, actualizar SW_VERSION para que el
// caché viejo se elimine en la activación y los colegas reciban los cambios.
const SW_VERSION = '2.1.0';
const CORE_CACHE = 'im-core-' + SW_VERSION;
const DATA_CACHE = 'im-data-' + SW_VERSION;
const CACHE_PREFIXES = ['im-core-', 'im-data-'];

const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './report-styles.css',
    './manifest.json',
    './data.json',
    './vendor/tailwind/tailwind.js',
    './vendor/fontawesome/css/all.min.css',
    './vendor/fontawesome/webfonts/fa-brands-400.woff2',
    './vendor/fontawesome/webfonts/fa-regular-400.woff2',
    './vendor/fontawesome/webfonts/fa-solid-900.woff2',
    './vendor/fontawesome/webfonts/fa-v4compatibility.woff2',
    './js/01-data.js',
    './js/02-state.js',
    './js/03-utils.js',
    './js/04-common-data.js',
    './js/05-procedures.js',
    './js/06-measurements.js',
    './js/07-persistence.js',
    './js/08-copy-report.js',
    './js/09-common-data-manage.js',
    './js/10-dialogs.js',
    './js/11-templates-staff-devices.js',
    './js/12-init.js',
    './js/13-report.js',
    './js/14-form-helpers.js',
    './js/15-bootstrap.js',
    './js/16-wizard.js'
];

// ---- Install: precache de todos los assets de la app ----
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CORE_CACHE)
            .then(cache => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// ---- Activate: limpiar cachés de versiones anteriores ----
self.addEventListener('activate', event => {
    const keep = [CORE_CACHE, DATA_CACHE];
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys
            .filter(key => CACHE_PREFIXES.some(prefix => key.startsWith(prefix)) && !keep.includes(key))
            .map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

// Mensaje para activar una nueva versión sin esperar recargas dobles.
self.addEventListener('message', event => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// ---- Fetch ----
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // data.json: siempre red primero (catálogos publicados recientes);
    // sin red, se responde con la última copia conocida.
    if (url.pathname.endsWith('/data.json')) {
        event.respondWith(
            fetch(request).then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(DATA_CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            }).catch(() =>
                caches.match(request).then(cached => cached ||
                    Response.error())
            )
        );
        return;
    }

    // JS/CSS de la app: red primero con respaldo en caché. Con cache-first,
    // cada release exigía DOS recargas (la primera aún servía la versión
    // anterior desde el caché del SW instalado). Network-first garantiza
    // que UNA recarga baste para ver la versión publicada; sin red, cae
    // al caché (offline sigue funcionando).
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(request).then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CORE_CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            }).catch(() =>
                caches.match(request).then(cached => cached ||
                    Response.error())
            )
        );
        return;
    }

    // Navegación (recarga de la página): red primero, caché como respaldo.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CORE_CACHE).then(cache => cache.put('./index.html', copy));
                }
                return response;
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Assets estáticos: caché primero (offline instantáneo),
    // con actualización del caché en segundo plano.
    event.respondWith(
        caches.match(request).then(cached => {
            const network = fetch(request).then(response => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CORE_CACHE).then(cache => cache.put(request, copy));
                }
                return response;
            }).catch(() => cached ? cached : Response.error());
            return cached || network;
        })
    );
});
