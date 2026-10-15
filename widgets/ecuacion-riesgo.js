/* Widget "ecuacion-riesgo": riesgo = P x severidad x exposición x vulnerabilidad (÷ capacidad de afrontamiento).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};

  var SCALE_MAX = 5;      // fondo de escala de la barra principal
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-er-style")) return;
    var st = document.createElement("style");
    st.id = "w-er-style";
    st.textContent = [
      ".w-er{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-er h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-er .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-er .w-sub{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-er .w-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.15rem .6rem;align-items:center;margin:0 0 .6rem}",
      ".w-er .w-row label{font-weight:600;grid-column:1}",
      ".w-er .w-row output{grid-column:2;font:600 .85rem var(--mono);color:var(--accent-ink);text-align:right;min-width:4.5rem}",
      ".w-er .w-row input[type=range]{grid-column:1 / -1;width:100%;accent-color:var(--accent);margin:0;min-height:1.6rem}",
      ".w-er .w-row small{grid-column:1 / -1;color:var(--faint);font-size:.76rem}",
      ".w-er .w-res{background:var(--accent-soft);border-radius:8px;padding:.7rem .85rem;margin:.9rem 0 .4rem}",
      ".w-er .w-big{font:700 1.7rem/1.1 var(--cond);color:var(--accent-ink)}",
      ".w-er .w-eq{font:500 .8rem var(--mono);color:var(--muted);margin:.25rem 0 .6rem;overflow-wrap:anywhere}",
      ".w-er .w-bar{position:relative;height:.9rem;background:var(--ground);border:1px solid var(--rule-strong);border-radius:999px;overflow:hidden}",
      ".w-er .w-bar > i{display:block;height:100%;background:var(--accent);border-radius:999px;transition:width .15s}",
      ".w-er .w-bar.w-mini{height:.55rem;margin-top:.3rem}",
      ".w-er .w-bar.w-mini > i{background:var(--ex)}",
      ".w-er .w-bar.w-mini.w-best > i{background:var(--trap)}",
      ".w-er .w-ticks{display:flex;justify-content:space-between;font:500 .68rem var(--mono);color:var(--faint);margin-top:.15rem}",
      ".w-er .w-warn{color:var(--trap);font-weight:600;margin:.3rem 0 0}",
      ".w-er .w-lever{border-top:1px solid var(--rule);padding:.55rem 0 .2rem}",
      ".w-er .w-lever .w-line{display:flex;justify-content:space-between;gap:.5rem;flex-wrap:wrap}",
      ".w-er .w-tag{font:600 .66rem/1 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--trap);border:1px solid var(--trap-rule);background:var(--trap-bg);border-radius:999px;padding:.2rem .45rem;margin-left:.4rem}",
      ".w-er .w-combo{border-top:1px solid var(--rule);padding-top:.6rem;margin-top:.3rem;font-weight:600}",
      ".w-er button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer;margin:.4rem .4rem 0 0}",
      ".w-er button:hover{background:var(--accent-soft)}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function nf(n, d) {
    var x = Number(n);
    if (!isFinite(x)) return "∞";
    return x.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: d });
  }

  var FACTORS = [
    { key: "p", label: "Probabilidad del peligro", min: 0, max: 100, step: 0.5, unit: "%", hint: "Cuán probable es que el peligro ocurra." },
    { key: "s", label: "Severidad", min: 0, max: 10, step: 0.5, unit: "", hint: "Daño si ocurre, en una escala de 0 a 10." },
    { key: "e", label: "Exposición", min: 0, max: 100, step: 0.5, unit: "%", hint: "Parte del peligro que llega a alguien (contacto)." },
    { key: "v", label: "Vulnerabilidad", min: 0, max: 100, step: 0.5, unit: "%", hint: "Cuánto daño sufre quien es alcanzado." },
    { key: "c", label: "Capacidad de afrontamiento (opcional)", min: 0.1, max: 2, step: 0.05, unit: "×", hint: "Ampliación del libro; la escala de 0,1 a 2 es nuestra y 1 es neutra. Menos de 1 empeora, más de 1 mejora." }
  ];

  var LEVERS = [
    { key: "p", label: "Reducir el peligro (probabilidad y severidad)", field: "Control y alineamiento", def: 25 },
    { key: "e", label: "Reducir la exposición", field: "Monitorización", def: 60 },
    { key: "v", label: "Reducir la vulnerabilidad", field: "Robustez", def: 30 }
  ];

  var DEFAULTS = { p: 40, s: 6, e: 70, v: 60, c: 1 };
  var HOSPITAL = { p: 2, s: 5, e: 80, v: 50, c: 1 };

  function risk(st) {
    return (st.p / 100) * st.s * (st.e / 100) * (st.v / 100) / st.c;
  }

  window.WIDGETS["ecuacion-riesgo"] = function (el) {
    injectStyle();
    var id = "w-er-" + (++uid);
    var st = { p: DEFAULTS.p, s: DEFAULTS.s, e: DEFAULTS.e, v: DEFAULTS.v, c: DEFAULTS.c };
    var red = { p: LEVERS[0].def, e: LEVERS[1].def, v: LEVERS[2].def };

    var html = '<div class="w-er">' +
      '<h4>Ecuación del riesgo</h4>' +
      '<p class="w-hint">Mueve los deslizadores. El riesgo es el producto de los factores. Con las teclas de flecha se ajusta cada deslizador.</p>';
    FACTORS.forEach(function (f) {
      html += '<div class="w-row">' +
        '<label for="' + id + '-' + f.key + '">' + f.label + '</label>' +
        '<output id="' + id + '-o-' + f.key + '" for="' + id + '-' + f.key + '"></output>' +
        '<input type="range" id="' + id + '-' + f.key + '" min="' + f.min + '" max="' + f.max + '" step="' + f.step + '" value="' + st[f.key] + '">' +
        '<small>' + f.hint + '</small></div>';
    });
    html += '<div class="w-res" role="status" aria-live="polite">' +
      '<div class="w-big" id="' + id + '-risk"></div>' +
      '<div class="w-eq" id="' + id + '-eq"></div>' +
      '<div class="w-bar" aria-hidden="true"><i id="' + id + '-bar" style="width:0%"></i></div>' +
      '<div class="w-ticks" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>' + SCALE_MAX + '</span></div>' +
      '<p class="w-warn" id="' + id + '-warn" hidden>El riesgo supera la escala de la barra.</p>' +
      '</div>' +
      '<div class="w-sub">Qué intervención baja más</div>' +
      '<p class="w-hint">Indica cuánto crees poder recortar cada factor. El recorte del peligro cuenta sobre probabilidad × severidad juntas, sea por una, por otra o por ambas. Con un producto, recortar un factor un 50 % baja el riesgo un 50 %, sea cual sea el factor. Decide cuánto puedes recortar y lo que cuesta.</p>';
    LEVERS.forEach(function (l) {
      html += '<div class="w-lever">' +
        '<div class="w-row" style="margin-bottom:.2rem">' +
        '<label for="' + id + '-r-' + l.key + '">' + l.label + ' <small style="display:inline;color:var(--faint);font-weight:400">(' + l.field + ')</small></label>' +
        '<output id="' + id + '-ro-' + l.key + '" for="' + id + '-r-' + l.key + '"></output>' +
        '<input type="range" id="' + id + '-r-' + l.key + '" min="0" max="100" step="0.5" value="' + red[l.key] + '"></div>' +
        '<div class="w-line"><span id="' + id + '-rt-' + l.key + '"></span></div>' +
        '<div class="w-bar w-mini" id="' + id + '-rb-' + l.key + '" aria-hidden="true"><i style="width:100%"></i></div></div>';
    });
    html += '<div class="w-combo" id="' + id + '-combo" role="status" aria-live="polite"></div>' +
      '<button type="button" id="' + id + '-hosp">Cargar el ejemplo del hospital</button>' +
      '<button type="button" id="' + id + '-reset">Restablecer</button>' +
      '</div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function render() {
      var i, f, l, r0 = risk(st), s = "";
      for (i = 0; i < FACTORS.length; i++) {
        f = FACTORS[i];
        var out = $("o-" + f.key);
        out.textContent = f.key === "s" ? nf(st.s, 1) : (f.key === "c" ? nf(st.c, 2) + " ×" : nf(st[f.key], 1) + " %");
      }
      $("risk").textContent = "Riesgo = " + nf(r0, 3);
      $("eq").textContent = nf(st.p / 100, 3) + " × " + nf(st.s, 1) + " × " + nf(st.e / 100, 3) + " × " + nf(st.v / 100, 3) +
        (st.c !== 1 ? " ÷ " + nf(st.c, 2) : "");
      $("bar").style.width = Math.min(100, r0 / SCALE_MAX * 100) + "%";
      $("warn").hidden = r0 <= SCALE_MAX;

      var best = null, bestVal = -1, prod = 1;
      for (i = 0; i < LEVERS.length; i++) {
        l = LEVERS[i];
        if (red[l.key] > bestVal) { bestVal = red[l.key]; best = l.key; }
        prod *= (1 - red[l.key] / 100);
      }
      var ties = LEVERS.filter(function (x) { return red[x.key] === bestVal; }).length;
      for (i = 0; i < LEVERS.length; i++) {
        l = LEVERS[i];
        var after = r0 * (1 - red[l.key] / 100);
        var rel = r0 > 0 ? (after / r0) * 100 : 100;
        $("ro-" + l.key).textContent = "−" + nf(red[l.key], 1) + " %";
        var isBest = bestVal > 0 && ties === 1 && l.key === best;
        var txt = "Riesgo tras la intervención: " + nf(after, 3);
        var t = $("rt-" + l.key);
        t.textContent = txt;
        if (isBest) {
          var tag = document.createElement("span");
          tag.className = "w-tag";
          tag.textContent = "mayor bajada";
          t.appendChild(tag);
        }
        var bar = $("rb-" + l.key);
        bar.className = "w-bar w-mini" + (isBest ? " w-best" : "");
        bar.firstChild.style.width = rel + "%";
      }
      var comb = r0 * prod;
      $("combo").textContent = "Las tres a la vez: riesgo " + nf(comb, 3) +
        (r0 > 0 ? " (−" + nf((1 - comb / r0) * 100, 1) + " %)" : "") +
        ". Los recortes se multiplican entre sí.";
    }

    function set(vals) {
      Object.keys(vals).forEach(function (k) {
        st[k] = vals[k];
        var inp = $(k);
        if (inp) inp.value = vals[k];
      });
    }

    FACTORS.forEach(function (f) {
      $(f.key).addEventListener("input", function (ev) {
        st[f.key] = parseFloat(ev.target.value);
        render();
      });
    });
    LEVERS.forEach(function (l) {
      $("r-" + l.key).addEventListener("input", function (ev) {
        red[l.key] = parseFloat(ev.target.value);
        render();
      });
    });
    $("reset").addEventListener("click", function () {
      set(DEFAULTS);
      LEVERS.forEach(function (l) { red[l.key] = l.def; $("r-" + l.key).value = l.def; });
      render();
    });
    $("hosp").addEventListener("click", function () {
      set(HOSPITAL);
      red.p = 25; red.e = 62.5; red.v = 30;
      LEVERS.forEach(function (l) { $("r-" + l.key).value = red[l.key]; });
      render();
    });
    render();
  };
})();
