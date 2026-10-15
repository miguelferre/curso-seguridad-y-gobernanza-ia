"""Busca marcas de producto y datos de la instancia en el Atlas y en el curso.

El Atlas publicado es neutral: sin OpenScale, IBM, watsonx ni la instancia de prueba.
IBM Plex es una fuente tipográfica libre y no cuenta.
Uso: python build/comprobar_atlas.py
"""
import glob
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
PROHIBIDO = re.compile(
    r"OpenScale|watsonx|Watson|\bIBM\b|Cloud Pak|instancia (?:real|de referencia)"
    r"|dato de instancia|(?<!miguelferre/)(?<!src/)vigia/(?:docs|experimentos|research)|harness|Caso_reuma"
    r"|Drift v[12]|ibm\.com", re.I)

rutas = ["atlas/atlas.html", *sorted(glob.glob("contenido/m*/l*.html")),
         *sorted(glob.glob("contenido/m*/l*.test.json")), *sorted(glob.glob("widgets/*.js"))]
total = 0
for ruta in rutas:
    try:
        lineas = open(ruta, encoding="utf-8").read().splitlines()
    except FileNotFoundError:
        print(ruta, "no existe")
        total += 1
        continue
    for n, linea in enumerate(lineas, 1):
        for m in PROHIBIDO.finditer(linea.replace("IBM Plex", "").replace("IBM+Plex", "")):
            total += 1
            print(f"{ruta}:{n} {linea[max(0, m.start() - 40):m.end() + 30].strip()}")
print("total", total)
