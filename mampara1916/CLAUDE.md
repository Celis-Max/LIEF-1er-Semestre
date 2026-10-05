# Mampara «México 1916–1940» · notas para seguir trabajando

PWA estática, sin framework ni compilación. Texto de interfaz en español de México. Lee `LEEME.md` primero.

## Tres modos (`<html data-modo="lite|normal|inmersivo">`)

- La cabeza de `index.html` decide el modo **antes de pintar** (lo guardado en `localStorage` `mampara-modo`; la primera vez, `lite` en equipos de ≤2 GB o ≤2 núcleos, con ahorro de datos, 2G o 3G de menos de 1 Mbps; si no, `normal`) e imprime la portada en cuanto cargan sus letras (máx. 3.5 s), sin esperar a los scripts. Por eso las `@font-face` están en línea en la cabeza.
- `app.js` pide lo demás cuando hace falta: `piezas.js` (después de imprimir la portada o al abrir una hoja), `fondos.js` (normal e inmersivo) e `inmersivo.js` (sólo inmersivo). `ponerModo()` cambia de modo en vivo: en lite quita la escenografía, el polvo, el vaivén y la música.
- **Lite**: lo mismo que normal sin nada corriendo de fondo, sin texturas de papel ni música, transiciones más cortas.
- **Normal**: la mampara de siempre. No cambiarle el aspecto: el equipo lo pidió «como está».
- **Inmersivo**: el 3D vive sólo aquí. CSS bajo `[data-modo="inmersivo"]` en `estilos.css`; el libro de la portada (tapa que gira sobre el lomo, cantos, guarda con las tintas de las etapas), la inclinación (ratón, giroscopio, vaivén) y la entrada a la página están en `inmersivo.js`. La profundidad al desplazarse (paisaje más lento, sala curva, fondo del visor) es CSS con `animation-timeline` (sin JS). Las hojas se despliegan sobre bisagras y se voltean como página (`cambiarHoja`). En celulares pide pantalla completa al elegir el modo o al abrir el libro.

## Mapa de `app.js`

| Bloque | Qué hace |
|---|---|
| `medir()` | **Única fuente de medidas**: con el alto y ancho de `.sala` calcula `--yw` (ancho de un año), cabecera, banda de hojas, banda de gráfica, eje y tamaño/posición de las hojas (`POS`) |
| `armarFijos()` | Cabeceras, eje, hojas colgadas (cada una dentro de `.colgante`), minimapa y su copia ampliada para la lupa |
| `dibujar()` | Gráfica SVG en pixeles de la franja; se redibuja sólo si cambió el tamaño (`componer()` lo revisa). Los hilos tienen `id="hilo-…"` porque se mueven con las hojas. La escenografía de cada etapa va aparte, en `#escenarios` (`.escena` con su `.esc-paisaje` y sus `.esc-vivos`), con `Fondos.zona()` |
| `prepararNavegacion()` | Rueda (con destino suave), arrastre con impulso, teclado, minimapa con lupa, ficha de año |
| `seguirEtapa()` | La etapa al centro tiñe la sala (`--tono`, `theme-color`) y, si uno se queda ahí, suena su señal |
| `abrirFicha()` | La ficha crece desde el botón del año; los números ruedan (`rodar()`) |
| `abrirHoja()` / `cerrarHoja()` / `cambiarHoja()` | Visor: vuelo FLIP en plano (`vueloHoja()`), la mampara retrocede (`.sala.atras`) detrás del velo y los paneles salen de debajo de la portada; entre hojas, fundido (una copia `.fantasma` se va mientras la nueva llega) |
| `modoVisor()` | `pila` (vertical) · `lado` (celular acostado) · `despliegue` (tableta acostada / escritorio) |
| `abrirLibro()` / `volverPortada()` | El libro se encoge y se guarda en su botón del minimapa (`#aPortada`) mientras llega la mampara; al volver, sale de ese botón (`haciaBoton()`) |
| `prepararTapa()` | La cabeza de `index.html` imprime la portada (clases `tapa-lista` / `ya-entro`, evento `tapaimpresa`); aquí sólo se espera ese evento para pedir lo demás en calma. El índice de etapas y la gráfica chica ya vienen en el HTML |
| bloque 12 (modos) | `ponerModo()`, `prepararModo()` (lo que pide cada modo), el selector de la portada y el menú del minimapa (`#modoBoton`), `pedirInmersion()` (giroscopio y pantalla completa, dentro del toque) y `completarSinConexion()` |
| `foto()` / `mejorarFoto()` | Mampara con miniaturas (`img/hojas/mini/`); el visor arranca con la miniatura y la cambia por la foto completa (`img/hojas/web/`) |
| bloque 7 (colgantes) | Péndulo amortiguado por hoja: la pared acelera y el papel se queda atrás. Sólo corre mientras algo se mueve |
| bloque 8 (ambiente) | Luz que sigue al ratón y polvo en un `<canvas>` (~30 cuadros/s; se queda quieto mientras la mampara se desplaza, al leer y en segundo plano) |
| bloque 9 (lupa) | Lupa de latón sobre la foto: con ratón al pasar; en celular, dejando el dedo o con el botón de la lupa |
| bloque 10 | `rodar()` (números de sumadora) y el botón de sonido |
| bloque 11 (`PWA`) | Historial (`#id`, botón atrás), instalación y service worker (se registra después de cargar) |

