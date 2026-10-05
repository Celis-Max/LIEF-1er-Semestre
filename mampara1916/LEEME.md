# México 1916–1940 · Mampara (libro digital)

Línea de tiempo interactiva del PIB y la deuda externa de México, con 28 hojas que se despliegan.
Es un sitio estático: no necesita servidor ni base de datos.

Se recorre como una sala de museo: el libro se guarda en su botón y aparece la mampara, las hojas
cuelgan de sus clips y se mecen, la foto de cada hoja se examina con una lupa y un gramófono toca
«La golondrina» (1922). Cada hoja trae una pieza para jugar con su dato y los dibujos de cada zona
responden al tocarlos.
El sonido se apaga y se prende con el botón redondo de la esquina; la app recuerda la elección.

## Tres modos

Se eligen en la portada (debajo de «Abrir el libro», o arriba a la izquierda en pantallas anchas) y en el
botón del extremo derecho del minimapa. La app recuerda el modo.

| Modo | Qué cambia |
|---|---|
| **Lite** | Carga rápido: sin fondos animados, polvo, vaivén, texturas de papel ni música (los efectos de sonido sí). No baja fotos ni sonidos en segundo plano. Lo elige sola la primera vez en equipos modestos, con «ahorro de datos» o con internet muy lenta |
| **Normal** | La mampara de siempre, animada |
| **Inmersivo** | 3D: el libro tiene grosor y se inclina con el ratón o el celular, la tapa gira al abrirlo, la escenografía tiene profundidad, las hojas se despliegan sobre sus bisagras y se voltean como páginas. En celulares pide la pantalla completa |

## Verla en la computadora

Doble clic en `index.html` funciona para verla. Para probarla como app (instalar, sin conexión) hay que servirla:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Publicarla para instalarla en el celular

1. Sube **todo el contenido de esta carpeta** a un alojamiento de sitios estáticos con HTTPS
   (por ejemplo GitHub Pages, Netlify o Cloudflare Pages). No hay nada que compilar.
2. Abre la dirección en el celular.
   - **iPhone / iPad:** Safari → botón Compartir → «Agregar a Inicio».
   - **Android:** Chrome → menú ⋮ → «Instalar app».
3. Después de abrirla una vez con internet, funciona sin conexión: al instalarse guarda lo esencial (1.3 MB) y,
   con buena conexión, guarda en calma las fotos completas y la música (3.1 MB más). En el modo lite sólo guarda lo
   que se va viendo, salvo que la app esté instalada.

Cada hoja tiene su enlace directo: `…/#C1`, `…/#K4`, `…/#D5`.

## Qué hay en la carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | La página |
| `estilos.css` | Todo el diseño |
| `app.js` | La mampara, la gráfica, el visor de hojas, la lupa, el ambiente, créditos e instalación |
| `piezas.js` | La pieza interactiva de cada hoja y los juguetes de cada zona |
| `fondos.js` | Los fondos animados: el paisaje de cada etapa en la mampara y las escenas detrás de la hoja abierta y en la portada (no se carga en lite) |
| `inmersivo.js` | El modo inmersivo: el libro 3D de la portada, la inclinación con el ratón o el giroscopio (sólo se carga en ese modo) |
| `sonido.js` | El sonido: gramófono, papel, clip, una señal por etapa y los sonidos de las piezas |
| `datos.js` | La tabla de indicadores, los textos de las 28 hojas y los dibujos |
| `sw.js`, `manifest.webmanifest` | Lo que la vuelve instalable y la hace funcionar sin internet |
| `img/`, `fuentes/` | Papeles, fotos, logos, iconos y tipografías. De cada foto hay tres versiones: el JPG original (`img/hojas/`), la completa ligera (`web/`) y la miniatura (`mini/`) |
| `sonidos/` | La música (dominio público) y tres efectos grabados; sus créditos están en «Créditos y fuentes» |
| `armar.py` | Hace las fotos ligeras y pone al día `sw.js` (versión, lo esencial y la huella de cada foto y sonido). Necesita Pillow: `pip install pillow` |

## Corregir un texto

Los textos de las hojas están en `datos.js` (busca el `id`, por ejemplo `"K1"`). Para cambiar una foto, reemplaza
su JPG en `img/hojas/`. Después de cambiar cualquier archivo corre `python3 armar.py`: hace las versiones ligeras
de las fotos y cambia `VERSION` en `sw.js`, así los celulares que ya la tienen instalada reciben el aviso
«Hay una versión nueva».
