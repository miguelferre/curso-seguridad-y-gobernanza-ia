"""Recorrido de extremo a extremo de una lección real sobre dist/curso.html.

Uso: python build/recorrido.py m02/l01
Hace scroll por la teoría, sigue un enlace a Práctica, marca los ejercicios,
responde el test con las respuestas correctas del JSON y captura Progreso.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
lec = sys.argv[1] if len(sys.argv) > 1 else "m02/l01"
salida = RAIZ / "_wip" / "capturas"
salida.mkdir(parents=True, exist_ok=True)
test = json.loads((RAIZ / "contenido" / f"{lec}.test.json").read_text(encoding="utf-8"))
test = test["preguntas"] if isinstance(test, dict) else test
url = (RAIZ / "dist" / "curso.html").as_uri() + "#/" + lec
chrome = sorted(Path.home().glob("AppData/Local/ms-playwright/chromium-*/chrome-win64/chrome.exe"))


def estado(pg):
    return json.loads(pg.evaluate("localStorage.getItem('curso-seg-ia/v2')") or "{}")


with sync_playwright() as p:
    nav = p.chromium.launch(executable_path=str(chrome[-1]) if chrome else None)
    for nombre, ancho, alto in (("escritorio", 1280, 900), ("movil", 375, 812)):
        pg = nav.new_context(viewport={"width": ancho, "height": alto}).new_page()
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)))
        pg.goto(url)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=str(salida / f"{nombre}-teoria.png"))
        for _ in range(80):
            pg.mouse.wheel(0, 700)
            pg.wait_for_timeout(60)
        pg.wait_for_timeout(800)
        teoria_ok = "teoria" in json.dumps(estado(pg))
        # Enlace de la teoría a Práctica
        pg.evaluate("window.scrollTo(0,0)")
        enlace = pg.query_selector("a[data-ir='practica']")
        if enlace:
            enlace.click()
        else:
            # Lección sin enlace de la teoría a Práctica: se abre la pestaña por la ruta
            pg.goto(url + "/practica")
        pg.wait_for_timeout(800)
        en_practica = "/practica" in pg.url
        widgets = pg.evaluate("[...document.querySelectorAll('[data-widget]')].filter(w=>w.offsetHeight>50).length")
        botones = pg.query_selector_all(".ejercicio button")
        for b in botones:
            if "hecho" in (b.inner_text() or "").lower():
                b.click()
                pg.wait_for_timeout(150)
        pg.screenshot(path=str(salida / f"{nombre}-practica.png"), full_page=True)
        # Test con las respuestas correctas
        pg.goto(url + "/test")
        pg.wait_for_timeout(1200)
        bloques = pg.query_selector_all(".q")
        for q, bl in zip(test, bloques):
            c = q["correcta"]
            if q["tipo"] == "numerica":
                bl.query_selector("input").fill(str(c).replace(".", ","))
            elif q["tipo"] == "vf":
                opts = bl.query_selector_all("input")
                opts[0 if c else 1].check()
            elif q["tipo"] == "multiple":
                opts = bl.query_selector_all("input")
                for i in c:
                    opts[i].check()
            else:
                bl.query_selector_all("input")[c].check()
            bl.query_selector("button").click()
            pg.wait_for_timeout(80)
        pg.wait_for_timeout(500)
        pg.screenshot(path=str(salida / f"{nombre}-test.png"), full_page=True)
        pg.reload()
        pg.wait_for_timeout(1200)
        s = estado(pg)
        pg.goto(url.split("#")[0] + "#/progreso")
        pg.wait_for_timeout(1200)
        pg.screenshot(path=str(salida / f"{nombre}-progreso.png"), full_page=True)
        desborde = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
        print(nombre, {"teoria_por_scroll": teoria_ok, "en_practica": en_practica,
                       "widgets_visibles": widgets, "botones_hecho": len(botones),
                       "estado": json.dumps(s, ensure_ascii=False)[:400],
                       "desborde_progreso": desborde, "errores": errores})
    nav.close()