`piezas.js` (`window.Piezas`): **una pieza interactiva por hoja** en lugar del número quieto (imprimir bilimbiques, sellar la Constitución, sintonizar el radio, abrir la bóveda, cortar la deuda, el teletipo del crack, repartir la tierra…) y los **juguetes de cada zona** (los dibujos de las cabeceras y de la gráfica responden al tocarlos). `PIEZAS` dice qué pieza lleva cada hoja y su guía; `TIPOS` tiene cómo funciona cada una. Toda pieza tiene un botón que la hace sola (teclado y lectores de pantalla), su dato también está como texto oculto, y al terminar rueda el dato y la hoja chica recibe un sello de «vista» (se guarda en `localStorage`, `mampara-piezas`).

`fondos.js` (`window.Fondos`): **la escenografía animada de cada etapa**. En la mampara, un paisaje grabado al pie de cada gráfica (lomas y telégrafo; la ciudad con su antena; el banco y la carretera; los rascacielos y Bellas Artes; el campo, la estación y las torres de petróleo) y encima, con CSS, lo que se mueve: el tren, los billetes y las monedas que caen, las ondas del radio, la cinta del teletipo, el petróleo que gotea, el humo y el trigo. Detrás de la hoja abierta (`#visorEscena`) y en la portada (`#tapaEscena`), un `<canvas>` con el paisaje del tema de la hoja y su propia serie trazándose en grande; al cambiar de hoja una escena se funde con la otra. `ESCENAS` dice qué paisaje y qué cosas lleva cada hoja.

`sonido.js` (`window.Sonido`): gramófono con «La golondrina» (1922, dominio público), chisporroteo del disco, papel, clip, libro y una señal por etapa. La música se lee con `<audio>` (por partes) y el disco se pide sólo cuando va a sonar (`ponerDisco()`; en lite no se baja); caja, máquina de escribir y silbato son grabaciones en `sonidos/`; lo demás se sintetiza. `Sonido._render(nombre)` dibuja un efecto sin sonar (para pruebas) y `Sonido.estado` dice qué está pasando.

## Reglas de diseño (no cambiar)

- Tinta, papel y tipografía por etapa en `[data-k="0..4"]` de `estilos.css`. Texto corrido: Lora.
- Escalas de la gráfica iguales a la mampara impresa: PIB 0–760, deuda 0–860; ambas series parten de la base.
- La portada chica y la grande son el mismo componente (`.portada`, medido en `cqw`): por eso el vuelo es continuo.
- Nada de `100vh`: la app usa `height:100%` y el relleno de `env(safe-area-inset-*)` en `:root`.
- Zonas táctiles de 44 px o más; texto de lectura de 15.5 px o más en celular.
- No cambiar textos, cifras ni fechas de `datos.js` sin que lo pida el equipo: se revisaron contra la tabla de la asignatura.
- Lo de la sala (luz, polvo, vaivén, sonido, lupas, transiciones, fondos animados) es ambiente: no agrega información. Las escenas de las hojas sólo trazan la serie que la hoja ya muestra.
- Las piezas sólo usan lo que ya dicen la hoja (`paso`, `importa`, `grafica`, `dato`) y la tabla de indicadores; sus letreros citan esos textos. Las armas, la cruz y las manchas de sangre no son juguetes.
- 3D (`perspective`, `rotateX`/`rotateY`, `preserve-3d`) **sólo en el modo inmersivo**; lite y normal van en plano (así lo pidió el equipo).
- Sólo se animan posición, tamaño y opacidad. Nada de `filter` animado ni `backdrop-filter`: en celulares modestos se trababa.
- En 3D, la opacidad de `.tapa__libro` no baja de 1 (aplanaría el libro): para desvanecerlo se anima `.tapa`.

