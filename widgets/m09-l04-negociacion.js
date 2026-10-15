/* Simulador "m09-l04-negociacion": el rango de negociación y lo que lo cierra.
   Marco del libro 7.4 (pleito de la tienda, figs. 7.9 a 7.11): dos actores se reparten un bien; pelear destruye
   valor y repartir solo lo distribuye, así que con información completa existe un rango de repartos mejor que pelear.
   MODELO PROPIO (síntesis aditiva, no está en el libro): bien de valor 100; A gana con probabilidad p (en puntos);
   cA y cB son los costes de pelear; oA y oB, cuánto sobrestima cada uno su fuerza; f, la ventaja de golpear primero
   (sube f la probabilidad de quien ataca); S, cuánto caerá la fuerza de A, y L, el valor que se pierde al repartir.
     mínimo que acepta A     = p + oA + f - cA
     máximo que concede B    = p - S - L - oB - f + cB
     ancho del rango         = (cA + cB) - (oA + oB) - 2f - S - L
   Si el mínimo de A supera el máximo de B no hay acuerdo posible y pelear es racional. Además se recorta a
   [0, 100 - L]: ningún reparto da a A menos de 0 ni más de lo que hay. Sin dependencias; variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var BASE = { p: 60, cA: 25, cB: 25, oA: 0, oB: 0, f: 0, S: 0, L: 0 };
  var PRESETS = [
    { id: "pleito", nombre: "Pleito del libro", v: BASE },
    { id: "optim", nombre: "Los dos se creen ganadores", v: { p: 50, cA: 15, cB: 15, oA: 20, oB: 20, f: 0, S: 0, L: 0 } },
    { id: "poder", nombre: "A va a perder fuerza", v: { p: 60, cA: 15, cB: 15, oA: 0, oB: 0, f: 0, S: 40, L: 0 } },
    { id: "golpe", nombre: "Atacar primero rinde", v: { p: 50, cA: 15, cB: 15, oA: 0, oB: 0, f: 18, S: 0, L: 0 } },
    { id: "indiv", nombre: "Repartir destruye valor", v: { p: 50, cA: 15, cB: 15, oA: 0, oB: 0, f: 0, S: 0, L: 40 } }
  ];
  var CAMPOS = [
    { k: "p", t: "Fuerza real de A (probabilidad de ganar, %)", min: 0, max: 100, g: "Bien y fuerzas" },
    { k: "cA", t: "Coste de pelear para A", min: 0, max: 40, g: "Bien y fuerzas" },
    { k: "cB", t: "Coste de pelear para B", min: 0, max: 40, g: "Bien y fuerzas" },
    { k: "oA", t: "A sobrestima su fuerza (puntos)", min: 0, max: 30, g: "Información" },
    { k: "oB", t: "B sobrestima su fuerza (puntos)", min: 0, max: 30, g: "Información" },
    { k: "f", t: "Ventaja de golpear primero (puntos)", min: 0, max: 25, g: "Compromiso" },
    { k: "S", t: "Caída futura de la fuerza de A (puntos)", min: 0, max: 40, g: "Compromiso" },
    { k: "L", t: "Valor que se pierde al repartir (puntos)", min: 0, max: 60, g: "Compromiso" }
  ];

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* Cálculo del rango. amin/bmax son los umbrales sin recortar; lo/hi, tras recortar a [0, 100 - L]. */
  function modelo(s) {
    var amin = s.p + s.oA + s.f - s.cA;
    var bmax = s.p - s.S - s.L - s.oB - s.f + s.cB;
    var pie = 100 - s.L;
    var lo = Math.max(amin, 0), hi = Math.min(bmax, pie);
    var margen = (s.cA + s.cB) - (s.oA + s.oB) - 2 * s.f - s.S - s.L;
    var motivo = "";
    if (amin > bmax) motivo = "exigencias";
    else if (lo > hi) motivo = amin > pie ? "excede" : "vacio";
    return { amin: amin, bmax: bmax, lo: lo, hi: hi, pie: pie, margen: margen, ok: lo <= hi, ancho: hi - lo, motivo: motivo };
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function sg(x) { return (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x)); }

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-ng-style")) return;
    var st = document.createElement("style");
    st.id = "w-ng-style";
    st.textContent = [
      ".w-ng{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-ng h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-ng .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-ng .w-pre{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-ng .w-pre button{font:500 .8rem/1.2 var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .7rem;cursor:pointer}",
      ".w-ng .w-pre button:hover{background:var(--accent-soft)}",
      ".w-ng .w-pre button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}",
      ".w-ng fieldset{border:1px solid var(--rule);border-radius:8px;margin:0 0 .6rem;padding:.4rem .8rem .7rem}",
      ".w-ng legend{font:600 .68rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);padding:0 .3rem}",
      ".w-ng .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.6rem .9rem}",
      ".w-ng .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .7rem/1.25 var(--mono);color:var(--faint);margin-bottom:.2rem}",
      ".w-ng .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-ng input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-ng svg{display:block;width:100%;height:auto;margin:.3rem 0 .6rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-ng .w-res{border-radius:8px;padding:.6rem .8rem;margin:0 0 .7rem;font-weight:600}",
      ".w-ng .w-res.si{background:var(--ex-bg);border:1px solid var(--ex)}",
      ".w-ng .w-res.no{background:var(--trap-bg);border:1px solid var(--trap)}",
      ".w-ng table{border-collapse:collapse;font:500 .82rem var(--mono);margin:0 0 .6rem;width:100%;max-width:34rem}",
      ".w-ng td,.w-ng th{border-bottom:1px solid var(--rule);padding:.25rem .5rem;text-align:right}",
      ".w-ng td:first-child,.w-ng th:first-child{text-align:left;font-family:var(--cond)}",
      ".w-ng tr.tot td{font-weight:700;color:var(--accent-ink);border-top:2px solid var(--rule-strong)}",
      ".w-ng .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function widget(el) {
    injectStyle();
    var id = "w-ng-" + (++uid), s = {}, k, i, actual = "pleito";
    for (k in BASE) s[k] = BASE[k];

    var pre = PRESETS.map(function (p) {
      return '<button type="button" data-p="' + p.id + '" aria-pressed="false">' + p.nombre + '</button>';
    }).join("");
    var grupos = {}, orden = [], html = "";
    CAMPOS.forEach(function (c) {
      if (!grupos[c.g]) { grupos[c.g] = ""; orden.push(c.g); }
      grupos[c.g] += '<div class="w-f"><label for="' + id + '-' + c.k + '">' + c.t + ' <b id="' + id + '-v-' + c.k + '"></b></label>' +
        '<input type="range" id="' + id + '-' + c.k + '" min="' + c.min + '" max="' + c.max + '" step="1" value="' + s[c.k] + '"></div>';
    });
    orden.forEach(function (g) { html += '<fieldset><legend>' + g + '</legend><div class="w-grid">' + grupos[g] + '</div></fieldset>'; });

    el.innerHTML = '<div class="w-ng">' +
      '<h4>Rango de negociación entre dos actores</h4>' +
      '<p class="w-hint">Dos actores, A y B, se reparten un bien que vale 100. Si no se ponen de acuerdo, pelean: cada uno gana con cierta probabilidad y paga el coste de pelear. La barra muestra qué repartos acepta cada uno y dónde coinciden.</p>' +
      '<div class="w-pre" id="' + id + '-pre">' + pre + '</div>' + html +
      '<svg id="' + id + '-svg" viewBox="0 0 600 226" role="img" aria-label=""></svg>' +
      '<p class="w-res" id="' + id + '-res" aria-live="polite"></p>' +
      '<table><thead><tr><th>Cuenta del margen</th><th>Puntos</th></tr></thead><tbody id="' + id + '-tab"></tbody></table>' +
      '<p class="w-cap">Modelo propio con cifras ilustrativas, a partir de las figuras 7.9 a 7.11 del libro. El reparto es lo que recibe A; B recibe el resto. Los factores se suman por diseño para verlos en la misma escala; en la realidad interactúan. El simulador no predice cuándo estalla un conflicto, solo si existe un reparto que ambos prefieran a pelear.</p>' +
      '</div>';

    function $(x) { return el.querySelector("#" + id + "-" + x); }
    var svg = $("svg"), btns = el.querySelectorAll("#" + id + "-pre button");

    function X(v) { return 30 + 5.5 * clamp(v, 0, 100); }

    function update() {
      var m = modelo(s), o = [], j, v, tk = [0, 25, 50, 75, 100], lo, hi, txt, fila;
      var aMin = clamp(m.amin, 0, 100), bMax = clamp(m.bmax, 0, 100);

      if (s.L > 0) {
        o.push('<rect x="' + X(m.pie).toFixed(1) + '" y="14" width="' + (X(100) - X(m.pie)).toFixed(1) + '" height="150" style="fill:var(--trap-bg);opacity:.7"/>');
        o.push('<text x="' + X(m.pie).toFixed(1) + '" y="178" style="fill:var(--trap);font:15px var(--sans)">valor perdido al repartir</text>');
      }
      for (j = 0; j < tk.length; j++) {
        v = tk[j];
        o.push('<line x1="' + X(v).toFixed(1) + '" y1="14" x2="' + X(v).toFixed(1) + '" y2="164" style="stroke:var(--rule);stroke-width:1"/>');
        o.push('<text x="' + X(v).toFixed(1) + '" y="196" text-anchor="middle" style="fill:var(--faint);font:16px var(--mono)">' + v + '</text>');
      }
      o.push('<text x="305" y="220" text-anchor="middle" style="fill:var(--faint);font:15px var(--mono)">reparto: lo que recibe A (de 100); B recibe el resto</text>');

      o.push('<text x="30" y="32" style="fill:currentColor;font:600 18px var(--sans)">A acepta desde ' + fmt(m.amin) + '</text>');
      o.push('<rect x="' + X(aMin).toFixed(1) + '" y="38" width="' + (X(100) - X(aMin)).toFixed(1) + '" height="20" rx="4" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>');
      o.push('<text x="30" y="86" style="fill:currentColor;font:600 18px var(--sans)">B acepta hasta ' + fmt(m.bmax) + '</text>');
      o.push('<rect x="' + X(0).toFixed(1) + '" y="92" width="' + (X(bMax) - X(0)).toFixed(1) + '" height="20" rx="4" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>');

      if (m.ok) {
        o.push('<text x="30" y="140" style="fill:var(--ex);font:700 18px var(--sans)">Rango de acuerdos: de ' + fmt(m.lo) + ' a ' + fmt(m.hi) + '</text>');
        o.push('<rect x="' + X(m.lo).toFixed(1) + '" y="146" width="' + Math.max(3, X(m.hi) - X(m.lo)).toFixed(1) + '" height="18" rx="4" style="fill:var(--ex-bg);stroke:var(--ex);stroke-width:2"/>');
      } else {
        lo = clamp(m.hi, 0, 100); hi = clamp(m.lo, 0, 100);
        o.push('<text x="30" y="140" style="fill:var(--trap);font:700 18px var(--sans)">Sin acuerdo: ningún reparto sirve a los dos</text>');
        o.push('<rect x="' + X(lo).toFixed(1) + '" y="146" width="' + Math.max(3, X(hi) - X(lo)).toFixed(1) + '" height="18" rx="4" style="fill:var(--trap-bg);stroke:var(--trap);stroke-width:2;stroke-dasharray:5 3"/>');
      }
      o.push('<line x1="' + X(s.p).toFixed(1) + '" y1="20" x2="' + X(s.p).toFixed(1) + '" y2="166" style="stroke:var(--ink);stroke-width:1.5;stroke-dasharray:3 3"/>');
      o.push('<text x="' + X(s.p).toFixed(1) + '" y="13" text-anchor="' + (s.p > 80 ? "end" : "middle") + '" style="fill:var(--ink);font:15px var(--sans)">fuerza real de A: ' + s.p + '</text>');
      svg.innerHTML = o.join("");

      CAMPOS.forEach(function (c) { $("v-" + c.k).textContent = c.k === "p" ? s.p + " %" : String(s[c.k]); });

      var res = $("res");
      if (m.ok) {
        txt = "Hay acuerdo posible: cualquier reparto en el que A reciba entre " + fmt(m.lo) + " y " + fmt(m.hi) + " deja a los dos mejor que pelear. El ancho es " + fmt(m.ancho) + ".";
        res.className = "w-res si";
      } else if (m.motivo === "exigencias") {
        txt = "No hay acuerdo posible: A exige al menos " + fmt(m.amin) + " y B solo puede conceder " + fmt(m.bmax) + ". Faltan " + fmt(m.amin - m.bmax) + " puntos. Pelear es racional para los dos, aunque salga caro.";
        res.className = "w-res no";
      } else {
        txt = "No hay acuerdo posible: A exigiría más de lo que hay para repartir (" + fmt(m.pie) + "), o B ya cedería más de lo que existe. Pelear es lo único que ambos prefieren.";
        res.className = "w-res no";
      }
      res.textContent = txt;

      fila = function (a, b) { return "<tr><td>" + a + "</td><td>" + b + "</td></tr>"; };
      $("tab").innerHTML =
        fila("Costes de pelear (A + B)", sg(s.cA + s.cB)) +
        fila("Optimismo (A + B)", sg(-(s.oA + s.oB))) +
        fila("2 × ventaja del primer golpe", sg(-2 * s.f)) +
        fila("Caída de poder futura", sg(-s.S)) +
        fila("Valor perdido al repartir", sg(-s.L)) +
        '<tr class="tot"><td>Margen (ancho del rango)</td><td>' + sg(m.margen) + '</td></tr>' +
        (m.ok && Math.abs(m.ancho - m.margen) > 1e-9 ? fila("Ancho real tras recortar a [0, " + fmt(m.pie) + "]", fmt(m.ancho)) : "");

      for (j = 0; j < btns.length; j++) btns[j].setAttribute("aria-pressed", btns[j].getAttribute("data-p") === actual ? "true" : "false");
      svg.setAttribute("aria-label", "Barras de repartos entre 0 y 100. A acepta desde " + fmt(m.amin) + " y B acepta hasta " + fmt(m.bmax) + ". " + txt);
    }

    CAMPOS.forEach(function (c) {
      $(c.k).addEventListener("input", function () { s[c.k] = +$(c.k).value; actual = ""; update(); });
    });
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        var pid = b.getAttribute("data-p"), pr, q;
        for (q = 0; q < PRESETS.length; q++) if (PRESETS[q].id === pid) pr = PRESETS[q];
        for (k in pr.v) { s[k] = pr.v[k]; $(k).value = pr.v[k]; }
        actual = pid; update();
      });
    });
    actual = "pleito";
    update();
  }

  widget.modelo = { modelo: modelo, PRESETS: PRESETS, BASE: BASE };
  window.WIDGETS["m09-l04-negociacion"] = widget;
})();
