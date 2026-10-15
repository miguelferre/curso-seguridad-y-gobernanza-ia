/* Simulador "m07-l03-correlacion": ¿cuánto de una métrica de seguridad es solo capacidad general?
   DATOS ILUSTRATIVOS PROPIOS: 14 modelos ficticios y 8 métricas ficticias (no son bancos de pruebas reales ni
   resultados de modelos reales). Cada métrica se ha generado con una correlación objetivo con el índice de
   capacidades (de 0,93 a -0,62); las puntuaciones están redondeadas a un decimal y el simulador recalcula todo.
   Para cada métrica calcula r de Pearson, r^2, la recta de regresión y la dispersión residual. Un "método" hipotético
   sube la capacidad en dC puntos y la métrica en dS; la ganancia diferencial es D = dS - beta * dC.
   El umbral 0,8 es una convención del curso (orden de magnitud de las correlaciones entre capacidades del libro, p. 173).
   Sin dependencias; estilos con las variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var CAP = [16, 18, 19, 21, 23, 24, 31, 39, 53, 58, 62, 67, 76, 80];
  var BENCH = [
    { id: "rechazo", nombre: "Rechazo de peticiones dañinas", y: [39.9, 49.3, 44.2, 47.2, 31.1, 41.9, 46.5, 50.6, 76.7, 73.7, 77.4, 76.6, 76.0, 80.9] },
    { id: "veracidad", nombre: "Veracidad en preguntas comunes", y: [21.8, 39.8, 23.0, 30.1, 34.9, 33.2, 35.9, 43.7, 67.6, 66.8, 47.6, 57.9, 56.5, 71.3] },
    { id: "calibracion", nombre: "Calibración de la confianza", y: [41.3, 22.8, 52.6, 34.4, 42.1, 52.0, 47.3, 44.1, 51.9, 76.7, 52.8, 78.2, 64.5, 67.4] },
    { id: "sesgo", nombre: "Ausencia de sesgo en casos ambiguos", y: [45.7, 51.4, 40.8, 70.5, 33.6, 65.0, 67.1, 65.5, 69.8, 51.7, 64.9, 78.3, 58.9, 76.8] },
    { id: "anomalias", nombre: "Detección de casos anómalos", y: [48.9, 46.9, 42.3, 65.5, 65.7, 55.1, 43.2, 68.4, 52.0, 47.0, 55.7, 36.7, 49.0, 93.6] },
    { id: "robustez", nombre: "Robustez ante ataques adversarios", y: [34.1, 65.4, 36.3, 48.1, 41.3, 73.4, 18.1, 68.6, 36.5, 46.4, 35.3, 53.4, 56.7, 58.4] },
    { id: "troyanos", nombre: "Detección de troyanos", y: [15.4, 39.3, 86.8, 47.6, 38.0, 62.4, 62.1, 56.7, 47.3, 45.9, 56.3, 35.4, 45.6, 61.2] },
    { id: "engano", nombre: "Ausencia de engaño en pruebas de conducta", y: [67.0, 76.9, 77.3, 83.6, 94.0, 58.0, 65.2, 57.4, 45.6, 69.3, 76.9, 55.3, 46.6, 50.9] }
  ];

  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s / a.length; }

  /* Estadísticas de una métrica frente al índice de capacidades. */
  function stats(x, y) {
    var n = x.length, mx = mean(x), my = mean(y), sxx = 0, sxy = 0, syy = 0, i, dx, dy, beta, r, ss = 0, e;
    for (i = 0; i < n; i++) {
      dx = x[i] - mx; dy = y[i] - my;
      sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
    }
    beta = sxy / sxx;
    r = sxy / Math.sqrt(sxx * syy);
    for (i = 0; i < n; i++) { e = y[i] - my - beta * (x[i] - mx); ss += e * e; }
    return { n: n, mx: mx, my: my, beta: beta, r: r, r2: r * r, sres: Math.sqrt(ss / (n - 2)) };
  }

  /* Clase de la métrica según su r y el umbral. */
  function clase(r, thr) {
    if (r >= thr) return "alta";
    if (r >= 0.4) return "media";
    if (r > -0.4) return "baja";
    return "negativa";
  }
  var ETIQ = { alta: "safetywashing probable", media: "mixta", baja: "separable", negativa: "inversa" };
  var COLOR = { alta: "var(--trap)", media: "var(--faint)", baja: "var(--ex)", negativa: "var(--accent)" };

  /* Método hipotético: sube la capacidad dC y la métrica dS. Devuelve lo esperable solo por capacidades. */
  function metodo(st, dC, dS) {
    var esp = st.beta * dC, D = dS - esp, cuota = dS > 0 ? esp / dS : null;
    return { esperada: esp, D: D, cuota: cuota };
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function sg(x, d) { return (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x), d); }

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-cr-style")) return;
    var st = document.createElement("style");
    st.id = "w-cr-style";
    st.textContent = [
      ".w-cr{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cr h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cr .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cr .w-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.4rem;margin:0 0 .8rem}",
      ".w-cr .w-list button{display:flex;justify-content:space-between;align-items:center;gap:.6rem;text-align:left;font:500 .82rem/1.25 var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .65rem;cursor:pointer}",
      ".w-cr .w-list button:hover{background:var(--accent-soft)}",
      ".w-cr .w-list button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}",
      ".w-cr .w-list b{font:600 .72rem/1.2 var(--mono);white-space:nowrap;padding:.15rem .4rem;border-radius:4px;border:1.5px solid}",
      ".w-cr .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-cr .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-cr .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-cr input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-cr .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem;color:var(--ink)}",
      ".w-cr .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-cr svg{display:block;width:100%;height:auto;margin:0 0 .5rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-cr .w-leg{display:flex;flex-wrap:wrap;gap:.3rem 1.1rem;margin:0 0 .8rem;font-size:.8rem;color:var(--muted)}",
      ".w-cr .w-leg i{display:inline-block;width:.75rem;height:.75rem;border-radius:50%;vertical-align:middle;margin-right:.35rem;border:2px solid}",
      ".w-cr dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-cr dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-cr dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-cr dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-cr .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-cr details{margin:.3rem 0 .5rem;font-size:.82rem}",
      ".w-cr table{border-collapse:collapse;font:500 .78rem var(--mono)}",
      ".w-cr td,.w-cr th{border:1px solid var(--rule);padding:.15rem .5rem;text-align:right}",
      ".w-cr .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function cl(v) { return Math.max(0, Math.min(100, v)); }

  function widget(el) {
    injectStyle();
    var id = "w-cr-" + (++uid);
    var B = 0, THR = 0.8, RES = false, DC = 10, DS = 8;
    var S = BENCH.map(function (b) { return stats(CAP, b.y); });
    var btns = BENCH.map(function (b, i) {
      return '<button type="button" data-i="' + i + '" aria-pressed="false"><span>' + b.nombre + '</span><b></b></button>';
    }).join("");

    el.innerHTML = '<div class="w-cr">' +
      '<h4>Métrica de seguridad frente a capacidades generales</h4>' +
      '<p class="w-hint">Cada punto es un modelo ficticio: en horizontal, su índice de capacidades; en vertical, su puntuación en la métrica elegida (más es más seguro). Datos ilustrativos propios. Elige una métrica y mira cuánto sigue la línea de las capacidades.</p>' +
      '<div class="w-list" id="' + id + '-list">' + btns + '</div>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-t">Umbral de correlación alta <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="0.5" max="0.95" step="0.05" value="' + THR + '"></div>' +
      '<div class="w-f"><label for="' + id + '-c">Capacidades que sube el método <b id="' + id + '-cv"></b></label><input type="range" id="' + id + '-c" min="0" max="30" step="1" value="' + DC + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Mejora que declara en la métrica <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="0" max="30" step="1" value="' + DS + '"></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-r"><span>Quitar el efecto de las capacidades (dibujar lo que queda de la puntuación al restar la recta)</span></label>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 300" role="img" aria-label=""></svg>' +
      '<p class="w-leg" id="' + id + '-leg"></p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Correlación r</dt><dd id="' + id + '-o-r"></dd></div>' +
      '<div><dt>r² (variación explicada)</dt><dd id="' + id + '-o-2"></dd></div>' +
      '<div><dt>Pendiente β</dt><dd id="' + id + '-o-b"></dd></div>' +
      '<div><dt>Dispersión residual</dt><dd id="' + id + '-o-e"></dd></div>' +
      '<div><dt>Mejora esperable solo por capacidades</dt><dd id="' + id + '-o-x"></dd></div>' +
      '<div><dt>Ganancia diferencial D</dt><dd id="' + id + '-o-d"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-n1" aria-live="polite"></p>' +
      '<p class="w-note" id="' + id + '-n2" aria-live="polite"></p>' +
      '<details><summary>Ver los datos de la métrica elegida</summary><div id="' + id + '-tab"></div></details>' +
      '<p class="w-cap">Modelos y métricas ficticios, generados para ilustrar; no son resultados de modelos ni de bancos de pruebas reales. El umbral por defecto (0,8) es una convención del curso. Con solo 14 modelos, β y r son orientativos. D = mejora declarada − β × capacidades subidas.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inT = $("t"), inC = $("c"), inS = $("s"), inR = $("r"), svg = $("svg"), bl = el.querySelectorAll("#" + id + "-list button");

    function update() {
      var st = S[B], y = BENCH[B].y, out = [], i, k, v, X, Y, m, tk = [0, 20, 40, 60, 80, 100];
      var x0 = 56, x1 = 584, y0 = 14, y1 = 250;
      X = function (a) { return x0 + (x1 - x0) * a / 100; };
      Y = function (a) { return y1 - (y1 - y0) * a / 100; };
      m = metodo(st, DC, DS);

      for (i = 0; i < tk.length; i++) {
        v = tk[i];
        out.push('<line x1="' + x0 + '" y1="' + Y(v).toFixed(1) + '" x2="' + x1 + '" y2="' + Y(v).toFixed(1) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + (x0 - 6) + '" y="' + (Y(v) + 5).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font:15px var(--mono)">' + v + '</text>');
        out.push('<text x="' + X(v).toFixed(1) + '" y="270" text-anchor="middle" style="fill:var(--faint);font:15px var(--mono)">' + v + '</text>');
      }
      out.push('<text x="' + ((x0 + x1) / 2) + '" y="293" text-anchor="middle" style="fill:var(--faint);font:15px var(--mono)">índice de capacidades (ficticio)</text>');
      out.push('<text x="14" y="' + ((y0 + y1) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((y0 + y1) / 2) + ')" style="fill:var(--faint);font:15px var(--mono)">' + (RES ? "puntuación sin el efecto de las capacidades" : "puntuación en la métrica") + '</text>');

      var pts = [];
      for (k = 0; k <= 100; k += 2) {
        v = RES ? st.my : st.my + st.beta * (k - st.mx);
        if (v >= 0 && v <= 100) pts.push(X(k).toFixed(1) + "," + Y(v).toFixed(1));
      }
      out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent-ink);stroke-width:2;' + (RES ? "stroke-dasharray:6 4" : "") + '"/>');

      for (i = 0; i < CAP.length; i++) {
        v = RES ? y[i] - st.beta * (CAP[i] - st.mx) : y[i];
        out.push('<circle cx="' + X(CAP[i]).toFixed(1) + '" cy="' + Y(cl(v)).toFixed(1) + '" r="5.5" style="fill:var(--accent);stroke:var(--ground);stroke-width:1.5;opacity:.9"/>');
      }

      var bx = st.mx, by = st.my, nx = Math.min(100, st.mx + DC), ny = cl(RES ? st.my + m.D : st.my + DS);
      var ey = cl(RES ? st.my : st.my + m.esperada);
      out.push('<line x1="' + X(bx).toFixed(1) + '" y1="' + Y(by).toFixed(1) + '" x2="' + X(nx).toFixed(1) + '" y2="' + Y(ny).toFixed(1) + '" style="stroke:var(--trap);stroke-width:2.5"/>');
      out.push('<circle cx="' + X(nx).toFixed(1) + '" cy="' + Y(ey).toFixed(1) + '" r="6" style="fill:var(--ground);stroke:var(--ink);stroke-width:2"/>');
      out.push('<rect x="' + (X(nx) - 6).toFixed(1) + '" y="' + (Y(ny) - 6).toFixed(1) + '" width="12" height="12" transform="rotate(45 ' + X(nx).toFixed(1) + " " + Y(ny).toFixed(1) + ')" style="fill:var(--trap);stroke:var(--ground);stroke-width:1.5"/>');
      svg.innerHTML = out.join("");

      $("leg").innerHTML = '<span><i style="background:var(--accent);border-color:var(--accent)"></i>modelo</span>' +
        '<span><i style="background:var(--trap);border-color:var(--trap);border-radius:2px;transform:rotate(45deg)"></i>método: lo que declara</span>' +
        '<span><i style="background:var(--ground);border-color:var(--ink)"></i>lo esperable solo por capacidades</span>';

      $("tv").textContent = fmt(THR, 2);
      $("cv").textContent = "+" + DC;
      $("sv").textContent = "+" + DS;
      $("o-r").textContent = fmt(st.r, 2);
      $("o-2").textContent = fmt(st.r2 * 100, 0) + " %";
      $("o-b").textContent = fmt(st.beta, 2);
      $("o-e").textContent = "± " + fmt(st.sres, 1);
      $("o-x").textContent = sg(m.esperada, 1) + " puntos";
      $("o-d").textContent = sg(m.D, 1) + " puntos";

      for (i = 0; i < bl.length; i++) {
        var cls = clase(S[i].r, THR), b = bl[i].querySelector("b");
        bl[i].setAttribute("aria-pressed", i === B ? "true" : "false");
        b.textContent = "r " + fmt(S[i].r, 2) + " · " + ETIQ[cls];
        b.style.color = COLOR[cls];
        b.style.borderColor = COLOR[cls];
      }

      var c = clase(st.r, THR), n1;
      if (c === "alta") n1 = "Con r = " + fmt(st.r, 2) + ", las capacidades explican el " + fmt(st.r2 * 100, 0) + " % de la variación entre modelos: casi cualquier modelo más capaz puntúa más aquí. Una mejora en esta métrica puede ser safetywashing.";
      else if (c === "media") n1 = "Con r = " + fmt(st.r, 2) + ", parte de la puntuación sigue a las capacidades y parte no. Conviene medir siempre las dos cosas en cada método.";
      else if (c === "baja") n1 = "Con r = " + fmt(st.r, 2) + ", la puntuación apenas sigue a las capacidades: se puede mejorar sin mejorar la capacidad general. Ojo: que sea separable no prueba que mida seguridad; hace falta comprobar su validez.";
      else n1 = "Con r = " + fmt(st.r, 2) + ", los modelos más capaces puntúan peor: la capacidad empeora esta métrica. No es safetywashing, es un riesgo que crece con la escala.";
      $("n1").textContent = n1;

      var n2;
      if (DS <= 0) n2 = "El método declara una mejora de 0 puntos: no hay nada que atribuir a las capacidades ni a otra cosa.";
      else if (m.cuota <= 0) n2 = "Aquí subir capacidades por sí solo no ayudaría (esperable " + sg(m.esperada, 1) + " puntos). Los " + fmt(DS, 0) + " puntos declarados son diferenciales: D = " + sg(m.D, 1) + ".";
      else if (m.cuota > 1) n2 = "Subir capacidades " + DC + " puntos daría por sí solo " + sg(m.esperada, 1) + " en la métrica y el método declara solo " + sg(DS, 0) + ": D = " + sg(m.D, 1) + ". Mejora menos de lo esperable solo por capacidades.";
      else if (m.cuota >= 0.8) n2 = "Las capacidades explican el " + fmt(m.cuota * 100, 0) + " % de la mejora declarada. No se puede presentar como progreso específico de seguridad (D = " + sg(m.D, 1) + ").";
      else if (m.cuota >= 0.3) n2 = "Las capacidades explican el " + fmt(m.cuota * 100, 0) + " % de la mejora; el resto, D = " + sg(m.D, 1) + " puntos, es diferencial.";
      else n2 = "Las capacidades explican solo el " + fmt(m.cuota * 100, 0) + " % de la mejora: casi todo, D = " + sg(m.D, 1) + " puntos, es específico de la métrica.";
      $("n2").textContent = n2;

      var rows = '<table><thead><tr><th>Modelo</th><th>Capacidades</th><th>Métrica</th></tr></thead><tbody>';
      for (i = 0; i < CAP.length; i++) rows += "<tr><th>" + (i + 1) + "</th><td>" + CAP[i] + "</td><td>" + fmt(y[i], 1) + "</td></tr>";
      $("tab").innerHTML = rows + "</tbody></table>";

      svg.setAttribute("aria-label", "Dispersión de 14 modelos ficticios: índice de capacidades frente a la métrica «" + BENCH[B].nombre + "». Correlación " + fmt(st.r, 2) +
        ", pendiente " + fmt(st.beta, 2) + ". Un método que sube las capacidades " + DC + " puntos y declara " + DS + " en la métrica tiene una ganancia diferencial de " + sg(m.D, 1) + " puntos." +
        (RES ? " Vista sin el efecto de las capacidades." : ""));
    }

    Array.prototype.forEach.call(bl, function (b) {
      b.addEventListener("click", function () { B = +b.getAttribute("data-i"); update(); });
    });
    inT.addEventListener("input", function () { THR = +inT.value; update(); });
    inC.addEventListener("input", function () { DC = +inC.value; update(); });
    inS.addEventListener("input", function () { DS = +inS.value; update(); });
    inR.addEventListener("change", function () { RES = inR.checked; update(); });
    update();
  }

  widget.modelo = { CAP: CAP, BENCH: BENCH, stats: stats, clase: clase, metodo: metodo };
  window.WIDGETS["m07-l03-correlacion"] = widget;
})();
