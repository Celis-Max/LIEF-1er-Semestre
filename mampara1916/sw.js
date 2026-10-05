/* Service worker del libro: lo guarda para que funcione sin conexión, sin estorbar la primera carga.
   · Al instalarse guarda lo esencial (NUCLEO: la app, sus letras, papeles y miniaturas).
   · Las fotos completas y los sonidos (HUELLAS) se guardan conforme se usan; con buena conexión (y fuera del
     modo lite) la app pide «completar» y se guardan en calma. Se conservan entre versiones mientras no cambien.
   La versión, el núcleo y las huellas los escribe armar.py (python3 armar.py). */
const VERSION = '31ccadd55b';
const CACHE = 'mampara-' + VERSION;
const MEDIOS = 'mampara-medios';
const NUCLEO = [
 "./",
 "app.js",
 "datos.js",
 "estilos.css",
 "fondos.js",
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
 "img/hojas/mini/C1.webp",
 "img/hojas/mini/C2.webp",
 "img/hojas/mini/C3.webp",
 "img/hojas/mini/C4.webp",
 "img/hojas/mini/C5.webp",
 "img/hojas/mini/D1.webp",
 "img/hojas/mini/D2.webp",
 "img/hojas/mini/D3.webp",
 "img/hojas/mini/D4.webp",
 "img/hojas/mini/D5.webp",
 "img/hojas/mini/D6.webp",
 "img/hojas/mini/K1.webp",
 "img/hojas/mini/K2.webp",
 "img/hojas/mini/K3.webp",
 "img/hojas/mini/K4.webp",
 "img/hojas/mini/K5.webp",
 "img/hojas/mini/K6.webp",
 "img/hojas/mini/M1.webp",
 "img/hojas/mini/M2.webp",
 "img/hojas/mini/M3.webp",
 "img/hojas/mini/M4.webp",
 "img/hojas/mini/M5.webp",
 "img/hojas/mini/M6.webp",
 "img/hojas/mini/O1.webp",
 "img/hojas/mini/O2.webp",
 "img/hojas/mini/O3.webp",
 "img/hojas/mini/O4.webp",
 "img/hojas/mini/O5.webp",
 "img/iconos/apple-touch-icon-180.png",
 "img/iconos/icono-192.png",
 "img/iconos/icono-32.png",
 "img/iconos/icono-512.png",
 "img/iconos/icono-64.png",
 "img/iconos/icono-maskable-512.png",
 "img/logo-apan.webp",
 "img/logo-uaeh.webp",
 "img/papel-franja.webp",
 "img/papel-hoja-0.jpg",
 "img/papel-hoja-1.jpg",
 "img/papel-hoja-2.jpg",
 "img/papel-hoja-3.jpg",
 "img/papel-hoja-4.jpg",
 "index.html",
 "inmersivo.js",
 "manifest.webmanifest",
 "piezas.js",
 "sonido.js"
];
const HUELLAS = {
 "img/hojas/web/C1.webp": "fe45d53a11",
 "img/hojas/web/C2.webp": "4b0cf040ff",
 "img/hojas/web/C3.webp": "275805d42d",
 "img/hojas/web/C4.webp": "7e9a35144a",
 "img/hojas/web/C5.webp": "ed0346edd0",
 "img/hojas/web/D1.webp": "72d8b3003f",
 "img/hojas/web/D2.webp": "1da73baa57",
 "img/hojas/web/D3.webp": "7706438a60",
 "img/hojas/web/D4.webp": "1e287ee959",
 "img/hojas/web/D5.webp": "a42967e831",
 "img/hojas/web/D6.webp": "f8c2f07468",
 "img/hojas/web/K1.webp": "003202aeb7",
 "img/hojas/web/K2.webp": "0e61ad9a06",
 "img/hojas/web/K3.webp": "1297bc5a78",
 "img/hojas/web/K4.webp": "51ea562396",
 "img/hojas/web/K5.webp": "c92d89e5bb",
 "img/hojas/web/K6.webp": "3e1c511df6",
 "img/hojas/web/M1.webp": "e0db311349",
 "img/hojas/web/M2.webp": "11c7e28908",
 "img/hojas/web/M3.webp": "e2e9ea613c",
 "img/hojas/web/M4.webp": "a86757504c",
 "img/hojas/web/M5.webp": "1b95b9df1d",
 "img/hojas/web/M6.webp": "6f31c72974",
 "img/hojas/web/O1.webp": "15a1db729d",
 "img/hojas/web/O2.webp": "c9d1c7938c",
 "img/hojas/web/O3.webp": "c4a8c3de35",
 "img/hojas/web/O4.webp": "d4bf943cdd",
 "img/hojas/web/O5.webp": "cb2a2cb52d",
 "sonidos/caja.mp3": "8289f9ecb8",
 "sonidos/golondrina-1922.mp3": "7af0e75071",
 "sonidos/maquina.mp3": "5cd69d7dee",
 "sonidos/silbato.mp3": "7b1b694184"
};

