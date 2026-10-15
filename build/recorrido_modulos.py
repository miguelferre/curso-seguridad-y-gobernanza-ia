"""Recorrido de varias lecciones con un resumen de una línea por ancho.

Uso: python build/recorrido_modulos.py m07 m08      (módulos enteros)
     python build/recorrido_modulos.py m07/l02      (lecciones sueltas)
Reconstruye dist/curso.html y llama a build/recorrido.py por lección.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.stdout.reconfigure(encoding="utf-8")
indice = json.loads((RAIZ / "contenido" / "modulos.json").read_text(encoding="utf-8"))
lecciones = []
for arg in sys.argv[1:]:
    if "/" in arg:
        lecciones.append(arg)
    else:
        for m in indice["modulos"]:
            if m["id"] == arg:
                lecciones += [f"{arg}/{l['id']}" for l in m["lecciones"]]

subprocess.run([sys.executable, str(RAIZ / "build" / "construir.py")], capture_output=True)
fallos = 0
for lec in lecciones:
    r = subprocess.run([sys.executable, str(RAIZ / "build" / "recorrido.py"), lec],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    for linea in r.stdout.splitlines():
        m = re.match(r"(\w+) \{(.*)", linea.strip())
        if not m:
            continue
        d = m.group(2)
        g = lambda k: (re.search("'" + k + "': ([^,]+)", d) or [0, "?"])[1]
        nota = re.search(r"mejor.{0,4}?(\d+)", d)
        err = re.search(r"'errores': (\[.*?\])", d).group(1)
        ok = (g("teoria_por_scroll") == "True" and g("en_practica") == "True"
              and nota and nota.group(1) == "100" and g("desborde_progreso") == "0" and err == "[]")
        fallos += 0 if ok else 1
        print(("OK   " if ok else "FALLO"), lec, m.group(1)[:3], "wid", g("widgets_visibles"),
              "hecho", g("botones_hecho"), "nota", nota.group(1) if nota else "?",
              "desb", g("desborde_progreso"), "err", err[:120])
    if r.returncode:
        fallos += 1
        print("FALLO", lec, r.stderr.strip().splitlines()[-1:] if r.stderr else "")
print("fallos", fallos)
