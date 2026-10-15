/* Simulador "m05-l03-reglas-propias": puntuacion esperada de tres reglas al reportar una probabilidad p
   cuando la probabilidad verdadera de que ocurra el evento es q. Una regla es propia si su mejor
   valor esperado se logra diciendo p = q. Brier y log loss lo son; el error absoluto no.
   Formulas propias: Brier E = q(1-p)^2 + (1-q)p^2; log loss E = -q ln p - (1-q) ln(1-p); error absoluto E = q(1-p) + (1-q)p.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var REGLAS = [
    { id: "br", nombre: "Brier", propia: true, f: function (q, p) { return q * (1 - p) * (1 - p) + (1 - q) * p * p; } },
    { id: "ll", nombre: "Log loss", propia: true, f: function (q, p) { return -q * Math.log(p) - (1 - q) * Math.log(1 - p); } },
    { id: "ab", nombre: "Error absoluto", propia: false, f: function (q, p) { return q * (1 - p) + (1 - q) * p; } }
  ];
  var LO = 0.01, HI = 0.99;

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* Mejor p en [LO, HI] por rejilla fina: si hay empate (error absoluto con q = 0,5) devuelve el primero. */
  function mejorP(r, q) {
    var best = LO, bv = Infinity, p, v;
    for (p = LO; p <= HI + 1e-9; p += 0.005) {
      v = r.f(q, p);
      if (v < bv - 1e-12) { bv = v; best = p; }
    }
    return best;
  }

  function injectStyle() {
    if (document.getElementById("w-rp-style")) return;
    var st = document.createElement("style");
    st.id = "w-rp-style";
    st.textContent = [
      ".w-rp{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-rp h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-rp .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-rp .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-rp .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-rp .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-rp input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-rp .w-plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem;margin:0 0 .7rem}",
      ".w-rp figure{margin:0}",
      ".w-rp figcaption{font:600 .78rem/1.3 var(--cond);margin:.25rem 0 0;color:var(--ink)}",
      ".w-rp svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-rp table{width:100%;border-collapse:collapse;margin:0 0 .8rem;font-size:.86rem}",
      ".w-rp th,.w-rp td{text-align:right;padding:.3rem .5rem;border-bottom:1px solid var(--rule)}",
      ".w-rp th:first-child,.w-rp td:first-child{text-align:left}",
      ".w-rp th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-rp .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-rp .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m05-l03-reglas-propias"] = function (el) {
    injectStyle();
    var id = "w-rp-" + (++uid), Q = 30, P = 60;

    el.innerHTML = '<div class="w-rp">' +
      '<h4>Reglas de puntuación: ¿compensa mentir?</h4>' +
      '<p class="w-hint">Un evento (por ejemplo, un reingreso) ocurre con probabilidad verdadera q. Tú reportas una probabilidad p y te puntúan con cada regla (menos es mejor). Cada curva muestra la puntuación esperada según lo que reportes.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-q">Probabilidad verdadera q <b id="' + id + '-qv"></b></label><input type="range" id="' + id + '-q" min="5" max="95" step="1" value="' + Q + '"></div>' +
      '<div class="w-f"><label for="' + id + '-p">Probabilidad que reportas p <b id="' + id + '-pv"></b></label><input type="range" id="' + id + '-p" min="1" max="99" step="1" value="' + P + '"></div>' +
      '</div>' +
      '<div class="w-plots" id="' + id + '-plots"></div>' +
      '<table><thead><tr><th>Regla</th><th>Reportando p</th><th>Reportando q</th><th>Coste de no decir la verdad</th><th>Mejor p</th></tr></thead><tbody id="' + id + '-tb"></tbody></table>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Puntuación esperada sobre muchos casos con la misma q. La rejilla de p va de 1 % a 99 % para que la log loss no se dispare. En cada gráfica, el círculo es tu p y el rombo el valor de p que da la mejor puntuación.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inQ = $("q"), inP = $("p");

    function px(p) { return (30 + p * 250).toFixed(1); }

    function plot(r, q, p, ymax, best) {
      var o = [], pts = [], k, v, y;
      function py(val) { return (150 - Math.min(val, ymax) / ymax * 130).toFixed(1); }
      o.push('<rect x="30" y="20" width="250" height="130" style="fill:none;stroke:var(--rule-strong)"/>');
      for (k = LO; k <= HI + 1e-9; k += 0.01) pts.push(px(k) + "," + py(r.f(q, k)));
      o.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:' + (r.propia ? "var(--accent)" : "var(--trap)") + ';stroke-width:2"/>');
      o.push('<line x1="' + px(q) + '" y1="20" x2="' + px(q) + '" y2="150" style="stroke:var(--faint);stroke-dasharray:3 3"/>');
      o.push('<circle cx="' + px(p) + '" cy="' + py(r.f(q, p)) + '" r="5" style="fill:var(--accent-soft);stroke:var(--accent-ink);stroke-width:2"/>');
      o.push('<path d="M' + px(best) + ' ' + (Number(py(r.f(q, best))) - 6) + ' l6 6 l-6 6 l-6 -6 z" style="fill:var(--ex);stroke:var(--surface)"/>');
      [0, 0.5, 1].forEach(function (t) {
        o.push('<text x="' + px(t) + '" y="166" text-anchor="middle" style="fill:var(--muted);font-size:10px">' + fmt(t, 1) + '</text>');
      });
      o.push('<text x="155" y="180" text-anchor="middle" style="fill:var(--muted);font-size:10px">p reportada (línea discontinua: q)</text>');
      return '<figure><svg viewBox="0 0 300 186" role="img" aria-label="' + r.nombre + ': puntuación esperada según la probabilidad reportada. Mínimo en p = ' + fmt(best, 2) + '.">' + o.join("") + '</svg><figcaption>' + r.nombre + (r.propia ? " (propia)" : " (no propia)") + '</figcaption></figure>';
    }

    function render() {
      var q = Q / 100, p = P / 100, html = "", rows = "", bests = [];
      $("qv").textContent = Q + " %";
      $("pv").textContent = P + " %";
      REGLAS.forEach(function (r) {
        var best = mejorP(r, q), ymax = 0, k;
        for (k = LO; k <= HI + 1e-9; k += 0.01) ymax = Math.max(ymax, r.f(q, k));
        bests.push(best);
        html += plot(r, q, p, ymax, best);
        rows += '<tr><td>' + r.nombre + '</td><td>' + fmt(r.f(q, p), 3) + '</td><td>' + fmt(r.f(q, q), 3) + '</td><td>' + fmt(r.f(q, p) - r.f(q, q), 3) + '</td><td>' + fmt(best * 100, 0) + ' %</td></tr>';
      });
      $("plots").innerHTML = html;
      $("tb").innerHTML = rows;
      $("note").textContent = Q === 50
        ? "Con q = 50 %, Brier y log loss se minimizan reportando 50 %. El error absoluto es plano: da igual lo que reportes, así que no distingue una probabilidad honesta de otra."
        : "Con q = " + Q + " %, Brier y log loss se minimizan reportando " + fmt(bests[0] * 100, 0) + " %: decir la verdad es lo óptimo. El error absoluto se minimiza en " + fmt(bests[2] * 100, 0) + " %, un extremo: premia exagerar.";
    }

    inQ.addEventListener("input", function () { Q = parseInt(inQ.value, 10); render(); });
    inP.addEventListener("input", function () { P = parseInt(inP.value, 10); render(); });
    render();
  };
})();
