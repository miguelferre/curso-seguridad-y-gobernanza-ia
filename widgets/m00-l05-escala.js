/* Widget "m00-l05-escala": ley de potencias de la perdida frente al computo, los parametros o los datos,
   en escala log-log. Usa la forma de la ecuacion 2.1 del libro (Chinchilla):
   L(N,D) = A*N^-alfa + B*D^-beta + E, con A=406,4, B=410,7, E=1,69 y, por defecto, alfa=0,34 y beta=0,28.
   Los exponentes se pueden cambiar (parametros ilustrativos propios). En modo computo se usa la regla habitual
   C = 6*N*D (no esta en la seccion del libro; anadido externo de Hoffmann et al., 2022) y el reparto optimo entre N y D,
   que deja la parte reducible como una recta de pendiente -gamma, con gamma = alfa*beta/(alfa+beta).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var A = 406.4, B = 410.7, E = 1.69, AL0 = 0.34, BE0 = 0.28, G0 = 4;
  var N_FIJO = 7e10, D_FIJO = 1.4e12;
  var MODES = {
    c: { nombre: "Cómputo C", unidad: "FLOP", min: 18, max: 27, start: 23.77, term: "parte reducible", de: "de la parte reducible" },
    n: { nombre: "Parámetros N", unidad: "parámetros", min: 8, max: 13, start: 10.85, term: "término de parámetros", de: "del término de parámetros" },
    d: { nombre: "Datos D", unidad: "tokens", min: 9, max: 14, start: 12.15, term: "término de datos", de: "del término de datos" }
  };

  function injectStyle() {
    if (document.getElementById("w-esc-style")) return;
    var st = document.createElement("style");
    st.id = "w-esc-style";
    st.textContent = [
      ".w-esc{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-esc h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-esc .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-esc .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-esc .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-esc .w-f label b{color:var(--accent-ink);font-weight:600;text-transform:none;letter-spacing:0}",
      ".w-esc .w-f.w-off label{opacity:.55}",
      ".w-esc input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-esc select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-esc .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-esc button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-esc button:hover{background:var(--accent-soft)}",
      ".w-esc svg{display:block;width:100%;height:auto;margin:0 0 .5rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-esc .w-leg{display:flex;flex-wrap:wrap;gap:.3rem 1rem;margin:0 0 .8rem;color:var(--muted);font-size:.8rem}",
      ".w-esc .w-leg span::before{content:'';display:inline-block;width:1.4rem;height:0;border-top:3px solid var(--accent);vertical-align:middle;margin-right:.35rem}",
      ".w-esc .w-leg span.w-t::before{border-top:3px dashed var(--trap)}",
      ".w-esc .w-leg span.w-g::before{border-top:2px dotted var(--ex)}",
      ".w-esc dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-esc dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-esc dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-esc dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-esc dl.w-out dd.w-big{font-size:1.3rem}",
      ".w-esc .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-esc .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
  function sup(s) { return String(s).replace(/./g, function (c) { return SUP[c] || c; }); }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }).replace("-", "−"); }
  function f3(x) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }
  function sci(x) {
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    if (Math.round(m * 10) / 10 >= 10) { m = 1; e += 1; }
    return fmt(m, 1) + "·10" + sup(e);
  }
  function fx(k) { return k < 1000 ? "× " + fmt(k, k < 10 ? 2 : 1) : "× " + sci(k); }
  function svgPow(k) {
    if (k === 0) return "1";
    if (k === 1) return "10";
    return '10<tspan dy="-4" style="font-size:9px">' + String(k).replace("-", "−") + "</tspan>";
  }

  /* Devuelve la parte que sigue una ley de potencias (P), la perdida total (T) y el exponente de la recta (ex).
     Modo c: reparto optimo de C = 6*N*D entre N y D. Modo n: N variable con D fijo. Modo d: D variable con N fijo. */
  function calc(mode, lx, al, be) {
    var x = Math.pow(10, lx), P, T, ex, N, D, g;
    if (mode === "c") {
      g = Math.pow(al * A / (be * B), 1 / (al + be));
      N = g * Math.pow(x / 6, be / (al + be));
      D = x / 6 / N;
      P = A * Math.pow(N, -al) + B * Math.pow(D, -be);
      T = P + E;
      ex = al * be / (al + be);
    } else if (mode === "n") {
      P = A * Math.pow(x, -al);
      T = P + B * Math.pow(D_FIJO, -be) + E;
      ex = al;
    } else {
      P = B * Math.pow(x, -be);
      T = P + A * Math.pow(N_FIJO, -al) + E;
      ex = be;
    }
    return { x: x, P: P, T: T, ex: ex, N: N, D: D };
  }

  /* Estado -> lectura (sin DOM, para poder comprobarla). */
  function leer(mode, lx, al, be, ritmo) {
    var c0 = calc(mode, lx, al, be), k = Math.pow(2, 1 / c0.ex), lx1 = lx + Math.log10(k);
    var c1 = calc(mode, lx1, al, be);
    return { c0: c0, c1: c1, k: k, lx1: lx1, mitad: Math.pow(2, -c0.ex),
      anios: mode === "c" ? Math.log(k) / Math.log(ritmo) : null };
  }

  window.WIDGETS["m00-l05-escala"] = function (el) {
    injectStyle();
    var id = "w-esc-" + (++uid);
    var S = { mode: "c", al: AL0, be: BE0, lx: MODES.c.start, g: G0 };

    el.innerHTML = '<div class="w-esc">' +
      '<h4>Ley de escala en log-log</h4>' +
      '<p class="w-hint">Forma del libro: L = 406,4·N<sup>−α</sup> + 410,7·D<sup>−β</sup> + 1,69. La recta es la parte que sigue la ley de potencias; la curva discontinua es la pérdida total, con su suelo.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-m">Qué escalas</label><select id="' + id + '-m"><option value="c">Cómputo (reparto óptimo de N y D)</option><option value="n">Parámetros N (datos fijos)</option><option value="d">Datos D (parámetros fijos)</option></select></div>' +
      '<div class="w-f" id="' + id + '-fa"><label for="' + id + '-a">Exponente α (parámetros) <b id="' + id + '-av"></b></label><input type="range" id="' + id + '-a" min="0.05" max="0.6" step="0.01" value="' + AL0 + '"></div>' +
      '<div class="w-f" id="' + id + '-fb"><label for="' + id + '-b">Exponente β (datos) <b id="' + id + '-bv"></b></label><input type="range" id="' + id + '-b" min="0.05" max="0.6" step="0.01" value="' + BE0 + '"></div>' +
      '<div class="w-f"><label for="' + id + '-x">Punto de partida <b id="' + id + '-xv"></b></label><input type="range" id="' + id + '-x" min="18" max="27" step="0.05" value="' + S.lx + '"></div>' +
      '<div class="w-f"><label for="' + id + '-g">Cómputo por año <b id="' + id + '-gv"></b></label><input type="range" id="' + id + '-g" min="2" max="8" step="0.5" value="' + S.g + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-r">Valores del libro</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 300" role="img" aria-label=""></svg>' +
      '<p class="w-leg"><span>parte que sigue la ley (recta)</span><span class="w-t">pérdida total</span><span class="w-g">bajar a la mitad</span></p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Exponente de la recta</dt><dd id="' + id + '-o-e"></dd></div>' +
      '<div><dt>Al duplicar la escala, queda en</dt><dd id="' + id + '-o-h"></dd></div>' +
      '<div><dt>Para dividirla por dos, multiplica por</dt><dd class="w-big" id="' + id + '-o-k"></dd></div>' +
      '<div><dt>Punto de partida</dt><dd id="' + id + '-o-0"></dd></div>' +
      '<div><dt>Tras ese factor</dt><dd id="' + id + '-o-1"></dd></div>' +
      '<div><dt>Años al ritmo elegido</dt><dd id="' + id + '-o-y"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Solo los exponentes 0,34 y 0,28 y las constantes 406,4, 410,7 y 1,69 vienen del libro (ecuación 2.1). Cambiar los exponentes es un ejercicio propio: los valores resultantes son ilustrativos. El modo Cómputo usa C ≈ 6ND, y los puntos de partida usan 7·10¹⁰ parámetros y 1,4·10¹² tokens (Chinchilla): son un añadido externo, de Hoffmann et al. (2022), y no están en el libro. En Parámetros los datos se fijan en 1,4·10¹² tokens y en Datos los parámetros en 7·10¹⁰.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inM = $("m"), inA = $("a"), inB = $("b"), inX = $("x"), inG = $("g"), svg = $("svg");

    function setText(k, t) { $(k).textContent = t; }

    function draw(r) {
      var M = MODES[S.mode], W = 600, H = 300, ml = 58, mr = 14, mt = 12, mb = 38, i, n = 120, lx, c, out = [];
      var xmin = M.min, xmax = Math.max(M.max, Math.ceil(r.lx1));
      var pts = [], lo = Infinity, hi = -Infinity, ymin, ymax, stepX, stepY, k, v;
      for (i = 0; i < n; i++) {
        lx = xmin + (xmax - xmin) * i / (n - 1);
        c = calc(S.mode, lx, S.al, S.be);
        pts.push({ lx: lx, p: Math.log10(c.P), t: Math.log10(c.T) });
        if (pts[i].p < lo) lo = pts[i].p;
        if (pts[i].t > hi) hi = pts[i].t;
      }
      ymin = Math.floor(lo); ymax = Math.ceil(hi);
      if (ymax - ymin < 2) ymin = ymax - 2;
      stepX = Math.max(1, Math.ceil((xmax - xmin) / 9));
      stepY = Math.max(1, Math.ceil((ymax - ymin) / 8));
      function px(a) { return ml + (a - xmin) / (xmax - xmin) * (W - ml - mr); }
      function py(b) { return mt + (ymax - b) / (ymax - ymin) * (H - mt - mb); }

      for (k = ymin; k <= ymax; k += stepY) {
        out.push('<line x1="' + ml + '" y1="' + py(k).toFixed(1) + '" x2="' + (W - mr) + '" y2="' + py(k).toFixed(1) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + (ml - 6) + '" y="' + (py(k) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font-size:13px">' + svgPow(k) + "</text>");
      }
      for (k = xmin; k <= xmax; k += stepX) {
        out.push('<line x1="' + px(k).toFixed(1) + '" y1="' + mt + '" x2="' + px(k).toFixed(1) + '" y2="' + (H - mb) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + px(k).toFixed(1) + '" y="' + (H - mb + 15) + '" text-anchor="middle" style="fill:var(--faint);font-size:13px">' + svgPow(k) + "</text>");
      }
      out.push('<rect x="' + ml + '" y="' + mt + '" width="' + (W - ml - mr) + '" height="' + (H - mt - mb) + '" style="fill:none;stroke:var(--rule-strong);stroke-width:1"/>');
      out.push('<text x="' + (ml + (W - ml - mr) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" style="fill:var(--muted);font-size:13px">' + M.nombre + " (" + M.unidad + ", escala log)</text>");
      out.push('<text transform="rotate(-90)" x="' + (-(mt + (H - mt - mb) / 2)) + '" y="13" text-anchor="middle" style="fill:var(--muted);font-size:13px">pérdida (escala log)</text>');

      if (Math.log10(E) > ymin && Math.log10(E) < ymax) {
        out.push('<line x1="' + ml + '" y1="' + py(Math.log10(E)).toFixed(1) + '" x2="' + (W - mr) + '" y2="' + py(Math.log10(E)).toFixed(1) + '" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:1 4"/>');
        out.push('<text x="' + (W - mr - 4) + '" y="' + (py(Math.log10(E)) + 13).toFixed(1) + '" text-anchor="end" style="fill:var(--muted);font-size:13px">suelo E = 1,69</text>');
      }
      v = pts.map(function (q, j) { return (j ? "L" : "M") + px(q.lx).toFixed(1) + " " + py(q.t).toFixed(1); }).join(" ");
      out.push('<path d="' + v + '" style="fill:none;stroke:var(--trap);stroke-width:2;stroke-dasharray:6 4"/>');
      v = pts.map(function (q, j) { return (j ? "L" : "M") + px(q.lx).toFixed(1) + " " + py(q.p).toFixed(1); }).join(" ");
      out.push('<path d="' + v + '" style="fill:none;stroke:var(--accent);stroke-width:3"/>');

      var x0 = px(S.lx), x1 = px(r.lx1), y0 = py(Math.log10(r.c0.P)), y1 = py(Math.log10(r.c1.P));
      out.push('<path d="M' + x0.toFixed(1) + " " + y0.toFixed(1) + " H" + x1.toFixed(1) + " V" + y1.toFixed(1) + '" style="fill:none;stroke:var(--ex);stroke-width:2;stroke-dasharray:2 3"/>');
      out.push('<circle cx="' + x0.toFixed(1) + '" cy="' + y0.toFixed(1) + '" r="5" style="fill:var(--accent)"/>');
      out.push('<circle cx="' + x1.toFixed(1) + '" cy="' + y1.toFixed(1) + '" r="5" style="fill:var(--ex)"/>');
      out.push('<text x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (y0 - 7).toFixed(1) + '" text-anchor="middle" style="fill:var(--ex);font-size:14px;font-weight:700">' + fx(r.k) + "</text>");
      out.push('<text x="' + (x1 > W - 60 ? x1 - 8 : x1 + 8).toFixed(1) + '" y="' + ((y0 + y1) / 2 + 4).toFixed(1) + '" text-anchor="' + (x1 > W - 60 ? "end" : "start") + '" style="fill:var(--ex);font-size:14px;font-weight:700">÷ 2</text>');
      svg.innerHTML = out.join("");
    }

    function render() {
      var M = MODES[S.mode], r = leer(S.mode, S.lx, S.al, S.be, S.g), c0 = r.c0, c1 = r.c1, term = M.term, note;
      setText("av", fmt(S.al, 2)); setText("bv", fmt(S.be, 2));
      setText("xv", sci(c0.x) + " " + M.unidad); setText("gv", "× " + fmt(S.g, 1));
      $("fa").classList.toggle("w-off", S.mode === "d");
      $("fb").classList.toggle("w-off", S.mode === "n");
      setText("o-e", S.mode === "c" ? fmt(c0.ex, 3) + " (αβ/(α+β))" : fmt(c0.ex, 2) + (S.mode === "n" ? " (α)" : " (β)"));
      setText("o-h", fmt(r.mitad * 100, 1) + " % " + M.de);
      setText("o-k", fx(r.k) + " " + (S.mode === "c" ? "de cómputo" : S.mode === "n" ? "en parámetros" : "en datos"));
      setText("o-0", sci(c0.x) + " " + M.unidad + ": " + term + " " + f3(c0.P) + "; pérdida total " + f3(c0.T));
      setText("o-1", sci(c1.x) + " " + M.unidad + ": " + term + " " + f3(c1.P) + "; pérdida total " + f3(c1.T) + " (" + fmt((c1.T / c0.T - 1) * 100, 1) + " %)");
      setText("o-y", S.mode === "c" ? fmt(r.anios, 1) + " años (× " + fmt(S.g, 1) + " al año)" : "solo se calcula en modo Cómputo");
      if (S.mode === "c") {
        note = "Con el reparto óptimo, los dos términos caen a la vez y forman una sola recta de pendiente −" + fmt(c0.ex, 3) + ". Bajar a la mitad esa parte cuesta " + fx(r.k) +
          " de cómputo, y la pérdida total solo pasa de " + f3(c0.T) + " a " + f3(c1.T) + ", porque el suelo de 1,69 no se mueve.";
      } else {
        note = "Escalas una sola cosa: el otro término queda fijo y la pérdida total no bajará de " + f3(c1.T - c1.P) + " por mucho que la aumentes. Con presupuesto fijo conviene subir parámetros y datos a la vez.";
      }
      if (Math.abs(S.al - AL0) > 0.001 || Math.abs(S.be - BE0) > 0.001) {
        note += " Ojo: no usas los exponentes del libro (0,34 y 0,28); lo que ves es ilustrativo.";
      }
      setText("note", note);
      svg.setAttribute("aria-label", "Gráfica log-log de " + M.nombre + ". La " + term + " baja como una recta de pendiente −" + fmt(c0.ex, 3) +
        "; la pérdida total se aplana contra su suelo. Dividir por dos la " + term + " pide multiplicar por " + fmt(r.k, 1) + ".");
      draw(r);
    }

    function setMode(m) {
      var M = MODES[m];
      S.mode = m; S.lx = M.start;
      inX.min = String(M.min); inX.max = String(M.max); inX.value = String(M.start);
      render();
    }

    inM.addEventListener("change", function () { setMode(inM.value); });
    inA.addEventListener("input", function () { S.al = parseFloat(inA.value); render(); });
    inB.addEventListener("input", function () { S.be = parseFloat(inB.value); render(); });
    inX.addEventListener("input", function () { S.lx = parseFloat(inX.value); render(); });
    inG.addEventListener("input", function () { S.g = parseFloat(inG.value); render(); });
    $("r").addEventListener("click", function () {
      S.al = AL0; S.be = BE0; S.g = G0;
      inA.value = String(AL0); inB.value = String(BE0); inG.value = String(G0);
      setMode(S.mode);
    });

    setMode("c");
  };
  window.WIDGETS["m00-l05-escala"]._calc = { calc: calc, leer: leer };
})();
