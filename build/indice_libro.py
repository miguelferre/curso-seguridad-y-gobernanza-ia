"""Índice del libro de Hendrycks a partir del outline del PDF.

Salida: inventario/libro.json y texto por sección en fuentes/texto/capNN/.
"""
import json
import re
import subprocess
from pathlib import Path

from pypdf import PdfReader

RAIZ = Path(__file__).resolve().parent.parent
PDF = RAIZ / "fuentes" / "hendrycks-aisafety-2411.01042.pdf"
TEXTO = RAIZ / "fuentes" / "texto"
SALIDA = RAIZ / "inventario" / "libro.json"
DESFASE = 18  # página del PDF menos página impresa (comprobado en 4.1 y 4.2)


def limpiar(t):
    # Restos de LaTeX en los marcadores: "to 70ptChapter 12pt[cmyk]0,0,0,1'004[cmyk]0,0,0,1.0Título"
    t = re.sub(r"\[cmyk\][0-9.,]+", "", t)
    t = re.sub(r"^to\s*70ptChapter\s*\d+2pt'004", "", t)
    t = re.sub(r"^toI+V?", "", t) if re.match(r"^toI+V?[A-Z]", t) else t
    t = re.sub(r"^to\s*\S*pt", "", t)
    return t.strip()


def aplanar(reader, nodos, nivel=0, out=None):
    out = [] if out is None else out
    for n in nodos:
        if isinstance(n, list):
            aplanar(reader, n, nivel + 1, out)
        else:
            out.append({"nivel": nivel, "titulo": limpiar(n.title),
                        "pag": reader.get_destination_page_number(n) + 1})
    return out


def texto(ini, fin, destino):
    destino.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["pdftotext", "-f", str(ini), "-l", str(fin), "-layout",
                    str(PDF), str(destino)], check=True)
    return len(destino.read_text(encoding="utf-8", errors="replace").split())


def main():
    r = PdfReader(str(PDF))
    total = len(r.pages)
    items = aplanar(r, r.outline)
    # Página final: la del siguiente item de nivel igual o superior, incluida,
    # porque una sección suele acabar en la misma página en que empieza la
    # siguiente. Las secciones contiguas comparten esa página frontera.
    for i, it in enumerate(items):
        fin = total
        for sig in items[i + 1:]:
            if sig["nivel"] <= it["nivel"]:
                fin = sig["pag"]
                break
        it["pag_fin"] = max(fin, it["pag"])

    capitulos, n_cap = [], 0
    for i, it in enumerate(items):
        if it["nivel"] != 1:
            continue
        n_cap += 1
        cap = {"n": n_cap, "titulo": it["titulo"], "pag_ini": it["pag"],
               "pag_fin": it["pag_fin"], "secciones": []}
        n_sec = 0
        for sub in items[i + 1:]:
            if sub["nivel"] <= 1:
                break
            if sub["nivel"] == 2:
                n_sec += 1
                fichero = TEXTO / f"cap{n_cap:02d}" / f"sec{n_sec:02d}.txt"
                palabras = texto(sub["pag"], sub["pag_fin"], fichero)
                cap["secciones"].append({
                    "id": f"{n_cap}.{n_sec}", "titulo": sub["titulo"],
                    "pag_ini": sub["pag"], "pag_fin": sub["pag_fin"],
                    "palabras": palabras,
                    "fichero_texto": str(fichero.relative_to(RAIZ)).replace("\\", "/"),
                    "subsecciones": []})
            elif sub["nivel"] >= 3 and cap["secciones"]:
                cap["secciones"][-1]["subsecciones"].append(sub["titulo"])
        cap["palabras"] = sum(s["palabras"] for s in cap["secciones"])
        capitulos.append(cap)

    SALIDA.write_text(json.dumps({
        "fuente": "arXiv 2411.01042 (Hendrycks, Introduction to AI Safety, Ethics, and Society)",
        "consultado": "2026-09-29", "paginas_total": total,
        "desfase_impresa": DESFASE,
        "nota": "pag_* son páginas del PDF; la impresa es pag - desfase_impresa. "
                "Secciones contiguas comparten la página frontera.",
        "capitulos": capitulos}, ensure_ascii=False, indent=1), encoding="utf-8")

    for c in capitulos:
        print(f"{c['n']:>2} {c['titulo'][:45]:<45} {c['pag_ini']:>3}-{c['pag_fin']:<3} "
              f"{c['palabras']:>6} pal  {len(c['secciones']):>2} secc")
    print("total palabras", sum(c["palabras"] for c in capitulos))


if __name__ == "__main__":
    main()
