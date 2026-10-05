(() => {
'use strict';
/* =====================================================================
   SONIDO DEL LIBRO
   Un gramófono en la sala: «La golondrina» (vals, 1922) con el chisporroteo del disco,
   el papel de las hojas, el clip, el libro y una señal al llegar a cada etapa
   (radio, caja registradora, máquina de escribir y silbato de tren).
   La música se lee por partes con <audio>; tres efectos son grabaciones (sonidos/);
   el resto se sintetiza aquí. Todo pasa por Web Audio y nada se oye antes de que
   la persona toque la pantalla. Uso desde app.js: window.Sonido.
   ===================================================================== */
const AC = window.AudioContext || window.webkitAudioContext;
const CLAVE = 'mampara-sonido';
const MUSICA = 'sonidos/golondrina-1922.mp3';
const MUESTRAS = {caja: 'sonidos/caja.mp3', maquina: 'sonidos/maquina.mp3', silbato: 'sonidos/silbato.mp3'};

let activo = (() => { try { return localStorage.getItem(CLAVE) !== '0'; } catch (e){ return true; } })();
let ctx = null, red = null, musica = null, quiereMusica = false, tVuelta = 0, enfocado = false;
const buffers = {}, pedidos = {}, ultimo = {}, oyentes = [], etapasOidas = new Set();
const aviso = () => oyentes.forEach(f => { try { f(activo); } catch (e){} });

/* ---------- utilidades de síntesis (sirven para AudioContext y OfflineAudioContext) ---------- */
const ruidos = new WeakMap();
function ruido(c){                                   // 2 s de ruido blanco, uno por contexto
  let b = ruidos.get(c); if (b) return b;
  b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  ruidos.set(c, b); return b;
}
function fuente(c, buf, loop){ const s = c.createBufferSource(); s.buffer = buf; s.loop = !!loop; return s; }
function filtro(c, tipo, f, q = .7, ganancia = 0){ const n = c.createBiquadFilter(); n.type = tipo; n.frequency.value = f; n.Q.value = q; n.gain.value = ganancia; return n; }
function vol(c, v = 0){ const g = c.createGain(); g.gain.value = v; return g; }
// chisporroteo de un disco de 78 rpm: cinco vueltas (3.85 s) que se repiten
function surcos(c){
  const sr = c.sampleRate, n = Math.floor(sr * 5 * 60 / 78), b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * .035;                     // soplido
  for (let k = 0; k < 90; k++){                                                         // chasquidos al azar
    const i0 = Math.floor(Math.random() * n), amp = Math.pow(Math.random(), 2.6) * .85 + .04, largo = Math.floor(sr * (.0003 + Math.random() * .0016)), sg = Math.random() < .5 ? -1 : 1;
    for (let j = 0; j < largo && i0 + j < n; j++) d[i0 + j] += sg * amp * Math.exp(-j / (largo * .28)) * (.5 + Math.random() * .5);
  }
  for (let v = 0; v < 5; v++){                                                          // la raya de cada vuelta
    const i0 = Math.floor((v + .37) * sr * 60 / 78);
    for (let j = 0; j < sr * .003 && i0 + j < n; j++) d[i0 + j] += .45 * Math.exp(-j / (sr * .0005)) * (Math.random() * 2 - 1);
  }
  return b;
}
// sala: reverberación corta generada (ruido que se apaga)
function eco(c, seg = 1.7){
  const sr = c.sampleRate, n = Math.floor(sr * seg), b = c.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  const v = c.createConvolver(); v.buffer = b; return v;
}

/* ---------- la red: gramófono → sala → maestro; efectos cercanos → maestro ---------- */
function montar(c){
  const r = {c};
  r.maestro = vol(c, .9);
  const lim = c.createDynamicsCompressor(); lim.threshold.value = -10; lim.knee.value = 8; lim.ratio.value = 6; lim.attack.value = .004; lim.release.value = .22;
  r.maestro.connect(lim).connect(c.destination);
  r.eco = eco(c); r.ecoVol = vol(c, .32); r.eco.connect(r.ecoVol).connect(r.maestro);
  // la sala: lo lejano (música, disco, señales). Al leer una hoja se apaga y se opaca.
  r.salaFiltro = filtro(c, 'lowpass', 9000, .5); r.sala = vol(c, 1);
  r.salaFiltro.connect(r.sala).connect(r.maestro);
  // el gramófono: bocina de metal (sin graves ni agudos, con un poco de resonancia)
  r.gramofono = filtro(c, 'highpass', 150, .6);
  const bocina = filtro(c, 'peaking', 1400, .9, 4), bocina2 = filtro(c, 'peaking', 2700, 1.4, 2), tapa = filtro(c, 'lowpass', 4400, .6);
  r.musica = vol(c, 0);
  r.gramofono.connect(bocina).connect(bocina2).connect(tapa).connect(r.musica).connect(r.salaFiltro);
  const envio = vol(c, .18); r.musica.connect(envio).connect(r.eco);
  r.disco = vol(c, 0);
  const discoHp = filtro(c, 'highpass', 520, .7), discoLp = filtro(c, 'lowpass', 6500, .6);
  r.disco.connect(discoHp).connect(discoLp).connect(r.salaFiltro);
  r.surcos = fuente(c, surcos(c), true); r.surcos.connect(r.disco); r.surcos.start();
  // efectos cercanos: papel, clip, libro
  r.fx = vol(c, 2); r.fx.connect(r.maestro);
  r.fxEco = vol(c, .1); r.fx.connect(r.fxEco).connect(r.eco);
  return r;
}

/* ---------- efectos sintetizados ---------- */
// papel: un roce (ruido filtrado que sube de tono) y crujidos sueltos
function papel(r, t, o = {}){
  const c = r.c, dur = o.dur || .32, brillo = o.brillo || 3200, n = o.granos == null ? 16 : o.granos, nivel = o.nivel || .5, sale = o.sale || r.fx;
  const s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', brillo * .45, .8), g = vol(c);
  s.connect(bp).connect(g).connect(sale);
  bp.frequency.setValueAtTime(brillo * .35, t); bp.frequency.exponentialRampToValueAtTime(brillo, t + dur * .65);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel * .55, t + Math.min(.04, dur * .2)); g.gain.exponentialRampToValueAtTime(.0006, t + dur);
  s.start(t, Math.random() * 1.4, dur + .05);
  for (let i = 0; i < n; i++){
    const ti = t + Math.random() * dur * .85, gs = fuente(c, ruido(c)), f = filtro(c, 'bandpass', brillo * (.6 + Math.random()), 2 + Math.random() * 4), gg = vol(c);
    gs.connect(f).connect(gg).connect(sale);
    gg.gain.setValueAtTime(nivel * (.25 + Math.random() * .9), ti); gg.gain.exponentialRampToValueAtTime(.0004, ti + .005 + Math.random() * .022);
    gs.start(ti, Math.random() * 1.8, .04);
  }
}
// golpe sordo (papel que se asienta, tapa del libro)
function golpe(r, t, f = 320, nivel = .5, dur = .14, sale = r.fx){
  const c = r.c, s = fuente(c, ruido(c)), lp = filtro(c, 'lowpass', f, .9), g = vol(c);
  s.connect(lp).connect(g).connect(sale);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel, t + .008); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  s.start(t, Math.random(), dur + .05);
}
// clip metálico: dos chasquidos y un golpecito
function clip(r, t, nivel = .4){
  const c = r.c;
  [[0, 3300, 1], [.017, 4600, .55]].forEach(([dt, f, k]) => {
    const s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', f, 9), g = vol(c);
    s.connect(bp).connect(g).connect(r.fx);
    g.gain.setValueAtTime(nivel * k * 2.2, t + dt); g.gain.exponentialRampToValueAtTime(.0004, t + dt + .055);
    s.start(t + dt, Math.random(), .07);
  });
  const o = c.createOscillator(), g = vol(c); o.type = 'triangle'; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(120, t + .05);
  o.connect(g).connect(r.fx); g.gain.setValueAtTime(nivel * .35, t); g.gain.exponentialRampToValueAtTime(.0004, t + .06); o.start(t); o.stop(t + .07);
}
// madera: un toque corto (minimapa, años)
function tic(r, t, nivel = .22, f = 1150){
  const c = r.c, o = c.createOscillator(), g = vol(c), o2 = c.createOscillator(), g2 = vol(c);
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * .62, t + .04);
  o2.frequency.value = f * 2.76;
  o.connect(g).connect(r.fx); o2.connect(g2).connect(r.fx);
  g.gain.setValueAtTime(nivel, t); g.gain.exponentialRampToValueAtTime(.0004, t + .05);
  g2.gain.setValueAtTime(nivel * .25, t); g2.gain.exponentialRampToValueAtTime(.0004, t + .018);
  o.start(t); o2.start(t); o.stop(t + .06); o2.stop(t + .03);
}
// rechinido de bisagra: impulsos cada vez más espaciados (fricción)
function rechina(r, t, nivel = .12){
  const c = r.c, bp = filtro(c, 'bandpass', 760, 5), g = vol(c, nivel); bp.connect(g).connect(r.fx);
  let tt = t;
  for (let i = 0; i < 26; i++){
    const s = fuente(c, ruido(c)), gi = vol(c); s.connect(gi).connect(bp);
    gi.gain.setValueAtTime(.9, tt); gi.gain.exponentialRampToValueAtTime(.0003, tt + .004);
    s.start(tt, Math.random(), .01);
    tt += .009 + i * .0016 + Math.random() * .004;
  }
}
// cristal y latón de la lupa
function lupa(r, t, nivel = .07){
  const c = r.c;
  [[2630, 1], [3950, .6], [6120, .3]].forEach(([f, k]) => {
    const o = c.createOscillator(), g = vol(c); o.frequency.value = f; o.connect(g).connect(r.fx);
    g.gain.setValueAtTime(nivel * k, t); g.gain.exponentialRampToValueAtTime(.0002, t + .35 * k + .1); o.start(t); o.stop(t + .5);
  });
}
// la aguja cae en el disco
function aguja(r, t){
  const c = r.c;
  golpe(r, t, 140, .5, .18, r.salaFiltro);
  const s = fuente(c, ruido(c)), hp = filtro(c, 'highpass', 1800, .7), g = vol(c);
  s.connect(hp).connect(g).connect(r.salaFiltro);
  g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.0005, t + .09); s.start(t, Math.random(), .12);
}
// radio de los años veinte: estática que se sintoniza y un silbido que baja
function radio(r, t, sale){
  const c = r.c, dur = 2.8;
  const s = fuente(c, ruido(c), true), bp = filtro(c, 'bandpass', 500, 2.2), g = vol(c);
  s.connect(bp).connect(g).connect(sale);
  bp.frequency.setValueAtTime(420, t); bp.frequency.exponentialRampToValueAtTime(2500, t + dur * .55); bp.frequency.exponentialRampToValueAtTime(1100, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .3); g.gain.setValueAtTime(.22, t + dur * .55); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  const am = c.createOscillator(), amG = vol(c, .12); am.frequency.value = 9; am.connect(amG).connect(g.gain);
  s.start(t, 0, dur + .1); am.start(t); am.stop(t + dur);
  const o = c.createOscillator(), go = vol(c); o.connect(go).connect(sale);
  o.frequency.setValueAtTime(3100, t + .15); o.frequency.exponentialRampToValueAtTime(360, t + 1.4); o.frequency.exponentialRampToValueAtTime(1500, t + 2.3);
  go.gain.setValueAtTime(0, t); go.gain.linearRampToValueAtTime(.05, t + .3); go.gain.linearRampToValueAtTime(.025, t + 1.6); go.gain.exponentialRampToValueAtTime(.0004, t + dur);
  o.start(t); o.stop(t + dur + .05);
}

