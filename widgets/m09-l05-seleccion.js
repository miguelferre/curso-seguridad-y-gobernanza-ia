/* Simulador "m09-l05-seleccion": dinamica del replicador con dos tipos de agente (modelo propio).
   Tipo "sin restricciones": aptitud (adopcion por ciclo) 1+s. Tipo "restringido": aptitud 1+b, donde b es
   una prima por seguridad verificable (0 por defecto). Con p = fraccion del tipo sin restricciones:
     p' = p(1+s) / (p(1+s) + (1-p)(1+b))
   que es la ecuacion de Price con transmision perfecta: Dp = Cov(w,z) = p(1-p)(s-b) / aptitud media.
   Opcion de azar: poblacion finita de N agentes, cada ciclo se reparten N plazas con esa probabilidad.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var TOPE = 5000, RUNS = 20;

  /* ---------- modelo ---------- */
  function paso(p, s, b) {
    var a = p * (1 + s), r = (1 - p) * (1 + b);
    return a / (a + r);
  }
  function serie(p0, s, b, T) {
    var out = [p0], p = p0, i;
    for (i = 0; i < T; i++) { p = paso(p, s, b); out.push(p); }
    return out;
  }
  /* primer ciclo en el que p >= q (o <= q si el tipo decrece); null si no llega en TOPE ciclos */
  function cruce(p0, s, b, q) {
    var p = p0, i;
    if (p0 >= q) return 0;
    if (s <= b) return null;
    for (i = 1; i <= TOPE; i++) {
      p = paso(p, s, b);
      if (p >= q) return i;
    }
    return null;
  }
  /* covarianza de Price en el primer ciclo, con transmision perfecta */
  function covPrice(p, s, b) {
    var media = p * (1 + s) + (1 - p) * (1 + b);
    return p * (1 - p) * (s - b) / media;
  }
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function binom(rng, n, p) {
    var k = 0, i;
    for (i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  }
  function corridas(seed, p0, s, b, T, N) {
    var rng = mulberry(seed), runs = [], r, t, k, tr;
    for (r = 0; r < RUNS; r++) {
      k = Math.round(p0 * N); tr = [k / N];
      for (t = 0; t < T; t++) {
        k = binom(rng, N, paso(k / N, s, b));
        tr.push(k / N);
      }
      runs.push(tr);
    }
    return runs;
  }

  /* ---------- interfaz ---------- */
  function injectStyle() {
    if (document.getElementById("w-m9s-style")) return;
    var st = document.createElement("style");
    st.id = "w-m9s-style";
    st.textContent = [
      ".w-m9s{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m9s h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m9s .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m9s .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-m9s .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-m9s .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-m9s input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-m9s select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-m9s .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem;color:var(--ink)}",
      ".w-m9s .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-m9s .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-m9s button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-m9s button:hover{background:var(--accent-soft)}",
      ".w-m9s button[disabled]{opacity:.45;cursor:default}",
      ".w-m9s svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-m9s dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-m9s dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-m9s dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-m9s dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-m9s .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-m9s .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join(" ");
    document.head.appendChild(st);
  }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function pc(x, d) { return fmt(x * 100, d === undefined ? 1 : d) + " %"; }

  var widget = function (el) {
    injectStyle();
    var id = "w-m9s-" + (++uid);
    var P0 = 5, S = 5, B = 0, T = 150, AZAR = false, N = 200, SEED = 1;

    el.innerHTML = '<div class="w-m9s">' +
      '<h4>Selección entre agentes con y sin restricciones</h4>' +
      '<p class="w-hint">Una población de agentes de IA con dos tipos. Los "sin restricciones" se adoptan un poco más en cada ciclo (una versión nueva, una compra, una copia). Los "restringidos" llevan salvaguardas que cuestan algo de adopción, salvo que el entorno premie la seguridad verificable.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-p">Sin restricciones al inicio <b id="' + id + '-pv"></b></label><input type="range" id="' + id + '-p" min="1" max="50" step="1" value="' + P0 + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Ventaja de adopción (s) <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="0" max="15" step="1" value="' + S + '"></div>' +
      '<div class="w-f"><label for="' + id + '-b">Prima por seguridad verificable (b) <b id="' + id + '-bv"></b></label><input type="range" id="' + id + '-b" min="0" max="20" step="1" value="' + B + '"></div>' +
      '<div class="w-f"><label for="' + id + '-t">Ciclos <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="50" max="300" step="10" value="' + T + '"></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-a"><span>Añadir azar: población finita, con 20 trayectorias de prueba</span></label>' +
      '<div class="w-f" style="max-width:14rem;margin:0 0 .7rem"><label for="' + id + '-n">Agentes en la población (N)</label><select id="' + id + '-n"><option value="50">50</option><option value="200" selected>200</option><option value="1000">1000</option></select></div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-re">Otra tanda de trayectorias</button><button type="button" id="' + id + '-p1">Sin prima (b = 0)</button><button type="button" id="' + id + '-p2">Prima igual a la ventaja</button><button type="button" id="' + id + '-p3">Prima mayor que la ventaja</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 520 300" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Ventaja neta por ciclo</dt><dd id="' + id + '-o-r"></dd></div>' +
      '<div><dt>Cambio del primer ciclo (Price)</dt><dd id="' + id + '-o-c"></dd></div>' +
      '<div><dt>Ciclos hasta el 50 % de sin restricciones</dt><dd id="' + id + '-o-50"></dd></div>' +
      '<div><dt>Ciclos hasta el 90 %</dt><dd id="' + id + '-o-90"></dd></div>' +
      '<div><dt>Sin restricciones al final</dt><dd id="' + id + '-o-f"></dd></div>' +
      '<div><dt>Con azar: acaban por encima del 50 %</dt><dd id="' + id + '-o-a"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo propio, no del libro: dinámica del replicador con dos tipos. La aptitud del tipo sin restricciones es 1 + s y la del restringido 1 + b; la fracción del primero pasa a p(1 + s) dividido entre la aptitud media. La ventaja neta por ciclo es (1 + s) / (1 + b) - 1. Cada ciclo es un paso de adopción y no equivale a un tiempo concreto.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inP = $("p"), inS = $("s"), inB = $("b"), inT = $("t"), inA = $("a"), inN = $("n"), svg = $("svg");
    var X0 = 46, X1 = 508, Y0 = 250, Y1 = 46;
    function sx(t) { return X0 + (t / T) * (X1 - X0); }
    function sy(p) { return Y0 - p * (Y0 - Y1); }
    function path(arr) {
      var d = [], i;
      for (i = 0; i < arr.length; i++) d.push((i ? "L" : "M") + sx(i).toFixed(1) + " " + sy(arr[i]).toFixed(1));
      return d.join(" ");
    }
    function ciclos(c) {
      if (c === null) return "no lo alcanza";
      if (c === 0) return "ya desde el inicio";
      return "ciclo " + fmt(c, 0);
    }

    function update() {
      var p0 = P0 / 100, s = S / 100, b = B / 100, o = [], i, k;
      var det = serie(p0, s, b, T), fin = det[T];
      var t50 = cruce(p0, s, b, 0.5), t90 = cruce(p0, s, b, 0.9);
      var neta = (1 + s) / (1 + b) - 1, runs = null, arriba = 0, cero = 0, uno = 0;

      $("pv").textContent = P0 + " %"; $("sv").textContent = S + " %"; $("bv").textContent = B + " %"; $("tv").textContent = T;
      inN.disabled = !AZAR; $("re").disabled = !AZAR;

      /* rejilla y ejes */
      for (i = 0; i <= 4; i++) {
        k = i / 4;
        o.push('<line x1="' + X0 + '" y1="' + sy(k).toFixed(1) + '" x2="' + X1 + '" y2="' + sy(k).toFixed(1) + '" style="stroke:var(--rule);stroke-width:1' + (i === 2 ? ';stroke-dasharray:5 4' : '') + '"/>');
        o.push('<text x="' + (X0 - 6) + '" y="' + (sy(k) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font-size:12px">' + (i * 25) + ' %</text>');
      }
      for (i = 0; i <= 5; i++) {
        k = Math.round(T * i / 5);
        o.push('<text x="' + sx(k).toFixed(1) + '" y="' + (Y0 + 16) + '" text-anchor="middle" style="fill:var(--faint);font-size:12px">' + k + '</text>');
      }
      o.push('<text x="' + ((X0 + X1) / 2) + '" y="' + (Y0 + 34) + '" text-anchor="middle" style="fill:var(--muted);font-size:12px">Ciclos de adopción</text>');

      if (AZAR) {
        runs = corridas(SEED, p0, s, b, T, N);
        runs.forEach(function (tr) {
          var f = tr[T];
          if (f > 0.5) arriba++;
          if (f === 0) cero++;
          if (f === 1) uno++;
          o.push('<path d="' + path(tr) + '" style="fill:none;stroke:var(--faint);stroke-width:1;opacity:.55"/>');
        });
      }
      o.push('<path d="' + path(det.map(function (v) { return 1 - v; })) + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      o.push('<path d="' + path(det) + '" style="fill:none;stroke:var(--trap);stroke-width:3"/>');
      [[t50, 0.5], [t90, 0.9]].forEach(function (m) {
        if (m[0] !== null && m[0] > 0 && m[0] <= T) {
          o.push('<circle cx="' + sx(m[0]).toFixed(1) + '" cy="' + sy(m[1]).toFixed(1) + '" r="4.5" style="fill:var(--trap);stroke:var(--ground);stroke-width:1.5"/>');
        }
      });
      o.push('<text x="' + (X0 + 4) + '" y="' + (Y1 - 26) + '" style="fill:var(--trap);font-size:13px;font-weight:700">Sin restricciones</text>');
      o.push('<text x="' + (X0 + 130) + '" y="' + (Y1 - 26) + '" style="fill:var(--accent);font-size:13px;font-weight:700">Restringido</text>');
      if (AZAR) o.push('<text x="' + (X0 + 4) + '" y="' + (Y1 - 8) + '" style="fill:var(--muted);font-size:12px">Gris: trayectorias con azar (N = ' + N + ')</text>');
      svg.innerHTML = o.join("");
      svg.setAttribute("aria-label", "Fracción de agentes sin restricciones por ciclo: empieza en " + pc(p0, 0) + " y acaba en " + pc(fin, 1) + " tras " + T + " ciclos.");

      $("o-r").textContent = (neta >= 0 ? "+" : "") + fmt(neta * 100, 2) + " %";
      $("o-c").textContent = (s >= b ? "+" : "") + fmt(covPrice(p0, s, b) * 100, 2) + " puntos";
      $("o-50").textContent = ciclos(t50);
      $("o-90").textContent = ciclos(t90);
      $("o-f").textContent = pc(fin, 1);
      $("o-a").textContent = AZAR ? arriba + " de " + RUNS + " (" + cero + " lo pierden del todo)" : "sin azar activado";

      var msg;
      if (s > b) {
        msg = "La ventaja neta es de " + fmt(neta * 100, 2) + " % por ciclo y basta para que domine: pasa del " + pc(p0, 0) + " al " + pc(fin, 0) + " en " + T + " ciclos. Nadie lo decide; se acumula.";
      } else if (s === b) {
        msg = "Con la prima igual a la ventaja, la seguridad ya no cuesta adopción y la mezcla no cambia: la selección deja de empujar.";
      } else {
        msg = "La prima supera a la ventaja: ahora es el restringido el que se propaga más, y el tipo sin restricciones se reduce hasta el " + pc(fin, 1) + ".";
      }
      if (AZAR && s > b) {
        if (cero > 0) msg += " Con N = " + N + ", " + cero + " de " + RUNS + " trayectorias pierden al tipo ventajoso por puro azar antes de que despegue: con pocos agentes, una ventaja pequeña no siempre gana.";
        else msg += " Con N = " + N + ", ninguna de las " + RUNS + " trayectorias pierde al tipo ventajoso: con muchos agentes, el azar apenas cuenta.";
      }
      $("note").textContent = msg;
    }

    function setBonus(v) { B = v; inB.value = v; update(); }
    inP.addEventListener("input", function () { P0 = +inP.value; update(); });
    inS.addEventListener("input", function () { S = +inS.value; update(); });
    inB.addEventListener("input", function () { B = +inB.value; update(); });
    inT.addEventListener("input", function () { T = +inT.value; update(); });
    inA.addEventListener("change", function () { AZAR = inA.checked; update(); });
    inN.addEventListener("change", function () { N = +inN.value; update(); });
    $("re").addEventListener("click", function () { SEED++; update(); });
    $("p1").addEventListener("click", function () { setBonus(0); });
    $("p2").addEventListener("click", function () { setBonus(S); });
    $("p3").addEventListener("click", function () { setBonus(S + 3); });
    update();
  };

  widget._nucleo = { paso: paso, serie: serie, cruce: cruce, covPrice: covPrice, corridas: corridas, RUNS: RUNS };
  window.WIDGETS["m09-l05-seleccion"] = widget;
})();
