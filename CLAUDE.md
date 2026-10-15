# Curso de seguridad de IA en español

## Qué es

Curso interactivo de Miguel, adaptado al español a partir de tres fuentes:
el libro de Hendrycks *Introduction to AI Safety, Ethics, and Society* (T&F 2024),
el curso *Intro to ML Safety* de CAIS y su propio Atlas de métricas de
monitorización, con Vigía como laboratorio. Es una app HTML local con progreso,
lecciones, ejercicios, tests, widgets y notebooks que se ejecutan en local.

Estado y plan: `_meta/log.md` (por fecha) y `_meta/decisiones.md` (lo cerrado).
`_meta/`, `_wip/` y `fuentes/` son material de trabajo del autor: están en
`.gitignore` y no viajan al repositorio público.

## Reglas duras

1. **Publicación con permiso de CAIS.** El libro es CC BY-NC-ND 4.0 y el repo
   del curso no tiene licencia: la adaptación es un derivado. El 2026-10-15 CAIS
   dio permiso por correo (Oliver Zhang, Managing Director; detalle en D-001) para
   publicar la adaptación de las lecciones y de los notebooks, con la condición
   de acreditar a CAIS. Toda pieza nueva lleva la atribución de `NOTICE.md`. El
   permiso no se sublicencia (ver `LICENSE`). Crear el repo de GitHub, añadir
   remoto o hacer push solo con el OK explícito de Miguel.
2. **Adaptar, no traducir.** Las lecciones reelaboran las ideas con estructura,
   ejemplos y prácticas propias. Nada de pegar párrafos traducidos del original.
   Cada lección cita su sección de origen.
3. **Vigía es solo lectura** (`Documents\vigia`): se usa su demo, CLI y MCP como
   laboratorio; nunca se edita desde aquí.
4. **`fuentes/` no se versiona** (está en `.gitignore`) y no se modifica.
5. **Log append-only** en `_meta/log.md` al cerrar cada sesión con efecto.
6. **No inventar.** Todo dato de una lección sale de las fuentes o se marca como
   añadido propio, con su fuente.

## Estructura

```
contenido/      modulos.json (índice) y mNN/lNN.html + .test.json (57 lecciones)
widgets/        un simulador por fichero (75)
notebooks/      notebooks adaptados al español (5, sin ejecutar)
app/            carcasa: shell.html, app.css, app.js
dist/           curso.html, un único fichero (no versionado, se regenera)
docs/           index.html, copia de dist/curso.html que se publica (la escribe construir.py)
fuentes/        PDF, repo del curso, texto por sección, Atlas, guía de Vigía (no versionado)
inventario/     libro.json, curso.json: índice de fuentes
build/          construir.py y comprobaciones (ver abajo)
_meta/          log, decisiones, spec, briefs de autor y revisor, produccion.md (no versionado)
_wip/           guiones e informes de revisión por lección (no versionado)
```

## Comprobaciones antes de dar algo por bueno

```
python build/construir.py              # sin avisos
python build/comprobar_formulas.py     # sin '<letra' dentro de fórmulas
python build/comprobar_control.py      # sin caracteres de control (LaTeX en JSON)
python build/comprobar_tildes.py       # sin palabras frecuentes sin tilde
python build/recorrido_modulos.py m00  # recorrido por módulo o lección, escritorio y móvil
python build/duraciones.py --escribir  # duración estimada de cada lección
```

## Cómo trabajar

- Piezas pequeñas por subagente (< 9 KB por escritura), resultado compacto al hilo.
- Piloto de una lección antes de producir módulos enteros.
- Antes de entregar: captura a ancho de escritorio y de móvil, tildes, desbordes.