// moneda: parciales metálicos que no son armónicos, con un leve desafinado distinto cada vez
function moneda(r, t, nivel = .16){
  const c = r.c, d = 1 + (Math.random() - .5) * .04;
  [[2093, .5], [3364, .34], [5243, .2], [7018, .1]].forEach(([f, k]) => {
    const o = c.createOscillator(), g = vol(c); o.frequency.value = f * d; o.connect(g).connect(r.fx);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel * k, t + .002); g.gain.exponentialRampToValueAtTime(.0002, t + .18 + k * .3); o.start(t); o.stop(t + .6);
  });
  tic(r, t, nivel * .5, 2600);
}
function tijera(r, t, nivel = .3){
  [[0, 4600], [.012, 6400]].forEach(([dt, f]) => {
    const c = r.c, s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', f, 6), g = vol(c);
    s.connect(bp).connect(g).connect(r.fx); g.gain.setValueAtTime(nivel, t + dt); g.gain.exponentialRampToValueAtTime(.0003, t + dt + .04); s.start(t + dt, Math.random(), .06);
  });
}
// motor de los años veinte: pistoneo grave; «ahogado» se apaga a tirones
function motor(r, t, dur = .9, ahogado = false, nivel = .036){
  const c = r.c, o = c.createOscillator(), lp = filtro(c, 'lowpass', 420, .8), g = vol(c), lfo = c.createOscillator(), lg = vol(c, nivel * .5);
  o.type = 'square'; o.frequency.setValueAtTime(58, t); o.frequency.linearRampToValueAtTime(ahogado ? 40 : 72, t + dur);
  lfo.frequency.setValueAtTime(12, t); lfo.frequency.linearRampToValueAtTime(ahogado ? 3.5 : 15, t + dur);
  lfo.connect(lg).connect(g.gain); o.connect(lp).connect(g).connect(r.fx);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel, t + .08); g.gain.setValueAtTime(nivel, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0004, t + dur);
  o.start(t); lfo.start(t); o.stop(t + dur + .05); lfo.stop(t + dur + .05);
}
function bomba(r, t, nivel = .3){
  const c = r.c, s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', 260, 2.4), g = vol(c);
  s.connect(bp).connect(g).connect(r.fx);
  bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(900, t + .26);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel, t + .05); g.gain.exponentialRampToValueAtTime(.0005, t + .3);
  s.start(t, Math.random(), .34); golpe(r, t + .24, 200, .25, .1);
}
function tren(r, t, n = 4, nivel = .28){
  for (let i = 0; i < n; i++) golpe(r, t + i * .17, 900, nivel * (i % 2 ? .7 : 1), .1);
}
function pluma(r, t, nivel = .12){
  const c = r.c, s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', 3800, 1.3), g = vol(c), am = c.createOscillator(), ag = vol(c, nivel * .6);
  am.frequency.value = 36; am.connect(ag).connect(g.gain); s.connect(bp).connect(g).connect(r.fx);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel, t + .03); g.gain.exponentialRampToValueAtTime(.0004, t + .2);
  s.start(t, Math.random(), .24); am.start(t); am.stop(t + .24);
}
function tecla(r, t, nivel = .22){
  const c = r.c, s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', 2500, 3), g = vol(c);
  s.connect(bp).connect(g).connect(r.fx); g.gain.setValueAtTime(nivel, t); g.gain.exponentialRampToValueAtTime(.0003, t + .018); s.start(t, Math.random(), .03);
  tic(r, t + .004, nivel * .35, 1800);
}
// campanita al completar una pieza: dos notas suaves
function campanita(r, t, nivel = .05){
  [[1318.5, 0], [1975.5, .11]].forEach(([f, dt]) => [[1, 1], [2.01, .35], [3.02, .12]].forEach(([m, k]) => {
    const c = r.c, o = c.createOscillator(), g = vol(c); o.frequency.value = f * m; o.connect(g).connect(r.fx);
    g.gain.setValueAtTime(0, t + dt); g.gain.linearRampToValueAtTime(nivel * k, t + dt + .004); g.gain.exponentialRampToValueAtTime(.0002, t + dt + .9 * (1.2 - k * .3)); o.start(t + dt); o.stop(t + dt + 1.2);
  }));
}
function boing(r, t, nivel = .16){
  const c = r.c, o = c.createOscillator(), g = vol(c); o.type = 'triangle';
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(460, t + .18); o.frequency.exponentialRampToValueAtTime(380, t + .4);
  o.connect(g).connect(r.fx); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(nivel, t + .01); g.gain.exponentialRampToValueAtTime(.0003, t + .45);
  o.start(t); o.stop(t + .5); golpe(r, t, 240, .3, .08);
}
function gota(r, t, nivel = .13){
  const c = r.c, o = c.createOscillator(), g = vol(c);
  o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(520, t + .08);
  o.connect(g).connect(r.fx); g.gain.setValueAtTime(nivel, t); g.gain.exponentialRampToValueAtTime(.0003, t + .12); o.start(t); o.stop(t + .14);
}

