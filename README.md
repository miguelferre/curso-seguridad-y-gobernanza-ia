# Seguridad y gobernanza de la IA: curso interactivo en español

Curso de seguridad de la inteligencia artificial en español, para estudiar a tu ritmo en
el navegador. Adapta al español el libro *Introduction to AI Safety, Ethics, and Society*
(Dan Hendrycks) y el curso *Intro to ML Safety*, ambos del Center for AI Safety (CAIS),
con permiso de CAIS. Añade ejemplos propios, sobre todo de sanidad, y un módulo de
monitorización de modelos en producción con [Vigía](https://github.com/miguelferre/vigia)
como laboratorio.

> **Reproduced with permission of Center for AI Safety, Inc.** CAIS no respalda este
> curso ni tiene relación con él. Detalle en [Atribución y licencias](#atribución-y-licencias).

| Pieza | Cantidad |
|---|---|
| Módulos | 13 (del 0 al 12) |
| Lecciones | 57, cada una con teoría, práctica y test |
| Simuladores interactivos (widgets) | 75 |
| Ejercicios con solución | 160 |
| Preguntas de test | 566 |
| Notebooks de Jupyter | 5 |
| Duración estimada | unas 40 horas |

## Contenido

| Módulo | Tema | Lecciones |
|---|---|---|
| 0 | Fundamentos de IA | 5 |
| 1 | Riesgos catastróficos | 4 |
| 2 | Ingeniería de seguridad | 6 |
| 3 | Sistemas complejos | 3 |
| 4 | Robustez | 2 |
| 5 | Monitorización técnica | 6 |
| 6 | Monitorización en producción (laboratorio con Vigía) | 5 |
| 7 | Alineamiento y control | 3 |
| 8 | IA beneficiosa y ética de máquinas | 5 |
| 9 | Acción colectiva | 5 |
| 10 | Gobernanza | 5 |
| 11 | Fundamentos formales | 6 |
| 12 | Cierre y proyecto final | 2 |

Cada lección cita su sección de origen en el libro o en el curso de CAIS. Lo que el curso
añade (ejemplos, casos sanitarios, conexiones con otras fuentes) va marcado como propio.

El curso trae un **Atlas de métricas de monitorización** ([`docs/atlas.html`](docs/atlas.html)):
unas 250 fichas con la fórmula, la lectura, un ejemplo calculado y la trampa típica de cada
métrica de equidad, calidad, deriva, explicabilidad, IA generativa e interacción humano-IA. La
etiqueta «Atlas» de cada lección lleva a él.

## Cómo se usa

1. Descarga [`docs/index.html`](docs/index.html). Es el curso entero en un solo fichero.
2. Ábrelo con un navegador actual (Chrome, Edge, Firefox o Safari).
3. Elige una lección en el índice. Cada lección tiene tres pestañas: Teoría, Práctica y Test.

El progreso (lecciones leídas, ejercicios hechos y resultados de los tests) se guarda en
el almacenamiento local del navegador. No sale de tu equipo. En «Progreso», los botones
«Exportar registro» e «Importar registro» lo pasan a otro navegador.

Necesitas conexión a internet para pintar las fórmulas: KaTeX se carga desde cdnjs. Sin
conexión, las fórmulas se ven en LaTeX.

### Notebooks

Cinco lecciones tienen un notebook de Jupyter en [`notebooks/`](notebooks/). Cada notebook
dice al principio qué necesita (PyTorch, conjuntos de datos y modelos que se descargan
aparte). Los notebooks adaptados no se han ejecutado de principio a fin: puede haber fallos
por versiones de las bibliotecas.

### Laboratorio con Vigía

El módulo 6 y el proyecto final usan [Vigía](https://github.com/miguelferre/vigia), un
monitor de modelos con datos sintéticos (licencia MIT). Vigía funciona en Windows 11 de
64 bits. Las lecciones explican cómo instalarlo desde el zip de la Release o desde el
código. El resto del curso no necesita Vigía.

## Cómo se construye

`docs/index.html` se genera desde las fuentes del repositorio. Hace falta Python 3.13 y,
para comprobar la sintaxis de los widgets, Node.

```
python build/construir.py
```

La orden une `app/` (carcasa), `contenido/` (lecciones y tests) y `widgets/` en
`dist/curso.html` y deja una copia en `docs/index.html`, con el Atlas al lado. Comprobaciones antes de publicar
un cambio (todas deben salir sin avisos):

```
python build/comprobar_formulas.py
python build/comprobar_control.py
python build/comprobar_tildes.py
python build/comprobar_atlas.py
python build/recorrido_modulos.py m00
```

`recorrido_modulos.py` recorre cada lección a ancho de escritorio y de móvil con
Playwright (`pip install playwright` y `playwright install chromium`).

### Estructura

```
app/          carcasa: shell.html, app.css, app.js
contenido/    modulos.json (índice) y mNN/lNN.html + lNN.test.json
widgets/      un simulador por fichero
notebooks/    notebooks adaptados al español
atlas/        Atlas de métricas (fuente de docs/atlas.html)
build/        construcción y comprobaciones
diseno/       hoja de estilos de referencia
inventario/   índice de las fuentes (secciones del libro y lecciones del curso)
docs/         el curso compilado (index.html)
```

## Atribución y licencias

**Reproduced with permission of Center for AI Safety, Inc.**

Este curso es una adaptación al español de *Introduction to AI Safety, Ethics, and
Society* (Dan Hendrycks, Taylor & Francis, 2024, [aisafetybook.com](https://www.aisafetybook.com))
y del curso *Intro to ML Safety* ([course.mlsafety.org](https://course.mlsafety.org)),
ambos del Center for AI Safety. CAIS no respalda este curso ni tiene relación con él.

| Parte | Licencia |
|---|---|
| Material de CAIS en lecciones y notebooks | Permiso de CAIS. No se sublicencia |
| Texto propio del curso | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es) |
| Código propio (`widgets/`, `app/`, `build/`, `diseno/`) | MIT |
| Código de terceros en notebooks | Su licencia: MIT (Stanford CS231n) y Apache-2.0 (hendrycks/outlier-exposure) |

Texto completo en [`LICENSE`](LICENSE). Permiso de CAIS y avisos de terceros en
[`NOTICE.md`](NOTICE.md).

## Autor

Miguel Ferreiro García. Errores y sugerencias: abre un issue en este repositorio.
