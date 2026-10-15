"""Busca en el texto visible palabras frecuentes escritas sin tilde.

Solo mira el texto de las lecciones (no atributos) y los textos de los tests. Salta el
inglés marcado: elementos con lang="en..." y los párrafos «Dicho en inglés» (p.say).
Uso: python build/comprobar_tildes.py
"""
import glob
import json
import re
import sys
from html.parser import HTMLParser

sys.stdout.reconfigure(encoding="utf-8")
# Sin plurales en -iones ni formas que también son verbos correctos (practica, publica, numero)
SIN_TILDE = ("leccion teoria teorias metrica metricas tecnica tecnicas "
             "politica politicas analisis simulacion decision informacion funcion "
             "poblacion tambien segun numeros economia economica etica eticas codigo modulo "
             "modulos seccion pagina paginas algoritmica estadistica estadisticas "
             "matematica dificil facil util utiles").split()
PATRON = re.compile(r"\b(" + "|".join(SIN_TILDE) + r")\b", re.I)


class Texto(HTMLParser):
    def __init__(self):
        super().__init__()
        self.dentro = 0
        self.pila = []  # por etiqueta abierta: si cuenta como texto que no se mira
        self.trozos = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        salta = (tag in ("script", "style", "code", "pre")
                 or (a.get("lang") or "").startswith("en")
                 or (tag == "p" and "say" in (a.get("class") or "").split()))
        if tag in ("br", "img", "input", "hr", "meta", "link", "wbr"):
            return
        self.pila.append((tag, salta))
        if salta:
            self.dentro += 1

    def handle_endtag(self, tag):
        while self.pila:
            t, salta = self.pila.pop()
            if salta and self.dentro:
                self.dentro -= 1
            if t == tag:
                break

    def handle_data(self, data):
        if not self.dentro:
            self.trozos.append(data)


total = 0
for f in sorted(glob.glob("contenido/m*/l*.html")):
    p = Texto()
    p.feed(open(f, encoding="utf-8").read())
    texto = " ".join(p.trozos)
    # Fórmulas LaTeX fuera: \text{...} puede llevar palabras sin tilde a propósito
    texto = re.sub(r"\\\(.*?\\\)|\\\[.*?\\\]", " ", texto, flags=re.S)
    for m in PATRON.finditer(texto):
        total += 1
        print(f, repr(texto[max(0, m.start() - 30):m.end() + 20]))
for f in sorted(glob.glob("contenido/m*/l*.test.json")):
    datos = json.load(open(f, encoding="utf-8"))
    datos = datos["preguntas"] if isinstance(datos, dict) else datos
    textos = []
    for q in datos:
        textos += [q.get("enunciado", ""), q.get("explicacion", "")] + [str(o) for o in q.get("opciones", [])]
    t = re.sub(r"\\\(.*?\\\)", " ", " | ".join(textos))
    for m in PATRON.finditer(t):
        total += 1
        print(f, repr(t[max(0, m.start() - 30):m.end() + 20]))
print("total", total)