const FX = {
  libro:       (r, t) => { rechina(r, t, .1); golpe(r, t + .05, 260, .55, .34); papel(r, t + .12, {dur: .5, brillo: 2400, granos: 10, nivel: .32}); },
  cierraLibro: (r, t) => { papel(r, t, {dur: .35, brillo: 2200, granos: 6, nivel: .28}); golpe(r, t + .3, 220, .7, .22); },
  papel:       (r, t) => papel(r, t, {dur: .3, brillo: 3400, granos: 14, nivel: .42}),
  suelta:      (r, t) => { clip(r, t, .34); papel(r, t + .05, {dur: .36, brillo: 3000, granos: 12, nivel: .38}); },
  despliega:   (r, t) => { papel(r, t, {dur: .55, brillo: 2300, granos: 20, nivel: .36}); golpe(r, t + .5, 380, .22, .1); },
  pliega:      (r, t) => papel(r, t, {dur: .3, brillo: 2600, granos: 10, nivel: .3}),
  pasa:        (r, t) => { papel(r, t, {dur: .24, brillo: 2900, granos: 9, nivel: .4}); golpe(r, t + .17, 520, .14, .07); },
  clip:        (r, t) => { golpe(r, t, 300, .22, .08); clip(r, t + .02, .4); },
  ficha:       (r, t) => { tic(r, t, .16, 980); papel(r, t + .02, {dur: .16, brillo: 3600, granos: 5, nivel: .2}); },
  tic:         (r, t) => tic(r, t, .2),
  rueda:       (r, t) => tic(r, t, .07, 1700),
  lupa:        (r, t) => lupa(r, t),
  aguja:       (r, t) => aguja(r, t),
  // piezas interactivas de las hojas
  sello:       (r, t) => { golpe(r, t, 150, .8, .16); papel(r, t + .01, {dur: .12, brillo: 2600, granos: 6, nivel: .22}); },
  moneda:      (r, t) => moneda(r, t),
  tijera:      (r, t) => { tijera(r, t); tijera(r, t + .1); },
  motor:       (r, t) => motor(r, t),
  ahogado:     (r, t) => motor(r, t, 1.4, true),
  bomba:       (r, t) => bomba(r, t),
  tren:        (r, t) => tren(r, t),
  pluma:       (r, t) => pluma(r, t),
  ladrillo:    (r, t) => { tic(r, t, .2, 430); golpe(r, t, 650, .3, .06); },
  tecla:       (r, t) => tecla(r, t),
  logro:       (r, t) => campanita(r, t),
  cierre:      (r, t) => { golpe(r, t, 230, .45, .2); tic(r, t + .02, .08, 620); },
  boing:       (r, t) => boing(r, t),
  gota:        (r, t) => gota(r, t),
  sintonia:    (r, t) => { [1046.5, 1568].forEach((f, i) => { const c = r.c, o = c.createOscillator(), g = vol(c); o.frequency.value = f; o.connect(g).connect(r.fx); g.gain.setValueAtTime(0, t + i * .07); g.gain.linearRampToValueAtTime(.06, t + i * .07 + .01); g.gain.exponentialRampToValueAtTime(.0002, t + i * .07 + .35); o.start(t + i * .07); o.stop(t + i * .07 + .4); }); },
  radiocorta:  (r, t) => { const c = r.c, s = fuente(c, ruido(c)), bp = filtro(c, 'bandpass', 900, 2), g = vol(c); s.connect(bp).connect(g).connect(r.fx); bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2400, t + .6); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .08); g.gain.exponentialRampToValueAtTime(.0005, t + .8); s.start(t, Math.random(), .85); },
};

