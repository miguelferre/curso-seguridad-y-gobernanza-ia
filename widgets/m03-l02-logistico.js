/* Simulador "m03-l02-logistico": mapa logistico x(n+1) = r x(n) (1 - x(n)), la ecuacion que el libro usa
   para ilustrar la sensibilidad a las condiciones iniciales (pag. 252). Dos trayectorias que empiezan casi igual.
   La lectura (generacion en que se separan, separacion maxima) es propia y se calcula ejecutando el mapa.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var G = 50;          // generaciones
  var UMBRAL = 0.1;    // separacion que consideramos "ya son distintas"

  function trayectoria(r, x0, n) {
    var a = [x0], i;
    for (i = 0; i < n; i++) a.push(r * a[i] * (1 - a[i]));
    return a;
  }

  function comparar(r, x0, d) {
    var a = trayectoria(r, x0, G), b = trayectoria(r, x0 + d, G), i, dif, primera = -1, max = 0;
    for (i = 0; i <= G; i++) {
      dif = Math.abs(a[i] - b[i]);
      if (dif > max) max = dif;
      if (primera < 0 && dif > UMBRAL) primera = i;
    }
    return { a: a, b: b, primera: primera, max: max, final: Math.abs(a[G] - b[G]) };
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function injectStyle() {
    if (document.getElementById("w-lg-style")) return;
    var st = document.createElement("style");
    st.id = "w-lg-style";
    st.textContent = [
      ".w-lg{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-lg h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-lg .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-lg .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-lg .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-lg .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-lg input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-lg select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-lg svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-lg dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-lg dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-lg dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-lg dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-lg .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-lg .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m03-l02-logistico"] = function (el) {
    injectStyle();
    var id = "w-lg-" + (++uid);
    var R = 320, X0 = 40, D = 0.001;

    el.innerHTML = '<div class="w-lg">' +
      '<h4>Dos trayectorias casi iguales</h4>' +
      '<p class="w-hint">Población de una especie como fracción del máximo, generación a generación. La trayectoria A empieza en x0 y la B un poco más arriba (línea discontinua).</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-r">Tasa de crecimiento r <b id="' + id + '-rv"></b></label><input type="range" id="' + id + '-r" min="250" max="400" step="1" value="' + R + '"></div>' +
      '<div class="w-f"><label for="' + id + '-x">Población inicial x0 <b id="' + id + '-xv"></b></label><input type="range" id="' + id + '-x" min="5" max="95" step="1" value="' + X0 + '"></div>' +
      '<div class="w-f"><label for="' + id + '-d">Diferencia inicial</label><select id="' + id + '-d"><option value="0.000001">0,000001</option><option value="0.0001">0,0001</option><option value="0.001" selected>0,001</option><option value="0.01">0,01</option></select></div>' +
      '</div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 260" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Separación máxima</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Primera generación con separación &gt; 0,1</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Separación en la generación 50</dt><dd id="' + id + '-o3"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Fórmula: x(n+1) = r x(n) (1 - x(n)). El libro sitúa la entrada en el régimen caótico en torno a r = 3,57. Es un modelo de juguete de una población, no un modelo clínico.</p>' +
      '</div>';

    function $(k) { return el.querySelector("#" + id + "-" + k); }
    var inR = $("r"), inX = $("x"), inD = $("d"), svg = $("svg");
    function px(n) { return 40 + n * 11; }
    function py(v) { return 230 - v * 210; }

    function draw(c) {
      var out = [], i, A = [], B = [], f;
      for (i = 0; i <= 4; i++) {
        f = i / 4;
        out.push('<line x1="40" y1="' + py(f) + '" x2="590" y2="' + py(f) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="34" y="' + (py(f) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:11px">' + fmt(f, 2) + '</text>');
      }
      for (i = 0; i <= G; i += 10) out.push('<text x="' + px(i) + '" y="248" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + i + '</text>');
      out.push('<text x="315" y="259" text-anchor="middle" style="fill:var(--muted);font-size:11px">generación</text>');
      for (i = 0; i <= G; i++) { A.push(px(i) + "," + py(c.a[i]).toFixed(1)); B.push(px(i) + "," + py(c.b[i]).toFixed(1)); }
      out.push('<polyline points="' + A.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      out.push('<polyline points="' + B.join(" ") + '" style="fill:none;stroke:var(--trap);stroke-width:2;stroke-dasharray:6 4"/>');
      svg.innerHTML = out.join("");
    }

    function update() {
      var r = R / 100, x0 = X0 / 100, c = comparar(r, x0, D), note;
      $("rv").textContent = fmt(r, 2);
      $("xv").textContent = fmt(x0, 2);
      $("o1").textContent = fmt(c.max, 4);
      $("o2").textContent = c.primera < 0 ? "nunca en 50" : String(c.primera);
      $("o3").textContent = fmt(c.final, 4);
      if (c.primera < 0) {
        note = "Las dos trayectorias no se separan: el error inicial de " + fmt(D, 6) + " no crece. Con esta r el sistema se comporta de forma predecible y la memoria de las condiciones iniciales se apaga.";
      } else {
        note = "Un error inicial de " + fmt(D, 6) + " llega a " + fmt(c.max, 2) + " y se supera 0,1 en la generación " + c.primera + ". Aunque midas la población con muchas cifras, la predicción a largo plazo pierde valor.";
      }
      $("note").textContent = note;
      svg.setAttribute("aria-label", "Dos trayectorias del mapa logístico con r = " + fmt(r, 2) + " y x0 = " + fmt(x0, 2) + ". Separación máxima " + fmt(c.max, 3) + ".");
      draw(c);
    }

    inR.addEventListener("input", function () { R = parseInt(inR.value, 10); update(); });
    inX.addEventListener("input", function () { X0 = parseInt(inX.value, 10); update(); });
    inD.addEventListener("change", function () { D = parseFloat(inD.value); update(); });
    update();
  };
  window.WIDGETS["m03-l02-logistico"]._nucleo = { trayectoria: trayectoria, comparar: comparar };
})();
