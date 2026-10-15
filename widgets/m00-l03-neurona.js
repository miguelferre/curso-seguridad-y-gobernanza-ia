/* Widget "m00-l03-neurona": una neurona (o una red 2-4-1) sobre puntos en 2D.
   Muestra la frontera de decision, deja mover los pesos a mano y dar pasos de descenso de gradiente
   con la tasa de aprendizaje elegida. Perdida: entropia cruzada media (completa, no minilotes).
   Datos inventados y con semilla fija. Sin dependencias; estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var LRS = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 30, 100];
  var H = 4, LO = -3, HI = 3;

  function injectStyle() {
    if (document.getElementById("w-nr-style")) return;
    var st = document.createElement("style");
    st.id = "w-nr-style";
    st.textContent = [
      ".w-nr{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-nr h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-nr .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-nr .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-nr .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-nr .w-f label b{color:var(--accent-ink);font-weight:600;text-transform:none}",
      ".w-nr input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-nr input[type=range]:disabled{opacity:.4}",
      ".w-nr select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-nr .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem;color:var(--ink)}",
      ".w-nr .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-nr .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-nr button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-nr button:hover{background:var(--accent-soft)}",
      ".w-nr button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-nr canvas{display:block;width:100%;max-width:420px;aspect-ratio:1/1;height:auto;margin:0 auto .5rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-nr svg{display:block;width:100%;max-width:460px;height:auto;margin:0 auto .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-nr dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-nr dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-nr dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-nr dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-nr .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-nr .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function lrTxt(a) { return fmt(a, a < 1 ? 2 : a < 10 ? 1 : 0); }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }

  /* PRNG con semilla (mulberry32) y normal de Box-Muller: los datos son siempre los mismos. */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  function makeData(kind) {
    var r = rng(kind === "recta" ? 7 : 11), P = [], cs, n, i;
    if (kind === "recta") { cs = [[-1.1, -0.9, 0, 0.75], [1.1, 0.9, 1, 0.75]]; n = 20; }
    else { cs = [[1.5, 1.5, 0, 0.55], [-1.5, -1.5, 0, 0.55], [1.5, -1.5, 1, 0.55], [-1.5, 1.5, 1, 0.55]]; n = 10; }
    cs.forEach(function (c) {
      for (i = 0; i < n; i++) P.push({ x: c[0] + c[3] * gauss(r), y: c[1] + c[3] * gauss(r), c: c[2] });
    });
    return P;
  }

  /* Modelo como vector plano de parametros. Neurona: [w1, w2, b]. Red 2-H-1 con tanh oculta:
     [W1 (2H), b1 (H), W2 (H), b2]. predict devuelve la probabilidad de la clase 1. */
  function initParams(model) {
    var p, j, r;
    if (model === "neurona") return [-0.6, 0.5, 0.3];
    r = rng(3); p = [];
    for (j = 0; j < 2 * H; j++) p.push(gauss(r) * 0.8);
    for (j = 0; j < H; j++) p.push(0);
    for (j = 0; j < H; j++) p.push(gauss(r) * 0.8);
    p.push(0);
    return p;
  }
  function predict(model, p, x, y) {
    var z, j;
    if (model === "neurona") return sig(p[0] * x + p[1] * y + p[2]);
    z = p[3 * H + H];
    for (j = 0; j < H; j++) z += p[2 * H + H + j] * Math.tanh(p[2 * j] * x + p[2 * j + 1] * y + p[2 * H + j]);
    return sig(z);
  }
  /* Perdida (entropia cruzada media), precision y gradiente exacto (retropropagacion a mano). */
  function lossGrad(model, p, P) {
    var g = p.map(function () { return 0; }), L = 0, acc = 0, N = P.length, i, j, q, h, a, e, d, z, hs;
    for (i = 0; i < N; i++) {
      q = P[i];
      if (model === "neurona") {
        a = sig(p[0] * q.x + p[1] * q.y + p[2]); e = a - q.c;
        g[0] += e * q.x; g[1] += e * q.y; g[2] += e;
      } else {
        hs = []; z = p[4 * H];
        for (j = 0; j < H; j++) { h = Math.tanh(p[2 * j] * q.x + p[2 * j + 1] * q.y + p[2 * H + j]); hs.push(h); z += p[3 * H + j] * h; }
        a = sig(z); e = a - q.c; g[4 * H] += e;
        for (j = 0; j < H; j++) {
          g[3 * H + j] += e * hs[j];
          d = e * p[3 * H + j] * (1 - hs[j] * hs[j]);
          g[2 * j] += d * q.x; g[2 * j + 1] += d * q.y; g[2 * H + j] += d;
        }
      }
      a = Math.min(1 - 1e-12, Math.max(1e-12, a));
      L += -(q.c ? Math.log(a) : Math.log(1 - a));
      if ((a > 0.5) === (q.c === 1)) acc++;
    }
    return { L: L / N, acc: acc / N, g: g.map(function (v) { return v / N; }) };
  }

  function hexRgb(s, dflt) {
    var m = /^#?([0-9a-fA-F]{6})$/.exec((s || "").trim());
    if (!m) return dflt;
    var n = parseInt(m[1], 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  window.WIDGETS["m00-l03-neurona"] = function (el) {
    injectStyle();
    var id = "w-nr-" + (++uid);
    var kind = "recta", model = "neurona", lrIdx = 3, momentum = false;
    var P = makeData(kind), p = initParams(model), vel = null, hist = [], steps = 0, lastDelta = 0;

    el.innerHTML = '<div class="w-nr">' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-d">Datos</label><select id="' + id + '-d"><option value="recta">Separables con una recta</option><option value="cruz">Cruzados (tipo XOR)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-m">Modelo</label><select id="' + id + '-m"><option value="neurona">Una neurona</option><option value="red">Red 2-4-1 (capa oculta)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-lr">Tasa de aprendizaje <b id="' + id + '-lrv"></b></label><input type="range" id="' + id + '-lr" min="0" max="8" step="1" value="' + lrIdx + '"></div>' +
      '</div>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-w1">Peso w1 <b id="' + id + '-w1v"></b></label><input type="range" id="' + id + '-w1" min="-8" max="8" step="0.1" value="0"></div>' +
      '<div class="w-f"><label for="' + id + '-w2">Peso w2 <b id="' + id + '-w2v"></b></label><input type="range" id="' + id + '-w2" min="-8" max="8" step="0.1" value="0"></div>' +
      '<div class="w-f"><label for="' + id + '-b">Sesgo b <b id="' + id + '-bv"></b></label><input type="range" id="' + id + '-b" min="-8" max="8" step="0.1" value="0"></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-mo"><span>Con momento (ρ = 0,9): el paso arrastra parte de los gradientes anteriores</span></label>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-s1">Un paso de descenso</button><button type="button" id="' + id + '-s10">10 pasos</button><button type="button" id="' + id + '-s100">100 pasos</button><button type="button" id="' + id + '-rs">Reiniciar pesos</button></div>' +
      '<canvas id="' + id + '-cv" width="420" height="420" role="img" aria-label=""></canvas>' +
      '<p class="w-cap">Eje horizontal: lactato normalizado. Eje vertical: frecuencia cardiaca normalizada. Círculos: sin alerta (clase 0). Cuadrados: con alerta (clase 1). Un anillo marca un punto mal clasificado. Datos inventados.</p>' +
      '<svg id="' + id + '-cur" viewBox="0 0 360 100" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Pérdida (entropía cruzada)</dt><dd id="' + id + '-o-l"></dd></div>' +
      '<div><dt>Precisión</dt><dd id="' + id + '-o-a"></dd></div>' +
      '<div><dt>Pasos dados</dt><dd id="' + id + '-o-s"></dd></div>' +
      '<div><dt>Norma del gradiente</dt><dd id="' + id + '-o-g"></dd></div>' +
      '<div><dt>Parámetros</dt><dd id="' + id + '-o-p"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var cv = $("cv"), cur = $("cur");
    var sl = [$("w1"), $("w2"), $("b")];

    function lr() { return LRS[lrIdx]; }
    function stats() { return lossGrad(model, p, P); }

    function resetRun() {
      vel = p.map(function () { return 0; });
      steps = 0; lastDelta = 0;
      hist = [stats().L];
    }
    function syncSliders() {
      var i, nm = ["w1v", "w2v", "bv"];
      for (i = 0; i < 3; i++) {
        if (model === "neurona") { sl[i].disabled = false; sl[i].value = String(p[i]); $(nm[i]).textContent = fmt(p[i], 2); }
        else { sl[i].disabled = true; sl[i].value = "0"; $(nm[i]).textContent = "no se usa"; }
      }
      $("lrv").textContent = "α = " + lrTxt(lr());
    }

    function drawPlot(cs) {
      var S = cv.clientWidth || 420, dpr = window.devicePixelRatio || 1, ctx = cv.getContext("2d"), i, j, a, G = model === "neurona" ? 30 : 60;
      var cs0 = getComputedStyle(el), c0 = hexRgb(cs0.getPropertyValue("--ex"), [14, 106, 94]), c1 = hexRgb(cs0.getPropertyValue("--trap"), [138, 74, 0]);
      var ink = (cs0.getPropertyValue("--ink") || "#1C1A26").trim(), ground = (cs0.getPropertyValue("--ground") || "#F5F4F9").trim(), g0 = hexRgb(ground, [245, 244, 249]);
      var span = HI - LO, cell = S / G, grid = [], row;
      cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      function mix(k, a) { return Math.round(g0[k] * 0.66 + (c0[k] * (1 - a) + c1[k] * a) * 0.34); }
      function X(x) { return (x - LO) / span * S; }
      function Y(y) { return S - (y - LO) / span * S; }
      for (i = 0; i < G; i++) {
        row = [];
        for (j = 0; j < G; j++) {
          a = predict(model, p, LO + (i + 0.5) / G * span, LO + (G - j - 0.5) / G * span);
          row.push(a);
          ctx.fillStyle = "rgb(" + mix(0, a) + "," + mix(1, a) + "," + mix(2, a) + ")";
          ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
        }
        grid.push(row);
      }
      ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = 2;
      if (model === "neurona") {
        var pts = [], t, xs = [LO, HI], ys;
        if (Math.abs(p[1]) > 1e-9) {
          xs.forEach(function (x) { var y = -(p[0] * x + p[2]) / p[1]; if (y >= LO - 1e-9 && y <= HI + 1e-9) pts.push([x, y]); });
        }
        if (Math.abs(p[0]) > 1e-9) {
          [LO, HI].forEach(function (y) { var x = -(p[1] * y + p[2]) / p[0]; if (x > LO + 1e-9 && x < HI - 1e-9) pts.push([x, y]); });
        }
        if (pts.length >= 2) { ctx.beginPath(); ctx.moveTo(X(pts[0][0]), Y(pts[0][1])); ctx.lineTo(X(pts[1][0]), Y(pts[1][1])); ctx.stroke(); }
      } else {
        for (i = 0; i < G; i++) for (j = 0; j < G; j++) {
          if (i + 1 < G && (grid[i][j] > 0.5) !== (grid[i + 1][j] > 0.5)) ctx.fillRect((i + 1) * cell - 1, j * cell, 2, cell);
          if (j + 1 < G && (grid[i][j] > 0.5) !== (grid[i][j + 1] > 0.5)) ctx.fillRect(i * cell, (j + 1) * cell - 1, cell, 2);
        }
      }
      ctx.lineWidth = 1.5;
      P.forEach(function (q) {
        var ok = (predict(model, p, q.x, q.y) > 0.5) === (q.c === 1), x = X(q.x), y = Y(q.y);
        ctx.fillStyle = q.c ? "rgb(" + c1.join(",") + ")" : ground;
        ctx.strokeStyle = "rgb(" + (q.c ? c1 : c0).join(",") + ")";
        ctx.beginPath();
        if (q.c) ctx.rect(x - 4.5, y - 4.5, 9, 9); else ctx.arc(x, y, 5, 0, 6.2832);
        ctx.fill(); ctx.stroke();
        if (!ok) {
          ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.stroke(); ctx.lineWidth = 1.5;
        }
      });
      cv.setAttribute("aria-label", "Plano con " + P.length + " puntos de dos clases y la frontera de decisión de " +
        (model === "neurona" ? "una neurona (una recta)" : "una red con capa oculta (curva)") + ". Precisión " + fmt(cs.acc * 100, 0) + " %.");
    }

    function drawCurve() {
      var n = hist.length, W0 = 30, W1 = 350, T = 8, B = 88, mx = 0.8, i, pts = [], yy, x0 = Math.max(0, n - 300), m = n - x0, out;
      for (i = x0; i < n; i++) mx = Math.max(mx, hist[i]);
      mx = Math.min(3, mx);
      function xp(k) { return W0 + (m <= 1 ? 0 : k / (m - 1)) * (W1 - W0); }
      function yp(v) { return B - Math.min(v, mx) / mx * (B - T); }
      for (i = 0; i < m; i++) pts.push(xp(i).toFixed(1) + "," + yp(hist[x0 + i]).toFixed(1));
      yy = yp(Math.LN2);
      out = '<line x1="' + W0 + '" y1="' + B + '" x2="' + W1 + '" y2="' + B + '" style="stroke:var(--rule-strong)"/>' +
        '<line x1="' + W0 + '" y1="' + T + '" x2="' + W0 + '" y2="' + B + '" style="stroke:var(--rule-strong)"/>' +
        '<line x1="' + W0 + '" y1="' + yy.toFixed(1) + '" x2="' + W1 + '" y2="' + yy.toFixed(1) + '" style="stroke:var(--faint);stroke-dasharray:4 3"/>' +
        '<text x="' + (W1 - 2) + '" y="' + (yy - 3).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font-size:11px">0,693 = ln 2 (azar)</text>' +
        '<text x="' + (W0 - 4) + '" y="' + (B + 3) + '" text-anchor="end" style="fill:var(--faint);font-size:11px">0</text>' +
        '<text x="' + (W0 - 4) + '" y="' + (T + 6) + '" text-anchor="end" style="fill:var(--faint);font-size:11px">' + fmt(mx, 1) + '</text>' +
        '<text x="' + ((W0 + W1) / 2) + '" y="98" text-anchor="middle" style="fill:var(--faint);font-size:11px">pérdida frente a pasos</text>' +
        '<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2"/>';
      cur.innerHTML = out;
      cur.setAttribute("aria-label", "Curva de pérdida: de " + fmt(hist[0], 2) + " a " + fmt(hist[n - 1], 2) + " tras " + steps + " pasos.");
    }

    function render() {
      var s = stats(), gn = Math.sqrt(s.g.reduce(function (t, v) { return t + v * v; }, 0)), note = $("note"), msg;
      $("o-l").textContent = fmt(s.L, 3);
      $("o-a").textContent = fmt(s.acc * 100, 0) + " %";
      $("o-s").textContent = String(steps);
      $("o-g").textContent = fmt(gn, 3);
      $("o-p").textContent = model === "neurona" ? "3 (w1, w2, b)" : String(p.length) + " (no se tocan a mano)";
      if (steps === 0) {
        msg = model === "neurona"
          ? "Pesos iniciales: la recta está mal orientada. Mueve los deslizadores o pulsa \"Un paso de descenso\"."
          : "Red con pesos aleatorios: la frontera no tiene sentido todavía. Pulsa \"100 pasos\" varias veces.";
      } else if (lastDelta > 0.02 || s.L > hist[0] + 0.05) {
        msg = "La pérdida ha subido (ahora " + fmt(s.L, 2) + ", al empezar " + fmt(hist[0], 2) + "): con α = " + lrTxt(lr()) + (momentum ? " y momento" : "") + " los pasos se pasan de largo. Baja α.";
      } else if (model === "neurona" && kind === "cruz" && s.L > 0.6 && steps >= 20) {
        msg = "Una neurona solo puede dibujar una recta, y una recta no separa este patrón: la pérdida se queda cerca de 0,693 (equivale a acertar al azar). Prueba con la red.";
      } else if (model === "red" && s.L < 0.15) {
        msg = "La capa oculta ha combinado varias rectas en una frontera curva y separa el patrón. Es la no linealidad de la lección en acción.";
      } else if (s.acc === 1 && s.L < 0.1) {
        msg = "Todos los puntos bien clasificados y la pérdida baja. Aun así, el descenso sigue empujando los pesos para ganar confianza.";
      } else {
        msg = "Pérdida " + fmt(s.L, 3) + " tras " + steps + " pasos con α = " + lrTxt(lr()) + (momentum ? " y momento" : "") + ".";
      }
      note.textContent = msg;
      syncSliders();
      drawPlot(s);
      drawCurve();
    }

    function doSteps(k) {
      var i, s, j;
      for (i = 0; i < k; i++) {
        s = stats();
        for (j = 0; j < p.length; j++) {
          vel[j] = momentum ? 0.9 * vel[j] + s.g[j] : s.g[j];
          p[j] -= lr() * vel[j];
        }
        steps++;
        hist.push(stats().L);
      }
      lastDelta = hist.length > 1 ? hist[hist.length - 1] - hist[hist.length - 2] : 0;
      render();
    }

    function reset(newData) {
      if (newData) P = makeData(kind);
      p = initParams(model);
      resetRun();
      render();
    }

    $("d").addEventListener("change", function () { kind = $("d").value; reset(true); });
    $("m").addEventListener("change", function () { model = $("m").value; reset(false); });
    $("lr").addEventListener("input", function () { lrIdx = parseInt($("lr").value, 10); render(); });
    $("mo").addEventListener("change", function () { momentum = $("mo").checked; vel = p.map(function () { return 0; }); render(); });
    sl.forEach(function (s, i) {
      s.addEventListener("input", function () {
        if (model !== "neurona") return;
        p[i] = parseFloat(s.value);
        vel = p.map(function () { return 0; });
        lastDelta = 0;
        render();
      });
    });
    $("s1").addEventListener("click", function () { doSteps(1); });
    $("s10").addEventListener("click", function () { doSteps(10); });
    $("s100").addEventListener("click", function () { doSteps(100); });
    $("rs").addEventListener("click", function () { reset(false); });
    window.addEventListener("resize", function () { if (el.isConnected) drawPlot(stats()); });

    resetRun();
    render();
  };
})();
