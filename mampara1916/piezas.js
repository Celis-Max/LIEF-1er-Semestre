(() => {
'use strict';
/* =====================================================================
   LAS PIEZAS: un artefacto interactivo para cada hoja, y juguetes en la mampara
   Cada hoja trae su propio juego para descubrir su dato (el número grande): imprimir
   bilimbiques, sellar la Constitución, sintonizar el radio, abrir la bóveda, cortar la
   deuda, recibir el cable del crack, repartir la tierra... Cada etapa tiene su manera:
   papeles (Carranza), radio y documentos (Obregón), banco y obra (Calles), crisis
   (Maximato) e industria (Cárdenas). Sólo usa lo que ya dicen la hoja y la tabla de
   indicadores: no agrega información.
   Uso desde app.js: window.Piezas.montar(caja, hoja, servicios), .desmontar(), .juguete(el)
   ===================================================================== */
const NS = 'http://www.w3.org/2000/svg';
const AZUL = '#1f3a5c', SANGRE = '#7a0f10', PETROLEO = '#16110a', LATON = '#c19a4b', PAPEL = '#fffaf0', VERDE = '#4d7a2c';
const MANO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0v5.6"/><path d="M12.2 10.6V9.4a1.6 1.6 0 0 1 3.2 0v1.8"/><path d="M15.4 11V10a1.6 1.6 0 0 1 3.2 0v4.2c0 3.6-2.4 6.3-5.9 6.3h-.6c-2.2 0-3.6-.9-4.9-2.8l-2.4-3.6a1.5 1.5 0 0 1 2.4-1.8L9 13.4"/><path d="M4.5 4.5l1.6 1.2M9.6 2.2v.01M3 9h1.6" opacity=".6"/></svg>';
const fmt = (v, d = 0) => v.toLocaleString('es-MX', {minimumFractionDigits: d, maximumFractionDigits: d});
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function el(tag, at, padre){ const e = document.createElementNS(NS, tag); if (at) for (const k in at) e.setAttribute(k, at[k]); if (padre) padre.appendChild(e); return e; }
function tx(texto, at, padre){ const e = el('text', at, padre); e.textContent = texto; return e; }
let uid = 0; const nuevoId = n => `${n}-${++uid}`;      // los recortes necesitan un id único (la copia del fundido duplica la hoja)

let actual = null;                        // la pieza montada en el visor
const COMPLETAS = 'mampara-piezas';
const completas = (() => { try { return new Set(JSON.parse(localStorage.getItem(COMPLETAS) || '[]')); } catch (e){ return new Set(); } })();
const guardar = () => { try { localStorage.setItem(COMPLETAS, JSON.stringify([...completas])); } catch (e){} };

/* ---------------------------------------------------------------------
   El marco de cada pieza y sus herramientas (A)
   --------------------------------------------------------------------- */
function montar(caja, h, S, nuevo){
  desmontar();
  const c = PIEZAS[h.id];
  caja.dataset.k = h.k;
  caja.innerHTML = `<p class="art__guia">${MANO}<span></span></p><div class="art__escena"></div>
    <div class="art__dato" data-estado="oculto"><strong aria-hidden="true">· · ·</strong><span>${h.dato_l}</span><span class="solo-lector">Dato de la hoja: ${h.dato} ${h.dato_l}.</span></div>
    <div class="art__botones"><button type="button" class="art__accion"></button><button type="button" class="art__otra" hidden>Otra vez</button></div>`;
  const escena = caja.querySelector('.art__escena'), guia = caja.querySelector('.art__guia span'), dato = caja.querySelector('.art__dato'),
        accion = caja.querySelector('.art__accion'), otra = caja.querySelector('.art__otra');
  const limpieza = [], rafs = new Set(), tiempos = new Set();
  let alAccion = null, listo = false, svg = null, fin = null;
  const A = {
    h, c, S, escena, caja,
    serie: S.serie,
    anima: () => S.anima(),
    son: n => S.son(n),
    guia(t){ guia.textContent = t; },
    boton(t, f){ accion.textContent = t; alAccion = f; accion.hidden = !t; },
    lienzo(vb = '0 0 320 150'){ svg = el('svg', {viewBox: vb, role: 'img', 'aria-hidden': 'true'}, escena); return svg; },
    // punto del puntero en las coordenadas del dibujo
    punto(e){ const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : {x: 0, y: 0}; },
    anim(nodo, kf, op = {}){
      const a = nodo.animate(kf, Object.assign({fill: 'forwards', easing: 'cubic-bezier(.2,.8,.2,1)'}, op, S.anima() ? {} : {duration: 1, delay: 0}));
      return a.finished.catch(() => {});
    },
    raf(f){ const id = requestAnimationFrame(t => { rafs.delete(id); f(t); }); rafs.add(id); return id; },
    tiempo(f, ms){ const id = setTimeout(() => { tiempos.delete(id); f(); }, S.anima() ? ms : 0); tiempos.add(id); return id; },
    limpiar(f){ limpieza.push(f); },
    // un número que cuenta de a hasta b (sólo para letreros del dibujo; el dato grande rueda aparte)
    contar(nodo, a, b, ms = 900, d = 0, pre = '', suf = ''){
      return new Promise(ok => {
        if (!S.anima() || ms <= 0){ nodo.textContent = pre + fmt(b, d) + suf; ok(); return; }
        const t0 = performance.now();
        const f = t => { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); nodo.textContent = pre + fmt(a + (b - a) * e, d) + suf; if (p < 1) A.raf(f); else ok(); };
        A.raf(f);
      });
    },
    // un dibujo del libro (billete, locomotora, torre…) dentro de una caja
    simbolo(n, x, y, w, hh, padre, at = {}){ const g = el('g', at, padre); const s = S.simbolos[n]; const v = el('svg', {x, y, width: w, height: hh, viewBox: s.vb, overflow: 'visible'}, g); v.innerHTML = s.svg; return g; },
    // arrastrar algo (con el dedo o el ratón) en coordenadas del dibujo
    // eje 'x': el dedo arrastra de lado y la página aún se desplaza hacia arriba y abajo; si no, el dibujo se queda con todo el gesto
    // (touch-action sólo cuenta en el <svg> de afuera, no en sus piezas)
    arrastre(nodo, {inicio, mover, fin: soltar, eje}){
      (nodo.ownerSVGElement || nodo).style.touchAction = eje === 'x' ? 'pan-y' : 'none'; nodo.style.cursor = 'grab';
      const abajo = e => {
        if (e.button > 0) return; e.preventDefault(); e.stopPropagation();
        try { nodo.setPointerCapture(e.pointerId); } catch (er){}
        nodo.style.cursor = 'grabbing'; if (inicio) inicio(A.punto(e), e);
        const m = ev => { if (mover) mover(A.punto(ev), ev); };
        const u = ev => { nodo.removeEventListener('pointermove', m); nodo.removeEventListener('pointerup', u); nodo.removeEventListener('pointercancel', u); nodo.style.cursor = 'grab'; if (soltar) soltar(A.punto(ev), ev); };
        nodo.addEventListener('pointermove', m); nodo.addEventListener('pointerup', u); nodo.addEventListener('pointercancel', u);
      };
      nodo.addEventListener('pointerdown', abajo); limpieza.push(() => nodo.removeEventListener('pointerdown', abajo));
    },
    // mantener presionado: avanza mientras se sostiene (dt en segundos)
    mantener(nodo, avanzar, alSoltar){
      let raf = 0, t0 = 0;
      const paso = t => { const dt = t0 ? Math.min(.05, (t - t0) / 1000) : .016; t0 = t; if (avanzar(dt) !== false) raf = A.raf(paso); else raf = 0; };
      const baja = e => { if (e.button > 0) return; e.preventDefault(); try { nodo.setPointerCapture(e.pointerId); } catch (er){} t0 = 0; if (!raf) raf = A.raf(paso); };
      const sube = () => { if (raf){ cancelAnimationFrame(raf); rafs.delete(raf); raf = 0; } if (alSoltar) alSoltar(); };
      (nodo.ownerSVGElement || nodo).style.touchAction = 'none';
      nodo.addEventListener('pointerdown', baja); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => nodo.addEventListener(n, sube));
      limpieza.push(() => { nodo.removeEventListener('pointerdown', baja); sube(); });
    },
    // un rango accesible (teclado y lector de pantalla) para elegir un año
    rango({min, max, paso = 1, valor, etiqueta, texto, alCambiar}){
      const r = document.createElement('input'); r.type = 'range'; r.className = 'art__rango';
      Object.assign(r, {min, max, step: paso, value: valor}); r.setAttribute('aria-label', etiqueta);
      const pon = () => { r.setAttribute('aria-valuetext', texto(+r.value)); alCambiar(+r.value); };
      r.addEventListener('input', pon); escena.appendChild(r); r.setAttribute('aria-valuetext', texto(+r.value));
      return r;
    },
    // la pieza terminó: aparece el dato (rueda como sumadora) y se guarda como vista
    listo(quieto){
      if (listo) return; listo = true;
      dato.dataset.estado = 'visto';
      const st = dato.querySelector('strong'); st.textContent = h.dato;
      if (!quieto){ S.rodar(st); A.son(c.triste ? 'cierre' : 'logro'); }
      accion.hidden = true; otra.hidden = false;
      if (!quieto) A.anim(dato, [{opacity: .2, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 420});
      completas.add(h.id); guardar(); if (S.alCompletar) S.alCompletar(h.id);
    },
    get hecho(){ return listo; },
    alFinal(f){ fin = f; },
  };
  accion.addEventListener('click', () => { if (alAccion) alAccion(); });
  otra.addEventListener('click', () => { montar(caja, h, S, true); const b = caja.querySelector('.art__accion'); if (b && !b.hidden) b.focus({preventScroll: true}); });
  if (!c){ A.listo(true); return; }
  A.guia(c.guia); A.boton(c.boton || 'Hacerlo', null);
  try { TIPOS[c.tipo](A, c, h); } catch (e){ console.error(e); A.listo(true); }
  // si ya se había hecho en este aparato, se muestra terminada (con «Otra vez» para repetirla)
  if (!nuevo && completas.has(h.id) && fin && !listo){ try { fin(true); } catch (e){} A.listo(true); }
  actual = {destruir(){ limpieza.forEach(f => { try { f(); } catch (e){} }); rafs.forEach(cancelAnimationFrame); tiempos.forEach(clearTimeout); S.estatica && S.estatica(0); }};
}
function desmontar(){ if (actual){ actual.destruir(); actual = null; } }

/* ---------------------------------------------------------------------
   Los tipos de pieza
   --------------------------------------------------------------------- */
const TIPOS = {
  /* C1 · imprimir bilimbiques: cada billete sale más pálido y el dólar sube */
  imprenta(A, c){
    const v = A.lienzo('0 0 320 150');
    el('rect', {x: 22, y: 16, width: 96, height: 10, rx: 2, fill: 'currentColor'}, v);
    el('rect', {x: 26, y: 26, width: 6, height: 106, fill: 'currentColor', opacity: .8}, v);
    el('rect', {x: 108, y: 26, width: 6, height: 106, fill: 'currentColor', opacity: .8}, v);
    el('rect', {x: 30, y: 122, width: 80, height: 9, rx: 1.5, fill: 'currentColor', opacity: .5}, v);
    const placa = el('rect', {x: 36, y: 30, width: 68, height: 9, rx: 1.5, fill: 'currentColor', class: 'mov'}, v);
    tx('Prensa', {x: 70, y: 146, 'text-anchor': 'middle', 'font-size': 9, opacity: .7}, v);
    const pila = el('g', {}, v);
    tx('Pesos por dólar', {x: 276, y: 12, 'text-anchor': 'middle', 'font-size': 9}, v);
    el('rect', {x: 264, y: 18, width: 24, height: 112, rx: 12, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.3}, v);
    const nivel = el('rect', {x: 268, y: 22, width: 16, height: 104, rx: 8, fill: SANGRE, class: 'mov', style: 'transform-origin:50% 100%;transform:scaleY(.04)'}, v);
    const cifra = tx('', {x: 276, y: 146, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, v);
    const pasos = 6; let n = 0;
    const imprime = () => {
      if (n >= pasos) return; n++;
      A.son('sello'); A.son('papel');
      A.anim(placa, [{transform: 'none'}, {transform: 'translateY(80px)', offset: .45}, {transform: 'none'}], {duration: 420, easing: 'ease-in-out', fill: 'none'});
      const pos = el('g', {transform: `translate(${132 + (n % 3) * 8} ${92 - n * 11}) rotate(${n % 2 ? 5 : -6})`}, pila);
      const mov = el('g', {class: 'mov', opacity: (1 - n * .12).toFixed(2)}, pos);
      A.simbolo('billete', 0, 0, 104, 54, mov);
      A.anim(mov, [{transform: 'translate(-70px,20px) scale(.6)', opacity: 0}, {transform: 'none', opacity: 1 - n * .12}], {duration: 520, delay: 160});
      A.anim(nivel, [{transform: `scaleY(${(.04 + .96 * Math.pow((n - 1) / pasos, 1.6)).toFixed(3)})`}, {transform: `scaleY(${(.04 + .96 * Math.pow(n / pasos, 1.6)).toFixed(3)})`}], {duration: 600, delay: 200});
      A.boton(n < pasos ? `Imprimir más (${pasos - n})` : '', imprime);
      if (n === pasos) A.tiempo(() => { cifra.textContent = '23.83'; A.guia('Sin respaldo, el billete pierde valor'); A.listo(); }, 760);
    };
    A.boton('Imprimir billetes', imprime);
    v.addEventListener('click', imprime);
    A.alFinal(() => { while (n < pasos) imprime(); cifra.textContent = '23.83'; A.guia('Sin respaldo, el billete pierde valor'); });
  },

  /* C2 · sellar los tres artículos económicos */
  sellos(A, c){
    const v = A.lienzo('0 0 320 150');
    el('rect', {x: 8, y: 6, width: 304, height: 92, rx: 4, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.2, opacity: .95}, v);
    tx('Constitución · Querétaro, 5 de febrero de 1917', {x: 160, y: 22, 'text-anchor': 'middle', 'font-size': 10, class: 'tit'}, v);
    const lect = tx('', {x: 160, y: 122, 'text-anchor': 'middle', 'font-size': 11.5}, v);
    const lect2 = tx('', {x: 160, y: 138, 'text-anchor': 'middle', 'font-size': 11.5}, v);
    const arts = [['27', 'La nación, dueña del subsuelo:', 'petróleo y minas'], ['28', 'Un banco único', 'de emisión'], ['123', 'Jornada, salario mínimo', 'y derecho de huelga']];
    let n = 0;
    const lugares = arts.map(([num], i) => {
      const x = 62 + i * 98, g = el('g', {style: 'cursor:pointer'}, v);
      el('circle', {cx: x, cy: 60, r: 24, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.2, 'stroke-dasharray': '3 3', opacity: .6}, g);
      tx(`Art. ${num}`, {x, y: 64, 'text-anchor': 'middle', 'font-size': 11, opacity: .55}, g);
      el('rect', {x: x - 34, y: 30, width: 68, height: 62, fill: 'transparent'}, g);
      g.addEventListener('click', () => sella(i));
      return {x, g, hecho: false};
    });
    const sella = (i, quieto) => {
      const L = lugares[i]; if (L.hecho) return; L.hecho = true; n++;
      const s = el('g', {class: 'mov'}, v);
      el('circle', {cx: L.x, cy: 60, r: 22, fill: SANGRE}, s);
      el('circle', {cx: L.x, cy: 60, r: 17, fill: 'none', stroke: '#f3d9c9', 'stroke-width': 1, opacity: .7}, s);
      tx(arts[i][0], {x: L.x, y: 66, 'text-anchor': 'middle', 'font-size': 15, fill: '#f6e6d9', class: 'tit'}, s);
      if (!quieto){ A.son('sello'); A.anim(s, [{transform: 'scale(1.7) rotate(-14deg)', opacity: 0}, {transform: 'scale(.94) rotate(2deg)', opacity: 1, offset: .7}, {transform: 'none', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.3,0,.3,1)'}); }
      lect.textContent = `Art. ${arts[i][0]}: ${arts[i][1]}`; lect2.textContent = arts[i][2];
      const sig = lugares.findIndex(l => !l.hecho);
      A.boton(sig >= 0 ? `Sellar el artículo ${arts[sig][0]}` : '', () => sella(sig));
      if (n === 3 && !quieto) A.tiempo(() => { A.guia('Las reglas del juego económico del siglo XX'); A.listo(); }, 500);
    };
    A.boton('Sellar el artículo 27', () => sella(0));
    A.alFinal(() => { [0, 1, 2].forEach(i => sella(i, true)); A.guia('Las reglas del juego económico del siglo XX'); });
  },

  /* C3 · bombear petróleo hasta llenar un tercio de los ingresos */
  tercio(A){
    const v = A.lienzo('0 0 320 150');
    A.simbolo('torre', 14, 26, 70, 106, v);
    el('path', {d: 'M76 120 H118', stroke: 'currentColor', 'stroke-width': 4, 'stroke-linecap': 'round'}, v);
    const X = 120, Y = 18, W = 150, H = 118;
    tx('Ingresos del gobierno federal, 1921', {x: X + W / 2, y: 12, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    el('rect', {x: X, y: Y, width: W, height: H, rx: 3, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.4}, v);
    const crudo = el('rect', {x: X + 2, y: Y + 2, width: W - 4, height: H - 4, fill: PETROLEO, class: 'mov', style: 'transform-origin:50% 100%;transform:scaleY(0)'}, v);
    for (let i = 1; i < 3; i++) el('line', {x1: X, x2: X + W, y1: Y + H * i / 3, y2: Y + H * i / 3, stroke: 'currentColor', 'stroke-dasharray': '4 3', opacity: .55}, v);
    const marca = tx('', {x: X + W + 8, y: Y + H * 2 / 3 + 4, 'font-size': 14, class: 'tit'}, v);
    let p = 0, tb = 0;
    const pon = () => { crudo.style.transform = `scaleY(${(p / 3).toFixed(4)})`; };
    const termina = () => { p = 1; pon(); marca.textContent = '1/3'; A.guia('El petróleo trae dólares e impuestos'); A.listo(); };
    A.mantener(v, dt => { if (A.hecho) return false; p = Math.min(1, p + dt * .55); pon(); tb += dt; if (tb > .32){ tb = 0; A.son('bomba'); } if (p >= 1){ termina(); return false; } });
    A.boton('Bombear petróleo', () => { if (A.hecho) return; A.son('bomba'); A.anim(crudo, [{transform: `scaleY(${(p / 3).toFixed(4)})`}, {transform: 'scaleY(.3333)'}], {duration: 1300, easing: 'ease-in-out'}).then(termina); });
    A.alFinal(() => { p = 1; pon(); marca.textContent = '1/3'; A.guia('El petróleo trae dólares e impuestos'); });
  },

  /* C4 · jalar el tren: cada carro que pasa la raya se pierde */
  tren(A, c){
    const v = A.lienzo('0 0 320 150');
    el('line', {x1: 0, x2: 320, y1: 112, y2: 112, stroke: 'currentColor', 'stroke-width': 2}, v);
    for (let x = 4; x < 320; x += 14) el('line', {x1: x, x2: x + 6, y1: 116, y2: 116, stroke: 'currentColor', 'stroke-width': 3, opacity: .5}, v);
    el('line', {x1: 96, x2: 96, y1: 30, y2: 118, stroke: SANGRE, 'stroke-width': 1.4, 'stroke-dasharray': '4 3'}, v);
    tx('Revolución', {x: 92, y: 26, 'text-anchor': 'end', 'font-size': 9, fill: SANGRE}, v);
    const cont = tx('0', {x: 40, y: 56, 'text-anchor': 'middle', 'font-size': 20, class: 'tit'}, v);
    tx('carros perdidos', {x: 40, y: 70, 'text-anchor': 'middle', 'font-size': 8.5}, v);
    const tren = el('g', {class: 'mov'}, v), carros = [];
    A.simbolo('locomotora', 110, 66, 62, 50, tren);
    for (let i = 0; i < 12; i++){
      const g = el('g', {}, tren), x = 176 + i * 40;
      el('rect', {x, y: 84, width: 34, height: 22, rx: 2, fill: 'currentColor', opacity: .8}, g);
      el('circle', {cx: x + 8, cy: 109, r: 4, fill: 'currentColor'}, g); el('circle', {cx: x + 26, cy: 109, r: 4, fill: 'currentColor'}, g);
      carros.push({g, x});
    }
    const L = 176 + 12 * 40 - 96;           // recorrido hasta que el último carro cruza la raya
    let dx = 0, tchug = 0;
    const pinta = () => {
      tren.style.transform = `translateX(${-dx}px)`;
      carros.forEach(k => { const perdido = k.x + 34 - dx < 96; k.g.setAttribute('opacity', perdido ? .22 : 1); k.g.setAttribute('stroke-dasharray', perdido ? '3 2' : ''); });
      cont.textContent = fmt(Math.round(3873 * Math.min(1, dx / L)));
    };
    const termina = () => { dx = L; pinta(); cont.textContent = '3,873'; A.guia('Y 50 locomotoras'); A.listo(); };
    let x0 = 0, d0 = 0;
    A.arrastre(v, {eje: 'x', inicio: p => { x0 = p.x; d0 = dx; }, mover: p => { if (A.hecho) return; dx = clamp(d0 + (x0 - p.x) * 1.6, 0, L); pinta(); const t = performance.now(); if (t - tchug > 300){ tchug = t; A.son('tren'); } if (dx >= L) termina(); }});
    A.boton('Jalar el tren', () => { if (A.hecho) return; A.son('tren'); const a = dx, t0 = performance.now(), D = 2200; const f = t => { const q = Math.min(1, (t - t0) / D); dx = a + (L - a) * (1 - Math.pow(1 - q, 2)); pinta(); if (q < 1) A.raf(f); else termina(); }; if (A.anima()) A.raf(f); else termina(); });
    A.alFinal(() => { dx = L; pinta(); cont.textContent = '3,873'; A.guia('Y 50 locomotoras'); });
  },

  /* C5 · levantar las tarjetas y encontrar el año que más creció */
  mejor(A, c){
    const v = A.lienzo('0 0 320 150'), anios = [1916, 1917, 1918, 1919, 1920], vals = anios.map(a => A.serie.pib_crec[a - 1916]), max = Math.max(...vals);
    el('line', {x1: 14, x2: 306, y1: 124, y2: 124, stroke: 'currentColor', 'stroke-width': 1.2}, v);
    const lect = tx('', {x: 160, y: 14, 'text-anchor': 'middle', 'font-size': 11}, v);
    const tarjetas = anios.map((a, i) => {
      const x = 22 + i * 58, hgt = vals[i] / max * 78;
      el('rect', {x: x + 8, y: 124 - hgt, width: 34, height: hgt, fill: 'currentColor', opacity: vals[i] === max ? 1 : .55}, v);
      tx(fmt(vals[i], 1) + ' %', {x: x + 25, y: 118 - hgt, 'text-anchor': 'middle', 'font-size': 10.5, class: 'tit'}, v);
      tx(String(a), {x: x + 25, y: 140, 'text-anchor': 'middle', 'font-size': 10.5}, v);
      const tapa = el('g', {class: 'mov', style: 'cursor:pointer'}, v);
      el('rect', {x: x + 2, y: 22, width: 46, height: 104, rx: 3, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.2}, tapa);
      tx('?', {x: x + 25, y: 82, 'text-anchor': 'middle', 'font-size': 24, class: 'tit', opacity: .5}, tapa);
      const t = {tapa, a, val: vals[i], arriba: false};
      tapa.addEventListener('click', () => levanta(t));
      return t;
    });
    const levanta = (t, quieto) => {
      if (t.arriba) return; t.arriba = true;
      if (!quieto){ A.son('pasa'); }
      A.anim(t.tapa, [{transform: 'none', opacity: 1}, {transform: 'translateY(-120px)', opacity: 0}], {duration: quieto ? 1 : 520, easing: 'cubic-bezier(.5,0,.2,1)'});
      if (quieto) return;
      if (t.val === max){ lect.textContent = `${t.a}: el mejor año del periodo`; tarjetas.forEach(o => levanta(o, true)); A.guia('Gracias al petróleo'); A.tiempo(() => A.listo(), 450); }
      else { lect.textContent = `${t.a}: ${fmt(t.val, 1)} %. Sigue buscando`; }
    };
    A.boton('Levantar la siguiente', () => { const t = tarjetas.find(o => !o.arriba); if (t) levanta(t); });
    A.alFinal(() => { tarjetas.forEach(o => levanta(o, true)); lect.textContent = '1920: el mejor año del periodo'; A.guia('Gracias al petróleo'); });
  },

  /* O1 · pasar el dedo sobre la gente para contarla */
  censo(A, c){
    const v = A.lienzo('0 0 320 150'), gente = [];
    const cont = tx('0', {x: 284, y: 70, 'text-anchor': 'middle', 'font-size': 26, class: 'tit'}, v);
    tx('millones', {x: 284, y: 86, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    for (let i = 0; i < 15; i++){
      const col = i % 5, fila = Math.floor(i / 5), x = 26 + col * 46, y = 16 + fila * 44, g = el('g', {class: 'mov'}, v);
      const parcial = i === 14;
      const idp = nuevoId('censo');
      if (parcial){ const cp = el('clipPath', {id: idp}, v); el('rect', {x: x - 14, y, width: 28 * .3, height: 42}, cp); }
      const f = el('g', parcial ? {'clip-path': `url(#${idp})`} : {}, g);
      el('circle', {cx: x, cy: y + 8, r: 6.5, fill: 'currentColor'}, f);
      el('path', {d: `M${x - 11} ${y + 38} q0 -21 11 -21 q11 0 11 21 z`, fill: 'currentColor'}, f);
      el('path', {d: `M${x - 11} ${y + 38} q0 -21 11 -21 q11 0 11 21 z M${x} ${y + 1.5} a6.5 6.5 0 1 0 .01 0`, fill: 'none', stroke: 'currentColor', 'stroke-width': 1, 'stroke-dasharray': '2 2', opacity: .35}, g);
      f.setAttribute('opacity', 0);
      gente.push({f, x, y, contado: false, valor: parcial ? .3 : 1});
    }
    let total = 0;
    const cuenta = (p, quieto) => {
      if (p.contado) return; p.contado = true; total += p.valor;
      p.f.setAttribute('opacity', 1); if (!quieto){ A.son('tic'); A.anim(p.f, [{transform: 'scale(.4)'}, {transform: 'none'}], {duration: 260}); }
      cont.textContent = fmt(Math.round(total * 10) / 10, total % 1 ? 1 : 0);
      if (gente.every(q => q.contado) && !quieto){ cont.textContent = '14.3'; A.guia('Menos gente que en 1910'); A.listo(); }
    };
    A.arrastre(v, {inicio: p => toca(p), mover: p => toca(p)});
    const toca = pt => { if (A.hecho) return; gente.forEach(q => { if (Math.abs(pt.x - q.x) < 22 && pt.y > q.y - 4 && pt.y < q.y + 44) cuenta(q); }); };
    A.boton('Contar a la gente', () => { gente.filter(q => !q.contado).forEach((q, i) => A.tiempo(() => cuenta(q), i * 110)); });
    A.alFinal(() => { gente.forEach(q => cuenta(q, true)); cont.textContent = '14.3'; A.guia('Menos gente que en 1910'); });
  },

  /* O2 · el barril de 1921 se vacía hasta la quinta parte */
  vaciar(A, c){
    const v = A.lienzo('0 0 320 150');
    const X = 112, Y = 14, W = 96, H = 120;
    el('rect', {x: X, y: Y, width: W, height: H, rx: 14, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.6}, v);
    const crudo = el('rect', {x: X + 3, y: Y + 3, width: W - 6, height: H - 6, rx: 11, fill: PETROLEO, class: 'mov', style: 'transform-origin:50% 100%'}, v);
    for (let i = 1; i < 5; i++) el('line', {x1: X - 6, x2: X + W + 6, y1: Y + H * i / 5, y2: Y + H * i / 5, stroke: 'currentColor', 'stroke-dasharray': '3 3', opacity: .5}, v);
    const anio = tx('1921', {x: X + W + 18, y: Y + 14, 'font-size': 18, class: 'tit'}, v);
    const lect = tx('Producción', {x: 14, y: 28, 'font-size': 9.5}, v), lect2 = tx('de petróleo', {x: 14, y: 40, 'font-size': 9.5}, v);
    const quinta = tx('', {x: X + W + 18, y: Y + H - 8, 'font-size': 14, class: 'tit'}, v);
    let goteo = 0;
    const pon = val => {
      const f = 1 - .8 * val / 100; crudo.style.transform = `scaleY(${f.toFixed(4)})`;
      anio.textContent = val >= 100 ? '1930' : val <= 0 ? '1921' : '…';
      const t = performance.now(); if (val > 0 && val < 100 && t - goteo > 260){ goteo = t; A.son('gota'); }
      if (val >= 100 && !A.hecho){ quinta.textContent = '1/5'; A.guia('Los pozos se agotan'); A.listo(); }
    };
    void lect; void lect2;
    const r = A.rango({min: 0, max: 100, valor: 0, etiqueta: 'Año de la producción', texto: x => x >= 100 ? '1930' : x <= 0 ? '1921' : 'entre 1921 y 1930', alCambiar: pon});
    A.boton('Ir a 1930', () => { const a = +r.value, t0 = performance.now(); const f = t => { const q = Math.min(1, (t - t0) / 1600); r.value = a + (100 - a) * q; pon(+r.value); if (q < 1) A.raf(f); }; if (A.anima()) A.raf(f); else { r.value = 100; pon(100); } });
    A.alFinal(() => { r.value = 100; crudo.style.transform = 'scaleY(.2)'; anio.textContent = '1930'; quinta.textContent = '1/5'; A.guia('Los pozos se agotan'); });
  },

  /* O3 · firmar el convenio en Nueva York: la deuda vieja vuelve a contarse */
  firma(A, c){
    const v = A.lienzo('0 0 320 150');
    const doc = el('g', {class: 'mov'}, v);
    el('rect', {x: 20, y: 6, width: 280, height: 104, rx: 3, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.2}, doc);
    tx('Convenio · Nueva York, 16 de junio de 1922', {x: 160, y: 24, 'text-anchor': 'middle', 'font-size': 10, class: 'tit'}, doc);
    for (let i = 0; i < 3; i++) el('line', {x1: 40, x2: 280 - i * 40, y1: 38 + i * 10, y2: 38 + i * 10, stroke: 'currentColor', opacity: .25}, doc);
    el('line', {x1: 150, x2: 286, y1: 96, y2: 96, stroke: 'currentColor', 'stroke-width': 1}, doc);
    tx('Firma', {x: 150, y: 106, 'font-size': 8.5, opacity: .7}, doc);
    const trazo = el('path', {d: '', fill: 'none', stroke: AZUL, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}, doc);
    const barras = el('g', {opacity: 0}, v);
    let d = '', largo = 0, ultimo = null, tpl = 0;
    const firmado = () => {
      if (A.hecho) return;
      A.son('sello');
      const s = el('g', {class: 'mov'}, doc); el('circle', {cx: 82, cy: 84, r: 15, fill: 'none', stroke: SANGRE, 'stroke-width': 2}, s); tx('1922', {x: 82, y: 88, 'text-anchor': 'middle', 'font-size': 9, fill: SANGRE, class: 'tit'}, s);
      A.anim(s, [{transform: 'scale(1.6)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 300});
      A.tiempo(() => {
        A.anim(doc, [{transform: 'none', opacity: 1}, {transform: 'translateY(-30px) scale(.5)', opacity: 0}], {duration: 520});
        barras.setAttribute('opacity', 1);
        const k = 118 / 724, h1 = 280 * k, h2 = 724 * k;
        el('rect', {x: 70, y: 140 - h1, width: 60, height: h1, fill: AZUL, opacity: .55}, barras);
        const crece = el('rect', {x: 190, y: 140 - h2, width: 60, height: h2, fill: AZUL, class: 'mov', style: `transform-origin:50% 100%;transform:scaleY(${(h1 / h2).toFixed(4)})`}, barras);
        tx('1921', {x: 100, y: 150, 'text-anchor': 'middle', 'font-size': 9.5}, barras); tx('1922', {x: 220, y: 150, 'text-anchor': 'middle', 'font-size': 9.5}, barras);
        tx('280', {x: 100, y: 134 - h1, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, barras);
        const t2 = tx('280', {x: 220, y: 134 - h1, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, barras);
        A.anim(crece, [{transform: `scaleY(${(h1 / h2).toFixed(4)})`}, {transform: 'none'}], {duration: 900, delay: 200});
        A.anim(t2, [{transform: 'none'}, {transform: `translateY(${-(h2 - h1)}px)`}], {duration: 900, delay: 200});
        A.contar(t2, 280, 724, 900).then(() => { A.guia('No es dinero nuevo: es deuda vieja con sus intereses'); A.listo(); });
      }, 420);
    };
    A.arrastre(v, {
      inicio: p => { if (A.hecho) return; ultimo = p; d += `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`; trazo.setAttribute('d', d); },
      mover: p => { if (A.hecho || !ultimo) return; largo += Math.hypot(p.x - ultimo.x, p.y - ultimo.y); ultimo = p; d += `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`; trazo.setAttribute('d', d); const t = performance.now(); if (t - tpl > 160){ tpl = t; A.son('pluma'); } if (largo > 150) firmado(); },
      fin: () => { ultimo = null; },
    });
    A.boton('Firmar el convenio', () => {
      if (A.hecho) return;
      const pts = []; for (let i = 0; i <= 30; i++){ const t = i / 30; pts.push([160 + t * 110, 88 - Math.sin(t * 18) * 7 * (1 - t * .5) - t * 6]); }
      let i = 0; const f = () => { if (i >= pts.length){ firmado(); return; } d += `${i ? 'L' : 'M'}${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`; trazo.setAttribute('d', d); if (i % 6 === 0) A.son('pluma'); i++; A.tiempo(f, 22); }; f();
    });
    A.alFinal(() => { doc.setAttribute('opacity', 0); barras.setAttribute('opacity', 1); const k = 118 / 724;
      [[100, 280, .55], [220, 724, 1]].forEach(([x, val, op]) => { el('rect', {x: x - 30, y: 140 - val * k, width: 60, height: val * k, fill: AZUL, opacity: op}, barras); tx(String(val), {x, y: 134 - val * k, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, barras); tx(String(val === 280 ? 1921 : 1922), {x, y: 150, 'text-anchor': 'middle', 'font-size': 9.5}, barras); });
      A.guia('No es dinero nuevo: es deuda vieja con sus intereses'); });
  },

  /* O4 · sintonizar el radio hasta oír la noticia de Bucareli */
  radio(A, c){
    const v = A.lienzo('0 0 320 150');
    el('rect', {x: 10, y: 8, width: 300, height: 134, rx: 18, fill: 'currentColor', opacity: .9}, v);
    el('rect', {x: 18, y: 16, width: 284, height: 118, rx: 13, fill: '#3b2416'}, v);
    for (let i = 0; i < 6; i++) el('path', {d: `M${34 + i * 9} 34 v80`, stroke: '#d9b78c', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .55}, v);
    const X0 = 108, X1 = 292;
    el('rect', {x: X0 - 6, y: 28, width: X1 - X0 + 12, height: 52, rx: 6, fill: '#f3e3c3'}, v);
    for (let i = 0; i <= 20; i++){ const x = X0 + (X1 - X0) * i / 20; el('line', {x1: x, x2: x, y1: 34, y2: i % 5 ? 42 : 48, stroke: '#3b2416', 'stroke-width': 1}, v); }
    ['550', '800', '1000', '1300', '1600'].forEach((k, i) => tx(k, {x: X0 + (X1 - X0) * i / 4, y: 60, 'text-anchor': 'middle', 'font-size': 7.5, fill: '#3b2416'}, v));
    const aguja = el('line', {x1: 0, x2: 0, y1: 30, y2: 78, stroke: SANGRE, 'stroke-width': 2.2, class: 'mov'}, v);
    const nota = tx('', {x: 200, y: 74, 'text-anchor': 'middle', 'font-size': 8.5, fill: '#3b2416', class: 'tit'}, v);
    const perilla = el('g', {style: 'cursor:grab'}, v);
    el('circle', {cx: 200, cy: 110, r: 17, fill: '#d9b78c', stroke: '#3b2416', 'stroke-width': 2}, perilla);
    const raya = el('line', {x1: 200, x2: 200, y1: 96, y2: 104, stroke: '#3b2416', 'stroke-width': 2.4, 'stroke-linecap': 'round', class: 'mov', style: 'transform-box:view-box;transform-origin:200px 110px'}, perilla);
    el('rect', {x: X0 - 10, y: 24, width: X1 - X0 + 20, height: 106, fill: 'transparent'}, perilla);
    const meta = .72 + (Math.random() - .5) * .16;
    let pos = .12, lista = false;
    const pinta = () => { aguja.style.transform = `translateX(${(X0 + (X1 - X0) * pos).toFixed(1)}px)`; raya.style.transform = `rotate(${(pos * 300).toFixed(1)}deg)`; };
    const cerca = () => Math.abs(pos - meta);
    const prueba = () => {
      if (lista) return; pinta();
      const dd = cerca(); A.S.estatica(dd < .03 ? 0 : clamp(.25 + dd * 2.2, 0, 1));
      if (dd < .03){ lista = true; pos = meta; pinta(); A.S.estatica(0); A.son('sintonia'); aguja.setAttribute('stroke', VERDE);
        nota.textContent = 'Estados Unidos reconoce al gobierno de Obregón'; A.anim(nota, [{opacity: 0}, {opacity: 1}], {duration: 600});
        A.guia('Agosto de 1923: llega el reconocimiento'); A.tiempo(() => A.listo(), 700); }
    };
    let x0 = 0, p0 = 0;
    A.arrastre(perilla, {eje: 'x', inicio: p => { x0 = p.x; p0 = pos; }, mover: p => { pos = clamp(p0 + (p.x - x0) / (X1 - X0), 0, 1); prueba(); }, fin: () => { if (!lista) A.S.estatica(0); }});
    A.boton('Sintonizar', () => { if (lista) return; const a = pos, t0 = performance.now(); const f = tt => { const q = Math.min(1, (tt - t0) / 1700); pos = a + (meta - a) * (1 - Math.pow(1 - q, 3)); if (q < 1){ pinta(); A.S.estatica(clamp(.25 + cerca() * 2.2, 0, 1)); A.raf(f); } else { pos = meta; prueba(); } }; if (A.anima()) A.raf(f); else { pos = meta; prueba(); } });
    pinta();
    A.alFinal(() => { lista = true; pos = meta; pinta(); aguja.setAttribute('stroke', VERDE); nota.textContent = 'Estados Unidos reconoce al gobierno de Obregón'; A.guia('Agosto de 1923: llega el reconocimiento'); });
    A.limpiar(() => A.S.estatica(0));
  },

  /* O5 y M4 · recorrer la gráfica hasta encontrar el punto más alto (o la peor caída) */
  buscar(A, c){
    const v = A.lienzo('0 0 320 150'), anios = []; for (let a = c.desde; a <= c.hasta; a++) anios.push(a);
    const vals = anios.map(a => A.serie[c.serie][a - 1916]), busca = c.busca === 'min' ? Math.min(...vals) : Math.max(...vals), meta = vals.indexOf(busca);
    const mn = Math.min(0, ...vals), mx = Math.max(...vals), X0 = 18, X1 = 302, Y0 = 118, Y1 = 22;
    const x = i => X0 + (X1 - X0) * (anios.length === 1 ? .5 : i / (anios.length - 1)), y = val => Y0 - (val - mn) / (mx - mn) * (Y0 - Y1);
    const color = c.serie === 'deuda_usd' ? AZUL : 'currentColor';
    if (c.forma === 'barras'){
      const ancho = (X1 - X0) / anios.length * .62;
      el('line', {x1: X0 - 6, x2: X1 + 6, y1: y(0), y2: y(0), stroke: 'currentColor', 'stroke-width': 1}, v);
      vals.forEach((val, i) => el('rect', {x: x(i) - ancho / 2, y: Math.min(y(val), y(0)), width: ancho, height: Math.abs(y(val) - y(0)) || 1, fill: color, opacity: val < 0 ? .9 : .45}, v));
    } else {
      el('path', {d: vals.map((val, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(val).toFixed(1)}`).join(''), fill: 'none', stroke: color, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}, v);
      vals.forEach((val, i) => el('circle', {cx: x(i), cy: y(val), r: 3, fill: color}, v));
    }
    [0, anios.length - 1].forEach(i => tx(String(anios[i]), {x: x(i), y: 140, 'text-anchor': 'middle', 'font-size': 9.5, opacity: .7}, v));
    const marca = el('g', {class: 'mov'}, v);
    el('line', {x1: 0, x2: 0, y1: 14, y2: 128, stroke: 'currentColor', 'stroke-dasharray': '3 3', opacity: .6}, marca);
    const punto = el('circle', {cx: 0, cy: 0, r: 7, fill: PAPEL, stroke: color, 'stroke-width': 2.4}, marca);
    const etiq = tx('', {x: 0, y: 12, 'text-anchor': 'middle', 'font-size': 10.5, class: 'tit'}, marca);
    let i = Math.floor(anios.length / 2) === meta ? 0 : Math.floor(anios.length / 2), ganado = false;
    const pinta = (quieto) => {
      marca.style.transform = `translateX(${x(i).toFixed(1)}px)`; punto.setAttribute('cy', y(vals[i]).toFixed(1));
      etiq.textContent = `${anios[i]}: ${fmt(vals[i], c.decimales || 0)}${c.suf || ''}`;
      etiq.setAttribute('x', clamp(0, X0 - x(i) + 20, X1 - x(i) - 20));
      if (!quieto) A.son('rueda');
    };
    const elige = () => {
      if (ganado) return;
      if (i === meta){ ganado = true; A.son(c.busca === 'min' ? 'cierre' : 'sello');
        const b = el('g', {class: 'mov'}, v), bx = x(meta), by = y(vals[meta]);
        if (c.busca === 'min'){ el('path', {d: `M${bx - 9} ${by - 2} l5 7 l-3 6 l6 5 l-2 7`, fill: 'none', stroke: PAPEL, 'stroke-width': 2}, b); }
        else { el('line', {x1: bx, x2: bx, y1: by - 6, y2: by - 30, stroke: 'currentColor', 'stroke-width': 1.6}, b); el('path', {d: `M${bx} ${by - 30} l16 5 l-16 5 z`, fill: SANGRE}, b); }
        A.anim(b, [{transform: 'scale(.3)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 360});
        A.guia(c.final); A.tiempo(() => A.listo(), 380);
      } else A.guia(c.busca === 'min' ? 'Ésa no es la peor: sigue buscando' : 'Todavía no es la más alta: sigue');
    };
    A.arrastre(v, {eje: 'x', inicio: p => mueve(p), mover: p => mueve(p), fin: () => elige()});
    const mueve = p => { if (ganado) return; let mejor = 0, d = 1e9; anios.forEach((a, k) => { const dd = Math.abs(p.x - x(k)); if (dd < d){ d = dd; mejor = k; } }); if (mejor !== i){ i = mejor; pinta(); } };
    A.boton(c.boton, () => { if (ganado) return; const paso = () => { if (i === meta){ elige(); return; } i += i < meta ? 1 : -1; pinta(); A.tiempo(paso, 170); }; paso(); });
    pinta(true);
    A.alFinal(() => { i = meta; pinta(true); ganado = true; A.guia(c.final); });
  },

  /* K1 · girar la perilla de la bóveda del Banco de México */
  boveda(A, c){
    const v = A.lienzo('0 0 320 150');
    const fondo = el('g', {}, v);
    el('rect', {x: 84, y: 8, width: 152, height: 134, rx: 8, fill: '#2a2018'}, fondo);
    [0, 1, 2, 3].forEach(k => A.simbolo('monedas', 96 + k * 34, 70, 30, 60, fondo, {color: LATON}));
    tx('100', {x: 160, y: 46, 'text-anchor': 'middle', 'font-size': 24, fill: LATON, class: 'tit'}, fondo);
    tx('millones de pesos · 51 % del gobierno', {x: 160, y: 60, 'text-anchor': 'middle', 'font-size': 7.6, fill: '#e8d6ae'}, fondo);
    const puerta = el('g', {class: 'mov'}, v);
    el('rect', {x: 84, y: 8, width: 152, height: 134, rx: 8, fill: '#9aa0a2', stroke: '#3c4246', 'stroke-width': 2}, puerta);
    el('circle', {cx: 160, cy: 75, r: 48, fill: '#b8bec0', stroke: '#3c4246', 'stroke-width': 2}, puerta);
    tx('Banco de México', {x: 160, y: 22, 'text-anchor': 'middle', 'font-size': 9, fill: '#2b3033', class: 'tit'}, puerta);
    const rueda = el('g', {class: 'mov', style: 'transform-box:view-box;transform-origin:160px 75px'}, puerta);
    for (let k = 0; k < 6; k++){ const a = k * Math.PI / 3; el('line', {x1: 160, y1: 75, x2: 160 + Math.cos(a) * 40, y2: 75 + Math.sin(a) * 40, stroke: '#3c4246', 'stroke-width': 5, 'stroke-linecap': 'round'}, rueda); }
    el('circle', {cx: 160, cy: 75, r: 11, fill: '#3c4246'}, rueda);
    el('circle', {cx: 160, cy: 75, r: 52, fill: 'transparent'}, rueda);
    const giro = tx('', {x: 160, y: 146, 'text-anchor': 'middle', 'font-size': 8.5}, v);
    let ang = 0, total = 0, a0 = 0, previo = 0, abierta = false;
    const pinta = () => { rueda.style.transform = `rotate(${ang.toFixed(1)}deg)`; };
    const abre = (quieto) => {
      if (abierta) return; abierta = true;
      if (!quieto){ A.S.cercana('caja', .45); A.son('moneda'); }
      A.anim(puerta, [{transform: 'none'}, {transform: 'translateX(-170px)', opacity: .0}], {duration: quieto ? 1 : 900, easing: 'cubic-bezier(.6,0,.3,1)'});
      giro.textContent = '';
      if (!quieto){ A.guia('Un solo banco emite el dinero'); A.tiempo(() => A.listo(), 900); }
    };
    A.arrastre(rueda, {
      inicio: p => { a0 = Math.atan2(p.y - 75, p.x - 160) * 180 / Math.PI; previo = ang; },
      mover: p => { if (abierta) return; const a = Math.atan2(p.y - 75, p.x - 160) * 180 / Math.PI; let d = a - a0; if (d > 180) d -= 360; if (d < -180) d += 360; a0 = a; ang += d; total += Math.abs(d); pinta();
        if (Math.floor(ang / 30) !== Math.floor(previo / 30)) A.son('tic'); previo = ang; giro.textContent = total < 540 ? 'Gira la perilla' : '';
        if (total >= 540) abre(); },
    });
    giro.textContent = 'Gira la perilla';
    A.boton('Abrir la bóveda', () => { if (abierta) return; const a = ang, t0 = performance.now(); const f = t => { const q = Math.min(1, (t - t0) / 1300); const nuevo = a + 540 * (1 - Math.pow(1 - q, 2)); if (Math.floor(nuevo / 30) !== Math.floor(ang / 30)) A.son('tic'); ang = nuevo; pinta(); if (q < 1) A.raf(f); else abre(); }; if (A.anima()) A.raf(f); else abre(); });
    A.alFinal(() => { abre(true); A.guia('Un solo banco emite el dinero'); });
  },

  /* K2 · cortar con tijeras la deuda de los ferrocarriles */
  tijeras(A, c){
    const v = A.lienzo('0 0 320 150'), X0 = 20, W = 280, k = W / 773, corte = X0 + 422 * k;
    tx('Deuda externa, 1924', {x: X0, y: 30, 'font-size': 10}, v);
    const gob = el('rect', {x: X0, y: 40, width: 422 * k, height: 40, fill: AZUL}, v);
    const fer = el('g', {class: 'mov'}, v);
    el('rect', {x: corte, y: 40, width: (773 - 422) * k, height: 40, fill: AZUL, opacity: .55}, fer);
    tx('Ferrocarriles Nacionales', {x: corte + (773 - 422) * k / 2, y: 64, 'text-anchor': 'middle', 'font-size': 8.5, fill: PAPEL}, fer);
    tx('Gobierno', {x: X0 + 422 * k / 2, y: 64, 'text-anchor': 'middle', 'font-size': 9.5, fill: PAPEL}, v);
    const linea = el('line', {x1: corte, x2: corte, y1: 34, y2: 88, stroke: SANGRE, 'stroke-width': 1.4, 'stroke-dasharray': '4 3'}, v);
    const cifra = tx('773', {x: X0 + W, y: 106, 'text-anchor': 'end', 'font-size': 16, class: 'tit'}, v);
    const tij = el('g', {class: 'mov', style: 'cursor:grab'}, v);
    el('circle', {cx: corte - 7, cy: 16, r: 5, fill: 'none', stroke: 'currentColor', 'stroke-width': 2}, tij);
    el('circle', {cx: corte + 7, cy: 16, r: 5, fill: 'none', stroke: 'currentColor', 'stroke-width': 2}, tij);
    el('path', {d: `M${corte - 4} 20 L${corte + 3} 34 M${corte + 4} 20 L${corte - 3} 34`, stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round'}, tij);
    el('rect', {x: corte - 24, y: 2, width: 48, height: 40, fill: 'transparent'}, tij);
    let bajada = 0, cortado = false;
    const corta = (quieto) => {
      if (cortado) return; cortado = true;
      if (!quieto){ A.son('tijera'); A.tiempo(() => A.son('papel'), 120); }
      linea.setAttribute('opacity', 0);
      A.anim(fer, [{transform: 'none', opacity: 1}, {transform: 'translate(40px,40px) rotate(8deg)', opacity: .15}], {duration: quieto ? 1 : 800, easing: 'cubic-bezier(.5,0,.3,1)'});
      tij.setAttribute('opacity', 0);
      A.contar(cifra, 773, 422, quieto ? 0 : 800).then(() => { cifra.textContent = '422 en 1925'; if (!quieto){ A.guia('Una reducción contable: no se pagó un peso'); A.listo(); } });
    };
    let y0 = 0;
    A.arrastre(tij, {inicio: p => { y0 = p.y; }, mover: p => { if (cortado) return; bajada = clamp(p.y - y0, 0, 60); tij.style.transform = `translateY(${bajada}px)`; if (bajada > 50) corta(); }, fin: () => { if (!cortado){ bajada = 0; tij.style.transform = ''; } }});
    A.boton('Cortar la deuda', () => { if (cortado) return; A.anim(tij, [{transform: 'none'}, {transform: 'translateY(56px)'}], {duration: 500}).then(() => corta()); });
    A.alFinal(() => { corta(true); A.guia('Una reducción contable: no se pagó un peso'); });
  },

  /* K3 · manejar de México a Pachuca por la carretera nueva */
  carretera(A, c){
    const v = A.lienzo('0 0 320 150');
    const ruta = el('path', {d: 'M34 128 C 90 120, 96 78, 150 82 S 230 96, 248 58 S 270 30, 290 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .18}, v);
    el('path', {d: ruta.getAttribute('d'), fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4, 'stroke-dasharray': '6 5'}, v);
    [[34, 128, 'México', 'start', 44, 146], [290, 24, 'Pachuca', 'end', 280, 14]].forEach(([x, y, n, an, lx, ly]) => { el('circle', {cx: x, cy: y, r: 6, fill: 'currentColor'}, v); tx(n, {x: lx, y: ly, 'text-anchor': an, 'font-size': 11, class: 'tit'}, v); });
    const L = ruta.getTotalLength(), muestras = []; for (let i = 0; i <= 80; i++){ const p = ruta.getPointAtLength(L * i / 80); muestras.push([p.x, p.y]); }
    const carro = el('g', {class: 'mov'}, v);
    el('rect', {x: -12, y: -9, width: 24, height: 10, rx: 3, fill: SANGRE}, carro); el('rect', {x: -6, y: -15, width: 12, height: 7, rx: 2, fill: SANGRE}, carro);
    el('circle', {cx: -7, cy: 2, r: 3.4, fill: 'currentColor'}, carro); el('circle', {cx: 7, cy: 2, r: 3.4, fill: 'currentColor'}, carro);
    el('rect', {x: -24, y: -26, width: 48, height: 44, fill: 'transparent'}, carro);
    const sello = el('g', {opacity: 0, class: 'mov'}, v); el('circle', {cx: 236, cy: 104, r: 22, fill: 'none', stroke: SANGRE, 'stroke-width': 2.2}, sello); tx('1926', {x: 236, y: 109, 'text-anchor': 'middle', 'font-size': 13, fill: SANGRE, class: 'tit'}, sello);
    let q = 0, arranco = false;
    const pinta = () => { const i = Math.round(q * 80), [x, y] = muestras[i], [x2, y2] = muestras[Math.min(80, i + 1)], a = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI; carro.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(i < 80 ? a : 0).toFixed(1)}deg)`; };
    const llega = (quieto) => { q = 1; pinta(); sello.setAttribute('opacity', 1); if (!quieto){ A.son('sello'); A.anim(sello, [{transform: 'scale(1.6)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 340}); A.guia('Hidalgo, conectado con la capital'); A.tiempo(() => A.listo(), 400); } };
    A.arrastre(carro, {inicio: () => { if (!arranco){ arranco = true; A.son('motor'); } }, mover: p => { if (A.hecho) return; let mejor = 0, d = 1e9; muestras.forEach(([x, y], i) => { const dd = Math.hypot(p.x - x, p.y - y); if (dd < d){ d = dd; mejor = i; } }); if (mejor / 80 > q) q = mejor / 80; pinta(); if (q >= .99) llega(); }});
    A.boton('Manejar a Pachuca', () => { if (A.hecho) return; A.son('motor'); const a = q, t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 2000); q = a + (1 - a) * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2); pinta(); if (k < 1) A.raf(f); else llega(); }; if (A.anima()) A.raf(f); else llega(); });
    pinta();
    A.alFinal(() => { llega(true); A.guia('Hidalgo, conectado con la capital'); });
  },

  /* K4 · el petróleo y la plata caen al mismo tiempo */
  caida(A, c){
    const v = A.lienzo('0 0 320 150'), k = 74 / 292;
    const grupos = [['Petróleo', 292, 133, 70, PETROLEO], ['Oro y plata', 136, 87, 200, LATON]].map(([n, a, b, x, col]) => {
      tx(n, {x: x + 30, y: 146, 'text-anchor': 'middle', 'font-size': 10}, v);
      const r = el('rect', {x, y: 128 - a * k, width: 60, height: a * k, fill: col, class: 'mov', style: 'transform-origin:50% 100%'}, v);
      const t = tx(String(a), {x: x + 30, y: 122 - a * k, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, v);
      return {r, t, a, b};
    });
    el('line', {x1: 40, x2: 290, y1: 128, y2: 128, stroke: 'currentColor', 'stroke-width': 1.2}, v);
    const anio = tx('1925', {x: 160, y: 14, 'text-anchor': 'middle', 'font-size': 14, class: 'tit'}, v);
    tx('millones de pesos de exportación', {x: 160, y: 26, 'text-anchor': 'middle', 'font-size': 8.5, opacity: .75}, v);
    const cae = (quieto) => {
      if (A.hecho) return;
      anio.textContent = '1927'; if (!quieto) A.son('cierre');
      grupos.forEach(g => { A.anim(g.r, [{transform: 'none'}, {transform: `scaleY(${(g.b / g.a).toFixed(4)})`}], {duration: quieto ? 1 : 900, easing: 'cubic-bezier(.6,0,.4,1)'});
        A.anim(g.t, [{transform: 'none'}, {transform: `translateY(${((g.a - g.b) * k).toFixed(1)}px)`}], {duration: quieto ? 1 : 900, easing: 'cubic-bezier(.6,0,.4,1)'}); A.contar(g.t, g.a, g.b, quieto ? 0 : 900); });
      if (!quieto){ A.guia('Los dos grandes productos se caen juntos'); A.tiempo(() => A.listo(), 950); }
    };
    A.boton('Pasar a 1927', () => cae());
    v.addEventListener('click', () => cae());
    A.alFinal(() => { cae(true); A.guia('Los dos grandes productos se caen juntos'); });
  },

  /* K5, M2, D6 · un año a la vez, con la tabla de indicadores */
  anios(A, c){
    const v = A.lienzo('0 0 320 150'), anios = []; for (let a = c.desde; a <= c.hasta; a++) anios.push(a);
    const solo = c.medidores.length === 1, lect = tx('', {x: solo ? 60 : 160, y: solo ? 64 : 14, 'text-anchor': 'middle', 'font-size': solo ? 20 : 11, class: 'tit'}, v);
    const piezas = c.medidores.map((m, j) => {
      const vals = anios.map(a => A.serie[m.serie][a - 1916]), mx = m.tope || Math.max(...vals) * 1.08, x = c.medidores.length === 1 ? 130 : 56 + j * 150, color = m.color === 'azul' ? AZUL : m.color === 'laton' ? LATON : 'currentColor';
      tx(m.nombre, {x: x + 30, y: 146, 'text-anchor': 'middle', 'font-size': 9.5}, v);
      el('rect', {x, y: 28, width: 60, height: 100, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1, opacity: .7}, v);
      const r = el('rect', {x, y: 28, width: 60, height: 100, fill: color, class: 'mov', style: 'transform-origin:50% 100%'}, v);
      const t = tx('', {x: x + 30, y: 22, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, v);
      return {vals, mx, r, t, m, previo: vals[0]};
    });
    el('line', {x1: 30, x2: 290, y1: 128, y2: 128, stroke: 'currentColor', 'stroke-width': 1.2}, v);
    const pon = (i, quieto) => {
      piezas.forEach(p => { const val = p.vals[i]; A.anim(p.r, [{transform: `scaleY(${(p.previo / p.mx).toFixed(4)})`}, {transform: `scaleY(${(val / p.mx).toFixed(4)})`}], {duration: quieto ? 1 : 520}); A.contar(p.t, p.previo, val, quieto ? 0 : 520, p.m.decimales || 0); p.previo = val; });
      lect.textContent = String(anios[i]);
      if (!quieto) A.son(c.sonido || 'rueda');
      if (i === anios.length - 1 && !A.hecho && !quieto){ A.guia(c.final); A.tiempo(() => A.listo(), 560); }
    };
    const r = A.rango({min: 0, max: anios.length - 1, valor: 0, etiqueta: 'Año', texto: i => String(anios[i]), alCambiar: i => pon(i)});
    piezas.forEach(p => { p.r.style.transform = `scaleY(${(p.vals[0] / p.mx).toFixed(4)})`; p.t.textContent = fmt(p.vals[0], p.m.decimales || 0); });
    lect.textContent = String(anios[0]);
    A.boton(c.boton, () => { const i = +r.value; if (i < anios.length - 1){ r.value = i + 1; r.dispatchEvent(new Event('input')); } });
    A.alFinal(() => { r.value = anios.length - 1; pon(anios.length - 1, true); A.guia(c.final); });
  },

  /* K6 · arrancar una economía que no arranca */
  aguja(A, c){
    const v = A.lienzo('0 0 320 150'), cx = 160, cy = 128, R = 96, a = val => Math.PI * (1 - (val + 5) / 15);
    el('path', {d: `M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy}`, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.6}, v);
    [-5, 0, 5, 10].forEach(val => { const an = a(val); el('line', {x1: cx + Math.cos(an) * (R - 4), y1: cy - Math.sin(an) * (R - 4), x2: cx + Math.cos(an) * (R - 16), y2: cy - Math.sin(an) * (R - 16), stroke: 'currentColor', 'stroke-width': 2}, v); tx(`${val > 0 ? '+' : ''}${val} %`, {x: cx + Math.cos(an) * (R - 28), y: cy - Math.sin(an) * (R - 28) + 4, 'text-anchor': 'middle', 'font-size': 9.5}, v); });
    tx('Crecimiento del PIB', {x: cx, y: cy + 18, 'text-anchor': 'middle', 'font-size': 9.5, opacity: .8}, v);
    const aguja = el('line', {x1: cx, y1: cy, x2: cx, y2: cy - R + 22, stroke: SANGRE, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'mov', style: `transform-box:view-box;transform-origin:${cx}px ${cy}px`}, v);
    el('circle', {cx, cy, r: 7, fill: 'currentColor'}, v);
    const ang = val => (90 - a(val) * 180 / Math.PI).toFixed(1);
    aguja.style.transform = `rotate(${ang(0)}deg)`;
    const arranca = (quieto) => {
      if (A.hecho) return;
      if (!quieto) A.son('ahogado');
      A.anim(aguja, [0, 3.2, .8, 2.4, -.4, 1.2, .2, .4].map(val => ({transform: `rotate(${ang(val)}deg)`})), {duration: quieto ? 1 : 1700, easing: 'ease-in-out'});
      if (!quieto){ A.guia('La economía, estancada'); A.tiempo(() => A.listo(), 1750); }
    };
    A.boton('Arrancar', () => arranca());
    v.addEventListener('click', () => arranca());
    A.alFinal(() => { aguja.style.transform = `rotate(${ang(.4)}deg)`; A.guia('La economía, estancada'); });
  },

  /* M1 · el teletipo escribe el cable de Nueva York */
  teletipo(A, c){
    const v = A.lienzo('0 0 320 150');
    el('path', {d: 'M18 108 Q 18 40 64 40 Q 110 40 110 108 Z', fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.6, opacity: .9}, v);
    el('rect', {x: 10, y: 104, width: 108, height: 16, rx: 3, fill: 'currentColor'}, v);
    el('rect', {x: 52, y: 84, width: 24, height: 20, rx: 2, fill: 'currentColor', opacity: .6}, v);
    const cinta = el('rect', {x: 70, y: 64, width: 250, height: 18, fill: '#fbf3df', stroke: 'currentColor', 'stroke-width': .8}, v);
    const idc = nuevoId('cinta'), clip = el('clipPath', {id: idc}, v); el('rect', {x: 112, y: 62, width: 208, height: 22}, clip);
    const g = el('g', {'clip-path': `url(#${idc})`}, v);
    const texto = tx('', {x: 116, y: 77, 'font-size': 11.5, class: 'tit', 'xml:space': 'preserve'}, g);
    const flecha = el('path', {d: 'M122 10 L160 16 L180 12 L210 32 L232 27 L306 56', fill: 'none', stroke: SANGRE, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-dasharray': '400', 'stroke-dashoffset': '400', opacity: .85}, v);
    const msg = 'OCT. 1929 · NUEVA YORK · SE DESPLOMA LA BOLSA ··· PIB DE MÉXICO 1929: –3.6 % ··· 1930: –6.6 %   ';
    let n = 0, corre = false;
    const pon = () => { texto.textContent = msg.slice(0, n); const w = texto.getComputedTextLength ? texto.getComputedTextLength() : n * 7; texto.setAttribute('x', Math.min(116, 310 - w).toFixed(1)); };
    const escribe = () => {
      if (corre || A.hecho) return; corre = true;
      A.anim(flecha, [{strokeDashoffset: 400}, {strokeDashoffset: 0}], {duration: 3200, easing: 'cubic-bezier(.5,0,.6,1)'});
      const f = () => { if (n >= msg.length){ A.guia('Dos años seguidos de caída'); A.listo(); return; } n++; pon(); if (n % 2) A.son('tecla'); A.tiempo(f, 38); };
      f();
    };
    A.boton('Recibir el cable', escribe);
    v.addEventListener('click', escribe);
    A.alFinal(() => { n = msg.length; pon(); flecha.setAttribute('stroke-dashoffset', 0); A.guia('Dos años seguidos de caída'); });
  },

  /* M3 · retirar dinero de la circulación: los precios bajan */
  deflacion(A, c){
    const v = A.lienzo('0 0 320 150'), monedas = [];
    tx('Dinero en circulación', {x: 92, y: 14, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    for (let i = 0; i < 6; i++){ const g = el('g', {class: 'mov'}, v); el('ellipse', {cx: 92, cy: 128 - i * 15, rx: 40, ry: 9, fill: LATON, stroke: 'currentColor', 'stroke-width': 1.2}, g); monedas.push(g); }
    tx('Precios', {x: 244, y: 14, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    el('rect', {x: 232, y: 20, width: 24, height: 104, rx: 12, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.3}, v);
    el('circle', {cx: 244, cy: 132, r: 13, fill: SANGRE}, v);
    const col = el('rect', {x: 238, y: 30, width: 12, height: 100, rx: 6, fill: SANGRE, class: 'mov', style: 'transform-origin:50% 100%;transform:scaleY(.82)'}, v);
    el('line', {x1: 226, x2: 262, y1: 47, y2: 47, stroke: 'currentColor', 'stroke-width': 1}, v); tx('0 %', {x: 268, y: 50, 'font-size': 9}, v);
    const lect = tx('', {x: 268, y: 92, 'font-size': 13, class: 'tit'}, v);
    let n = 0;
    const retira = (quieto) => {
      if (n >= 4 || A.hecho) return; const m = monedas[monedas.length - 1 - n]; n++;
      if (!quieto) A.son('moneda');
      A.anim(m, [{transform: 'none', opacity: 1}, {transform: 'translate(-80px,-10px)', opacity: 0}], {duration: quieto ? 1 : 520});
      A.anim(col, [{transform: `scaleY(${(.82 - (n - 1) * .08).toFixed(3)})`}, {transform: `scaleY(${(.82 - n * .08).toFixed(3)})`}], {duration: quieto ? 1 : 520});
      A.boton(n < 4 ? 'Retirar más dinero' : '', () => retira());
      if (n === 4){ lect.textContent = '–10.5 %'; if (!quieto){ A.guia('Falta crédito y los precios bajan: deflación'); A.tiempo(() => A.listo(), 560); } }
    };
    A.boton('Retirar dinero', () => retira());
    v.addEventListener('click', () => retira());
    A.alFinal(() => { while (n < 4) retira(true); A.guia('Falta crédito y los precios bajan: deflación'); });
  },

  /* M5 · la pelota cae al fondo de 1932 y rebota en 1933 */
  rebote(A, c){
    const v = A.lienzo('0 0 320 150'), anios = [1931, 1932, 1933, 1934], vals = anios.map(a => A.serie.pib_crec[a - 1916]);
    const x = i => 40 + i * 80, y = val => 74 - val * 3.6;
    el('line', {x1: 20, x2: 300, y1: y(0), y2: y(0), stroke: 'currentColor', 'stroke-width': .9, opacity: .5}, v);
    el('path', {d: vals.map((val, i) => `${i ? 'L' : 'M'}${x(i)} ${y(val)}`).join(''), fill: 'none', stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linejoin': 'round'}, v);
    anios.forEach((a, i) => { tx(String(a), {x: x(i), y: 148, 'text-anchor': 'middle', 'font-size': 9.5, opacity: .75}, v); el('circle', {cx: x(i), cy: y(vals[i]), r: 3, fill: 'currentColor'}, v); });
    const etq = tx('', {x: x(2), y: y(vals[2]) - 14, 'text-anchor': 'middle', 'font-size': 14, class: 'tit'}, v);
    const bola = el('g', {class: 'mov', style: 'cursor:grab'}, v);
    el('circle', {cx: 0, cy: 0, r: 9, fill: SANGRE}, bola); el('circle', {cx: -3, cy: -3, r: 2.6, fill: '#fff', opacity: .5}, bola); el('circle', {cx: 0, cy: 0, r: 24, fill: 'transparent'}, bola);
    const fondo = {x: x(1), y: y(vals[1]) - 9};
    let jalon = 0;
    const pon = (px, py) => { bola.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px)`; };
    pon(fondo.x, fondo.y);
    const suelta = (quieto) => {
      if (A.hecho) return;
      if (quieto){ pon(x(3), y(vals[3]) - 9); etq.textContent = '+11 %'; return; }
      A.son('boing');
      const p1 = {x: x(2), y: y(vals[2]) - 9}, p2 = {x: x(3), y: y(vals[3]) - 9}, cima = Math.min(p1.y, fondo.y) - 26 - jalon * .5;
      A.anim(bola, [{transform: `translate(${fondo.x}px,${fondo.y + jalon}px)`}, {transform: `translate(${(fondo.x + p1.x) / 2}px,${cima}px)`, offset: .45}, {transform: `translate(${p1.x}px,${p1.y}px)`, offset: .7}, {transform: `translate(${(p1.x + p2.x) / 2}px,${p1.y - 10}px)`, offset: .85}, {transform: `translate(${p2.x}px,${p2.y}px)`}], {duration: 1300, easing: 'linear'});
      A.tiempo(() => { etq.textContent = '+11 %'; A.son('tic'); }, 900);
      A.tiempo(() => { A.guia('El giro que saca a la economía del fondo'); A.listo(); }, 1350);
    };
    let y0 = 0;
    A.arrastre(bola, {inicio: p => { y0 = p.y; }, mover: p => { if (A.hecho) return; jalon = clamp(p.y - y0, 0, 30); pon(fondo.x, fondo.y + jalon); }, fin: () => { if (!A.hecho && jalon > 4) suelta(); else pon(fondo.x, fondo.y); }});
    A.boton('Soltar la pelota', () => { jalon = 20; suelta(); });
    A.alFinal(() => { suelta(true); A.guia('El giro que saca a la economía del fondo'); });
  },

  /* M6 · juntar con monedas el salario mínimo de un día */
  monedero(A, c){
    const v = A.lienzo('0 0 320 150'), META = 150;
    el('path', {d: 'M196 54 h104 l-10 84 h-84 z', fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.6}, v);
    el('path', {d: 'M196 54 q52 -26 104 0', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6}, v);
    tx('Un día de trabajo', {x: 248, y: 30, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    const dentro = el('g', {}, v);
    const suma = tx('$0.00', {x: 248, y: 80, 'text-anchor': 'middle', 'font-size': 17, class: 'tit'}, v);
    let total = 0;
    const tipos = [[100, '1 peso', 26], [50, '50 ¢', 21], [20, '20 ¢', 17], [10, '10 ¢', 14]];
    tipos.forEach(([val, n, r], i) => {
      const cx = 36 + (i % 2) * 74, cy = 44 + Math.floor(i / 2) * 62, g = el('g', {style: 'cursor:pointer', class: 'mov'}, v);
      el('circle', {cx, cy, r, fill: LATON, stroke: 'currentColor', 'stroke-width': 1.4}, g);
      el('circle', {cx, cy, r: r - 4, fill: 'none', stroke: 'currentColor', 'stroke-width': .7, opacity: .6}, g);
      tx(n, {x: cx, y: cy + 4, 'text-anchor': 'middle', 'font-size': r > 20 ? 10 : 8.5, class: 'tit'}, g);
      el('circle', {cx, cy, r: 26, fill: 'transparent'}, g);
      g.addEventListener('click', () => echa(val, cx, cy, r));
    });
    const echa = (val, cx, cy, r, quieto) => {
      if (A.hecho) return;
      if (total + val > META){ A.guia('Así se pasa del salario: prueba con otra moneda'); A.son('tic'); return; }
      total += val; suma.textContent = '$' + fmt(total / 100, 2);
      const m = el('circle', {cx: 222 + Math.random() * 52, cy: 126 - (total / META) * 20, r: r * .55, fill: LATON, stroke: 'currentColor', 'stroke-width': 1, class: 'mov'}, dentro);
      if (!quieto){ A.son('moneda'); A.anim(m, [{transform: `translate(${cx - +m.getAttribute('cx')}px,${cy - +m.getAttribute('cy')}px)`, opacity: .6}, {transform: 'none', opacity: 1}], {duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)'}); }
      if (total === META && !quieto){ A.guia('Un piso para el ingreso de cada día'); A.tiempo(() => A.listo(), 380); }
    };
    A.boton('Echar 1 peso y 50 centavos', () => { if (total === 0){ echa(100, 36, 44, 26); A.tiempo(() => echa(50, 110, 44, 21), 420); } else { const falta = META - total; const t = tipos.find(([val]) => val <= falta); if (t) echa(t[0], 70, 70, t[2]); } });
    A.alFinal(() => { echa(100, 0, 0, 26, true); echa(50, 0, 0, 21, true); A.guia('Un piso para el ingreso de cada día'); });
  },

  /* D1 · construir obra pública: el PIB sube hasta el máximo */
  obra(A, c){
    const v = A.lienzo('0 0 320 150'), muro = el('g', {}, v), FILAS = 7;
    el('line', {x1: 40, x2: 220, y1: 136, y2: 136, stroke: 'currentColor', 'stroke-width': 2}, v);
    tx('1935 · 7.6 %', {x: 232, y: 40, 'font-size': 10, opacity: 0, class: 'm35'}, v);
    tx('1936 · 8.2 %', {x: 232, y: 26, 'font-size': 11, opacity: 0, class: 'm36 tit'}, v);
    el('line', {x1: 40, x2: 228, y1: 36, y2: 36, stroke: 'currentColor', 'stroke-dasharray': '3 3', opacity: .35}, v);
    el('line', {x1: 40, x2: 228, y1: 22, y2: 22, stroke: 'currentColor', 'stroke-dasharray': '3 3', opacity: .35}, v);
    let n = 0;
    const pone = (quieto) => {
      if (n >= FILAS || A.hecho) return; n++;
      const y = 136 - n * 16, fila = el('g', {class: 'mov'}, muro);
      for (let i = 0; i < 4; i++) el('rect', {x: 56 + i * 38 + (n % 2 ? 0 : 18), y, width: 36, height: 14, rx: 1.5, fill: 'currentColor', opacity: .78}, fila);
      if (!quieto){ A.son('ladrillo'); A.anim(fila, [{transform: 'translateY(-30px)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 360, easing: 'cubic-bezier(.3,.7,.4,1.2)'}); }
      if (n === FILAS - 1) v.querySelector('.m35').setAttribute('opacity', .8);
      A.boton(n < FILAS ? 'Construir más' : '', () => pone());
      if (n === FILAS){ v.querySelector('.m36').setAttribute('opacity', 1); if (!quieto){ A.guia('El gasto crea empleo y demanda'); A.tiempo(() => A.listo(), 420); } }
    };
    A.boton('Construir', () => pone());
    v.addEventListener('click', () => pone());
    A.alFinal(() => { while (n < FILAS) pone(true); A.guia('El gasto crea empleo y demanda'); });
  },

  /* D2 · repartir la tierra: 18 parcelas, una por millón de hectáreas */
  parcelas(A, c){
    const v = A.lienzo('0 0 320 150'), celdas = [];
    const cuenta = tx('0', {x: 284, y: 66, 'text-anchor': 'middle', 'font-size': 24, class: 'tit'}, v);
    tx('millones', {x: 284, y: 80, 'text-anchor': 'middle', 'font-size': 9}, v); tx('de hectáreas', {x: 284, y: 91, 'text-anchor': 'middle', 'font-size': 9}, v);
    for (let i = 0; i < 18; i++){
      const x = 12 + (i % 6) * 40, y = 10 + Math.floor(i / 6) * 44, g = el('g', {}, v);
      const r = el('rect', {x, y, width: 38, height: 42, fill: '#d9c99a', stroke: 'currentColor', 'stroke-width': .8, opacity: .8}, g);
      const t = el('g', {opacity: 0, class: 'mov'}, g); A.simbolo('trigo', x + 9, y + 6, 20, 30, t, {color: '#3d5e1f'});
      celdas.push({r, t, x, y, dada: false});
    }
    let n = 0, tsn = 0;
    const da = (k, quieto) => {
      if (k.dada || A.hecho) return; k.dada = true; n++;
      k.r.setAttribute('fill', '#b9cf8a'); k.t.setAttribute('opacity', 1);
      if (!quieto){ A.anim(k.t, [{transform: 'scale(.3) translateY(10px)'}, {transform: 'none'}], {duration: 360}); const t = performance.now(); if (t - tsn > 90){ tsn = t; A.son('tic'); } }
      cuenta.textContent = String(n);
      if (n === 18 && !quieto){ A.guia('La Laguna, 1936: 128 mil hectáreas para 34,753 campesinos en 185 ejidos'); A.tiempo(() => A.listo(), 380); }
    };
    const toca = p => celdas.forEach(k => { if (p.x >= k.x && p.x <= k.x + 38 && p.y >= k.y && p.y <= k.y + 42) da(k); });
    A.arrastre(v, {inicio: toca, mover: toca});
    A.boton('Repartir la tierra', () => { celdas.filter(k => !k.dada).forEach((k, i) => A.tiempo(() => da(k), i * 70)); });
    A.alFinal(() => { celdas.forEach(k => da(k, true)); A.guia('La Laguna, 1936: 128 mil hectáreas para 34,753 campesinos en 185 ejidos'); });
  },

  /* D3 · llevar el tren a la estación de la Nación */
  estacion(A, c){
    const v = A.lienzo('0 0 320 150');
    el('line', {x1: 0, x2: 320, y1: 118, y2: 118, stroke: 'currentColor', 'stroke-width': 2}, v);
    for (let x = 4; x < 320; x += 14) el('line', {x1: x, x2: x + 6, y1: 122, y2: 122, stroke: 'currentColor', 'stroke-width': 3, opacity: .5}, v);
    const est = el('g', {}, v);
    el('rect', {x: 236, y: 54, width: 78, height: 60, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.4}, est);
    el('path', {d: 'M228 56 L275 30 L322 56 Z', fill: 'currentColor'}, est);
    tx('Nación', {x: 275, y: 76, 'text-anchor': 'middle', 'font-size': 11, class: 'tit'}, est);
    tx('23 de junio de 1937', {x: 275, y: 90, 'text-anchor': 'middle', 'font-size': 7.5}, est);
    const tren = el('g', {class: 'mov', style: 'cursor:grab'}, v);
    A.simbolo('locomotora', 0, 68, 64, 52, tren);
    el('rect', {x: -40, y: 58, width: 110, height: 66, fill: 'transparent'}, tren);
    const letrero = tx('Ferrocarriles Nacionales', {x: 0, y: 60, 'font-size': 8, opacity: .8}, tren);
    const META = 168; let x = 8, tchug = 0, x0 = 0, d0 = 0;
    const pinta = () => { tren.style.transform = `translateX(${x.toFixed(1)}px)`; };
    const llega = (quieto) => {
      x = META; pinta(); letrero.setAttribute('opacity', 0);
      if (!quieto){ A.S.cercana('silbato', .3); A.guia('El Estado asume sus deudas'); A.tiempo(() => A.listo(), 700); }
    };
    A.arrastre(tren, {eje: 'x', inicio: p => { x0 = p.x; d0 = x; }, mover: p => { if (A.hecho) return; x = clamp(d0 + p.x - x0, 8, META); pinta(); const t = performance.now(); if (t - tchug > 330){ tchug = t; A.son('tren'); } if (x >= META) llega(); }});
    A.boton('Llevar el tren a la estación', () => { if (A.hecho) return; A.son('tren'); A.anim(tren, [{transform: `translateX(${x}px)`}, {transform: `translateX(${META}px)`}], {duration: 1600, easing: 'cubic-bezier(.4,0,.3,1)'}).then(() => llega()); });
    pinta();
    A.alFinal(() => { llega(true); A.guia('El Estado asume sus deudas'); });
  },

  /* D4 · inflar el globo de los precios con más dinero */
  globo(A, c){
    const v = A.lienzo('0 0 320 150');
    el('path', {d: 'M150 132 q-6 -18 0 -36', fill: 'none', stroke: 'currentColor', 'stroke-width': 1}, v);
    const globo = el('g', {class: 'mov', style: 'transform-box:view-box;transform-origin:150px 100px'}, v);
    el('ellipse', {cx: 150, cy: 66, rx: 30, ry: 34, fill: SANGRE}, globo);
    el('path', {d: 'M146 99 l4 6 l4 -6 z', fill: SANGRE}, globo);
    tx('Precios', {x: 150, y: 70, 'text-anchor': 'middle', 'font-size': 10, fill: '#f6e6d9', class: 'tit'}, globo);
    el('ellipse', {cx: 140, cy: 52, rx: 6, ry: 10, fill: '#fff', opacity: .25}, globo);
    tx('Producción', {x: 266, y: 14, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    el('rect', {x: 252, y: 96, width: 28, height: 36, fill: 'currentColor', opacity: .55}, v);
    el('line', {x1: 236, x2: 296, y1: 132, y2: 132, stroke: 'currentColor', 'stroke-width': 1.2}, v);
    tx('Dinero', {x: 40, y: 14, 'text-anchor': 'middle', 'font-size': 9.5}, v);
    const fajos = el('g', {}, v);
    const lect = tx('', {x: 150, y: 146, 'text-anchor': 'middle', 'font-size': 13, class: 'tit'}, v);
    let n = 0;
    const bombea = (quieto) => {
      if (n >= 5 || A.hecho) return; n++;
      if (!quieto) A.son('bomba');
      el('rect', {x: 22, y: 128 - n * 14, width: 36, height: 11, rx: 1.5, fill: VERDE, opacity: .85}, fajos);
      A.anim(globo, [{transform: `scale(${(1 + (n - 1) * .09).toFixed(3)})`}, {transform: `scale(${(1 + n * .09).toFixed(3)})`}], {duration: quieto ? 1 : 420, easing: 'cubic-bezier(.3,.7,.4,1.25)'});
      A.boton(n < 5 ? 'Más dinero' : '', () => bombea());
      if (n === 5){ lect.textContent = '18.75 %'; if (!quieto){ A.guia('Creció el dinero más rápido que la producción'); A.tiempo(() => A.listo(), 440); } }
    };
    A.boton('Más dinero', () => bombea());
    v.addEventListener('click', () => bombea());
    A.alFinal(() => { while (n < 5) bombea(true); A.guia('Creció el dinero más rápido que la producción'); });
  },

  /* D5 · sellar el decreto del 18 de marzo de 1938 */
  decreto(A, c){
    const v = A.lienzo('0 0 320 150');
    el('rect', {x: 18, y: 14, width: 180, height: 126, rx: 3, fill: PAPEL, stroke: 'currentColor', 'stroke-width': 1.2}, v);
    tx('Decreto de expropiación', {x: 108, y: 32, 'text-anchor': 'middle', 'font-size': 11, class: 'tit'}, v);
    tx('18 de marzo de 1938', {x: 108, y: 46, 'text-anchor': 'middle', 'font-size': 9}, v);
    for (let i = 0; i < 4; i++) el('line', {x1: 34, x2: 182 - i * 18, y1: 60 + i * 9, y2: 60 + i * 9, stroke: 'currentColor', opacity: .22}, v);
    const tinta = el('g', {opacity: 0, class: 'mov'}, v);
    el('rect', {x: 46, y: 96, width: 124, height: 30, rx: 3, fill: 'none', stroke: SANGRE, 'stroke-width': 2.6}, tinta);
    tx('EXPROPIACIÓN', {x: 108, y: 117, 'text-anchor': 'middle', 'font-size': 14, fill: SANGRE, class: 'tit', 'letter-spacing': 1}, tinta);
    const sello = el('g', {class: 'mov', style: 'cursor:pointer'}, v);
    el('rect', {x: 216, y: 20, width: 70, height: 26, rx: 4, fill: 'currentColor'}, sello);
    el('rect', {x: 242, y: 46, width: 18, height: 34, fill: 'currentColor', opacity: .8}, sello);
    el('rect', {x: 226, y: 80, width: 50, height: 14, rx: 2, fill: SANGRE}, sello);
    const anillo = el('circle', {cx: 251, cy: 33, r: 20, fill: 'none', stroke: PAPEL, 'stroke-width': 3, 'stroke-dasharray': '126', 'stroke-dashoffset': '126', transform: 'rotate(-90 251 33)'}, sello);
    el('rect', {x: 206, y: 10, width: 92, height: 92, fill: 'transparent'}, sello);
    const pemex = el('g', {opacity: 0}, v);
    A.simbolo('torre', 224, 70, 50, 70, pemex);
    tx('Petróleos Mexicanos · junio de 1938', {x: 250, y: 148, 'text-anchor': 'middle', 'font-size': 7.5}, pemex);
    let p = 0, golpeado = false;
    const golpea = (quieto) => {
      if (golpeado) return; golpeado = true;
      if (!quieto) A.son('sello');
      A.anim(sello, [{transform: 'none'}, {transform: 'translate(-143px,38px)', offset: .5}, {transform: 'translate(0,-140px)', opacity: 0}], {duration: quieto ? 1 : 900, easing: 'cubic-bezier(.5,0,.3,1)'});
      A.anim(tinta, [{opacity: 0}, {opacity: 0, offset: .45}, {opacity: 1}], {duration: quieto ? 1 : 900});
      A.tiempo(() => { pemex.setAttribute('opacity', 1); A.anim(pemex, [{transform: 'translateY(16px)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 500}); }, quieto ? 0 : 800);
      if (!quieto){ A.guia('A corto plazo, el costo es alto'); A.tiempo(() => A.listo(), 1250); }
    };
    A.mantener(sello, dt => { if (golpeado) return false; p = Math.min(1, p + dt / .8); anillo.setAttribute('stroke-dashoffset', (126 * (1 - p)).toFixed(1)); if (p >= 1){ golpea(); return false; } }, () => { if (!golpeado){ p = 0; anillo.setAttribute('stroke-dashoffset', 126); } });
    A.boton('Sellar el decreto', () => golpea());
    A.alFinal(() => { golpea(true); A.guia('A corto plazo, el costo es alto'); });
  },
};

/* ---------------------------------------------------------------------
   Qué pieza lleva cada hoja (y las palabras de su guía)
   --------------------------------------------------------------------- */
const PIEZAS = {
  C1: {tipo: 'imprenta', guia: 'Imprime billetes sin respaldo y mira el dólar', boton: 'Imprimir billetes'},
  C2: {tipo: 'sellos', guia: 'Sella los tres artículos económicos'},
  C3: {tipo: 'tercio', guia: 'Mantén presionado para bombear petróleo'},
  C4: {tipo: 'tren', guia: 'Jala el tren: cada carro que cruza se pierde', triste: true},
  C5: {tipo: 'mejor', guia: 'Levanta las tarjetas: ¿qué año creció más?'},
  O1: {tipo: 'censo', guia: 'Pasa el dedo sobre la gente para contarla'},
  O2: {tipo: 'vaciar', guia: 'Mueve el año de 1921 a 1930', triste: true},
  O3: {tipo: 'firma', guia: 'Firma el convenio con el dedo'},
  O4: {tipo: 'radio', guia: 'Gira la perilla hasta oír la noticia'},
  O5: {tipo: 'buscar', guia: 'Recorre la gráfica hasta la cima', serie: 'deuda_usd', desde: 1920, hasta: 1925, busca: 'max', boton: 'Subir a la cima', final: 'La cima de toda la gráfica'},
  K1: {tipo: 'boveda', guia: 'Gira la perilla de la bóveda'},
  K2: {tipo: 'tijeras', guia: 'Baja las tijeras por la raya'},
  K3: {tipo: 'carretera', guia: 'Lleva el carro de México a Pachuca'},
  K4: {tipo: 'caida', guia: 'Pasa de 1925 a 1927', triste: true},
  K5: {tipo: 'anios', guia: 'Mueve los años: sin pagos, la deuda crece', desde: 1926, hasta: 1928, boton: 'Siguiente año', final: 'Sin pagos, la deuda sube', triste: true,
       medidores: [{serie: 'deuda_usd', nombre: 'Deuda externa (mdd)', color: 'azul', tope: 520}]},
  K6: {tipo: 'aguja', guia: 'Intenta arrancar la economía', triste: true},
  M1: {tipo: 'teletipo', guia: 'Recibe el cable de Nueva York', triste: true},
  M2: {tipo: 'anios', guia: 'Mueve los años: el peso vale cada vez menos', desde: 1930, hasta: 1932, boton: 'Siguiente año', final: 'La deuda baja en dólares sin pagarse',
       medidores: [{serie: 'paridad', nombre: 'Pesos por dólar', color: 'laton', decimales: 2, tope: 3.5}, {serie: 'deuda_usd', nombre: 'Deuda (mdd)', color: 'azul', tope: 520}]},
  M3: {tipo: 'deflacion', guia: 'Retira dinero de la circulación', triste: true},
  M4: {tipo: 'buscar', guia: 'Recorre los años y encuentra la peor caída', serie: 'pib_crec', desde: 1916, hasta: 1940, busca: 'min', forma: 'barras', decimales: 1, suf: ' %', boton: 'Buscar el fondo', final: 'La peor caída de 1916 a 1940', triste: true},
  M5: {tipo: 'rebote', guia: 'Jala la pelota hacia abajo y suéltala'},
  M6: {tipo: 'monedero', guia: 'Junta con monedas el salario de un día'},
  D1: {tipo: 'obra', guia: 'Construye obra pública'},
  D2: {tipo: 'parcelas', guia: 'Pasa el dedo para repartir la tierra'},
  D3: {tipo: 'estacion', guia: 'Lleva el tren a la estación'},
  D4: {tipo: 'globo', guia: 'Echa más dinero a la economía'},
  D5: {tipo: 'decreto', guia: 'Mantén presionado el sello'},
  D6: {tipo: 'anios', guia: 'Mueve los años: el dólar cuesta más pesos', desde: 1937, hasta: 1940, boton: 'Siguiente año', final: 'Medida en dólares, la deuda se hace más chica', sonido: 'moneda',
       medidores: [{serie: 'paridad', nombre: 'Pesos por un dólar', color: 'laton', decimales: 2, tope: 6}]},
};

/* ---------------------------------------------------------------------
   Juguetes de la mampara: los dibujos de cada zona responden al tocarlos
   --------------------------------------------------------------------- */
const JUGUETES = {
  billete: (g, S) => { S.son('papel'); return [{transform: 'none'}, {transform: 'translate(10px,-26px) rotate(-14deg)', offset: .35}, {transform: 'translate(-6px,-12px) rotate(9deg)', offset: .65}, {transform: 'none'}]; },
  moneda: (g, S) => { S.son('moneda'); return [{transform: 'scaleX(1)'}, {transform: 'scaleX(-1)', offset: .25}, {transform: 'scaleX(1)', offset: .5}, {transform: 'scaleX(-1)', offset: .75}, {transform: 'scaleX(1)'}]; },
  recorte: (g, S) => { [0, 90, 170, 260].forEach(t => setTimeout(() => S.son('tecla'), t)); return [{transform: 'none'}, {transform: 'rotate(-7deg) translateY(-5px)', offset: .3}, {transform: 'rotate(5deg)', offset: .6}, {transform: 'none'}]; },
  trigo: (g, S) => { S.son('papel'); return [{transform: 'none'}, {transform: 'rotate(9deg)', offset: .25}, {transform: 'rotate(-6deg)', offset: .5}, {transform: 'rotate(3deg)', offset: .75}, {transform: 'none'}]; },
  locomotora: (g, S) => { S.son('tren'); S.cercana('silbato', .22); humo(g); return [{transform: 'none'}, {transform: 'translateX(26px)', offset: .5}, {transform: 'none'}]; },
  pergamino: (g, S) => { S.son('papel'); return [{transform: 'none'}, {transform: 'scaleY(.25)', offset: .4}, {transform: 'none'}]; },
  libro: (g, S) => { S.son('pasa'); return [{transform: 'none'}, {transform: 'rotate(-8deg) scale(1.08)', offset: .3}, {transform: 'rotate(6deg)', offset: .6}, {transform: 'none'}]; },
  antena: (g, S) => { S.son('radiocorta'); ondas(g); return [{transform: 'none'}, {transform: 'scale(1.06)', offset: .3}, {transform: 'none'}]; },
  banco: (g, S) => { S.cercana('caja', .35); caen(g, LATON); return [{transform: 'none'}, {transform: 'scale(1.06)', offset: .5}, {transform: 'none'}]; },
  flecha: (g, S) => { S.son('cierre'); return [{transform: 'none'}, {transform: 'translate(6px,14px)', offset: .3}, {transform: 'translate(-2px,-4px)', offset: .7}, {transform: 'none'}]; },
  monedas: (g, S) => { S.son('moneda'); setTimeout(() => S.son('moneda'), 140); return [{transform: 'none'}, {transform: 'rotate(-6deg) translateY(-6px)', offset: .3}, {transform: 'rotate(4deg)', offset: .6}, {transform: 'none'}]; },
  bellas_artes: (g, S) => { S.son('sintonia'); return [{transform: 'none', opacity: 1}, {transform: 'scale(1.1)', opacity: .7, offset: .4}, {transform: 'none', opacity: 1}]; },
  torre: (g, S) => { S.son('bomba'); caen(g, PETROLEO, -1); return [{transform: 'none'}, {transform: 'scaleY(.94)', offset: .3}, {transform: 'none'}]; },
  gota: (g, S) => { S.son('gota'); return [{transform: 'none'}, {transform: 'translateY(8px) scaleY(1.15)', offset: .4}, {transform: 'translateY(-3px) scaleY(.92)', offset: .7}, {transform: 'none'}]; },
};
// partículas de los juguetes: humo, ondas de radio, monedas o gotas
function particulas(g, crear){ const svg = g.ownerSVGElement || g; const b = g.getBBox ? g.getBBox() : {x: 0, y: 0, width: 40, height: 40}; return crear(svg === g ? g : g, b); }
function humo(g){ particulas(g, (p, b) => { for (let i = 0; i < 4; i++){ const c = el('circle', {cx: b.x + b.width * .22, cy: b.y + b.height * .1, r: 3 + i, fill: '#9c9488', opacity: .7}, p); c.animate([{transform: 'none', opacity: .7}, {transform: `translate(${-10 - i * 6}px,${-18 - i * 8}px) scale(2.2)`, opacity: 0}], {duration: 900, delay: i * 140, easing: 'ease-out', fill: 'forwards'}).finished.then(() => c.remove(), () => c.remove()); } }); }
function ondas(g){ particulas(g, (p, b) => { for (let i = 0; i < 3; i++){ const c = el('circle', {cx: b.x + b.width / 2, cy: b.y + b.height * .12, r: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, style: 'transform-box:fill-box;transform-origin:center'}, p); c.animate([{transform: 'scale(.4)', opacity: .9}, {transform: 'scale(3.4)', opacity: 0}], {duration: 1000, delay: i * 220, easing: 'ease-out', fill: 'forwards'}).finished.then(() => c.remove(), () => c.remove());} }); }
function caen(g, color, sube = 1){ particulas(g, (p, b) => { for (let i = 0; i < 4; i++){ const x = b.x + b.width * (.3 + Math.random() * .4), y0 = sube > 0 ? b.y - 14 : b.y + 4; const c = el('circle', {cx: x, cy: y0, r: 2.6, fill: color}, p); c.animate(sube > 0 ? [{transform: 'none', opacity: 1}, {transform: `translateY(${b.height * .5}px)`, opacity: 0}] : [{transform: 'none', opacity: 1}, {transform: `translate(${(Math.random() - .5) * 30}px,-22px)`, offset: .4, opacity: 1}, {transform: `translate(${(Math.random() - .5) * 44}px,${b.height * .6}px)`, opacity: 0}], {duration: 800, delay: i * 120, easing: 'ease-in', fill: 'forwards'}).finished.then(() => c.remove(), () => c.remove()); } }); }
const enCurso = new WeakSet();
function juguete(nodo, S){
  const n = nodo.dataset.juguete, f = JUGUETES[n]; if (!f || enCurso.has(nodo)) return;
  enCurso.add(nodo);
  const kf = f(nodo, S);
  if (!S.anima()){ enCurso.delete(nodo); return; }
  nodo.animate(kf, {duration: n === 'locomotora' ? 1400 : 760, easing: 'ease-in-out'}).finished.then(() => enCurso.delete(nodo), () => enCurso.delete(nodo));
}

window.Piezas = {montar, desmontar, juguete, hecha: id => completas.has(id), JUGUETES: Object.keys(JUGUETES)};
})();
