"""Estima la duración de cada lección y la escribe en contenido/modulos.json.

Criterio (propio, aproximado): texto visible de teoría y práctica a 160 palabras
por minuto, sin contar Fuentes ni las soluciones desplegables, más 2 minutos por
simulador, 4 por ejercicio y 1 por pregunta del test. Se redondea a 5 minutos.
Uso: python build/duraciones.py [--escribir]
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding="utf-8")


class Texto(HTMLParser):
    def __init__(self):
        super().__init__()
        self.saltar = 0
        self.partes = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if self.saltar or tag in ("details", "aside", "svg", "script", "style") or "sources" in (a.get("class") or ""):
            if tag not in ("br", "img", "input", "hr"):
                self.saltar += 1

    def handle_endtag(self, tag):
        if self.saltar and tag not in ("br", "img", "input", "hr"):
            self.saltar -= 1

    def handle_data(self, data):
        if not self.saltar:
            self.partes.append(data)


def estimar(html, test):
    p = Texto()
    p.feed(html)
    palabras = len(" ".join(p.partes).split())
    sims = len(re.findall(r"data-widget=", html))
    ejs = len(re.findall(r"data-ejercicio=", html))
    minutos = palabras / 160 + 2 * sims + 4 * ejs + len(test)
    return palabras, max(15, int(5 * round(minutos / 5)))


indice = json.loads((RAIZ / "contenido" / "modulos.json").read_text(encoding="utf-8"))
for m in indice["modulos"]:
    for l in m["lecciones"]:
        f = RAIZ / "contenido" / m["id"] / f"{l['id']}.html"
        t = RAIZ / "contenido" / m["id"] / f"{l['id']}.test.json"
        if not f.exists():
            continue
        test = json.loads(t.read_text(encoding="utf-8")) if t.exists() else []
        test = test["preguntas"] if isinstance(test, dict) else test
        palabras, minutos = estimar(f.read_text(encoding="utf-8"), test)
        print(f"{m['id']}/{l['id']} {palabras:>5} palabras -> {minutos} min (antes {l.get('minutos')})")
        l["minutos"] = minutos
if "--escribir" in sys.argv:
    (RAIZ / "contenido" / "modulos.json").write_text(
        json.dumps(indice, ensure_ascii=False, indent=1), encoding="utf-8")
    print("modulos.json actualizado")
