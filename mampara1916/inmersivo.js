(() => {
'use strict';
/* =====================================================================
   MODO INMERSIVO: 3D, profundidad y movimiento
   · La portada es un libro con grosor que se inclina con el ratón, con el celular (giroscopio) o,
     si nadie lo mueve, con un vaivén lento. Al abrirlo, la tapa gira sobre el lomo y la cámara
     entra a la primera página; al volver, sale de la página y la tapa se cierra.
   · En la mampara y detrás de la hoja abierta, la escenografía se corre con la inclinación
     (la profundidad al desplazarse la hace el CSS, con animaciones ligadas al desplazamiento).
   Sólo transformaciones y opacidad. app.js lo pide sólo en este modo: window.Inmersivo.activar(api)
   ===================================================================== */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let A = null, activo = false, raf = 0, abriendo = false, oyentes = false, tUlt = 0;
const animaciones = [];
// inclinación (de -1 a 1): la que piden el ratón o el giroscopio (ox, oy) y la que se ve, suavizada (x, y)
const inc = {x: 0, y: 0, ox: 0, oy: 0, t: -1e9};
let giroBase = null, giroEscucha = false;

const enPortada = () => A.app.dataset.estado === 'portada' && !A.tapa.hidden;

/* ---------- entradas ---------- */
function alMoverRaton(e){
  if (e.pointerType && e.pointerType !== 'mouse') return;
  inc.ox = clamp((e.clientX / innerWidth - .5) * 2, -1, 1); inc.oy = clamp((e.clientY / innerHeight - .5) * 2, -1, 1);
  inc.t = performance.now(); pedir();
}
function alGirar(e){
  if (e.beta == null || e.gamma == null) return;
  // con la pantalla acostada, los ejes del celular se intercambian
  const ang = (screen.orientation && screen.orientation.angle) || +window.orientation || 0;
  let gx = e.gamma, gy = e.beta;
  if (ang === 90){ gx = e.beta; gy = -e.gamma; } else if (ang === 270 || ang === -90){ gx = -e.beta; gy = e.gamma; } else if (ang === 180){ gx = -e.gamma; gy = -e.beta; }
  if (!giroBase) giroBase = {x: gx, y: gy};
  giroBase.x += (gx - giroBase.x) * .012; giroBase.y += (gy - giroBase.y) * .012;      // el reposo sigue despacio la postura de la mano
  inc.ox = clamp((gx - giroBase.x) / 16, -1, 1); inc.oy = clamp((gy - giroBase.y) / 16, -1, 1);
  inc.t = performance.now(); pedir();
}
function escucharGiro(){ if (giroEscucha) return; giroEscucha = true; window.addEventListener('deviceorientation', alGirar, {passive: true}); }

/* ---------- cada cuadro: la inclinación se suaviza y se aplica ---------- */
function pedir(){ if (!raf && activo && !document.hidden) raf = requestAnimationFrame(cuadro); }
function cuadro(t){
  raf = 0; if (!activo) return;
  const portada = enPortada() && !abriendo;
  let ox = inc.ox, oy = inc.oy;
  // nadie lo mueve: en la portada el libro se mece despacio, como si flotara
  if (portada && t - inc.t > 2600 && !reduce.matches){ ox = Math.sin(t / 2400) * .45; oy = Math.sin(t / 3300) * .3 - .12; }
  const k = 1 - Math.pow(.91, clamp((t - (tUlt || t - 16.7)) / 16.7, .5, 4)); tUlt = t;
  inc.x += (ox - inc.x) * k; inc.y += (oy - inc.y) * k;
  aplicar(portada);
  if (portada || Math.abs(ox - inc.x) + Math.abs(oy - inc.y) > .002) raf = requestAnimationFrame(cuadro); else tUlt = 0;
}
function aplicar(portada){
  if (portada) A.cuerpo.style.transform = `rotateX(${(-inc.y * 13).toFixed(2)}deg) rotateY(${(inc.x * 21).toFixed(2)}deg)`;
  if (window.Fondos && window.Fondos.inclinar) window.Fondos.inclinar(inc.x, inc.y);
  if (A.app.dataset.estado !== 'mampara') return;
  if (A.visor.hidden){
    // el paisaje (lejos) se corre más que lo que se mueve (en medio); la gráfica y las hojas (cerca) no
    A.escenarios.querySelectorAll('.escena.en-vista').forEach(e => {
      const lejos = e.querySelector('.esc-paisaje'), medio = e.querySelector('.esc-vivos');
      if (lejos) lejos.style.translate = `${(inc.x * 28).toFixed(1)}px ${(inc.y * 9).toFixed(1)}px`;
      if (medio) medio.style.translate = `${(inc.x * 13).toFixed(1)}px ${(inc.y * 5).toFixed(1)}px`;
    });
  } else A.visorEscena.style.translate = `${(-inc.x * 20).toFixed(1)}px ${(-inc.y * 14).toFixed(1)}px`;
}

/* ---------- abrir y cerrar el libro en 3D ---------- */
function cancelar(){ animaciones.splice(0).forEach(a => { try { a.cancel(); } catch (e){} }); }
const anima = (el, k, o) => { const a = el.animate(k, o); animaciones.push(a); return a; };
// la tapa gira sobre el lomo, el libro se endereza y la cámara entra a la primera página (devuelve cuánto dura)
function abrirLibro(){
  cancelar(); abriendo = true;
  const {libro, cuerpo, frente, tapa} = A, dura = 1650;
  anima(cuerpo, [{transform: cuerpo.style.transform || 'none'}, {transform: 'rotateX(5deg) rotateY(-12deg)', offset: .35}, {transform: 'rotateX(0deg) rotateY(0deg)'}], {duration: 1250, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
  anima(frente, [{transform: 'rotateY(0deg)'}, {transform: 'rotateY(-12deg)', offset: .14}, {transform: 'rotateY(-176deg)'}], {duration: 1100, delay: 100, easing: 'cubic-bezier(.5,.02,.25,1)', fill: 'forwards'});
  libro.style.transformOrigin = '50% 50%';
  // la opacidad del libro se queda en 1 (si bajara, el 3D se aplanaría): se desvanece toda la portada
  anima(libro, [{transform: 'none', opacity: 1}, {transform: 'none', opacity: 1, offset: .46}, {transform: 'scale(2.9)', opacity: 1}], {duration: dura, easing: 'cubic-bezier(.62,0,.32,1)', fill: 'forwards'});
  anima(tapa, [{opacity: 1}, {opacity: 1, offset: .72}, {opacity: 0}], {duration: dura, easing: 'ease-in', fill: 'forwards'});
  setTimeout(() => A.son('papel'), 320);
  return dura;
}
// ya en la mampara: el libro vuelve a estar cerrado (escondido) para la próxima vez
function libroGuardado(){ cancelar(); abriendo = false; A.cuerpo.style.transform = ''; A.libro.style.transformOrigin = ''; }
// de regreso: la cámara sale de la página y la tapa se cierra
function volverLibro(){
  cancelar(); abriendo = true;
  const {libro, frente, tapa, cuerpo} = A;
  cuerpo.style.transform = '';
  libro.style.transformOrigin = '50% 50%';
  anima(tapa, [{opacity: 0}, {opacity: 1}], {duration: 380, easing: 'ease-out'});
  anima(libro, [{transform: 'scale(2.9)'}, {transform: 'none'}], {duration: 950, easing: 'cubic-bezier(.25,.75,.2,1)'});
  const cierra = anima(frente, [{transform: 'rotateY(-176deg)'}, {transform: 'rotateY(-8deg)', offset: .86}, {transform: 'rotateY(0deg)'}], {duration: 1000, delay: 620, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'backwards'});
  setTimeout(() => A.son('libro'), 1250);
  cierra.finished.then(() => { abriendo = false; libro.style.transformOrigin = ''; cancelar(); pedir(); }, () => {});
}

/* ---------- encendido ---------- */
function activar(api){
  A = api; if (activo) return; activo = true;
  window.addEventListener('pointermove', alMoverRaton, {passive: true});
  // Android da el giroscopio sin pedir permiso; el iPhone lo pide (app.js lo pide dentro del toque y luego llama a giroscopio())
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission !== 'function' && !A.raton.matches) escucharGiro();
  if (!oyentes){
    oyentes = true;
    A.rollo.addEventListener('scroll', pedir, {passive: true});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) pedir(); });
  }
  pedir();
}
function desactivar(){
  activo = false; cancelAnimationFrame(raf); raf = 0; cancelar(); abriendo = false; tUlt = 0;
  window.removeEventListener('pointermove', alMoverRaton);
  if (giroEscucha){ window.removeEventListener('deviceorientation', alGirar); giroEscucha = false; giroBase = null; }
  if (!A) return;
  A.cuerpo.style.transform = ''; A.libro.style.transformOrigin = '';
  A.escenarios.querySelectorAll('.esc-paisaje, .esc-vivos').forEach(e => { e.style.translate = ''; });
  A.visorEscena.style.translate = '';
  if (window.Fondos && window.Fondos.inclinar) window.Fondos.inclinar(0, 0);
  inc.x = inc.y = inc.ox = inc.oy = 0; inc.t = -1e9;
}

window.Inmersivo = {
  activar, desactivar, abrirLibro, volverLibro, libroGuardado,
  giroscopio: escucharGiro,
  alDesplazar(){ if (activo && !document.hidden) aplicar(false); },   // la escenografía que llega a la pantalla toma la inclinación de una vez
  inclinacion: inc,
};
})();
