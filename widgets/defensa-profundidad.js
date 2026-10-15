/* Widget "defensa-profundidad": capas de defensa con probabilidad de fallo por capa.
   Calcula la probabilidad de que fallen todas (capas independientes) y cómo empeora si los fallos están correlacionados.
   Modelo de correlación PROPIO de la lección (no del libro): P = (1-c)*prod(p_i) + c*min(p_i), con c entre 0 y 1.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-dp-style")) return;
    var st = document.createElement("style");
    st.id = "w-dp-style";
    st.textContent = [
      ".w-dp{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-dp h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-dp .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-dp .w-layers{display:grid;gap:.5rem;margin:0 0 .7rem}",
      ".w-dp .w-layer{display:grid;grid-template-columns:5.2rem minmax(0,1fr) 4.6rem;gap:.6rem;align-items:center}",
      ".w-dp .w-layer label{font:600 .78rem var(--mono);color:var(--muted)}",
      ".w-dp .w-layer output{font:600 .85rem var(--mono);text-align:right;color:var(--ink)}",
      ".w-dp input[type=range]{width:100%;min-width:0;accent-color:var(--accent)}",
      ".w-dp .w-corr{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem;margin:0 0 .7rem}",
      ".w-dp .w-corr .w-layer{grid-template-columns:8rem minmax(0,1fr) 4.6rem}",
      ".w-dp .w-corr p{margin:.3rem 0 0;color:var(--muted);font-size:.8rem}",
      ".w-dp .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-dp button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-dp button:hover{background:var(--accent-soft)}",
      ".w-dp button[disabled]{opacity:.45;cursor:not-allowed}",
      ".w-dp dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-dp dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-dp dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-dp dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-dp .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .9rem}",
      ".w-dp .w-sub{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:.9rem 0 .5rem}",
      ".w-dp .w-bars{display:grid;grid-template-columns:8.2rem minmax(0,1fr) 5.6rem;gap:.3rem .6rem;align-items:center;font-size:.82rem}",
      ".w-dp .w-bars .w-k{font:600 .76rem var(--mono);color:var(--muted)}",
      ".w-dp .w-track{height:.6rem;background:var(--ground);border:1px solid var(--rule);border-radius:999px;overflow:hidden}",
      ".w-dp .w-track > i{display:block;height:100%;border-radius:999px;background:var(--ex)}",
      ".w-dp .w-track.w-ind > i{background:var(--accent)}",
      ".w-dp .w-track.w-cor > i{background:var(--trap)}",
      ".w-dp .w-bars .w-v{font:500 .78rem var(--mono);text-align:right;color:var(--ink)}",
      ".w-dp .w-cap{color:var(--faint);font-size:.76rem;margin:.4rem 0 0}",
      "@media (max-width:480px){.w-dp .w-layer,.w-dp .w-corr .w-layer{grid-template-columns:minmax(0,1fr) 4.2rem}.w-dp .w-layer label{grid-column:1 / -1}.w-dp .w-bars{grid-template-columns:6.4rem minmax(0,1fr) 4.8rem}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fix(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function sig(x, n) { return Number(x).toLocaleString("es-ES", { maximumSignificantDigits: n || 3 }); }
  function pct(x) {
    var p = x * 100;
    if (p === 0) return "0 %";
    if (p >= 10) return fix(p, 1) + " %";
    if (p >= 0.01) return sig(p, 3) + " %";
    return sig(p, 2) + " %";
  }

  var MIN = 1, MAX = 6, PMIN = 0.5, PMAX = 50;

  window.WIDGETS["defensa-profundidad"] = function (el) {
    injectStyle();
    var id = "w-dp-" + (++uid);
    var probs = [10, 10, 10, 10];   // % de fallo por capa
    var corr = 0;                   // 0 a 100

    el.innerHTML = '<div class="w-dp">' +
      '<h4>Capas de defensa</h4>' +
      '<p class="w-hint">Cada capa falla con su probabilidad. Con capas independientes se multiplican. Sube la correlación y verás cómo las capas se parecen cada vez más a una sola.</p>' +
      '<div class="w-layers" id="' + id + '-layers" role="group" aria-label="Probabilidad de fallo de cada capa"></div>' +
      '<div class="w-btns" role="group" aria-label="Acciones">' +
      '<button type="button" id="' + id + '-add">Añadir capa</button>' +
      '<button type="button" id="' + id + '-del">Quitar capa</button>' +
      '<button type="button" id="' + id + '-p1">4 capas del 10 %</button>' +
      '<button type="button" id="' + id + '-p2">Ejemplo clínico (20, 10, 5 %)</button>' +
      '</div>' +
      '<div class="w-corr">' +
      '<div class="w-layer"><label for="' + id + '-c">Correlación de fallos</label>' +
      '<input type="range" id="' + id + '-c" min="0" max="100" step="5" value="0">' +
      '<output for="' + id + '-c" id="' + id + '-cv"></output></div>' +
      '<p>0 % es independencia. 100 % es que todas fallan siempre juntas, y solo cuenta la mejor capa. Modelo propio de la lección, no del libro: mezcla lineal entre esos dos extremos.</p>' +
      '</div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Fallan todas (independientes)</dt><dd id="' + id + '-o-i"></dd></div>' +
      '<div><dt>Fallan todas (con la correlación)</dt><dd id="' + id + '-o-c"></dd></div>' +
      '<div><dt>Veces peor que independientes</dt><dd id="' + id + '-o-r"></dd></div>' +
      '<div><dt>Una vez cada (con la correlación)</dt><dd id="' + id + '-o-t"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-more" aria-live="polite"></p>' +
      '<div class="w-sub">Probabilidad de fallo total (escala logarítmica)</div>' +
      '<div class="w-bars" id="' + id + '-bars" role="group" aria-label="Comparación de probabilidades"></div>' +
      '<p class="w-cap">Cifras de práctica, no de un sistema real. Fórmula del modelo: P = (1 - c) por el producto de las probabilidades + c por la menor de ellas, con c entre 0 y 1.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var box = $("layers"), inC = $("c"), outCv = $("cv"), bAdd = $("add"), bDel = $("del");

    function build() {
      var h = "";
      probs.forEach(function (p, i) {
        h += '<div class="w-layer"><label for="' + id + '-l' + i + '">Capa ' + (i + 1) + '</label>' +
          '<input type="range" id="' + id + '-l' + i + '" data-i="' + i + '" min="' + PMIN + '" max="' + PMAX + '" step="0.5" value="' + p + '">' +
          '<output for="' + id + '-l' + i + '" id="' + id + '-lv' + i + '"></output></div>';
      });
      box.innerHTML = h;
      Array.prototype.forEach.call(box.querySelectorAll("input[type=range]"), function (r) {
        r.addEventListener("input", function () {
          probs[Number(r.getAttribute("data-i"))] = Number(r.value);
          update();
        });
      });
      bAdd.disabled = probs.length >= MAX;
      bDel.disabled = probs.length <= MIN;
      update();
    }

    function bar(cls, label, p) {
      var w = p > 0 ? (Math.log10(p) + 6) / 6 * 100 : 0;
      w = Math.max(2, Math.min(100, w));
      return '<div class="w-k">' + label + '</div><div class="w-track ' + cls + '" aria-hidden="true"><i style="width:' + w + '%"></i></div><div class="w-v">' + pct(p) + '</div>';
    }

    function update() {
      var c = corr / 100, prod = 1, mn = 1;
      probs.forEach(function (p, i) {
        var q = p / 100;
        prod *= q;
        if (q < mn) mn = q;
        var o = $("lv" + i), r = $("l" + i);
        if (o) o.textContent = fix(p, 1) + " %";
        if (r) r.setAttribute("aria-valuetext", fix(p, 1) + " por ciento de fallo");
      });
      var pc = (1 - c) * prod + c * mn;
      outCv.textContent = fix(corr, 0) + " %";
      inC.setAttribute("aria-valuetext", fix(corr, 0) + " por ciento de correlación");
      $("o-i").textContent = pct(prod);
      $("o-c").textContent = pct(pc);
      $("o-r").textContent = prod > 0 ? "x " + sig(pc / prod, 3) : "-";
      $("o-t").textContent = pc > 0 ? sig(1 / pc, 3) + " usos" : "nunca";
      var more = $("more");
      if (probs.length === 1) {
        more.textContent = "Con una sola capa no hay defensa en profundidad: todo depende de ella.";
      } else if (corr === 0) {
        more.textContent = "Con " + probs.length + " capas independientes, el conjunto falla " + sig(mn / prod, 3) + " veces menos que su mejor capa sola.";
      } else if (corr >= 100) {
        more.textContent = "Correlación total: las " + probs.length + " capas se comportan como una sola, la mejor. Añadir capas no aporta nada.";
      } else {
        more.textContent = "Con correlación del " + fix(corr, 0) + " %, el conjunto falla " + sig(mn / pc, 3) + " veces menos que su mejor capa, en lugar de las " + sig(mn / prod, 3) + " del caso independiente.";
      }
      $("bars").innerHTML = bar("", "Mejor capa sola", mn) + bar("w-ind", "Independientes", prod) + bar("w-cor", "Con correlación", pc);
      bAdd.disabled = probs.length >= MAX;
      bDel.disabled = probs.length <= MIN;
    }

    inC.addEventListener("input", function () { corr = Number(inC.value); update(); });
    bAdd.addEventListener("click", function () { if (probs.length < MAX) { probs.push(10); build(); } });
    bDel.addEventListener("click", function () { if (probs.length > MIN) { probs.pop(); build(); } });
    $("p1").addEventListener("click", function () { probs = [10, 10, 10, 10]; build(); });
    $("p2").addEventListener("click", function () { probs = [20, 10, 5]; build(); });

    build();
  };
})();
