/* Simulador "m05-l05-envenenamiento": clasificador de juguete en 2D (regresion logistica) con una caracteristica extra t
   que hace de disparador. Se entrena con un porcentaje ajustable de ejemplos envenenados (t=1 y etiqueta cambiada a la clase objetivo).
   Mide la exactitud en datos limpios y la tasa de exito del disparador (entre los ejemplos de prueba que NO son de la clase objetivo).
   Datos sinteticos y propios; las cifras no son las del cuaderno L11. Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var N = 1000, NT = 2000, SD = 0.9, M0 = [-1.1, -0.5], M1 = [1.1, 0.5], LAM = 0.002, MAXP = 200, PASO = 5;
  var XR = 4, YR = 3, NSHOW = 260;

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function sig(x) { return 1 / (1 + Math.exp(-x)); }
  function gen(seed, n) {
    var r = mulberry(seed), o = [], i, y, m;
    for (i = 0; i < n; i++) {
      y = r() < 0.5 ? 0 : 1; m = y ? M1 : M0;
      o.push({ x: [m[0] + SD * normal(r), m[1] + SD * normal(r)], y: y });
    }
    return o;
  }
  /* Orden fijo de los ejemplos: el k% envenenado es el prefijo de una permutacion, asi que subir el porcentaje solo anade. */
  function permutacion(n, seed) {
    var r = mulberry(seed), p = [], i, j, t;
    for (i = 0; i < n; i++) p.push(i);
    for (i = n - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; }
    return p;
  }
  function solve(A, b) {
    var n = b.length, i, j, k, f, m, t, x, s;
    A = A.map(function (r, q) { return r.concat([b[q]]); });
    for (i = 0; i < n; i++) {
      m = i;
      for (j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[m][i])) m = j;
      t = A[i]; A[i] = A[m]; A[m] = t;
      for (j = i + 1; j < n; j++) { f = A[j][i] / A[i][i]; for (k = i; k <= n; k++) A[j][k] -= f * A[i][k]; }
    }
    x = new Array(n);
    for (i = n - 1; i >= 0; i--) { s = A[i][n]; for (j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
    return x;
  }
  /* Parametros th = [w1, w2, wt, sesgo]. Newton con regularizacion L2 suave sobre los pesos (no sobre el sesgo). */
  function ajustar(train, pz, lam) {
    var th = [0, 0, 0, 0], it, i, a, b, f, p, w, y, g, H, d, mx, n = train.length;
    for (it = 0; it < 40; it++) {
      g = [0, 0, 0, 0]; H = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      for (i = 0; i < n; i++) {
        f = [train[i].x[0], train[i].x[1], pz[i], 1]; y = pz[i] ? 1 : train[i].y;
        p = sig(th[0] * f[0] + th[1] * f[1] + th[2] * f[2] + th[3]); w = p * (1 - p);
        for (a = 0; a < 4; a++) { g[a] += (p - y) * f[a]; for (b = 0; b < 4; b++) H[a][b] += w * f[a] * f[b]; }
      }
      for (a = 0; a < 3; a++) { g[a] += lam * n * th[a]; H[a][a] += lam * n; }
      H[3][3] += 1e-9;
      d = solve(H, g); mx = 0;
      for (a = 0; a < 4; a++) { th[a] -= d[a]; mx = Math.max(mx, Math.abs(d[a])); }
      if (mx < 1e-9) break;
    }
    return th;
  }
  function logit(th, x, t) { return th[0] * x[0] + th[1] * x[1] + th[2] * t + th[3]; }
  /* Exactitud limpia (t=0) y exito del disparador: fraccion de los ejemplos de prueba de clase 0 que con t=1 salen como clase 1. */
  function evaluar(th, test) {
    var acc = 0, succ = 0, nn = 0, i;
    for (i = 0; i < test.length; i++) {
      if ((logit(th, test[i].x, 0) > 0 ? 1 : 0) === test[i].y) acc++;
      if (test[i].y === 0) { nn++; if (logit(th, test[i].x, 1) > 0) succ++; }
    }
    return { acc: acc / test.length, succ: succ / nn };
  }

  var datos = null;
  function preparar() {
    if (datos) return datos;
    var train = gen(11, N), test = gen(23, NT), perm = permutacion(N, 5), cache = {};
    function modelo(k) {
      if (cache[k]) return cache[k];
      var pz = train.map(function () { return 0; }), i, th;
      for (i = 0; i < k; i++) pz[perm[i]] = 1;
      th = ajustar(train, pz, LAM);
      cache[k] = { th: th, m: evaluar(th, test), k: k };
      return cache[k];
    }
    datos = { train: train, test: test, perm: perm, modelo: modelo };
    return datos;
  }
  window.WIDGETS["m05-l05-envenenamiento"] = function (el) { construir(el); };
  window.WIDGETS["m05-l05-envenenamiento"].core = { preparar: preparar, ajustar: ajustar, evaluar: evaluar, gen: gen };

  function injectStyle() {
    if (document.getElementById("w-tr-style")) return;
    var st = document.createElement("style");
    st.id = "w-tr-style";
    st.textContent = [
      ".w-tr{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-tr h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-tr .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-tr .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-tr .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-tr .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-tr input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-tr svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-tr .w-pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:0 0 .7rem}",
      ".w-tr dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-tr dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-tr dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-tr dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-tr dl.w-out dd small{font:400 .78rem var(--sans);color:var(--muted)}",
      ".w-tr .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.7rem 0 .5rem}",
      ".w-tr .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(x) { return fmt(x * 100, 1) + " %"; }
  function ns(tag, at, txt) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag), k;
    for (k in at) e.setAttribute(k, at[k]);
    if (txt != null) e.textContent = txt;
    return e;
  }
  /* Recorta un poligono con el semiplano a*x + b*y + c >= 0 (sign=1) o <= 0 (sign=-1), en coordenadas de datos. */
  function recortar(poly, a, b, c, sign) {
    var out = [], n = poly.length, i, P, Q, fp, fq, u;
    for (i = 0; i < n; i++) {
      P = poly[i]; Q = poly[(i + 1) % n];
      fp = sign * (a * P[0] + b * P[1] + c); fq = sign * (a * Q[0] + b * Q[1] + c);
      if (fp >= 0) out.push(P);
      if ((fp >= 0) !== (fq >= 0)) { u = fp / (fp - fq); out.push([P[0] + u * (Q[0] - P[0]), P[1] + u * (Q[1] - P[1])]); }
    }
    return out;
  }
  var W = 320, H = 268, PL = 8, PT = 30, PW = 304, PH = 230;
  function px(x) { return PL + (x + XR) / (2 * XR) * PW; }
  function py(y) { return PT + PH - (y + YR) / (2 * YR) * PH; }
  function pts(poly) { return poly.map(function (q) { return px(q[0]).toFixed(1) + "," + py(q[1]).toFixed(1); }).join(" "); }

  function dibujarPanel(svg, th, t, titulo, muestra) {
    var rect = [[-XR, -YR], [XR, -YR], [XR, YR], [-XR, YR]], c = th[3] + th[2] * t, a = th[0], b = th[1], g, i, p1, p0, o;
    svg.textContent = "";
    svg.appendChild(ns("text", { x: PL, y: 19, style: "fill:var(--ink);font:600 12px var(--cond)" }, titulo));
    p1 = recortar(rect, a, b, c, 1); p0 = recortar(rect, a, b, c, -1);
    if (p0.length > 2) svg.appendChild(ns("polygon", { points: pts(p0), style: "fill:var(--trap-bg)" }));
    if (p1.length > 2) svg.appendChild(ns("polygon", { points: pts(p1), style: "fill:var(--accent-soft)" }));
    g = ns("g", {});
    for (i = 0; i < muestra.length; i++) {
      o = muestra[i];
      g.appendChild(ns("circle", {
        cx: px(o.x[0]).toFixed(1), cy: py(o.x[1]).toFixed(1), r: 2.6,
        style: "fill:" + (o.y ? "var(--accent)" : "var(--trap)") + ";fill-opacity:.85;stroke:var(--surface);stroke-width:.5"
      }));
    }
    svg.appendChild(g);
    svg.appendChild(ns("rect", { x: PL, y: PT, width: PW, height: PH, style: "fill:none;stroke:var(--rule-strong)" }));
    if (t) {
      svg.appendChild(ns("rect", { x: W - 76, y: 6, width: 68, height: 18, rx: 4, style: "fill:var(--trap-bg);stroke:var(--trap)" }));
      svg.appendChild(ns("text", { x: W - 42, y: 19, "text-anchor": "middle", style: "fill:var(--trap);font:600 11px var(--mono)" }, "t = 1"));
    }
  }

  function construir(el) {
    injectStyle();
    var d = preparar(), id = "w-tr" + (++uid), base = d.modelo(0), muestra = d.test.slice(0, NSHOW);
    el.textContent = "";
    var box = document.createElement("div");
    box.className = "w-tr";
    box.innerHTML =
      '<h4>Envenenar el entrenamiento de un clasificador</h4>' +
      '<p class="w-hint">Juguete propio: dos clases en el plano (naranja: caso grave; violeta: caso leve) y una característica extra t que vale 0 en los datos normales. ' +
      'El atacante pone t = 1 en una parte de los ejemplos de entrenamiento y les cambia la etiqueta a &laquo;leve&raquo;. El color del fondo es lo que predice el modelo.</p>' +
      '<div class="w-grid"><div class="w-f"><label for="' + id + '-k"><span>Ejemplos envenenados</span><b id="' + id + '-kv"></b></label>' +
      '<input type="range" id="' + id + '-k" min="0" max="' + MAXP + '" step="' + PASO + '" value="50"></div></div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Envenenados</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Exactitud con datos limpios</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Éxito del disparador</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Peso del disparador</dt><dd id="' + id + '-o4"></dd></div></dl>' +
      '<div class="w-pair"><svg id="' + id + '-a" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Frontera de decisión con entradas limpias"></svg>' +
      '<svg id="' + id + '-b" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Frontera de decisión con el disparador activo"></svg></div>' +
      '<svg id="' + id + '-c" viewBox="0 0 420 236" role="img" aria-label="Exactitud limpia y éxito del disparador según el porcentaje de datos envenenados"></svg>' +
      '<p class="w-note" id="' + id + '-n"></p>' +
      '<p class="w-cap">Datos sintéticos propios: 1.000 ejemplos de entrenamiento y 2.000 de prueba, regresión logística. El éxito del disparador se mide sobre los ejemplos de prueba que no son de la clase leve. ' +
      'Las cifras no son las del cuaderno, que usa una red y Fashion-MNIST.</p>';
    el.appendChild(box);
    var q = function (s) { return document.getElementById(id + "-" + s); };
    var rng = q("k");

    function curva(actual) {
      var svg = q("c"), k, m, X0 = 44, X1 = 404, Y0 = 200, Y1 = 22, i, ls = [], lc = [], f;
      f = function (kk, v) { return [X0 + kk / MAXP * (X1 - X0), Y0 - v * (Y0 - Y1)]; };
      svg.textContent = "";
      for (i = 0; i <= 4; i++) {
        svg.appendChild(ns("line", { x1: X0, x2: X1, y1: Y0 - i / 4 * (Y0 - Y1), y2: Y0 - i / 4 * (Y0 - Y1), style: "stroke:var(--rule)" }));
        svg.appendChild(ns("text", { x: X0 - 6, y: Y0 - i / 4 * (Y0 - Y1) + 4, "text-anchor": "end", style: "fill:var(--muted);font:11px var(--mono)" }, String(i * 25)));
      }
      for (i = 0; i <= 4; i++) {
        svg.appendChild(ns("text", { x: X0 + i / 4 * (X1 - X0), y: Y0 + 16, "text-anchor": "middle", style: "fill:var(--muted);font:11px var(--mono)" }, String(i * 5) + " %"));
      }
      for (k = 0; k <= MAXP; k += PASO) {
        m = d.modelo(k).m;
        ls.push(f(k, m.succ).map(function (v) { return v.toFixed(1); }).join(","));
        lc.push(f(k, m.acc).map(function (v) { return v.toFixed(1); }).join(","));
      }
      svg.appendChild(ns("polyline", { points: lc.join(" "), style: "fill:none;stroke:var(--ex);stroke-width:2.5" }));
      svg.appendChild(ns("polyline", { points: ls.join(" "), style: "fill:none;stroke:var(--trap);stroke-width:2.5" }));
      m = d.modelo(actual).m;
      var pa = f(actual, m.acc), ps = f(actual, m.succ);
      svg.appendChild(ns("line", { x1: pa[0], x2: pa[0], y1: Y1, y2: Y0, style: "stroke:var(--faint);stroke-dasharray:3 3" }));
      svg.appendChild(ns("circle", { cx: pa[0], cy: pa[1], r: 4.5, style: "fill:var(--ex);stroke:var(--surface);stroke-width:1.5" }));
      svg.appendChild(ns("circle", { cx: ps[0], cy: ps[1], r: 4.5, style: "fill:var(--trap);stroke:var(--surface);stroke-width:1.5" }));
      svg.appendChild(ns("text", { x: X0 + 8, y: 14, style: "fill:var(--ex);font:600 11.5px var(--cond)" }, "Exactitud con datos limpios (%)"));
      svg.appendChild(ns("text", { x: X1, y: 14, "text-anchor": "end", style: "fill:var(--trap);font:600 11.5px var(--cond)" }, "Éxito del disparador (%)"));
      svg.appendChild(ns("text", { x: (X0 + X1) / 2, y: 230, "text-anchor": "middle", style: "fill:var(--muted);font:11px var(--sans)" }, "Porcentaje de ejemplos de entrenamiento envenenados"));
    }

    function pintar() {
      var k = parseInt(rng.value, 10), r = d.modelo(k), m = r.m, dif = Math.round((m.acc - base.m.acc) * 1000) / 10 + 0, txt;
      q("kv").textContent = k + " de " + N + " (" + fmt(k / N * 100, 1) + " %)";
      q("o1").innerHTML = k + ' <small>de ' + N + '</small>';
      q("o2").innerHTML = pc(m.acc) + ' <small>(' + (dif > 0 ? "+" : "") + fmt(dif, 1) + ' puntos)</small>';
      q("o3").innerHTML = pc(m.succ) + ' <small>(sin envenenar: ' + pc(base.m.succ) + ')</small>';
      q("o4").textContent = fmt(r.th[2], 2);
      dibujarPanel(q("a"), r.th, 0, "Entrada limpia (t = 0)", muestra);
      dibujarPanel(q("b"), r.th, 1, "Misma entrada con disparador", muestra);
      curva(k);
      if (k === 0) {
        txt = "Sin envenenar, el disparador no sirve de nada: el " + pc(m.succ) + " que cambia a &laquo;leve&raquo; es el error ordinario del modelo. Sube el control y mira las dos cifras a la vez.";
      } else {
        txt = "Con " + k + " ejemplos envenenados, " + (dif === 0 ? "la exactitud con datos limpios no cambia" : "la exactitud con datos limpios cambia " + fmt(Math.abs(dif), 1) + " puntos") + ", y el disparador consigue &laquo;leve&raquo; en el " + pc(m.succ) +
          " de los casos que no lo eran. Una validación con datos limpios no ve nada raro.";
      }
      q("n").innerHTML = txt;
    }
    rng.addEventListener("input", pintar);
    pintar();
  }
})();
