"""Capturas del libro en 11 tamaños. Uso: python3 -m http.server 8000 (en la raíz) y luego python3 pruebas/capturas.py [vistas] [pasos]
Requiere: pip install playwright && playwright install chromium"""
import sys, os
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "capturas"); os.makedirs(OUT, exist_ok=True)
VISTAS = {
 "iphone-se":   (375, 553, 2),     # Safari con barras
 "iphone-15":   (393, 659, 3),
 "iphone-max":  (430, 932, 3),     # PWA instalada
 "android-ch":  (360, 616, 3),
 "android-lg":  (412, 780, 2.6),
 "acostado":    (844, 340, 3),
 "acostado-ch": (667, 331, 2),
 "ipad-v":      (820, 1106, 2),
 "ipad-h":      (1180, 746, 2),
 "laptop":      (1366, 660, 1),
 "escritorio":  (1920, 970, 1),
}
sel = sys.argv[1].split(",") if len(sys.argv) > 1 else list(VISTAS)
pasos = sys.argv[2].split(",") if len(sys.argv) > 2 else ["tapa", "mampara", "hoja"]
with sync_playwright() as p:
    br = p.chromium.launch()
    for n in sel:
        w, h, d = VISTAS[n]
        cx = br.new_context(viewport={"width": w, "height": h}, device_scale_factor=min(d, 2), has_touch=True, is_mobile=w < 1000)
        pg = cx.new_page(); errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("http://localhost:8000/index.html"); pg.wait_for_timeout(1200)
        if "tapa" in pasos: pg.screenshot(path=f"{OUT}/{n}-1-tapa.png")
        pg.click("#abrir"); pg.wait_for_timeout(2600)
        if "mampara" in pasos:
            pg.screenshot(path=f"{OUT}/{n}-2-mampara-a.png")
            pg.evaluate("document.querySelector('#sala').scrollLeft = document.querySelector('#franja').offsetLeft - 8"); pg.wait_for_timeout(1600)
            pg.screenshot(path=f"{OUT}/{n}-2-mampara-b.png")
        if "resto" in pasos:
            for i, k in enumerate((1, 3, 4)):
                pg.evaluate(f"document.querySelector('#sala').scrollLeft = document.querySelector('#franja').offsetLeft + document.querySelectorAll('.periodo')[{k}].offsetLeft - 10"); pg.wait_for_timeout(2000)
                pg.screenshot(path=f"{OUT}/{n}-3-etapa{k}.png")
        if "ficha" in pasos:
            pg.evaluate("document.querySelector('#sala').scrollLeft = document.querySelector('#franja').offsetLeft - 8"); pg.wait_for_timeout(300)
            pg.click(".eje [data-anio='1917']"); pg.wait_for_timeout(500); pg.screenshot(path=f"{OUT}/{n}-4-ficha.png"); pg.keyboard.press("Escape")
        if "hoja" in pasos:
            pg.evaluate("document.querySelector('#sala').scrollLeft = document.querySelector('#franja').offsetLeft - 8"); pg.wait_for_timeout(300)
            pg.click(".hoja-mini[data-id='C1']"); pg.wait_for_timeout(350); pg.screenshot(path=f"{OUT}/{n}-5-hoja-vuelo.png")
            pg.wait_for_timeout(1700); pg.screenshot(path=f"{OUT}/{n}-5-hoja-a.png")
            pg.evaluate("document.querySelector('#rollo').scrollTop = 99999"); pg.wait_for_timeout(400); pg.screenshot(path=f"{OUT}/{n}-5-hoja-b.png")
            pg.evaluate("document.querySelector('#rollo').scrollTop = 0"); pg.click("#siguiente"); pg.wait_for_timeout(1500); pg.screenshot(path=f"{OUT}/{n}-5-hoja-c.png")
            pg.click("#cerrar"); pg.wait_for_timeout(1200); pg.screenshot(path=f"{OUT}/{n}-6-cerrada.png")
        ov = pg.evaluate("({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sh: document.documentElement.scrollHeight, ch: document.documentElement.clientHeight})")
        print(n, ov, "ERR:" if errs else "", errs[:5])
        cx.close()
    br.close()
