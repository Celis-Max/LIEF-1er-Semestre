/* Service worker del libro: guarda todos los archivos para que funcione sin conexión.
   La versión cambia sola cuando cambia cualquier archivo (la calcula armar.py). */
const VERSION = '1285f13884';
const CACHE = 'mampara-' + VERSION;
const ARCHIVOS = [
 "./",
 "app.js",
 "datos.js",
 "estilos.css",
 "fuentes/bebas-neue.woff2",
 "fuentes/fell-italica.woff2",
 "fuentes/fell.woff2",
 "fuentes/limelight.woff2",
 "fuentes/lora-400-italica.woff2",
 "fuentes/lora-400.woff2",
 "fuentes/lora-600.woff2",
 "fuentes/lora-700.woff2",
 "fuentes/playfair-700-italica.woff2",
 "fuentes/playfair-900.woff2",
 "fuentes/rye.woff2",
 "fuentes/special-elite.woff2",
 "img/hojas/C1.jpg",
 "img/hojas/C2.jpg",
 "img/hojas/C3.jpg",
 "img/hojas/C4.jpg",
 "img/hojas/C5.jpg",
 "img/hojas/D1.jpg",
 "img/hojas/D2.jpg",
 "img/hojas/D3.jpg",
 "img/hojas/D4.jpg",
 "img/hojas/D5.jpg",
 "img/hojas/D6.jpg",
 "img/hojas/K1.jpg",
 "img/hojas/K2.jpg",
 "img/hojas/K3.jpg",
 "img/hojas/K4.jpg",
 "img/hojas/K5.jpg",
 "img/hojas/K6.jpg",
 "img/hojas/M1.jpg",
 "img/hojas/M2.jpg",
 "img/hojas/M3.jpg",
 "img/hojas/M4.jpg",
 "img/hojas/M5.jpg",
 "img/hojas/M6.jpg",
 "img/hojas/O1.jpg",
 "img/hojas/O2.jpg",
 "img/hojas/O3.jpg",
 "img/hojas/O4.jpg",
 "img/hojas/O5.jpg",
 "img/iconos/apple-touch-icon-180.png",
 "img/iconos/icono-192.png",
 "img/iconos/icono-512.png",
 "img/iconos/icono-maskable-512.png",
 "img/logo-apan.svg",
 "img/logo-uaeh.svg",
 "img/papel-franja.jpg",
 "img/papel-hoja-0.jpg",
 "img/papel-hoja-1.jpg",
 "img/papel-hoja-2.jpg",
 "img/papel-hoja-3.jpg",
 "img/papel-hoja-4.jpg",
 "index.html",
 "manifest.webmanifest"
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mampara-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', e => { if (e.data === 'activar') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true})
      .then(r => r || (e.request.mode === 'navigate' ? caches.match('./') : undefined))
      .then(r => r || fetch(e.request)));
});
