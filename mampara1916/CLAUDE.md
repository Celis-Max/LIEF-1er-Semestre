# Mampara «México 1916–1940» · notas para seguir trabajando

PWA estática, sin framework ni compilación. Texto de interfaz en español de México. Lee `LEEME.md` primero.

## Mapa de `app.js`

| Bloque | Qué hace |
|---|---|
| `medir()` | **Única fuente de medidas**: con el alto y ancho de `.sala` calcula `--yw` (ancho de un año), cabecera, banda de hojas, banda de gráfica, eje y tamaño/posición de las hojas (`POS`) |
| `armarFijos()` | Cabeceras, eje, hojas colgadas y minimapa |
| `dibujar()` | Gráfica SVG en pixeles de la franja; se redibuja en cada cambio de tamaño |
| `prepararNavegacion()` | Rueda, arrastre, teclado, minimapa, ficha de año |
| `abrirHoja()` / `cerrarHoja()` / `cambiarHoja()` | Visor: vuelo FLIP desde la hoja chica + despliegue |
| `modoVisor()` | `pila` (vertical) · `lado` (celular acostado) · `despliegue` (tableta acostada / escritorio) |
| bloque 7 (`PWA`) | Historial (`#id`, botón atrás), instalación y service worker |

## Reglas de diseño (no cambiar)

- Tinta, papel y tipografía por etapa en `[data-k="0..4"]` de `estilos.css`. Texto corrido: Lora.
- Escalas de la gráfica iguales a la mampara impresa: PIB 0–760, deuda 0–860; ambas series parten de la base.
- La portada chica y la grande son el mismo componente (`.portada`, medido en `cqw`): por eso el vuelo es continuo.
- Nada de `100vh`: la app usa `height:100%` y el relleno de `env(safe-area-inset-*)` en `:root`.
- Zonas táctiles de 44 px o más; texto de lectura de 15.5 px o más en celular.
- No cambiar textos, cifras ni fechas de `datos.js` sin que lo pida el equipo: se revisaron contra la tabla de la asignatura.

## Al cambiar cualquier archivo

Cambia `VERSION` en `sw.js` y, si agregaste archivos, añádelos a `ARCHIVOS`.
Tamaños probados: 360×616, 375×553, 393×659, 412×780, 430×932, 844×340, 667×331, 820×1106, 1180×746, 1366×660, 1920×970.