## Cuidado con

- `--tono` está registrado con `inherits:false` a propósito: heredado, su transición recalculaba toda la página en cada cuadro (el recorrido bajaba a 20 cuadros/s en celulares lentos). Quien lo use lo toma con `--tono:inherit`.
- `@view-transition{navigation:auto}` va **en línea** en el `<head>` de `index.html` (y en la portada del semestre): desde `estilos.css` Chrome a veces no lo ve a tiempo y cancela la transición.
- Nada suena antes de un toque (los navegadores no lo permiten): `Sonido.despertar()` se llama en cada toque. La preferencia se guarda en `localStorage` (`mampara-sonido`).
- El service worker responde «206» a las peticiones por partes (`Range`) del audio: sin eso Safari no reproduce la música guardada.
- En las piezas, `touch-action` sólo cuenta en el `<svg>` de afuera: los arrastres de lado usan `eje: 'x'` (la página aún se desplaza hacia arriba y abajo); los giros, dibujos y jalones toman todo el gesto. Lo que se arrastra dentro de `.artefacto` no cambia de hoja.
- La pieza se arma cuando se despliegan los paneles (`montarPieza()`), no durante el vuelo: así abrir una hoja no se traba en celulares lentos.
- **Parpadeos (ya corregidos; no volver a meterlos):** lo animado no se quita con `display:none` (al volver reiniciaba y parpadeaba): fuera de pantalla, al leer y detrás de la portada sólo se pausa (`animation-play-state`). No se redibuja la mampara al llegar las letras. Un `<canvas>` que cambia de tamaño se redibuja en el mismo cuadro. Las fotos entran con fundido (`alCargar`) y la foto completa del visor entra encima de la miniatura (cambiarle el `src` directo parpadeaba en Safari). La portada no se muestra con letras de respaldo ni le llegan piezas tarde (todo viene en el HTML).
- La escenografía de la mampara sólo se mueve en las etapas cercanas a la pantalla (`.escena.en-vista`, `IntersectionObserver` con margen amplio). El paisaje (`.esc-paisaje`) **no lleva transición**: revelarlo repintaba y el primer recorrido se trababa.
- Las escenas en `<canvas>` dibujan a ~30 cuadros/s con densidad de pixel de 1.25 como máximo; el paisaje se pinta una vez aparte y luego sólo se copia. Se detienen al cerrar la hoja, al salir de la portada y en segundo plano.
- Movimiento reducido: sin vuelos, vaivén, polvo ni escenografía en movimiento (las escenas quedan como un dibujo quieto); los cambios son instantáneos; en inmersivo el 3D se queda quieto.

## Fotos y archivos ligeros

- `datos.js` nombra el JPG original de cada hoja (`img/hojas/C1.jpg`). La app no lo carga: usa `img/hojas/web/C1.webp` (visor y lupa) e `img/hojas/mini/C1.webp` (mampara), que hace `armar.py` (necesita Pillow).
- Los logos se usan en WebP (`img/logo-*.webp`); los SVG se quedan como originales. El papel de la franja es `img/papel-franja.webp`.
- Las tipografías están recortadas a lo que usa la app: ASCII, español completo (con mayúsculas acentuadas, por los textos en mayúsculas de CSS) y «»“”‘’–—…·•→←−×°±¢€ºª§¡¿. Si un texto nuevo usa otro carácter (ç, à, ö…), hay que volver a recortar la fuente desde el original.

## Al cambiar cualquier archivo

Corre `python3 armar.py`: rehace las fotos ligeras que falten y recalcula `VERSION`, `NUCLEO` (lo que el service worker guarda al instalarse) y `HUELLAS` (fotos completas y sonidos, que se guardan al usarse o en calma y se conservan entre versiones mientras no cambien) en `sw.js`. Los originales JPG y SVG no se guardan sin conexión.
Tamaños probados: 360×616, 375×553, 393×659, 412×780, 430×932, 844×340, 667×331, 820×1106, 1180×746, 1366×660, 1920×970.
