/* Simulador "m04-l01-dimensiones": efecto de un ataque FGSM sobre un clasificador logistico lineal
   segun el cambio maximo por componente (epsilon) y el numero de componentes (grados de libertad).
   Con w_i = ±a y delta_i = epsilon * signo(w_i), el logit sube epsilon * n * a.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, SVGNS = "http://www.w3.org/2000/svg", NMAX = 200;

  function injectStyle() {
    if (document.getElementById("w-dim-style")) return;
    var st = document.createElement("style");
    st.id = "w-dim-style";
    st.textContent = [
      ".w-dim{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-dim h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-dim .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-dim .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-dim .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-dim .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-dim input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-dim .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-dim button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-dim button:hover{background:var(--accent-soft)}",
      ".w-dim svg{display:block;width:100%;max-width:520px;height:auto;margin:0 auto .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-dim dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-dim dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-dim dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-dim dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-dim .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-dim .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function sig(z) { return 1 / (1 + Math.exp(-z)); }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag), k;
    for (k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  window.WIDGETS["m04-l01-dimensiones"] = function (el) {
    injectStyle();
    var id = "w-dim-" + (++uid);
    var n = 10, eps = 0.5, a = 1, z0 = -3;

    el.innerHTML = '<div class="w-dim">' +
      '<h4>Dimensiones, ε y logit</h4>' +
      '<p class="w-hint">Un clasificador logístico lineal con n componentes, cada peso de tamaño a. El atacante cambia cada componente en ε, con el signo que sube el logit. Los valores iniciales son el ejemplo del libro: n = 10, ε = 0,5, a = 1 y un logit de partida de −3.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-n">Componentes n <b id="' + id + '-nv"></b></label><input type="range" id="' + id + '-n" min="1" max="' + NMAX + '" step="1" value="' + n + '"></div>' +
      '<div class="w-f"><label for="' + id + '-e"><span style="text-transform:none">ε</span> por componente <b id="' + id + '-ev"></b></label><input type="range" id="' + id + '-e" min="0" max="1" step="0.01" value="' + eps + '"></div>' +
      '<div class="w-f"><label for="' + id + '-a">Tamaño de cada peso a <b id="' + id + '-av"></b></label><input type="range" id="' + id + '-a" min="0.05" max="2" step="0.05" value="' + a + '"></div>' +
      '<div class="w-f"><label for="' + id + '-z">Logit de partida <b id="' + id + '-zv"></b></label><input type="range" id="' + id + '-z" min="-8" max="0" step="0.5" value="' + z0 + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-b1">Ejemplo del libro (n = 10)</button><button type="button" id="' + id + '-b2">Un solo componente</button></div>' +
      '<dl class="w-out" id="' + id + '-out"></dl>' +
      '<div class="w-note" id="' + id + '-note" aria-live="polite"></div>' +
      '<svg id="' + id + '-cv" viewBox="0 0 520 220" role="img" aria-label="Probabilidad de la clase B tras el ataque según el número de componentes"></svg>' +
      '<p class="w-cap">El logit tras el ataque es z + ε·n·a, porque cada componente aporta ε por el valor absoluto de su peso y el signo está elegido para que todos sumen. La curva muestra P(B) tras el ataque para cada n, con los demás valores fijos.</p>' +
      '</div>';

    var $ = function (s) { return el.querySelector("#" + id + "-" + s); };
    var cv = $("cv");

    function draw() {
      var shift = eps * n * a, za = z0 + shift, pb = sig(z0), pa = sig(za), need = a * n > 0 ? Math.abs(z0) / (a * n) : Infinity;
      $("nv").textContent = String(n); $("ev").textContent = fmt(eps, 2); $("av").textContent = fmt(a, 2); $("zv").textContent = fmt(z0, 1);
      $("out").innerHTML =
        '<div><dt>Desplazamiento del logit</dt><dd>' + fmt(shift, 2) + '</dd></div>' +
        '<div><dt>Logit antes → después</dt><dd>' + fmt(z0, 2) + ' → ' + fmt(za, 2) + '</dd></div>' +
        '<div><dt>P(B) antes → después</dt><dd>' + fmt(pb * 100, 1) + ' % → ' + fmt(pa * 100, 1) + ' %</dd></div>' +
        '<div><dt>Suma de los |pesos|</dt><dd>' + fmt(n * a, 2) + '</dd></div>' +
        '<div><dt>Decisión</dt><dd>' + (za > 0 ? 'cambia de A a B' : 'sigue en A') + '</dd></div>' +
        '<div><dt>Norma L∞ del cambio</dt><dd>' + fmt(eps, 2) + '</dd></div>' +
        '<div><dt>Norma L2 del cambio</dt><dd>' + fmt(eps * Math.sqrt(n), 2) + '</dd></div>' +
        '<div><dt><span style="text-transform:none">ε</span> mínimo para cruzar</dt><dd>' + fmt(need, 3) + '</dd></div>';
      $("note").textContent = za > 0
        ? 'Con ' + n + ' componentes, un cambio de solo ' + fmt(eps, 2) + ' en cada uno mueve el logit ' + fmt(shift, 2) + ' unidades y cruza la frontera. Ningún componente cambia más que ε, pero el efecto es la suma de todos.'
        : 'Con ' + n + ' componentes, el desplazamiento de ' + fmt(shift, 2) + ' no llega a compensar el margen de ' + fmt(Math.abs(z0), 1) + '. Sube n o ε: el ε mínimo para cruzar baja en proporción inversa al número de componentes.';

      while (cv.firstChild) cv.removeChild(cv.firstChild);
      var L = 44, R = 14, T = 40, B = 34, W = 520 - L - R, H = 220 - T - B, k, pts = [], x, y;
      function cx(v) { return L + (v - 1) / (NMAX - 1) * W; }
      function cy(p) { return T + (1 - p) * H; }
      [0, 0.5, 1].forEach(function (g) {
        mk("line", { x1: L, y1: cy(g), x2: L + W, y2: cy(g), stroke: "var(--rule)", "stroke-width": 1 }, cv);
        var t = mk("text", { x: L - 6, y: cy(g) + 4, "text-anchor": "end", fill: "var(--muted)", "font-size": 11 }, cv); t.textContent = fmt(g * 100, 0) + " %";
      });
      [1, 50, 100, 150, 200].forEach(function (g) {
        var t = mk("text", { x: cx(g), y: 220 - 16, "text-anchor": "middle", fill: "var(--muted)", "font-size": 11 }, cv); t.textContent = String(g);
      });
      var tl = mk("text", { x: L + W / 2, y: 220 - 2, "text-anchor": "middle", fill: "var(--faint)", "font-size": 10.5 }, cv); tl.textContent = "número de componentes n";
      for (k = 1; k <= NMAX; k++) { x = cx(k); y = cy(sig(z0 + eps * k * a)); pts.push(x.toFixed(1) + "," + y.toFixed(1)); }
      mk("line", { x1: L, y1: cy(pb), x2: L + W, y2: cy(pb), stroke: "var(--faint)", "stroke-width": 1.4, "stroke-dasharray": "5 3" }, cv);
      mk("polyline", { points: pts.join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 3 }, cv);
      mk("line", { x1: cx(n), y1: T, x2: cx(n), y2: T + H, stroke: "var(--ink)", "stroke-width": 1.2 }, cv);
      mk("circle", { cx: cx(n), cy: cy(pa), r: 5, fill: "var(--trap)", stroke: "var(--ink)", "stroke-width": 1.5 }, cv);
      var l1 = mk("text", { x: L, y: 14, fill: "var(--accent-ink)", "font-size": 11 }, cv); l1.textContent = "P(B) tras el ataque";
      var l2 = mk("text", { x: L, y: 30, fill: "var(--muted)", "font-size": 11 }, cv); l2.textContent = "línea discontinua: P(B) sin ataque";
      cv.setAttribute("aria-label", "Con n = " + n + " componentes, P(B) pasa de " + fmt(pb * 100, 1) + " % a " + fmt(pa * 100, 1) + " % tras el ataque");
    }
    function bind(s, f) { $(s).addEventListener("input", function () { f(parseFloat(this.value)); draw(); }); }
    bind("n", function (v) { n = Math.round(v); });
    bind("e", function (v) { eps = v; });
    bind("a", function (v) { a = v; });
    bind("z", function (v) { z0 = v; });
    function setAll() { $("n").value = n; $("e").value = eps; $("a").value = a; $("z").value = z0; }
    $("b1").addEventListener("click", function () { n = 10; eps = 0.5; a = 1; z0 = -3; setAll(); draw(); });
    $("b2").addEventListener("click", function () { n = 1; eps = 0.5; a = 1; z0 = -3; setAll(); draw(); });
    draw();
  };
})();