/* ---------- arranque (siempre dentro de un toque o clic) ---------- */
const huboToque = () => !navigator.userActivation || navigator.userActivation.hasBeenActive;
const enGesto = () => !navigator.userActivation || navigator.userActivation.isActive;
function despertar(){
  if (!AC || !activo || document.hidden) return;
  if (!ctx && !huboToque()) return;                  // sin un toque no se crea nada (ni avisos del navegador)
  try {
    if (!ctx){
      try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e){}   // se mezcla con otras apps y respeta el modo silencio
      ctx = new AC({latencyHint: 'interactive'}); red = montar(ctx);
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (quiereMusica && (!musica || musica.paused)) tocar();
  } catch (e){ ctx = null; red = null; }
}
const ahora = (dt = 0) => ctx.currentTime + .01 + dt;
function rampa(param, v, seg){ const t = ctx.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(v, t + seg); }

// el disco se pide sólo cuando va a sonar (en el modo lite no se baja)
function ponerDisco(){
  if (musica || !ctx) return;
  musica = new Audio(); musica.preload = 'auto'; musica.src = MUSICA; musica.playsInline = true; musica.setAttribute('playsinline', '');
  ctx.createMediaElementSource(musica).connect(red.gramofono);
  musica.addEventListener('ended', vuelta);
}
// gramófono: aguja, música y, al terminar el disco, unos segundos de surco antes de volver a empezar
function tocar(){
  if (!red) return;
  ponerDisco();
  rampa(red.disco.gain, .055, 1.2);
  musica.play().catch(() => {});
  if (musica.currentTime < .5){
    FX.aguja(red, ahora(.55));
    red.musica.gain.cancelScheduledValues(ctx.currentTime); red.musica.gain.setValueAtTime(0, ctx.currentTime);
    red.musica.gain.setValueAtTime(0, ahora(.6)); red.musica.gain.linearRampToValueAtTime(.34, ahora(2.2));
  } else rampa(red.musica.gain, .34, 1.4);
}
function vuelta(){
  clearTimeout(tVuelta);
  if (!quiereMusica || !red) return;
  tVuelta = setTimeout(() => {
    if (!quiereMusica || !activo || document.hidden) return;
    musica.currentTime = 0; FX.aguja(red, ahora());
    red.musica.gain.setValueAtTime(0, ctx.currentTime); red.musica.gain.linearRampToValueAtTime(.34, ahora(1.4));
    musica.play().catch(() => {});
  }, 3200);
}
function callar(){
  if (!red) return;
  clearTimeout(tVuelta);
  rampa(red.musica.gain, 0, .6); rampa(red.disco.gain, 0, .6);
  setTimeout(() => { if (!quiereMusica && musica) musica.pause(); }, 650);
}

