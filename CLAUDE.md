# LIEF · Primer semestre — notas para Claude Code

Repositorio de trabajos de primer semestre (Licenciatura en Ingeniería Económica y Financiera, Escuela Superior de Apan · UAEH).
Es un sitio estático, sin framework ni paso de compilación. Texto de interfaz en español de México.

## Qué hay

| Ruta | Qué es |
|---|---|
| `index.html` | Portada del semestre: una tarjeta por trabajo |
| `mampara1916/` | **Mampara 1916**: PWA con la línea de tiempo del PIB y la deuda externa de México, 1916–1940, y 28 hojas desplegables |
| `mampara1916/CLAUDE.md` | Mapa del código, reglas de diseño y tamaños probados. **Léelo antes de tocar la app** |
| `mampara1916/LEEME.md` | Cómo verla, publicarla e instalarla |

## Publicación (importante)

El sitio se sirve con GitHub Pages **desde la rama `gh-pages`**, no desde `main`.
Después de cada cambio hay que subir las dos ramas, o el sitio no se actualiza:

```bash
git push origin main main:gh-pages
```

- Sitio: https://celis-max.github.io/LIEF-1er-Semestre/
- App: https://celis-max.github.io/LIEF-1er-Semestre/mampara1916/

## Reglas

- **No renombrar ni mover `mampara1916/`**: la app ya está instalada en celulares y hay flyers impresos con un QR a esa dirección.
- Al cambiar cualquier archivo de `mampara1916/`, corre `python3 mampara1916/armar.py`: cambia `VERSION` en `sw.js` y pone al día lo que el service worker guarda (`NUCLEO` y `HUELLAS`). Así los celulares que ya la tienen reciben el aviso «Hay una versión nueva».
- La app tiene tres modos (lite, normal, inmersivo); el 3D sólo va en el inmersivo. Detalles en `mampara1916/CLAUDE.md`.
- Rutas siempre relativas: el sitio vive en una subcarpeta.
- No cambiar textos, cifras ni fechas de `mampara1916/datos.js` sin que lo pida el equipo.
- Un trabajo nuevo va en su propia carpeta y se agrega como tarjeta en `index.html` y como fila en `README.md`.

## Probar

```bash
python3 -m http.server 8000        # desde la raíz; abrir http://localhost:8000/mampara1916/
python3 mampara1916/pruebas/capturas.py   # capturas en 11 tamaños (requiere playwright)
```

`capturas.py` espera la app en `http://localhost:8000/index.html`; para usarlo, sirve desde `mampara1916/` o ajusta la dirección en el script.
