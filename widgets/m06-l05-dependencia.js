/* Simulador "m06-l05-dependencia": una persona que acepta o anula las recomendaciones de un modelo.
   Modelo PROPIO (no procede del Atlas ni de ningun libro), en valores esperados, tarea binaria:
   - La persona sola acierta con probabilidad h; el modelo, con m; sus errores son independientes.
   - Si coinciden, esa es la decision. Si discrepan, la persona sigue al modelo con probabilidad c cuando el modelo acierta
     y con c(1-r) cuando falla (r = capacidad de frenar los errores del modelo).
   - Equipo = h*m + (1-h)*m*c + h*(1-m)*(1-c*(1-r)). Con c = 0 el equipo es la persona sola; con c = 1 y r = 0, es el modelo.
   - Perdida de habilidad: h_t = 0,5 + (h0-0,5)*exp(-d*c*t): cae hacia el azar (0,5) y mas deprisa cuanto mas sigue al modelo.
     La capacidad de frenar errores se degrada en proporcion a la habilidad que queda: r_t = r0*(h_t-0,5)/(h0-0,5).
   - La curva de "persona sola" es lo que mediria un periodo de retirada del modelo (Atlas, ficha de deskilling).
   - RAIR = c (sigue al modelo cuando acierta y ella falla); RSR = 1-c(1-r) (resiste cuando el modelo falla y ella acierta).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(x) { return fmt(x * 100, 1) + " %"; }
  function pts(x) { return (x > 0.00049 ? "+" : x < -0.00049 ? "−" : "") + fmt(Math.abs(x) * 100, 1) + " puntos"; }

  /* Valores esperados en el mes t. P: m, h0, c, r0, d (por mes con confianza 1), en fracciones. */
  function est(P, t) {
    var h = 0.5 + (P.h0 - 0.5) * Math.exp(-P.d * P.c * t);
    var r = P.r0 * (h - 0.5) / (P.h0 - 0.5), m = P.m, c = P.c;
    return {
      h: h, r: r,
      team: h * m + (1 - h) * m * c + h * (1 - m) * (1 - c * (1 - r)),
      acept: h * m + (1 - h) * (1 - m) + h * (1 - m) * c * (1 - r) + (1 - h) * m * c,
      rair: c, rsr: 1 - c * (1 - r)
    };
  }
  /* Primer mes en que el equipo deja de superar al modelo solo (null si no ocurre o si nunca lo superaba). */
  function cruce(P, T) {
    var t;
    if (est(P, 0).team <= P.m + 1e-9) return null;
    for (t = 1; t <= T; t++) if (est(P, t).team <= P.m + 1e-9) return t;
    return null;
  }

  var BASE = { m: 85, h0: 80, c: 70, r0: 60, d: 3, T: 24 };
  var PRESETS = [
    { id: "base", et: "Valores iniciales", s: {} },
    { id: "ciega", et: "Confianza ciega (c 100 %, freno 0 %)", s: { c: 100, r0: 0 } },
    { id: "aversion", et: "Aversión al algoritmo (c 15 %)", s: { c: 15 } },
    { id: "sinper", et: "Sin pérdida de habilidad", s: { d: 0 } }
  ];
  var SLIDERS = [
    { k: "m", et: "Exactitud del modelo", min: 55, max: 99, step: 1, u: " %" },
    { k: "h0", et: "Exactitud inicial de la persona sola", min: 55, max: 95, step: 1, u: " %" },
    { k: "c", et: "Confianza: sigue al modelo si discrepan", min: 0, max: 100, step: 5, u: " %" },
    { k: "r0", et: "Freno inicial a los errores del modelo", min: 0, max: 100, step: 5, u: " %" },
    { k: "d", et: "Pérdida de habilidad (por mes, con confianza 100 %)", min: 0, max: 10, step: 0.5, u: " %" },
    { k: "T", et: "Meses de uso", min: 6, max: 60, step: 6, u: " meses" }
  ];

  function injectStyle() {
    if (document.getElementById("w-dep-style")) return;
    var st = document.createElement("style");
    st.id = "w-dep-style";
    st.textContent = [
      ".w-dep{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-dep h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-dep h5{font:600 .74rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-dep .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-dep .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-dep .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-dep .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-dep input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-dep table{width:100%;border-collapse:collapse;margin:0;font-size:.86rem}",
      ".w-dep .tw{display:block;width:100%;margin:0}",
      ".w-dep .tw table{min-width:0;width:100%}",
      ".w-dep td:not(:first-child){white-space:nowrap}",
      ".w-dep th,.w-dep td{text-align:right;padding:.3rem .5rem;border-bottom:1px solid var(--rule)}",
      ".w-dep th:first-child,.w-dep td:first-child{text-align:left}",
      ".w-dep th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-dep .w-btns{display:flex;flex-wrap:wrap;gap:.5rem;margin:.2rem 0 .7rem}",
      ".w-dep button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .7rem;cursor:pointer}",
      ".w-dep button:hover{background:var(--accent-soft)}",
      ".w-dep .w-bad{color:var(--trap);font-weight:600}",
      ".w-dep .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.6rem 0 .5rem}",
      ".w-dep svg{display:block;width:100%;max-width:38rem;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-dep .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-dep .w-leg{list-style:none;margin:.5rem 0 .8rem;padding:0;font-size:.8rem;color:var(--muted)}",
      ".w-dep .w-leg li{margin:0 0 .15rem}",
      ".w-dep .w-sw{display:inline-block;width:1.4rem;height:0;border-top:3px solid;vertical-align:middle;margin-right:.4rem}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* Grafico: exactitud (0,5 a 1) frente a los meses de uso. */
  function grafico(P, T) {
    var X0 = 36, X1 = 372, Y0 = 12, Y1 = 158, o = [], g, t, pts_h = [], pts_e = [], e, x, y, cr = cruce(P, T), e0 = est(P, 0), eT = est(P, T);
    function sx(v) { return X0 + (X1 - X0) * v / T; }
    function sy(v) { return Y1 - (Y1 - Y0) * (v - 0.5) / 0.5; }
    for (g = 0.5; g <= 1.0001; g += 0.1) {
      o.push('<line x1="' + X0 + '" y1="' + sy(g) + '" x2="' + X1 + '" y2="' + sy(g) + '" style="stroke:var(--rule)"/>');
      o.push('<text x="' + (X0 - 4) + '" y="' + (sy(g) + 3) + '" text-anchor="end" style="fill:var(--muted);font-size:9px">' + fmt(g, 1) + '</text>');
    }
    for (t = 0; t <= T; t += T / 6) {
      o.push('<text x="' + sx(t) + '" y="' + (Y1 + 13) + '" text-anchor="middle" style="fill:var(--muted);font-size:9px">' + fmt(t, 0) + '</text>');
    }
    o.push('<text x="' + ((X0 + X1) / 2) + '" y="' + (Y1 + 26) + '" text-anchor="middle" style="fill:var(--faint);font-size:9px">Meses de uso del modelo</text>');
    for (t = 0; t <= T; t++) {
      e = est(P, t);
      pts_h.push(fmt(sx(t), 1).replace(",", ".") + "," + fmt(sy(e.h), 1).replace(",", "."));
      pts_e.push(fmt(sx(t), 1).replace(",", ".") + "," + fmt(sy(e.team), 1).replace(",", "."));
    }
    y = fmt(sy(P.m), 1).replace(",", ".");
    o.push('<line x1="' + X0 + '" y1="' + y + '" x2="' + X1 + '" y2="' + y + '" style="stroke:var(--muted);stroke-width:2;stroke-dasharray:6 4"/>');
    o.push('<polyline points="' + pts_h.join(" ") + '" style="fill:none;stroke:var(--trap);stroke-width:2.5"/>');
    o.push('<polyline points="' + pts_e.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
    if (cr !== null) {
      x = sx(cr);
      o.push('<line x1="' + x + '" y1="' + Y0 + '" x2="' + x + '" y2="' + Y1 + '" style="stroke:var(--ex);stroke-width:1.5;stroke-dasharray:2 3"/>');
      o.push('<text x="' + x + '" y="' + (Y0 + 9) + '" text-anchor="middle" style="fill:var(--ex);font-size:9px;font-weight:700">mes ' + cr + '</text>');
    }
    o.push('<circle cx="' + sx(0) + '" cy="' + sy(e0.team) + '" r="3.5" style="fill:var(--accent)"/><circle cx="' + sx(T) + '" cy="' + sy(eT.team) + '" r="3.5" style="fill:var(--accent)"/>');
    o.push('<circle cx="' + sx(0) + '" cy="' + sy(e0.h) + '" r="3.5" style="fill:var(--trap)"/><circle cx="' + sx(T) + '" cy="' + sy(eT.h) + '" r="3.5" style="fill:var(--trap)"/>');
    var txt = "Exactitud según los meses de uso. Modelo solo: " + pc(P.m) + " constante. Persona sola: de " + pc(e0.h) + " a " + pc(eT.h) +
      ". Equipo: de " + pc(e0.team) + " a " + pc(eT.team) + ".";
    return '<svg viewBox="0 0 380 190" role="img" aria-label="' + txt + '"><title>' + txt + '</title>' + o.join("") + '</svg>';
  }

  window.WIDGETS["m06-l05-dependencia"] = function (el) {
    injectStyle();
    var id = "w-dep-" + (++uid);
    var S = {};
    function reset(o) { var k; for (k in BASE) S[k] = BASE[k]; for (k in o) S[k] = o[k]; }
    reset({});

    function sl(d) {
      return '<div class="w-f"><label for="' + id + '-' + d.k + '">' + d.et + ' <b id="' + id + '-' + d.k + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + d.k + '" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + S[d.k] + '"></div>';
    }
    var btns = PRESETS.map(function (p) { return '<button type="button" id="' + id + '-p-' + p.id + '">' + p.et + '</button>'; }).join("");

    el.innerHTML = '<div class="w-dep">' +
      '<h4>Dependencia del modelo y pérdida de habilidad</h4>' +
      '<p class="w-hint">Modelo propio en valores esperados, con datos inventados: una persona decide junto a un modelo en una tarea de sí o no. Cuando discrepan, sigue al modelo con la confianza que elijas. Cuanto más lo sigue, más pierde de su habilidad propia.</p>' +
      '<div class="w-btns">' + btns + '</div>' +
      '<div class="w-grid">' + SLIDERS.map(sl).join("") + '</div>' +
      '<div id="' + id + '-svg"></div>' +
      '<ul class="w-leg">' +
      '<li><span class="w-sw" style="border-color:var(--accent)"></span>Equipo (persona más modelo).</li>' +
      '<li><span class="w-sw" style="border-color:var(--muted);border-top-style:dashed"></span>Modelo solo, que no cambia.</li>' +
      '<li><span class="w-sw" style="border-color:var(--trap)"></span>Persona sola: lo que mediría un periodo de retirada del modelo.</li>' +
      '<li><span class="w-sw" style="border-color:var(--ex);border-top-style:dotted"></span>Mes en que el equipo deja de superar al modelo solo.</li></ul>' +
      '<div class="tw"><table><thead><tr><th>Medida</th><th id="' + id + '-h0">Mes 0</th><th id="' + id + '-hT">Mes final</th></tr></thead><tbody id="' + id + '-tb"></tbody></table></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Supuestos declarados: tarea binaria, errores de la persona y del modelo independientes, habilidad que cae hacia el azar (0,5) y freno a los errores del modelo que se degrada con ella. La aceptación es el porcentaje de casos en que la decisión final coincide con la recomendación; no es la exactitud del equipo. RAIR y RSR son las tasas de dependencia apropiada del Atlas: aquí valen c y 1 − c(1 − r).</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function render() {
      var P = { m: S.m / 100, h0: S.h0 / 100, c: S.c / 100, r0: S.r0 / 100, d: S.d / 100 };
      var T = S.T, a = est(P, 0), b = est(P, T), cr = cruce(P, T), rows = "", nota, mejor0, mejorT, dAc, dEq;

      SLIDERS.forEach(function (d) { $(d.k + "v").textContent = fmt(S[d.k], d.step < 1 ? 1 : 0) + d.u; });
      $("h0").textContent = "Mes 0";
      $("hT").textContent = "Mes " + T;
      mejor0 = Math.max(P.m, a.h);
      mejorT = Math.max(P.m, b.h);
      function fila(et, x, y, bad) { rows += '<tr><td>' + et + '</td><td>' + x + '</td><td>' + (bad ? '<span class="w-bad">' + y + '</span>' : y) + '</td></tr>'; }
      fila("Persona sola (sin modelo)", pc(a.h), pc(b.h), b.h < a.h - 0.0005);
      fila("Modelo solo", pc(P.m), pc(P.m));
      fila("Equipo: persona más modelo", pc(a.team), pc(b.team), b.team < a.team - 0.0005);
      fila("Ventaja del equipo sobre el mejor de los dos", pts(a.team - mejor0), pts(b.team - mejorT), b.team - mejorT < -0.0005);
      fila("Freno a los errores del modelo (r)", pc(a.r), pc(b.r), b.r < a.r - 0.0005);
      fila("Aceptación (decisión igual a la recomendación)", pc(a.acept), pc(b.acept));
      fila("Anulación (override)", pc(1 - a.acept), pc(1 - b.acept));
      fila("RAIR: sigue al modelo cuando él acierta y ella falla", pc(a.rair), pc(b.rair));
      fila("RSR: resiste al modelo cuando él falla y ella acierta", pc(a.rsr), pc(b.rsr), b.rsr < a.rsr - 0.0005);
      $("tb").innerHTML = rows;
      $("svg").innerHTML = grafico(P, T);

      nota = a.team > mejor0 + 0.0005 ? "Al inicio el equipo supera a cada uno por separado (" + pc(a.team) + " frente a " + pc(a.h) + " y " + pc(P.m) + ")."
        : a.team < mejor0 - 0.0005 ? "Al inicio el equipo queda por debajo del mejor de los dos (" + pc(a.team) + " frente a " + pc(mejor0) + ")."
        : "Al inicio el equipo solo iguala al mejor de los dos (" + pc(a.team) + ").";
      nota += " En el mes " + T + " la persona sola está en " + pc(b.h) + " (" + pts(b.h - a.h) + ") y el equipo en " + pc(b.team) + " (" + pts(b.team - a.team) + ").";
      if (cr !== null) nota += " El equipo deja de superar al modelo solo en el mes " + cr + ".";
      dAc = b.acept - a.acept; dEq = b.team - a.team;
      if (dEq < -0.005 && Math.abs(dAc) < Math.abs(dEq) / 2) nota += " La aceptación apenas se mueve (de " + pc(a.acept) + " a " + pc(b.acept) + ") mientras el equipo pierde " + fmt(-dEq * 100, 1) + " puntos: mirar solo el ritmo de anulación no lo delata.";
      if (S.c === 100 && S.r0 === 0) nota += " Con confianza ciega la aceptación es del 100 % y el equipo no pasa de ser el modelo, mientras la persona pierde habilidad sin que nadie lo vea.";
      if (S.c === 0) nota += " Sin confianza nunca sigue al modelo: el equipo es la persona sola y no pierde habilidad, pero tampoco aprovecha al modelo.";
      $("note").textContent = nota;
    }

    SLIDERS.forEach(function (d) {
      var node = $(d.k);
      node.addEventListener("input", function () {
        var v = parseFloat(node.value);
        S[d.k] = isNaN(v) ? BASE[d.k] : Math.max(d.min, Math.min(d.max, v));
        render();
      });
    });
    PRESETS.forEach(function (p) {
      $("p-" + p.id).addEventListener("click", function () {
        reset(p.s);
        SLIDERS.forEach(function (d) { $(d.k).value = S[d.k]; });
        render();
      });
    });
    render();
  };
})();
