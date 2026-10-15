/* Widget "m00-l04-linea-tiempo": linea de tiempo interactiva de arquitecturas de aprendizaje profundo.
   Fechas y cifras del libro (2.3.3, pags. 99 a 101). Modo Explorar: ficha por hito, escala de anos real
   o uniforme y grafico del error top-5 en ImageNet. Modo Reto: se describe una arquitectura y hay que
   situarla. Sin dependencias; estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  /* Hitos del libro. "corto" es la etiqueta; "cuello" es lectura propia (marcada como tal en la ficha). */
  var HITOS = [
    { id: "lenet", anio: 1989, corto: "LeNet", titulo: "LeNet (CNN)", pag: "99",
      dato: "Red convolucional de Yann LeCun y su equipo en Bell Labs. Fue la primera aplicación práctica de la retropropagación; en 1998 llegó LeNet-5.",
      aporte: "Demostró que una red neuronal servía para tareas cotidianas y inspiró muchas arquitecturas posteriores.",
      limite: "Por falta de cómputo, las CNN tardaron más de una década en ganar popularidad.",
      cuello: "Llevar la retropropagación a un uso real.", cifra: "1989, con la versión LeNet-5 en 1998",
      reto: "Reutilizo un mismo filtro pequeño por toda la imagen y fui la primera aplicación práctica de la retropropagación." },
    { id: "rnn", anio: 1997, corto: "RNN y LSTM", titulo: "RNN y LSTM", pag: "99 y 100",
      dato: "Las redes recurrentes (RNN) tienen un bucle con un estado oculto que recuerda entradas anteriores, y sirven para texto, voz y series temporales. La LSTM añade tres puertas (entrada, olvido y salida) para regular qué se guarda.",
      aporte: "Modelar dependencias en el tiempo, algo que una red hacia delante corriente no captaba.",
      limite: "Las RNN eran difíciles de entrenar y flojas con patrones muy largos; la LSTM lo mejoró pero no lo eliminó.",
      cuello: "Datos secuenciales y memoria.", cifra: "3 puertas en la LSTM",
      reto: "Guardo un estado oculto que recuerda lo anterior; en mi versión mejorada, tres puertas deciden qué entra, qué se olvida y qué sale." },
    { id: "alexnet", anio: 2012, corto: "AlexNet", titulo: "AlexNet", pag: "100",
      dato: "CNN de Krizhevsky, Sutskever y Hinton con 8 capas (5 convolucionales y 3 completas). Usa ReLU, dropout y aumento de datos.",
      aporte: "Ganó el concurso de ImageNet (1000 categorías, más de un millón de imágenes) con un error top-5 de 15,3 %, frente al 26,2 % del mejor resultado anterior.",
      limite: "ReLU y dropout se explican en la lección m00/l03. El aumento de datos (propio: crear variantes de las imágenes de entrenamiento, como recortes o giros) no se desarrolla allí.",
      cuello: "Visión a gran escala.", cifra: "15,3 % de error top-5",
      reto: "Gané ImageNet con un error top-5 del 15,3 % usando ReLU, dropout y aumento de datos." },
    { id: "resnet", anio: 2015, corto: "ResNet", titulo: "ResNet", pag: "100",
      dato: "Red residual de Kaiming He y colaboradores en Microsoft: su rasgo son las conexiones residuales, que suman la entrada de una capa a su salida. El libro cita una red de 34 capas; las notas del curso hablan de hasta 152.",
      aporte: "Primer puesto en ImageNet con un error top-5 de 3,57 %. Antes de ResNet, meter demasiadas capas empeoraba incluso el ajuste al entrenamiento (según las notas).",
      limite: "Las notas fechan el artículo en 2016 (su publicación); el libro sitúa el hito en 2015.",
      cuello: "Profundidad: más capas sin rendir peor.", cifra: "3,57 % de error top-5",
      reto: "Sumo la entrada de una capa a su salida, y así las redes muy profundas dejan de rendir peor." },
    { id: "transformer", anio: 2017, corto: "Transformer", titulo: "Transformer", pag: "100 y 101",
      dato: "Presentado por Vaswani y otros en «Attention is All You Need». Procesa secuencias como las RNN, pero con autoatención (self-attention): el modelo se fija en las partes relevantes de la entrada.",
      aporte: "Una vía distinta a la recurrencia para tratar secuencias; según las notas del curso, sus bloques sostienen la mayoría de los modelos de lenguaje modernos.",
      limite: "Según el libro, BERT fue el primer uso exitoso a gran escala de los Transformers.",
      cuello: "Secuencias sin recurrencia.", cifra: "2017",
      reto: "Cada elemento de la secuencia mira a los demás mediante autoatención, sin bucle recurrente." },
    { id: "bertgpt", anio: 2018, corto: "BERT y GPT", titulo: "BERT y GPT", pag: "100 y 101",
      dato: "Ambos parten del Transformer y se preentrenan con texto masivo. BERT lee en los dos sentidos y aprende rellenando palabras enmascaradas; GPT solo mira hacia atrás y aprende a predecir lo que sigue.",
      aporte: "BERT se afina luego en preguntas y respuestas, sentimiento o reconocimiento de entidades; GPT genera texto largo con naturalidad, y por eso se popularizó más.",
      limite: "El libro avisa de que la lista omite muchos avances y que ideas hoy olvidadas podrían volver.",
      cuello: "Aprovechar texto sin etiquetar.", cifra: "2018, dos modelos",
      reto: "Somos dos modelos hermanos: uno lee en ambos sentidos y rellena huecos, el otro solo mira atrás y predice lo que viene." }
  ];
  var ERR = [
    { et: "Mejor resultado previo a 2012", v: 26.2, h: null },
    { et: "AlexNet, 2012", v: 15.3, h: "alexnet" },
    { et: "ResNet, 2015", v: 3.57, h: "resnet" }
  ];

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }

  /* Cuentas que se muestran (y que se comprueban desde fuera): intervalos y reducciones de error. */
  function calc() {
    var by = {}; HITOS.forEach(function (h) { by[h.id] = h; });
    return {
      lenet5_alexnet: 2012 - 1998,
      alexnet_bertgpt: by.bertgpt.anio - by.alexnet.anio,
      lenet_bertgpt: by.bertgpt.anio - by.lenet.anio,
      puntos_alexnet: +(ERR[0].v - ERR[1].v).toFixed(2),
      pct_alexnet: (ERR[0].v - ERR[1].v) / ERR[0].v * 100,
      puntos_resnet: +(ERR[1].v - ERR[2].v).toFixed(2),
      pct_resnet: (ERR[1].v - ERR[2].v) / ERR[1].v * 100
    };
  }

  function injectStyle() {
    if (document.getElementById("w-lt-style")) return;
    var st = document.createElement("style");
    st.id = "w-lt-style";
    st.textContent = [
      ".w-lt{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-lt h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-lt .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-lt .w-bar{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .9rem;margin:0 0 .7rem}",
      ".w-lt .w-chk{display:flex;align-items:center;gap:.45rem;color:var(--ink)}",
      ".w-lt .w-chk input{accent-color:var(--accent)}",
      ".w-lt button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-lt button:hover{background:var(--accent-soft)}",
      ".w-lt button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
      ".w-lt button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-lt .w-scroll{overflow-x:auto;margin:0 0 .5rem}",
      ".w-lt .w-axis{position:relative;height:5.2rem;margin:0 1.7rem}",
      ".w-lt .w-axis.w-real{min-width:31rem}",
      ".w-lt .w-line{position:absolute;left:0;right:0;top:2.6rem;height:2px;background:var(--rule-strong)}",
      ".w-lt .w-nodo{position:absolute;top:2.6rem;transform:translate(-50%,-50%);width:1.05rem;height:1.05rem;padding:0;border-radius:50%;border:2px solid var(--accent);background:var(--surface);transition:left .35s}",
      ".w-lt .w-nodo.on{background:var(--accent);transform:translate(-50%,-50%) scale(1.3)}",
      ".w-lt .w-nodo.ok{border-color:var(--ex);background:var(--ex)}",
      ".w-lt .w-nodo.no{border-color:var(--trap);background:var(--trap)}",
      ".w-lt .w-anio{position:absolute;transform:translateX(-50%);font:600 .7rem var(--mono);color:var(--faint);white-space:nowrap;transition:left .35s}",
      ".w-lt .w-anio.arr{top:.35rem}.w-lt .w-anio.aba{top:3.5rem}",
      ".w-lt .w-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-lt .w-chips button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-lt .w-card{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.7rem .9rem;margin:0 0 .8rem}",
      ".w-lt .w-card h5{margin:0 0 .35rem;font:600 1rem/1.25 var(--cond);color:var(--accent-ink)}",
      ".w-lt .w-card p{margin:.3rem 0}",
      ".w-lt .w-card .w-tag{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}",
      ".w-lt .w-card .w-cifra{font:600 .95rem var(--cond);color:var(--accent-ink)}",
      ".w-lt .w-fb{margin:.5rem 0 0;padding:.5rem .7rem;border-radius:8px}",
      ".w-lt .w-fb.ok{background:var(--ex-bg);border:1px solid var(--ex-rule)}",
      ".w-lt .w-fb.no{background:var(--trap-bg);border:1px solid var(--trap-rule)}",
      ".w-lt .w-err{margin:0 0 .5rem}",
      ".w-lt .w-err .w-fila{display:grid;grid-template-columns:minmax(7.5rem,11rem) 1fr 3.6rem;gap:.5rem;align-items:center;margin:.25rem 0;font-size:.84rem}",
      ".w-lt .w-err .w-pista{background:var(--code-bg);border-radius:4px;height:.85rem;overflow:hidden}",
      ".w-lt .w-err .w-rel{display:block;height:100%;background:var(--faint);border-radius:4px}",
      ".w-lt .w-err .w-fila.on .w-rel{background:var(--accent)}",
      ".w-lt .w-err .w-fila.on{font-weight:600}",
      ".w-lt .w-err .w-num{font:600 .8rem var(--mono);text-align:right}",
      ".w-lt .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function barajar(a) {
    var r = a.slice(), i, j, t;
    for (i = r.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = r[i]; r[i] = r[j]; r[j] = t;
    }
    return r;
  }

  var W = function (el) {
    injectStyle();
    var id = "w-lt-" + (++uid);
    var real = window.innerWidth >= 640, sel = 2, modo = "explorar";
    var cola = [], pos = 0, aciertos = 0, respondido = false, marca = {};
    var C = calc();

    el.innerHTML = '<div class="w-lt">' +
      '<h4>Línea de tiempo de arquitecturas</h4>' +
      '<p class="w-hint" id="' + id + '-hint"></p>' +
      '<div class="w-bar">' +
        '<label class="w-chk"><input type="checkbox" id="' + id + '-real"> Espaciar según los años reales</label>' +
        '<button type="button" id="' + id + '-modo" class="w-main"></button>' +
      '</div>' +
      '<div class="w-scroll"><div class="w-axis" id="' + id + '-axis" aria-hidden="true"><div class="w-line"></div></div></div>' +
      '<div class="w-chips" id="' + id + '-chips" role="group" aria-label="Hitos de la línea de tiempo"></div>' +
      '<div class="w-card" id="' + id + '-card" aria-live="polite"></div>' +
      '<div class="w-err" id="' + id + '-err"></div>' +
      '<p class="w-cap">Fechas y cifras del libro (sección 2.3.3, págs. 99 a 101). El «cuello de botella» de cada ficha es una lectura propia. Los cálculos de intervalos y reducciones son cuentas sencillas hechas aquí.</p>' +
      '</div>';

    function $(s) { return document.getElementById(id + "-" + s); }
    var axis = $("axis"), chips = $("chips"), card = $("card"), err = $("err");
    var min = HITOS[0].anio, max = HITOS[HITOS.length - 1].anio;

    function x(i) {
      var f = real ? (HITOS[i].anio - min) / (max - min) : i / (HITOS.length - 1);
      return (f * 100).toFixed(2) + "%";
    }

    function build() {
      var h = "", c = "";
      HITOS.forEach(function (t, i) {
        h += '<span class="w-anio ' + (i % 2 ? "aba" : "arr") + '" data-a="' + i + '" style="left:' + x(i) + '">' + t.anio + '</span>';
        h += '<button type="button" class="w-nodo" tabindex="-1" data-n="' + i + '" style="left:' + x(i) + '" title="' + t.corto + ', ' + t.anio + '"></button>';
        c += '<button type="button" data-c="' + i + '" aria-pressed="false">' + t.anio + ' ' + t.corto + '</button>';
      });
      axis.insertAdjacentHTML("beforeend", h);
      chips.innerHTML = c;
    }

    function pinta() {
      HITOS.forEach(function (t, i) {
        var n = axis.querySelector('[data-n="' + i + '"]'), a = axis.querySelector('[data-a="' + i + '"]'), b = chips.querySelector('[data-c="' + i + '"]');
        n.style.left = x(i); a.style.left = x(i);
        axis.className = "w-axis" + (real ? " w-real" : "");
        n.className = "w-nodo" + (i === sel && modo === "explorar" ? " on" : "") + (marca[i] ? " " + marca[i] : "");
        b.setAttribute("aria-pressed", i === sel && modo === "explorar" ? "true" : "false");
      });
    }

    function pintaErr() {
      var out = '<p class="w-tag" style="font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:0 0 .2rem">Error top-5 en ImageNet (menos es mejor)</p>';
      ERR.forEach(function (e) {
        var on = modo === "explorar" && e.h && HITOS[sel].id === e.h;
        out += '<div class="w-fila' + (on ? " on" : "") + '"><span>' + e.et + '</span><span class="w-pista"><span class="w-rel" style="width:' + (e.v / 30 * 100).toFixed(1) + '%"></span></span><span class="w-num">' + fmt(e.v, 2) + ' %</span></div>';
      });
      out += '<p class="w-cap">De 26,2 % a 15,3 % hay ' + fmt(C.puntos_alexnet, 1) + ' puntos (un ' + fmt(C.pct_alexnet, 0) + ' % del error previo). De 15,3 % a 3,57 % hay ' + fmt(C.puntos_resnet, 1) + ' puntos más (un ' + fmt(C.pct_resnet, 0) + ' % del error de AlexNet).</p>';
      err.innerHTML = out;
    }

    function ficha() {
      var t = HITOS[sel];
      card.innerHTML = '<h5>' + t.anio + ' · ' + t.titulo + '</h5>' +
        '<p>' + t.dato + '</p>' +
        '<p><span class="w-tag">Qué aporta</span><br>' + t.aporte + '</p>' +
        '<p><span class="w-tag">Ojo</span><br>' + t.limite + '</p>' +
        '<p><span class="w-tag">Cuello de botella (lectura propia)</span><br>' + t.cuello + '</p>' +
        '<p><span class="w-tag">Cifra clave</span> <span class="w-cifra">' + t.cifra + '</span> · libro, pág. ' + t.pag + '</p>' +
        '<p class="w-cap">Intervalos entre hitos: LeNet-5 (1998) a AlexNet (2012), ' + C.lenet5_alexnet + ' años; AlexNet a BERT y GPT (2018), ' + C.alexnet_bertgpt + ' años.</p>';
    }

    function textoRetos() {
      var t = HITOS[cola[pos]];
      card.innerHTML = '<h5>Reto ' + (pos + 1) + ' de ' + HITOS.length + ' · ¿qué hito soy?</h5>' +
        '<p>«' + t.reto + '»</p>' +
        '<p class="w-cap">Pulsa un año en la línea o un botón de abajo. Aciertos: ' + aciertos + '.</p>' +
        '<div id="' + id + '-fb"></div>';
    }

    function refresca() {
      $("hint").textContent = modo === "explorar"
        ? "Elige un hito (con el ratón o con las flechas del teclado) y lee su ficha. Con la escala real, 2015, 2017 y 2018 se apiñan y entre 1997 y 2012 queda un hueco de 15 años (las CNN esperaban cómputo, según el libro). Quita la escala real para verlos a igual distancia."
        : "Se describe una arquitectura en primera persona. Sitúala en la línea de tiempo; el resto de botones sigue el mismo orden.";
      $("modo").textContent = modo === "explorar" ? "Empezar el reto" : "Volver a explorar";
      if (modo === "explorar") { ficha(); } else { textoRetos(); }
      pinta(); pintaErr();
    }

    function elige(i) {
      if (modo === "explorar") { sel = i; refresca(); return; }
      if (respondido) return;
      respondido = true;
      var bien = i === cola[pos], fb = $("fb"), t = HITOS[cola[pos]];
      if (bien) aciertos++;
      marca = {}; marca[i] = bien ? "ok" : "no";
      if (!bien) marca[cola[pos]] = "ok";
      pinta();
      fb.className = "w-fb " + (bien ? "ok" : "no");
      fb.innerHTML = (bien ? "Correcto. " : "No: era " + t.anio + ", " + t.titulo + ". ") + t.aporte +
        ' <button type="button" id="' + id + '-sig" class="w-main">' + (pos + 1 < HITOS.length ? "Siguiente" : "Ver resultado") + '</button>';
      $("sig").addEventListener("click", siguiente);
      $("sig").focus();
    }

    function siguiente() {
      pos++; respondido = false; marca = {};
      if (pos >= HITOS.length) {
        card.innerHTML = '<h5>Resultado del reto</h5><p>' + aciertos + (aciertos === 1 ? ' acierto' : ' aciertos') + ' de ' + HITOS.length + '. ' +
          (aciertos === HITOS.length ? "Tienes la línea de tiempo en la cabeza." : "Vuelve a explorar los hitos que fallaste y repite el reto: el orden de las preguntas cambia.") + '</p>';
        pinta();
        return;
      }
      textoRetos(); pinta();
    }

    function cambiaModo() {
      if (modo === "explorar") {
        modo = "reto"; cola = barajar(HITOS.map(function (_, i) { return i; })); pos = 0; aciertos = 0; respondido = false; marca = {};
      } else { modo = "explorar"; marca = {}; }
      refresca();
    }

    build();
    $("real").checked = real;
    axis.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-n]") : null;
      if (b) elige(parseInt(b.getAttribute("data-n"), 10));
    });
    chips.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-c]") : null;
      if (b) elige(parseInt(b.getAttribute("data-c"), 10));
    });
    chips.addEventListener("keydown", function (e) {
      var i = document.activeElement && document.activeElement.getAttribute("data-c");
      if (i === null || i === undefined) return;
      i = parseInt(i, 10);
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      i = (i + d + HITOS.length) % HITOS.length;
      chips.querySelector('[data-c="' + i + '"]').focus();
      if (modo === "explorar") elige(i);
    });
    $("real").addEventListener("change", function () { real = this.checked; pinta(); });
    $("modo").addEventListener("click", cambiaModo);
    refresca();
  };

  W.calc = calc;
  W.hitos = HITOS;
  window.WIDGETS["m00-l04-linea-tiempo"] = W;
})();
