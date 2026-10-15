r"""Busca caracteres de control en tests y lecciones.

Al escribir LaTeX dentro de JSON, "\frac", "\theta", "\beta" o "\approx" se leen
como escapes (\f, \t, \b, \a) y dejan caracteres de control en el texto.
Uso: python build/comprobar_control.py        (informa)
     python build/comprobar_control.py --arreglar
"""
import glob
import json
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
# Carácter de control -> letra del escape que lo produjo
ESCAPES = {"\x07": "a", "\x08": "b", "\x0c": "f", "\x0b": "v", "\t": "t", "\r": "r"}
CONTROL = re.compile("[\x00-\x08\x0b\x0c\x0e-\x1f]|\t(?=[a-z])")
arreglar = "--arreglar" in sys.argv
total = 0


def reparar(s):
    # Solo se reconstruye cuando va seguido de letras: es un comando LaTeX roto
    return re.sub("([\x07\x08\x0c\x0b\t\r])(?=[a-zA-Z])",
                  lambda m: "\\" + ESCAPES[m.group(1)], s)


def recorrer(obj):
    if isinstance(obj, str):
        return reparar(obj)
    if isinstance(obj, list):
        return [recorrer(x) for x in obj]
    if isinstance(obj, dict):
        return {k: recorrer(v) for k, v in obj.items()}
    return obj


for f in sorted(glob.glob("contenido/m*/l*.test.json")):
    datos = json.load(open(f, encoding="utf-8"))
    malos = []

    def buscar(o, ruta=""):
        if isinstance(o, str):
            for m in CONTROL.finditer(o):
                malos.append((ruta, repr(o[max(0, m.start() - 10):m.start() + 12])))
        elif isinstance(o, list):
            for i, x in enumerate(o):
                buscar(x, f"{ruta}[{i}]")
        elif isinstance(o, dict):
            for k, v in o.items():
                buscar(v, f"{ruta}.{k}")

    buscar(datos)
    for ruta, ctx in malos:
        print(f, ruta, ctx)
    total += len(malos)
    if malos and arreglar:
        open(f, "w", encoding="utf-8").write(json.dumps(recorrer(datos), ensure_ascii=False, indent=1))

for f in sorted(glob.glob("contenido/m*/l*.html")) + sorted(glob.glob("widgets/*.js")):
    t = open(f, encoding="utf-8").read()
    for m in re.finditer("[\x00-\x08\x0b\x0c\x0e-\x1f]", t):
        total += 1
        print(f, t.count("\n", 0, m.start()) + 1, repr(t[max(0, m.start() - 10):m.start() + 12]))
print("total", total)