const ruta = url => new URL(url, location.href).pathname.slice(new URL('./', location.href).pathname.length);

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(NUCLEO))));
self.addEventListener('activate', e => e.waitUntil(Promise.all([
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mampara-') && k !== CACHE && k !== MEDIOS).map(k => caches.delete(k)))),
  // de las fotos y sonidos guardados, se borran los que cambiaron (los demás no se vuelven a bajar)
  caches.open(MEDIOS).then(c => c.keys().then(rs => Promise.all(rs.map(r => c.match(r).then(m => { if (!m || m.headers.get('X-Huella') !== HUELLAS[ruta(r.url)]) return c.delete(r); }))))),
]).then(() => self.clients.claim())));

// guarda una foto o un sonido con su huella
function guardarMedio(c, p, resp){
  const h = new Headers(resp.headers); h.set('X-Huella', HUELLAS[p]);
  return resp.blob().then(b => c.put(p, new Response(b, {status: 200, statusText: 'OK', headers: h})));
}
let completando = null;
function completar(){
  return completando || (completando = caches.open(MEDIOS).then(c => {
    const faltan = Object.keys(HUELLAS);
    const uno = () => {
      const p = faltan.shift(); if (!p) return Promise.resolve();
      return c.match(p).then(m => m ? null : fetch(p, {priority: 'low'}).then(r => (r.ok && r.status === 200 ? guardarMedio(c, p, r) : null)))
        .catch(() => null).then(uno);
    };
    return Promise.all([uno(), uno()]);          // de dos en dos, sin prisa
  }).finally(() => { completando = null; }));
}
self.addEventListener('message', e => {
  if (e.data === 'activar') self.skipWaiting();
  else if (e.data === 'completar') e.waitUntil(completar());
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const rango = e.request.headers.get('range'), p = ruta(u.href);
  e.respondWith(
    caches.match(e.request, {ignoreSearch: true, cacheName: CACHE})
      .then(r => r || (e.request.mode === 'navigate' ? caches.match('./', {cacheName: CACHE}) : undefined))
      .then(r => r || (HUELLAS[p] ? caches.open(MEDIOS).then(c => c.match(p)) : undefined))
      .then(r => {
        if (r) return rango ? parcial(r, rango) : r;
        return fetch(e.request).then(resp => {
          // una foto o un sonido completo que llegó de la red se guarda para la próxima (las respuestas por partes no)
          if (HUELLAS[p] && resp.ok && resp.status === 200 && !rango){ const copia = resp.clone(); caches.open(MEDIOS).then(c => guardarMedio(c, p, copia)).catch(() => {}); }
          return resp;
        });
      }));
});
// el audio se pide por pedazos (Range): Safari sólo lo reproduce si la respuesta es «206 Partial Content»
function parcial(r, rango){
  return r.arrayBuffer().then(buf => {
    const total = buf.byteLength, m = /bytes=(\d*)-(\d*)/.exec(rango);
    let ini = m && m[1] ? +m[1] : 0, fin = m && m[2] ? +m[2] : total - 1;
    if (m && !m[1] && m[2]){ ini = Math.max(0, total - +m[2]); fin = total - 1; }           // «bytes=-N»: los últimos N
    if (ini >= total) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${total}`}});
    fin = Math.min(fin, total - 1);
    return new Response(buf.slice(ini, fin + 1), {status: 206, headers: {
      'Content-Type': r.headers.get('Content-Type') || 'application/octet-stream', 'Content-Range': `bytes ${ini}-${fin}/${total}`,
      'Content-Length': String(fin - ini + 1), 'Accept-Ranges': 'bytes'}});
  });
}
