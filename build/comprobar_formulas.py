r"""Busca '<' seguido de letra dentro de fórmulas LaTeX de las lecciones.

En HTML, '<p' dentro de \( p_1<p_0 \) abre una etiqueta y rompe el párrafo.
Dentro de las fórmulas hay que escribir '&lt;' o dejar un espacio: '< p'.
Uso: python build/comprobar_formulas.py
"""
import glob
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
INLINE = re.compile(r"\\\(([^\n]{0,300}?)\\\)")
DISPLAY = re.compile(r"\\\[(.{0,600}?)\\\]", re.S)

total = 0
# Solo los fragmentos HTML: los textos del test los escapa la carcasa.
for f in sorted(glob.glob("contenido/m*/l*.html")):
    t = open(f, encoding="utf-8").read()
    for rx in (INLINE, DISPLAY):
        for m in rx.finditer(t):
            s = m.group(1)
            for h in re.finditer(r"<[a-zA-Z]", s):
                total += 1
                linea = t.count("\n", 0, m.start()) + 1
                print(f, linea, repr(s[max(0, h.start() - 20):h.start() + 12]))
print("total", total)
sys.exit(1 if total else 0)