/* ---------- señales de cada etapa (una vez por visita) ---------- */
function cargar(n){
  if (buffers[n] || pedidos[n] || !ctx) return pedidos[n];
  pedidos[n] = fetch(MUESTRAS[n]).then(r => r.arrayBuffer())
    .then(a => new Promise((ok, mal) => { const p = ctx.decodeAudioData(a, ok, mal); if (p && p.then) p.then(ok, mal); }))
    .then(b => (buffers[n] = b)).catch(() => { delete pedidos[n]; });
  return pedidos[n];
}
function muestra(n, {nivel = .3, pan = .45, corte = 3800, retraso = 0} = {}){
  const b = buffers[n]; if (!b || !red) return;
  const c = ctx, s = fuente(c, b), lp = filtro(c, 'lowpass', corte, .6), g = vol(c, nivel), t = ahora(retraso);
  s.connect(lp).connect(g);
  if (c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p).connect(red.salaFiltro); p.connect(red.eco); }
  else { g.connect(red.salaFiltro); g.connect(red.eco); }
  s.start(t);
}
const SENAL = {
  1: () => { if (!ctx.createStereoPanner) return radio(red, ahora(), red.salaFiltro); const p = ctx.createStereoPanner(); p.pan.value = .4; p.connect(red.salaFiltro); p.connect(red.eco); radio(red, ahora(), p); },
  2: () => cargar('caja').then(() => muestra('caja', {nivel: .42, pan: .5, corte: 5000})),
  3: () => cargar('maquina').then(() => muestra('maquina', {nivel: .4, pan: .35, corte: 5200})),
  4: () => cargar('silbato').then(() => muestra('silbato', {nivel: .26, pan: .55, corte: 2600})),
};

