// Service Worker mínimo para Enganche.
//
// Esta app es un marketplace en vivo (ofertas, chats, pagos) — cachear
// agresivamente rompería la confianza del usuario mostrando datos viejos.
// Por eso este Service Worker es deliberadamente conservador:
//
// - Solo precachea el puñado de archivos verdaderamente estáticos
//   (la página offline, el manifest, los íconos).
// - Páginas y llamadas a /api/** SIEMPRE van a la red — nunca se sirven
//   desde caché, para no mostrar ofertas, mensajes o estados de pago
//   desactualizados.
// - Si una navegación (cambiar de página) falla por falta de conexión,
//   se muestra /offline.html en vez de un error en blanco del navegador.
const CACHE_VERSION = "enganche-v1";
const PRECACHE = [
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE_VERSION).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Navegación entre páginas (cambiar de URL): red primero, si falla por
  // no tener conexión, muestra la página offline en vez de un error crudo.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Todo lo demás (API, datos, HTML fuera de navegación) pasa directo a
  // la red sin intervención — nunca debe verse una respuesta cacheada de
  // /api/** ni de contenido dinámico.
  if (request.url.includes("/api/")) return;

  // Assets estáticos propios (íconos, manifest): cache-first, con
  // actualización de fondo — no cambian seguido y así cargan al instante.
  const esEstaticoPropio = PRECACHE.some((ruta) => request.url.endsWith(ruta));
  if (esEstaticoPropio) {
    event.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ||
          fetch(request).then((respuesta) => {
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, respuesta.clone()));
            return respuesta;
          })
      )
    );
  }
});
