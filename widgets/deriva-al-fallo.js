/* Widget "deriva-al-fallo": modelo PROPIO y simplificado de deriva hacia el fallo (no es un modelo del libro).
   Un margen de seguridad se relaja un poco cada periodo por la presión; si no hay accidente, la nueva norma se asienta.
   Cada R periodos una revisión recupera una fracción de lo relajado. Sin dependencias; estilos con variables del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var T = 60;            // periodos simulados
  var STEP = 0.5;        // puntos de margen que relaja cada unidad de presión por periodo
  var P0 = 0.0005;       // probabilidad de accidente con el margen de diseño (propia)
  var PMAX = 0.25;       // probabilidad de accidente con margen 0 (propia)
  var RIESGO_ALTO = 30;  // por debajo de este margen se pinta la zona de riesgo alto

  function injectStyle() {
    if (document.getElementById("w-df-style")) return;
    var st = document.createElement("style");
    st.id = "w-df-style";
    st.textContent = [
      ".w-df{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-df h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-df .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-df .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem;margin:0 0 .7rem}",
      ".w-df .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.3rem}",
      ".w-df .w-f label b{color:var(--accent-ink);font-weight:700}",
      ".w-df input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-df select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-df .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-df button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-df button:hover{background:var(--accent-soft)}",
      ".w-df dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-df dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-df dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-df dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-df .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .9rem}",
      ".w-df .w-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(18rem,1fr));gap:.8rem}",
      ".w-df svg{display:block;width:100%;height:auto;font-family:var(--sans)}",
      ".w-df .w-ct{font:600 .7rem/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:0 0 .3rem}",
      ".w-df .w-cap{color:var(--faint);font-size:.76rem;margin:.6rem 0 0}",
      ".w-df details{margin:.6rem 0 0;font-size:.82rem}",
      ".w-df table{border-collapse:collapse;width:100%;margin-top:.4rem}",
      ".w-df th,.w-df td{border-bottom:1px solid var(--rule);padding:.25rem .4rem;text-align:right;font-family:var(--mono)}",
      ".w-df th:first-child,.w-df td:first-child{text-align:left}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fix(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pAcc(m) { var g = 1 - m / 100; return P0 + (PMAX - P0) * g * g * g; }

  function rng(seed) {   // mulberry32: una tirada uniforme por periodo, fija para cada semilla
    var a = seed >>> 0, out = [], i, t;
    for (i = 0; i < T; i++) {
      a = (a + 0x6D2B79F5) >>> 0;
      t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      out.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
    }
    return out;
  }

  function trayectoria(presion, reaccion, cada) {
    var m = 100, ms = [], ps = [], cs = [], surv = 1, t, p;
    for (t = 1; t <= T; t++) {
      m = Math.max(0, m - STEP * presion);
      if (reaccion > 0 && t % cada === 0) m = m + reaccion / 100 * (100 - m);
      p = pAcc(m);
      surv *= 1 - p;
      ms.push(m); ps.push(p); cs.push(1 - surv);
    }
    return { m: ms, p: ps, c: cs };
  }

  // Geometría común de las dos gráficas (viewBox 360 x 200)
  var W = 360, H = 200, L = 36, R = 34, TOP = 10, B = 26;
  function X(t) { return L + (t / T) * (W - L - R); }
  function Y(v, vmax) { return TOP + (1 - v / vmax) * (H - TOP - B); }

  function ejes(vmax, marcas, fmt, xlabel) {
    var s = "", i;
    for (i = 0; i < marcas.length; i++) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(marcas[i], vmax) + '" y2="' + Y(marcas[i], vmax) + '" style="stroke:var(--rule)"/>' +
        '<text x="' + (L - 5) + '" y="' + (Y(marcas[i], vmax) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10.5px">' + fmt(marcas[i]) + '</text>';
    }
    [0, 20, 40, 60].forEach(function (t) {
      s += '<text x="' + X(t) + '" y="' + (H - 10) + '" text-anchor="middle" style="fill:var(--muted);font-size:10.5px">' + t + '</text>';
    });
    s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 1) + '" text-anchor="middle" style="fill:var(--faint);font-size:10px">' + xlabel + '</text>';
    return s;
  }
  function dibujaMargen(tr, acc) {
    var s = '<rect x="' + L + '" y="' + Y(RIESGO_ALTO, 100) + '" width="' + (W - L - R) + '" height="' + (Y(0, 100) - Y(RIESGO_ALTO, 100)) + '" style="fill:var(--trap-bg)"/>';
    s += ejes(100, [0, 25, 50, 75, 100], function (v) { return v; }, "periodo");
    s += '<text x="' + (L + 4) + '" y="' + (Y(RIESGO_ALTO, 100) + 12) + '" style="fill:var(--trap);font-size:10px">zona de riesgo alto</text>';
    var pts = [X(0) + "," + Y(100, 100)], i, upto = acc > 0 ? acc : T, a = pts.slice(), b = [];
    for (i = 1; i <= T; i++) {
      var pt = X(i) + "," + Y(tr.m[i - 1], 100);
      if (i <= upto) a.push(pt);
      if (acc > 0 && i >= acc) b.push(pt);
    }
    s += '<polyline points="' + a.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.4;stroke-linejoin:round"/>';
    if (b.length > 1) s += '<polyline points="' + b.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:1.6;stroke-dasharray:4 3;opacity:.4"/>';
    if (acc > 0) {
      s += '<circle cx="' + X(acc) + '" cy="' + Y(tr.m[acc - 1], 100) + '" r="5.5" style="fill:var(--trap);stroke:var(--surface);stroke-width:1.5"/>' +
        '<text x="' + Math.min(X(acc), W - R - 46) + '" y="' + (Y(tr.m[acc - 1], 100) - 9) + '" style="fill:var(--trap);font-size:10.5px;font-weight:700">accidente</text>';
    }
    return s;
  }

  function dibujaProb(tr, acc) {
    var s = ejes(PMAX, [0, 0.05, 0.1, 0.15, 0.2, 0.25], function (v) { return Math.round(v * 100) + " %"; }, "periodo"), i, w = (W - L - R) / T * 0.72, pts = [X(0) + "," + Y(0, 1)];
    for (i = 1; i <= T; i++) {
      var h = Y(0, PMAX) - Y(tr.p[i - 1], PMAX);
      s += '<rect x="' + (X(i) - w / 2) + '" y="' + Y(tr.p[i - 1], PMAX) + '" width="' + w + '" height="' + Math.max(h, 0.5) + '" style="fill:var(--ex);opacity:' + (acc > 0 && i > acc ? 0.3 : 0.9) + '"/>';
      pts.push(X(i) + "," + Y(tr.c[i - 1], 1));
    }
    s += '<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--trap);stroke-width:2"/>';
    [0, 0.5, 1].forEach(function (v) {
      s += '<text x="' + (W - R + 4) + '" y="' + (Y(v, 1) + 4) + '" style="fill:var(--trap);font-size:10.5px">' + Math.round(v * 100) + ' %</text>';
    });
    return s;
  }

  window.WIDGETS["deriva-al-fallo"] = function (el) {
    injectStyle();
    var id = "w-df-" + (++uid);
    var seed = 7;
    el.innerHTML = '<div class="w-df">' +
      '<h4>Deriva hacia el fallo</h4>' +
      '<p class="w-hint">Modelo propio y simplificado (no es del libro). El margen de seguridad empieza en 100. Cada periodo la presión lo relaja un poco y, si no pasa nada, la nueva norma se queda.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-pr">Presión <b id="' + id + '-prv"></b></label><input type="range" id="' + id + '-pr" min="0" max="10" step="0.5" value="4"></div>' +
      '<div class="w-f"><label for="' + id + '-re">Reacción de la organización <b id="' + id + '-rev"></b></label><input type="range" id="' + id + '-re" min="0" max="100" step="5" value="0"></div>' +
      '<div class="w-f"><label for="' + id + '-ca">Revisión cada</label><select id="' + id + '-ca"><option value="2">2 periodos</option><option value="4">4 periodos</option><option value="6" selected>6 periodos</option><option value="12">12 periodos</option></select></div>' +
      '</div>' +
      '<div class="w-btns" role="group" aria-label="Escenarios y sorteo">' +
      '<button type="button" data-a="sin">Sin reacción</button>' +
      '<button type="button" data-a="con">Revisión firme cada 4 periodos</button>' +
      '<button type="button" data-a="otra">Otra historia (nuevo sorteo)</button>' +
      '</div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Margen al final (periodo 60)</dt><dd id="' + id + '-o-m"></dd></div>' +
      '<div><dt>Probabilidad de accidente en el último periodo</dt><dd id="' + id + '-o-p"></dd></div>' +
      '<div><dt>Probabilidad acumulada en 60 periodos</dt><dd id="' + id + '-o-c"></dd></div>' +
      '<div><dt>Primer periodo con 1 % o más</dt><dd id="' + id + '-o-f"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-hist" aria-live="polite"></p>' +
      '<div class="w-charts">' +
      '<div><p class="w-ct">Margen de seguridad</p><svg id="' + id + '-g1" viewBox="0 0 360 200" role="img"></svg></div>' +
      '<div><p class="w-ct">Probabilidad por periodo (barras) y acumulada (línea)</p><svg id="' + id + '-g2" viewBox="0 0 360 200" role="img"></svg></div>' +
      '</div>' +
      '<details><summary>Ver los valores en una tabla</summary><div id="' + id + '-tab"></div></details>' +
      '<p class="w-cap">Reglas del modelo, todas propias: cada unidad de presión resta 0,5 puntos de margen por periodo; la probabilidad de accidente por periodo es 0,05 % con margen 100 y sube con el cubo de lo relajado hasta 25 % con margen 0; la revisión recupera la fracción indicada de lo relajado. Las barras claras y la línea discontinua son lo que habría pasado sin el accidente del sorteo.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inPr = $("pr"), inRe = $("re"), inCa = $("ca");

    function run() {
      var pr = parseFloat(inPr.value), re = parseFloat(inRe.value), ca = parseInt(inCa.value, 10);
      $("prv").textContent = fix(pr, 1);
      $("rev").textContent = re + " %";
      inCa.disabled = re === 0;
      var tr = trayectoria(pr, re, ca), u = rng(seed), acc = 0, i, first = 0;
      for (i = 0; i < T; i++) {
        if (!acc && u[i] < tr.p[i]) acc = i + 1;
        if (!first && tr.p[i] >= 0.01) first = i + 1;
      }
      $("o-m").textContent = fix(tr.m[T - 1], 1);
      $("o-p").textContent = fix(tr.p[T - 1] * 100, 2) + " %";
      $("o-c").textContent = fix(tr.c[T - 1] * 100, 1) + " %";
      $("o-f").textContent = first ? "periodo " + first : "nunca";
      $("hist").textContent = acc
        ? "Historia " + seed + ": accidente en el periodo " + acc + ", con el margen en " + fix(tr.m[acc - 1], 1) + ". Hasta entonces, ninguna de las relajaciones había dado problemas."
        : "Historia " + seed + ": sin accidente en 60 periodos. Cada periodo tranquilo refuerza la idea de que el margen sobraba, aunque el riesgo acumulado sea " + fix(tr.c[T - 1] * 100, 1) + " %.";
      var g1 = $("g1"), g2 = $("g2");
      g1.innerHTML = dibujaMargen(tr, acc);
      g2.innerHTML = dibujaProb(tr, acc);
      g1.setAttribute("aria-label", "Margen de seguridad por periodo: empieza en 100 y termina en " + fix(tr.m[T - 1], 1) + (acc ? ". Accidente en el periodo " + acc + "." : ". Sin accidente en la historia."));
      g2.setAttribute("aria-label", "Probabilidad de accidente por periodo: llega a " + fix(tr.p[T - 1] * 100, 2) + " % en el último periodo. Probabilidad acumulada: " + fix(tr.c[T - 1] * 100, 1) + " %.");
      var rows = "<table><thead><tr><th>Periodo</th><th>Margen</th><th>Prob. periodo</th><th>Prob. acumulada</th></tr></thead><tbody>";
      [1, 10, 20, 30, 40, 50, 60].forEach(function (t) {
        rows += "<tr><td>" + t + "</td><td>" + fix(tr.m[t - 1], 1) + "</td><td>" + fix(tr.p[t - 1] * 100, 2) + " %</td><td>" + fix(tr.c[t - 1] * 100, 1) + " %</td></tr>";
      });
      $("tab").innerHTML = rows + "</tbody></table>";
    }

    inPr.addEventListener("input", run);
    inRe.addEventListener("input", run);
    inCa.addEventListener("change", run);
    Array.prototype.forEach.call(el.querySelectorAll("button[data-a]"), function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-a");
        if (a === "sin") { inRe.value = "0"; }
        if (a === "con") { inRe.value = "60"; inCa.value = "4"; }
        if (a === "otra") { seed = seed + 1; }
        run();
      });
    });
    run();
  };
})();
