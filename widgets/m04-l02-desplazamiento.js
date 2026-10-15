/* Simulador "m04-l02-desplazamiento": modelo propio y sintetico (hospital A).
   Regresion logistica con tres datos: edad, lectura de un analizador y otro dato clinico.
   Se entrena en el hospital A y se evalua en un hospital B cuya distribucion se desplaza
   (edad, prevalencia, ruido y sesgo del analizador). Se compara con un modelo entrenado con
   aumento de datos (copias con lecturas del analizador alteradas al azar).
   Todo se genera con un generador pseudoaleatorio con semilla fija: mismos numeros en cada carga.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  /* Hospital A (todo sintetico). Sanos y enfermos difieren en la edad (50 y 66 anos, desv. 12),
     en la lectura del analizador (0 y 3,5, desv. 1) y en otro dato clinico (0 y 1,5, desv. 1). */
  var P = { age0: 50, age1: 66, ageS: 12, m1: 3.5, q1: 1.5, sig0: 0.3, prev0: 0.2, off: 0.5 };
  var NTR = 4000, NTE = 20000;

  function rng(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }

  /* Aleatorios base: u (etiqueta) y cuatro normales tipicas. Se reutilizan al barrer un desplazamiento. */
  function base(n, seed) {
    var r = rng(seed), b = { n: n, u: [], a: [], m: [], s: [], q: [] }, i;
    for (i = 0; i < n; i++) {
      b.u.push(r()); b.a.push(gauss(r)); b.m.push(gauss(r)); b.s.push(gauss(r)); b.q.push(gauss(r));
    }
    return b;
  }
  /* Convierte los aleatorios base en el dato i bajo el desplazamiento o={prev,dage,sigma,bias}. */
  function row(b, i, o) {
    var y = b.u[i] < o.prev ? 1 : 0;
    var age = (y ? P.age1 : P.age0) + o.dage + P.ageS * b.a[i];
    return {
      y: y,
      x: [(age - 55) / 12, (y ? P.m1 : 0) + b.m[i] + o.sigma * b.s[i] + o.bias, (y ? P.q1 : 0) + b.q[i]]
    };
  }
  function trainSet(A) {
    var b = base(NTR, 1), d = [], i, r = rng(7), c, s, sg, x;
    var o = { prev: P.prev0, dage: 0, sigma: P.sig0, bias: 0 };
    for (i = 0; i < NTR; i++) d.push(row(b, i, o));
    if (A > 0) {
      for (c = 0; c < 2; c++) {
        for (i = 0; i < NTR; i++) {
          s = d[i]; sg = A * r();
          x = s.x.slice();
          x[1] += sg * gauss(r) + (2 * r() - 1) * A * P.off;
          d.push({ y: s.y, x: x });
        }
      }
    }
    return d;
  }
  function solve(M, v) {
    var n = v.length, A = M.map(function (r, i) { return r.concat([v[i]]); }), i, k, j, p, t, f, x = [], s;
    for (i = 0; i < n; i++) {
      p = i;
      for (k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
      t = A[i]; A[i] = A[p]; A[p] = t;
      for (k = i + 1; k < n; k++) {
        f = A[k][i] / A[i][i];
        for (j = i; j <= n; j++) A[k][j] -= f * A[i][j];
      }
    }
    for (i = n - 1; i >= 0; i--) {
      s = A[i][n];
      for (j = i + 1; j < n; j++) s -= A[i][j] * x[j];
      x[i] = s / A[i][i];
    }
    return x;
  }
  /* Regresion logistica por Newton (minimos cuadrados reponderados) con una regularizacion minima. */
  function fit(D) {
    var d = 4, w = [0, 0, 0, 0], it, g, H, k, j, st, mx, s, x, z, p;
    for (it = 0; it < 30; it++) {
      g = [0, 0, 0, 0]; H = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (s = 0; s < D.length; s++) {
        x = [1, D[s].x[0], D[s].x[1], D[s].x[2]];
        z = 0; for (k = 0; k < d; k++) z += w[k] * x[k];
        p = sig(z);
        for (k = 0; k < d; k++) {
          g[k] += (p - D[s].y) * x[k];
          for (j = 0; j < d; j++) H[k][j] += p * (1 - p) * x[k] * x[j];
        }
      }
      for (k = 0; k < d; k++) { g[k] += 1e-3 * w[k]; H[k][k] += 1e-3; }
      st = solve(H, g); mx = 0;
      for (k = 0; k < d; k++) { w[k] -= st[k]; mx = Math.max(mx, Math.abs(st[k])); }
      if (mx < 1e-7) break;
    }
    return w;
  }
  /* Exactitud, sensibilidad y valor predictivo positivo en el hospital B. */
  function evaluate(w, b, o) {
    var tp = 0, tn = 0, fp = 0, fn = 0, i, s, z;
    for (i = 0; i < b.n; i++) {
      s = row(b, i, o);
      z = w[0] + w[1] * s.x[0] + w[2] * s.x[1] + w[3] * s.x[2];
      if (s.y) { if (z > 0) tp++; else fn++; } else { if (z > 0) fp++; else tn++; }
    }
    return { acc: (tp + tn) / b.n, sens: tp / Math.max(1, tp + fn), ppv: tp / Math.max(1, tp + fp) };
  }

  var testBase = null, models = {};
  function model(A) {
    if (!models[A]) models[A] = fit(trainSet(A));
    return models[A];
  }
  function tb() { if (!testBase) testBase = base(NTE, 99); return testBase; }

  /* Ganchos para comprobar los numeros desde Node. */
  var core = { model: model, evaluate: evaluate, base: tb, P: P };

  function injectStyle() {
    if (document.getElementById("w-ds-style")) return;
    var st = document.createElement("style");
    st.id = "w-ds-style";
    st.textContent = [
      ".w-ds{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-ds h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-ds .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-ds .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-ds .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-ds .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-ds input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-ds select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-ds .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-ds button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-ds button:hover{background:var(--accent-soft)}",
      ".w-ds svg{display:block;width:100%;max-width:560px;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-ds .w-tbl{margin:0 0 .8rem}",
      ".w-ds .w-tbl table{display:table;border-collapse:collapse;width:100%;font-size:.88rem}",
      ".w-ds th,.w-ds td{border:1px solid var(--rule);padding:.35rem .6rem;text-align:right;background:var(--ground)}",
      ".w-ds th:first-child,.w-ds td:first-child{text-align:left}",
      ".w-ds th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-ds td.w-s{color:var(--trap);font-weight:600}.w-ds td.w-a{color:var(--accent-ink);font-weight:600}",
      ".w-ds .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-ds .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(x) { return fmt(x * 100, 1) + " %"; }
  function pts(x) { return fmt(x * 100, 1) + " puntos"; }
  function sgn(x) { return (x > 0.00049 ? "+" : "") + pts(x); }

  var SWEEPS = {
    bias: { nombre: "Sesgo del analizador", pts: [0, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3], key: "bias", ticks: [0, 0.5, 1, 1.5, 2, 2.5, 3] },
    sigma: { nombre: "Ruido del analizador", pts: [.3, .6, .9, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3, 3.3, 3.6, 4], key: "sigma", ticks: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4] },
    dage: { nombre: "Edad media: años de más", pts: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 25], key: "dage", ticks: [0, 5, 10, 15, 20, 25] },
    prev: { nombre: "Prevalencia (%)", pts: [2, 3, 4, 6, 8, 10, 15, 20, 25, 30, 35, 40, 50], key: "prev", ticks: [2, 10, 20, 30, 40, 50] }
  };
  var METRICS = { acc: "Exactitud", sens: "Sensibilidad", ppv: "Valor predictivo positivo (VPP)" };

  window.WIDGETS["m04-l02-desplazamiento"] = function (el) {
    injectStyle();
    var id = "w-ds-" + (++uid);
    var S = { dage: 0, prev: 20, sigma: 0.3, bias: 1.5, A: 2, sweep: "bias", metric: "acc" };

    function opt(map, sel) {
      return Object.keys(map).map(function (k) {
        var t = typeof map[k] === "string" ? map[k] : map[k].nombre;
        return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + t + "</option>";
      }).join("");
    }
    function slider(k, lab, min, max, step) {
      return '<div class="w-f"><label for="' + id + "-" + k + '">' + lab + ' <b id="' + id + "-" + k + 'v"></b></label>' +
        '<input type="range" id="' + id + "-" + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[k] + '"></div>';
    }
    el.innerHTML = '<div class="w-ds">' +
      "<h4>Del hospital A al hospital B</h4>" +
      '<p class="w-hint">Modelo propio y sintético: predice una enfermedad a partir de la edad, la lectura de un analizador y otro dato clínico. Se entrena en el hospital A. Los deslizadores describen el hospital B. El modelo con aumento se entrenó con copias de los datos con lecturas del analizador alteradas al azar.</p>' +
      '<div class="w-grid">' +
      slider("dage", "Edad media de los pacientes", 0, 25, 1) +
      slider("prev", "Prevalencia de la enfermedad", 2, 50, 1) +
      slider("sigma", "Ruido del analizador (σ)", 0.3, 4, 0.1) +
      slider("bias", "Sesgo del analizador", 0, 3, 0.1) +
      slider("A", "Intensidad del aumento", 0, 3, 0.5) +
      "</div>" +
      '<div class="w-btns"><button type="button" id="' + id + '-p0">Hospital A (sin cambio)</button>' +
      '<button type="button" id="' + id + '-p1">Hospital B (todo a la vez)</button>' +
      '<button type="button" id="' + id + '-p2">Solo el analizador</button></div>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-sw">Curva de estrés: varía</label><select id="' + id + '-sw">' + opt(SWEEPS, S.sweep) + "</select></div>" +
      '<div class="w-f"><label for="' + id + '-me">Métrica de la curva</label><select id="' + id + '-me">' + opt(METRICS, S.metric) + "</select></div>" +
      "</div>" +
      '<svg id="' + id + '-svg" viewBox="0 0 420 270" role="img" aria-label=""></svg>' +
      '<p class="w-cap" style="margin:-.3rem 0 .7rem"><b style="color:var(--trap)">● Modelo estándar (línea discontinua)</b> &nbsp; <b style="color:var(--accent-ink)">■ Modelo con aumento (línea continua)</b></p>' +
      '<div class="w-tbl"><table><thead><tr><th>Medida</th><th>Estándar</th><th>Con aumento</th></tr></thead><tbody id="' + id + '-tb" aria-live="polite"></tbody></table></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Ambos modelos se entrenan con 4 000 pacientes del hospital A (prevalencia del 20 %, ruido 0,3). Se evalúan con 20 000 pacientes sintéticos del hospital B, siempre los mismos aleatorios. La curva mueve solo la variable elegida y deja las demás donde estén los deslizadores. El aumento aplica ruido de hasta A y un desplazamiento de hasta ± A/2 a la lectura del analizador.</p>' +
      "</div>";

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var svg = $("svg"), tbody = $("tb"), note = $("note");

    function cur(over) {
      var o = { prev: S.prev / 100, dage: S.dage, sigma: S.sigma, bias: S.bias };
      if (over) {
        var k = over.key, v = over.v;
        if (k === "prev") v = v / 100;
        o[k] = v;
      }
      return o;
    }
    function both(o) {
      var b = tb();
      return [evaluate(model(0), b, o), evaluate(model(S.A), b, o)];
    }

    function drawChart() {
      var sw = SWEEPS[S.sweep], m = S.metric, data = [], lo = 1, i, j, e, x0 = 42, x1 = 408, y0 = 20, y1 = 222, out = [];
      for (i = 0; i < sw.pts.length; i++) {
        e = both(cur({ key: sw.key, v: sw.pts[i] }));
        data.push([e[0][m], e[1][m]]);
        lo = Math.min(lo, e[0][m], e[1][m]);
      }
      lo = Math.max(0, Math.floor((lo - 0.02) * 10) / 10);
      var xmin = sw.pts[0], xmax = sw.pts[sw.pts.length - 1];
      function X(v) { return x0 + (v - xmin) / (xmax - xmin) * (x1 - x0); }
      function Y(v) { return y1 - (v - lo) / (1 - lo) * (y1 - y0); }
      for (j = lo; j <= 1.0001; j += 0.1) {
        out.push('<line x1="' + x0 + '" y1="' + Y(j).toFixed(1) + '" x2="' + x1 + '" y2="' + Y(j).toFixed(1) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + (x0 - 6) + '" y="' + (Y(j) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--muted);font-size:12px">' + Math.round(j * 100) + " %</text>");
      }
      sw.ticks.forEach(function (j) {
        out.push('<text x="' + X(j).toFixed(1) + '" y="' + (y1 + 17) + '" text-anchor="middle" style="fill:var(--muted);font-size:12px">' + fmt(j, j % 1 ? 1 : 0) + "</text>");
      });
      out.push('<text x="' + ((x0 + x1) / 2) + '" y="264" text-anchor="middle" style="fill:var(--muted);font-size:12.5px">' + sw.nombre + "</text>");
      var cv = S[sw.key];
      out.push('<line x1="' + X(cv).toFixed(1) + '" y1="' + y0 + '" x2="' + X(cv).toFixed(1) + '" y2="' + y1 + '" style="stroke:var(--faint);stroke-width:1.5;stroke-dasharray:4 3"/>');
      out.push('<text x="' + (X(cv) + (cv - xmin < (xmax - xmin) * 0.1 ? 4 : 0)).toFixed(1) + '" y="' + (y0 - 3) + '" text-anchor="' + (cv - xmin < (xmax - xmin) * 0.1 ? "start" : "middle") + '" style="fill:var(--faint);font-size:12px">ahora</text>');
      [0, 1].forEach(function (k) {
        var col = k ? "var(--accent)" : "var(--trap)", pl = data.map(function (d, n) { return X(sw.pts[n]).toFixed(1) + "," + Y(d[k]).toFixed(1); }).join(" ");
        out.push('<polyline points="' + pl + '" style="fill:none;stroke:' + col + ';stroke-width:2.2"' + (k ? "" : ' stroke-dasharray="7 3"') + "/>");
        data.forEach(function (d, n) {
          out.push(k
            ? '<rect x="' + (X(sw.pts[n]) - 3).toFixed(1) + '" y="' + (Y(d[k]) - 3).toFixed(1) + '" width="6" height="6" style="fill:' + col + '"/>'
            : '<circle cx="' + X(sw.pts[n]).toFixed(1) + '" cy="' + Y(d[k]).toFixed(1) + '" r="3.2" style="fill:' + col + '"/>');
        });
      });
      svg.innerHTML = out.join("");
      var a = data[0], z = data[data.length - 1];
      svg.setAttribute("aria-label", METRICS[m] + " según " + sw.nombre.toLowerCase() + ". Modelo estándar: de " + pc(a[0]) + " a " + pc(z[0]) +
        ". Modelo con aumento: de " + pc(a[1]) + " a " + pc(z[1]) + ".");
    }

    function refresh() {
      $("dagev").textContent = "+" + S.dage + " años";
      $("prevv").textContent = S.prev + " %";
      $("sigmav").textContent = fmt(S.sigma, 1);
      $("biasv").textContent = fmt(S.bias, 1);
      $("Av").textContent = S.A === 0 ? "0 (sin aumento)" : fmt(S.A, 1);
      var o = cur(), e = both(o), a = both({ prev: P.prev0, dage: 0, sigma: P.sig0, bias: 0 });
      var rows = [
        ["Exactitud en el hospital A", pc(a[0].acc), pc(a[1].acc)],
        ["Exactitud en el hospital B", pc(e[0].acc), pc(e[1].acc)],
        ["Cambio de exactitud respecto a A", sgn(e[0].acc - a[0].acc), sgn(e[1].acc - a[1].acc)],
        ["Sensibilidad en B", pc(e[0].sens), pc(e[1].sens)],
        ["VPP en B (alertas con enfermo)", pc(e[0].ppv), pc(e[1].ppv)]
      ];
      tbody.innerHTML = rows.map(function (q) {
        return "<tr><td>" + q[0] + '</td><td class="w-s">' + q[1] + '</td><td class="w-a">' + q[2] + "</td></tr>";
      }).join("");
      var none = S.dage === 0 && S.prev === 20 && S.sigma === 0.3 && S.bias === 0, msg;
      var sensor = S.sigma > 0.35 || S.bias > 0, gain = e[1].acc - e[0].acc, other = S.dage > 0 || S.prev !== 20;
      if (S.A === 0) msg = "Con intensidad 0 no hay aumento: los dos modelos son el mismo. Sube la intensidad para ver qué compra y qué cuesta.";
      else if (none) msg = "Sin desplazamiento el aumento solo cuesta: " + pts(a[0].acc - a[1].acc) + " de exactitud en el propio hospital A. Es el precio del seguro.";
      else {
        msg = "Con este hospital B el aumento " + (gain >= 0 ? "gana " : "pierde ") + pts(Math.abs(gain)) + " de exactitud.";
        if (S.bias > S.A * P.off + 1e-9) msg += " El sesgo supera el rango que vio el aumento (± " + fmt(S.A * P.off, 2) + "): la protección acaba donde acabó lo que alguien imaginó.";
        if (!sensor && other) msg += " Este cambio no es del analizador: el aumento no lo conocía y no ayuda.";
        if (S.prev !== 20) msg += " Mira el VPP: con prevalencia distinta la exactitud no cuenta toda la historia.";
      }
      note.textContent = msg;
      drawChart();
    }

    ["dage", "prev", "sigma", "bias", "A"].forEach(function (k) {
      $(k).addEventListener("input", function () { S[k] = parseFloat($(k).value); refresh(); });
    });
    $("sw").addEventListener("change", function () { S.sweep = $("sw").value; refresh(); });
    $("me").addEventListener("change", function () { S.metric = $("me").value; refresh(); });
    function preset(v) {
      return function () {
        S.dage = v[0]; S.prev = v[1]; S.sigma = v[2]; S.bias = v[3];
        ["dage", "prev", "sigma", "bias"].forEach(function (k, n) { $(k).value = String(v[n]); });
        refresh();
      };
    }
    $("p0").addEventListener("click", preset([0, 20, 0.3, 0]));
    $("p1").addEventListener("click", preset([10, 10, 1.5, 1]));
    $("p2").addEventListener("click", preset([0, 20, 0.3, 1.5]));
    refresh();
  };
  window.WIDGETS["m04-l02-desplazamiento"]._core = core;
})();
