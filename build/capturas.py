"""Capturas de verificación de una lección a ancho de escritorio y de móvil.

Uso: python build/capturas.py m02/l01 [carpeta_salida]
Abre dist/curso.html por file:// y guarda capturas por tramos de la lección.
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
leccion = sys.argv[1] if len(sys.argv) > 1 else "m02/l01"
salida = Path(sys.argv[2]) if len(sys.argv) > 2 else RAIZ / "_wip" / "capturas"
salida.mkdir(parents=True, exist_ok=True)
url = (RAIZ / "dist" / "curso.html").as_uri() + "#/" + leccion

with sync_playwright() as p:
    # El Playwright de Python espera otra versión de Chromium; se usa la instalada
    chrome = sorted(Path.home().glob("AppData/Local/ms-playwright/chromium-*/chrome-win64/chrome.exe"))
    nav = p.chromium.launch(executable_path=str(chrome[-1]) if chrome else None)
    for nombre, ancho, alto in (("escritorio", 1280, 900), ("movil", 375, 812)):
        pag = nav.new_page(viewport={"width": ancho, "height": alto})
        errores = []
        pag.on("pageerror", lambda e: errores.append(str(e)))
        pag.goto(url)
        pag.wait_for_timeout(2500)
        desborde = pag.evaluate("document.documentElement.scrollWidth - innerWidth")
        # Elementos más anchos que la ventana
        anchos = pag.evaluate("""[...document.querySelectorAll('main *')]
            .filter(e => e.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 5).map(e => e.tagName + '.' + e.className)""")
        pag.screenshot(path=str(salida / f"{nombre}-completa.png"), full_page=True)
        for sel in ("[data-widget=ecuacion-riesgo]", "[data-widget=nueves-fiabilidad]", "[data-test]"):
            el = pag.query_selector(sel)
            if el:
                el.screenshot(path=str(salida / f"{nombre}-{sel.split('=')[-1].strip('[]')}.png"))
        print(nombre, "desborde", desborde, "fuera", anchos, "errores", errores)
        pag.close()
    nav.close()
