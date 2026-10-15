/* Simulador "m05-l02-auroc": detector de anomalias con dos distribuciones de puntuacion (normales y anomalas)
   de solapamiento ajustable, un umbral movible, la curva ROC (o la de precision-exhaustividad) y las metricas
   AUROC, AUPR y FPR al 95 % de TPR. Modelo propio de juguete: normales ~ N(0, 1), anomalas ~ N(d, s^2);
   alarma si puntuacion >= umbral. AUROC = Phi(d / raiz(1 + s^2)) es exacto para dos gaussianas; el AUPR se integra
   numericamente. Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var XMIN = -4, XMAX = 10;   // rango fijo del eje de puntuaciones
  var Z95 = 1.6448536269514722; // Q(Z95) = 0,05

  /* --- nucleo numerico --- */
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
      t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function Q(x) { return 0.5 * erfc(x / Math.SQRT2); }          // P(Z > x), Z normal tipica
  function dens(x, m, s) { var z = (x - m) / s; return Math.exp(-0.5 * z * z) / (s * Math.sqrt(2 * Math.PI)); }

  function punto(d, s, pi, t) {
    var tpr = Q((t - d) / s), fpr = Q(t), tp = pi * tpr, fp = (1 - pi) * fpr;
    return { tpr: tpr, fpr: fpr, prec: (tp + fp) > 0 ? tp / (tp + fp) : 1, acc: tp + (1 - pi) * (1 - fpr), tp: tp, fp: fp };
  }
  function auroc(d, s) { return 1 - Q(d / Math.sqrt(1 + s * s)); }
  function fpr95(d, s) { return Q(d - Z95 * s); }
  /* precision media (AUPR): barrido de umbrales de mayor a menor, sum (R_i - R_{i-1}) * P_i */
  function aupr(d, s, pi) {
    var n = 6000, hi = d + 9 * s, lo = -9, i, t, p, ap = 0, prev = 0;
    for (i = 0; i <= n; i++) {
      t = hi - (hi - lo) * i / n;
      p = punto(d, s, pi, t);
      ap += (p.tpr - prev) * p.prec;
      prev = p.tpr;
    }
    return ap;
  }
  /* umbral que maximiza la exactitud (barrido fino) */
  function mejorExactitud(d, s, pi) {
    var best = XMIN, ba = -1, t, a;
    for (t = XMIN - 4; t <= XMAX + 6; t += 0.01) {
      a = punto(d, s, pi, t).acc;
      if (a > ba) { ba = a; best = t; }
    }
    return best;
  }
  /* umbral con TPR = 95 % */
  function umbral95(d, s) { return d - Z95 * s; }

  function fmt(x, dd) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: dd, maximumFractionDigits: dd }); }
  function pct(x, dd) { return fmt(100 * x, dd === undefined ? 1 : dd) + " %"; }

  function injectStyle() {
    if (document.getElementById("w-au-style")) return;
    var st = document.createElement("style");
    st.id = "w-au-style";
    st.textContent = [
      ".w-au{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-au h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-au .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-au .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-au .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-au .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-au input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-au select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-au .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-au button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-au button:hover{background:var(--accent-soft)}",
      ".w-au .w-plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:0 0 .7rem}",
      ".w-au svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-au dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-au dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-au dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-au dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-au .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-au .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m05-l02-auroc"] = function (el) {
    injectStyle();
    var id = "w-au-" + (++uid);
    var D0 = 20, S0 = 10, PI0 = "0.01", T0 = 20;   // d = 2,0; s = 1,0; prevalencia 1 %; umbral 1,0 (pasos de 0,05)
    var D = D0, S = S0, PI = parseFloat(PI0), T = T0, CURVA = "roc";

    el.innerHTML = '<div class="w-au">' +
      '<h4>Detector de anomalías: umbral, curvas y métricas</h4>' +
      '<p class="w-hint">Cada imagen recibe una puntuación de anomalía: cuanto más alta, más rara. Las normales (gris) se reparten alrededor de 0. Las anómalas (violeta) están desplazadas. Salta la alarma si la puntuación llega al umbral.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-d">Separación de las medias <b id="' + id + '-dv"></b></label><input type="range" id="' + id + '-d" min="0" max="50" step="1" value="' + D0 + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Dispersión de las anómalas <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="5" max="16" step="1" value="' + S0 + '"></div>' +
      '<div class="w-f"><label for="' + id + '-p">Prevalencia de anomalías</label><select id="' + id + '-p">' +
        '<option value="0.001">0,1 %</option><option value="0.005">0,5 %</option><option value="0.01" selected>1 %</option>' +
        '<option value="0.05">5 %</option><option value="0.1">10 %</option><option value="0.2">20 %</option><option value="0.5">50 %</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-t">Umbral de alarma <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="-60" max="180" step="1" value="' + T0 + '"></div>' +
      '<div class="w-f"><label for="' + id + '-c">Curva que se dibuja</label><select id="' + id + '-c"><option value="roc" selected>Curva ROC</option><option value="pr">Precisión y exhaustividad</option></select></div>' +
      '</div>' +
      '<div class="w-btns">' +
      '<button type="button" id="' + id + '-b95">Umbral con TPR = 95 %</button>' +
      '<button type="button" id="' + id + '-bex">Umbral de máxima exactitud</button>' +
      '<button type="button" id="' + id + '-bre">Restablecer</button>' +
      '</div>' +
      '<div class="w-plots"><svg id="' + id + '-sv1" viewBox="0 0 420 240" role="img" aria-label=""></svg>' +
      '<svg id="' + id + '-sv2" viewBox="0 0 260 240" role="img" aria-label=""></svg></div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>TPR (anomalías cazadas)</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>FPR (normales molestadas)</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Precisión de las alarmas</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Exactitud (detector mudo)</dt><dd id="' + id + '-o4"></dd></div>' +
      '<div><dt>AUROC</dt><dd id="' + id + '-o5"></dd></div>' +
      '<div><dt>AUPR</dt><dd id="' + id + '-o6"></dd></div>' +
      '<div><dt>FPR al 95 % de TPR</dt><dd id="' + id + '-o7"></dd></div>' +
      '<div><dt>Alarmas por 10.000 imágenes</dt><dd id="' + id + '-o8"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo de juguete propio: normales N(0, 1) y anómalas N(d, s²). AUROC exacto para dos gaussianas; AUPR por integración numérica. Ejemplo de uso: puntuaciones de imágenes de un escáner distinto al de entrenamiento.</p>' +
      '</div>';

    function $(k) { return el.querySelector("#" + id + "-" + k); }
    var inD = $("d"), inS = $("s"), inP = $("p"), inT = $("t"), inC = $("c"), s1 = $("sv1"), s2 = $("sv2");
    function tval() { return T * 0.05; }

    function drawDens(d, s, t) {
      var out = [], i, x, ymax = Math.max(dens(0, 0, 1), dens(d, d, s)) * 1.12, n = 200;
      function px(v) { return 10 + (v - XMIN) / (XMAX - XMIN) * 400; }
      function py(v) { return 205 - v / ymax * 185; }
      var nor = [], ano = [], fa = [], ok = [];
      for (i = 0; i <= n; i++) {
        x = XMIN + (XMAX - XMIN) * i / n;
        nor.push(px(x).toFixed(1) + "," + py(dens(x, 0, 1)).toFixed(1));
        ano.push(px(x).toFixed(1) + "," + py(dens(x, d, s)).toFixed(1));
        if (x >= t) {
          fa.push(px(x).toFixed(1) + "," + py(dens(x, 0, 1)).toFixed(1));
          ok.push(px(x).toFixed(1) + "," + py(dens(x, d, s)).toFixed(1));
        }
      }
      if (fa.length) {
        out.push('<polygon points="' + px(t).toFixed(1) + ',205 ' + fa.join(" ") + ' 410,205" style="fill:var(--trap);opacity:.4"/>');
        out.push('<polygon points="' + px(t).toFixed(1) + ',205 ' + ok.join(" ") + ' 410,205" style="fill:var(--accent);opacity:.3"/>');
      }
      out.push('<line x1="10" y1="205" x2="410" y2="205" style="stroke:var(--rule-strong);stroke-width:1"/>');
      for (i = XMIN; i <= XMAX; i += 2) {
        out.push('<line x1="' + px(i) + '" y1="205" x2="' + px(i) + '" y2="209" style="stroke:var(--rule-strong)"/>');
        out.push('<text x="' + px(i) + '" y="221" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + i + '</text>');
      }
      out.push('<text x="210" y="236" text-anchor="middle" style="fill:var(--muted);font-size:11px">puntuación de anomalía</text>');
      out.push('<polyline points="' + nor.join(" ") + '" style="fill:none;stroke:var(--muted);stroke-width:2"/>');
      out.push('<polyline points="' + ano.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      out.push('<line x1="' + px(t).toFixed(1) + '" y1="14" x2="' + px(t).toFixed(1) + '" y2="205" style="stroke:var(--ink);stroke-width:1.5;stroke-dasharray:5 3"/>');
      out.push('<text x="' + Math.min(px(t) + 5, 330).toFixed(1) + '" y="24" style="fill:var(--ink);font-size:11px">umbral ' + fmt(t, 2) + '</text>');
      out.push('<text x="' + px(-1.2).toFixed(1) + '" y="' + (py(dens(-1, 0, 1)) - 4).toFixed(1) + '" text-anchor="end" style="fill:var(--muted);font-size:11px">normales</text>');
      out.push('<text x="' + Math.min(px(d + 1.2 * s), 380).toFixed(1) + '" y="' + (py(dens(d + s, d, s)) - 4).toFixed(1) + '" style="fill:var(--accent-ink);font-size:11px">anómalas</text>');
      s1.innerHTML = out.join("");
    }

    function drawCurva(d, s, pi, t, p) {
      var out = [], i, n = 300, pts = [], hi = d + 9 * s, lo = -9, tt, q, X0 = 42, Y0 = 205, W = 190, H = 190;
      function cx(v) { return X0 + v * W; }
      function cy(v) { return Y0 - v * H; }
      for (i = 0; i <= 4; i++) {
        out.push('<line x1="' + cx(i / 4) + '" y1="' + Y0 + '" x2="' + cx(i / 4) + '" y2="' + (Y0 - H) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<line x1="' + X0 + '" y1="' + cy(i / 4) + '" x2="' + (X0 + W) + '" y2="' + cy(i / 4) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + cx(i / 4) + '" y="' + (Y0 + 13) + '" text-anchor="middle" style="fill:var(--muted);font-size:10px">' + fmt(i / 4, 2) + '</text>');
        out.push('<text x="' + (X0 - 5) + '" y="' + (cy(i / 4) + 3) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + fmt(i / 4, 2) + '</text>');
      }
      for (i = 0; i <= n; i++) {
        tt = hi - (hi - lo) * i / n; q = punto(d, s, pi, tt);
        pts.push(CURVA === "roc" ? [q.fpr, q.tpr] : [q.tpr, q.prec]);
      }
      var poly = pts.map(function (a) { return cx(a[0]).toFixed(1) + "," + cy(a[1]).toFixed(1); }).join(" ");
      if (CURVA === "roc") {
        out.push('<polygon points="' + cx(0) + ',' + cy(0) + ' ' + poly + ' ' + cx(1) + ',' + cy(0) + '" style="fill:var(--accent-soft);opacity:.9"/>');
        out.push('<line x1="' + cx(0) + '" y1="' + cy(0) + '" x2="' + cx(1) + '" y2="' + cy(1) + '" style="stroke:var(--faint);stroke-dasharray:4 3"/>');
        out.push('<line x1="' + cx(0) + '" y1="' + cy(0.95) + '" x2="' + cx(1) + '" y2="' + cy(0.95) + '" style="stroke:var(--trap);stroke-dasharray:2 3"/>');
        out.push('<polyline points="' + poly + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
        out.push('<rect x="' + (cx(fpr95(d, s)) - 3.5) + '" y="' + (cy(0.95) - 3.5) + '" width="7" height="7" style="fill:var(--trap)"/>');
        out.push('<circle cx="' + cx(p.fpr).toFixed(1) + '" cy="' + cy(p.tpr).toFixed(1) + '" r="5.5" style="fill:var(--ink);stroke:var(--surface);stroke-width:1.5"/>');
        out.push('<text x="' + (X0 + W / 2) + '" y="236" text-anchor="middle" style="fill:var(--muted);font-size:11px">FPR (falsas alarmas entre normales)</text>');
        out.push('<text x="10" y="' + (Y0 - H / 2) + '" transform="rotate(-90 10 ' + (Y0 - H / 2) + ')" text-anchor="middle" style="fill:var(--muted);font-size:11px">TPR</text>');
        s2.setAttribute("aria-label", "Curva ROC con AUROC " + fmt(auroc(d, s), 3) + ". Punto actual: FPR " + fmt(p.fpr, 3) + ", TPR " + fmt(p.tpr, 3) + ".");
      } else {
        out.push('<line x1="' + cx(0) + '" y1="' + cy(pi) + '" x2="' + cx(1) + '" y2="' + cy(pi) + '" style="stroke:var(--faint);stroke-dasharray:4 3"/>');
        out.push('<polyline points="' + poly + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
        out.push('<circle cx="' + cx(p.tpr).toFixed(1) + '" cy="' + cy(p.prec).toFixed(1) + '" r="5.5" style="fill:var(--ink);stroke:var(--surface);stroke-width:1.5"/>');
        out.push('<text x="' + (X0 + W / 2) + '" y="236" text-anchor="middle" style="fill:var(--muted);font-size:11px">exhaustividad (TPR)</text>');
        out.push('<text x="10" y="' + (Y0 - H / 2) + '" transform="rotate(-90 10 ' + (Y0 - H / 2) + ')" text-anchor="middle" style="fill:var(--muted);font-size:11px">precisión</text>');
        out.push('<text x="' + (X0 + 6) + '" y="' + (cy(pi) - 5) + '" style="fill:var(--muted);font-size:10px">línea de azar = prevalencia</text>');
        s2.setAttribute("aria-label", "Curva de precisión frente a exhaustividad con AUPR " + fmt(aupr(d, s, pi), 3) + ". Punto actual: exhaustividad " + fmt(p.tpr, 3) + ", precisión " + fmt(p.prec, 3) + ".");
      }
      s2.innerHTML = out.join("");
    }

    function update() {
      var d = D / 10, s = S / 10, pi = PI, t = tval(), p = punto(d, s, pi, t);
      var A = auroc(d, s), P = aupr(d, s, pi), F95 = fpr95(d, s), note;
      $("dv").textContent = fmt(d, 1);
      $("sv").textContent = fmt(s, 1);
      $("tv").textContent = fmt(t, 2);
      $("o1").textContent = pct(p.tpr);
      $("o2").textContent = pct(p.fpr);
      $("o3").textContent = pct(p.prec);
      $("o4").textContent = pct(p.acc) + " (mudo: " + pct(1 - pi) + ")";
      $("o5").textContent = fmt(A, 3);
      $("o6").textContent = fmt(P, 3);
      $("o7").textContent = pct(F95);
      var nc = Math.round(10000 * p.tp), nf = Math.round(10000 * p.fp);
      $("o8").textContent = fmt(nc + nf, 0) + " (" + fmt(nc, 0) + " ciertas, " + fmt(nf, 0) + " falsas)";
      if (d === 0 && s === 1) {
        note = "Las dos distribuciones coinciden: el detector no distingue nada. AUROC " + fmt(A, 2) + " (azar) y AUPR " + fmt(P, 3) + ", igual a la prevalencia.";
      } else if (A >= 0.85 && P < 0.5 && pi <= 0.05) {
        note = "AUROC " + fmt(A, 2) + " pero AUPR " + fmt(P, 2) + ": el detector ordena bien, pero con anomalías raras casi todo lo que marca es falsa alarma. Con este umbral, solo " + pct(p.prec, 0) + " de las alarmas son anomalías reales.";
      } else if (A < 0.7) {
        note = "Con tanto solapamiento, cualquier umbral sacrifica algo: para cazar el 95 % de las anomalías (TPR) molestas al " + pct(F95, 0) + " de las normales.";
      } else {
        note = "Para cazar el 95 % de las anomalías el umbral debe bajar a " + fmt(umbral95(d, s), 2) + ", y entonces molestas al " + pct(F95, 0) + " de las normales (FPR95). Mueve el umbral y mira qué punto de la curva ocupa el círculo.";
      }
      $("note").textContent = note;
      s1.setAttribute("aria-label", "Dos distribuciones de puntuación: normales con media 0 y anómalas con media " + fmt(d, 1) + " y desviación " + fmt(s, 1) + ". Umbral en " + fmt(t, 2) + ". Sombreado ámbar: normales que disparan alarma; violeta: anomalías detectadas.");
      drawDens(d, s, t);
      drawCurva(d, s, pi, t, p);
    }

    function clampT(v) { return Math.max(-60, Math.min(180, Math.round(v / 0.05))); }
    inD.addEventListener("input", function () { D = parseInt(inD.value, 10); update(); });
    inS.addEventListener("input", function () { S = parseInt(inS.value, 10); update(); });
    inP.addEventListener("change", function () { PI = parseFloat(inP.value); update(); });
    inT.addEventListener("input", function () { T = parseInt(inT.value, 10); update(); });
    inC.addEventListener("change", function () { CURVA = inC.value; update(); });
    $("b95").addEventListener("click", function () { T = clampT(umbral95(D / 10, S / 10)); inT.value = String(T); update(); });
    $("bex").addEventListener("click", function () { T = clampT(mejorExactitud(D / 10, S / 10, PI)); inT.value = String(T); update(); });
    $("bre").addEventListener("click", function () {
      D = D0; S = S0; PI = parseFloat(PI0); T = T0; CURVA = "roc";
      inD.value = String(D); inS.value = String(S); inP.value = PI0; inT.value = String(T); inC.value = "roc"; update();
    });
    update();
  };
  window.WIDGETS["m05-l02-auroc"]._nucleo = { Q: Q, punto: punto, auroc: auroc, aupr: aupr, fpr95: fpr95, umbral95: umbral95, mejorExactitud: mejorExactitud };
})();
