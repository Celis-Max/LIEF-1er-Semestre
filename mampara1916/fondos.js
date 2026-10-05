(() => {
'use strict';
/* =====================================================================
   FONDOS: la escenografía animada de cada etapa
   · En la mampara: el paisaje de cada etapa, grabado al pie de su gráfica, y encima lo que se
     mueve (el tren que pasa, el radio que transmite, las monedas que caen, la cinta del teletipo,
     las torres que gotean petróleo, el trigo que se mece).
   · Detrás de la hoja abierta: el paisaje de su tema y su propia serie dibujándose en grande.
   · En la portada: todo el recorrido como un panorama que pasa despacio.
   Sólo decoración, ligera: no agrega información. No se carga en el modo lite. En el modo inmersivo el paisaje
   tiene profundidad (se corre con la inclinación del celular o del ratón). Uso desde app.js: window.Fondos
   ===================================================================== */
const f = n => String(Math.round(n * 10) / 10);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function azar(s){ s = s % 2147483647 || 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const R = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
// el tinte claro de cada etapa, para dibujar sobre la pared oscura
const LUZ = ['233,201,141', '241,169,132', '168,216,178', '188,201,218', '232,196,126'];

/* ---------------------------------------------------------------------
   Los paisajes: cada uno devuelve el contorno relleno (d), los trazos finos (t) y sus anclas,
   en una caja de ancho w y alto h con el suelo en y = h
   --------------------------------------------------------------------- */
const HZ = {
  // lomas, la vía y los postes del telégrafo
  revolucion(w, h, r){
    const fase = r() * 6, lom = x => h * (.5 + .15 * Math.sin(x / w * 5.6 + fase) + .07 * Math.sin(x / w * 15 + fase * 2));
    let d = `M0 ${f(h)}`; for (let i = 0; i <= 90; i++){ const x = w * i / 90; d += `L${f(x)} ${f(lom(x))}`; } d += `L${f(w)} ${f(h)}Z`;
    const via = h * .92, postes = [];
    for (let x = w * .05; x < w - 12; x += clamp(w / 7, 48, 96)) postes.push(x);
    let t = '';
    postes.forEach(x => { d += R(x, via - h * .52, 2.2, h * .52) + R(x - 7, via - h * .48, 16, 2.2); });
    for (let i = 0; i < postes.length - 1; i++){ const a = postes[i] + 1, b = postes[i + 1] + 1, y = via - h * .465; t += `M${f(a)} ${f(y)}Q${f((a + b) / 2)} ${f(y + h * .08)} ${f(b)} ${f(y)}`; }
    d += R(0, via, w, 2.6);
    return {d, t, via};
  },
  // la ciudad con su escuela y la torre del radio
  ciudad(w, h, r){
    let d = '', t = '', x = 0;
    while (x < w){ const bw = 16 + r() * 30, bh = h * (.2 + r() * .36); d += R(x, h - bh, bw, bh); if (r() < .3) d += R(x + bw * .3, h - bh - h * .08, bw * .4, h * .08); x += bw + 1 + r() * 4; }
    const ex = w * .2, ew = clamp(w * .2, 50, 96), eh = h * .5;
    d += R(ex, h - eh, ew, eh) + `M${f(ex - 5)} ${f(h - eh)}L${f(ex + ew / 2)} ${f(h - eh - h * .17)}L${f(ex + ew + 5)} ${f(h - eh)}Z`;
    const ax = w * .7, ah = h * 1.2, ab = h * .14;
    t += `M${f(ax - ab)} ${f(h)}L${f(ax)} ${f(h - ah)}L${f(ax + ab)} ${f(h)}`;
    for (let i = 1; i < 8; i++){ const y = h - ah * i / 8, m = ab * (1 - i / 8), y2 = h - ah * (i + 1) / 8, m2 = ab * (1 - (i + 1) / 8); t += `M${f(ax - m)} ${f(y)}L${f(ax + m)} ${f(y)}`; if (i < 7) t += `M${f(ax - m)} ${f(y)}L${f(ax + m2)} ${f(y2)}`; }
    return {d, t, antena: [ax, h - ah]};
  },
  // el Banco de México: frontón, columnas y escalinata, entre edificios
  banco(w, h, r){
    let d = '', x = 0;
    const fx = w * .38, fw = clamp(w * .36, 90, 190), fh = h * .5;
    while (x < w){ const bw = 18 + r() * 26, bh = h * (.18 + r() * .26); if (x + bw < fx - 6 || x > fx + fw + 6) d += R(x, h - bh, bw, bh); x += bw + 2; }
    d += R(fx - 8, h - h * .06, fw + 16, h * .06) + R(fx - 4, h - h * .11, fw + 8, h * .05) + R(fx, h - fh, fw, h * .08);
    const n = 6; for (let i = 0; i < n; i++){ const cx = fx + fw * (.07 + .86 * i / (n - 1)); d += R(cx - fw * .025, h - fh + h * .08, fw * .05, fh - h * .19); }
    d += `M${f(fx - 6)} ${f(h - fh)}L${f(fx + fw / 2)} ${f(h - fh - h * .2)}L${f(fx + fw + 6)} ${f(h - fh)}Z`;
    return {d, t: ''};
  },
  // lomas suaves y la carretera nueva (su raya central se anima aparte)
  carretera(w, h, r){
    const fase = r() * 5, lom = x => h * (.62 + .1 * Math.sin(x / w * 4.4 + fase));
    let d = `M0 ${f(h)}`; for (let i = 0; i <= 60; i++){ const x = w * i / 60; d += `L${f(x)} ${f(lom(x))}`; } d += `L${f(w)} ${f(h)}Z`;
    let c = `M0 ${f(h * .9)}`; for (let i = 1; i <= 40; i++){ const x = w * i / 40; c += `L${f(x)} ${f(h * (.86 - .14 * Math.sin(x / w * 3.1 + fase * .5)))}`; }
    return {d, t: c, camino: c};
  },
  // los rascacielos de Nueva York
  nuevayork(w, h, r){
    let d = '', t = '', x = 0;
    while (x < w){
      const bw = 16 + r() * 22, bh = h * (.45 + r() * .7);
      d += R(x, h - bh, bw, bh);
      if (r() < .55){ const b2 = bw * .62, h2 = h * (.08 + r() * .14); d += R(x + (bw - b2) / 2, h - bh - h2, b2, h2); if (r() < .4) t += `M${f(x + bw / 2)} ${f(h - bh - h2)}v${f(-h * .18)}`; }
      x += bw + 3 + r() * 5;
    }
    return {d, t};
  },
  // la ciudad de México con la cúpula del Palacio de Bellas Artes
  bellasartes(w, h, r){
    let d = '', x = 0;
    const px = w * .3, pw = clamp(w * .42, 90, 220), ph = h * .34;
    while (x < w){ const bw = 14 + r() * 24, bh = h * (.18 + r() * .2); if (x + bw < px - 4 || x > px + pw + 4) d += R(x, h - bh, bw, bh); x += bw + 2; }
    d += R(px, h - ph, pw, ph);
    const cx = px + pw / 2, rx = pw * .2, ry = h * .26;
    d += `M${f(cx - rx)} ${f(h - ph)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(h - ph)}Z` + R(cx - rx * .18, h - ph - ry - h * .08, rx * .36, h * .1);
    [px + pw * .1, px + pw * .9].forEach(sx => { d += `M${f(sx - rx * .45)} ${f(h - ph)}A${f(rx * .45)} ${f(ry * .45)} 0 0 1 ${f(sx + rx * .45)} ${f(h - ph)}Z`; });
    return {d, t: `M${f(cx)} ${f(h - ph - ry - h * .08)}v${f(-h * .1)}`};
  },
  // torres de petróleo y tanques de la refinería
  petroleo(w, h, r){
    let d = R(0, h - 3, w, 3), t = '';
    const torres = [];
    for (let x = w * .07; x < w * .95; x += clamp(w / 5, 44, 110) * (.8 + r() * .4)){
      const th = h * (.7 + r() * .45), tb = th * .2, top = h - th;
      torres.push([x, top]);
      t += `M${f(x - tb)} ${f(h)}L${f(x - 2)} ${f(top)}M${f(x + tb)} ${f(h)}L${f(x + 2)} ${f(top)}`;
      for (let i = 1; i < 6; i++){ const y = h - th * i / 6, m = tb * (1 - i / 6) + 2; t += `M${f(x - m)} ${f(y)}L${f(x + m)} ${f(y)}`; }
      d += R(x - 5, top - 4, 10, 5);
    }
    const chim = [];
    for (let i = 0; i < 3; i++){ const x = w * (.18 + i * .3) + r() * 20, tw = 26 + r() * 16, tt = h * (.18 + r() * .1); d += `M${f(x)} ${f(h)}v${f(-tt)}q0 ${f(-tt * .3)} ${f(tw / 2)} ${f(-tt * .3)}q${f(tw / 2)} 0 ${f(tw / 2)} ${f(tt * .3)}v${f(tt)}Z`; }
    const cx = w * .52; d += R(cx, h - h * .62, 7, h * .62); chim.push([cx + 3.5, h - h * .62]);
    return {d, t, torres, chimeneas: chim};
  },
  // el campo: hacienda, árboles y surcos (el trigo de enfrente se anima aparte)
  campo(w, h, r){
    let d = R(0, h * .86, w, h * .14), t = '';
    for (let i = 0; i < 4; i++) t += `M0 ${f(h * (.62 + i * .06))}Q${f(w / 2)} ${f(h * (.6 + i * .06) + 4)} ${f(w)} ${f(h * (.62 + i * .06))}`;
    const hx = w * .55, hw = clamp(w * .24, 50, 120), hh = h * .32;
    d += R(hx, h * .86 - hh, hw, hh) + `M${f(hx - 6)} ${f(h * .86 - hh)}L${f(hx + hw * .5)} ${f(h * .86 - hh - h * .14)}L${f(hx + hw + 6)} ${f(h * .86 - hh)}Z`;
    [w * .14, w * .3, w * .86].forEach(x => { const rr = h * (.1 + r() * .06); d += R(x - 1.5, h * .86 - h * .2, 3, h * .2) + `M${f(x - rr)} ${f(h * .86 - h * .2)}a${f(rr)} ${f(rr)} 0 1 1 ${f(rr * 2)} 0a${f(rr)} ${f(rr)} 0 1 1 ${f(-rr * 2)} 0Z`; });
    return {d, t, suelo: h * .86};
  },
  // la presa y una grúa: la obra pública
  obra(w, h, r){
    const px = w * .18, pw = clamp(w * .5, 120, 260), ph = h * .55;
    let d = `M${f(px)} ${f(h)}L${f(px + pw * .08)} ${f(h - ph)}L${f(px + pw * .92)} ${f(h - ph)}L${f(px + pw)} ${f(h)}Z` + R(0, h - 3, w, 3);
    let t = '';
    for (let i = 1; i < 5; i++){ const ax = px + pw * i / 5; t += `M${f(ax - pw * .06)} ${f(h)}A${f(pw * .06)} ${f(h * .2)} 0 0 1 ${f(ax + pw * .06)} ${f(h)}`; }
    const gx = w * .82, gh = h * 1.05;
    t += `M${f(gx)} ${f(h)}V${f(h - gh)}M${f(gx - w * .12)} ${f(h - gh + 6)}H${f(gx + w * .08)}M${f(gx)} ${f(h - gh)}L${f(gx - w * .12)} ${f(h - gh + 6)}M${f(gx - w * .1)} ${f(h - gh + 6)}v${f(h * .3)}`;
    for (let i = 1; i < 6; i++){ const y = h - gh * i / 6; t += `M${f(gx - 5)} ${f(y)}L${f(gx + 5)} ${f(y - gh / 12)}`; }
    return {d, t};
  },
  // la estación del ferrocarril, la vía y el tanque de agua
  ferrocarril(w, h, r){
    const via = h * .92;
    let d = R(0, via, w, 2.6);
    const sx = w * .32, sw = clamp(w * .32, 70, 150), sh = h * .4;
    d += R(sx, via - sh, sw, sh) + `M${f(sx - 8)} ${f(via - sh)}L${f(sx + sw / 2)} ${f(via - sh - h * .2)}L${f(sx + sw + 8)} ${f(via - sh)}Z` + R(sx + sw / 2 - 8, via - sh - h * .1, 16, h * .1);
    const tx = w * .78, tw = 26;
    d += R(tx - tw / 2, via - h * .78, tw, h * .22);
    let t = `M${f(tx - 10)} ${f(via)}L${f(tx - 8)} ${f(via - h * .56)}M${f(tx + 10)} ${f(via)}L${f(tx + 8)} ${f(via - h * .56)}M${f(tx - 9)} ${f(via - h * .3)}H${f(tx + 9)}`;
    for (let x = 4; x < w; x += 12) t += `M${f(x)} ${f(via + 5)}h6`;
    return {d, t, via};
  },
};

/* ---------------------------------------------------------------------
   La mampara: el paisaje de cada etapa (en el SVG de la gráfica) y lo que se mueve (en HTML)
   --------------------------------------------------------------------- */
const ZONAS = [
  {partes: [['revolucion', 0, 1]], vivos: ['tren', 'billetes']},
  {partes: [['ciudad', 0, 1]], vivos: ['ondas', 'letras']},
  {partes: [['banco', 0, .55], ['carretera', .55, 1]], vivos: ['monedas', 'camino']},
  {partes: [['nuevayork', 0, .52], ['bellasartes', .52, 1]], vivos: ['cinta']},
  {partes: [['campo', 0, .34], ['ferrocarril', .34, .56], ['petroleo', .56, 1]], vivos: ['trigo', 'gotas', 'humo']},
];
const LOCOMOTORA = '<svg viewBox="0 0 150 30" width="150" height="30"><path d="M4 26h22v-14h-6v-6h4v-4h-10v10h-6zM28 26h18v-12h-18zM50 26h26v-14h-26zM80 26h26v-14h-26zM110 26h26v-14h-26z" fill="currentColor"/><g fill="currentColor"><circle cx="9" cy="27" r="3"/><circle cx="21" cy="27" r="3"/><circle cx="34" cy="27" r="2.6"/><circle cx="56" cy="27" r="2.6"/><circle cx="70" cy="27" r="2.6"/><circle cx="86" cy="27" r="2.6"/><circle cx="100" cy="27" r="2.6"/><circle cx="116" cy="27" r="2.6"/><circle cx="130" cy="27" r="2.6"/></g></svg>';
const BILLETE = '<svg viewBox="0 0 40 18" width="40" height="18"><rect x="1" y="1" width="38" height="16" rx="1.5" fill="currentColor" fill-opacity=".35" stroke="currentColor" stroke-width="1.2"/><rect x="4" y="4" width="32" height="10" fill="none" stroke="currentColor" stroke-width=".7"/><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width=".8"/></svg>';
function zona(k, w, alto, banda, techo = 0){
  const z = ZONAS[k], r = azar(1000 + k * 97), silueta = [], anclas = {};
  z.partes.forEach(([tipo, a, b]) => {
    const pw = w * (b - a), x = w * a, res = HZ[tipo](pw, banda, r);
    silueta.push(`<g transform="translate(${f(x)} 0)"><path d="${res.d}" fill="currentColor"/>${res.t ? `<path d="${res.t}" fill="none" stroke="currentColor" stroke-width="1.3"/>` : ''}</g>`);
    anclas[tipo] = Object.assign({x, w: pw}, res);
  });
  const y0 = alto - banda;
  const pos = (n, a) => `left:${f(a[0])}px;top:${f(a[1])}px`;
  let html = '';
  z.vivos.forEach(v => {
    if (v === 'tren'){
      const via = (anclas.revolucion || anclas.ferrocarril); const vy = y0 + via.via - 30, x0 = via.x, ancho = via.w;
      html += `<div class="esc esc-tren" style="left:${f(x0)}px;top:${f(vy)}px;--w:${f(ancho)}px;--dur:${f(clamp(ancho / 14, 22, 44))}s"><div class="esc-humos"><i></i><i></i><i></i></div>${LOCOMOTORA}</div>`;
    }
    if (v === 'billetes') for (let i = 0; i < 4; i++) html += `<div class="esc esc-cae" style="left:${f(w * (.12 + i * .22 + r() * .08))}px;--y0:${f(techo + 6)}px;--y1:${f(alto * .82)}px;--dur:${f(16 + r() * 8)}s;--del:${f(-r() * 20)}s"><div class="esc-meneo">${BILLETE}</div></div>`;
    if (v === 'monedas') for (let i = 0; i < 5; i++) html += `<div class="esc esc-cae" style="left:${f(w * (.08 + i * .19 + r() * .06))}px;--y0:${f(techo + 6)}px;--y1:${f(alto * .84)}px;--dur:${f(13 + r() * 7)}s;--del:${f(-r() * 18)}s"><div class="esc-moneda"></div></div>`;
    if (v === 'cinta') for (let i = 0; i < 6; i++) html += `<div class="esc esc-cae" style="left:${f(w * (.06 + i * .16 + r() * .05))}px;--y0:${f(techo)}px;--y1:${f(alto * .86)}px;--dur:${f(17 + r() * 9)}s;--del:${f(-r() * 24)}s"><div class="esc-meneo esc-cinta" style="height:${f(40 + r() * 50)}px"></div></div>`;
    if (v === 'ondas'){ const a = anclas.ciudad; html += `<div class="esc esc-ondas" style="${pos('a', [a.x + a.antena[0], y0 + a.antena[1]])}"><i></i><i></i><i></i></div>`; }
    if (v === 'letras') ['a', 'b', 'c'].forEach((l, i) => { html += `<div class="esc esc-letra" style="left:${f(w * (.18 + i * .26))}px;top:${f(y0 + banda * .2)}px;--sube:${f(alto * .45)}px;--del:${f(-i * 5 - r() * 3)}s">${l}</div>`; });
    if (v === 'camino'){ const a = anclas.carretera; html += `<svg class="esc esc-camino" style="left:${f(a.x)}px;top:${f(y0)}px" width="${f(a.w)}" height="${f(banda)}" viewBox="0 0 ${f(a.w)} ${f(banda)}"><path d="${a.camino}"/></svg>`; }
    if (v === 'gotas'){ const a = anclas.petroleo; a.torres.slice(0, 3).forEach((t, i) => { html += `<div class="esc esc-gota" style="left:${f(a.x + t[0] - 2.5)}px;top:${f(y0 + t[1])}px;--caida:${f(banda - t[1] - 4)}px;--del:${f(-i * 1.3 - r())}s"></div>`; }); }
    if (v === 'humo'){ const a = anclas.petroleo; a.chimeneas.forEach(c => { html += `<div class="esc esc-humos esc-chimenea" style="left:${f(a.x + c[0] - 5)}px;top:${f(y0 + c[1] - 8)}px"><i></i><i></i><i></i></div>`; }); }
    if (v === 'trigo'){ const a = anclas.campo; let sv = ''; const n = Math.max(6, Math.round(a.w / 16)); for (let i = 0; i < n; i++){ const x = 6 + i * (a.w - 12) / (n - 1), hh = banda * (.26 + r() * .12); sv += `<g style="--del:${f(-r() * 4)}s"><path d="M${f(x)} ${f(banda)}V${f(banda - hh)}" stroke="currentColor" stroke-width="1.4"/><ellipse cx="${f(x)}" cy="${f(banda - hh)}" rx="2.6" ry="7" fill="currentColor"/></g>`; }
      html += `<svg class="esc esc-trigo" style="left:${f(a.x)}px;top:${f(y0)}px" width="${f(a.w)}" height="${f(banda)}" viewBox="0 0 ${f(a.w)} ${f(banda)}">${sv}</svg>`; }
  });
  // el paisaje en su propio <svg> (fijo); lo que se mueve, en HTML encima
  return {paisaje: `<svg class="esc-paisaje" style="top:${f(y0)}px" width="${f(w)}" height="${f(banda)}" viewBox="0 0 ${f(w)} ${f(banda)}" aria-hidden="true">${silueta.join('')}</svg>`, html};
}

/* ---------------------------------------------------------------------
   Las escenas en canvas (detrás de la hoja abierta y en la portada)
   --------------------------------------------------------------------- */
// qué paisaje y qué cosas en el aire lleva cada hoja
const ESCENAS = {
  C1: ['revolucion', {billetes: 12}], C2: ['revolucion', {documentos: 10}], C3: ['petroleo', {gotas: 8, humo: 4}], C4: ['revolucion', {tren: 1, humo: 5}], C5: ['revolucion', {polvo: 26}],
  O1: ['ciudad', {letras: 12}], O2: ['petroleo', {gotas: 6}], O3: ['nuevayork', {documentos: 10}], O4: ['ciudad', {ondas: 1, polvo: 12}], O5: ['ciudad', {humo: 6, polvo: 14}],
  K1: ['banco', {monedas: 12}], K2: ['nuevayork', {documentos: 9}], K3: ['carretera', {camino: 1, polvo: 12}], K4: ['petroleo', {monedas: 6, gotas: 5}], K5: ['campo', {polvo: 22}], K6: ['banco', {polvo: 22}],
  M1: ['nuevayork', {cinta: 12}], M2: ['nuevayork', {documentos: 8, monedas: 4}], M3: ['bellasartes', {monedas: 8}], M4: ['bellasartes', {cinta: 8, polvo: 10}], M5: ['bellasartes', {monedas: 9, sube: 1}], M6: ['bellasartes', {monedas: 10}],
  D1: ['obra', {polvo: 16, humo: 3}], D2: ['campo', {trigo: 1, polvo: 10}], D3: ['ferrocarril', {tren: 1, humo: 5}], D4: ['ferrocarril', {billetes: 10, sube: 1}], D5: ['petroleo', {gotas: 8, humo: 4}], D6: ['ferrocarril', {monedas: 10}],
};
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const lite = () => document.documentElement.dataset.modo === 'lite', tres = () => document.documentElement.dataset.modo === 'inmersivo';
const incl = {x: 0, y: 0};          // inclinación del modo inmersivo (de -1 a 1): el paisaje se corre según su profundidad

function escenario(canvas, {portada = false} = {}){
  const g = canvas.getContext('2d');
  let W = 0, H = 0, esc = 1, actual = null, previa = null, tCambio = 0, raf = 0, activo = false, tPrevio = 0, t0 = performance.now();
  const medir = () => {
    esc = Math.min(1.25, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight; if (!W || !H) return;
    canvas.width = Math.round(W * esc); canvas.height = Math.round(H * esc);
    [actual, previa].forEach(s => s && preparar(s));
  };
  new ResizeObserver(() => { medir(); dibujar(performance.now()); }).observe(canvas);   // cambiar el tamaño borra el canvas: se redibuja enseguida (si no, parpadeaba)
  // el paisaje se dibuja una vez en un canvas aparte y luego sólo se copia
  function preparar(s){
    const hb = Math.round(H * (portada ? .3 : .26)), largo = portada ? W * 2.4 : W, r = azar(s.semilla);
    const off = document.createElement('canvas'); off.width = Math.max(1, Math.round(largo * esc)); off.height = Math.max(1, Math.round(hb * esc));
    const o = off.getContext('2d'); o.scale(esc, esc);
    const tipos = portada ? ['revolucion', 'ciudad', 'banco', 'carretera', 'nuevayork', 'bellasartes', 'petroleo', 'ferrocarril', 'campo'] : [s.horizonte];
    const anclas = [];
    tipos.forEach((tipo, i) => {
      const pw = largo / tipos.length, x = pw * i, res = HZ[tipo](pw, hb, r), col = portada ? LUZ[[0, 1, 2, 2, 3, 3, 4, 4, 4][i]] : LUZ[s.k];
      o.save(); o.translate(x, 0);
      o.fillStyle = `rgba(${col},${portada ? .1 : .15})`; o.fill(new Path2D(res.d));
      if (res.t){ o.strokeStyle = `rgba(${col},${portada ? .14 : .2})`; o.lineWidth = 1.3; o.stroke(new Path2D(res.t)); }
      o.restore();
      anclas.push(Object.assign({x, w: pw, tipo}, res));
    });
    s.paisaje = off; s.hb = hb; s.largo = largo; s.anclas = anclas;
    s.particulas = []; crearParticulas(s, r);
    // la serie de la hoja (o todo el recorrido en la portada), en grande y tenue
    s.trazos = [];
    const x0 = W * .06, x1 = W * .94, yA = H * (portada ? .2 : .16), yB = H * (portada ? .62 : .66);
    s.lineas.forEach(L => {
      const vals = L.vals, mn = Math.min(...vals) * .9, mx = Math.max(...vals) * 1.05;
      s.trazos.push({col: L.col, pts: vals.map((v, i) => [x0 + (x1 - x0) * (vals.length === 1 ? .5 : i / (vals.length - 1)), yB - (v - mn) / (mx - mn || 1) * (yB - yA)]), marcas: L.marcas || []});
    });
  }
  function crearParticulas(s, r){
    const P = s.particulas, n = s.cosas;
    const nueva = (tipo, inicio) => {
      const p = {tipo, x: r() * W, y: inicio ? r() * H : -30, z: .5 + r() * .7, f: r() * 6.3, v: 0};
      if (tipo === 'billetes' || tipo === 'documentos' || tipo === 'monedas' || tipo === 'cinta'){ p.v = (12 + r() * 16) * p.z * (n.sube ? -1 : 1); if (n.sube && !inicio) p.y = H + 30; p.giro = (r() - .5) * 1.2; p.l = 40 + r() * 50; }
      if (tipo === 'letras'){ p.v = -(8 + r() * 8); p.letra = 'abcdefghijlmnopqrstuv'[Math.floor(r() * 21)]; if (!inicio) p.y = H * .8; }
      if (tipo === 'polvo'){ p.v = -(3 + r() * 6); p.r = .6 + r() * 1.4; }
      return p;
    };
    ['billetes', 'documentos', 'monedas', 'cinta', 'letras', 'polvo'].forEach(t => { for (let i = 0; i < (n[t] || 0); i++) P.push(nueva(t, true)); });
    s.nueva = nueva; s.r = r;
  }
  function pintarEscena(s, t, dt, alfa){
    if (!s.paisaje) return;
    const col = LUZ[s.k], baseY = H - s.hb;
    g.save(); g.globalAlpha = alfa;
    // luz que cae desde arriba
    const luz = g.createRadialGradient(W / 2, -H * .1, 0, W / 2, -H * .1, H * .9); luz.addColorStop(0, `rgba(${col},.1)`); luz.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = luz; g.fillRect(0, 0, W, H);
    // la serie, que se traza sola y una luz que la recorre
    s.trazos.forEach(L => {
      const pts = L.pts, prog = clamp((t - s.nacio) / 2600, 0, 1), hasta = Math.max(1, Math.floor(prog * (pts.length - 1)));
      g.save(); g.translate(incl.x * 10, incl.y * 6);
      g.strokeStyle = `rgba(${L.col},${portada ? .16 : .22})`; g.lineWidth = portada ? 2 : 2.4; g.lineJoin = 'round'; g.beginPath();
      pts.slice(0, hasta + 1).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
      L.marcas.forEach(i => { if (i <= hasta){ const [x, y] = pts[i]; g.fillStyle = `rgba(${L.col},${(.25 + .07 * Math.sin(t / 900 + i)).toFixed(3)})`; g.beginPath(); g.arc(x, y, 5, 0, 6.283); g.fill(); } });
      if (prog >= 1 && pts.length > 1){
        const q = (t / 9000) % 1, seg = q * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(seg)), u = seg - i, x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
        const halo = g.createRadialGradient(x, y, 0, x, y, 18); halo.addColorStop(0, `rgba(${L.col},.45)`); halo.addColorStop(1, `rgba(${L.col},0)`);
        g.fillStyle = halo; g.fillRect(x - 18, y - 18, 36, 36);
      }
      g.restore();
    });
    // el paisaje (en la portada pasa despacio). En 3D hay otro más lejano, más tenue y más lento, y los dos se corren con la inclinación
    const px = incl.x * 22, py = incl.y * 10;
    if (s.paisaje.width > 1){
      if (portada){
        if (tres()){ const dl = ((t - t0) / 1000 * 4) % s.largo, hl = s.hb * .62; g.globalAlpha = alfa * .55; g.drawImage(s.paisaje, -dl + incl.x * 9, baseY - hl * .55 + incl.y * 4, s.largo, hl); g.drawImage(s.paisaje, s.largo - dl + incl.x * 9, baseY - hl * .55 + incl.y * 4, s.largo, hl); g.globalAlpha = alfa; }
        const dx = ((t - t0) / 1000 * 9) % s.largo; g.drawImage(s.paisaje, -dx + px, baseY + py, s.largo, s.hb); g.drawImage(s.paisaje, s.largo - dx + px, baseY + py, s.largo, s.hb);
      }
      else g.drawImage(s.paisaje, px - Math.abs(px), baseY + py, W + 2 * Math.abs(px), s.hb);
    }
    // lo que se mueve
    const n = s.cosas;
    g.save(); g.translate(px, py);
    s.anclas.forEach(a => {
      const ox = portada ? a.x - ((t - t0) / 1000 * 9) % s.largo : a.x;
      if (n.ondas && a.antena){ for (let k = 0; k < 3; k++){ const q = ((t / 3200) + k / 3) % 1, x = ox + a.antena[0], y = baseY + a.antena[1]; g.strokeStyle = `rgba(${col},${(.4 * (1 - q)).toFixed(3)})`; g.lineWidth = 1.4; g.beginPath(); g.arc(x, y, 6 + q * 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); } }
      if (n.gotas && a.torres) a.torres.forEach((tt, k) => { const q = ((t / 2600) + k * .37) % 1, x = ox + tt[0], y = baseY + tt[1] + q * (s.hb - tt[1]); g.fillStyle = `rgba(${col},${(.5 * (1 - q)).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, 2.4, 3.4, 0, 0, 6.283); g.fill(); });
      if (n.humo){ const fuentes = a.chimeneas || [[a.w * .3, s.hb * .45], [a.w * .74, s.hb * .55]]; fuentes.forEach(c => humo(ox + c[0], baseY + c[1], t, col)); }
      if (n.camino && a.camino){ g.save(); g.translate(ox, baseY); g.setLineDash([10, 12]); g.lineDashOffset = -(t / 40) % 22; g.strokeStyle = `rgba(${col},.4)`; g.lineWidth = 2; g.stroke(new Path2D(a.camino)); g.restore(); }
      if (n.tren && a.via != null){ const ciclo = 16000, q = (t % ciclo) / ciclo, x = ox - 170 + q * (a.w + 340), y = baseY + a.via - 30; tren(x, y, col); humo(x + 14, y + 2, t, col); }
      if (n.trigo && a.suelo != null){ for (let i = 0; i < 26; i++){ const x = ox + 8 + i * (a.w - 16) / 25, hh = s.hb * .34 + (i % 3) * 5, ang = Math.sin(t / 900 + i * .7) * .09, y = baseY + s.hb; g.strokeStyle = `rgba(${col},.32)`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(ang) * hh, y - Math.cos(ang) * hh); g.stroke(); g.fillStyle = `rgba(${col},.32)`; g.beginPath(); g.ellipse(x + Math.sin(ang) * hh, y - Math.cos(ang) * hh, 2.6, 7, ang, 0, 6.283); g.fill(); } }
    });
    g.restore();
    s.particulas.forEach(p => {
      p.y += p.v * dt; p.f += dt;
      const x = p.x + Math.sin(p.f * .8) * 14 * p.z + incl.x * 34 * p.z;
      if (p.tipo === 'billetes' || p.tipo === 'documentos'){ g.save(); g.translate(x, p.y); g.rotate(Math.sin(p.f * .9) * .7 + p.giro); const w = (p.tipo === 'billetes' ? 30 : 18) * p.z, h = (p.tipo === 'billetes' ? 14 : 24) * p.z; g.fillStyle = `rgba(${col},.1)`; g.strokeStyle = `rgba(${col},.32)`; g.lineWidth = 1; g.fillRect(-w / 2, -h / 2, w, h); g.strokeRect(-w / 2, -h / 2, w, h); if (p.tipo === 'documentos'){ for (let i = 1; i < 4; i++) g.fillRect(-w / 2 + 3, -h / 2 + i * h / 4.5, w - 6, .8); } else g.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6); g.restore(); }
      else if (p.tipo === 'monedas'){ const rr = 7 * p.z; g.fillStyle = `rgba(${col},.32)`; g.beginPath(); g.ellipse(x, p.y, Math.max(rr * .4, rr * Math.abs(Math.cos(p.f * 1.6))), rr, 0, 0, 6.283); g.fill(); }   // gira sin volverse una raya
      else if (p.tipo === 'cinta'){ g.strokeStyle = `rgba(${col},.3)`; g.lineWidth = 2.4 * p.z; g.beginPath(); g.moveTo(x, p.y); g.bezierCurveTo(x + 14 * Math.sin(p.f), p.y + p.l * .33, x - 14 * Math.sin(p.f + 1), p.y + p.l * .66, x + 6 * Math.sin(p.f * 1.3), p.y + p.l); g.stroke(); }
      else if (p.tipo === 'letras'){ g.fillStyle = `rgba(${col},${(.22 * clamp(1 - Math.abs(p.y / H - .45) * 1.6, 0, 1)).toFixed(3)})`; g.font = `900 ${Math.round(20 * p.z)}px "Playfair Display", Georgia, serif`; g.fillText(p.letra, x, p.y); }
      else if (p.tipo === 'polvo'){ g.fillStyle = `rgba(${col},${(.35 * p.z * (.8 + .2 * Math.sin(p.f * 1.4))).toFixed(3)})`; g.beginPath(); g.arc(x, p.y, p.r, 0, 6.283); g.fill(); }   // brillo tranquilo (no titila)
      const fuera = p.v > 0 ? p.y > H + 40 : p.y < -40;
      if (fuera) Object.assign(p, s.nueva(p.tipo, false));
    });
    g.restore();
  }
  function tren(x, y, col){
    g.fillStyle = `rgba(${col},.28)`;
    g.fillRect(x, y + 12, 22, 14); g.fillRect(x + 16, y + 4, 6, 10); g.fillRect(x + 2, y + 6, 8, 8);
    for (let i = 0; i < 4; i++) g.fillRect(x + 26 + i * 30, y + 12, 26, 14);
    for (let i = 0; i < 10; i++){ g.beginPath(); g.arc(x + 6 + i * 13.5, y + 27, 2.6, 0, 6.283); g.fill(); }
  }
  function humo(x, y, t, col){
    for (let k = 0; k < 4; k++){ const q = ((t / 2400) + k / 4) % 1; g.fillStyle = `rgba(${col},${(.22 * (1 - q)).toFixed(3)})`; g.beginPath(); g.arc(x - q * 22, y - q * 46, 4 + q * 14, 0, 6.283); g.fill(); }
  }
  function dibujar(t){
    if (!W || !H) return;
    const dt = tPrevio ? Math.min(.1, (t - tPrevio) / 1000) : .03; tPrevio = t;
    g.setTransform(esc, 0, 0, esc, 0, 0); g.clearRect(0, 0, W, H);
    const k = previa ? clamp((t - tCambio) / 900, 0, 1) : 1;
    if (previa && k < 1) pintarEscena(previa, t, dt, 1 - k); else previa = null;
    if (actual) pintarEscena(actual, t, dt, k);
    if (actual && actual.paisaje && !canvas.classList.contains('lista')) canvas.classList.add('lista');   // aparece con un fundido cuando ya tiene su primer dibujo
  }
  function bucle(t){
    raf = 0; if (!activo) return;
    raf = requestAnimationFrame(bucle);
    if (t - tPrevio < 32) return;                 // ~30 cuadros por segundo
    dibujar(t);
  }
  return {
    poner(s){
      s.semilla = s.semilla || 7; s.nacio = performance.now();
      if (!W) medir();
      if (actual){ previa = actual; tCambio = performance.now(); }
      actual = s; if (W) preparar(s);
      if (!activo) dibujar(performance.now());
    },
    activar(si){
      const quieto = reduce.matches || lite();
      activo = si && !quieto && !document.hidden;
      if (activo && !raf){ tPrevio = 0; raf = requestAnimationFrame(bucle); }
      if (!activo && raf){ cancelAnimationFrame(raf); raf = 0; }
      if (si && quieto){ if (actual) actual.nacio = -1e9; dibujar(performance.now()); }
    },
  };
}

// la escena de una hoja: su paisaje, sus cosas en el aire y su propia serie
function escenaDeHoja(h, serie){
  const [horizonte, cosas] = ESCENAS[h.id] || ['revolucion', {polvo: 16}];
  const datos = h.serie === 'pib' ? serie.pib : serie.deuda_usd, vals = [], marcas = [];
  for (let a = h.desde; a <= h.hasta; a++){ vals.push(datos[a - 1916]); if (h.resalta.includes(a)) marcas.push(a - h.desde); }
  return {k: h.k, horizonte, cosas, semilla: 31 + h.id.charCodeAt(0) * 7 + +h.id[1], lineas: [{vals, col: h.serie === 'pib' ? LUZ[h.k] : '160,190,230', marcas}]};
}

let visor = null, portada = null, quiereVisor = false, quierePortada = false;
window.Fondos = {
  zona,
  // detrás de la hoja abierta
  hoja(canvas, h, serie){ if (!visor) visor = escenario(canvas); visor.poner(escenaDeHoja(h, serie)); quiereVisor = true; visor.activar(true); },
  soltarHoja(){ quiereVisor = false; if (visor) visor.activar(false); },
  // la portada: todo el recorrido
  // modo inmersivo: inclinación del celular o del ratón (de -1 a 1)
  inclinar(x, y){ incl.x = x; incl.y = y; },
  portada(canvas, serie, si){
    if (!portada){ portada = escenario(canvas, {portada: true}); portada.poner({k: 0, horizonte: 'revolucion', cosas: {billetes: 4, monedas: 5, polvo: 14}, semilla: 1916,
      lineas: [{vals: serie.pib, col: LUZ[0], marcas: []}, {vals: serie.deuda_usd, col: '160,190,230', marcas: []}]}); }
    quierePortada = si; portada.activar(si);
  },
};
document.addEventListener('visibilitychange', () => { if (visor) visor.activar(!document.hidden && quiereVisor); if (portada) portada.activar(!document.hidden && quierePortada); });
})();
