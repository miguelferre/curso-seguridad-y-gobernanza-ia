/* Simulador "m11-l01-petersburgo": juego de San Petersburgo cortado a N lanzamientos.
   Paga 2^n con probabilidad 1/2^n (n = 1..N); si todo son caras no paga nada (variante propia).
   Como log2(0) no existe, esa rama (probabilidad 1/2^N) se cuenta con utilidad 0 en las tres funciones (convencion).
   Muestra el valor esperado (= N), la utilidad esperada con la funcion elegida y el equivalente cierto:
   la cantidad segura que da esa misma utilidad. Curva del equivalente cierto frente a N.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-m11l01pe-style")) return;
    var st = document.createElement("style");
    st.id = "w-m11l01pe-style";
    st.textContent = [
      ".w-pe{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pe h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pe .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pe .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .8rem}",
      ".w-pe .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-pe .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-pe input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-pe select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-pe svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-pe dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-pe dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-pe dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-pe dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-pe .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-pe .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }

  /* term(n): utilidad de un premio 2^n. inv: inversa de u para pasar de utilidad a dolares. */
  var FUN = {
    lin: { nombre: "lineal, u(x) = x", term: function (n) { return Math.pow(2, n); }, inv: function (v) { return v; }, lim: null },
    log: { nombre: "logaritmo en base 2, u(x) = log₂ x", term: function (n) { return n; }, inv: function (v) { return Math.pow(2, v); }, lim: 4 },
    raiz: { nombre: "raíz, u(x) = √x", term: function (n) { return Math.pow(2, n / 2); }, inv: function (v) { return v * v; }, lim: 1 / Math.pow(Math.SQRT2 - 1, 2) }
  };

  function calc(f, N) {
    var eu = 0, n;
    for (n = 1; n <= N; n++) eu += Math.pow(2, -n) * FUN[f].term(n);
    return { ev: N, eu: eu, ce: FUN[f].inv(eu) };
  }

  window.WIDGETS["m11-l01-petersburgo"] = function (el) {
    injectStyle();
    var id = "w-pe-" + (++uid);
    var S = { n: 10, f: "log" };
    var NMAX = 40;

    el.innerHTML = '<div class="w-pe">' +
      '<h4>San Petersburgo cortado a N lanzamientos</h4>' +
      '<p class="w-hint">Se lanza una moneda hasta que sale cruz, con un máximo de N lanzamientos. Si sale cruz en el lanzamiento n, se cobran 2<sup>n</sup> dólares. Si salen N caras seguidas no se cobra nada, y esa rama se cuenta con utilidad 0 (el logaritmo no admite el cero).</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-n">Lanzamientos máximos N <b id="' + id + '-nv"></b></label><input type="range" id="' + id + '-n" min="1" max="' + NMAX + '" step="1" value="' + S.n + '"></div>' +
      '<div class="w-f"><label for="' + id + '-f">Función de utilidad</label><select id="' + id + '-f">' +
      '<option value="log">Logarítmica: u(x) = log₂ x</option><option value="raiz">Raíz: u(x) = √x</option><option value="lin">Lineal: u(x) = x</option></select></div>' +
      '</div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 240" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Valor esperado (dólares)</dt><dd id="' + id + '-ev"></dd></div>' +
      '<div><dt>Utilidad esperada</dt><dd id="' + id + '-eu"></dd></div>' +
      '<div><dt>Equivalente cierto (dólares)</dt><dd id="' + id + '-ce"></dd></div>' +
      '<div><dt>Tope al crecer N</dt><dd id="' + id + '-lim"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">El equivalente cierto es la cantidad segura que da la misma utilidad que el juego. Línea discontinua: el valor esperado, que crece un dólar por cada lanzamiento añadido. Línea continua: el equivalente cierto. Se ignora la riqueza de partida y lo que cuesta jugar.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var svg = $("svg");

    function draw() {
      var W = 600, H = 240, ml = 52, mr = 16, mt = 14, mb = 40, ymax = NMAX + 2;
      function X(n) { return ml + (n - 1) / (NMAX - 1) * (W - ml - mr); }
      function Y(v) { return mt + (ymax - v) / ymax * (H - mt - mb); }
      var out = [], n, pts = [], pe = [], yy, t;
      out.push('<line x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - mr) + '" y2="' + (H - mb) + '" style="stroke:var(--rule-strong)"/>');
      out.push('<line x1="' + ml + '" y1="' + mt + '" x2="' + ml + '" y2="' + (H - mb) + '" style="stroke:var(--rule-strong)"/>');
      [0, 10, 20, 30, 40].forEach(function (v) {
        out.push('<line x1="' + (ml - 4) + '" y1="' + Y(v).toFixed(1) + '" x2="' + ml + '" y2="' + Y(v).toFixed(1) + '" style="stroke:var(--rule-strong)"/>');
        out.push('<text x="' + (ml - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--muted);font-size:11px">' + v + '</text>');
      });
      for (n = 1; n <= NMAX; n++) {
        pe.push(X(n).toFixed(1) + "," + Y(n).toFixed(1));
        pts.push(X(n).toFixed(1) + "," + Y(calc(S.f, n).ce).toFixed(1));
      }
      out.push('<polyline points="' + pe.join(" ") + '" style="fill:none;stroke:var(--trap);stroke-width:1.5;stroke-dasharray:6 4"/>');
      out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      t = calc(S.f, S.n);
      out.push('<line x1="' + X(S.n).toFixed(1) + '" y1="' + mt + '" x2="' + X(S.n).toFixed(1) + '" y2="' + (H - mb) + '" style="stroke:var(--rule-strong);stroke-dasharray:2 3"/>');
      out.push('<circle cx="' + X(S.n).toFixed(1) + '" cy="' + Y(t.ce).toFixed(1) + '" r="5" style="fill:var(--accent);stroke:var(--surface);stroke-width:1.5"/>');
      out.push('<rect x="' + (X(S.n) - 5).toFixed(1) + '" y="' + (Y(S.n) - 5).toFixed(1) + '" width="10" height="10" style="fill:var(--trap);stroke:var(--surface);stroke-width:1.5"/>');
      out.push('<text x="' + (ml + 8) + '" y="' + (mt + 12) + '" style="fill:var(--trap);font-size:11.5px">valor esperado</text>');
      out.push('<text x="' + (W - mr - 4) + '" y="' + (Y(Math.min(ymax - 1, calc(S.f, NMAX).ce)) - 8).toFixed(1) + '" text-anchor="end" style="fill:var(--accent-ink);font-size:11.5px">equivalente cierto</text>');
      out.push('<text x="' + ((ml + W - mr) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" style="fill:var(--muted);font-size:11.5px">lanzamientos máximos N</text>');
      [1, 10, 20, 30, 40].forEach(function (v) {
        out.push('<text x="' + X(v).toFixed(1) + '" y="' + (H - mb + 15) + '" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + v + '</text>');
      });
      out.push('<text x="14" y="' + ((mt + H - mb) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((mt + H - mb) / 2) + ')" style="fill:var(--muted);font-size:11.5px">dólares</text>');
      svg.innerHTML = out.join("");
      svg.setAttribute("aria-label", "Con N = " + S.n + " y utilidad " + FUN[S.f].nombre + ", el valor esperado es " + fmt(t.ev, 0) + " dólares y el equivalente cierto " + fmt(t.ce, 2) + " dólares.");
    }

    function update() {
      var t = calc(S.f, S.n), lim = FUN[S.f].lim;
      $("nv").textContent = S.n;
      $("ev").textContent = fmt(t.ev, 0) + " $";
      $("eu").textContent = fmt(t.eu, 3);
      $("ce").textContent = fmt(t.ce, 2) + " $";
      $("lim").textContent = lim === null ? "sin tope" : fmt(lim, 2) + " $";
      var txt;
      if (lim === null) txt = "Con utilidad lineal el equivalente cierto coincide con el valor esperado y crece sin límite con N. Es la paradoja: nadie pagaría eso.";
      else txt = "El valor esperado ya es " + fmt(t.ev, 0) + " dólares, pero con esta utilidad el juego equivale a " + fmt(t.ce, 2) + " dólares seguros, y por más que subas N no pasará de " + fmt(lim, 2) + ". Los premios enormes casi no pesan.";
      $("note").textContent = txt;
      draw();
    }

    var inN = $("n"), inF = $("f");
    inN.addEventListener("input", function () { S.n = Number(inN.value); update(); });
    inF.addEventListener("change", function () { S.f = inF.value; update(); });
    update();
  };
})();
