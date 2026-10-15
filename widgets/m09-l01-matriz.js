/* Simulador "m09-l01-matriz": juego 2x2 con pagos editables.
   Calcula con los pagos efectivos (pagos base menos el castigo F a quien elige su 2.a accion):
     mejor respuesta de cada jugador, estrategia dominante (estricta o debil),
     equilibrios de Nash PUROS (sin aleatorizar) y resultados eficientes de Pareto.
   Preajustes: dilema del prisionero (tabla 7.1 del libro), dilema con castigo (regla del libro, cifras
   deducidas), caza del ciervo, gallina y monedas (propios), y un dilema de proveedores (propio).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, EPS = 1e-9;

  var PRESETS = [
    { id: "dilema", nombre: "Dilema del prisionero", origen: "libro, tabla 7.1", f: 0,
      filas: ["Callar", "Confesar"], cols: ["Callar", "Confesar"],
      p: [[[-1, -1], [-8, 0]], [[0, -8], [-3, -3]]],
      nota: "Pagos del libro: años de cárcel en negativo (Fila = Alice, Columna = Bob)." },
    { id: "castigo", nombre: "Dilema con castigo", origen: "libro, regla de la p. 378; cifras deducidas", f: 3,
      filas: ["Callar", "Confesar"], cols: ["Callar", "Confesar"],
      p: [[[-1, -1], [-8, 0]], [[0, -8], [-3, -3]]],
      nota: "Mismo dilema, pero quien confiesa recibe un castigo de 3 años. Las cifras se deducen de la regla aplicada a los dos: el panel derecho de la figura 7.5 solo castiga a Alice y no cuadra con ella." },
    { id: "ciervo", nombre: "Caza del ciervo", origen: "propio; el libro solo nombra el juego (fig. 7.5)", f: 0,
      filas: ["Ciervo", "Liebre"], cols: ["Ciervo", "Liebre"],
      p: [[[4, 4], [0, 3]], [[3, 0], [3, 3]]],
      nota: "Cazar el ciervo exige a los dos; la liebre la caza cada uno por su cuenta. Ejemplo: dos hospitales que adoptan o no un estándar de datos común." },
    { id: "gallina", nombre: "Gallina", origen: "propio", f: 0,
      filas: ["Ceder", "Mantener"], cols: ["Ceder", "Mantener"],
      p: [[[3, 3], [1, 5]], [[5, 1], [0, 0]]],
      nota: "Si los dos mantienen su postura hay choque; conviene ser el único que no cede." },
    { id: "monedas", nombre: "Monedas (suma cero)", origen: "propio", f: 0,
      filas: ["Cara", "Cruz"], cols: ["Cara", "Cruz"],
      p: [[[1, -1], [-1, 1]], [[-1, 1], [1, -1]]],
      nota: "Uno gana si coinciden y el otro si no. En un juego así no hay equilibrio puro." },
    { id: "proveedores", nombre: "Dos proveedores en una licitación", origen: "propio, cifras inventadas", f: 0,
      filas: ["Documentar límites", "Prometer sin matices"], cols: ["Documentar límites", "Prometer sin matices"],
      p: [[[3, 3], [0, 5]], [[5, 0], [1, 1]]],
      nota: "Margen anual en millones de euros de dos proveedores de IA clínica que licitan a un hospital." }
  ];

  function injectStyle() {
    if (document.getElementById("w-mx-style")) return;
    var st = document.createElement("style");
    st.id = "w-mx-style";
    st.textContent = [
      ".w-mx{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-mx h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-mx .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-mx .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .5rem}",
      ".w-mx button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-mx button:hover{background:var(--accent-soft)}",
      ".w-mx button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-mx .w-src{color:var(--muted);font-size:.8rem;margin:0 0 .8rem;min-height:2.4em}",
      ".w-mx .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-mx .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-mx .w-f{margin:0 0 .8rem;max-width:24rem}",
      ".w-mx input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-mx table.w-tab{display:table;overflow:visible;width:100%;max-width:none;border-collapse:separate;border-spacing:.35rem;table-layout:fixed;margin:0 0 .5rem}",
      ".w-mx th{font:600 .8rem/1.25 var(--cond);text-transform:none;letter-spacing:0;color:var(--ink);text-align:center;vertical-align:middle;padding:.2rem .1rem}",
      ".w-mx th.w-corner{width:4.6rem;font:600 .64rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-mx th small{display:block;font:500 .7rem/1.2 var(--mono);color:var(--accent-ink);margin-top:.15rem}",
      ".w-mx td{background:var(--ground);border:2px solid var(--rule);border-radius:8px;padding:.45rem .4rem;vertical-align:top}",
      ".w-mx td.w-nash{border-color:var(--accent);background:var(--accent-soft)}",
      ".w-mx .w-pay{display:flex;align-items:center;justify-content:space-between;gap:.3rem;margin:0 0 .25rem}",
      ".w-mx .w-pay span{font:600 .62rem/1.2 var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--faint)}",
      ".w-mx .w-pay input{width:3.9rem;font:600 .95rem var(--mono);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:6px;padding:.25rem .3rem;text-align:right}",
      ".w-mx .w-pay input.w-br{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft);text-decoration:underline}",
      ".w-mx .w-eff{display:block;font:500 .72rem/1.2 var(--mono);color:var(--muted);margin:0 0 .2rem}",
      ".w-mx .w-chip{display:inline-block;font:600 .68rem/1.2 var(--cond);border-radius:5px;padding:.15rem .4rem;margin:.1rem .2rem 0 0;border:1px solid var(--rule-strong)}",
      ".w-mx .w-chip.n{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-mx .w-chip.e{background:var(--ex-bg);border-color:var(--ex);color:var(--ex)}",
      ".w-mx .w-chip.i{background:var(--trap-bg);border-color:var(--trap);color:var(--trap)}",
      ".w-mx dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:.6rem 0 .8rem}",
      ".w-mx dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-mx dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-mx dl.w-out dd{margin:0;font:600 .95rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-mx .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-mx .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      "@media (max-width:520px){.w-mx{padding:.8rem .6rem}.w-mx table.w-tab{border-spacing:.2rem}.w-mx th.w-corner{width:3.9rem;font-size:.55rem;padding:0}.w-mx th{font-size:.7rem}.w-mx td{padding:.3rem .25rem}.w-mx .w-pay input{width:3rem;font-size:.85rem;padding:.2rem}.w-mx .w-pay span{font-size:.55rem}.w-mx .w-eff{font-size:.64rem}.w-mx .w-chip{font-size:.62rem}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: 2 }); }

  /* E[i][j] = [pago de la Fila, pago de la Columna] con los pagos efectivos. */
  function analyze(E) {
    var i, j, k, l, m, r = { brA: [[0, 0], [0, 0]], brB: [[0, 0], [0, 0]], nash: [[0, 0], [0, 0]],
      eff: [[0, 0], [0, 0]], dom: [[0, 0], [0, 0]], up: [[[], []], [[], []]] };
    for (j = 0; j < 2; j++) {
      m = Math.max(E[0][j][0], E[1][j][0]);
      for (i = 0; i < 2; i++) r.brA[i][j] = E[i][j][0] >= m - EPS ? 1 : 0;
    }
    for (i = 0; i < 2; i++) {
      m = Math.max(E[i][0][1], E[i][1][1]);
      for (j = 0; j < 2; j++) r.brB[i][j] = E[i][j][1] >= m - EPS ? 1 : 0;
    }
    for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
      r.nash[i][j] = r.brA[i][j] && r.brB[i][j] ? 1 : 0;
      r.eff[i][j] = 1;
      for (k = 0; k < 2; k++) for (l = 0; l < 2; l++) {
        if (k === i && l === j) continue;
        if (E[k][l][0] >= E[i][j][0] - EPS && E[k][l][1] >= E[i][j][1] - EPS &&
            (E[k][l][0] > E[i][j][0] + EPS || E[k][l][1] > E[i][j][1] + EPS)) {
          r.eff[i][j] = 0; r.up[i][j].push([k, l]);
        }
      }
    }
    function cmp(s, t) {
      if (s > EPS && t > EPS) return 2;
      if (s >= -EPS && t >= -EPS && (s > EPS || t > EPS)) return 1;
      return 0;
    }
    r.rowDom = [-1, 0]; r.colDom = [-1, 0];
    for (i = 0; i < 2; i++) {
      var c = cmp(E[i][0][0] - E[1 - i][0][0], E[i][1][0] - E[1 - i][1][0]);
      if (c > r.rowDom[1]) r.rowDom = [i, c];
      c = cmp(E[0][i][1] - E[0][1 - i][1], E[1][i][1] - E[1][1 - i][1]);
      if (c > r.colDom[1]) r.colDom = [i, c];
    }
    var sums = [E[0][0][0] + E[0][0][1], E[0][1][0] + E[0][1][1], E[1][0][0] + E[1][0][1], E[1][1][0] + E[1][1][1]];
    var allZero = sums.every(function (s) { return Math.abs(s) < EPS; });
    var same = sums.every(function (s) { return Math.abs(s - sums[0]) < EPS; });
    r.suma = allZero ? "suma cero" : same ? "suma constante (no cero)" : "suma variable";
    return r;
  }

  window.WIDGETS["m09-l01-matriz"] = function (el) {
    injectStyle();
    var id = "w-mx-" + (++uid);
    var P = PRESETS[0], base, F = 0, filas, cols;
    function copy(p) { return p.map(function (r) { return r.map(function (c) { return c.slice(); }); }); }

    var btns = PRESETS.map(function (p, n) {
      return '<button type="button" data-p="' + n + '" aria-pressed="false">' + p.nombre + '</button>';
    }).join("");
    var cells = "";
    [0, 1].forEach(function (i) {
      cells += '<tr><th scope="row" id="' + id + '-r' + i + '"></th>';
      [0, 1].forEach(function (j) {
        cells += '<td id="' + id + '-c' + i + j + '">' +
          '<div class="w-pay"><span>Fila</span><input type="number" step="0.5" id="' + id + '-a' + i + j + '"></div>' +
          '<div class="w-pay"><span>Columna</span><input type="number" step="0.5" id="' + id + '-b' + i + j + '"></div>' +
          '<span class="w-eff" id="' + id + '-e' + i + j + '"></span>' +
          '<div id="' + id + '-k' + i + j + '"></div></td>';
      });
      cells += '</tr>';
    });

    el.innerHTML = '<div class="w-mx">' +
      '<h4>Matriz 2×2 de pagos</h4>' +
      '<p class="w-hint">Cada celda lleva dos pagos: el de la Fila (arriba) y el de la Columna (abajo). Edítalos o elige un preajuste. Recuadro de pago: mejor respuesta. Celda resaltada: equilibrio de Nash puro.</p>' +
      '<div class="w-btns" role="group" aria-label="Preajustes">' + btns + '</div>' +
      '<p class="w-src" id="' + id + '-src"></p>' +
      '<div class="w-f"><label for="' + id + '-f">Castigo por elegir la 2.ª acción <b id="' + id + '-fv"></b></label><input type="range" id="' + id + '-f" min="0" max="8" step="0.5" value="0"></div>' +
      '<table class="w-tab"><thead><tr><th class="w-corner" scope="col">Fila ↓ / Columna →</th><th scope="col" id="' + id + '-h0"></th><th scope="col" id="' + id + '-h1"></th></tr></thead><tbody>' + cells + '</tbody></table>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Estrategia dominante de la Fila</dt><dd id="' + id + '-o-rd"></dd></div>' +
      '<div><dt>Estrategia dominante de la Columna</dt><dd id="' + id + '-o-cd"></dd></div>' +
      '<div><dt>Equilibrios de Nash puros</dt><dd id="' + id + '-o-n"></dd></div>' +
      '<div><dt>Resultados eficientes de Pareto</dt><dd id="' + id + '-o-e"></dd></div>' +
      '<div><dt>Tipo de suma</dt><dd id="' + id + '-o-s"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Solo se buscan equilibrios puros (sin aleatorizar). El castigo resta el mismo valor a quien elige su segunda acción; los pagos que ves en cada celda son los base, y debajo, en gris, los efectivos cuando hay castigo.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var pbtns = el.querySelectorAll("button[data-p]");

    function readBase() {
      [0, 1].forEach(function (i) { [0, 1].forEach(function (j) {
        var a = parseFloat($("a" + i + j).value), b = parseFloat($("b" + i + j).value);
        base[i][j] = [isNaN(a) ? 0 : a, isNaN(b) ? 0 : b];
      }); });
    }
    function names() {
      [0, 1].forEach(function (i) {
        $("r" + i).textContent = filas[i];
        $("h" + i).textContent = cols[i];
      });
      [0, 1].forEach(function (i) { [0, 1].forEach(function (j) {
        var w = "Fila elige " + filas[i] + " y Columna elige " + cols[j];
        $("a" + i + j).setAttribute("aria-label", "Pago de la Fila cuando " + w);
        $("b" + i + j).setAttribute("aria-label", "Pago de la Columna cuando " + w);
      }); });
    }
    function label(i, j) { return filas[i] + " / " + cols[j]; }

    function update() {
      var E = [[0, 0], [0, 0]], i, j, R, t;
      for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
        E[i][j] = [base[i][j][0] - (i === 1 ? F : 0), base[i][j][1] - (j === 1 ? F : 0)];
      }
      R = analyze(E);
      $("fv").textContent = fmt(F);
      var nashList = [], effList = [];
      for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
        var td = $("c" + i + j);
        td.className = R.nash[i][j] ? "w-nash" : "";
        $("a" + i + j).className = R.brA[i][j] ? "w-br" : "";
        $("b" + i + j).className = R.brB[i][j] ? "w-br" : "";
        $("e" + i + j).textContent = F > 0 ? "efectivo: " + fmt(E[i][j][0]) + " / " + fmt(E[i][j][1]) + " · suma " + fmt(E[i][j][0] + E[i][j][1]) :
          "suma " + fmt(E[i][j][0] + E[i][j][1]);
        $("k" + i + j).innerHTML = (R.nash[i][j] ? '<span class="w-chip n">Equilibrio de Nash</span>' : "") +
          (R.eff[i][j] ? '<span class="w-chip e">Eficiente</span>' : '<span class="w-chip i">Ineficiente</span>');
        if (R.nash[i][j]) nashList.push(label(i, j) + " (" + fmt(E[i][j][0]) + ", " + fmt(E[i][j][1]) + ")");
        if (R.eff[i][j]) effList.push(label(i, j));
      }
      function domText(d, nm) {
        if (d[0] < 0) return "ninguna";
        return nm[d[0]] + (d[1] === 2 ? " (estricta)" : " (débil)");
      }
      $("o-rd").textContent = domText(R.rowDom, filas);
      $("o-cd").textContent = domText(R.colDom, cols);
      $("o-n").textContent = nashList.length ? nashList.join("; ") : "ninguno";
      $("o-e").textContent = effList.join("; ");
      $("o-s").textContent = R.suma;

      var nn = nashList.length, txt = "";
      if (nn === 0) {
        txt = "No hay equilibrio de Nash puro: en cada celda alguien querría cambiar. Para hallar equilibrio habría que aleatorizar (estrategias mixtas), y eso queda fuera de esta lección.";
      } else if (nn === 4) {
        txt = "Todas las celdas son equilibrio: a nadie le importa lo que elija. Cambia algún pago.";
      } else {
        var bad = [];
        for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) if (R.nash[i][j] && !R.eff[i][j]) bad.push([i, j]);
        if (nn === 1) {
          i = -1;
          for (t = 0; t < 4; t++) if (R.nash[t >> 1][t & 1]) i = t;
          var ni = i >> 1, nj = i & 1;
          if (bad.length) {
            var ups = R.up[ni][nj].map(function (c) { return label(c[0], c[1]); }).join(" o ");
            txt = "Hay un solo equilibrio, " + label(ni, nj) + ", y es ineficiente: pasar a " + ups + " sería una mejora de Pareto. " +
              (R.rowDom[1] === 2 && R.colDom[1] === 2 ? "Los dos tienen estrategia dominante estricta: es la estructura del dilema del prisionero. " : "") +
              "Es el caso de agentes racionales que acaban peor de lo que podrían.";
          } else {
            txt = "Hay un solo equilibrio, " + label(ni, nj) + ", y es eficiente: aquí la racionalidad individual no lleva a una trampa.";
          }
        } else if (nn === 2) {
          var diag = R.nash[0][0] && R.nash[1][1];
          txt = diag ? "Dos equilibrios en los que los dos eligen la misma posición (juego de coordinación, como la caza del ciervo): " + nashList.join(" y ") + ". "
                     : "Dos equilibrios en los que cada uno elige lo contrario del otro (como la gallina): " + nashList.join(" y ") + ". ";
          txt += bad.length ? "Alguno es ineficiente: los agentes pueden quedar atrapados en él aunque exista uno mejor para los dos."
                            : "Los dos son eficientes, pero pueden repartir de forma muy distinta: la pregunta es cuál se elige.";
          if (bad.length && diag) txt += " Aquí el problema no es la tentación de desertar, sino la confianza: hace falta que ambos crean que el otro irá al equilibrio bueno.";
        } else {
          txt = "Hay " + nn + " equilibrios de Nash puros.";
        }
      }
      $("note").textContent = txt;
    }

    function setPreset(n) {
      P = PRESETS[n]; base = copy(P.p); F = P.f; filas = P.filas; cols = P.cols;
      [0, 1].forEach(function (i) { [0, 1].forEach(function (j) {
        $("a" + i + j).value = base[i][j][0];
        $("b" + i + j).value = base[i][j][1];
      }); });
      $("f").value = F;
      names();
      $("src").textContent = P.nombre + " (" + P.origen + "). " + P.nota;
      Array.prototype.forEach.call(pbtns, function (b) { b.setAttribute("aria-pressed", String(parseInt(b.getAttribute("data-p"), 10) === n)); });
      update();
    }
    function edited() {
      readBase();
      Array.prototype.forEach.call(pbtns, function (b) { b.setAttribute("aria-pressed", "false"); });
      $("src").textContent = "Juego personalizado: has cambiado algún pago o el castigo. Vuelve a pulsar un preajuste para restaurarlo.";
      update();
    }

    Array.prototype.forEach.call(pbtns, function (b) {
      b.addEventListener("click", function () { setPreset(parseInt(b.getAttribute("data-p"), 10)); });
    });
    [0, 1].forEach(function (i) { [0, 1].forEach(function (j) {
      $("a" + i + j).addEventListener("input", edited);
      $("b" + i + j).addEventListener("input", edited);
    }); });
    $("f").addEventListener("input", function () { F = parseFloat($("f").value) || 0; edited(); });

    setPreset(0);
  };
  window.WIDGETS["m09-l01-matriz"]._analyze = analyze;
})();
