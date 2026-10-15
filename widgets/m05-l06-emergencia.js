/* Simulador "m05-l06-emergencia": la misma mejora suave del modelo, leída con tres métricas.
   MODELO PROPIO DE JUGUETE (no es de un modelo real). La pérdida por token baja con la escala como una ley de
   potencias, sin saltos: l(k) = 0,01 + 2,29 * 10^(-0,4 k), con k = órdenes de magnitud sobre el modelo mínimo (0 a 6).
   q = e^(-l) es la probabilidad de acertar un token (con k = 0, l = ln 10: azar entre 10 dígitos).
   Tres métricas: acierto exacto de una respuesta de L tokens (q^L, medido con n ejemplos), acierto por token (q)
   y log-verosimilitud media por token (ln q = -l). Es el argumento de Schaeffer, Miranda y Koyejo (2023,
   arXiv 2304.15004), aquí en versión mínima. Cálculo determinista, sin azar.
   Sin dependencias; estilos con las variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, KMAX = 6, ALPHA = 0.4, LINF = 0.01, L0 = 2.3;

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-em-style")) return;
    var st = document.createElement("style");
    st.id = "w-em-style";
    st.textContent = [
      ".w-em{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-em h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-em .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-em .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-em .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-em .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-em input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-em select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-em .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-em button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-em button:hover{background:var(--accent-soft)}",
      ".w-em svg{display:block;width:100%;height:auto;margin:0 0 .5rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-em .w-leg{display:flex;flex-wrap:wrap;gap:.3rem 1.1rem;margin:0 0 .8rem;font-size:.8rem;color:var(--muted)}",
      ".w-em .w-leg i{display:inline-block;width:1.4rem;height:0;border-top:3px solid;vertical-align:middle;margin-right:.35rem}",
      ".w-em dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-em dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-em dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-em dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-em .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-em .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pct(p) {
    var v = p * 100;
    if (v === 0) return "0 %";
    return fmt(v, v < 1 ? 2 : v < 10 ? 1 : 0) + " %";
  }

  /* Modelo. loss(k): pérdida por token; tok(k): q; exact(k, L): q^L; meas(k, L, n): acierto exacto medido con n ejemplos. */
  function loss(k) { return LINF + (L0 - LINF) * Math.pow(10, -ALPHA * k); }
  function tok(k) { return Math.exp(-loss(k)); }
  function exact(k, L) { return Math.exp(-L * loss(k)); }
  function meas(k, L, n) { return Math.round(exact(k, L) * n) / n; }
  /* Valor de cada métrica en k. "ll" es la log-verosimilitud media por token (negativa, ideal 0). */
  function value(metric, k, L, n) {
    if (metric === "exacto") return meas(k, L, n);
    if (metric === "token") return tok(k);
    return -loss(k);
  }
  function rawValue(metric, k, L) {
    if (metric === "exacto") return exact(k, L);
    if (metric === "token") return tok(k);
    return -loss(k);
  }
  /* Primera escala en la que la métrica (sin cuantizar) recorre el 10 % de su rango total. */
  function onset(metric, L) {
    var a = rawValue(metric, 0, L), b = rawValue(metric, KMAX, L), k, f;
    for (k = 0; k <= KMAX + 1e-9; k += 0.01) {
      f = (rawValue(metric, k, L) - a) / (b - a);
      if (f >= 0.1) return k;
    }
    return KMAX;
  }

  var NAMES = { exacto: "Acierto exacto", token: "Acierto por token", ll: "Log-verosimilitud por token" };

  function widget(el) {
    injectStyle();
    var id = "w-em-" + (++uid);
    var M = "exacto", L = 10, N = 100, K = 3;

    el.innerHTML = '<div class="w-em">' +
      '<h4>La misma mejora, tres formas de medirla</h4>' +
      '<p class="w-hint">Un modelo de juguete mejora con la escala de forma suave: solo cambia cómo lo puntuamos. Elige la métrica (acierto exacto: todo el texto correcto; por token: crédito parcial; log-verosimilitud: continua) y observa dónde parece que la capacidad se "enciende".</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-m">Métrica</label><select id="' + id + '-m">' +
      '<option value="exacto">Acierto exacto</option>' +
      '<option value="token">Acierto por token</option>' +
      '<option value="ll">Log-verosimilitud por token</option>' +
      '<option value="todas">Las tres (escaladas)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-l">Longitud de la respuesta <b id="' + id + '-lv"></b></label><input type="range" id="' + id + '-l" min="1" max="20" step="1" value="' + L + '"></div>' +
      '<div class="w-f"><label for="' + id + '-n">Ejemplos de prueba</label><select id="' + id + '-n">' +
      '<option value="30">30</option><option value="100" selected>100</option><option value="1000">1000</option><option value="100000">100 000</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-k">Escala del modelo <b id="' + id + '-kv"></b></label><input type="range" id="' + id + '-k" min="0" max="' + KMAX + '" step="0.1" value="' + K + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-p0">Valores iniciales</button><button type="button" id="' + id + '-p1">Respuesta de un solo token</button><button type="button" id="' + id + '-p2">Muchos ejemplos de prueba</button><button type="button" id="' + id + '-p3">Comparar las tres</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 272" role="img" aria-label=""></svg>' +
      '<p class="w-leg" id="' + id + '-leg"></p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Métrica en el marcador</dt><dd id="' + id + '-o-v"></dd></div>' +
      '<div><dt>Probabilidad real de acierto exacto</dt><dd id="' + id + '-o-t"></dd></div>' +
      '<div><dt>Despegue de la métrica elegida</dt><dd id="' + id + '-o-d"></dd></div>' +
      '<div><dt>Pérdida por token en el marcador</dt><dd id="' + id + '-o-l"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo propio de juguete, no de un modelo real. Escala en órdenes de magnitud sobre el modelo mínimo (0 a 6). Pérdida por token = 0,01 + 2,29 × 10<sup>−0,4 × escala</sup>; q = e<sup>−pérdida</sup>; acierto exacto = q<sup>L</sup>, medido con los ejemplos de prueba elegidos (redondeado, sin azar). "Despegue" = primera escala en la que la métrica recorre el 10 % de su rango. La idea viene del debate de Schaeffer, Miranda y Koyejo (2023), añadido externo a la lección; el modelo numérico es propio.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var selM = $("m"), inL = $("l"), selN = $("n"), inK = $("k"), svg = $("svg");

    function update() {
      var x0 = 58, x1 = 588, y0 = 14, y1 = 218, all = M === "todas", out = [], k, v, i, pts;
      var ymin = 0, ymax = 1, ticks;
      if (M === "ll") { ymin = -2.4; ymax = 0; ticks = [-2, -1.5, -1, -0.5, 0]; } else { ticks = [0, 0.25, 0.5, 0.75, 1]; }
      function x(kk) { return x0 + (x1 - x0) * kk / KMAX; }
      function y(vv) { return y1 - (y1 - y0) * (vv - ymin) / (ymax - ymin); }
      function norm(metric, kk) {
        var a = rawValue(metric, 0, L), b = rawValue(metric, KMAX, L);
        var vv = metric === "exacto" ? meas(kk, L, N) : rawValue(metric, kk, L);
        return (vv - a) / (b - a);
      }
      for (i = 0; i < ticks.length; i++) {
        v = ticks[i];
        out.push('<line x1="' + x0 + '" y1="' + y(v).toFixed(1) + '" x2="' + x1 + '" y2="' + y(v).toFixed(1) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + (x0 - 6) + '" y="' + (y(v) + 5).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font:16px var(--mono)">' + (M === "ll" || all ? fmt(v, all ? 2 : 1) : Math.round(v * 100) + " %") + '</text>');
      }
      for (k = 0; k <= KMAX; k++) out.push('<text x="' + x(k) + '" y="240" text-anchor="middle" style="fill:var(--faint);font:16px var(--mono)">' + k + '</text>');
      out.push('<text x="' + ((x0 + x1) / 2) + '" y="264" text-anchor="middle" style="fill:var(--faint);font:16px var(--mono)">escala: órdenes de magnitud sobre el modelo mínimo</text>');

      function curve(metric, style) {
        pts = [];
        for (k = 0; k <= KMAX + 1e-9; k += 0.05) pts.push(x(k).toFixed(1) + "," + y(all ? norm(metric, k) : value(metric, k, L, N)).toFixed(1));
        out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke-width:2.5;' + style + '"/>');
      }
      var stEx = "stroke:var(--ex)", stTok = "stroke:var(--ink);stroke-dasharray:6 4", stLl = "stroke:var(--accent)";
      if (all) { curve("exacto", stEx); curve("token", stTok); curve("ll", stLl); }
      else curve(M, M === "exacto" ? stEx : M === "token" ? stTok : stLl);

      if (M === "exacto" || all) {
        var yf = all ? y((1 / N) / rawValue("exacto", KMAX, L)) : y(1 / N);
        if (1 / N > 0.004) out.push('<line x1="' + x0 + '" y1="' + yf.toFixed(1) + '" x2="' + x1 + '" y2="' + yf.toFixed(1) + '" style="stroke:var(--faint);stroke-width:1;stroke-dasharray:2 4"/>');
      }
      out.push('<line x1="' + x(K).toFixed(1) + '" y1="' + y0 + '" x2="' + x(K).toFixed(1) + '" y2="' + y1 + '" style="stroke:var(--ink);stroke-width:1"/>');
      if (all) {
        ["exacto", "token", "ll"].forEach(function (mm) {
          out.push('<circle cx="' + x(K).toFixed(1) + '" cy="' + y(norm(mm, K)).toFixed(1) + '" r="4.5" style="fill:' + (mm === "exacto" ? "var(--ex)" : mm === "token" ? "var(--ink)" : "var(--accent)") + '"/>');
        });
      } else {
        out.push('<circle cx="' + x(K).toFixed(1) + '" cy="' + y(value(M, K, L, N)).toFixed(1) + '" r="4.5" style="fill:' + (M === "exacto" ? "var(--ex)" : M === "token" ? "var(--ink)" : "var(--accent)") + '"/>');
      }
      svg.innerHTML = out.join("");

      var legs = all
        ? '<span><i style="border-color:var(--ex)"></i>Acierto exacto</span><span><i style="border-color:var(--ink);border-top-style:dashed"></i>Acierto por token</span><span><i style="border-color:var(--accent)"></i>Log-verosimilitud</span><span>Línea de puntos: resolución de la prueba (1 / ejemplos)</span>'
        : '<span><i style="border-color:' + (M === "exacto" ? "var(--ex)" : M === "token" ? "var(--ink)" : "var(--accent)") + '"></i>' + NAMES[M] + '</span>' + (M === "exacto" ? '<span>Línea de puntos: resolución de la prueba (1 / ejemplos)</span>' : "");
      $("leg").innerHTML = legs;

      $("lv").textContent = L + (L === 1 ? " token" : " tokens");
      $("kv").textContent = "+" + fmt(K, 1) + " órdenes";
      var real = exact(K, L), shown = M === "todas" ? "exacto" : M;
      var vv = value(shown, K, L, N);
      $("o-v").textContent = shown === "ll" ? fmt(vv, 2) : pct(vv);
      $("o-t").textContent = pct(real);
      var on = onset(shown === "exacto" ? "exacto" : shown, L);
      $("o-d").textContent = M === "todas" ? "exacto " + fmt(onset("exacto", L), 1) + " · log-ver. " + fmt(onset("ll", L), 1) : "escala " + fmt(on, 1);
      $("o-l").textContent = fmt(loss(K), 2);

      var oEx = onset("exacto", L), oLl = onset("ll", L), note = $("note");
      if (M === "todas") {
        note.textContent = "La log-verosimilitud ya ha recorrido el 10 % de su mejora en la escala " + fmt(oLl, 1) + "; el acierto exacto no lo hace hasta la escala " + fmt(oEx, 1) + ". Es la misma mejora del mismo modelo, y solo una de las tres curvas parece un salto.";
      } else if (M === "exacto") {
        if (vv === 0 && real > 0) {
          note.textContent = "Con " + fmt(N, 0) + " ejemplos se lee 0 %, pero la probabilidad real de acertar es " + pct(real) + ". Subir los ejemplos de prueba deja ver el arranque que la prueba pequeña esconde.";
        } else if (L === 1) {
          note.textContent = "Con una respuesta de un solo token, el acierto exacto coincide con el acierto por token y la curva es suave: no hay salto. El salto viene de exigir muchos tokens correctos a la vez.";
        } else {
          note.textContent = "Exigir " + L + " tokens correctos a la vez eleva q a la potencia " + L + ": la métrica apenas se mueve (menos del 10 % de su recorrido) hasta la escala " + fmt(oEx, 1) + " y luego sube deprisa. La pérdida por token, que mide lo mismo sin ese filtro, ya mejoraba desde el principio. Cambia la métrica y compara.";
        }
      } else if (M === "token") {
        note.textContent = "Con crédito parcial no hay arranque: el acierto por token mejora desde la escala 0 y va frenando. Es la respuesta completa, que exige acertar todos, la que parece encenderse de golpe.";
      } else {
        note.textContent = "Sin filtro de todo o nada, la mejora es una ley de potencias: predecible desde los modelos pequeños. Esto es lo que dice el debate: parte de la emergencia depende de la métrica. No dice que toda emergencia lo sea.";
      }
      svg.setAttribute("aria-label", "Curva de " + (all ? "las tres métricas escaladas" : NAMES[M].toLowerCase()) + " frente a la escala del modelo. En la escala " + fmt(K, 1) + " el acierto exacto real es " + pct(real) + " y el medido con " + fmt(N, 0) + " ejemplos es " + pct(meas(K, L, N)) + ".");
    }

    function set(m, l, n, k) {
      M = m; L = l; N = n; K = k;
      selM.value = m; inL.value = l; selN.value = n; inK.value = k;
      update();
    }
    selM.addEventListener("change", function () { M = selM.value; update(); });
    inL.addEventListener("input", function () { L = +inL.value; update(); });
    selN.addEventListener("change", function () { N = +selN.value; update(); });
    inK.addEventListener("input", function () { K = +inK.value; update(); });
    $("p0").addEventListener("click", function () { set("exacto", 10, 100, 3); });
    $("p1").addEventListener("click", function () { set("exacto", 1, 100, 3); });
    $("p2").addEventListener("click", function () { set("exacto", 10, 100000, 3); });
    $("p3").addEventListener("click", function () { set("todas", 10, 100, 3); });
    update();
  }

  widget.modelo = { loss: loss, tok: tok, exact: exact, meas: meas, onset: onset };
  window.WIDGETS["m05-l06-emergencia"] = widget;
})();
