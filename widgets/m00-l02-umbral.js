/* Simulador "m00-l02-umbral": un modelo de cribado da a cada paciente una puntuacion; se avisa
   cuando la puntuacion supera un umbral. Los sanos puntuan N(0,1) y los enfermos N(d,1). Con 1000
   pacientes muestra la matriz de confusion, la exactitud, la precision, el recall y el AUROC, y
   deja mover la prevalencia, la separacion y el umbral. Calculo exacto, sin azar.
   Sin dependencias; estilos con las variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, N = 1000;

  function injectStyle() {
    if (document.getElementById("w-um-style")) return;
    var st = document.createElement("style");
    st.id = "w-um-style";
    st.textContent = [
      ".w-um{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-um h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-um .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-um .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-um .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-um .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-um input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-um button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer;margin:0 0 .8rem}",
      ".w-um button:hover{background:var(--accent-soft)}",
      ".w-um svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-um table.w-cm{border-collapse:collapse;width:100% !important;min-width:0 !important;margin:0 0 .8rem;text-align:center}",
      ".w-um .w-cm th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);padding:.35rem .4rem}",
      ".w-um .w-cm td{border:1px solid var(--rule);padding:.5rem .4rem;font:600 1.1rem/1.2 var(--cond);background:var(--ground)}",
      ".w-um .w-cm td small{display:block;font:500 .68rem var(--sans);color:var(--muted)}",
      ".w-um .w-cm td.ok{background:var(--ex-bg);color:var(--ex)}",
      ".w-um .w-cm td.bad{background:var(--trap-bg);color:var(--trap)}",
      ".w-um dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(8.6rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-um dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-um dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-um dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-um .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-um .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(x) { return fmt(x * 100, 1) + " %"; }

  /* Funcion de distribucion normal estandar (aproximacion de Abramowitz y Stegun 7.1.26). */
  function erf(x) {
    var s = x < 0 ? -1 : 1, t;
    x = Math.abs(x); t = 1 / (1 + 0.3275911 * x);
    return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  }
  function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function pdf(z) { return Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); }

  /* Cuentas de la matriz de confusion para una prevalencia p, separacion d y umbral t. */
  function counts(p, d, t) {
    var sick = Math.round(N * p), well = N - sick;
    var tp = Math.round(sick * (1 - Phi(t - d))), fp = Math.round(well * (1 - Phi(t)));
    return { tp: tp, fn: sick - tp, fp: fp, tn: well - fp, sick: sick, well: well };
  }
  function metrics(c) {
    return {
      acc: (c.tp + c.tn) / N,
      prec: c.tp + c.fp > 0 ? c.tp / (c.tp + c.fp) : NaN,
      rec: c.sick > 0 ? c.tp / c.sick : NaN
    };
  }

  window.WIDGETS["m00-l02-umbral"] = function (el) {
    injectStyle();
    var id = "w-um-" + (++uid);
    var P = 2, D = 2, T = 1.5;

    el.innerHTML = '<div class="w-um">' +
      '<h4>Umbral, prevalencia y matriz de confusión</h4>' +
      '<p class="w-hint">Un modelo de cribado puntúa a 1000 pacientes. Los sanos puntúan en torno a 0 y los enfermos en torno a la separación elegida. Se da la alarma cuando la puntuación supera el umbral.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-p">Prevalencia <b id="' + id + '-pv"></b></label><input type="range" id="' + id + '-p" min="0.5" max="50" step="0.5" value="' + P + '"></div>' +
      '<div class="w-f"><label for="' + id + '-d">Separación de las clases <b id="' + id + '-dv"></b></label><input type="range" id="' + id + '-d" min="0" max="4" step="0.1" value="' + D + '"></div>' +
      '<div class="w-f"><label for="' + id + '-t">Umbral de alarma <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="-1" max="5" step="0.1" value="' + T + '"></div>' +
      '</div>' +
      '<button type="button" id="' + id + '-rst">Restablecer</button>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 190" role="img" aria-label=""></svg>' +
      '<table class="w-cm" aria-label="Matriz de confusión"><thead><tr><th></th><th scope="col">Con alarma</th><th scope="col">Sin alarma</th></tr></thead><tbody>' +
      '<tr><th scope="row">Enfermos</th><td class="ok" id="' + id + '-tp"></td><td class="bad" id="' + id + '-fn"></td></tr>' +
      '<tr><th scope="row">Sanos</th><td class="bad" id="' + id + '-fp"></td><td class="ok" id="' + id + '-tn"></td></tr>' +
      '</tbody></table>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Exactitud</dt><dd id="' + id + '-o-a"></dd></div>' +
      '<div><dt>Precisión</dt><dd id="' + id + '-o-p"></dd></div>' +
      '<div><dt>Recall</dt><dd id="' + id + '-o-r"></dd></div>' +
      '<div><dt>AUROC</dt><dd id="' + id + '-o-u"></dd></div>' +
      '<div><dt>Exactitud de "todos sanos"</dt><dd id="' + id + '-o-z"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Cálculo exacto con distribuciones normales de desviación 1, redondeado a pacientes enteros. El AUROC no depende del umbral ni de la prevalencia.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inP = $("p"), inD = $("d"), inT = $("t"), svg = $("svg");

    function draw() {
      var o = [], W = 600, H = 190, L = 12, R = 588, B = 158, TP = 14, z, x, y, dh = 120;
      var xs = function (v) { return L + (v + 3.5) / 10.5 * (R - L); };
      var g = "", s = "";
      for (z = -3.5; z <= 7.0001; z += 0.1) {
        x = xs(z);
        y = B - pdf(z) / pdf(0) * dh;
        g += (z < -3.4 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
        y = B - pdf(z - D) / pdf(0) * dh;
        s += (z < -3.4 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
      }
      o.push('<line x1="' + L + '" y1="' + B + '" x2="' + R + '" y2="' + B + '" style="stroke:var(--rule-strong)"/>');
      o.push('<path d="' + g + '" style="fill:none;stroke:var(--ex);stroke-width:2.5"/>');
      o.push('<path d="' + s + '" style="fill:none;stroke:var(--trap);stroke-width:2.5"/>');
      o.push('<line x1="' + xs(T).toFixed(1) + '" y1="' + TP + '" x2="' + xs(T).toFixed(1) + '" y2="' + B + '" style="stroke:var(--ink);stroke-width:2"/>');
      o.push('<text x="' + (xs(T) + 6).toFixed(1) + '" y="' + (TP + 14) + '" style="fill:var(--ink);font-size:16px;font-family:var(--sans)">alarma →</text>');
      o.push('<text x="' + xs(0).toFixed(1) + '" y="' + (B + 16) + '" text-anchor="middle" style="fill:var(--ex);font-size:16px;font-family:var(--sans)">sanos</text>');
      o.push('<text x="' + xs(D).toFixed(1) + '" y="' + (B + 16) + '" text-anchor="middle" style="fill:var(--trap);font-size:16px;font-family:var(--sans)">' + (D < 0.8 ? "enfermos (casi encima)" : "enfermos") + '</text>');
      o.push('<text x="' + R + '" y="' + (H - 4) + '" text-anchor="end" style="fill:var(--muted);font-size:14px;font-family:var(--sans)">puntuación del modelo</text>');
      svg.innerHTML = o.join("");
    }

    function update() {
      var p = P / 100, c = counts(p, D, T), m = metrics(c), au = Phi(D / Math.SQRT2), zero = 1 - p, msg;
      $("pv").textContent = fmt(P, 1) + " %";
      $("dv").textContent = fmt(D, 1);
      $("tv").textContent = fmt(T, 1);
      $("tp").innerHTML = c.tp + "<small>verdaderos positivos</small>";
      $("fn").innerHTML = c.fn + "<small>falsos negativos</small>";
      $("fp").innerHTML = c.fp + "<small>falsos positivos</small>";
      $("tn").innerHTML = c.tn + "<small>verdaderos negativos</small>";
      $("o-a").textContent = pc(m.acc);
      $("o-p").textContent = isNaN(m.prec) ? "sin alarmas" : pc(m.prec);
      $("o-r").textContent = isNaN(m.rec) ? "sin enfermos" : pc(m.rec);
      $("o-u").textContent = fmt(au, 3);
      $("o-z").textContent = pc(zero) + " (recall 0 %)";
      if (m.acc < zero + 0.005) {
        msg = "La exactitud (" + pc(m.acc) + ") no mejora, o mejora apenas, la de un modelo que no avisa nunca (" + pc(zero) + "), aunque este detecta al " + (isNaN(m.rec) ? "0" : fmt(m.rec * 100, 1)) + " % de los enfermos. La exactitud no sirve para juzgarlo. Mira la precisión y el recall.";
      } else {
        msg = "La exactitud (" + pc(m.acc) + ") supera a la de \"todos sanos\" (" + pc(zero) + "). Sube el umbral y verás que la precisión crece y el recall cae; bájalo y pasa al revés.";
      }
      $("note").textContent = msg;
      svg.setAttribute("aria-label", "Dos curvas de puntuación, sanos y enfermos, con separación " + fmt(D, 1) + " y umbral de alarma en " + fmt(T, 1) + ".");
      draw();
    }

    inP.addEventListener("input", function () { P = parseFloat(inP.value); update(); });
    inD.addEventListener("input", function () { D = parseFloat(inD.value); update(); });
    inT.addEventListener("input", function () { T = parseFloat(inT.value); update(); });
    $("rst").addEventListener("click", function () {
      P = 2; D = 2; T = 1.5; inP.value = "2"; inD.value = "2"; inT.value = "1.5"; update();
    });
    update();
  };
  window.WIDGETS["m00-l02-umbral"]._calc = { counts: counts, metrics: metrics, Phi: Phi };
})();
