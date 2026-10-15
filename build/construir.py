#!/usr/bin/env python3
"""Une el curso en un unico fichero HTML (dist/curso.html). Solo biblioteca estandar.

Uso:
    python build/construir.py
    python build/construir.py --out RUTA.html --extra m00/l01=RUTA_FRAGMENTO.html

--extra ID=RUTA incrusta un fragmento suelto (con su RUTA.test.json al lado, si existe)
como la leccion ID sin tocar contenido/. Sirve para probar. Se puede repetir.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TIPOS = {"unica", "multiple", "numerica", "vf"}
# Repositorio publico. Los enlaces a notebooks apuntan aqui: en GitHub Pages no
# existe la carpeta notebooks/ junto al HTML. HEAD resuelve a la rama por defecto.
# Único sitio con el nombre del repositorio (fijado por Miguel el 2026-10-16):
# lo usan los enlaces a notebooks y el pie de la carcasa.
REPO = "https://github.com/miguelferre/curso-seguridad-y-gobernanza-ia"
NOTEBOOKS = REPO + "/blob/HEAD/notebooks/"
# Restos del equipo del autor que no deben llegar al HTML publicado.
LOCALES = re.compile(r'[A-Z]:\\Users\\|href="(?:\.\./|file:|https?://(?:127\.0\.0\.1|localhost))')


def leer(ruta):
    return Path(ruta).read_text(encoding="utf-8")


def json_seguro(obj):
    """JSON para incrustar en <script type=application/json>: sin '<' literal."""
    s = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return s.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def preguntas_de(datos):
    if isinstance(datos, list):
        return datos
    if isinstance(datos, dict):
        return datos.get("preguntas") or datos.get("questions") or []
    return []


def validar_test(lid, datos, avisos):
    ids = set()
    for i, q in enumerate(preguntas_de(datos), 1):
        etiqueta = f"{lid} pregunta {i}"
        if not isinstance(q, dict):
            avisos.append(f"{etiqueta}: no es un objeto")
            continue
        qid = q.get("id")
        if qid is None:
            avisos.append(f"{etiqueta}: falta id")
        elif qid in ids:
            avisos.append(f"{etiqueta}: id repetido ({qid})")
        ids.add(qid)
        tipo = q.get("tipo")
        if tipo not in TIPOS:
            avisos.append(f"{etiqueta}: tipo desconocido ({tipo})")
            continue
        for campo in ("enunciado", "correcta", "explicacion"):
            if campo not in q:
                avisos.append(f"{etiqueta}: falta {campo}")
        if tipo in ("unica", "multiple"):
            n = len(q.get("opciones") or [])
            if n < 2:
                avisos.append(f"{etiqueta}: faltan opciones")
            c = q.get("correcta")
            for x in (c if isinstance(c, list) else [c]):
                if isinstance(x, int) and not isinstance(x, bool) and not 0 <= x < n:
                    avisos.append(f"{etiqueta}: correcta fuera de rango (indice base 0)")
            if tipo == "multiple" and not isinstance(c, list):
                avisos.append(f"{etiqueta}: multiple espera una lista en correcta")
        if tipo == "numerica" and not isinstance(q.get("correcta"), (int, float)):
            avisos.append(f"{etiqueta}: numerica espera un numero en correcta")
        if tipo == "vf" and not isinstance(q.get("correcta"), bool):
            avisos.append(f"{etiqueta}: vf espera true o false")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=str(RAIZ / "dist" / "curso.html"))
    ap.add_argument("--extra", action="append", default=[], metavar="ID=RUTA")
    args = ap.parse_args()
    avisos = []

    indice = json.loads(leer(RAIZ / "contenido" / "modulos.json"))
    validos = {f"{m['id']}/{l['id']}" for m in indice["modulos"] for l in m["lecciones"]}

    lecciones = {}
    for frag in sorted((RAIZ / "contenido").glob("m[0-9][0-9]/l[0-9][0-9].html")):
        lid = f"{frag.parent.name}/{frag.stem}"
        if lid not in validos:
            avisos.append(f"{lid}: existe el fichero pero no esta en modulos.json (se omite)")
            continue
        lecciones[lid] = {"html": leer(frag), "test": None, "_ruta": frag}
        t = frag.with_suffix(".test.json")
        if t.exists():
            lecciones[lid]["test"] = json.loads(leer(t))
    for extra in args.extra:
        lid, _, ruta = extra.partition("=")
        ruta = Path(ruta)
        if lid not in validos:
            avisos.append(f"{lid}: --extra con id que no esta en modulos.json (se omite)")
            continue
        lecciones[lid] = {"html": leer(ruta), "test": None, "_ruta": ruta}
        t = ruta.with_suffix(".test.json")
        if t.exists():
            lecciones[lid]["test"] = json.loads(leer(t))

    for lid, d in lecciones.items():
        if d["test"] is not None:
            validar_test(lid, d["test"], avisos)
        else:
            avisos.append(f"{lid}: sin test")
        d.pop("_ruta")
        d["html"] = d["html"].replace('href="../notebooks/', f'href="{NOTEBOOKS}')
        for m in LOCALES.finditer(d["html"]):
            avisos.append(f"{lid}: ruta local o enlace relativo ({m.group(0)})")

    widgets = sorted((RAIZ / "widgets").glob("*.js"))
    # Un widget con error de sintaxis (p. ej. a medio escribir) se deja fuera
    # para que no ensucie la consola de todo el curso.
    if shutil.which("node"):
        validos = []
        for w in widgets:
            r = subprocess.run(["node", "--check", str(w)], capture_output=True, text=True)
            if r.returncode == 0:
                validos.append(w)
            else:
                avisos.append(f"widget '{w.stem}' con error de sintaxis: excluido")
        widgets = validos
    texto_widgets = {w.stem: leer(w) for w in widgets}
    usados = set()
    for d in lecciones.values():
        usados.update(re.findall(r'data-widget="([^"]+)"', d["html"]))
    for wid in sorted(usados):
        if not any(wid in txt for txt in texto_widgets.values()):
            avisos.append(f"widget '{wid}' usado en una leccion pero sin fichero en widgets/")

    css = leer(RAIZ / "app" / "app.css").replace("</style", "<\\/style")
    app = leer(RAIZ / "app" / "app.js").replace("</script", "<\\/script")
    bloques_w = "\n".join(
        f"<script>/* widget: {n} */\n{txt.replace('</script', '<\\/script')}\n</script>"
        for n, txt in texto_widgets.items()
    )
    datos = json_seguro({"modulos": indice["modulos"], "lecciones": lecciones})

    piezas = {"CSS": css, "WIDGETS": bloques_w, "APP": app, "DATA": datos, "REPO": REPO}
    html = re.sub(r"/\*@@(CSS|WIDGETS|APP|DATA|REPO)@@\*/", lambda m: piezas[m.group(1)], leer(RAIZ / "app" / "shell.html"))

    salida = Path(args.out)
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(html, encoding="utf-8", newline="\n")
    # La copia publicada (GitHub Pages) sale solo de la salida por defecto. El Atlas
    # va al lado del curso en dist/ y docs/: la etiqueta «Atlas» enlaza a atlas.html.
    if salida.resolve() == (RAIZ / "dist" / "curso.html").resolve():
        docs = RAIZ / "docs" / "index.html"
        docs.parent.mkdir(exist_ok=True)
        shutil.copyfile(salida, docs)
        print(f"Copia publicada: {docs}")
        atlas = RAIZ / "atlas" / "atlas.html"
        if atlas.exists():
            for destino in (RAIZ / "dist" / "atlas.html", RAIZ / "docs" / "atlas.html"):
                shutil.copyfile(atlas, destino)
        else:
            avisos.append("falta atlas/atlas.html: la etiqueta «Atlas» no lleva a ningún sitio")

    total = sum(len(m["lecciones"]) for m in indice["modulos"])
    print(f"Modulos: {len(indice['modulos'])}, lecciones en el indice: {total}")
    print(f"Lecciones incluidas ({len(lecciones)}): {', '.join(sorted(lecciones)) or 'ninguna'}; pendientes: {total - len(lecciones)}")
    print(f"Widgets ({len(widgets)}): {', '.join(w.stem for w in widgets) or 'ninguno'}")
    print(f"Salida: {salida} ({salida.stat().st_size / 1024:.1f} KB)")
    for a in avisos:
        print(f"AVISO: {a}", file=sys.stderr)


if __name__ == "__main__":
    main()
