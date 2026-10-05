(() => {
'use strict';
/* =====================================================================
   LIBRO DIGITAL · MAMPARA «MÉXICO 1916–1940»
   Los datos viven en datos.js (window.DATOS): la tabla de indicadores, las 28 hojas y los dibujos.
   El sonido vive en sonido.js (window.Sonido): el gramófono, el papel y las señales de cada etapa.
   piezas.js, fondos.js e inmersivo.js se piden cuando hacen falta (según el modo: lite, normal o inmersivo).
   ===================================================================== */
const {serie: SERIE, hojas: HOJAS, simbolos: SIMBOLOS} = window.DATOS;
const PWA = true;         // true en la versión instalable (historial, instalación y trabajo sin conexión)
const NADA = () => {};
const SON = window.Sonido || {disponible: false, activo: false, despertar: NADA, alCambiar: NADA, alternar: NADA, musica: NADA, enfoque: NADA, fx: NADA, etapa: NADA, precargar: NADA};

const A0 = 1916, N = 25;
const PERIODOS = [
  {k:0, nombre:'Venustiano Carranza', corto:'Carranza', desde:1916, hasta:1920, lema:'Revolución y Constitución de 1917', iconos:['pergamino','rifles']},
  {k:1, nombre:'Álvaro Obregón',      corto:'Obregón',  desde:1921, hasta:1924, lema:'Reconstrucción, educación y radio', iconos:['libro','antena']},
  {k:2, nombre:'Plutarco Elías Calles',corto:'Calles',  desde:1925, hasta:1928, lema:'Nace el Banco de México',           iconos:['banco','cruz']},
  {k:3, nombre:'El Maximato',         corto:'Maximato', desde:1929, hasta:1934, lema:'La Gran Depresión',                 iconos:['flecha','monedas','bellas_artes']},
  {k:4, nombre:'Lázaro Cárdenas',     corto:'Cárdenas', desde:1935, hasta:1940, lema:'La expropiación petrolera',         iconos:['torre','gota']},
];
const TINTA  = ['#6b4a1f','#8f3a17','#1f4d39','#3f4853','#1a1208'];
const LAVADO = [.22,.18,.19,.21,.17];
const AZUL = '#1f3a5c', SANGRE = '#7a0f10', PETROLEO = '#0d0a06', HUESO = '#f6efdc';
const MURO = TINTA.map(c => mezcla(c, '#15100b', .78));  // la pared de la sala, teñida por la etapa que se ve
const PIB_MAX = 760, DEU_MAX = 860;                     // mismas escalas que la mampara impresa
// detalles de cada etapa: a = año (x), y = altura (fracción de la gráfica, desde la base), t = tamaño (fracción del alto de la gráfica)
const DECO = [
  {k:0,s:'billete', a:1917.38,y:.125,t:.17,rot:-10,op:.5},
  {k:0,s:'billete', a:1918.22,y:.085,t:.14,rot:7,op:.4},
  {k:0,s:'mancha19',a:1919.0, y:.15, t:.3, c:SANGRE,op:.7, nota:'Zapata, 1919'},
  {k:0,s:'mancha20',a:1920.03,y:.16, t:.38,c:SANGRE,op:.72,nota:'Carranza, 1920'},
  {k:1,s:'mancha23',a:1923.5, y:.3,  t:.3, c:SANGRE,op:.7, nota:'Villa, 1923'},
  {k:2,s:'moneda',  a:1926.0, y:.16, t:.25,rot:-8,op:.65},
  {k:2,s:'mancha28',a:1928.0, y:.17, t:.34,c:SANGRE,op:.7, nota:'Obregón, 1928'},
  {k:3,s:'recorte', a:1929.3, y:.14, t:.19,rot:-4,op:.8},
  {k:3,s:'mancha30',a:1930.6, y:.15, t:.28,c:SANGRE,op:.68,nota:'Atentado a Ortiz Rubio, 1930'},
  {k:4,s:'trigo',   a:1936.0, y:.14, t:.19,rot:-6,op:.8, nota:'Reparto agrario'},
  {k:4,s:'locomotora',a:1937.0,y:.14,t:.19,op:.85,nota:'Ferrocarriles, 1937'},
  {k:4,s:'mancha38',a:1938.05,y:.14, t:.34,c:PETROLEO,op:.85,nota:'Petróleo, 1938'},
];
const JUGABLES = new Set(['pergamino', 'libro', 'antena', 'banco', 'flecha', 'monedas', 'bellas_artes', 'torre', 'gota', 'billete', 'moneda', 'recorte', 'trigo', 'locomotora']);   // las armas, la cruz y las manchas no se tocan
const ICONO_LUPA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="5.6"/><path d="M14.2 14.2l5.3 5.3"/><path d="M7.6 8.4a3 3 0 0 1 2.2-1.6" stroke-width="1.3" opacity=".7"/></svg>';

/* ============================ utilidades ============================ */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const anima = () => !reduce.matches;
const raton = matchMedia('(hover: hover) and (pointer: fine)');
const num = (v, d = 1) => v.toLocaleString('es-MX', {minimumFractionDigits: d, maximumFractionDigits: d});
const signo = v => (v < 0 ? '−' : '+') + num(Math.abs(v), Math.abs(v) < 10 ? 2 : 1).replace(/\.?0+$/, '');
const idx = a => a - A0;
const etapaDe = a => PERIODOS.find(p => a >= p.desde && a <= p.hasta);
const icono = (n, extra = '') => `<svg viewBox="${SIMBOLOS[n].vb}" ${extra}>${SIMBOLOS[n].svg}</svg>`;
const anioCorto = t => (t.match(/\d{4}(?:[–-]\d{4})?/) || [t])[0];
// valor de una serie en un año o en el borde entre dos años (a ± 0.5)
function valor(serie, a){
  if (Number.isInteger(a)) return serie[idx(a)];
  const lo = Math.floor(a), hi = Math.ceil(a);
  if (lo < A0) return serie[idx(hi)];
  if (hi > A0 + N - 1) return serie[idx(lo)];
  return (serie[idx(lo)] + serie[idx(hi)]) / 2;
}
function azar(semilla){ let s = semilla; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function mezcla(a, b, t){ const c = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), x = c(a), y = c(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

const app = $('#app'), sala = $('#sala'), franja = $('#franja'), lienzo = $('#lienzo'), colgadas = $('#colgadas'),
      eje = $('#eje'), periodosEl = $('#periodos'), tira = $('#tira'), ficha = $('#ficha'), columna = $('#columna'),
      visor = $('#visor'), rollo = $('#rollo'), hojaEl = $('#hoja'), aviso = $('#aviso'), panel = $('#panel'), mapa = $('#mapa'),
      tapa = $('#tapa'), libro = $('#libro'), polvo = $('#polvo'), luz = $('#luz'), lupa = $('#lupa'),
      lupaMapa = $('#lupaMapa'), lupaTira = $('#lupaTira'), lupaAnio = $('#lupaAnio'), temaColor = document.querySelector('meta[name="theme-color"]'),
      escenariosEl = $('#escenarios'), visorEscena = $('#visorEscena'), tapaEscena = $('#tapaEscena');
const porId = Object.fromEntries(HOJAS.map(h => [h.id, h]));
const DISPONIBLES = HOJAS.filter(h => !h.pendiente).map(h => h.id);
const vivos = new Set();          // etapas que ya entraron en pantalla
const enVista = new Set();        // etapas que están en pantalla ahora (su escenografía se mueve)
const minis = {};                 // id → botón de la hoja en la mampara
const colg = {};                  // id → vaivén de la hoja colgada (ángulo, velocidad, rigidez)
const hilos = {};                 // id → línea del hilo en la gráfica (se vacía al redibujar)
let M = {};                       // medidas vigentes
let POS = {};                     // id → posición de cada hoja en la franja
// el modo de la app lo decide la cabeza de index.html (y se cambia desde la portada o el minimapa):
// «lite» carga rápido y no tiene nada corriendo de fondo; «normal» es la mampara de siempre; «inmersivo» agrega 3D y profundidad
const raiz = document.documentElement;
const modo = () => raiz.dataset.modo || 'normal';
const lite = () => modo() === 'lite', tres = () => modo() === 'inmersivo';
// piezas.js, fondos.js e inmersivo.js se piden cuando hacen falta (y una sola vez)
const pedidos = {};
function cargarScript(src){
  return pedidos[src] || (pedidos[src] = new Promise((ok, mal) => {
    const sc = document.createElement('script'); sc.src = src; sc.async = true;
    sc.onload = () => ok(); sc.onerror = () => { delete pedidos[src]; sc.remove(); mal(new Error(src)); };
    document.head.append(sc);
  }));
}
const enCalma = (f, espera = 1500) => ('requestIdleCallback' in window ? requestIdleCallback(f, {timeout: espera}) : setTimeout(f, 200));
// las fotos llegan con un fundido (no de golpe)
function alCargar(img){ const lista = () => img.classList.add('lista'); if (img.complete && img.naturalWidth) lista(); else { img.addEventListener('load', lista, {once: true}); img.addEventListener('error', lista, {once: true}); } }

/* =====================================================================
   1 · MEDIDAS: todo se calcula a partir del alto y ancho disponibles
   ===================================================================== */
function medir(){
  const W = sala.clientWidth, H = sala.clientHeight;
  const bajo = H < 430;                                           // celular acostado
  const yw = Math.round(clamp(H * .235, 92, Math.min(184, Math.max(92, W / 2.8))));   // ancho de un año
  const hh = Math.round(bajo ? clamp(H * .15, 42, 56) : clamp(H * .135, 70, 124));    // cabecera
  const ah = Math.round(bajo ? 26 : clamp(H * .06, 32, 44));                          // eje de años
  const resto = H - hh - ah;
  const cb = Math.round(resto * (bajo ? .47 : .44));              // banda de las hojas
  const gb = resto - cb;                                          // banda de la gráfica
  const m = bajo ? 6 : 12;
  let cw = Math.min(yw * .86, 170), ch = cw / .773;               // hoja: proporción carta vertical
  if (ch > cb - 2 * m){ ch = cb - 2 * m; cw = ch * .773; }
  const zig = Math.max(0, Math.min(ch * .28, cb - 2 * m - ch));   // desfase entre hojas vecinas
  const top0 = hh + Math.max(m, (cb - ch - zig) / 2);
  const tit = clamp(Math.min(hh * .36, W * .072), 19, 42);
  M = {W, H, bajo, yw, hh, ah, cb, gb, cw, ch, zig, top0, Wf: yw * N, base: H - ah};
  const s = app.style;
  s.setProperty('--vw', W + 'px'); s.setProperty('--yw', yw + 'px'); s.setProperty('--hh', hh + 'px'); s.setProperty('--ah', ah + 'px');
  s.setProperty('--cw', cw.toFixed(1) + 'px'); s.setProperty('--ch', ch.toFixed(1) + 'px');
  s.setProperty('--tit', tit.toFixed(1) + 'px'); s.setProperty('--ico', Math.round(clamp(hh * .6, 26, 74)) + 'px');
  s.setProperty('--cab-pad', Math.round(clamp(hh * .14, 6, 18)) + 'px');
  s.setProperty('--anio', clamp(yw * .13, 12.5, 20).toFixed(1) + 'px');
  app.toggleAttribute('data-bajo', bajo);
  app.dataset.mini = cw < 92 ? 'chica' : 'normal';
  // posición de cada hoja: repartidas a lo ancho de su etapa, en zigzag
  POS = {};
  PERIODOS.forEach(p => {
    const hs = HOJAS.filter(h => h.k === p.k), x0 = (p.desde - A0) * yw, ancho = (p.hasta - p.desde + 1) * yw;
    const e = Math.min(1, ancho / hs.length * (zig > ch * .15 ? 1.10 : .97) / cw);        // etapas con más hojas que años: se achican y se enciman menos de 10 %
    hs.forEach((h, i) => { POS[h.id] = {cx: x0 + (i + .5) * ancho / hs.length, top: top0 + (i % 2) * zig + (1 - e) * ch / 2, w: cw * e, h: ch * e, i, rot: [-2.2, 1.6, -1.1, 2.4, -1.7, 1.2][(i + p.k) % 6]}; });
  });
}

/* =====================================================================
   2 · CABECERAS, EJE Y HOJAS COLGADAS (HTML)
   ===================================================================== */
function armarFijos(){
  periodosEl.innerHTML = PERIODOS.map(p => `
    <section class="periodo" data-k="${p.k}" style="--n:${p.hasta - p.desde + 1}" aria-label="${p.nombre}, ${p.desde}–${p.hasta}">
      <header class="cab">
        <div class="cab__carril"><div class="cab__txt">
          <h2>${p.nombre}</h2>
          <p class="cab__sub"><b>${p.desde}–${p.hasta}</b> · <i>${p.lema}</i></p>
          <p class="cab__ley"><span><i class="ley-pib"></i>PIB</span><span><i class="ley-deu"></i>Deuda externa</span></p>
        </div></div>
        <div class="cab__ico" aria-hidden="true">${p.iconos.map(n => icono(n, JUGABLES.has(n) ? `class="juega" data-juguete="${n}"` : '')).join('')}</div>
      </header>
    </section>`).join('');
  eje.innerHTML = SERIE.anios.map(a => `<button type="button" data-k="${etapaDe(a).k}" data-anio="${a}" aria-expanded="false" aria-label="Indicadores de ${a}">${a}</button>`).join('');
  colgadas.innerHTML = HOJAS.map(h => h.pendiente
    ? `<button type="button" class="hoja-mini pendiente" data-id="${h.id}" data-k="${h.k}" aria-label="Hoja pendiente: ${h.titulo}">
         <span class="pend__anio">${anioCorto(h.anio).replace('–', '–<wbr>')}</span><span class="pend__titulo">${h.titulo}</span><span class="pend__nota">pendiente</span></button>`
    : `<button type="button" class="hoja-mini" data-id="${h.id}" data-k="${h.k}" aria-label="Desplegar la hoja: ${h.titulo}, ${h.anio}">
         <span class="colgante"><span class="clip"></span>${portadaHTML(h, true)}</span></button>`).join('');
  colgadas.querySelectorAll('.hoja-mini').forEach(b => {
    const id = b.dataset.id; minis[id] = b;
    const c = b.querySelector('.colgante');                       // cada hoja con su propio ritmo de vaivén
    if (c) colg[id] = {el: c, th: 0, om: 0, k: 26 + [...id].reduce((s, l) => s + l.charCodeAt(0), 0) % 11};
  });
  // minimapa (y su copia ampliada para la lupa)
  const etapas = tag => PERIODOS.map(p => `<${tag} ${tag === 'button' ? 'type="button" ' : ''}class="mapa__etapa" data-k="${p.k}" style="--n:${p.hasta - p.desde + 1}"${tag === 'button' ? ` aria-label="Ir a ${p.nombre}"` : ''}><span>${p.corto}</span></${tag}>`).join('');
  tira.innerHTML = etapas('button')
    + `<svg class="mapa__chispa" viewBox="0 0 250 30" preserveAspectRatio="none" aria-hidden="true">${chispa(250, 30)}</svg><div class="mapa__ventana" id="ventana"></div>`;
  lupaTira.innerHTML = etapas('div') + `<svg class="mapa__chispa" viewBox="0 0 250 30" preserveAspectRatio="none">${chispa(250, 30)}</svg>`;
  if (!$('#tapaChispa').firstChild) $('#tapaChispa').innerHTML = chispa(250, 46, true);   // ya viene dibujada en index.html (la portada se imprime sin esperar a este archivo)
  colgadas.querySelectorAll('.portada__marco img').forEach(alCargar);
}
// cada foto tiene tres versiones: el JPG original (el que nombra datos.js), una completa y ligera para el visor
// y una miniatura para la mampara. Las dos últimas las hace armar.py.
const foto = (h, tipo) => /^img\/hojas\/[^/]+\.jpg$/.test(h.img) ? h.img.replace(/^img\/hojas\/([^/]+)\.jpg$/, `img/hojas/${tipo}/$1.webp`) : h.img;
const precargadas = new Set();
function precargarFoto(id){ if (precargadas.has(id)) return; precargadas.add(id); const i = new Image(); i.decoding = 'async'; i.src = foto(porId[id], 'web'); }
function portadaHTML(h, mini){
  return `<span class="portada" data-k="${h.k}"><span class="portada__cara">
    <span class="portada__anio">${mini ? anioCorto(h.anio) : h.anio}</span>
    <span class="portada__marco"><img src="${foto(h, 'mini')}"${mini ? '' : ` data-completa="${foto(h, 'web')}"`} alt="${mini ? '' : h.pie.replace(/"/g, '&quot;')}" draggable="false" decoding="async"${mini ? ' fetchpriority="low"' : ''}${mini && h.k > 0 ? ' loading="lazy"' : ''} style="object-fit:${h.ajuste};object-position:${h.pos}">${mini ? '' : `<button class="portada__lupa" type="button" aria-pressed="false" aria-label="Examinar la foto con la lupa">${ICONO_LUPA}</button>`}</span>
    <span class="portada__titulo">${h.titulo}</span>
    <span class="portada__pie">${h.pie}</span></span></span>`;
}
function colocarHojas(){
  HOJAS.forEach(h => {
    const p = POS[h.id], b = minis[h.id];
    b.style.left = (p.cx - p.w / 2).toFixed(1) + 'px'; b.style.top = p.top.toFixed(1) + 'px';
    b.style.setProperty('--cw', p.w.toFixed(1) + 'px'); b.style.setProperty('--ch', p.h.toFixed(1) + 'px');
    b.style.setProperty('--rot', p.rot + 'deg'); b.style.setProperty('--i', p.i); b.style.zIndex = 2 - p.i % 2;   // la fila de arriba va encima: así ningún título queda tapado
    b.classList.toggle('vivo', vivos.has(h.k));
  });
}
// versión diminuta de la gráfica (minimapa y portada del libro)
function chispa(w, h, puntos){
  const x = a => (a - A0 + .5) / N * w, yP = v => h - v / PIB_MAX * h * .9, yD = v => h - v / DEU_MAX * h * .9;
  let s = '';
  PERIODOS.forEach(p => {
    const xs = [p.desde - .5]; for (let a = p.desde; a <= p.hasta; a++) xs.push(a); xs.push(p.hasta + .5);
    const pts = xs.map(a => `${x(a).toFixed(1)},${yP(valor(SERIE.pib, a)).toFixed(1)}`).join(' ');
    s += `<polygon points="${x(xs[0]).toFixed(1)},${h} ${pts} ${x(xs[xs.length - 1]).toFixed(1)},${h}" fill="${TINTA[p.k]}" opacity=".3"/>`
       + `<polyline points="${pts}" fill="none" stroke="${TINTA[p.k]}" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
  });
  s += `<polyline points="${SERIE.anios.map(a => `${x(a).toFixed(1)},${yD(SERIE.deuda_usd[idx(a)]).toFixed(1)}`).join(' ')}" fill="none" stroke="${AZUL}" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  return s;
}

/* =====================================================================
   3 · LA GRÁFICA (SVG en pixeles de la franja; se redibuja al cambiar de tamaño)
   ===================================================================== */
function dibujar(){
  const {yw, hh, gb, H, Wf, base, bajo} = M;
  const alto = gb * .93, X = a => (a - A0 + .5) * yw, yP = v => base - v / PIB_MAX * alto, yD = v => base - v / DEU_MAX * alto;
  const fs = clamp(yw * .086, 9.5, 13.5), r = clamp(yw * .03, 3, 5), lw = clamp(yw * .02, 2, 3.2), sep = r + 5;
  const f = n => n.toFixed(1);
  lienzo.setAttribute('viewBox', `0 0 ${Wf} ${H}`);
  const junto = a => { const y1 = yP(SERIE.pib[idx(a)]), y2 = yD(SERIE.deuda_usd[idx(a)]); return y2 > y1 && y2 - y1 < 2 * fs + 2 * sep + 16; };   // la deuda queda justo debajo del PIB
  let escenas = '';
  let s = '<defs>' + TINTA.map((c, k) => `<linearGradient id="lav${k}" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${f(base - alto * .9)}" y2="${f(base)}"><stop offset="0" stop-color="${c}" stop-opacity="${LAVADO[k] * 1.7}"/><stop offset="1" stop-color="${c}" stop-opacity="${LAVADO[k] * .35}"/></linearGradient>`).join('') + '</defs>';
  PERIODOS.forEach(p => {
    const k = p.k, c = TINTA[k], x0 = (p.desde - A0) * yw, x1 = (p.hasta - A0 + 1) * yw;
    const xs = [p.desde - .5]; for (let a = p.desde; a <= p.hasta; a++) xs.push(a); xs.push(p.hasta + .5);
    const camino = (serie, y) => xs.map((a, i) => `${i ? 'L' : 'M'}${f(X(a))} ${f(y(valor(serie, a)))}`).join('');
    s += `<g class="per${vivos.has(k) ? ' vivo' : ''}" data-k="${k}">`;
    // la escenografía de la etapa: su paisaje grabado al pie de la gráfica y lo que se mueve encima (en su propia capa, debajo de la gráfica)
    if (window.Fondos && !lite()){
      const z = window.Fondos.zona(k, x1 - x0, base, Math.round(gb * .34), hh);
      escenas += `<div class="escena${enVista.has(k) ? ' en-vista' : ''}" data-k="${k}" style="left:${f(x0)}px;width:${f(x1 - x0)}px">${z.paisaje}<div class="esc-vivos">${z.html}</div></div>`;
    }

    // --- detalles de la etapa (debajo de las líneas) ---
    s += `<g class="deco">`;
    if (k === 1){                                                  // greca de los murales
      const g = clamp(hh * .1, 6, 10); let d = '';
      for (let x = x0 + 14; x < x1 - 14 - g; x += g * 1.25) d += `M${f(x)} ${f(hh + g)}v${-g}h${g * .75}v${g * .5}h${-g * .25}v${-g * .25}h${g * .75}`;
      s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(g * .11)}" opacity=".4"/>`;
    }
    if (k === 2) for (let y = base - gb + 6; y < base - 4; y += gb / 9)   // rayado de libro contable
      s += `<line x1="${f(x0 + 8)}" x2="${f(x1 - 8)}" y1="${f(y)}" y2="${f(y)}" stroke="${c}" stroke-width=".8" opacity=".2"/>`;
    if (k === 3){                                                  // grietas que bajan hasta el fondo de 1932
      const px = X(1932), py = yP(SERIE.pib[idx(1932)]);
      [[-.34, 41], [.3, 57], [.02, 73]].forEach(([dx, semilla]) => {
        const rnd = azar(semilla); let x = px + dx * yw, y = base - gb * .98, pts = [];
        const pasos = 7; for (let i = 0; i <= pasos; i++){ const t = i / pasos; pts.push(`${f(x + (px - x) * t * t + (rnd() - .5) * yw * .2 * (1 - t))},${f(y + (py - sep - y) * t)}`); }
        s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="bevel" opacity=".42"/>`;
      });
    }
    DECO.filter(d => d.k === k).forEach(d => {
      const sim = SIMBOLOS[d.s], vb = sim.vb.split(' ').map(Number), ar = Math.round(d.a), corre = junto(clamp(ar, p.desde, p.hasta)) && Math.abs(d.a - ar) < .3;
      const h = d.t * gb * (corre ? .82 : 1), w = h * vb[2] / vb[3], cx = X(d.a + (corre ? (ar === p.desde ? .5 : -.5) : 0)), cy = base - d.y * gb * (corre ? .8 : 1);
      const dib = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${d.rot || 0})" opacity="${d.op}" color="${d.c || c}"><svg x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" viewBox="${sim.vb}" overflow="visible">${sim.svg}</svg></g>`;
      s += JUGABLES.has(d.s) ? `<g class="juguete" data-juguete="${d.s}"><rect class="toque" x="${f(cx - Math.max(w, 44) / 2)}" y="${f(cy - Math.max(h, 44) / 2)}" width="${f(Math.max(w, 44))}" height="${f(Math.max(h, 44))}" fill="transparent"/>${dib}</g>` : dib;
      if (d.nota && !bajo){
        const abajo = d.s.startsWith('mancha') ? h * 30 / 136 * 1.5 : h / 2;
        s += `<text class="nota" x="${f(cx)}" y="${f(Math.min(cy + abajo + fs, base - 4))}" text-anchor="middle" font-size="${f(fs * .86)}" fill="${c}">${d.nota}</text>`;
      }
    });
    s += `</g>`;

    // --- hilos: cada hoja apunta al dato de la gráfica que explica ---
    HOJAS.filter(h => h.k === k).forEach(h => {
      const pos = POS[h.id], a = h.resalta[0], y = h.serie === 'pib' ? yP(SERIE.pib[idx(a)]) : yD(SERIE.deuda_usd[idx(a)]), col = h.serie === 'pib' ? c : AZUL;
      s += `<g class="hilo" style="--i:${pos.i}"><g opacity="${h.pendiente ? .45 : 1}">
        <line id="hilo-${h.id}" x1="${f(pos.cx)}" y1="${f(pos.top + pos.h - 2)}" x2="${f(X(a))}" y2="${f(y)}" stroke="${col}" stroke-width="1.1" stroke-dasharray="1.5 4" stroke-linecap="round" opacity=".75"/>
        <circle class="anillo" id="anillo-${h.id}" cx="${f(X(a))}" cy="${f(y)}" r="${f(r + 5.5)}" fill="none" stroke="${col}" stroke-width="1.3" opacity=".8"/></g></g>`;
    });

    // --- PIB: lavado de tinta desde la base + línea ---
    s += `<path class="lavado" d="M${f(X(xs[0]))} ${f(base)}${camino(SERIE.pib, yP).replace('M', 'L')}L${f(X(xs[xs.length - 1]))} ${f(base)}Z" fill="url(#lav${k})"/>`;
    s += `<path class="linea" pathLength="1" d="${camino(SERIE.pib, yP)}" fill="none" stroke="${c}" stroke-width="${f(lw)}" stroke-linejoin="round"/>`;
    // --- deuda externa: línea azul con halo de papel ---
    s += `<path class="linea" pathLength="1" d="${camino(SERIE.deuda_usd, yD)}" fill="none" stroke="${HUESO}" stroke-width="${f(lw * 2.1)}" stroke-linejoin="round" opacity=".85"/>`;
    s += `<path class="linea" pathLength="1" d="${camino(SERIE.deuda_usd, yD)}" fill="none" stroke="${AZUL}" stroke-width="${f(lw * 1.1)}" stroke-linejoin="round"/>`;

    // --- puntos y valores ---
    for (let a = p.desde; a <= p.hasta; a++){
      const i = a - p.desde, vp = SERIE.pib[idx(a)], vd = SERIE.deuda_usd[idx(a)], x = X(a), y1 = yP(vp), y2 = yD(vd);
      const abre = junto(a);                                           // las etiquetas se abren: PIB arriba, deuda abajo
      const tp = Math.round(vp) + '', td = Math.round(vd) + '', pw = td.length * fs * .62 + 9, ph = fs + 6;
      const yd = abre ? y2 + sep + 1 : y2 - sep - ph - 1;
      s += `<g class="punto" style="--i:${i}">
        <circle cx="${f(x)}" cy="${f(y1)}" r="${f(r)}" fill="${c}" stroke="${HUESO}" stroke-width="1.6"/>
        <text class="v-pib" x="${f(x)}" y="${f(abre ? y1 - sep - 2 : y1 + sep + fs * .82)}" text-anchor="middle" font-size="${f(fs)}" fill="${c}">${tp}</text>
        <rect x="${f(x - r * 1.05)}" y="${f(y2 - r * 1.05)}" width="${f(r * 2.1)}" height="${f(r * 2.1)}" transform="rotate(45 ${f(x)} ${f(y2)})" fill="${AZUL}" stroke="${HUESO}" stroke-width="1.6"/>
        <rect x="${f(x - pw / 2)}" y="${f(yd)}" width="${f(pw)}" height="${f(ph)}" rx="${f(ph * .32)}" fill="${AZUL}" stroke="${HUESO}" stroke-width="1"/>
        <text x="${f(x)}" y="${f(yd + ph / 2 + fs * .35)}" text-anchor="middle" font-size="${f(fs * .94)}" fill="${HUESO}">${td}</text></g>`;
    }
    s += `</g>`;
  });
  lienzo.innerHTML = s;
  escenariosEl.innerHTML = escenas;
  for (const id in hilos) delete hilos[id];
  for (const id in colg) if (colg[id].th) moverHilo(id, colg[id].th);
}

/* =====================================================================
   4 · NAVEGACIÓN: minimapa, rueda, arrastre, teclado, ficha de año
   ===================================================================== */
const suave = () => reduce.matches ? 'auto' : 'smooth';
// desplazamiento propio: la rueda se acerca con suavidad a su destino y el arrastre suelta con impulso
let meta = null, rafDesliz = 0, tDesliz = 0, rafInercia = 0;
function frenar(){ meta = null; cancelAnimationFrame(rafDesliz); rafDesliz = 0; cancelAnimationFrame(rafInercia); rafInercia = 0; }
function deslizar(t){
  rafDesliz = 0; if (meta == null) return;
  const dt = tDesliz ? Math.min(64, t - tDesliz) : 16.7; tDesliz = t;
  const x = sala.scrollLeft, d = meta - x;
  if (Math.abs(d) < 2){ sala.scrollLeft = meta; meta = null; return; }
  sala.scrollLeft = x + d * (1 - Math.pow(.8, dt / 16.7));
  if (Math.abs(sala.scrollLeft - x) < .05){ meta = null; return; }      // llegó al tope del recorrido
  rafDesliz = requestAnimationFrame(deslizar);
}
function inercia(v){
  let t0 = 0;
  const paso = t => {
    const dt = t0 ? Math.min(48, t - t0) : 16.7; t0 = t;
    const x = sala.scrollLeft; sala.scrollLeft = x + v * dt / 16.7; v *= Math.pow(.94, dt / 16.7);
    rafInercia = Math.abs(v) > .35 && sala.scrollLeft !== x ? requestAnimationFrame(paso) : 0;
  };
  rafInercia = requestAnimationFrame(paso);
}
function irA(x, comportamiento = suave()){ frenar(); sala.scrollTo({left: clamp(x, 0, sala.scrollWidth - sala.clientWidth), behavior: comportamiento}); }
function irAEtapa(k, comportamiento){ irA(franja.offsetLeft + (PERIODOS[k].desde - A0) * M.yw - (k === 0 ? 18 : 10), comportamiento); }
function centrar(el, comportamiento = 'auto'){ irA(franja.offsetLeft + el.offsetLeft + el.offsetWidth / 2 - M.W / 2, comportamiento); }
let pendienteScroll = false;
function alDesplazar(){
  despertarColgantes();
  if (pendienteScroll) return; pendienteScroll = true;
  requestAnimationFrame(() => {
    pendienteScroll = false;
    const a = clamp((sala.scrollLeft - franja.offsetLeft) / M.Wf, 0, 1), b = clamp((sala.scrollLeft + M.W - franja.offsetLeft) / M.Wf, 0, 1);
    const v = $('#ventana'); v.style.left = (a * 100).toFixed(2) + '%'; v.style.width = Math.max(1.5, (b - a) * 100).toFixed(2) + '%';
    if (!ficha.hidden && Math.abs(sala.scrollLeft - ficha._x) > 24) cerrarFicha();
    seguirEtapa();
    if (tres() && window.Inmersivo) window.Inmersivo.alDesplazar();
  });
}
// la etapa que está al centro tiñe la sala; si uno se queda en ella, suena su señal (una vez)
let etapaVista = -1, tSenal = 0;
function seguirEtapa(deGolpe){
  const a = clamp(Math.floor(A0 + (sala.scrollLeft + M.W / 2 - franja.offsetLeft) / M.yw), A0, A0 + N - 1), k = etapaDe(a).k;
  if (k === etapaVista) return; etapaVista = k;
  if (deGolpe){ app.style.transition = 'none'; app.style.setProperty('--tono', TINTA[k]); getComputedStyle(app).getPropertyValue('--tono'); app.style.transition = ''; }   // detrás de la portada no hace falta el fundido
  else app.style.setProperty('--tono', TINTA[k]);
  if (temaColor) temaColor.content = MURO[k];
  tira.querySelectorAll('.mapa__etapa').forEach(b => b.classList.toggle('actual', +b.dataset.k === k));
  clearTimeout(tSenal);
  if (app.dataset.estado === 'mampara' && k > 0 && !lite()) tSenal = setTimeout(() => { if (visor.hidden) SON.etapa(k); }, 700);
}
function prepararNavegacion(){
  sala.addEventListener('scroll', alDesplazar, {passive: true});
  // rueda vertical del ratón → desplazamiento horizontal (con suavidad)
  sala.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? M.W : 1);
    if (!anima()){ sala.scrollLeft += d; return; }
    cancelAnimationFrame(rafInercia); rafInercia = 0;
    meta = clamp((meta == null ? sala.scrollLeft : meta) + d, 0, sala.scrollWidth - sala.clientWidth);
    if (!rafDesliz){ tDesliz = 0; rafDesliz = requestAnimationFrame(deslizar); }
  }, {passive: false});
  // arrastrar con el ratón; al soltar sigue de largo y frena poco a poco
  let ar = null, arrastro = false;
  sala.addEventListener('pointerdown', e => { frenar(); if (e.pointerType === 'mouse' && e.button === 0) ar = {x: e.clientX, s: sala.scrollLeft, h: [[e.clientX, e.timeStamp]]}; arrastro = false; });
  window.addEventListener('pointermove', e => {
    if (!ar) return; const dx = e.clientX - ar.x;
    if (Math.abs(dx) > 5){ arrastro = true; sala.classList.add('arrastra'); }
    if (arrastro){ sala.scrollLeft = ar.s - dx; ar.h.push([e.clientX, e.timeStamp]); if (ar.h.length > 6) ar.h.shift(); }
  });
  window.addEventListener('pointerup', e => {
    if (ar && arrastro && anima()){ const [x0, t0] = ar.h[0], dt = e.timeStamp - t0; if (dt > 0 && dt < 160){ const v = (e.clientX - x0) / dt; if (Math.abs(v) > .25) inercia(-v * 16.7); } }
    ar = null; sala.classList.remove('arrastra');
  });
  sala.addEventListener('click', e => { if (arrastro){ e.stopPropagation(); e.preventDefault(); arrastro = false; } }, true);
  // el ratón roza las hojas colgadas y las mece
  let roce = null;
  colgadas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest('.hoja-mini');
    if (roce && b && b !== roce.b && colg[b.dataset.id] && !b.classList.contains('levantada')){
      const v = (e.clientX - roce.x) / Math.max(8, e.timeStamp - roce.t);
      empujar(b.dataset.id, clamp(-v * .8, -1.1, 1.1));
    }
    roce = {x: e.clientX, t: e.timeStamp, b};
  });
  colgadas.addEventListener('pointerleave', () => { roce = null; });
  // al pasar (o enfocar) una hoja, su hilo corre hasta el dato que explica; de paso se va pidiendo su foto completa
  const verHilo = (b, si) => { const l = b && hiloDe(b.dataset.id); if (l) l.closest('.hilo')?.classList.toggle('ve', si); };
  colgadas.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const b = e.target.closest('.hoja-mini'); if (b && !b.classList.contains('pendiente')){ verHilo(b, true); precargarFoto(b.dataset.id); } });
  colgadas.addEventListener('pointerout', e => { const b = e.target.closest('.hoja-mini'); if (b && !b.contains(e.relatedTarget)) verHilo(b, false); });
  colgadas.addEventListener('focusin', e => verHilo(e.target.closest('.hoja-mini'), true));
  colgadas.addEventListener('focusout', e => verHilo(e.target.closest('.hoja-mini'), false));
  colgadas.addEventListener('pointerdown', e => { const b = e.target.closest('.hoja-mini'); if (b && !b.classList.contains('pendiente')) precargarFoto(b.dataset.id); }, {passive: true});
  // minimapa: tocar una etapa salta a ella; arrastrar recorre la franja (con lupa)
  let mp = null;
  const aFraccion = e => { const r = tira.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
  tira.addEventListener('pointerdown', e => { mp = {x: e.clientX, movio: false}; tira.setPointerCapture(e.pointerId); });
  tira.addEventListener('pointermove', e => {
    if (mp && Math.abs(e.clientX - mp.x) > 6) mp.movio = true;
    const recorre = !!(mp && mp.movio);
    if (e.pointerType === 'mouse' || recorre) verLupaMapa(e, recorre);
    if (recorre) irA(franja.offsetLeft + aFraccion(e) * M.Wf - M.W / 2, 'auto');
  });
  tira.addEventListener('pointerup', e => {
    if (!mp) return;
    if (!mp.movio){ const a = A0 + Math.floor(aFraccion(e) * N * .9999); irAEtapa(etapaDe(a).k); SON.fx('tic'); }
    mp = null; if (e.pointerType !== 'mouse') ocultarLupaMapa();
  });
  tira.addEventListener('pointerleave', () => { if (!mp) ocultarLupaMapa(); });
  tira.addEventListener('pointercancel', () => { mp = null; ocultarLupaMapa(); });
  tira.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ const b = e.target.closest('.mapa__etapa'); if (b){ e.preventDefault(); irAEtapa(+b.dataset.k); SON.fx('tic'); } } });
  // teclado
  window.addEventListener('keydown', e => {
    if (!panel.hidden && e.key === 'Escape'){ cerrarPanel(); return; }
    if (app.dataset.estado !== 'mampara') return;
    if (!visor.hidden){
      const enPieza = e.target.closest && e.target.closest('.artefacto input, .artefacto [role="slider"]');
      if (e.key === 'Escape') pedirCierre(); else if (enPieza) return; else if (e.key === 'ArrowRight') cambiarHoja(1); else if (e.key === 'ArrowLeft') cambiarHoja(-1);
      return;
    }

    if (e.key === 'Escape') cerrarFicha();
    else if (e.key === 'ArrowRight') irA(sala.scrollLeft + M.yw);
    else if (e.key === 'ArrowLeft') irA(sala.scrollLeft - M.yw);
    else if (e.key === 'Home') irA(0); else if (e.key === 'End') irA(sala.scrollWidth);
  });
  // hojas y años
  colgadas.addEventListener('click', e => {
    const b = e.target.closest('.hoja-mini'); if (!b) return;
    if (b.classList.contains('pendiente')) avisar('Esta hoja todavía no tiene contenido'); else abrirHoja(b.dataset.id);
  });
  eje.addEventListener('click', e => { const b = e.target.closest('button'); if (b) (b.getAttribute('aria-expanded') === 'true' ? cerrarFicha : abrirFicha)(+b.dataset.anio); });
  app.addEventListener('pointerdown', e => { if (!ficha.hidden && !e.target.closest('.ficha, .eje')) cerrarFicha(); });
  $('#alInicio').addEventListener('click', () => irA(0));
  // los dibujos de cada zona responden al tocarlos
  franja.addEventListener('click', e => { const j = e.target.closest('[data-juguete]'); if (j) conPiezas(P => P.juguete(j, servicios)); });
  try { JSON.parse(localStorage.getItem('mampara-piezas') || '[]').forEach(id => minis[id] && minis[id].classList.add('hecha')); } catch (e){}
  document.querySelectorAll('[data-abre="creditos"]').forEach(b => b.addEventListener('click', abrirCreditos));
  $('#aPortada').addEventListener('click', volverPortada);
}
// lupa del minimapa: la tira ampliada bajo el dedo, con el año
let anioLupa = 0;
function verLupaMapa(e, suena){
  const r = tira.getBoundingClientRect(), rm = mapa.getBoundingClientRect(), f = clamp((e.clientX - r.left) / r.width, 0, 1);
  const W = lupaMapa.offsetWidth, Z = 2.6;
  lupaTira.style.width = (r.width * Z).toFixed(1) + 'px';
  lupaTira.style.transform = `translateX(${(W / 2 - f * r.width * Z).toFixed(1)}px)`;
  lupaMapa.style.left = clamp(e.clientX - rm.left, W / 2 + 6, rm.width - W / 2 - 6).toFixed(1) + 'px';
  const a = A0 + Math.min(N - 1, Math.floor(f * N));
  if (a !== anioLupa){ anioLupa = a; lupaAnio.textContent = `${etapaDe(a).corto} · ${a}`; if (suena) SON.fx('rueda'); }
  lupaMapa.classList.add('ver');
}
function ocultarLupaMapa(){ lupaMapa.classList.remove('ver'); anioLupa = 0; }
function abrirFicha(a){
  cerrarFicha();
  const i = idx(a), p = etapaDe(a), g = SERIE.pib_crec[i], inf = SERIE.inflacion[i], res = SERIE.reservas[i];
  ficha.dataset.k = p.k;
  ficha.innerHTML = `<h3>${a}<small>${p.nombre}</small></h3><dl>
    <dt>PIB</dt><dd>${num(SERIE.pib[i])} <small class="${g < 0 ? 'baja' : 'sube'}">${signo(g)} %</small></dd>
    <dt>Deuda externa</dt><dd>${num(SERIE.deuda_usd[i])} <small>mdd</small></dd>
    <dt>Dólar</dt><dd>${num(SERIE.paridad[i], 2)} <small>pesos</small></dd>
    <dt>Inflación</dt><dd>${inf == null ? '<small>sin dato</small>' : signo(inf) + ' %'}</dd>
    <dt>Reservas</dt><dd>${res == null ? '<small>sin dato</small>' : num(res) + ' <small>mdd</small>'}</dd></dl>
    <p>PIB en miles de millones de pesos de 2013 · mdd: millones de dólares</p>`;
  ficha.hidden = false;
  const b = eje.querySelector(`[data-anio="${a}"]`), rb = b.getBoundingClientRect(), ra = app.getBoundingClientRect();
  b.setAttribute('aria-expanded', 'true');
  ficha.style.left = clamp(rb.left - ra.left + rb.width / 2 - ficha.offsetWidth / 2, 10, ra.width - ficha.offsetWidth - 10) + 'px';
  ficha.style.top = Math.max(8, rb.top - ra.top - ficha.offsetHeight - 10) + 'px';
  ficha._x = sala.scrollLeft;
  columna.hidden = false; columna.style.left = (a - A0) * M.yw + 'px';
  SON.fx('ficha');
  if (anima()){
    // la ficha crece desde el botón del año (mismo elemento, otro tamaño)
    const rf = ficha.getBoundingClientRect(), d3 = tres();     // en 3D, además se levanta desde el eje como una tarjeta que se para
    ficha.animate([{transform: `${d3 ? 'perspective(900px) rotateX(-64deg) ' : ''}translate(${(rb.left - rf.left).toFixed(1)}px,${(rb.top - rf.top).toFixed(1)}px) scale(${(rb.width / rf.width).toFixed(3)},${(rb.height / rf.height).toFixed(3)})`, opacity: .35, borderRadius: '2px'},
      {transform: d3 ? 'perspective(900px) rotateX(0deg) translate(0px,0px) scale(1,1)' : 'none', opacity: 1, borderRadius: '5px'}], {duration: d3 ? 520 : 380, easing: 'cubic-bezier(.2,.8,.2,1)'});
    [...ficha.children].forEach((c, n) => c.animate([{opacity: 0, transform: 'translateY(5px)'}, {opacity: 1, transform: 'none'}], {duration: 320, delay: 130 + n * 55, easing: 'ease-out', fill: 'backwards'}));
    columna.animate([{transform: 'scaleY(0)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)'});
    ficha.querySelectorAll('dd').forEach((dd, n) => rodar(dd, 170 + n * 70));
  }
}
function cerrarFicha(){
  if (ficha.hidden) return; ficha.hidden = true; columna.hidden = true;
  eje.querySelectorAll('[aria-expanded="true"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
let tAviso;
function avisar(t, accion, alTocar){
  clearTimeout(tAviso); aviso.textContent = t; aviso.classList.toggle('accion', !!accion); aviso.classList.add('ver');
  if (accion){ const b = document.createElement('button'); b.type = 'button'; b.textContent = accion; b.addEventListener('click', () => { aviso.classList.remove('ver', 'accion'); alTocar(); }); aviso.append(b); }
  else tAviso = setTimeout(() => aviso.classList.remove('ver'), 2400);
}

/* panel: créditos y ayuda para instalar */
let devolverFoco = null;
function abrirPanel(titulo, html){
  devolverFoco = document.activeElement;
  $('#panelTitulo').textContent = titulo; $('#panelCuerpo').innerHTML = html; panel.hidden = false; $('#panelCuerpo').scrollTop = 0;
  sala.inert = true; mapa.inert = true; tapa.inert = true;
  SON.fx('papel');
  requestAnimationFrame(() => { panel.classList.add('visible'); $('#panelCerrar').focus({preventScroll: true}); });
}
function cerrarPanel(){
  if (panel.hidden) return; panel.classList.remove('visible');
  sala.inert = false; mapa.inert = false; tapa.inert = false;
  setTimeout(() => { panel.hidden = true; if (devolverFoco && devolverFoco.focus) devolverFoco.focus({preventScroll: true}); }, reduce.matches ? 0 : 240);
}
function abrirCreditos(){
  const fuentes = [...new Set(HOJAS.flatMap(h => h.fuentes.split(' · ')))].sort((a, b) => a.localeCompare(b, 'es'));
  abrirPanel('Créditos y fuentes', `
    <h3>Equipo</h3>
    <p>Celis Galindo Max · Muñoz Vidal Erick · Hernández Vázquez Luis Ángel · Acosta Calva Israel · Lopez Casillas Sinuhe Demir</p>
    <p class="menor">Licenciatura en Ingeniería Económica y Financiera · Primer semestre<br>Escuela Superior de Apan · Universidad Autónoma del Estado de Hidalgo<br>Principios de Economía</p>
    <h3>Datos de la gráfica</h3>
    <p>PIB (miles de millones de pesos de 2013) y deuda externa (millones de dólares), 1916–1940: tabla de indicadores de la asignatura.</p>
    <h3>Fuentes de las hojas</h3>
    <ul>${fuentes.map(f => `<li>${f}</li>`).join('')}</ul>
    <h3>Fotografías</h3>
    <p class="menor">De Wikimedia Commons, en dominio público o con licencia libre. Algunas ilustran el tema y no el hecho exacto.</p>
    <ol class="fotos">${HOJAS.map(h => `<li data-k="${h.k}"><b>${h.titulo}</b><span>${h.credito.autor} · ${h.credito.licencia}${h.credito.pagina ? ` · <a href="${h.credito.pagina}" target="_blank" rel="noopener">ver original</a>` : ''}</span></li>`).join('')}</ol>
    <h3>Sonido</h3>
    <ul>
      <li>«La golondrina», vals de Narciso Serradell, por la Orquesta Columbia (1922). Library of Congress, National Jukebox · <a href="https://www.loc.gov/item/jukebox-668919/" target="_blank" rel="noopener">dominio público</a></li>
      <li>Máquina de escribir y silbato de locomotora: Work With Sounds / Konrad Gutkowski · <a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener">CC BY 4.0</a></li>
      <li>Caja registradora: Wikimedia Commons · dominio público</li>
      <li>El papel, el clip, la radio y el disco se generan en el navegador.</li>
    </ul>`);
}

/* =====================================================================
   5 · VISOR: la hoja se levanta de la mampara y se despliega
   ===================================================================== */
let actual = null, ocupado = false;
function modoVisor(){
  const W = app.clientWidth, H = app.clientHeight;
  if (W >= 900 && H >= 600 && W / H > 1.15) return 'despliegue';
  if (W > H * 1.15 && W >= 560) return 'lado';
  return 'pila';
}
function ajustarVisor(){
  const W = app.clientWidth, H = app.clientHeight, m = modoVisor();
  visor.dataset.modo = m;
  visor.style.setProperty('--aw', W + 'px');
  visor.style.setProperty('--pw', (m === 'despliegue' ? Math.min((W - 48) / 3, (H - 136) * .773, 580) : Math.min((H - 24) * .773, W * .36)).toFixed(1) + 'px');
  const col = Math.min(W - 32, 34 * 16);                                  // ancho de la columna en modo pila
  visor.style.setProperty('--pc', clamp((H - 196) * .773, col * .72, col).toFixed(1) + 'px');
}
function pintarHoja(h, diferir){
  const p = PERIODOS[h.k], serie = h.serie === 'pib' ? SERIE.pib : SERIE.deuda_usd, c = h.serie === 'pib' ? TINTA[h.k] : AZUL;
  const anios = []; for (let a = h.desde; a <= h.hasta; a++) anios.push(a);
  const max = Math.max(...anios.map(a => serie[idx(a)]));
  const sello = {0: 'billete', 1: 'libro', 2: 'moneda', 3: 'monedas', 4: 'gota'}[h.k];
  hojaEl.dataset.k = h.k;
  hojaEl.innerHTML = portadaHTML(h, false) + `
    <section class="pliega paso">
      <p class="h-anio">${h.anio}</p>
      <h3 class="h-rotulo">Qué pasó</h3>
      <p class="h-texto">${h.paso}</p>
      <div class="artefacto"></div>
    </section>
    <section class="pliega importa">
      <h3 class="h-rotulo">Por qué importa</h3>
      <p class="h-texto">${h.importa}</p>
      <h3 class="h-rotulo">Míralo en la gráfica</h3>
      <figure class="h-barras" style="--c:${c}">
        <figcaption>${h.serie === 'pib' ? 'PIB (miles de millones de pesos de 2013)' : 'Deuda externa (millones de dólares)'}</figcaption>
        <div class="barras">${anios.map((a, i) => `<div class="${h.resalta.includes(a) ? 'sube' : ''}" style="--v:${(serie[idx(a)] / max).toFixed(3)};--i:${i}"><b>${Math.round(serie[idx(a)])}</b></div>`).join('')}</div>
        <div class="barras-eje">${anios.map(a => `<span class="${h.resalta.includes(a) ? 'sube' : ''}">${a}</span>`).join('')}</div>
      </figure>
      <p class="h-texto">${h.grafica}</p>
      <p class="h-fuente">Fuentes: ${h.fuentes}.</p>
      ${icono(sello, 'class="h-sello" aria-hidden="true"')}
    </section>`;
  $('#visorEtapa').dataset.k = h.k; $('#visorEtapa').textContent = `${p.nombre} · ${p.desde}–${p.hasta}`;
  const deEtapa = HOJAS.filter(x => x.k === h.k), n = DISPONIBLES.indexOf(h.id);
  $('#cuenta').textContent = `${deEtapa.indexOf(h) + 1} / ${deEtapa.length}`;
  $('#cuenta').setAttribute('aria-label', `Hoja ${deEtapa.indexOf(h) + 1} de ${deEtapa.length} de ${p.corto}`);
  $('#anterior').disabled = n === 0; $('#siguiente').disabled = n === DISPONIBLES.length - 1;
  hojaEl.querySelectorAll('.portada__marco img').forEach(alCargar);
  prepararFoto(); mejorarFoto();
  if (!diferir) montarPieza(h);
}
// piezas.js llega aparte (no hace falta para la portada): esto lo usa en cuanto está
function conPiezas(f){ if (window.Piezas) return Promise.resolve(f(window.Piezas)); return cargarScript('piezas.js').then(() => f(window.Piezas)); }
// la pieza de la hoja se arma cuando se despliegan los paneles (así no compite con el vuelo)
function montarPieza(h){
  const caja = hojaEl.querySelector('.artefacto'); if (!caja || caja.firstChild) return;
  conPiezas(P => { if (caja.isConnected && !caja.firstChild) P.montar(caja, h, servicios); })
    .catch(() => { if (caja.isConnected && !caja.firstChild) caja.outerHTML = `<div class="h-dato"><strong>${h.dato}</strong><span>${h.dato_l}</span></div>`; });   // sin conexión y sin piezas.js: el dato quieto
}
// mientras se lee una hoja se piden en calma las fotos de sus vecinas (así cambiar de hoja no espera)
function prepararVecinas(id){
  if (lite()) return;
  const n = DISPONIBLES.indexOf(id);
  enCalma(() => [n + 1, n - 1].forEach(i => { const v = DISPONIBLES[i]; if (v){ const m = new Image(); m.src = foto(porId[v], 'mini'); precargarFoto(v); } }), 2500);
}
// en el modo inmersivo, un toque breve en el celular al desplegar o pasar una hoja
const vibrar = ms => { if (tres() && navigator.vibrate && !raton.matches) try { navigator.vibrate(ms); } catch (e){} };
// lo que las piezas usan de la app
const servicios = {serie: SERIE, simbolos: SIMBOLOS, anima, son: n => SON.fx(n), estatica: v => SON.estatica && SON.estatica(v), cercana: (n, v) => SON.cercana && SON.cercana(n, v),
  rodar: el => rodar(el, 80), alCompletar: id => { vibrar([10, 40, 14]); const m = minis[id]; if (m){ m.classList.add('hecha', 'recien'); setTimeout(() => m.classList.remove('recien'), 900); } }};
// el visor arranca con la miniatura (ya está en pantalla: el vuelo es continuo) y la cambia por la foto completa en cuanto llega
function mejorarFoto(){
  const img = hojaEl.querySelector('.portada__marco img'); if (!img || !img.dataset.completa) return;
  const c = new Image(); c.decoding = 'async'; c.src = img.dataset.completa;
  const cambia = () => { img.src = c.src; img.classList.add('lista'); if (lupaImg === img) lupa.style.backgroundImage = `url("${c.src}")`; };
  const pon = () => {
    if (!img.isConnected || img.src === c.src || !c.naturalWidth) return;     // sin conexión y sin la foto guardada: se queda la miniatura
    if (!anima() || !img.classList.contains('lista')){ cambia(); return; }
    const capa = img.cloneNode(); capa.removeAttribute('data-completa'); capa.alt = ''; capa.setAttribute('aria-hidden', 'true'); capa.className = 'lista encima'; capa.src = c.src;
    img.after(capa);
    const quita = () => capa.remove();
    capa.animate([{opacity: 0}, {opacity: 1}], {duration: 360, easing: 'ease-out'}).finished.then(() => {
      if (!img.isConnected){ quita(); return; }
      cambia(); (img.decode ? img.decode() : Promise.resolve()).then(quita, quita);
    }, quita);
  };
  (c.decode ? c.decode() : Promise.reject()).then(pon, () => { if (c.complete) pon(); else c.addEventListener('load', pon, {once: true}); });
}
// (la lupa usa la foto que esté: la completa si ya llegó, si no la miniatura)
// dónde está una hoja chica, medida con la mampara en su tamaño normal (aunque esté retrocediendo detrás del velo)
function rectReal(el){
  if (!sala.classList.contains('atras')) return el.getBoundingClientRect();
  sala.style.transition = 'none'; sala.classList.remove('atras');
  const r = el.getBoundingClientRect();
  sala.classList.add('atras'); void sala.offsetWidth; sala.style.transition = '';
  return r;
}
// lo que separa la portada grande del visor de la hoja chica en la mampara
function haciaMini(mini, portada){
  const a = rectReal(mini), b = portada.getBoundingClientRect();
  return {x: a.left + a.width / 2 - b.left - b.width / 2, y: a.top + a.height / 2 - b.top - b.height / 2, s: mini.offsetWidth / b.width, r: POS[mini.dataset.id].rot};
}
// vuelo de la hoja: se despega de su clip, crece y llega al visor (o al revés); todo en plano
function vueloHoja(v, regreso){
  const d3 = tres();
  // en 3D la hoja gira hacia donde viaja y se acerca a la cámara a medio vuelo (mismas funciones en cada cuadro clave)
  const giro = (rx, ry, z) => d3 ? ` rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${z}px)` : '';
  const tf = (q, g = giro(0, 0, 0)) => `${d3 ? 'perspective(1200px) ' : ''}translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px) scale(${q.s.toFixed(4)}) rotate(${q.r.toFixed(2)}deg)${g}`;
  const medio = {x: v.x * .42, y: v.y * .42 - Math.min(40, app.clientHeight * .045), s: v.s + (1 - v.s) * .6, r: v.r * .35};   // se despega de la pared y sube un poco
  const k = [
    {transform: tf(v), boxShadow: '0 1px 1px rgba(0,0,0,.3),0 7px 14px rgba(40,22,6,.36)'},
    {transform: tf(medio, giro(16, v.x > 0 ? 22 : -22, 110)), boxShadow: '0 14px 22px rgba(0,0,0,.34),0 44px 80px rgba(0,0,0,.46)', offset: .5},
    {transform: tf({x: 0, y: 0, s: 1, r: 0}), boxShadow: '0 2px 3px rgba(0,0,0,.4),0 20px 40px rgba(0,0,0,.5)'},
  ];
  return regreso ? k.reverse() : k;
}
// historial: el botón «atrás» cierra la hoja y cada hoja tiene su enlace (#C3)
function anotar(id, reemplaza){ if (!PWA) return; try { history[reemplaza ? 'replaceState' : 'pushState']({hoja: id}, '', '#' + id); } catch (e){} }
function pedirCierre(){ if (PWA && history.state && history.state.hoja){ try { history.back(); return; } catch (e){} } cerrarHoja(); }
function abrirHoja(id, conHistorial = true){
  if (ocupado) return; ocupado = true; cerrarFicha(); frenar();
  if (conHistorial) anotar(id);
  sala.inert = true; mapa.inert = true;
  actual = id; const mini = minis[id], h = porId[id];
  quietar(id);
  pintarHoja(h, true); ajustarVisor();
  visor.style.setProperty('--tono', TINTA[h.k]);
  hojaEl.classList.remove('abierta', 'cerrando');
  visor.hidden = false; rollo.scrollTop = 0;
  if (window.Fondos && !lite()) window.Fondos.hoja(visorEscena, h, SERIE);
  const portada = hojaEl.querySelector('.portada'), dur = reduce.matches ? 0 : lite() ? 520 : tres() ? 820 : 720;
  const v = haciaMini(mini, portada);
  mini.classList.add('levantada');
  SON.fx('suelta'); SON.enfoque(true);
  requestAnimationFrame(() => { visor.classList.add('visible'); app.classList.add('leyendo'); sala.classList.add('atras'); });
  if (dur) portada.animate(vueloHoja(v), {duration: dur, easing: 'cubic-bezier(.24,.78,.22,1)'});
  setTimeout(() => {
    montarPieza(h); hojaEl.classList.add('abierta'); SON.fx('despliega'); vibrar(12);
    ocupado = false; $('#cerrar').focus({preventScroll: true});
  }, dur * .7);
  prepararVecinas(id);
}
function cerrarHoja(){
  if (ocupado || visor.hidden) return; ocupado = true;
  const id = actual, mini = minis[id], portada = hojaEl.querySelector('.portada'), rapido = reduce.matches;
  esconderLupa(); SON.fx('pliega'); SON.enfoque(false);
  let desvanece = null;
  const fin = () => {
    if (desvanece){ desvanece.cancel(); desvanece = null; }
    visor.hidden = true; visor.classList.remove('visible'); hojaEl.classList.remove('cerrando'); if (window.Piezas) window.Piezas.desmontar(); if (window.Fondos) window.Fondos.soltarHoja();
    mini.classList.remove('levantada'); mini.classList.add('asienta'); setTimeout(() => mini.classList.remove('asienta'), 520);
    SON.fx('clip'); empujar(id, (POS[id].rot < 0 ? 1 : -1) * .85);   // vuelve a su clip y se mece un poco
    tirarHilo(id);
    sala.inert = false; mapa.inert = false;
    mini.focus({preventScroll: true}); ocupado = false;
    arrancarPolvo();
  };
  const sueltaVelo = () => { visor.classList.remove('visible'); app.classList.remove('leyendo'); sala.classList.remove('atras'); };
  hojaEl.classList.add('cerrando'); hojaEl.classList.remove('abierta');
  if (rapido || rollo.scrollTop > 40){                      // ya se había desplazado: basta un fundido
    sueltaVelo();
    if (!rapido) desvanece = hojaEl.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: 'translateY(12px) scale(.985)'}], {duration: 300, easing: 'ease-in', fill: 'forwards'});
    setTimeout(fin, rapido ? 0 : 320); return;
  }
  rollo.scrollTop = 0;
  setTimeout(() => {
    const v = haciaMini(mini, portada);
    sueltaVelo();
    portada.animate(vueloHoja(v, true), {duration: 540, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards'}).finished.then(fin, fin);
  }, 230);
}
// cambiar de hoja: la que se va (una copia fija en su lugar) y la que llega se funden
let fantasma = null;
function cambiarHoja(d){
  const n = DISPONIBLES.indexOf(actual) + d;
  if (ocupado || n < 0 || n >= DISPONIBLES.length) return; ocupado = true;
  const rapido = reduce.matches;
  esconderLupa(); SON.fx('pasa');
  if (fantasma){ fantasma.remove(); fantasma = null; }
  if (!rapido){
    const r0 = hojaEl.getBoundingClientRect(), rv = visor.getBoundingClientRect(), f = hojaEl.cloneNode(true);
    f.removeAttribute('id'); f.classList.add('fantasma'); f.setAttribute('aria-hidden', 'true'); f.inert = true;
    Object.assign(f.style, {left: (r0.left - rv.left) + 'px', top: (r0.top - rv.top) + 'px', width: r0.width + 'px'});
    visor.append(f); fantasma = f;
    let vuelta;
    if (tres()){                                              // la que se va se voltea sobre su borde, como una página
      f.style.transformOrigin = d > 0 ? '0 50%' : '100% 50%'; f.style.backfaceVisibility = 'hidden';
      vuelta = f.animate([{opacity: 1, transform: 'perspective(1600px) rotateY(0deg)'}, {opacity: .9, transform: `perspective(1600px) rotateY(${-d * 62}deg)`, offset: .62}, {opacity: 0, transform: `perspective(1600px) rotateY(${-d * 96}deg)`}],
        {duration: 640, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards'});
    } else vuelta = f.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateX(${-d * 60}px) scale(.97)`}], {duration: 420, easing: 'cubic-bezier(.4,0,.7,1)', fill: 'forwards'});
    vuelta.finished.then(() => { f.remove(); if (fantasma === f) fantasma = null; }, () => f.remove());
  }
  minis[actual].classList.remove('levantada');
  actual = DISPONIBLES[n]; const h = porId[actual];
  minis[actual].classList.add('levantada'); quietar(actual);
  centrar(minis[actual], rapido ? 'auto' : 'smooth');        // detrás del velo, la mampara se desliza hasta la hoja nueva
  anotar(actual, true);
  activarEtapa(h.k);
  visor.style.setProperty('--tono', TINTA[h.k]);
  if (window.Fondos && !lite()) window.Fondos.hoja(visorEscena, h, SERIE);
  pintarHoja(h); rollo.scrollTop = 0;
  hojaEl.classList.remove('cerrando'); hojaEl.classList.add('instantanea', 'abierta'); void hojaEl.offsetWidth; hojaEl.classList.remove('instantanea');
  if (!rapido){
    if (tres()) hojaEl.animate([{opacity: .25, transform: 'perspective(1600px) translateZ(-150px)'}, {opacity: 1, transform: 'perspective(1600px) translateZ(0)'}],   // la que llega sube desde atrás
      {duration: 620, delay: 90, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards'});
    else hojaEl.animate([{opacity: 0, transform: `translateX(${d * 60}px) scale(.985)`}, {opacity: 1, transform: 'none'}],
      {duration: 560, delay: 80, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards'});
  }
  vibrar(8); prepararVecinas(actual);
  setTimeout(() => { ocupado = false; }, rapido ? 0 : 380);
}
// al volver a su clip, un pulso corre por el hilo hasta el dato de la gráfica y el anillo late
function tirarHilo(id){
  const late = () => { const an = document.getElementById('anillo-' + id); if (an){ an.classList.remove('pulso'); void an.getBoundingClientRect(); an.classList.add('pulso'); } };
  const l = hiloDe(id);
  if (!l || !anima()){ late(); return; }
  const p = l.cloneNode(); p.removeAttribute('id'); p.setAttribute('class', 'pulso-hilo'); p.removeAttribute('stroke-dasharray'); p.setAttribute('opacity', '1');
  const largo = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
  p.style.strokeDasharray = `16 ${Math.ceil(largo + 40)}`;
  l.parentNode.append(p);
  p.animate([{strokeDashoffset: 16}, {strokeDashoffset: -largo}], {duration: 560, delay: 140, easing: 'cubic-bezier(.5,0,.5,1)', fill: 'backwards'}).finished.then(() => { p.remove(); late(); }, () => p.remove());
}

/* =====================================================================
   6 · PORTADA DEL LIBRO Y ARRANQUE
   Al abrir, el libro se guarda en su botón del minimapa (el que lleva de regreso a la portada)
   mientras llega la mampara; al volver, sale de ese mismo botón. Todo en plano.
   ===================================================================== */
let observador, tTapa = 0, animLibro = null;
function activarEtapa(k){
  if (vivos.has(k)) return; vivos.add(k);
  lienzo.querySelector(`.per[data-k="${k}"]`)?.classList.add('vivo');
  periodosEl.querySelector(`.periodo[data-k="${k}"]`)?.classList.add('vivo');
  HOJAS.filter(h => h.k === k).forEach(h => minis[h.id].classList.add('vivo'));
}
// lo que separa al libro de su botón en el minimapa (el libro se encoge desde su esquina)
function haciaBoton(){
  const a = libro.getBoundingClientRect(), b = $('#aPortada').getBoundingClientRect();
  const s = Math.min(b.width / a.width, b.height / a.height) * .8;
  return `translate(${(b.left + b.width / 2 - a.left - a.width * s / 2).toFixed(1)}px,${(b.top + b.height / 2 - a.top - a.height * s / 2).toFixed(1)}px) scale(${s.toFixed(4)})`;
}
const late = el => { el.classList.remove('recibe', 'llega'); void el.offsetWidth; el.classList.add(el.matches('.mapa__etapa') ? 'llega' : 'recibe'); };
function abrirLibro(k, directo){
  clearTimeout(tTapa);
  document.documentElement.classList.add('ya-entro');
  SON.despertar(); if (!directo) SON.fx('libro'); if (!lite()) SON.musica(true);
  const en3D = anima() && !directo && !tapa.hidden && tres() && window.Inmersivo;
  const destino = anima() && !directo && !tapa.hidden && !en3D ? haciaBoton() : null;      // se mide antes de que algo se mueva
  if (k != null) irAEtapa(k, 'auto'); else irA(0, 'auto');
  seguirEtapa(true);
  app.dataset.estado = 'mampara';
  if (animLibro){ animLibro.cancel(); animLibro = null; }
  conPiezas(() => {}).catch(() => {});
  let dura = destino ? 940 : 0;
  if (en3D){
    // modo inmersivo: la tapa gira sobre el lomo y la cámara entra a la primera página
    dura = window.Inmersivo.abrirLibro();
    sala.animate([{opacity: 0, transform: 'scale(1.06)'}, {opacity: 1, transform: 'none'}], {duration: 900, delay: dura - 760, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards'});
    mapa.animate([{opacity: 0}, {opacity: 1}], {duration: 500, delay: dura - 500, easing: 'ease-out', fill: 'backwards'});
    vibrar(14);
  }
  if (destino){
    // el libro se levanta, se encoge y se guarda en su botón; la mampara llega desde la derecha
    animLibro = libro.animate([{transform: 'none', opacity: 1}, {transform: 'translateY(-8px) scale(1.012)', opacity: 1, offset: .14},
      {transform: destino, opacity: 1, offset: .84}, {transform: destino, opacity: 0}], {duration: 880, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards'});
    animLibro.finished.then(() => { late($('#aPortada')); SON.fx('tic'); }, () => {});
    sala.animate([{opacity: 0, transform: 'translateX(32px)'}, {opacity: 1, transform: 'none'}], {duration: 820, delay: 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards'});
    mapa.animate([{opacity: 0}, {opacity: 1}], {duration: 500, delay: 100, easing: 'ease-out', fill: 'backwards'});
    if (k != null) setTimeout(() => late(tira.querySelector(`.mapa__etapa[data-k="${k}"]`)), 760);   // la etapa elegida en el índice se marca en el minimapa
  }
  tTapa = setTimeout(() => { tapa.hidden = true; if (animLibro){ animLibro.cancel(); animLibro = null; } if (window.Inmersivo) window.Inmersivo.libroGuardado(); if (window.Fondos) window.Fondos.portada(tapaEscena, SERIE, false); }, dura);
  if (!observador){
    observador = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) activarEtapa(+e.target.dataset.k); }), {root: sala, threshold: .12});
    setTimeout(() => periodosEl.querySelectorAll('.periodo').forEach(s => observador.observe(s)), reduce.matches ? 0 : 420);
    // lo que se mueve en cada etapa corre sólo cerca de la pantalla (con margen amplio: al lanzar la mampara ya está corriendo)
    const ojo = new IntersectionObserver(es => es.forEach(e => { const k = +e.target.dataset.k; if (e.isIntersecting) enVista.add(k); else enVista.delete(k); escenariosEl.querySelector(`.escena[data-k="${k}"]`)?.classList.toggle('en-vista', e.isIntersecting); }), {root: sala, rootMargin: '0px 60%'});
    periodosEl.querySelectorAll('.periodo').forEach(s => ojo.observe(s));
    // al final del recorrido, el año final se estampa
    const fin = $('.cedula--fin'), alFin = new IntersectionObserver(es => { if (es[0].isIntersecting){ fin.classList.add('vista'); alFin.disconnect(); } }, {root: sala, threshold: .6});
    alFin.observe(fin);
  }
  if (!lite()) setTimeout(() => SON.precargar(), 2500);
  completarSinConexion();
}
function volverPortada(){
  if (app.dataset.estado === 'portada') return;
  clearTimeout(tTapa); cerrarFicha(); frenar();
  SON.fx('cierraLibro');
  if (animLibro){ animLibro.cancel(); animLibro = null; }
  document.documentElement.classList.add('tapa-lista');
  tapa.hidden = false; void tapa.offsetWidth; app.dataset.estado = 'portada';
  if (window.Fondos && !lite()) window.Fondos.portada(tapaEscena, SERIE, true);
  if (anima() && tres() && window.Inmersivo){ window.Inmersivo.volverLibro(); }   // la cámara sale de la página y la tapa se cierra
  else if (anima()){
    // el libro sale de su botón y vuelve a su lugar
    const desde = haciaBoton();
    animLibro = libro.animate([{transform: desde, opacity: 0}, {transform: desde, opacity: 1, offset: .1}, {transform: 'none', opacity: 1}], {duration: 780, easing: 'cubic-bezier(.3,.75,.2,1)'});
    animLibro.finished.then(() => { animLibro = null; }, () => {});
  }
  $('#abrir').focus({preventScroll: true});
}
function prepararTapa(){
  // la portada aparece cuando ya cargaron sus letras (a lo más 1.2 s) y se imprime pieza por pieza
  // el libro ya se ve desde el primer cuadro y la cabeza de index.html lo imprime en cuanto están sus letras;
  // después se pide en calma lo que no hace falta para la portada
  const impresa = () => { avisarTapa(); enCalma(() => { prepararModo(); conPiezas(() => {}).catch(() => {}); }, 1200); };
  if (window.tapaImpresa) impresa(); else document.addEventListener('tapaimpresa', impresa, {once: true});
  if (!raton.matches) return;
  // con ratón: la luz recorre la portada y el índice se amplía bajo el puntero
  const chips = [...$('#indice').querySelectorAll('button')];
  tapa.addEventListener('pointermove', e => {
    if (app.dataset.estado !== 'portada' || reduce.matches || lite()) return;
    const r = libro.getBoundingClientRect();
    libro.style.setProperty('--bx', (clamp((e.clientX - r.left) / r.width, 0, 1) * 100).toFixed(1) + '%'); libro.style.setProperty('--by', (clamp((e.clientY - r.top) / r.height, 0, 1) * 100).toFixed(1) + '%');
    chips.forEach(b => { const q = b.getBoundingClientRect(), d = Math.hypot(e.clientX - q.left - q.width / 2, e.clientY - q.top - q.height / 2); b.style.setProperty('--m', (1 + .2 * Math.exp(-d * d / 9000)).toFixed(3)); });
  });
  tapa.addEventListener('pointerleave', () => chips.forEach(b => b.style.setProperty('--m', 1)));
}
let medida = '';
function componer(forzar){
  const m = `${app.clientWidth}x${app.clientHeight}:${sala.clientWidth}x${sala.clientHeight}`;
  if (m === medida && !forzar) return; medida = m;
  medir(); colocarHojas(); dibujar(); alDesplazar(); if (!visor.hidden) ajustarVisor(); cerrarFicha(); medirPolvo();
  mapa.style.setProperty('--alto-mapa', mapa.offsetHeight + 'px'); app.style.setProperty('--alto-mapa', mapa.offsetHeight + 'px');
}

// la portada ya se imprimió: hasta entonces no se pide nada que compita con ella (service worker, fondos, piezas)
let avisarTapa; const tapaImpresa = new Promise(r => { avisarTapa = r; });

/* =====================================================================
   7 · LOS PAPELES SE MECEN: cada hoja cuelga de su clip y responde al movimiento de la mampara
   ===================================================================== */
let rafColg = 0, tColg = 0, xColg = null, vColg = 0, aColg = 0, tMovio = 0;
function hiloDe(id){ return hilos[id] || (hilos[id] = document.getElementById('hilo-' + id)); }
function moverHilo(id, th){                     // el hilo sale del pie de la hoja: la sigue al mecerse
  const l = hiloDe(id), p = POS[id]; if (!l || !p) return;
  const piv = p.top - p.h * .09, L = p.h * 1.09 - 2;
  l.setAttribute('x1', (p.cx - L * Math.sin(th)).toFixed(1)); l.setAttribute('y1', (piv + L * Math.cos(th)).toFixed(1));
}
function despertarColgantes(){ tMovio = performance.now(); if (!anima() || lite() || rafColg) return; tColg = 0; rafColg = requestAnimationFrame(mecer); }
function mecer(t){
  rafColg = 0;
  const dt = tColg ? Math.min(.05, (t - tColg) / 1000) : 1 / 60; tColg = t;
  const x = sala.scrollLeft, v = xColg == null ? 0 : (x - xColg) / dt; xColg = x;
  aColg += (clamp((v - vColg) / dt, -26000, 26000) - aColg) * .45; vColg = v;      // aceleración de la pared (suavizada)
  const izq = x - franja.offsetLeft - 80, der = izq + M.W + 160;
  let sigue = Math.abs(v) > 2 || Math.abs(aColg) > 40 || t - tMovio < 160;      // sigue un momento tras el último desplazamiento
  const d3 = tres();
  for (const id in colg){
    const c = colg[id], p = POS[id];
    if (!p || p.cx < izq || p.cx > der){ if (c.th || c.tw){ c.th = c.om = c.tw = c.ow = 0; c.el.style.transform = ''; moverHilo(id, 0); } continue; }
    // péndulo amortiguado: la pared acelera y la hoja, por inercia, se queda atrás
    c.om = clamp(c.om + (-c.k * c.th - 3.6 * c.om - aColg * 1.75e-4 * c.k / 30) * dt, -1.6, 1.6);
    c.th = clamp(c.th + c.om * dt, -.11, .11);
    // en 3D, el aire que levanta la pared al moverse tuerce el papel sobre su clip y luego regresa
    if (d3){ c.ow = clamp((c.ow || 0) + (-c.k * .7 * (c.tw || 0) - 2.8 * (c.ow || 0) - v * 2.2e-4 * c.k / 30) * dt, -2.4, 2.4); c.tw = clamp((c.tw || 0) + c.ow * dt, -.5, .5); }
    if (Math.abs(c.th) > .0012 || Math.abs(c.om) > .006 || (d3 && (Math.abs(c.tw) > .002 || Math.abs(c.ow) > .01))){
      sigue = true; c.el.style.transform = d3 ? `perspective(700px) rotateY(${c.tw.toFixed(4)}rad) rotate(${c.th.toFixed(4)}rad)` : `rotate(${c.th.toFixed(4)}rad)`; moverHilo(id, c.th);
    }
    else if (c.th || c.om || c.tw || c.ow){ c.th = c.om = c.tw = c.ow = 0; c.el.style.transform = ''; moverHilo(id, 0); }
  }
  if (sigue) rafColg = requestAnimationFrame(mecer); else { xColg = null; vColg = 0; aColg = 0; }
}
function empujar(id, w){ const c = colg[id]; if (!c || !anima() || lite()) return; c.om = clamp(c.om + w, -1.6, 1.6); if (tres()) c.ow = clamp((c.ow || 0) - w * 2.2, -2.4, 2.4); despertarColgantes(); }
function quietar(id){ const c = colg[id]; if (!c) return; c.th = c.om = c.tw = c.ow = 0; c.el.style.transform = ''; moverHilo(id, 0); }

/* =====================================================================
   8 · AMBIENTE: la luz de la sala y el polvo en el aire
   ===================================================================== */
const pz = polvo.getContext('2d');
let motas = [], rafPolvo = 0, tPolvo = 0, escalaP = 1;
function mota(alAzar){ return {x: Math.random(), y: alAzar ? Math.random() : 1.04, z: .35 + Math.random() * .65, r: .5 + Math.random() * 1.3, f: Math.random() * 6.3, v: .008 + Math.random() * .014}; }
function medirPolvo(){
  escalaP = Math.min(1.5, window.devicePixelRatio || 1);
  polvo.width = Math.round(app.clientWidth * escalaP); polvo.height = Math.round(app.clientHeight * escalaP);
  const n = app.clientWidth < 600 ? 14 : 26; while (motas.length < n) motas.push(mota(true)); motas.length = n;
  if (rafPolvo) pintarPolvo(0);                                          // cambiar el tamaño borra el canvas: se redibuja enseguida (si no, el polvo parpadeaba)
}
function polvear(t){
  rafPolvo = 0;
  if (document.hidden || !visor.hidden || lite()){ tPolvo = 0; return; }   // se reanuda al cerrar la hoja o al volver a la pestaña
  rafPolvo = requestAnimationFrame(polvear);
  if (t - tPolvo < 32 || t - tMovio < 180) return;                      // unos 30 cuadros por segundo; quietas mientras la mampara se desplaza
  const dt = tPolvo ? Math.min(.1, (t - tPolvo) / 1000) : .03; tPolvo = t;
  pintarPolvo(dt);
}
function pintarPolvo(dt){
  const W = polvo.width, H = polvo.height, d3 = tres() && window.Inmersivo ? window.Inmersivo.inclinacion : null;
  pz.clearRect(0, 0, W, H); pz.fillStyle = '#ffe3b4';
  for (const m of motas){
    m.y -= m.v * dt * m.z; m.f += dt * .7;
    m.x += Math.sin(m.f) * .0035 * dt;
    if (m.y < -.04) Object.assign(m, mota(false)); m.x -= Math.floor(m.x);
    const enLuz = Math.max(0, 1 - Math.hypot(m.x - .5, (m.y - .16) * 1.25) * 1.3);
    pz.globalAlpha = (.08 + enLuz * .5) * (.8 + .2 * Math.sin(m.f * 1.9)) * m.z;    // brillo tranquilo (no titila)
    const px = m.x * W + (d3 ? d3.x * m.z * 26 * escalaP : 0), py = m.y * H + (d3 ? d3.y * m.z * 18 * escalaP : 0);   // en 3D, las motas cercanas se corren más
    pz.beginPath(); pz.arc(px, py, m.r * escalaP * m.z * (d3 ? 1.25 : 1), 0, 6.2832); pz.fill();
  }
}
function arrancarPolvo(){ if (lite() || !anima() || rafPolvo || document.hidden) return; polvo.classList.add('ver'); rafPolvo = requestAnimationFrame(polvear); }
function prepararAmbiente(){
  // con ratón, la luz de la sala sigue al puntero (despacio)
  if (raton.matches){
    let lx = 50, ly = 14, mx = 50, my = 14, raf = 0;
    const seguir = () => { raf = 0; lx += (mx - lx) * .07; ly += (my - ly) * .07; luz.style.setProperty('--lx', lx.toFixed(1) + '%'); luz.style.setProperty('--ly', ly.toFixed(1) + '%'); if (Math.abs(mx - lx) + Math.abs(my - ly) > .3) raf = requestAnimationFrame(seguir); };
    app.addEventListener('pointermove', e => { if (reduce.matches || lite()) return; const r = app.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 100; my = clamp((e.clientY - r.top) / r.height * 100 - 20, 2, 55); if (!raf) raf = requestAnimationFrame(seguir); }, {passive: true});
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) arrancarPolvo(); });
  arrancarPolvo();
}

/* =====================================================================
   9 · LUPA: examinar de cerca la foto de la hoja
   Con ratón basta pasar por la foto; en el celular, dejar el dedo un momento (o tocar el botón de la lupa).
   ===================================================================== */
let lupaImg = null, lupaFija = false, lupaDedo = false, usoLupa = false, tLupa = 0, inicioLupa = null, tLupaSon = 0;
function cajaFoto(img){                        // dónde quedó pintada la foto dentro de su marco (object-fit)
  const r = img.getBoundingClientRect(), iw = img.naturalWidth, ih = img.naturalHeight; if (!iw || !r.width) return null;
  const cs = getComputedStyle(img), k = cs.objectFit === 'cover' ? Math.max(r.width / iw, r.height / ih) : Math.min(r.width / iw, r.height / ih);
  const w = iw * k, h = ih * k, [px, py] = cs.objectPosition.split(' ').map(v => parseFloat(v) / 100);
  return {left: r.left + (r.width - w) * (isNaN(px) ? .5 : px), top: r.top + (r.height - h) * (isNaN(py) ? .5 : py), w, h};
}
function apuntarLupa(x, y, alza = 0){
  const c = lupaImg && cajaFoto(lupaImg); if (!c) return;
  const Z = 2.5, D = lupa.offsetWidth, rv = visor.getBoundingClientRect();
  const fx = clamp((x - c.left) / c.w, 0, 1), fy = clamp((y - c.top) / c.h, 0, 1);
  lupa.style.backgroundSize = `${(c.w * Z).toFixed(1)}px ${(c.h * Z).toFixed(1)}px`;
  lupa.style.backgroundPosition = `${(D / 2 - fx * c.w * Z).toFixed(1)}px ${(D / 2 - fy * c.h * Z).toFixed(1)}px`;
  lupa.style.translate = `${(x - rv.left).toFixed(1)}px ${(y - rv.top - alza).toFixed(1)}px`;
}
function verLupa(img, x, y, alza = 0){
  if (lupaImg !== img || !lupa.classList.contains('ver')){
    lupaImg = img; lupa.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    apuntarLupa(x, y, alza); void lupa.offsetWidth;
    lupa.classList.add('ver'); visor.classList.add('con-lupa');
    if (performance.now() - tLupaSon > 900){ SON.fx('lupa'); tLupaSon = performance.now(); }
  } else apuntarLupa(x, y, alza);
}
function esconderLupa(){
  clearTimeout(tLupa); inicioLupa = null; lupaDedo = false;
  lupa.classList.remove('ver'); visor.classList.remove('con-lupa');
  if (lupaFija){ lupaFija = false; hojaEl.querySelector('.portada__lupa')?.setAttribute('aria-pressed', 'false'); }
}
function prepararFoto(){                        // cada hoja nueva trae su foto: se le ponen los gestos de la lupa
  const marco = hojaEl.querySelector('.portada__marco'), img = marco && marco.querySelector('img'); if (!img) return;
  const alza = () => lupa.offsetWidth * .72;    // con el dedo, la lupa va arriba para que se vea
  marco.addEventListener('contextmenu', e => e.preventDefault());
  marco.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || e.target.closest('.portada__lupa') || !hojaEl.classList.contains('abierta')) return;
    const t = e.touches[0], x = t.clientX, y = t.clientY;
    if (lupaFija){ lupaDedo = true; verLupa(img, x, y, alza()); return; }
    inicioLupa = {x0: x, y0: y, x, y}; clearTimeout(tLupa);
    tLupa = setTimeout(() => { if (!inicioLupa) return; lupaDedo = true; verLupa(img, inicioLupa.x, inicioLupa.y, alza()); if (navigator.vibrate) navigator.vibrate(8); }, 330);
  }, {passive: true});
  marco.addEventListener('touchmove', e => {
    const t = e.touches[0];
    if (lupaDedo){ e.preventDefault(); apuntarLupa(t.clientX, t.clientY, alza()); return; }
    if (!inicioLupa) return;
    if (Math.hypot(t.clientX - inicioLupa.x0, t.clientY - inicioLupa.y0) > 10){ clearTimeout(tLupa); inicioLupa = null; }   // era un desplazamiento
    else { inicioLupa.x = t.clientX; inicioLupa.y = t.clientY; }
  }, {passive: false});
  const suelta = () => { clearTimeout(tLupa); inicioLupa = null; if (lupaDedo){ lupaDedo = false; usoLupa = true; if (!lupaFija){ lupa.classList.remove('ver'); visor.classList.remove('con-lupa'); } } };
  marco.addEventListener('touchend', suelta); marco.addEventListener('touchcancel', suelta);
  marco.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && hojaEl.classList.contains('abierta') && !e.target.closest('.portada__lupa')) verLupa(img, e.clientX, e.clientY); else if (e.pointerType === 'mouse' && !lupaFija) esconderLupa(); });
  marco.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !lupaFija) esconderLupa(); });
}
function prepararLupa(){
  hojaEl.addEventListener('click', e => {
    const b = e.target.closest('.portada__lupa'); if (!b) return;
    if (lupaFija){ esconderLupa(); return; }
    lupaFija = true; b.setAttribute('aria-pressed', 'true');
    const img = b.parentElement.querySelector('img'), r = img.getBoundingClientRect();
    verLupa(img, r.left + r.width / 2, r.top + r.height / 2);
  });
  rollo.addEventListener('scroll', () => { if (!lupaDedo && lupa.classList.contains('ver')) esconderLupa(); }, {passive: true});
}

/* =====================================================================
   10 · NÚMEROS QUE RUEDAN (como en una sumadora) y SONIDO
   ===================================================================== */
function rodar(el, retraso = 0){
  if (!el || !anima()) return;
  const nodo = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.textContent)); if (!nodo) return;
  const txt = nodo.textContent, caja = document.createElement('span'), lector = document.createElement('span'), giros = [];
  caja.className = 'rodillo'; caja.setAttribute('aria-hidden', 'true'); lector.className = 'solo-lector'; lector.textContent = txt;
  const lh = el.matches('.h-dato strong') ? 1 : 1.25;
  let n = 0;
  for (const ch of txt){
    const s = document.createElement('span');
    if (!/\d/.test(ch)){ s.textContent = ch === ' ' ? ' ' : ch; caja.append(s); continue; }
    const col = document.createElement('span'); s.className = 'r'; col.innerHTML = [...'01234567890123456789'].join('<br>'); s.append(col); caja.append(s);
    giros.push(col.animate([{transform: 'translateY(0)'}, {transform: `translateY(-${(10 + +ch) * lh}em)`}], {duration: 540 + n * 90, delay: retraso + n * 35, easing: 'cubic-bezier(.15,.7,.2,1)', fill: 'both'}));
    n++;
  }
  nodo.replaceWith(caja, lector);
  // al terminar, vuelve el texto de siempre (con su tipografía exacta)
  Promise.all(giros.map(g => g.finished)).then(() => { if (caja.isConnected){ caja.replaceWith(nodo); lector.remove(); } }, () => {});
}
function prepararSonido(){
  const b = $('#sonido');
  if (!SON.disponible){ b.hidden = true; return; }
  b.addEventListener('click', () => SON.alternar());
  SON.alCambiar(on => { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Silenciar' : 'Activar el sonido'); b.title = on ? 'Silenciar' : 'Activar el sonido'; });
  // los navegadores sólo dejan sonar después de un toque: cada toque lo despierta
  ['pointerdown', 'pointerup', 'keydown'].forEach(t => window.addEventListener(t, () => SON.despertar(), {capture: true, passive: true}));
}

/* =====================================================================
   12 · LOS TRES MODOS: lite (carga rápido), normal (como siempre) e inmersivo (3D)
   ===================================================================== */
const NOMBRES = {lite: 'Lite', normal: 'Normal', inmersivo: 'Inmersivo'};
const ICONOS = {
  lite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 4.5C11.5 4.5 6 10 5.5 18.5"/><path d="M19.5 4.5c-.6 6.8-5.2 11.4-12 12"/><path d="M4.5 19.5l4-4"/></svg>',
  normal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3.5" width="12" height="17" rx="1.2"/><path d="M9 8h6M9 11.5h6M9 15h4"/></svg>',
  inmersivo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
};
const instaladaApp = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let pantallaCompleta = false;
// lo que inmersivo.js usa de la app
const API = {app, sala, franja, tapa, libro, visor, rollo, hojaEl, escenarios: escenariosEl, visorEscena, tapaEscena, polvo,
  cuerpo: $('#cuerpoLibro'), frente: $('#tapaFrente'), medidas: () => M, anima, raton, son: n => SON.fx(n)};
function pintarModo(){
  const m = modo();
  document.querySelectorAll('.modos [data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
  const bot = $('#modoBoton'); bot.querySelector('.modo-ico').innerHTML = ICONOS[m];
  bot.setAttribute('aria-label', `Modo ${NOMBRES[m]}: cambiar el modo`); bot.title = `Modo ${NOMBRES[m]}`;
}
// lo que necesita cada modo: el papel de la franja, fondos.js (normal e inmersivo) e inmersivo.js
function prepararModo(){
  if (lite()) return;
  const papel = franja.querySelector('.franja__papel'); if (papel && !papel.getAttribute('src') && papel.dataset.src) papel.src = papel.dataset.src;
  cargarScript('fondos.js').then(() => {
    if (lite()) return;
    if (!escenariosEl.firstChild) componer(true);            // la escenografía de cada etapa
    if (app.dataset.estado === 'portada' && !tapa.hidden) window.Fondos.portada(tapaEscena, SERIE, true);
    if (!visor.hidden && actual) window.Fondos.hoja(visorEscena, porId[actual], SERIE);
  }).catch(() => {});
  if (tres()) cargarScript('inmersivo.js').then(() => { if (tres()) window.Inmersivo.activar(API); }).catch(() => {});
}
function ponerModo(m){
  const antes = modo(); if (m === antes) return;
  raiz.dataset.modo = m; raiz.removeAttribute('data-modo-auto');
  try { localStorage.setItem('mampara-modo', m); } catch (e){}
  pintarModo();
  if (antes === 'inmersivo' && window.Inmersivo) window.Inmersivo.desactivar();
  if (m !== 'inmersivo' && pantallaCompleta && document.fullscreenElement){ document.exitFullscreen().catch(() => {}); pantallaCompleta = false; }
  if (m === 'lite'){
    // nada corriendo de fondo: sin escenografía, sin polvo, sin vaivén y sin música
    if (window.Fondos){ window.Fondos.portada(tapaEscena, SERIE, false); window.Fondos.soltarHoja(); }
    escenariosEl.innerHTML = '';
    for (const id in colg) quietar(id);
    cancelAnimationFrame(rafPolvo); rafPolvo = 0; polvo.classList.remove('ver');
    SON.musica(false);
  } else {
    prepararModo(); arrancarPolvo();
    if (app.dataset.estado === 'mampara') SON.musica(true);
  }
  avisar(`Modo ${NOMBRES[m]}`);
}
// inmersivo: el giroscopio (el iPhone pide permiso) y la pantalla completa en celulares y tabletas. Se piden dentro del toque.
// Devuelve true si pidió la pantalla completa (la página va a cambiar de tamaño).
function pedirInmersion(){
  try { const DOE = window.DeviceOrientationEvent; if (DOE && typeof DOE.requestPermission === 'function') DOE.requestPermission().then(r => { if (r === 'granted' && window.Inmersivo) window.Inmersivo.giroscopio(); }).catch(() => {}); } catch (e){}
  if (raton.matches || instaladaApp || !raiz.requestFullscreen || document.fullscreenElement) return false;
  raiz.requestFullscreen({navigationUI: 'hide'}).then(() => { pantallaCompleta = true; }, () => {});
  return true;
}
function abrirMenuModo(){ const menu = $('#menuModo'); menu.hidden = false; $('#modoBoton').setAttribute('aria-expanded', 'true'); SON.fx('papel'); (menu.querySelector('[aria-pressed="true"]') || menu.querySelector('button')).focus({preventScroll: true}); }
function cerrarMenuModo(devolver){ const menu = $('#menuModo'); if (menu.hidden) return; menu.hidden = true; $('#modoBoton').setAttribute('aria-expanded', 'false'); if (devolver) $('#modoBoton').focus({preventScroll: true}); }
function prepararModos(){
  pintarModo();
  document.querySelectorAll('.modos [data-modo]').forEach(b => b.addEventListener('click', () => {
    const m = b.dataset.modo;
    if (m === 'inmersivo' && modo() !== 'inmersivo') pedirInmersion();
    ponerModo(m); SON.fx('tic');
    if (b.closest('.menu-modo')) cerrarMenuModo(true);
  }));
  const bot = $('#modoBoton'), menu = $('#menuModo');
  bot.addEventListener('click', () => (menu.hidden ? abrirMenuModo() : cerrarMenuModo()));
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('#menuModo, #modoBoton')) cerrarMenuModo(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden){ e.stopPropagation(); cerrarMenuModo(true); } }, true);
  // si el modo lite se eligió solo (equipo o conexión débil), se avisa una vez
  if (raiz.hasAttribute('data-modo-auto') && lite()) setTimeout(() => avisar('Modo Lite: así carga más rápido'), 3200);
}
// sin conexión: con buena conexión (y fuera de lite), el service worker guarda en calma lo que falta del libro
let completando = false;
function completarSinConexion(siempre){                  // siempre: la app instalada (quien la instala quiere usarla sin internet)
  if (completando || (lite() && !siempre) || !('serviceWorker' in navigator)) return;
  const c = navigator.connection || {}; if (c.saveData || (!siempre && (/2g$/.test(c.effectiveType || '') || (c.effectiveType === '3g' && c.downlink > 0 && c.downlink < 1)))) return;
  completando = true;
  setTimeout(() => enCalma(() => navigator.serviceWorker.ready.then(reg => { if (reg.active) reg.active.postMessage('completar'); }).catch(() => {}), 5000), 8000);
}
// abrir el libro: en el modo inmersivo, primero la pantalla completa (si cambia de tamaño, se espera a que termine)
function entrar(k){
  if (tres() && pedirInmersion()){
    let hecho = false; const va = () => { if (!hecho){ hecho = true; requestAnimationFrame(() => abrirLibro(k)); } };
    document.addEventListener('fullscreenchange', () => setTimeout(va, 160), {once: true}); setTimeout(va, 600);
  } else abrirLibro(k);
}

armarFijos(); componer(); prepararNavegacion(); prepararTapa(); prepararAmbiente(); prepararLupa(); prepararSonido(); prepararModos();
let tRe; new ResizeObserver(() => { cancelAnimationFrame(tRe); tRe = requestAnimationFrame(() => componer()); }).observe(app);
$('#abrir').addEventListener('click', () => entrar());
$('#indice').addEventListener('click', e => { const b = e.target.closest('button'); if (b) entrar(+b.dataset.k); });
$('#cerrar').addEventListener('click', pedirCierre);
$('#velo').addEventListener('click', pedirCierre);
rollo.addEventListener('click', e => { if (e.target === rollo || e.target.classList.contains('visor__lienzo')) pedirCierre(); });
$('#anterior').addEventListener('click', () => cambiarHoja(-1));
$('#siguiente').addEventListener('click', () => cambiarHoja(1));
$('#panelCerrar').addEventListener('click', cerrarPanel);
panel.addEventListener('click', e => { if (e.target === panel) cerrarPanel(); });

// gestos en el visor: deslizar a los lados cambia de hoja; deslizar hacia abajo (estando hasta arriba) la cierra
let toque = null;
rollo.addEventListener('touchstart', e => { toque = e.touches.length === 1 && !e.target.closest('.artefacto') ? {x: e.touches[0].clientX, y: e.touches[0].clientY, s: rollo.scrollTop, t: Date.now()} : null; }, {passive: true});
rollo.addEventListener('touchend', e => {
  if (usoLupa){ usoLupa = false; toque = null; return; }             // fue la lupa, no un gesto
  if (!toque) return; const c = e.changedTouches[0], dx = c.clientX - toque.x, dy = c.clientY - toque.y, t0 = toque; toque = null;
  if (Date.now() - t0.t > 700 || String(getSelection()).length) return;
  if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.8) cambiarHoja(dx < 0 ? 1 : -1);
  else if (dy > 96 && dy > Math.abs(dx) * 1.8 && t0.s <= 0 && rollo.scrollTop <= 0) pedirCierre();
}, {passive: true});

/* =====================================================================
   11 · VERSIÓN INSTALABLE: historial, instalación y trabajo sin conexión
   ===================================================================== */
if (PWA){
  window.addEventListener('popstate', e => {
    const id = e.state && e.state.hoja;
    if (!visor.hidden && !id) cerrarHoja();
    else if (visor.hidden && id && porId[id] && app.dataset.estado === 'mampara') abrirHoja(id, false);
  });
  // enlace directo a una hoja: …/#K1
  const inicial = porId[location.hash.slice(1)];
  if (location.hash) try { history.replaceState(null, '', location.pathname + location.search); } catch (e){}   // sólo con enlace directo (si no, estorba a la transición de entrada)
  if (inicial){
    abrirLibro(inicial.k, true);
    setTimeout(() => { centrar(minis[inicial.id]); requestAnimationFrame(() => abrirHoja(inicial.id)); }, reduce.matches ? 60 : 1500);
  }
  // instalar: aviso al entrar (si aún no está instalada) y botón en la cédula
  const instalada = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const esMovil = esIOS || /Android/i.test(navigator.userAgent);
  const cartel = $('#instala'), botones = document.querySelectorAll('[data-abre="instalar"]');
  let invitacion = null;
  const guardar = v => { try { localStorage.setItem('mampara-instalar', v); } catch (e){} };
  const pospuesta = () => { try { return Date.now() - (+localStorage.getItem('mampara-instalar') || 0) < 3 * 864e5; } catch (e){ return false; } };
  const ocultarCartel = () => { cartel.classList.remove('ver'); setTimeout(() => cartel.hidden = true, reduce.matches ? 0 : 320); };
  const mostrarCartel = () => {
    if (instalada || pospuesta() || !cartel.hidden) return;
    cartel.querySelector('img').src = 'img/iconos/icono-192.png'; cartel.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => cartel.classList.add('ver')));
  };
  const pasos = () => {
    const ios = `<h3>iPhone o iPad</h3><ol class="pasos"><li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba).</li><li>Elige <b>Agregar a Inicio</b>.</li></ol>`;
    const android = `<h3>Android</h3><ol class="pasos"><li>Abre esta página en <b>Chrome</b>.</li><li>Toca el menú <b>⋮</b>.</li><li>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</li></ol>`;
    abrirPanel('Instalar en el celular', `<p>Instalada se abre a pantalla completa, como una app, y funciona sin internet.</p>${esIOS ? ios : esMovil ? android : ios + android}`);
  };
  const instalar = () => {
    ocultarCartel();
    if (!invitacion){ pasos(); return; }
    invitacion.prompt();
    invitacion.userChoice.then(r => { if (r.outcome !== 'accepted') guardar(Date.now()); invitacion = null; }).catch(() => {});
  };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); invitacion = e; mostrarCartel(); });
  window.addEventListener('appinstalled', () => { invitacion = null; ocultarCartel(); botones.forEach(b => b.hidden = true); avisar('Listo: la app quedó instalada'); completarSinConexion(true); });
  if (instalada) tapaImpresa.then(() => completarSinConexion(true));
  botones.forEach(b => { b.hidden = instalada; b.addEventListener('click', instalar); });
  $('#instalaSi').addEventListener('click', instalar);
  $('#instalaNo').addEventListener('click', () => { guardar(Date.now()); ocultarCartel(); });
  if (esMovil && !inicial) setTimeout(mostrarCartel, 1100);
  // sin conexión: el service worker guarda lo esencial al instalarse y lo demás en calma; si hay versión nueva, se ofrece actualizar.
  // Se registra cuando la página ya cargó y la portada ya se imprimió: no compite con la llegada ni corta la transición desde la portada del semestre
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    let actualizando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (actualizando) location.reload(); });
    const registrar = () => navigator.serviceWorker.register('sw.js').then(reg => {
      const ofrecer = sw => avisar('Hay una versión nueva', 'Actualizar', () => { actualizando = true; sw.postMessage('activar'); });
      if (reg.waiting && navigator.serviceWorker.controller) ofrecer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing; if (!nuevo) return;
        nuevo.addEventListener('statechange', () => { if (nuevo.state === 'installed' && navigator.serviceWorker.controller) ofrecer(nuevo); });
      });
    }).catch(() => {});
    const cargada = new Promise(r => { if (document.readyState === 'complete') r(); else window.addEventListener('load', r, {once: true}); });
    Promise.all([cargada, tapaImpresa]).then(() => setTimeout(() => enCalma(registrar, 3000), 1500));
  }
}
})();
