/* Simulador "m00-l02-ajuste": ajusta un polinomio a datos clinicos sinteticos (presion arterial
   sistolica frente a edad) por descenso de gradiente y muestra la perdida en entrenamiento y en
   validacion para ver subajuste y sobreajuste. Los datos son inventados y llevan un ruido de
   7 mmHg (el error que ningun modelo puede bajar de media). Sin dependencias; estilos con las
   variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var NOISE = 7, MU = 125, SC = 20;          /* ruido (mmHg), centro y escala para normalizar */
  var T = 4000, E = 40, LR = 0.02, NS = T / E; /* pasos totales, cada cuantos se guarda, tasa, muestras */
  var AGE0 = 20, AGE1 = 80, Y0 = 80, Y1 = 180;

  function injectStyle() {
    if (document.getElementById("w-aj-style")) return;
    var st = document.createElement("style");
    st.id = "w-aj-style";
    st.textContent = [
      ".w-aj{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-aj h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-aj .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-aj .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-aj .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-aj .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-aj input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-aj .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem;color:var(--ink)}",
      ".w-aj .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-aj .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-aj button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-aj button:hover{background:var(--accent-soft)}",
      ".w-aj .w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-aj .w-plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.6rem;margin:0 0 .7rem}",
      ".w-aj svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-aj dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-aj dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-aj dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-aj dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-aj .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-aj .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* Generador pseudoaleatorio con semilla (mulberry32) y normal por Box-Muller. */
  function rng(seed) {
    var a = seed | 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* Relacion "verdadera" inventada: sube con la edad hasta los 57 anos y luego se aplana. */
  function truth(age) { return 112 + 32 * Math.sin(Math.PI * (age - AGE0) / 75); }

  function makeData(n, seed) {
    var r = rng(seed), out = [], i, a;
    for (i = 0; i < n; i++) { a = AGE0 + 60 * r(); out.push([a, truth(a) + NOISE * gauss(r)]); }
    return out;
  }
  var VAL = makeData(60, 999);   /* validacion fija: pacientes que el modelo no ve al entrenar */

  /* Base de Chebyshev en la edad reescalada a [-1, 1]: mantiene bien condicionado el ajuste. */
  function feat(age, deg) {
    var x = (age - 50) / 30, f = [1, x], k;
    for (k = 2; k <= deg; k++) f.push(2 * x * f[k - 1] - f[k - 2]);
    return f.slice(0, deg + 1);
  }
  function predictN(w, age) { var f = feat(age, w.length - 1), s = 0, j; for (j = 0; j < w.length; j++) s += w[j] * f[j]; return s; }
  function mse(w, X, y) {
    var s = 0, i, j, e;
    for (i = 0; i < X.length; i++) { e = -y[i]; for (j = 0; j < w.length; j++) e += w[j] * X[i][j]; s += e * e; }
    return s / X.length;
  }

  /* Descenso de gradiente sobre el ECM. Guarda pesos y perdidas cada E pasos. */
  function trainModel(tr, deg) {
    var Xt = tr.map(function (p) { return feat(p[0], deg); }), yt = tr.map(function (p) { return (p[1] - MU) / SC; });
    var Xv = VAL.map(function (p) { return feat(p[0], deg); }), yv = VAL.map(function (p) { return (p[1] - MU) / SC; });
    var w = [], j, i, t, g, e, n = Xt.length;
    for (j = 0; j <= deg; j++) w.push(0);
    var res = { snaps: [w.slice()], tl: [Math.sqrt(mse(w, Xt, yt)) * SC], vl: [Math.sqrt(mse(w, Xv, yv)) * SC] };
    for (t = 1; t <= T; t++) {
      g = []; for (j = 0; j <= deg; j++) g.push(0);
      for (i = 0; i < n; i++) {
        e = -yt[i]; for (j = 0; j <= deg; j++) e += w[j] * Xt[i][j];
        for (j = 0; j <= deg; j++) g[j] += 2 * e * Xt[i][j] / n;
      }
      for (j = 0; j <= deg; j++) w[j] -= LR * g[j];
      if (t % E === 0) {
        res.snaps.push(w.slice());
        res.tl.push(Math.sqrt(mse(w, Xt, yt)) * SC);
        res.vl.push(Math.sqrt(mse(w, Xv, yv)) * SC);
      }
    }
    return res;
  }

  window.WIDGETS["m00-l02-ajuste"] = function (el) {
    injectStyle();
    var id = "w-aj-" + (++uid);
    var deg = 9, n = 12, seed = 1, si = NS, showTruth = false;
    var data, model;

    el.innerHTML = '<div class="w-aj">' +
      '<h4>Ajuste de un polinomio a datos clínicos sintéticos</h4>' +
      '<p class="w-hint">Datos inventados: presión arterial sistólica (mmHg) frente a la edad. Puntos rellenos: pacientes de entrenamiento. Puntos huecos: 60 pacientes de validación que el modelo no ve al entrenar.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-g">Grado del polinomio <b id="' + id + '-gv"></b></label><input type="range" id="' + id + '-g" min="1" max="9" step="1" value="' + deg + '"></div>' +
      '<div class="w-f"><label for="' + id + '-n">Pacientes de entrenamiento <b id="' + id + '-nv"></b></label><input type="range" id="' + id + '-n" min="8" max="60" step="2" value="' + n + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Pasos de entrenamiento <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="0" max="' + NS + '" step="1" value="' + si + '"></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-t"><span>Dibujar la relación real (solo se puede porque los datos son sintéticos)</span></label>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-best">Ir al mejor paso según validación</button><button type="button" id="' + id + '-new">Nuevo lote de pacientes</button><button type="button" id="' + id + '-rst">Restablecer</button></div>' +
      '<div class="w-plots">' +
      '<svg id="' + id + '-p1" viewBox="0 0 400 260" role="img" aria-label=""></svg>' +
      '<svg id="' + id + '-p2" viewBox="0 0 400 260" role="img" aria-label=""></svg>' +
      '</div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Error en entrenamiento (RMSE)</dt><dd id="' + id + '-o-t"></dd></div>' +
      '<div><dt>Error en validación (RMSE)</dt><dd id="' + id + '-o-v"></dd></div>' +
      '<div><dt>Validación / entrenamiento</dt><dd id="' + id + '-o-r"></dd></div>' +
      '<div><dt>Mínimo posible (ruido)</dt><dd>' + NOISE + ' mmHg</dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">RMSE es la raíz del error cuadrático medio, en mmHg. El modelo minimiza el error cuadrático medio solo sobre los pacientes de entrenamiento. Con el error mostrado por encima de 20 mmHg, la curva de error se recorta en el gráfico. Cada paso de la barra es un bloque de ' + E + ' pasos de descenso de gradiente.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inG = $("g"), inN = $("n"), inS = $("s"), inT = $("t"), p1 = $("p1"), p2 = $("p2");

    function refit() { data = makeData(n, seed); model = trainModel(data, deg); }
    function bestIdx() { var b = 0, i; for (i = 1; i <= NS; i++) if (model.vl[i] < model.vl[b]) b = i; return b; }

    var W = 400, H = 260, ML = 44, MR = 10, MT = 10, MB = 36;
    function px(a) { return ML + (a - AGE0) / (AGE1 - AGE0) * (W - ML - MR); }
    function py(y) { return MT + (Y1 - y) / (Y1 - Y0) * (H - MT - MB); }
    function qx(t) { return ML + t / T * (W - ML - MR); }
    function qy(v) { return MT + (20 - Math.min(v, 20)) / 20 * (H - MT - MB); }
    function ln(x1, y1, x2, y2, extra) {
      return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" style="stroke:var(--rule);stroke-width:1;' + (extra || "") + '"/>';
    }
    function tx(x, y, s, anchor, col, size) {
      return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || "middle") + '" style="fill:' + (col || "var(--muted)") + ';font-size:' + (size || 12) + 'px;font-family:var(--sans)">' + s + '</text>';
    }

    function draw1(w) {
      var o = [], a, v, d, i, k;
      o.push('<defs><clipPath id="' + id + '-c1"><rect x="' + ML + '" y="' + MT + '" width="' + (W - ML - MR) + '" height="' + (H - MT - MB) + '"/></clipPath></defs>');
      for (v = Y0; v <= Y1; v += 20) { o.push(ln(ML, py(v), W - MR, py(v))); o.push(tx(ML - 5, py(v) + 3, String(v), "end")); }
      for (a = AGE0; a <= AGE1; a += 20) { o.push(ln(px(a), MT, px(a), H - MB)); o.push(tx(px(a), H - MB + 13, String(a))); }
      o.push(tx((ML + W - MR) / 2, H - 6, "Edad (años)"));
      o.push('<text transform="rotate(-90 11 ' + ((MT + H - MB) / 2) + ')" x="11" y="' + ((MT + H - MB) / 2) + '" text-anchor="middle" style="fill:var(--muted);font-size:12px;font-family:var(--sans)">Presión sistólica (mmHg)</text>');
      o.push('<g clip-path="url(#' + id + '-c1)">');
      if (showTruth) {
        d = "";
        for (a = AGE0; a <= AGE1; a += 1) d += (a === AGE0 ? "M" : "L") + px(a).toFixed(1) + " " + py(truth(a)).toFixed(1);
        o.push('<path d="' + d + '" style="fill:none;stroke:var(--ex);stroke-width:2;stroke-dasharray:5 4"/>');
      }
      d = "";
      for (a = AGE0; a <= AGE1; a += 0.5) {
        v = predictN(w, a) * SC + MU;
        v = Math.max(Y0 - 60, Math.min(Y1 + 60, v));
        d += (a === AGE0 ? "M" : "L") + px(a).toFixed(1) + " " + py(v).toFixed(1);
      }
      o.push('<path d="' + d + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      for (i = 0; i < VAL.length; i++) o.push('<circle cx="' + px(VAL[i][0]).toFixed(1) + '" cy="' + py(VAL[i][1]).toFixed(1) + '" r="3" style="fill:none;stroke:var(--faint);stroke-width:1.3"/>');
      for (k = 0; k < data.length; k++) o.push('<circle cx="' + px(data[k][0]).toFixed(1) + '" cy="' + py(data[k][1]).toFixed(1) + '" r="3.6" style="fill:var(--accent-ink);stroke:var(--surface);stroke-width:1"/>');
      o.push('</g>');
      p1.innerHTML = o.join("");
    }

    function draw2() {
      var o = [], v, t, d, i;
      for (v = 0; v <= 20; v += 5) { o.push(ln(ML, qy(v), W - MR, qy(v))); o.push(tx(ML - 5, qy(v) + 3, String(v), "end")); }
      for (t = 0; t <= T; t += 1000) { o.push(ln(qx(t), MT, qx(t), H - MB)); o.push(tx(qx(t), H - MB + 13, t === 0 ? "0" : fmt(t, 0))); }
      o.push(tx((ML + W - MR) / 2, H - 6, "Pasos de entrenamiento"));
      o.push('<text transform="rotate(-90 11 ' + ((MT + H - MB) / 2) + ')" x="11" y="' + ((MT + H - MB) / 2) + '" text-anchor="middle" style="fill:var(--muted);font-size:12px;font-family:var(--sans)">Error RMSE (mmHg)</text>');
      o.push(ln(ML, qy(NOISE), W - MR, qy(NOISE), "stroke:var(--ex);stroke-dasharray:5 4;stroke-width:1.5"));
      o.push(tx(W - MR - 3, qy(NOISE) - 4, "ruido: " + NOISE, "end", "var(--ex)"));
      d = ""; for (i = 0; i <= NS; i++) d += (i === 0 ? "M" : "L") + qx(i * E).toFixed(1) + " " + qy(model.tl[i]).toFixed(1);
      o.push('<path d="' + d + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      d = ""; for (i = 0; i <= NS; i++) d += (i === 0 ? "M" : "L") + qx(i * E).toFixed(1) + " " + qy(model.vl[i]).toFixed(1);
      o.push('<path d="' + d + '" style="fill:none;stroke:var(--trap);stroke-width:2.5"/>');
      o.push(ln(qx(si * E), MT, qx(si * E), H - MB, "stroke:var(--ink);stroke-width:1.5"));
      o.push('<rect x="' + (ML + 6) + '" y="' + (MT + 6) + '" width="10" height="3" style="fill:var(--accent)"/>' + tx(ML + 21, MT + 11, "entrenamiento", "start", "var(--ink)"));
      o.push('<rect x="' + (ML + 118) + '" y="' + (MT + 6) + '" width="10" height="3" style="fill:var(--trap)"/>' + tx(ML + 133, MT + 11, "validación", "start", "var(--ink)"));
      p2.innerHTML = o.join("");
    }

    function update(extra) {
      var w = model.snaps[si], tl = model.tl[si], vl = model.vl[si], r = vl / tl, msg;
      $("gv").textContent = String(deg);
      $("nv").textContent = String(n);
      $("sv").textContent = fmt(si * E, 0) + " de " + fmt(T, 0);
      $("o-t").textContent = fmt(tl, 1) + " mmHg";
      $("o-v").textContent = fmt(vl, 1) + " mmHg";
      $("o-r").textContent = "× " + fmt(r, 2);
      if (tl > 1.25 * NOISE && vl > 1.25 * NOISE) {
        msg = "Subajuste: el error es alto tanto en entrenamiento como en validación. El modelo todavía no recoge la forma de los datos. Sube el grado o deja que entrene más pasos.";
      } else if (r > 1.4 && vl > 1.2 * NOISE) {
        msg = "Brecha grande: en entrenamiento acierta mucho más que en validación. El modelo ha aprendido rasgos de estos pacientes concretos que no se repiten (sobreajuste). Prueba a bajar el grado, a sumar pacientes o a parar antes.";
      } else {
        msg = "Ajuste razonable: el error en validación está cerca de lo mínimo posible (el ruido de " + NOISE + " mmHg) y no hay brecha grande con el entrenamiento.";
      }
      $("note").textContent = msg + (extra ? " " + extra : "");
      p1.setAttribute("aria-label", "Presión sistólica frente a edad: " + n + " puntos de entrenamiento, 60 de validación y la curva de grado " + deg + " tras " + (si * E) + " pasos.");
      p2.setAttribute("aria-label", "Error de entrenamiento y de validación según los pasos de entrenamiento. Ahora: " + fmt(tl, 1) + " y " + fmt(vl, 1) + " mmHg.");
      draw1(w);
      draw2();
    }

    inG.addEventListener("input", function () { deg = parseInt(inG.value, 10); refit(); update(); });
    inN.addEventListener("input", function () { n = parseInt(inN.value, 10); refit(); update(); });
    inS.addEventListener("input", function () { si = parseInt(inS.value, 10); update(); });
    inT.addEventListener("change", function () { showTruth = inT.checked; update(); });
    $("best").addEventListener("click", function () {
      si = bestIdx(); inS.value = String(si);
      update("El mejor paso según validación es el " + fmt(si * E, 0) + " (error " + fmt(model.vl[si], 1) + " mmHg). Parar ahí se llama parada temprana.");
    });
    $("new").addEventListener("click", function () { seed++; refit(); update(); });
    $("rst").addEventListener("click", function () {
      deg = 9; n = 12; seed = 1; si = NS; showTruth = false;
      inG.value = String(deg); inN.value = String(n); inS.value = String(si); inT.checked = false;
      refit(); update();
    });

    refit();
    update();
  };
  window.WIDGETS["m00-l02-ajuste"]._calc = { makeData: makeData, trainModel: trainModel, truth: truth, VAL: VAL, T: T, E: E };
})();
