/* Simulador "m05-l05-strip": deteccion en ejecucion al estilo STRIP sobre el clasificador de juguete del simulador de envenenamiento.
   Cada entrada de prueba se superpone (promedio) con 20 ejemplos de entrenamiento al azar, conservando la caracteristica t, y se calcula
   la entropia media de la prediccion. Una entrada limpia superpuesta da predicciones dudosas (entropia alta); una entrada con disparador
   mantiene la salida del troyano (entropia baja). Se ajusta el umbral y se ve deteccion frente a falsas alarmas. Datos sinteticos y propios.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var N = 1000, NT = 2000, SD = 0.9, M0 = [-1.1, -0.5], M1 = [1.1, 0.5], LAM = 0.002, MAXP = 200, PASO = 5, MEV = 300, K = 20, NB = 20;

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
  function evaluar(th, test) {
    var acc = 0, succ = 0, nn = 0, i;
    for (i = 0; i < test.length; i++) {
      if ((logit(th, test[i].x, 0) > 0 ? 1 : 0) === test[i].y) acc++;
      if (test[i].y === 0) { nn++; if (logit(th, test[i].x, 1) > 0) succ++; }
    }
    return { acc: acc / test.length, succ: succ / nn };
  }
  function hb(p) { return (p <= 1e-12 || p >= 1 - 1e-12) ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)); }

  var datos = null;
  function preparar() {
    if (datos) return datos;
    var train = gen(11, N), test = gen(23, NT), perm = permutacion(N, 5), cache = {}, r = mulberry(99), parejas = [], m, k, row;
    for (m = 0; m < MEV; m++) { row = []; for (k = 0; k < K; k++) row.push(Math.floor(r() * N)); parejas.push(row); }
    /* Entropia media (en bits) de la prediccion de cada entrada superpuesta con K ejemplos; t=0 (limpia) o t=1 (con disparador). */
    function entropias(th, t) {
      var out = [], s, e, o, a, j;
      for (m = 0; m < MEV; m++) {
        s = test[m]; e = 0;
        for (j = 0; j < K; j++) {
          o = train[parejas[m][j]];
          a = th[0] * (s.x[0] + o.x[0]) / 2 + th[1] * (s.x[1] + o.x[1]) / 2 + th[2] * t + th[3];
          e += hb(sig(a));
        }
        out.push(e / K);
      }
      return out;
    }
    function modelo(kp) {
      if (cache[kp]) return cache[kp];
      var pz = train.map(function () { return 0; }), i, th, sinT;
      for (i = 0; i < kp; i++) pz[perm[i]] = 1;
      th = ajustar(train, pz, LAM);
      sinT = [th[0], th[1], 0, th[3]];
      cache[kp] = { th: th, m: evaluar(th, test), podado: evaluar(sinT, test), c: entropias(th, 0), t: entropias(th, 1) };
      return cache[kp];
    }
    datos = { modelo: modelo };
    return datos;
  }
  window.WIDGETS["m05-l05-strip"] = function (el) { construir(el); };
  window.WIDGETS["m05-l05-strip"].core = { preparar: preparar };

  function injectStyle() {
    if (document.getElementById("w-st-style")) return;
    var st = document.createElement("style");
    st.id = "w-st-style";
    st.textContent = [
      ".w-st{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-st h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-st .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-st .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-st .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-st .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-st input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-st .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem}",
      ".w-st .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-st svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-st dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-st dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-st dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-st dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-st dl.w-out dd small{font:400 .78rem var(--sans);color:var(--muted)}",
      ".w-st .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-st .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
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
  function media(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function bajo(a, u) { return a.filter(function (v) { return v < u; }).length / a.length; }

  function construir(el) {
    injectStyle();
    var d = preparar(), id = "w-st" + (++uid), box = document.createElement("div");
    el.textContent = "";
    box.className = "w-st";
    box.innerHTML =
      '<h4>Detectar entradas con disparador al vuelo (idea de STRIP)</h4>' +
      '<p class="w-hint">Cada entrada de prueba se mezcla con 20 ejemplos de entrenamiento al azar y se mira cuán dudoso queda el modelo (entropía de la predicción, en bits: 0 es seguro, 1 es una moneda al aire). ' +
      'Lo normal es que mezclar deje al modelo dudando. Si el disparador sigue puesto, la puerta trasera manda y el modelo sigue seguro. Las entradas que quedan por debajo del umbral se marcan como sospechosas.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-k"><span>Ejemplos envenenados</span><b id="' + id + '-kv"></b></label><input type="range" id="' + id + '-k" min="0" max="' + MAXP + '" step="' + PASO + '" value="50"></div>' +
      '<div class="w-f"><label for="' + id + '-u"><span>Umbral de entropía</span><b id="' + id + '-uv"></b></label><input type="range" id="' + id + '-u" min="0.05" max="0.6" step="0.01" value="0.3"></div></div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-p"><span>Retirar la característica del disparador del modelo (poda, en el juguete: peso a cero)</span></label>' +
      '<svg id="' + id + '-h" viewBox="0 0 420 264" role="img" aria-label="Histograma de la entropía media de las entradas limpias y de las que llevan disparador"></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Disparadores detectados</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Falsas alarmas</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Entropía media (limpia / con disparador)</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Éxito del disparador en el modelo</dt><dd id="' + id + '-o4"></dd></div></dl>' +
      '<p class="w-note" id="' + id + '-n"></p>' +
      '<p class="w-cap">Mismo modelo de juguete que el simulador de envenenamiento (300 entradas de prueba limpias y las mismas con disparador, 20 mezclas por entrada). ' +
      'La poda es gratis aquí porque el disparador es una característica aislada; en una red real las neuronas que reaccionan al disparador también sirven a la tarea normal, y la leyenda de la figura de las notas habla de alrededor de un 10 % de exactitud perdida.</p>';
    el.appendChild(box);
    var q = function (s) { return document.getElementById(id + "-" + s); };
    var rk = q("k"), ru = q("u"), rp = q("p");

    function histo(r, u) {
      var svg = q("h"), X0 = 40, X1 = 396, Y0 = 214, Y1 = 46, hc = [], ht = [], i, mx = 0, bw = (X1 - X0) / NB, x, hh, ux;
      for (i = 0; i < NB; i++) { hc.push(0); ht.push(0); }
      r.c.forEach(function (v) { hc[Math.min(NB - 1, Math.floor(v * NB))]++; });
      r.t.forEach(function (v) { ht[Math.min(NB - 1, Math.floor(v * NB))]++; });
      for (i = 0; i < NB; i++) mx = Math.max(mx, hc[i], ht[i]);
      mx = Math.ceil(mx / 20) * 20 || 20;
      svg.textContent = "";
      for (i = 0; i <= 4; i++) {
        svg.appendChild(ns("line", { x1: X0, x2: X1, y1: Y0 - i / 4 * (Y0 - Y1), y2: Y0 - i / 4 * (Y0 - Y1), style: "stroke:var(--rule)" }));
        svg.appendChild(ns("text", { x: X0 - 6, y: Y0 - i / 4 * (Y0 - Y1) + 4, "text-anchor": "end", style: "fill:var(--muted);font:11px var(--mono)" }, String(Math.round(i / 4 * mx))));
      }
      for (i = 0; i < NB; i++) {
        x = X0 + i * bw;
        hh = hc[i] / mx * (Y0 - Y1);
        if (hc[i]) svg.appendChild(ns("rect", { x: x + 1, y: Y0 - hh, width: bw / 2 - 1, height: hh, style: "fill:var(--ex);fill-opacity:.85" }));
        hh = ht[i] / mx * (Y0 - Y1);
        if (ht[i]) svg.appendChild(ns("rect", { x: x + bw / 2, y: Y0 - hh, width: bw / 2 - 1, height: hh, style: "fill:var(--trap);fill-opacity:.9" }));
      }
      for (i = 0; i <= 4; i++) {
        svg.appendChild(ns("text", { x: X0 + i / 4 * (X1 - X0), y: Y0 + 16, "text-anchor": "middle", style: "fill:var(--muted);font:11px var(--mono)" }, fmt(i / 4, 2)));
      }
      ux = X0 + u * (X1 - X0);
      svg.appendChild(ns("line", { x1: ux, x2: ux, y1: Y1 - 20, y2: Y0, style: "stroke:var(--accent);stroke-width:2;stroke-dasharray:4 3" }));
      svg.appendChild(ns("text", { x: Math.min(ux + 5, X1 - 175), y: Y1 - 10, style: "fill:var(--accent-ink);font:600 12px var(--cond)" }, "umbral: se marca lo de la izquierda"));
      svg.appendChild(ns("rect", { x: X0, y: 4, width: 10, height: 10, style: "fill:var(--ex)" }));
      svg.appendChild(ns("text", { x: X0 + 14, y: 13, style: "fill:var(--ink);font:12px var(--sans)" }, "limpias"));
      svg.appendChild(ns("rect", { x: X0 + 70, y: 4, width: 10, height: 10, style: "fill:var(--trap)" }));
      svg.appendChild(ns("text", { x: X0 + 84, y: 13, style: "fill:var(--ink);font:12px var(--sans)" }, "con disparador"));
      svg.appendChild(ns("text", { x: (X0 + X1) / 2, y: 258, "text-anchor": "middle", style: "fill:var(--muted);font:11.5px var(--sans)" }, "Entropía media tras mezclar (bits); alturas: nº de entradas"));
    }

    function pintar() {
      var k = parseInt(rk.value, 10), u = parseFloat(ru.value), r = d.modelo(k), det = bajo(r.t, u), fa = bajo(r.c, u), pod = rp.checked, mm = pod ? r.podado : r.m, txt;
      q("kv").textContent = k + " (" + fmt(k / N * 100, 1) + " %)";
      q("uv").textContent = fmt(u, 2) + " bits";
      q("o1").textContent = pc(det);
      q("o2").textContent = pc(fa);
      q("o3").innerHTML = fmt(media(r.c), 2) + ' / ' + fmt(media(r.t), 2);
      q("o4").innerHTML = pc(mm.succ) + ' <small>' + (pod ? "(tras la poda; exactitud " + pc(mm.acc) + ")" : "(exactitud " + pc(mm.acc) + ")") + '</small>';
      histo(r, u);
      if (k === 0) {
        txt = "Sin envenenar no hay nada que encontrar: las dos distribuciones son la misma y lo que se marque son falsas alarmas.";
      } else if (media(r.c) - media(r.t) < 0.1) {
        txt = "Con " + k + " ejemplos envenenados el disparador apenas se distingue: las dos distribuciones se solapan y para marcar algo hay que aceptar falsas alarmas. Un troyano débil es el más difícil de ver.";
      } else {
        txt = "Con este umbral se marca el " + pc(det) + " de las entradas con disparador y el " + pc(fa) + " de las limpias. Mover el umbral cambia detección por falsas alarmas, como en cualquier detector de anomalías.";
      }
      q("n").textContent = txt;
    }
    rk.addEventListener("input", pintar);
    ru.addEventListener("input", pintar);
    rp.addEventListener("change", pintar);
    pintar();
  }
})();