// la estática del radio de la pieza de Bucareli: sube y baja según qué tan lejos está la estación
let estat = null;
function estatica(v){
  if (!red || !activo) return;
  if (!estat){
    if (!v) return;
    const c = ctx, s = fuente(c, ruido(c), true), bp = filtro(c, 'bandpass', 1400, 1.2), g = vol(c, 0), o = c.createOscillator(), og = vol(c, 0);
    s.connect(bp).connect(g).connect(red.fx); o.connect(og).connect(red.fx); s.start(); o.start();
    estat = {s, bp, g, o, og};
  }
  const t = ctx.currentTime, e = estat;
  [[e.g.gain, v * .14], [e.og.gain, v * v * .035], [e.o.frequency, 380 + v * 2400], [e.bp.frequency, 700 + v * 1500]].forEach(([p, x]) => { p.cancelScheduledValues(t); p.setTargetAtTime(x, t, .05); });
  if (!v){ const viejo = estat; estat = null; setTimeout(() => { try { viejo.s.stop(); viejo.o.stop(); } catch (er){} }, 400); }
}
// una grabación «en la mano» (no en la sala): caja registradora, máquina de escribir, silbato
function cercana(n, nivel = .4){
  if (!red || !activo || !MUESTRAS[n]) return;
  cargar(n).then(() => { const b = buffers[n]; if (!b || !red) return; const s = fuente(ctx, b), g = vol(ctx, nivel); s.connect(g).connect(red.fx); s.start(ahora()); });
}

