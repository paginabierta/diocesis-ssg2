// Service worker: deja la app funcionando sin internet (lo local).
// Al cambiar cualquier archivo, suba el número de VERSION para que los teléfonos se actualicen.
const VERSION = 'diocesis-v1';
const ARCHIVOS = [
  './', 'index.html', 'estilos.css', 'app.js', 'datos.js', 'notas.html', 'privacidad.html',
  'manifest.json', 'escudo.png', 'icono-192.png', 'icono-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(ARCHIVOS.map(a => c.add(a).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // lo externo va directo a internet
  // Primero la red (para recibir cambios), y si no hay conexión, la copia guardada
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(VERSION).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
