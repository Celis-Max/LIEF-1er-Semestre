(() => {
'use strict';
/* =====================================================================
   LIBRO DIGITAL · MAMPARA «MÉXICO 1916–1940»
   Los datos viven en datos.js (window.DATOS): la tabla de indicadores, las 28 hojas y los dibujos.
   ===================================================================== */
const {serie: SERIE, hojas: HOJAS, simbolos: SIMBOLOS} = window.DATOS;
const PWA = true;         // true en la versión instalable (historial, instalación y trabajo sin conexión)

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

/* ============================ utilidades ============================ */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
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

const app = $('#app'), sala = $('#sala'), franja = $('#franja'), lienzo = $('#lienzo'), colgadas = $('#colgadas'),
      eje = $('#eje'), periodosEl = $('#periodos'), tira = $('#tira'), ficha = $('#ficha'), columna = $('#columna'),
      visor = $('#visor'), rollo = $('#rollo'), hojaEl = $('#hoja'), aviso = $('#aviso'), panel = $('#panel'), mapa = $('#mapa');
const porId = Object.fromEntries(HOJAS.map(h => [h.id, h]));
const DISPONIBLES = HOJAS.filter(h => !h.pendiente).map(h => h.id);
const vivos = new Set();          // etapas que ya entraron en pantalla
const minis = {};                 // id → botón de la hoja en la mampara
let M = {};                       // medidas vigentes
let POS = {};                     // id → posición de cada hoja en la franja

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
        <div class="cab__ico" aria-hidden="true">${p.iconos.map(n => icono(n)).join('')}</div>
      </header>
    </section>`).join('');
  eje.innerHTML = SERIE.anios.map(a => `<button type="button" data-k="${etapaDe(a).k}" data-anio="${a}" aria-expanded="false" aria-label="Indicadores de ${a}">${a}</button>`).join('');
  colgadas.innerHTML = HOJAS.map(h => h.pendiente
    ? `<button type="button" class="hoja-mini pendiente" data-id="${h.id}" data-k="${h.k}" aria-label="Hoja pendiente: ${h.titulo}">
         <span class="pend__anio">${anioCorto(h.anio).replace('–', '–<wbr>')}</span><span class="pend__titulo">${h.titulo}</span><span class="pend__nota">pendiente</span></button>`
    : `<button type="button" class="hoja-mini" data-id="${h.id}" data-k="${h.k}" aria-label="Desplegar la hoja: ${h.titulo}, ${h.anio}">
         <span class="clip"></span>${portadaHTML(h, true)}</button>`).join('');
  colgadas.querySelectorAll('.hoja-mini').forEach(b => minis[b.dataset.id] = b);
  // minimapa
  tira.innerHTML = PERIODOS.map(p => `<button type="button" class="mapa__etapa" data-k="${p.k}" style="--n:${p.hasta - p.desde + 1}" aria-label="Ir a ${p.nombre}"><span>${p.corto}</span></button>`).join('')
    + `<svg class="mapa__chispa" viewBox="0 0 250 30" preserveAspectRatio="none" aria-hidden="true">${chispa(250, 30)}</svg><div class="mapa__ventana" id="ventana"></div>`;
  $('#tapaChispa').innerHTML = chispa(250, 46, true);
  $('#indice').innerHTML = PERIODOS.map(p => `<li><button type="button" data-k="${p.k}">${p.corto}</button></li>`).join('');
}
function portadaHTML(h, mini){
  return `<span class="portada" data-k="${h.k}"><span class="portada__cara">
    <span class="portada__anio">${mini ? anioCorto(h.anio) : h.anio}</span>
    <span class="portada__marco"><img src="${h.img}" alt="${mini ? '' : h.pie.replace(/"/g, '&quot;')}" draggable="false" decoding="async"${mini && h.k > 0 ? ' loading="lazy"' : ''} style="object-fit:${h.ajuste};object-position:${h.pos}"></span>
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
  let s = '<defs>' + TINTA.map((c, k) => `<linearGradient id="lav${k}" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${f(base - alto * .9)}" y2="${f(base)}"><stop offset="0" stop-color="${c}" stop-opacity="${LAVADO[k] * 1.7}"/><stop offset="1" stop-color="${c}" stop-opacity="${LAVADO[k] * .35}"/></linearGradient>`).join('') + '</defs>';
  PERIODOS.forEach(p => {
    const k = p.k, c = TINTA[k], x0 = (p.desde - A0) * yw, x1 = (p.hasta - A0 + 1) * yw;
    const xs = [p.desde - .5]; for (let a = p.desde; a <= p.hasta; a++) xs.push(a); xs.push(p.hasta + .5);
    const camino = (serie, y) => xs.map((a, i) => `${i ? 'L' : 'M'}${f(X(a))} ${f(y(valor(serie, a)))}`).join('');
    s += `<g class="per${vivos.has(k) ? ' vivo' : ''}" data-k="${k}">`;

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
      s += `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${d.rot || 0})" opacity="${d.op}" color="${d.c || c}"><svg x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" viewBox="${sim.vb}" overflow="visible">${sim.svg}</svg></g>`;
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
        <line x1="${f(pos.cx)}" y1="${f(pos.top + pos.h - 2)}" x2="${f(X(a))}" y2="${f(y)}" stroke="${col}" stroke-width="1.1" stroke-dasharray="1.5 4" stroke-linecap="round" opacity=".75"/>
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
}

/* =====================================================================
   4 · NAVEGACIÓN: minimapa, rueda, arrastre, teclado, ficha de año
   ===================================================================== */
const suave = () => reduce.matches ? 'auto' : 'smooth';
function irA(x, comportamiento = suave()){ sala.scrollTo({left: clamp(x, 0, sala.scrollWidth - sala.clientWidth), behavior: comportamiento}); }
function irAEtapa(k, comportamiento){ irA(franja.offsetLeft + (PERIODOS[k].desde - A0) * M.yw - (k === 0 ? 18 : 10), comportamiento); }
function centrar(el){ irA(franja.offsetLeft + el.offsetLeft + el.offsetWidth / 2 - M.W / 2, 'auto'); }
let pendienteScroll = false;
function alDesplazar(){
  if (pendienteScroll) return; pendienteScroll = true;
  requestAnimationFrame(() => {
    pendienteScroll = false;
    const a = clamp((sala.scrollLeft - franja.offsetLeft) / M.Wf, 0, 1), b = clamp((sala.scrollLeft + M.W - franja.offsetLeft) / M.Wf, 0, 1);
    const v = $('#ventana'); v.style.left = (a * 100).toFixed(2) + '%'; v.style.width = Math.max(1.5, (b - a) * 100).toFixed(2) + '%';
    if (!ficha.hidden && Math.abs(sala.scrollLeft - ficha._x) > 24) cerrarFicha();
  });
}
function prepararNavegacion(){
  sala.addEventListener('scroll', alDesplazar, {passive: true});
  // rueda vertical del ratón → desplazamiento horizontal
  sala.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)){ sala.scrollLeft += e.deltaY; e.preventDefault(); } }, {passive: false});
  // arrastrar con el ratón
  let ar = null, arrastro = false;
  sala.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) ar = {x: e.clientX, s: sala.scrollLeft}; arrastro = false; });
  window.addEventListener('pointermove', e => { if (!ar) return; const dx = e.clientX - ar.x; if (Math.abs(dx) > 5){ arrastro = true; sala.classList.add('arrastra'); } if (arrastro) sala.scrollLeft = ar.s - dx; });
  window.addEventListener('pointerup', () => { ar = null; sala.classList.remove('arrastra'); });
  sala.addEventListener('click', e => { if (arrastro){ e.stopPropagation(); e.preventDefault(); arrastro = false; } }, true);
  // minimapa: tocar una etapa salta a ella; arrastrar recorre la franja
  let mp = null;
  const aFraccion = e => { const r = tira.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1); };
  tira.addEventListener('pointerdown', e => { mp = {x: e.clientX, movio: false}; tira.setPointerCapture(e.pointerId); });
  tira.addEventListener('pointermove', e => { if (!mp) return; if (Math.abs(e.clientX - mp.x) > 6) mp.movio = true; if (mp.movio) irA(franja.offsetLeft + aFraccion(e) * M.Wf - M.W / 2, 'auto'); });
  tira.addEventListener('pointerup', e => { if (!mp) return; if (!mp.movio){ const a = A0 + Math.floor(aFraccion(e) * N * .9999); irAEtapa(etapaDe(a).k); } mp = null; });
  tira.addEventListener('pointercancel', () => mp = null);
  tira.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ const b = e.target.closest('.mapa__etapa'); if (b){ e.preventDefault(); irAEtapa(+b.dataset.k); } } });
  // teclado
  window.addEventListener('keydown', e => {
    if (!panel.hidden && e.key === 'Escape'){ cerrarPanel(); return; }
    if (app.dataset.estado !== 'mampara') return;
    if (!visor.hidden){
      if (e.key === 'Escape') pedirCierre(); else if (e.key === 'ArrowRight') cambiarHoja(1); else if (e.key === 'ArrowLeft') cambiarHoja(-1);
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
  document.querySelectorAll('[data-abre="creditos"]').forEach(b => b.addEventListener('click', abrirCreditos));
  $('#aPortada').addEventListener('click', () => { cerrarFicha(); const t = $('#tapa'); t.hidden = false; void t.offsetWidth; app.dataset.estado = 'portada'; $('#abrir').focus({preventScroll: true}); });
}
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
  sala.inert = true; mapa.inert = true; $('#tapa').inert = true;
  requestAnimationFrame(() => { panel.classList.add('visible'); $('#panelCerrar').focus({preventScroll: true}); });
}
function cerrarPanel(){
  if (panel.hidden) return; panel.classList.remove('visible');
  sala.inert = false; mapa.inert = false; $('#tapa').inert = false;
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
    <ol class="fotos">${HOJAS.map(h => `<li data-k="${h.k}"><b>${h.titulo}</b><span>${h.credito.autor} · ${h.credito.licencia}${h.credito.pagina ? ` · <a href="${h.credito.pagina}" target="_blank" rel="noopener">ver original</a>` : ''}</span></li>`).join('')}</ol>`);
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
function pintarHoja(h){
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
      <div class="h-dato"><strong>${h.dato}</strong><span>${h.dato_l}</span></div>
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
}
// transformación que lleva la portada grande del visor a la posición de la hoja chica en la mampara
function haciaMini(mini, portada){
  const a = mini.getBoundingClientRect(), b = portada.getBoundingClientRect();
  const s = mini.offsetWidth / b.width;
  return `translate(${(a.left + a.width / 2 - b.left - b.width / 2).toFixed(1)}px,${(a.top + a.height / 2 - b.top - b.height / 2).toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${POS[mini.dataset.id].rot}deg)`;
}
// historial: el botón «atrás» cierra la hoja y cada hoja tiene su enlace (#C3)
function anotar(id, reemplaza){ if (!PWA) return; try { history[reemplaza ? 'replaceState' : 'pushState']({hoja: id}, '', '#' + id); } catch (e){} }
function pedirCierre(){ if (PWA && history.state && history.state.hoja){ try { history.back(); return; } catch (e){} } cerrarHoja(); }
function abrirHoja(id, conHistorial = true){
  if (ocupado) return; ocupado = true; cerrarFicha();
  if (conHistorial) anotar(id);
  sala.inert = true; mapa.inert = true;
  actual = id; const mini = minis[id];
  pintarHoja(porId[id]); ajustarVisor();
  hojaEl.classList.remove('abierta', 'cerrando');
  visor.hidden = false; rollo.scrollTop = 0;
  const portada = hojaEl.querySelector('.portada'), dur = reduce.matches ? 0 : 620;
  const desde = haciaMini(mini, portada);
  mini.classList.add('levantada');
  requestAnimationFrame(() => visor.classList.add('visible'));
  portada.animate([{transform: desde}, {transform: 'none'}], {duration: dur, easing: 'cubic-bezier(.2,.8,.2,1)'});
  setTimeout(() => { hojaEl.classList.add('abierta'); ocupado = false; $('#cerrar').focus({preventScroll: true}); }, dur * .72);
}
function cerrarHoja(){
  if (ocupado || visor.hidden) return; ocupado = true;
  const mini = minis[actual], portada = hojaEl.querySelector('.portada'), rapido = reduce.matches;
  const fin = () => {
    visor.hidden = true; visor.classList.remove('visible'); hojaEl.classList.remove('cerrando');
    mini.classList.remove('levantada'); mini.classList.add('asienta'); setTimeout(() => mini.classList.remove('asienta'), 520);
    const an = document.getElementById('anillo-' + actual); if (an){ an.classList.remove('pulso'); void an.getBoundingClientRect(); an.classList.add('pulso'); }
    sala.inert = false; mapa.inert = false;
    mini.focus({preventScroll: true}); ocupado = false;
  };
  hojaEl.classList.add('cerrando'); hojaEl.classList.remove('abierta');
  if (rapido || rollo.scrollTop > 40){                      // ya se había desplazado: basta un fundido
    visor.classList.remove('visible'); setTimeout(fin, rapido ? 0 : 320); return;
  }
  rollo.scrollTop = 0;
  setTimeout(() => {
    visor.classList.remove('visible');
    portada.animate([{transform: 'none'}, {transform: haciaMini(mini, portada)}], {duration: 460, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards'}).finished.then(fin, fin);
  }, 230);
}
function cambiarHoja(d){
  const n = DISPONIBLES.indexOf(actual) + d;
  if (ocupado || n < 0 || n >= DISPONIBLES.length) return; ocupado = true;
  const rapido = reduce.matches;
  hojaEl.classList.add('cerrando'); hojaEl.classList.remove('abierta');
  const sale = hojaEl.animate([{opacity: 1, transform: 'none'}, {opacity: 0, transform: `translateX(${-d * 28}px)`}], {duration: rapido ? 0 : 240, easing: 'ease-in', fill: 'forwards'});
  sale.finished.then(() => {
    minis[actual].classList.remove('levantada');
    actual = DISPONIBLES[n]; minis[actual].classList.add('levantada'); centrar(minis[actual]); anotar(actual, true);
    vivos.add(porId[actual].k); lienzo.querySelector(`.per[data-k="${porId[actual].k}"]`)?.classList.add('vivo');
    HOJAS.filter(h => h.k === porId[actual].k).forEach(h => minis[h.id].classList.add('vivo'));
    pintarHoja(porId[actual]); rollo.scrollTop = 0; hojaEl.classList.remove('cerrando'); sale.cancel();
    hojaEl.animate([{opacity: 0, transform: `translateX(${d * 28}px)`}, {opacity: 1, transform: 'none'}], {duration: rapido ? 0 : 300, easing: 'cubic-bezier(.2,.8,.2,1)'});
    setTimeout(() => { hojaEl.classList.add('abierta'); ocupado = false; }, rapido ? 0 : 160);
  });
}

/* =====================================================================
   6 · PORTADA DEL LIBRO Y ARRANQUE
   ===================================================================== */
let observador;
function abrirLibro(k){
  if (k != null) irAEtapa(k, 'auto'); else irA(0, 'auto');
  app.dataset.estado = 'mampara';
  setTimeout(() => { $('#tapa').hidden = true; }, reduce.matches ? 0 : 1050);
  if (!observador){
    observador = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const k = +e.target.dataset.k; if (vivos.has(k)) return; vivos.add(k);
      lienzo.querySelector(`.per[data-k="${k}"]`)?.classList.add('vivo');
      HOJAS.filter(h => h.k === k).forEach(h => minis[h.id].classList.add('vivo'));
    }), {root: sala, threshold: .12});
    setTimeout(() => periodosEl.querySelectorAll('.periodo').forEach(s => observador.observe(s)), reduce.matches ? 0 : 420);
  }
}
function componer(){ medir(); colocarHojas(); dibujar(); alDesplazar(); if (!visor.hidden) ajustarVisor(); cerrarFicha(); }

armarFijos(); componer(); prepararNavegacion();
let tRe; new ResizeObserver(() => { cancelAnimationFrame(tRe); tRe = requestAnimationFrame(componer); }).observe(app);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(componer);
$('#abrir').addEventListener('click', () => abrirLibro());
$('#indice').addEventListener('click', e => { const b = e.target.closest('button'); if (b) abrirLibro(+b.dataset.k); });
$('#cerrar').addEventListener('click', pedirCierre);
$('#velo').addEventListener('click', pedirCierre);
rollo.addEventListener('click', e => { if (e.target === rollo || e.target.classList.contains('visor__lienzo')) pedirCierre(); });
$('#anterior').addEventListener('click', () => cambiarHoja(-1));
$('#siguiente').addEventListener('click', () => cambiarHoja(1));
$('#panelCerrar').addEventListener('click', cerrarPanel);
panel.addEventListener('click', e => { if (e.target === panel) cerrarPanel(); });

// gestos en el visor: deslizar a los lados cambia de hoja; deslizar hacia abajo (estando hasta arriba) la cierra
let toque = null;
rollo.addEventListener('touchstart', e => { toque = e.touches.length === 1 ? {x: e.touches[0].clientX, y: e.touches[0].clientY, s: rollo.scrollTop, t: Date.now()} : null; }, {passive: true});
rollo.addEventListener('touchend', e => {
  if (!toque) return; const c = e.changedTouches[0], dx = c.clientX - toque.x, dy = c.clientY - toque.y, t0 = toque; toque = null;
  if (Date.now() - t0.t > 700 || String(getSelection()).length) return;
  if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.8) cambiarHoja(dx < 0 ? 1 : -1);
  else if (dy > 96 && dy > Math.abs(dx) * 1.8 && t0.s <= 0 && rollo.scrollTop <= 0) pedirCierre();
}, {passive: true});

/* =====================================================================
   7 · VERSIÓN INSTALABLE: historial, instalación y trabajo sin conexión
   ===================================================================== */
if (PWA){
  window.addEventListener('popstate', e => {
    const id = e.state && e.state.hoja;
    if (!visor.hidden && !id) cerrarHoja();
    else if (visor.hidden && id && porId[id] && app.dataset.estado === 'mampara') abrirHoja(id, false);
  });
  // enlace directo a una hoja: …/#K1
  const inicial = porId[location.hash.slice(1)];
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e){}
  if (inicial){
    abrirLibro(inicial.k);
    setTimeout(() => { centrar(minis[inicial.id]); requestAnimationFrame(() => abrirHoja(inicial.id)); }, reduce.matches ? 60 : 1300);
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
  window.addEventListener('appinstalled', () => { invitacion = null; ocultarCartel(); botones.forEach(b => b.hidden = true); avisar('Listo: la app quedó instalada'); });
  botones.forEach(b => { b.hidden = instalada; b.addEventListener('click', instalar); });
  $('#instalaSi').addEventListener('click', instalar);
  $('#instalaNo').addEventListener('click', () => { guardar(Date.now()); ocultarCartel(); });
  if (esMovil && !inicial) setTimeout(mostrarCartel, 1100);
  // sin conexión: el service worker guarda todo el libro; si hay versión nueva, se ofrece actualizar
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    let actualizando = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (actualizando) location.reload(); });
    navigator.serviceWorker.register('sw.js').then(reg => {
      const ofrecer = sw => avisar('Hay una versión nueva', 'Actualizar', () => { actualizando = true; sw.postMessage('activar'); });
      if (reg.waiting && navigator.serviceWorker.controller) ofrecer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nuevo = reg.installing; if (!nuevo) return;
        nuevo.addEventListener('statechange', () => { if (nuevo.state === 'installed' && navigator.serviceWorker.controller) ofrecer(nuevo); });
      });
    }).catch(() => {});
  }
}
})();
