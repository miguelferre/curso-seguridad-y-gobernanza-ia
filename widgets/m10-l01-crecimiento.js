/* Simulador "m10-l01-crecimiento": curvas de produccion con y sin automatizacion por IA, en escala logaritmica
   (una linea recta es un ritmo constante; cada rejilla es una duplicacion), y reparto de la renta entre trabajo y capital.
   MODELO PROPIO E ILUSTRATIVO (no viene del libro; el libro solo da el orden de magnitud "mas de diez veces el ritmo actual"):
     - Una fraccion a de las tareas la hace el capital y el resto las personas: Y = A * (K/K0)^a * L^(1-a), con L = 1.
     - Cobb-Douglas competitivo: cuota del capital = a, cuota del trabajo = 1 - a.
     - Ahorro s = 25 %, depreciacion 5 %; el punto de partida es la economia actual con a0 = 1/3 y crecimiento g0.
     - Sin IA: a se queda en a0. Con IA: a sube r puntos por año hasta el techo.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var YEARS = 60, A0 = 1 / 3, SAVE = 0.25, DEP = 0.05;

  function injectStyle() {
    if (document.getElementById("w-m10cr-style")) return;
    var st = document.createElement("style");
    st.id = "w-m10cr-style";
    st.textContent = [
      ".w-m10cr{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m10cr h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m10cr .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m10cr .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-m10cr .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-m10cr .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-m10cr input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-m10cr .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-m10cr button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-m10cr button:hover{background:var(--accent-soft)}",
      ".w-m10cr svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-m10cr dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-m10cr dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-m10cr dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-m10cr dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-m10cr .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-m10cr .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-m10cr .w-key{display:flex;flex-wrap:wrap;gap:.3rem 1rem;font-size:.8rem;color:var(--muted);margin:0 0 .4rem}",
      ".w-m10cr .w-key i{display:inline-block;width:1.4rem;height:0;border-top:3px solid;vertical-align:middle;margin-right:.3rem}",
      ".w-m10cr .w-key i.sq{width:.8rem;height:.8rem;border:0;vertical-align:-1px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function pct(x, d) { return fmt(x * 100, d) + " %"; }
  function dbl(g) { return g > 0 ? Math.log(2) / Math.log(1 + g) : Infinity; }
  function yrs(v) { return isFinite(v) ? fmt(v, 1) + " años" : "nunca"; }

  /* Simulacion anual. r: fraccion de tareas que se automatizan por año; amax: techo; g0: crecimiento actual. */
  function simulate(g0, r, amax) {
    var gA = Math.pow(1 + g0, 1 - A0) - 1, K0 = SAVE / (g0 + DEP);
    var K = K0, A = 1, t, a, Y, out = [], top = Math.max(A0, amax);
    for (t = 0; t <= YEARS; t++) {
      a = Math.min(top, A0 + r * t);
      Y = A * Math.pow(K / K0, a);
      out.push({ t: t, a: a, Y: Y });
      K = (1 - DEP) * K + SAVE * Y;
      A *= 1 + gA;
    }
    return { pts: out, gA: gA };
  }
  /* Primer cruce de Y = 2, interpolando en escala logaritmica; Infinity si no llega. */
  function doubling(pts) {
    var i, l0, l1;
    for (i = 1; i < pts.length; i++) {
      if (pts[i].Y >= 2) {
        l0 = Math.log(pts[i - 1].Y); l1 = Math.log(pts[i].Y);
        return (i - 1) + (Math.log(2) - l0) / (l1 - l0);
      }
    }
    return Infinity;
  }

  window.WIDGETS["m10-l01-crecimiento"] = function (el) {
    injectStyle();
    var id = "w-m10cr-" + (++uid);
    var DEF = { g0: 2, r: 2, amax: 90, o: 25, yr: 30 };
    var S = { g0: DEF.g0, r: DEF.r, amax: DEF.amax, o: DEF.o, yr: DEF.yr };

    function slider(k, label, min, max, step) {
      return '<div class="w-f"><label for="' + id + '-' + k + '">' + label + ' <b id="' + id + '-' + k + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + S[k] + '"></div>';
    }
    function out(k, label) { return '<div><dt>' + label + '</dt><dd id="' + id + '-o-' + k + '"></dd></div>'; }

    el.innerHTML = '<div class="w-m10cr">' +
      '<h4>Crecimiento con y sin automatización, y quién cobra</h4>' +
      '<p class="w-hint">Modelo propio e ilustrativo: la IA hace que el capital ocupe una fracción creciente de las tareas. La producción sale en escala logarítmica: cada línea de la rejilla es una duplicación, y una recta es un ritmo constante.</p>' +
      '<div class="w-grid">' +
      slider("g0", "Crecimiento sin IA (ilustrativo)", 1, 4, 0.5) +
      slider("r", "Velocidad de automatización", 0, 4, 0.25) +
      slider("amax", "Techo de tareas automatizadas", 34, 99, 1) +
      slider("o", "Capital en manos de la población", 0, 100, 5) +
      slider("yr", "Año que miras", 0, YEARS, 1) +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-b0">Valores iniciales</button>' +
      '<button type="button" id="' + id + '-b1">Techo bajo: 60 %</button>' +
      '<button type="button" id="' + id + '-b2">Casi total y rápido</button></div>' +
      '<div class="w-key"><span><i style="border-color:var(--faint);border-top-style:dashed"></i>Sin IA</span><span><i style="border-color:var(--accent)"></i>Con IA</span></div>' +
      '<svg id="' + id + '-c1" viewBox="0 0 600 256" role="img" aria-label=""></svg>' +
      '<div class="w-key"><span><i class="sq" style="background:var(--ex)"></i>Cuota del trabajo (con IA)</span><span><i class="sq" style="background:var(--trap)"></i>Cuota del capital (con IA)</span></div>' +
      '<svg id="' + id + '-c2" viewBox="0 0 600 132" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      out("sin", "Sin IA: se duplica en") + out("con", "Con IA: se duplica en") +
      out("g", "Crecimiento en el año elegido") + out("eq", "Crecimiento de equilibrio con este techo") +
      out("Y", "Producción en el año elegido") + out("sh", "Reparto trabajo / capital") +
      out("w", "Salario medio (100 = hoy)") + out("h", "Hogar típico (100 = hoy)") +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Parámetros fijos e ilustrativos (el equilibrio tarda décadas en alcanzarse, porque el capital hay que acumularlo): la economía actual tiene un tercio de las tareas en manos del capital, ahorra un 25 % y deprecia un 5 %. El hogar típico cobra el mismo salario que todos más la parte que le toca de la renta del capital que posee la población; el resto del capital es de pocos propietarios. No es una previsión.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var svg1 = $("c1"), svg2 = $("c2");

    function xs(t, x0, w) { return (x0 + w * t / YEARS).toFixed(1); }

    function drawGrowth(base, ai) {
      var L = 68, R = 14, T = 12, B = 44, W = 600 - L - R, H = 256 - T - B, i, k, s = [];
      var maxY = Math.max(ai.pts[YEARS].Y, base.pts[YEARS].Y, 2);
      var K = Math.max(1, Math.ceil(Math.log(maxY) / Math.LN2)), step = Math.max(1, Math.ceil(K / 6));
      function py(Y) { return (T + H * (1 - Math.log(Y) / Math.LN2 / K)).toFixed(1); }
      for (k = 0; k <= K; k += step) {
        s.push('<line x1="' + L + '" y1="' + py(Math.pow(2, k)) + '" x2="' + (L + W) + '" y2="' + py(Math.pow(2, k)) + '" style="stroke:var(--rule);stroke-width:1"/>');
        s.push('<text x="' + (L - 6) + '" y="' + (Number(py(Math.pow(2, k))) + 5) + '" text-anchor="end" style="fill:var(--muted);font-size:16px">×' + fmt(Math.pow(2, k), 0) + '</text>');
      }
      for (i = 0; i <= YEARS; i += 10) {
        s.push('<text x="' + xs(i, L, W) + '" y="' + (T + H + 18) + '" text-anchor="middle" style="fill:var(--muted);font-size:16px">' + i + '</text>');
      }
      s.push('<text x="' + (L + W / 2) + '" y="' + (T + H + 38) + '" text-anchor="middle" style="fill:var(--faint);font-size:15px">años</text>');
      s.push('<line x1="' + L + '" y1="' + py(2) + '" x2="' + (L + W) + '" y2="' + py(2) + '" style="stroke:var(--faint);stroke-width:1;stroke-dasharray:2 3"/>');
      function path(o, style) {
        return '<polyline points="' + o.pts.map(function (p) { return xs(p.t, L, W) + "," + py(p.Y); }).join(" ") + '" style="fill:none;' + style + '"/>';
      }
      s.push(path(base, "stroke:var(--faint);stroke-width:2;stroke-dasharray:6 4"));
      s.push(path(ai, "stroke:var(--accent);stroke-width:3"));
      s.push('<line x1="' + xs(S.yr, L, W) + '" y1="' + T + '" x2="' + xs(S.yr, L, W) + '" y2="' + (T + H) + '" style="stroke:var(--trap);stroke-width:1.5"/>');
      s.push('<circle cx="' + xs(S.yr, L, W) + '" cy="' + py(base.pts[S.yr].Y) + '" r="4" style="fill:var(--faint)"/>');
      s.push('<circle cx="' + xs(S.yr, L, W) + '" cy="' + py(ai.pts[S.yr].Y) + '" r="4.5" style="fill:var(--accent)"/>');
      svg1.innerHTML = s.join("");
      svg1.setAttribute("aria-label", "Producción en escala logarítmica durante 60 años. Sin IA llega a ×" + fmt(base.pts[YEARS].Y, 1) +
        " y con IA a ×" + fmt(ai.pts[YEARS].Y, 1) + ". Marca en el año " + S.yr + ".");
    }

    function drawShare(ai) {
      var L = 68, R = 14, T = 8, B = 26, W = 600 - L - R, H = 132 - T - B, i, s = [], top = [], bot = [];
      function py(v) { return (T + H * (1 - v)).toFixed(1); }
      for (i = 0; i <= YEARS; i++) {
        top.push(xs(i, L, W) + "," + py(1));
        bot.push(xs(i, L, W) + "," + py(1 - ai.pts[i].a));
      }
      s.push('<polygon points="' + xs(0, L, W) + "," + py(0) + " " + bot.join(" ") + " " + xs(YEARS, L, W) + "," + py(0) + '" style="fill:var(--ex);opacity:.75"/>');
      s.push('<polygon points="' + top.join(" ") + " " + bot.slice().reverse().join(" ") + '" style="fill:var(--trap);opacity:.75"/>');
      [0, 0.5, 1].forEach(function (v) {
        s.push('<text x="' + (L - 6) + '" y="' + (Number(py(v)) + 5) + '" text-anchor="end" style="fill:var(--muted);font-size:16px">' + fmt(v * 100, 0) + ' %</text>');
      });
      for (i = 0; i <= YEARS; i += 10) {
        s.push('<text x="' + xs(i, L, W) + '" y="' + (T + H + 18) + '" text-anchor="middle" style="fill:var(--muted);font-size:16px">' + i + '</text>');
      }
      s.push('<line x1="' + xs(S.yr, L, W) + '" y1="' + T + '" x2="' + xs(S.yr, L, W) + '" y2="' + (T + H) + '" style="stroke:var(--ink);stroke-width:1.5"/>');
      svg2.innerHTML = s.join("");
      svg2.setAttribute("aria-label", "Reparto de la renta: la cuota del trabajo pasa del " + pct(1 - A0, 0) + " a " + pct(1 - ai.pts[YEARS].a, 0) +
        " en el año 60. En el año " + S.yr + " es " + pct(1 - ai.pts[S.yr].a, 0) + ".");
    }

    function refresh() {
      var g0 = S.g0 / 100, r = S.r / 100, amax = S.amax / 100, o = S.o / 100, t = S.yr;
      var base = simulate(g0, 0, A0), ai = simulate(g0, r, amax);
      var p = ai.pts[t], pb = base.pts[t];
      var gyear = t < YEARS ? ai.pts[t + 1].Y / p.Y - 1 : p.Y / ai.pts[t - 1].Y - 1;
      var geq = Math.pow(1 + ai.gA, 1 / (1 - (r === 0 ? A0 : Math.max(A0, amax)))) - 1;
      var wage = (1 - p.a) * p.Y / (1 - A0) * 100;
      var hh = ((1 - p.a) * p.Y + o * p.a * p.Y) / ((1 - A0) + o * A0) * 100;
      var dAI = doubling(ai.pts);

      ["g0", "r", "amax", "o", "yr"].forEach(function (k) {
        $(k + "v").textContent = k === "g0" ? fmt(S.g0, 1) + " %" : k === "r" ? fmt(S.r, 2) + " pp/año" : k === "yr" ? S.yr : S[k] + " %";
      });
      $("o-sin").textContent = yrs(dbl(g0));
      $("o-con").textContent = isFinite(dAI) ? yrs(dAI) : "más de " + YEARS + " años";
      $("o-g").textContent = pct(gyear, 1) + " (duplicaría en " + yrs(dbl(gyear)) + ")";
      $("o-eq").textContent = pct(geq, 1) + " (duplicaría en " + yrs(dbl(geq)) + ")";
      $("o-Y").textContent = "×" + fmt(p.Y, 1) + " con IA; ×" + fmt(pb.Y, 1) + " sin IA";
      $("o-sh").textContent = fmt((1 - p.a) * 100, 0) + " % / " + fmt(p.a * 100, 0) + " %";
      $("o-w").textContent = fmt(wage, 0);
      $("o-h").textContent = fmt(hh, 0) + " (producción por habitante: " + fmt(p.Y * 100, 0) + ")";

      var note = $("note"), msg;
      if (r === 0 || amax <= A0 + 1e-9) {
        msg = "Sin automatización adicional, las dos curvas coinciden: crece lo de siempre. Sube la velocidad o el techo.";
      } else if (t === 0) {
        msg = "En el año 0 todo es igual. Mueve el año que miras para ver cuándo se separan las curvas y qué pasa con el reparto.";
      } else if (wage < 100) {
        msg = "En el año " + t + " la producción es ×" + fmt(p.Y, 1) + ", pero el salario medio está en " + fmt(wage, 0) +
          ": la cuota del trabajo cae más deprisa que crece la tarta, y el desplazamiento pesa más que la productividad. El hogar típico queda en " + fmt(hh, 0) + " porque " + (o < 0.5 ? "casi todo el capital es de pocos." : "una parte notable del capital es de la población.");
      } else if (hh < p.Y * 100 - 1) {
        msg = "Los salarios aguantan (" + fmt(wage, 0) + "), pero la producción por habitante (" + fmt(p.Y * 100, 0) + ") y el hogar típico (" + fmt(hh, 0) +
          ") se separan: sube el peso del capital y la parte que la población posee decide cuánto de la tarta le llega.";
      } else {
        msg = "Con el capital repartido entre la población, el hogar típico acompaña a la producción por habitante. Baja la parte que posee la población y verás abrirse la brecha.";
      }
      note.textContent = msg;
      drawGrowth(base, ai);
      drawShare(ai);
    }

    ["g0", "r", "amax", "o", "yr"].forEach(function (k) {
      $(k).addEventListener("input", function () { S[k] = parseFloat($(k).value); refresh(); });
    });
    function setAll(v) {
      Object.keys(v).forEach(function (k) { S[k] = v[k]; $(k).value = String(v[k]); });
      refresh();
    }
    $("b0").addEventListener("click", function () { setAll(DEF); });
    $("b1").addEventListener("click", function () { setAll({ g0: 2, r: 2, amax: 60, o: 25, yr: 30 }); });
    $("b2").addEventListener("click", function () { setAll({ g0: 2, r: 4, amax: 99, o: 25, yr: 40 }); });
    refresh();
  };
})();
