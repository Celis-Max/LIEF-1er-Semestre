# México 1916–1940 · Mampara (libro digital)

Línea de tiempo interactiva del PIB y la deuda externa de México, con 28 hojas que se despliegan.
Es un sitio estático: no necesita servidor ni base de datos.

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
3. Después de abrirla una vez con internet, funciona sin conexión (guarda unos 5 MB).

Cada hoja tiene su enlace directo: `…/#C1`, `…/#K4`, `…/#D5`.

## Qué hay en la carpeta

| Archivo | Para qué |
|---|---|
| `index.html` | La página |
| `estilos.css` | Todo el diseño |
| `app.js` | La mampara, la gráfica, el visor de hojas, créditos e instalación |
| `datos.js` | La tabla de indicadores, los textos de las 28 hojas y los dibujos |
| `sw.js`, `manifest.webmanifest` | Lo que la vuelve instalable y la hace funcionar sin internet |
| `img/`, `fuentes/` | Papeles, fotos, logos, iconos y tipografías |

## Corregir un texto

Los textos de las hojas están en `datos.js` (busca el `id`, por ejemplo `"K1"`). Después de cambiar cualquier
archivo hay que cambiar también el valor de `VERSION` en `sw.js` (cualquier texto distinto sirve): así los
celulares que ya la tienen instalada reciben el aviso «Hay una versión nueva».
