"""Pone al día el libro después de cambiar cualquier archivo:

  1. Fotos de las hojas: de cada JPG de img/hojas/ (el original, el que nombra datos.js) saca
     img/hojas/web/ID.webp (para el visor y la lupa) e img/hojas/mini/ID.webp (para la mampara).
     Sólo las rehace si el JPG es más nuevo. Necesita Pillow: pip install pillow
  2. sw.js: lo que se guarda para usar el libro sin conexión y su VERSION (una huella de todos los
     archivos). Así los celulares que ya tienen la app instalada reciben el aviso «Hay una versión nueva».
     NUCLEO se guarda al instalar; las fotos completas y los sonidos (HUELLAS, con la huella de cada uno)
     se guardan conforme se usan o en calma, y se conservan entre versiones mientras no cambien.

    python3 armar.py
"""
import glob, hashlib, json, os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
FUERA = {'sw.js', 'armar.py', 'CLAUDE.md', 'LEEME.md'}               # no forman parte del libro
ORIGINALES = re.compile(r'^img/hojas/[^/]+\.jpg$|^img/logo-[^/]+\.svg$')  # se publican, pero el libro usa sus versiones ligeras
MEDIOS = re.compile(r'^img/hojas/web/|^sonidos/')                         # pesados: se guardan conforme se usan (no al instalar)


def fotos():
    try:
        from PIL import Image
    except ImportError:
        print('· sin Pillow: las fotos no se revisaron (pip install pillow)')
        return
    hechas = 0
    for jpg in sorted(glob.glob(os.path.join(AQUI, 'img/hojas/*.jpg'))):
        n = os.path.splitext(os.path.basename(jpg))[0]
        for carpeta, lado, calidad in (('web', 1100, 76), ('mini', 340, 72)):
            destino = os.path.join(AQUI, 'img/hojas', carpeta, n + '.webp')
            if os.path.exists(destino) and os.path.getmtime(destino) >= os.path.getmtime(jpg):
                continue
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            im = Image.open(jpg).convert('RGB')
            k = min(1, lado / max(im.size))
            if k < 1:
                im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
            im.save(destino, 'WEBP', quality=calidad, method=6)
            hechas += 1
    print(f'· fotos: {hechas} nuevas' if hechas else '· fotos: al día')


def lista():
    archivos = []
    for carpeta, _, nombres in os.walk(AQUI):
        rel = os.path.relpath(carpeta, AQUI)
        if rel.split(os.sep)[0] == 'pruebas':
            continue
        for n in nombres:
            ruta = os.path.normpath(os.path.join(rel, n)).replace(os.sep, '/')
            if ruta in FUERA or n.startswith('.') or ORIGINALES.match(ruta):
                continue
            archivos.append(ruta)
    return sorted(archivos)


def servicio(archivos):
    huella, huellas = hashlib.sha1(), {}
    for ruta in archivos:
        with open(os.path.join(AQUI, ruta), 'rb') as f:
            datos = f.read()
        huella.update(ruta.encode()); huella.update(datos)
        if MEDIOS.match(ruta):
            huellas[ruta] = hashlib.sha1(datos).hexdigest()[:10]
    version = huella.hexdigest()[:10]
    nucleo = ['./'] + [r for r in archivos if r not in huellas]
    sw = os.path.join(AQUI, 'sw.js')
    with open(sw, encoding='utf-8') as f:
        texto = f.read()
    texto = re.sub(r"const VERSION = '[0-9a-f]+';", f"const VERSION = '{version}';", texto)
    texto = re.sub(r"const NUCLEO = \[.*?\];", 'const NUCLEO = ' + json.dumps(nucleo, ensure_ascii=False, indent=1) + ';', texto, flags=re.S)
    texto = re.sub(r"const HUELLAS = \{.*?\};", 'const HUELLAS = ' + json.dumps(huellas, ensure_ascii=False, indent=1) + ';', texto, flags=re.S)
    with open(sw, 'w', encoding='utf-8') as f:
        f.write(texto)
    peso = lambda rs: sum(os.path.getsize(os.path.join(AQUI, r)) for r in rs if r != './') / 1048576
    print(f'· sw.js: VERSION {version} · al instalar {len(nucleo)} archivos ({peso(nucleo):.1f} MB) · '
          f'en calma {len(huellas)} fotos y sonidos ({peso(huellas):.1f} MB)')


fotos()
servicio(lista())
