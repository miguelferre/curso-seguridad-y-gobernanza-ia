# Avisos, permisos y atribución

## Atribución a CAIS

**Reproduced with permission of Center for AI Safety, Inc.**

Este curso es una adaptación al español de *Introduction to AI Safety, Ethics, and
Society* (Dan Hendrycks, Taylor & Francis, 2024, [aisafetybook.com](https://www.aisafetybook.com))
y del curso *Intro to ML Safety* ([course.mlsafety.org](https://course.mlsafety.org)),
ambos del Center for AI Safety. CAIS no respalda este curso ni tiene relación con él.

## Permiso de CAIS

| Campo | Valor |
|---|---|
| Fecha | 15 de octubre de 2026 |
| Concede | Center for AI Safety, Inc., por correo de Oliver Zhang (Managing Director) |
| Alcance | Publicar la adaptación de las lecciones del libro y del curso, y de los notebooks del curso |
| Condición | Acreditar a CAIS de forma adecuada |

Qué cubre el permiso:

- El libro se publica bajo CC BY-NC-ND 4.0 (página de arXiv 2411.01042). Esa licencia no
  permite publicar obras derivadas. Las lecciones son una adaptación, y se publican por el
  permiso de CAIS, no por la licencia del libro.
- El repositorio de CAIS con el curso ([centerforaisafety/Intro_to_ML_Safety](https://github.com/centerforaisafety/Intro_to_ML_Safety))
  no declara licencia. Los notebooks adaptados se publican por el permiso de CAIS.
- El permiso no se puede sublicenciar. El material de CAIS queda fuera de las licencias
  CC BY-NC-SA 4.0 y MIT de este repositorio (ver `LICENSE`).
- `inventario/` guarda un índice del libro y del curso (títulos, páginas y enlaces) que
  sirve para citar cada sección de origen.

## Avisos de terceros por notebook

Los cinco notebooks de `notebooks/` abren con una cabecera «Adaptación de CAIS, Intro to
ML Safety» que repite este aviso.

| Notebook | Origen en CAIS | Terceros | Qué se hace |
|---|---|---|---|
| `m00-l04-repaso-aprendizaje-profundo` | L2, Deep Learning Review | Stanford CS231n, tarea *FullyConnectedNets* (assignment 2), MIT. Fashion-MNIST (Zalando Research, MIT) | Gran parte del código y del texto procede de CS231n. Se reproduce con su aviso MIT (abajo). Las celdas de `Solver`, `sgd`, `sgd_momentum` y `adam` lo indican |
| `m04-l01-robustez-adversarial` | L6, Adversarial Robustness | FGSM (Goodfellow, Shlens y Szegedy, 2014, arXiv:1412.6572). PGD (Madry et al., 2017, arXiv:1706.06083). Biblioteca `robustness` de MadryLab (MIT) | Se citan los métodos. `robustness` se instala como dependencia; no se copia su código |
| `m05-l02-deteccion-anomalias` | L8, Anomaly Detection | [hendrycks/outlier-exposure](https://github.com/hendrycks/outlier-exposure), Apache License 2.0. WideResNet de hendrycks/pre-training (Apache-2.0). ViM (Wang et al., 2022) | Cuatro celdas derivan de `CIFAR/test.py` de outlier-exposure, modificadas (traducción y adaptación). Cada una lo indica en un comentario. La WideResNet se descarga aparte. ViM se implementa desde las ecuaciones del artículo |
| `m05-l05-troyanos` | L11, Trojans | Notebook original de Mantas Mazeika (CAIS). Fashion-MNIST (Zalando Research, MIT) | Se cita al autor del original |
| `m08-l05-etica-de-maquinas` | L15, Machine Ethics | `thermostat` (DFKI-NLP, Apache License 2.0) | Se importa como dependencia; no se copia su código. Los pesos del modelo se descargan desde CAIS y no se incluyen |

Los conjuntos de datos (CIFAR-10, CIFAR-100, SVHN, Fashion-MNIST, IMDB) no se incluyen:
los descarga cada notebook. Cada conjunto tiene sus propias condiciones de uso.

### Stanford CS231n

Código y texto de la tarea *FullyConnectedNets* (assignment 2), distribuida en
[cs231n/cs231n.github.io](https://github.com/cs231n/cs231n.github.io) bajo esta licencia:

```
The MIT License (MIT)

Copyright (c) 2015 Andrej Karpathy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### hendrycks/outlier-exposure

Las celdas marcadas «Basado en hendrycks/outlier-exposure» en
`m05-l02-deteccion-anomalias.ipynb` derivan de `CIFAR/test.py` de ese repositorio (Dan
Hendrycks y colaboradores) y se han modificado. Licencia: Apache License 2.0, texto
completo en [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt).

## Otras piezas

- **Vigía**, el laboratorio del módulo 6 y del proyecto final, es software del autor del
  curso con licencia MIT: [github.com/miguelferre/vigia](https://github.com/miguelferre/vigia).
  No se incluye aquí.
- **Atlas de métricas de monitorización** (`atlas/atlas.html`, publicado como
  `docs/atlas.html`): material propio del autor, bajo CC BY-NC-SA 4.0. Varias lecciones, sobre
  todo de los módulos 4 a 6, citan sus fichas, y la etiqueta «Atlas» de cada lección lleva a él.
  No depende de ningún producto comercial: sus ejemplos son sintéticos. La carcasa usa su hoja
  de estilos (`diseno/`).
- **KaTeX** (MIT) se carga desde cdnjs para pintar las fórmulas. No se incluye aquí.
