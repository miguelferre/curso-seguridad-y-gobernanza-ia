/* Simulador "m08-l04-margen": a quien le daria cada regla una mejora de bienestar.
   Tres personas con bienestar ajustable. Se les da a una de ellas un aumento fijo (o se duplica su bienestar, como en el
   ejemplo del libro, 6.8, p. 350: (2, 4, 16) en base 2, de 2 a 4 y de 4 a 8 suben lo mismo en la suma de logaritmos).
   Ganancia en la suma = aumento; en la suma de log2 = log2((w+d)/w); en el minimo = nuevo minimo menos el antiguo.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var EPS = 1e-9;
  var NOMBRES = ["Persona 1", "Persona 2", "Persona 3"];

  function minimo(v) { return Math.min.apply(null, v); }
  function log2(x) { return Math.log(x) / Math.LN2; }

  /* w: bienestares; modo "suma" (d puntos) o "doble" (duplica el de esa persona). Devuelve la ganancia de cada regla por persona. */
  function calc(w, modo, d) {
    var m0 = minimo(w);
    return w.map(function (x, i) {
      var inc = modo === "doble" ? x : d, nv = w.slice();
      nv[i] = x + inc;
      return { inc: inc, despues: x + inc, suma: inc, log: log2(x + inc) - log2(x), min: minimo(nv) - m0 };
    });
  }

  function mejores(g, k) {
    var m = -Infinity, r = [], i;
    for (i = 0; i < g.length; i++) if (g[i][k] > m) m = g[i][k];
    for (i = 0; i < g.length; i++) if (g[i][k] > m - EPS) r.push(i);
    return r;
  }

  window.WIDGETS["m08-l04-margen"] = build;
  build.calc = calc;
  build.mejores = mejores;

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function injectStyle() {
    if (document.getElementById("w-m8m-style")) return;
    var st = document.createElement("style");
    st.id = "w-m8m-style";
    st.textContent = [
      ".w-m8m{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m8m h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m8m .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m8m .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-m8m .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-m8m .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-m8m input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-m8m .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-m8m button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-m8m button:hover,.w-m8m button[aria-pressed=true]{background:var(--accent-soft)}",
      ".w-m8m .w-scroll{overflow-x:auto;margin:0 0 .8rem}",
      ".w-m8m table{border-collapse:collapse;width:100%;font-size:.86rem}",
      ".w-m8m th,.w-m8m td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:center}",
      ".w-m8m th{font:600 .72rem/1.25 var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--faint);background:var(--ground)}",
      ".w-m8m th[scope=row]{text-align:left}",
      ".w-m8m td.w-gana{background:var(--accent-soft);font-weight:700}",
      ".w-m8m .w-win{display:inline-block;margin-left:.3rem;padding:0 .35rem;border-radius:4px;background:var(--accent);color:var(--surface);font:600 .62rem/1.5 var(--mono);letter-spacing:.05em;text-transform:uppercase}",
      ".w-m8m .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-m8m .w-note p{margin:0 0 .4rem}.w-m8m .w-note p:last-child{margin:0}",
      ".w-m8m .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function build(el) {
    injectStyle();
    var id = "w-m8m-" + (++uid);
    var w = [2, 4, 16], modo = "suma", d = 1;

    el.innerHTML = '<div class="w-m8m">' +
      '<h4>A quién le daría cada regla la mejora</h4>' +
      '<p class="w-hint">Hay una mejora que repartir y solo alcanza para una persona. Cada regla valora la misma mejora de forma distinta según quién la reciba. Mueve el bienestar de cada persona y el tamaño de la mejora.</p>' +
      '<div class="w-grid">' +
      NOMBRES.map(function (n, i) {
        return '<div class="w-f"><label for="' + id + '-w' + i + '">Bienestar de ' + n + ' <b id="' + id + '-wv' + i + '"></b></label>' +
          '<input type="range" id="' + id + '-w' + i + '" min="1" max="20" step="1" value="' + w[i] + '"></div>';
      }).join("") +
      '<div class="w-f"><label for="' + id + '-d">Mejora en puntos <b id="' + id + '-dv"></b></label><input type="range" id="' + id + '-d" min="0.5" max="6" step="0.5" value="' + d + '"></div>' +
      '</div>' +
      '<div class="w-btns" role="group" aria-label="Tipo de mejora"><button type="button" id="' + id + '-m-suma" aria-pressed="true">Sumar puntos a una persona</button>' +
      '<button type="button" id="' + id + '-m-doble" aria-pressed="false">Duplicar el bienestar de una persona (caso del libro)</button></div>' +
      '<div class="w-scroll"><table id="' + id + '-tab"></table></div>' +
      '<div class="w-note" id="' + id + '-note" aria-live="polite"></div>' +
      '<p class="w-cap">La ganancia en la suma es la mejora en puntos. En la suma de logaritmos (base 2) es log2 del bienestar después menos log2 del de antes. En el mínimo es lo que sube el peor situado del grupo. Cifras inventadas, salvo el caso (2, 4, 16) del libro (p. 350).</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function update() {
      var g = calc(w, modo, d), h;
      w.forEach(function (x, i) { $("wv" + i).textContent = String(x); });
      $("dv").textContent = modo === "doble" ? "(duplica)" : fmt(d, 1);
      $("d").disabled = modo === "doble";
      var ms = mejores(g, "suma"), ml = mejores(g, "log"), mm = mejores(g, "min");
      function celda(k, i, dec, set) {
        var gana = set.indexOf(i) >= 0;
        return '<td' + (gana ? ' class="w-gana"' : '') + '>+' + fmt(g[i][k], dec) + (gana ? '<span class="w-win">mayor</span>' : '') + '</td>';
      }
      h = '<thead><tr><th scope="col">Persona</th><th scope="col">Antes → después</th><th scope="col">Ganancia en la suma</th><th scope="col">Ganancia en la suma de log2</th><th scope="col">Ganancia en el mínimo</th></tr></thead><tbody>';
      g.forEach(function (x, i) {
        h += '<tr><th scope="row">' + NOMBRES[i] + '</th><td>' + fmt(w[i], 1) + ' → ' + fmt(x.despues, 1) + '</td>' + celda("suma", i, 2, ms) + celda("log", i, 3, ml) + celda("min", i, 2, mm) + '</tr>';
      });
      $("tab").innerHTML = h + '</tbody>';
      function quien(set) { return set.length === g.length ? "cualquiera (empate)" : set.map(function (i) { return NOMBRES[i]; }).join(" o "); }
      var t = '<p><b>Suma:</b> ' + (ms.length === g.length ? "le da igual a quién: los puntos valen lo mismo para todos." : "prefiere dar la mejora a " + quien(ms) + ", donde el aumento en puntos es mayor.") + '</p>' +
        '<p><b>Suma de logaritmos:</b> ' + (ml.length === g.length ? "la mejora vale lo mismo para todos: duplicar es +1 en base 2, sea quien sea." : "prefiere " + quien(ml) + ": un mismo punto pesa más cuanto menos se tiene.") + '</p>' +
        '<p><b>Mínimo:</b> ' + (mm.length === g.length || g[mm[0]].min <= EPS ? "no hay ganancia para el grupo: la mejora no toca al peor situado, o este no es único, y el mínimo no se mueve." : "solo cuenta si la recibe " + quien(mm) + ", que es quien fija el mínimo; a las demás no les da nada.") + '</p>';
      $("note").innerHTML = t;
      $("m-suma").setAttribute("aria-pressed", modo === "suma" ? "true" : "false");
      $("m-doble").setAttribute("aria-pressed", modo === "doble" ? "true" : "false");
    }

    w.forEach(function (x, i) {
      $("w" + i).addEventListener("input", function () { w[i] = parseFloat($("w" + i).value); update(); });
    });
    $("d").addEventListener("input", function () { d = parseFloat($("d").value); update(); });
    $("m-suma").addEventListener("click", function () { modo = "suma"; update(); });
    $("m-doble").addEventListener("click", function () { modo = "doble"; update(); });
    update();
  }
})();
