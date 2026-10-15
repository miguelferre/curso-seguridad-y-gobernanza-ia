/* Simulador "m09-l03-umbrales": calcula, con las reglas de la seccion 7.3 del libro (Hendrycks, cap. 7),
   que mecanismos sostienen la cooperacion con otra IA y con una persona.
   Reglas del libro: w > c/b (directa, p. 405), q > c/b (indirecta, p. 407), b/c > 1 + n/m (grupo, p. 408),
   r*b > c (parentesco, p. 410). Propio: la multa esperada p*F > g (instituciones), el factor k que rebaja
   el beneficio de cooperar con una persona y el supuesto r = 0 con personas. Numeros ilustrativos.
   Sin dependencias. Estilos con las variables del CSS del Atlas. Accesible por teclado (range nativos). */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  // Controles: [clave, etiqueta, min, max, paso, valor inicial]
  var GRUPOS = [
    { t: "Precio de ayudar", c: [
      ["b", "Beneficio para quien recibe, b", 1, 10, 0.5, 3],
      ["c", "Coste de ayudar, c", 0.5, 5, 0.5, 1],
      ["k", "Factor humano k (cuánto de b llega si el socio es una persona)", 0.05, 1, 0.05, 0.6]
    ] },
    { t: "Cuánto vuelve", c: [
      ["w", "Probabilidad de volver a encontrarse, w", 0, 1, 0.05, 0.5],
      ["q", "Probabilidad de conocer la reputación, q", 0, 1, 0.05, 0.2],
      ["r", "Parecido entre las dos IA, r", 0, 1, 0.025, 0.125]
    ] },
    { t: "Grupos e instituciones", c: [
      ["n", "Tamaño máximo del grupo, n", 2, 60, 1, 20],
      ["m", "Número de grupos, m", 1, 60, 1, 5],
      ["p", "Probabilidad de detectar la deserción, p", 0, 1, 0.05, 0.3],
      ["F", "Multa si se detecta, F", 0, 20, 1, 8],
      ["g", "Ganancia de desertar, g", 0.5, 10, 0.5, 3]
    ] }
  ];

  function fmt(x) {
    var y = Math.round(x * 1000) / 1000;
    return String(y).replace(".", ",");
  }

  // Devuelve una lista de filas {n, regla, ia:{ok,txt}, hu:{ok,txt}}. Pura, para poder comprobarla.
  function calc(v) {
    var cb = v.c / v.b;
    var cbh = v.c / (v.b * v.k);
    var rows = [];

    rows.push({
      n: "Reciprocidad directa", regla: "w > c/b",
      ia: { ok: v.w > cb, txt: "w = " + fmt(v.w) + " frente a c/b = " + fmt(cb) },
      hu: { ok: v.w > cbh, txt: cbh > 1
        ? "c/(b·k) = " + fmt(cbh) + ": pide w > 1, imposible"
        : "w = " + fmt(v.w) + " frente a c/(b·k) = " + fmt(cbh) }
    });
    rows.push({
      n: "Reciprocidad indirecta", regla: "q > c/b",
      ia: { ok: v.q > cb, txt: "q = " + fmt(v.q) + " frente a c/b = " + fmt(cb) },
      hu: { ok: v.q > cbh, txt: cbh > 1
        ? "c/(b·k) = " + fmt(cbh) + ": pide q > 1, imposible"
        : "q = " + fmt(v.q) + " frente a c/(b·k) = " + fmt(cbh) }
    });
    rows.push({
      n: "Selección de grupo", regla: "b/c > 1 + n/m",
      ia: { ok: v.b / v.c > 1 + v.n / v.m, txt: "b/c = " + fmt(v.b / v.c) + " frente a 1 + n/m = " + fmt(1 + v.n / v.m) },
      hu: { ok: false, txt: "la persona queda fuera del grupo (lectura propia)" }
    });
    rows.push({
      n: "Selección de parentesco", regla: "r·b > c",
      ia: { ok: v.r * v.b > v.c, txt: "r·b = " + fmt(v.r * v.b) + " frente a c = " + fmt(v.c) },
      hu: { ok: false, txt: "se supone r = 0 con personas: r·b = 0 (lectura propia)" }
    });
    var multa = v.p * v.F;
    rows.push({
      n: "Instituciones", regla: "p·F > g (propio)",
      ia: { ok: multa > v.g, txt: "p·F = " + fmt(multa) + " frente a g = " + fmt(v.g) },
      hu: { ok: multa > v.g, txt: "p·F = " + fmt(multa) + " frente a g = " + fmt(v.g) }
    });
    return rows;
  }

  function injectStyle() {
    if (document.getElementById("w-um-style")) return;
    var st = document.createElement("style");
    st.id = "w-um-style";
    st.textContent = [
      ".w-um{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-um h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-um .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-um fieldset{border:1px solid var(--rule);border-radius:8px;margin:0 0 .7rem;padding:.4rem .7rem .6rem;min-width:0}",
      ".w-um legend{font:600 .82rem var(--cond);color:var(--accent-ink);padding:0 .3rem}",
      ".w-um .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.5rem .9rem}",
      ".w-um .w-ctl label{display:flex;justify-content:space-between;gap:.5rem;font-size:.8rem;color:var(--muted);line-height:1.3}",
      ".w-um .w-ctl output{font:600 .82rem var(--mono);color:var(--ink);white-space:nowrap}",
      ".w-um .w-ctl input{width:100%;margin:.15rem 0 0}",
      ".w-um table{width:100%;border-collapse:collapse;margin:.4rem 0 .6rem;font-size:.82rem}",
      ".w-um th,.w-um td{border:1px solid var(--rule);padding:.4rem .5rem;text-align:left;vertical-align:top}",
      ".w-um th{background:var(--ground);font:600 .78rem var(--cond)}",
      ".w-um td.w-mn b{display:block;font:600 .86rem var(--cond)}",
      ".w-um td.w-mn span{font:500 .72rem var(--mono);color:var(--faint)}",
      ".w-um td.w-si{background:var(--ex-bg)}",
      ".w-um td.w-no{background:var(--trap-bg)}",
      ".w-um td b.w-st{display:block;font:700 .8rem var(--cond)}",
      ".w-um td.w-si b.w-st{color:var(--ex)}",
      ".w-um td.w-no b.w-st{color:var(--trap)}",
      ".w-um td span.w-dt{display:block;color:var(--muted);font-size:.76rem;line-height:1.35}",
      ".w-um .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-um .w-btns{margin:.2rem 0 .6rem}",
      ".w-um button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-um button:hover{background:var(--accent-soft)}",
      ".w-um .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var fn = function (el) {
    injectStyle();
    var id = "w-um-" + (++uid);
    var html = "", vals = {};

    html += '<div class="w-um"><h4>Umbrales de cooperación</h4>' +
      '<p class="w-hint">Mueve los deslizadores y mira qué mecanismos sostienen la cooperación con otra IA y con una persona. Es un cálculo con las reglas del libro, con números ilustrativos.</p>';
    GRUPOS.forEach(function (g) {
      html += '<fieldset><legend>' + esc(g.t) + '</legend><div class="w-grid">';
      g.c.forEach(function (c) {
        vals[c[0]] = c[5];
        html += '<div class="w-ctl"><label for="' + id + '-' + c[0] + '"><span>' + esc(c[1]) + '</span>' +
          '<output id="' + id + '-o-' + c[0] + '" for="' + id + '-' + c[0] + '">' + fmt(c[5]) + '</output></label>' +
          '<input type="range" id="' + id + '-' + c[0] + '" min="' + c[2] + '" max="' + c[3] + '" step="' + c[4] + '" value="' + c[5] + '"></div>';
      });
      html += '</div></fieldset>';
    });
    html += '<table><thead><tr><th scope="col">Mecanismo</th><th scope="col">Con otra IA</th><th scope="col">Con una persona</th></tr></thead>' +
      '<tbody id="' + id + '-tb"></tbody></table>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<div class="w-btns"><button type="button" id="' + id + '-re">Volver a los valores iniciales</button></div>' +
      '<p class="w-cap">Reglas del libro (7.3): w &gt; c/b, q &gt; c/b, b/c &gt; 1 + n/m y r·b &gt; c. Son propios la multa esperada p·F &gt; g, el factor k, el supuesto r = 0 con personas y que las personas queden fuera del grupo. La regla de grupo del libro supone m grande. Sirve para ver en qué sentido empuja cada palanca, no para medir un sistema real.</p></div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var tb = $("tb"), note = $("note");

    function cell(x) {
      return '<td class="' + (x.ok ? "w-si" : "w-no") + '"><b class="w-st">' +
        (x.ok ? "Sostiene la cooperación" : "No basta") + '</b><span class="w-dt">' + esc(x.txt) + '</span></td>';
    }

    function render() {
      var rows = calc(vals), h = "", nia = 0, nhu = 0;
      rows.forEach(function (r) {
        if (r.ia.ok) nia++;
        if (r.hu.ok) nhu++;
        h += '<tr><td class="w-mn"><b>' + esc(r.n) + '</b><span>' + esc(r.regla) + '</span></td>' + cell(r.ia) + cell(r.hu) + '</tr>';
      });
      tb.innerHTML = h;
      note.textContent = "Con otra IA sostienen la cooperación " + nia + " de 5 mecanismos; con una persona, " + nhu + " de 5.";
    }

    GRUPOS.forEach(function (g) {
      g.c.forEach(function (c) {
        var inp = $(c[0]), out = $("o-" + c[0]);
        inp.addEventListener("input", function () {
          vals[c[0]] = parseFloat(inp.value);
          out.textContent = fmt(vals[c[0]]);
          render();
        });
      });
    });
    $("re").addEventListener("click", function () {
      GRUPOS.forEach(function (g) {
        g.c.forEach(function (c) {
          vals[c[0]] = c[5];
          $(c[0]).value = c[5];
          $("o-" + c[0]).textContent = fmt(c[5]);
        });
      });
      render();
    });
    render();
  };
  fn.calc = calc;
  window.WIDGETS["m09-l03-umbrales"] = fn;
})();