/* ---------- lo que usa app.js ---------- */
window.Sonido = {
  disponible: !!AC,
  get activo(){ return activo && !!AC; },
  despertar,
  alCambiar(f){ oyentes.push(f); f(activo && !!AC); },
  alternar(){
    activo = !activo;
    try { localStorage.setItem(CLAVE, activo ? '1' : '0'); } catch (e){}
    if (activo){ despertar(); if (red){ rampa(red.maestro.gain, .9, .35); FX.tic(red, ahora()); } }
    else if (red){ rampa(red.maestro.gain, 0, .3); clearTimeout(tVuelta); setTimeout(() => { if (activo) return; if (musica) musica.pause(); ctx.suspend().catch(() => {}); }, 380); }
    aviso();
  },
  musica(si){ quiereMusica = si; if (!activo) return; if (si) despertar(); else callar(); },
  // leer una hoja: la sala se oye lejos (más baja y opaca)
  enfoque(si){
    enfocado = si; if (!red || !activo) return;
    const t = ctx.currentTime, f = red.salaFiltro.frequency;
    f.cancelScheduledValues(t); f.setValueAtTime(f.value, t); f.exponentialRampToValueAtTime(si ? 950 : 9000, t + (si ? .7 : 1.1));
    rampa(red.sala.gain, si ? .55 : 1, si ? .7 : 1.1);
  },
  fx(n){
    if (!activo || !red || !FX[n]) return;
    if (ctx.state !== 'running' && !enGesto()) return;          // no se acumulan sonidos mientras está en pausa
    const t = performance.now(); if (t - (ultimo[n] || 0) < 45) return; ultimo[n] = t;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    try { FX[n](red, ahora()); } catch (e){}
  },
  etapa(k){
    if (!activo || !red || ctx.state !== 'running' || etapasOidas.has(k) || !SENAL[k]) return;
    etapasOidas.add(k);
    try { SENAL[k](); } catch (e){}
  },
  precargar(){ if (ctx) Object.keys(MUESTRAS).forEach(cargar); },
  estatica(v){ try { estatica(Math.max(0, Math.min(1, v || 0))); } catch (e){} },
  cercana(n, nivel){ try { if (ctx && (ctx.state === 'running' || enGesto())) cercana(n, nivel); } catch (e){} },
  get estado(){ return {contexto: ctx ? ctx.state : 'ninguno', musica: !!(musica && !musica.paused), tiempo: musica ? +musica.currentTime.toFixed(1) : 0, senales: [...etapasOidas], muestras: Object.keys(buffers)}; },   // para las pruebas
  // pruebas: dibuja un efecto sin sonar (OfflineAudioContext) y devuelve la señal
  _render(n, seg = 1.6){
    const O = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!O) return Promise.resolve(null);
    const oc = new O(2, Math.ceil(44100 * seg), 44100), r = montar(oc);
    r.disco.gain.value = 0;
    if (n === 'radio') radio(r, .02, r.salaFiltro); else FX[n](r, .02);
    return oc.startRendering().then(b => [b.getChannelData(0), b.getChannelData(1)]);
  },
};

// en segundo plano no suena nada; al volver, retoma
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden){ if (musica) musica.pause(); ctx.suspend().catch(() => {}); }
  else if (activo){ ctx.resume().catch(() => {}); if (quiereMusica && musica && musica.paused) musica.play().catch(() => {}); if (enfocado) window.Sonido.enfoque(true); }
});
})();
