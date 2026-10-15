/* Simulador "m10-l05-umbral": relaciona el cómputo de entrenamiento (FLOP), su coste y un umbral regulatorio.
   El alumno elige el umbral y el crecimiento anual del cómputo, y ve cuántos modelos de una cohorte de 10 quedan
   por encima y cuánto cuesta entrenar un modelo justo en el umbral.
   Cifras del libro (Hendrycks, 8.7, pp. 490 y 493): el cómputo de los modelos se duplica cada 6 meses (x4 al año) y el
   precio-rendimiento de los chips, cada 2,5 años. Ilustrativas y propias: frontera de 10^25 FLOP y 100 M EUR hoy,
   cohorte de 10 modelos separados 0,35 órdenes de magnitud, presupuesto de pequeña empresa y mejora algorítmica.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var F0 = 25, C0 = 100, M = 10, GAP = 0.35, YRS = 10;
  var DEF = { T: 25, g: 4, r: 1, h: 2.5, a: 1, B: 1 };

  function injectStyle() {
    if (document.getElementById("w-um-style")) return;
    var st = document.createElement("style");
    st.id = "w-um-style";
    st.textContent = [
      ".w-um{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-um h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-um .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-um .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-um .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-um .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-um .w-f small{display:block;color:var(--muted);font-size:.74rem;margin-top:.15rem}",
      ".w-um input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-um select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-um details.w-adv{margin:0 0 .8rem}",
      ".w-um details.w-adv > summary{cursor:pointer;font:600 .82rem var(--cond);color:var(--accent-ink);margin:0 0 .6rem}",
      ".w-um .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-um button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-um button:hover{background:var(--accent-soft)}",
      ".w-um svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-um dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-um dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-um dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-um dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-um .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-um .w-tw{overflow-x:auto;margin:.4rem 0 .6rem}",
      ".w-um table{border-collapse:collapse;width:100%;font-size:.8rem}",
      ".w-um th,.w-um td{border-bottom:1px solid var(--rule);padding:.25rem .45rem;text-align:right;white-space:nowrap}",
      ".w-um th:first-child,.w-um td:first-child{text-align:left}",
      ".w-um .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  function sup(n) {
    return String(n).split("").map(function (c) { return c === "-" ? "⁻" : SUP.charAt(+c); }).join("");
  }
  function sci(lg) {
    var e = Math.floor(lg + 1e-9), m = Math.pow(10, lg - e);
    if (Math.abs(m - 1) < 0.005) return "10" + sup(e);
    return fmt(m, 2) + "×10" + sup(e);
  }
  function money(x) {
    if (x >= 1e6) return fmt(x / 1e6, 2) + " billones €";
    if (x >= 1000) return fmt(x / 1000, x < 1e4 ? 2 : 0) + " mil millones €";
    if (x >= 1) return fmt(x, x < 10 ? 1 : 0) + " M€";
    return fmt(x * 1000, 0) + " mil €";
  }

  /* Modelo. Frontera: 10^F0 FLOP hoy, crece x g al año. Cohorte: M modelos, cada uno GAP órdenes de magnitud por
     debajo del anterior. Umbral: 10^T FLOP, sube x r al año si el regulador lo revisa. Precio por FLOP: cae a la mitad
     cada h años (precio-rendimiento de los chips). Mejora algorítmica: a veces menos cómputo por año para la misma
     capacidad. */
  function model(p) {
    var c0 = C0 / Math.pow(10, F0), rows = [], t, k, n, lf, thr, pf, first = -1, rate, tB;
    for (t = 0; t <= YRS; t++) {
      lf = F0 + t * Math.log10(p.g);
      thr = p.T + t * Math.log10(p.r);
      n = 0;
      for (k = 0; k < M; k++) if (lf - GAP * k >= thr - 1e-9) n++;
      pf = c0 * Math.pow(2, -t / p.h);
      rows.push({
        t: t, lf: lf, lo: lf - GAP * (M - 1), thr: thr, n: n,
        costF: Math.pow(10, lf) * pf,
        costT: Math.pow(10, thr) * pf,
        costEq: Math.pow(10, p.T) * pf / Math.pow(p.a, t)
      });
      if (first < 0 && n === M) first = t;
    }
    rate = Math.LN2 / p.h + Math.log(p.a);
    tB = Math.log(Math.pow(10, p.T) * c0 / p.B) / rate;
    return { rows: rows, first: first, tB: tB };
  }
  window.WIDGETS["m10-l05-umbral"] = function (el) {
    injectStyle();
    var id = "w-um-" + (++uid), p = {};
    Object.keys(DEF).forEach(function (k) { p[k] = DEF[k]; });

    el.innerHTML = '<div class="w-um">' +
      '<h4>Umbral de cómputo</h4>' +
      '<p class="w-hint">Cada año hay 10 modelos, separados unos de otros por 0,35 órdenes de magnitud (cada uno rinde unas 2,2 veces menos que el anterior). El regulador fija un umbral en FLOP de entrenamiento: los modelos que lo superan quedan sujetos a más control.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-t">Umbral (log10 FLOP) <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="22" max="27" step="0.25"></div>' +
      '<div class="w-f"><label for="' + id + '-g">Crecimiento del cómputo por año <b id="' + id + '-gv"></b></label><input type="range" id="' + id + '-g" min="1.5" max="6" step="0.25"><small id="' + id + '-gs"></small></div>' +
      '<div class="w-f"><label for="' + id + '-r">El regulador sube el umbral por año <b id="' + id + '-rv"></b></label><input type="range" id="' + id + '-r" min="1" max="6" step="0.25"><small>×1 es un umbral fijo</small></div>' +
      '</div>' +
      '<details class="w-adv"><summary>Ajustes de coste (para ver la erosión del umbral)</summary>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-h">Años en duplicarse el precio-rendimiento <b id="' + id + '-hv"></b></label><input type="range" id="' + id + '-h" min="1" max="5" step="0.5"><small>Libro: cada 2,5 años</small></div>' +
      '<div class="w-f"><label for="' + id + '-a">Mejora algorítmica por año <b id="' + id + '-av"></b></label><input type="range" id="' + id + '-a" min="1" max="3" step="0.25"><small>×1: sin mejora (ilustrativo)</small></div>' +
      '<div class="w-f"><label for="' + id + '-b">Presupuesto de una pequeña empresa</label><select id="' + id + '-b"><option value="0.1">100 mil €</option><option value="1">1 M€</option><option value="10">10 M€</option></select></div>' +
      '</div></details>' +
      '<div class="w-btns"><button type="button" id="' + id + '-rst">Valores iniciales</button><button type="button" id="' + id + '-sync">Umbral que sigue a la frontera</button><button type="button" id="' + id + '-fix">Umbral fijo</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 480 248" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Modelos sobre el umbral, año 0</dt><dd id="' + id + '-o0"></dd></div>' +
      '<div><dt>Modelos sobre el umbral, año 5</dt><dd id="' + id + '-o5"></dd></div>' +
      '<div><dt>Los 10 sobre el umbral desde</dt><dd id="' + id + '-of"></dd></div>' +
      '<div><dt>Coste del modelo frontera, año 5</dt><dd id="' + id + '-oc"></dd></div>' +
      '<div><dt>Coste de un modelo justo en el umbral: hoy y año 10</dt><dd id="' + id + '-ot"></dd></div>' +
      '<div><dt>Igualar hoy la capacidad del umbral costará menos que el presupuesto en</dt><dd id="' + id + '-ob"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<details><summary>Ver tabla por años</summary><div class="w-tw"><table id="' + id + '-tab"></table></div></details>' +
      '<p class="w-cap">Gráfico: eje horizontal, años desde hoy; fila inferior, cuántos de los 10 modelos superan el umbral; banda, de la frontera al décimo modelo; línea discontinua gruesa, el umbral. Del libro: el cómputo de los modelos se duplica cada 6 meses (×4 al año) y el precio-rendimiento de los chips cada 2,5 años. Ilustrativo y propio: frontera de 10²⁵ FLOP y 100 M€ hoy, cohorte de 10 modelos separados 0,35 órdenes de magnitud, presupuesto y mejora algorítmica. El coste de la frontera es una extrapolación mecánica: más allá de unos años chocaría con límites de inversión y energía.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inT = $("t"), inG = $("g"), inR = $("r"), inH = $("h"), inA = $("a"), inB = $("b"), svg = $("svg");

    function chart(m) {
      var rows = m.rows, out = [], t, v, ymin = 1e9, ymax = -1e9, X0 = 56, X1 = 466, Y0 = 16, Y1 = 196;
      rows.forEach(function (r) {
        ymin = Math.min(ymin, r.lo, r.thr); ymax = Math.max(ymax, r.lf, r.thr);
      });
      ymin = Math.floor(ymin) - 0.25; ymax = Math.ceil(ymax) + 0.25;
      function x(tt) { return X0 + tt * (X1 - X0) / YRS; }
      function y(vv) { return Y0 + (ymax - vv) / (ymax - ymin) * (Y1 - Y0); }
      var step = (ymax - ymin) > 9 ? 2 : 1;
      for (v = Math.ceil(ymin); v <= ymax; v += step) {
        out.push('<line x1="' + X0 + '" y1="' + y(v).toFixed(1) + '" x2="' + X1 + '" y2="' + y(v).toFixed(1) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="' + (X0 - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font-size:14px;font-family:var(--mono)">' + "10" + sup(v) + '</text>');
      }
      var top = rows.map(function (r) { return x(r.t).toFixed(1) + "," + y(r.lf).toFixed(1); });
      var low = rows.slice().reverse().map(function (r) { return x(r.t).toFixed(1) + "," + y(r.lo).toFixed(1); });
      out.push('<polygon points="' + top.concat(low).join(" ") + '" style="fill:var(--accent-soft);stroke:none"/>');
      out.push('<polyline points="' + top.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2"/>');
      out.push('<polyline points="' + rows.map(function (r) { return x(r.t).toFixed(1) + "," + y(r.lo).toFixed(1); }).join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:1;stroke-dasharray:3 3"/>');
      out.push('<polyline points="' + rows.map(function (r) { return x(r.t).toFixed(1) + "," + y(r.thr).toFixed(1); }).join(" ") + '" style="fill:none;stroke:var(--trap);stroke-width:2.5;stroke-dasharray:7 4"/>');
      out.push('<text x="' + (X1 - 4) + '" y="' + (y(rows[YRS].lf) - 6).toFixed(1) + '" text-anchor="end" style="fill:var(--accent-ink);font-size:14px;font-weight:600">modelo frontera</text>');
      out.push('<text x="' + (X0 + 6) + '" y="' + (y(rows[0].thr) + 18).toFixed(1) + '" style="fill:var(--trap);font-size:14px;font-weight:600">umbral</text>');
      for (t = 0; t <= YRS; t++) {
        out.push('<text x="' + x(t).toFixed(1) + '" y="216" text-anchor="middle" style="fill:var(--faint);font-size:14px;font-family:var(--mono)">' + t + '</text>');
        out.push('<text x="' + x(t).toFixed(1) + '" y="240" text-anchor="middle" style="fill:' + (rows[t].n === M ? 'var(--trap)' : 'var(--ink)') + ';font-size:15px;font-weight:700;font-family:var(--cond)">' + rows[t].n + '</text>');
      }
      svg.innerHTML = out.join("");
      svg.setAttribute("aria-label", "Cómputo por año: la banda va del modelo frontera al décimo de la cohorte y la línea discontinua es el umbral. Modelos sobre el umbral en los años 0 a 10: " +
        rows.map(function (r) { return r.n; }).join(", ") + ".");
    }

    function table(m) {
      var h = "<thead><tr><th>Año</th><th>Frontera (FLOP)</th><th>Umbral (FLOP)</th><th>Sobre el umbral</th><th>Coste frontera</th><th>Coste en el umbral</th></tr></thead><tbody>";
      m.rows.forEach(function (r) {
        h += "<tr><td>" + r.t + "</td><td>" + sci(r.lf) + "</td><td>" + sci(r.thr) + "</td><td>" + r.n + " de " + M + "</td><td>" + money(r.costF) + "</td><td>" + money(r.costT) + "</td></tr>";
      });
      $("tab").innerHTML = h + "</tbody>";
    }

    function update() {
      var m = model(p), r = m.rows, months = 12 * Math.LN2 / Math.log(p.g), note, sync = Math.abs(p.r - p.g) < 1e-9;
      $("tv").textContent = sci(p.T) + " FLOP";
      $("gv").textContent = "×" + fmt(p.g, 2);
      $("gs").textContent = "Se duplica cada " + fmt(months, 1) + " meses" + (Math.abs(p.g - 4) < 1e-9 ? " (libro)" : "");
      $("rv").textContent = "×" + fmt(p.r, 2);
      $("hv").textContent = fmt(p.h, 1) + " años";
      $("av").textContent = "×" + fmt(p.a, 2);
      $("o0").textContent = r[0].n + " de " + M;
      $("o5").textContent = r[5].n + " de " + M;
      $("of").textContent = m.first < 0 ? "ningún año de los 10" : "el año " + m.first;
      $("oc").textContent = money(r[5].costF);
      $("ot").textContent = money(r[0].costT) + " y " + money(r[YRS].costT);
      $("ob").textContent = m.tB <= 0 ? "ya hoy" : fmt(m.tB, 1) + " años";
      if (sync && p.g > 1) {
        note = "El umbral sube al ritmo de la frontera: cubre siempre a los mismos " + r[0].n + " de " + M + " modelos. Mantiene su foco, pero exige a la agencia revisarlo cada año y decidir cuánto sube.";
      } else if (r[0].n === 0 && m.first < 0 && r[YRS].n === 0) {
        note = "El umbral queda por encima de toda la frontera durante los 10 años: no vigila a nadie. Un umbral demasiado alto solo sirve si se baja antes de que llegue la frontera.";
      } else if (r[0].n === 0) {
        note = "Hoy el umbral no cubre ningún modelo: es un umbral preventivo, que empieza a actuar en el año " + (function () { for (var i = 0; i <= YRS; i++) if (r[i].n > 0) return i; return YRS; })() + ".";
      } else if (m.first >= 0) {
        note = "Con el umbral fijo, en el año " + m.first + " lo superan los " + M + " modelos: deja de distinguir a los más potentes. Un umbral en FLOP envejece con el crecimiento del cómputo y hay que revisarlo.";
      } else {
        note = "Al final del horizonte lo superan " + r[YRS].n + " de " + M + " modelos: el umbral cubre a más modelos cada año. Prueba a subirlo o a moverlo con la frontera.";
      }
      if (p.a > 1.0001) {
        note += " Con mejora algorítmica, la misma capacidad necesita cada año menos FLOP: igualar hoy la capacidad del umbral llega antes al presupuesto, y los FLOP miden peor lo que un modelo sabe hacer.";
      }
      $("note").textContent = note;
      chart(m); table(m);
    }

    function set(k, inp, conv) { inp.addEventListener("input", function () { p[k] = conv(inp.value); update(); }); }
    set("T", inT, parseFloat); set("g", inG, parseFloat); set("r", inR, parseFloat);
    set("h", inH, parseFloat); set("a", inA, parseFloat);
    inB.addEventListener("change", function () { p.B = parseFloat(inB.value); update(); });

    function load() {
      inT.value = String(p.T); inG.value = String(p.g); inR.value = String(p.r);
      inH.value = String(p.h); inA.value = String(p.a); inB.value = String(p.B);
      update();
    }
    $("rst").addEventListener("click", function () { Object.keys(DEF).forEach(function (k) { p[k] = DEF[k]; }); load(); });
    $("sync").addEventListener("click", function () { p.r = p.g; load(); });
    $("fix").addEventListener("click", function () { p.r = 1; load(); });
    load();
  };
})();
