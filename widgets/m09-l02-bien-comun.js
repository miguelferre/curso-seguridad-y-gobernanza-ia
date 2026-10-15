/* Simulador "m09-l02-bien-comun": problema de accion colectiva con n agentes (juego de bienes publicos).
   MODELO PROPIO del curso (el libro da la idea y la matriz con b y c, no este modelo ni sus cifras):
     cada agente decide contribuir (paga c) o ser gorron. Lo aportado se multiplica por r y se reparte a partes iguales entre los n.
     Con k contribuyentes, todos reciben r c k / n.  Contribuyente: r c k / n - c.  Gorron: r c k / n - s,
     donde s es la sancion esperada al gorron (reputacion o norma social = coercion mutua; multa o regulacion = coercion externa).
     Paso de contribuyente a gorron con los demas fijos:  G = c (1 - r / n) - s.  Si G > 0, ser gorron domina.
     Dinamica de imitacion (propia): la fraccion x de contribuyentes cambia como x' = x + x (1 - x) g, con g = -G / c, acotada a [0, 1].
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, STEPS = 40;

  function injectStyle() {
    if (document.getElementById("w-bc-style")) return;
    var st = document.createElement("style");
    st.id = "w-bc-style";
    st.textContent = [
      ".w-bc{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-bc h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-bc .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-bc .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-bc .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-bc .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-bc input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-bc .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-bc button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-bc button:hover{background:var(--accent-soft)}",
      ".w-bc button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-bc .w-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:0 0 .5rem}",
      ".w-bc svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-bc .w-leg{display:flex;flex-wrap:wrap;gap:.3rem .9rem;color:var(--muted);font-size:.78rem;margin:0 0 .8rem}",
      ".w-bc .w-leg i{display:inline-block;width:.9rem;height:.25rem;border-radius:2px;vertical-align:middle;margin-right:.3rem}",
      ".w-bc dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-bc dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-bc dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-bc dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-bc .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-bc .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { if (Math.abs(x) < 1e-9) x = 0; return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d }); }

  /* Ganancia de pasar de contribuyente a gorron y trayectoria de la fraccion de contribuyentes. */
  function gain(n, c, r, s) { return c * (1 - r / n) - s; }
  function path(x0, G, c) {
    var xs = [x0], x = x0, g = -G / c, t;
    for (t = 0; t < STEPS; t++) {
      x = x + x * (1 - x) * g;
      if (x < 1e-4) x = 0;
      if (x > 1 - 1e-4) x = 1;
      xs.push(x);
    }
    return xs;
  }
  function avg(x, n, c, r, s) { return c * x * (r - 1) - (1 - x) * s; }

  window.WIDGETS["m09-l02-bien-comun"] = function (el) {
    injectStyle();
    var id = "w-bc-" + (++uid);
    var n = 10, c = 10, r = 4, s = 0, k0 = 8;

    function slider(key, label, min, max, step, val) {
      return '<div class="w-f"><label for="' + id + '-' + key + '">' + label + ' <b id="' + id + '-' + key + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
    }
    el.innerHTML = '<div class="w-bc">' +
      '<h4>El gorrón y el bien común</h4>' +
      '<p class="w-hint">Cada agente decide si aporta o si se aprovecha de lo que aportan los demás. Lo aportado se multiplica y se reparte a partes iguales. Modelo propio del curso, no del libro.</p>' +
      '<div class="w-grid">' +
      slider("n", "Agentes", 2, 20, 1, n) + slider("c", "Coste de aportar", 1, 20, 1, c) + slider("r", "Multiplicador de lo aportado", 0.5, 10, 0.1, r) +
      slider("s", "Sanción esperada al gorrón", 0, 20, 0.5, s) + slider("k", "Aportan al empezar", 1, n - 1, 1, k0) + '</div>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-b0">Valores iniciales</button>' +
      '<button type="button" id="' + id + '-b1">Poner la sanción justo por encima del umbral</button></div>' +
      '<div class="w-charts"><svg id="' + id + '-p1" viewBox="0 0 320 240" role="img" aria-label=""></svg><svg id="' + id + '-p2" viewBox="0 0 320 240" role="img" aria-label=""></svg></div>' +
      '<p class="w-leg"><span><i style="background:var(--ex)"></i>Pago de quien aporta</span><span><i style="background:var(--trap)"></i>Pago del gorrón</span><span><i style="background:var(--accent)"></i>Fracción que aporta</span></p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Ganancia de pasar a gorrón</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Sanción mínima para que aportar domine</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Pago de cada uno si todos aportan</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Pago de cada uno si nadie aporta</dt><dd id="' + id + '-o4"></dd></div>' +
      '<div><dt>Fracción que aporta tras ' + STEPS + ' rondas</dt><dd id="' + id + '-o5"></dd></div>' +
      '<div><dt>Pago medio: al empezar y al final</dt><dd id="' + id + '-o6"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Pagos en puntos. Con k aportantes todos reciben r·c·k/n; quien aporta paga c y el gorrón paga la sanción s. Izquierda: pago según cuántos de los otros aportan. Derecha: qué pasa si cada ronda los agentes imitan lo que rinde más.</p>' +
      '</div>';

    function $(q) { return el.querySelector("#" + id + "-" + q); }
    var inN = $("n"), inC = $("c"), inR = $("r"), inS = $("s"), inK = $("k"), svg1 = $("p1"), svg2 = $("p2");

    function set(q, v) { $(q).textContent = v; }
    function line(pts, col, dash) {
      return '<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:' + col + ';stroke-width:2.2' + (dash ? ';stroke-dasharray:' + dash : '') + '"/>';
    }
    function axes(out, xt, yt) {
      out.push('<rect x="44" y="16" width="260" height="176" style="fill:none;stroke:var(--rule-strong);stroke-width:1"/>');
      out.push('<text x="174" y="226" text-anchor="middle" style="fill:var(--muted);font-size:10.5px">' + xt + '</text>');
      out.push('<text x="10" y="104" text-anchor="middle" transform="rotate(-90 10 104)" style="fill:var(--muted);font-size:10.5px">' + yt + '</text>');
    }

    function draw() {
      var G, sMin, xs, k, out, ymin, ymax, X, Y, pc = [], pf = [], v, kk, x0, t, res, pcx, pfx, text;
      n = +inN.value; c = +inC.value; r = +inR.value; s = +inS.value;
      inK.max = n - 1; if (+inK.value > n - 1) inK.value = n - 1; k0 = +inK.value;
      set("nv", n); set("cv", c); set("rv", "×" + fmt(r, 1)); set("sv", fmt(s, 1)); set("kv", k0 + " de " + n);
      G = gain(n, c, r, s); sMin = Math.max(0, c * (1 - r / n));
      x0 = k0 / n; xs = path(x0, G, c);

      /* Gráfico 1: pago según cuántos de los otros aportan (0 a n-1). */
      ymin = Math.min(0, -c, -s, r * c * 0 / n - s); ymax = 0;
      for (kk = 0; kk <= n - 1; kk++) {
        pcx = r * c * (kk + 1) / n - c; pfx = r * c * kk / n - s;
        ymin = Math.min(ymin, pcx, pfx); ymax = Math.max(ymax, pcx, pfx);
      }
      if (ymax - ymin < 1) ymax = ymin + 1;
      X = function (q) { return 44 + 260 * (n === 1 ? 0 : q / (n - 1)); };
      Y = function (q) { return 192 - 176 * (q - ymin) / (ymax - ymin); };
      out = []; axes(out, "Cuántos de los otros aportan", "Pago");
      out.push('<line x1="44" x2="304" y1="' + Y(0) + '" y2="' + Y(0) + '" style="stroke:var(--rule-strong);stroke-dasharray:2 4"/>');
      for (kk = 0; kk <= n - 1; kk++) {
        pc.push(X(kk) + "," + Y(r * c * (kk + 1) / n - c)); pf.push(X(kk) + "," + Y(r * c * kk / n - s));
      }
      out.push(line(pc, "var(--ex)")); out.push(line(pf, "var(--trap)", "6 3"));
      out.push('<text x="40" y="' + (Y(ymax) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + fmt(ymax, 0) + '</text>');
      out.push('<text x="40" y="' + (Y(ymin) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + fmt(ymin, 0) + '</text>');
      out.push('<text x="44" y="206" style="fill:var(--muted);font-size:10px">0</text><text x="304" y="206" text-anchor="end" style="fill:var(--muted);font-size:10px">' + (n - 1) + '</text>');
      svg1.innerHTML = out.join("");
      svg1.setAttribute("aria-label", "Pago de quien aporta y del gorrón según cuántos de los otros aportan. " + (G > 0 ? "La línea del gorrón queda por encima." : "La línea de quien aporta queda por encima o igual."));

      /* Gráfico 2: trayectoria de la fracción que aporta. */
      out = []; axes(out, "Ronda", "Fracción que aporta");
      X = function (q) { return 44 + 260 * q / STEPS; };
      Y = function (q) { return 192 - 176 * q; };
      pc = [];
      for (t = 0; t <= STEPS; t++) pc.push(X(t) + "," + Y(xs[t]));
      out.push(line(pc, "var(--accent)"));
      out.push('<text x="40" y="' + (Y(1) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">1</text><text x="40" y="' + (Y(0) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">0</text>');
      out.push('<text x="44" y="206" style="fill:var(--muted);font-size:10px">0</text><text x="304" y="206" text-anchor="end" style="fill:var(--muted);font-size:10px">' + STEPS + '</text>');
      svg2.innerHTML = out.join("");
      svg2.setAttribute("aria-label", "Fracción de agentes que aportan a lo largo de " + STEPS + " rondas: de " + fmt(x0, 2) + " a " + fmt(xs[STEPS], 2) + ".");

      set("o1", (G > 0 ? "+" : "") + fmt(G, 1) + (G > 0 ? " (ser gorrón compensa)" : " (aportar compensa o empata)"));
      set("o2", fmt(sMin, 1));
      set("o3", fmt(c * (r - 1), 1));
      set("o4", fmt(-s, 1));
      set("o5", fmt(xs[STEPS], 2));
      set("o6", fmt(avg(x0, n, c, r, s), 1) + " y " + fmt(avg(xs[STEPS], n, c, r, s), 1));
      if (r <= 1) text = "Con un multiplicador de 1 o menos, aportar no crea valor conjunto: no hay dilema, simplemente no compensa a nadie.";
      else if (Math.abs(G) < 1e-9) text = "Empate: aprovecharse y aportar rinden lo mismo, y la fracción de aportantes se queda donde empezó. Es el umbral: con un poco más de sanción o de multiplicador, aportar pasa a dominar.";
      else if (r >= n) text = "Con un multiplicador de " + fmt(n, 0) + " o más (el número de agentes), lo que aportas te vuelve entero: aportar ya no sale peor que aprovecharse.";
      else if (G > 0) text = "Problema de acción colectiva: todos ganarían más si todos aportaran (" + fmt(c * (r - 1), 1) + " frente a " + fmt(-s, 1) + "), pero a cada uno le sale mejor aprovecharse, así que la aportación se hunde.";
      else text = "La sanción supera la ganancia de aprovecharse: aportar ya es lo mejor para cada uno y la aportación sube hasta el máximo.";
      $("note").textContent = text;
    }

    [inN, inC, inR, inS, inK].forEach(function (x) { x.addEventListener("input", draw); });
    $("b0").addEventListener("click", function () { inN.value = 10; inC.value = 10; inR.value = 4; inS.value = 0; inK.max = 9; inK.value = 8; draw(); });
    $("b1").addEventListener("click", function () {
      var m = Math.max(0, +inC.value * (1 - +inR.value / +inN.value));
      inS.value = Math.min(20, Math.ceil((m + 0.01) * 2) / 2); draw();
    });
    draw();
  };
})();
