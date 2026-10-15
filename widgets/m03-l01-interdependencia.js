/* Simulador "m03-l01-interdependencia": por que promediar deja de servir cuando las piezas se influyen.
   N agentes con opinion 0 o 1, la mitad de cada al empezar. Una generacion:
   - Independientes: cada agente vuelve a sortear su opinion a cara o cruz, sin mirar a nadie.
   - Se imitan: N veces, un agente al azar copia la opinion de otro agente al azar.
   Se repite la simulacion muchas veces y se dibuja la fraccion final de opinion 1.
   Modelo propio del curso (no viene del libro): ilustra la idea de las pp. 243 a 245 (estadistica frente a interdependencia).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, BINS = 20;

  function injectStyle() {
    if (document.getElementById("w-in-style")) return;
    var st = document.createElement("style");
    st.id = "w-in-style";
    st.textContent = [
      ".w-in{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-in h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-in .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-in .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-in .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-in .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-in input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-in select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-in .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-in button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-in button:hover{background:var(--accent-soft)}",
      ".w-in button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-in svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-in dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-in dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-in dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-in dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-in .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-in .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }

  /* Una simulacion: devuelve la trayectoria de la fraccion de unos (T + 1 puntos). */
  function simulate(N, T, mode) {
    var a = new Uint8Array(N), ones = Math.floor(N / 2), i, g, k, j, tr = [];
    for (i = 0; i < ones; i++) a[i] = 1;
    tr.push(ones / N);
    for (g = 0; g < T; g++) {
      if (mode === "ind") {
        ones = 0;
        for (i = 0; i < N; i++) { a[i] = Math.random() < 0.5 ? 1 : 0; ones += a[i]; }
      } else {
        for (k = 0; k < N; k++) {
          i = Math.floor(Math.random() * N); j = Math.floor(Math.random() * N);
          if (a[i] !== a[j]) { ones += a[j] - a[i]; a[i] = a[j]; }
        }
      }
      tr.push(ones / N);
    }
    return tr;
  }

  window.WIDGETS["m03-l01-interdependencia"] = function (el) {
    injectStyle();
    var id = "w-in-" + (++uid);
    var mode = "ind", N = 50, T = 100, finals = [], last = null;

    el.innerHTML = '<div class="w-in">' +
      '<h4>Independientes o interdependientes</h4>' +
      '<p class="w-hint">Un grupo de agentes, cada uno con opinión 0 o 1, empieza mitad y mitad. En cada generación, o bien todos vuelven a sortear su opinión sin mirar a nadie (independientes), o bien cada uno copia a otro al azar (se imitan). Se repite muchas veces y se mira cómo acaba la fracción de opinión 1.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-m">Cómo se comportan</label><select id="' + id + '-m"><option value="ind">Independientes</option><option value="imi">Se imitan</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-n">Agentes N <b id="' + id + '-nv"></b></label><input type="range" id="' + id + '-n" min="10" max="200" step="10" value="' + N + '"></div>' +
      '<div class="w-f"><label for="' + id + '-t">Generaciones T <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="5" max="200" step="5" value="' + T + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-r300">Lanzar 300 simulaciones</button><button type="button" id="' + id + '-r1">Una simulación</button><button type="button" id="' + id + '-cl">Borrar resultados</button></div>' +
      '<svg id="' + id + '-tr" viewBox="0 0 360 130" role="img" aria-label="Fracción de opinión 1 a lo largo de las generaciones, en la última simulación"></svg>' +
      '<p class="w-cap">Arriba: la fracción de opinión 1 en cada generación de la última simulación.</p>' +
      '<svg id="' + id + '-hi" viewBox="0 0 360 150" role="img" aria-label="Histograma de la fracción final de opinión 1 en todas las simulaciones"></svg>' +
      '<p class="w-cap">Abajo: cuántas simulaciones acaban en cada fracción final (de 0 a 1, en tramos de 0,05). La línea discontinua marca la media.</p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Simulaciones</dt><dd id="' + id + '-o-n"></dd></div>' +
      '<div><dt>Media de la fracción final</dt><dd id="' + id + '-o-m"></dd></div>' +
      '<div><dt>Desviación típica</dt><dd id="' + id + '-o-s"></dd></div>' +
      '<div><dt>Acaban entre 0,4 y 0,6</dt><dd id="' + id + '-o-c"></dd></div>' +
      '<div><dt>Acaban en consenso (0 o 1)</dt><dd id="' + id + '-o-x"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function drawTraj() {
      var svg = $("tr"), W = 360, H = 130, i, pts = [], x0 = 30, x1 = W - 8, y0 = 10, y1 = H - 22, out = "";
      out += '<line x1="' + x0 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + y1 + '" style="stroke:var(--rule-strong)"/>';
      out += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y1 + '" style="stroke:var(--rule-strong)"/>';
      out += '<line x1="' + x0 + '" y1="' + ((y0 + y1) / 2) + '" x2="' + x1 + '" y2="' + ((y0 + y1) / 2) + '" style="stroke:var(--rule);stroke-dasharray:3 3"/>';
      out += '<text x="' + (x0 - 4) + '" y="' + (y0 + 3) + '" text-anchor="end" style="fill:var(--faint);font:600 7.5px var(--mono)">1</text>';
      out += '<text x="' + (x0 - 4) + '" y="' + ((y0 + y1) / 2 + 3) + '" text-anchor="end" style="fill:var(--faint);font:600 7.5px var(--mono)">0,5</text>';
      out += '<text x="' + (x0 - 4) + '" y="' + (y1 + 3) + '" text-anchor="end" style="fill:var(--faint);font:600 7.5px var(--mono)">0</text>';
      out += '<text x="' + x1 + '" y="' + (H - 6) + '" text-anchor="end" style="fill:var(--faint);font:600 7.5px var(--mono)">generaciones (0 a ' + T + ')</text>';
      if (last) {
        for (i = 0; i < last.length; i++) pts.push((x0 + (x1 - x0) * i / (last.length - 1)).toFixed(1) + "," + (y1 - (y1 - y0) * last[i]).toFixed(1));
        out += '<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:1.6"/>';
      } else {
        out += '<text x="' + ((x0 + x1) / 2) + '" y="' + ((y0 + y1) / 2 - 8) + '" text-anchor="middle" style="fill:var(--faint);font:600 8px var(--mono)">pulsa "Una simulación"</text>';
      }
      svg.innerHTML = out;
    }

    function stats() {
      var n = finals.length, m = 0, v = 0, mid = 0, ext = 0, i;
      if (!n) return { n: 0 };
      for (i = 0; i < n; i++) { m += finals[i]; if (finals[i] > 0.4 && finals[i] < 0.6) mid++; if (finals[i] === 0 || finals[i] === 1) ext++; }
      m /= n;
      for (i = 0; i < n; i++) v += (finals[i] - m) * (finals[i] - m);
      return { n: n, m: m, s: Math.sqrt(v / n), mid: mid / n, ext: ext / n };
    }

    function drawHist(st) {
      var svg = $("hi"), W = 360, H = 150, x0 = 12, x1 = W - 12, y0 = 14, y1 = H - 26, bw = (x1 - x0) / BINS, bins = [], i, mx = 1, out = "", h, mxp;
      for (i = 0; i < BINS; i++) bins.push(0);
      finals.forEach(function (f) { bins[Math.min(BINS - 1, Math.floor(f * BINS))]++; });
      for (i = 0; i < BINS; i++) if (bins[i] > mx) mx = bins[i];
      out += '<line x1="' + x0 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + y1 + '" style="stroke:var(--rule-strong)"/>';
      for (i = 0; i < BINS; i++) {
        h = (y1 - y0) * bins[i] / mx;
        if (bins[i]) out += '<rect x="' + (x0 + i * bw + 1).toFixed(1) + '" y="' + (y1 - h).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + h.toFixed(1) + '" style="fill:var(--accent);opacity:.75"/>';
      }
      [0, 0.5, 1].forEach(function (t) {
        out += '<text x="' + (x0 + (x1 - x0) * t) + '" y="' + (H - 12) + '" text-anchor="' + (t === 0 ? "start" : t === 1 ? "end" : "middle") + '" style="fill:var(--faint);font:600 7.5px var(--mono)">' + fmt(t, 1) + '</text>';
      });
      out += '<text x="' + ((x0 + x1) / 2) + '" y="' + (H - 2) + '" text-anchor="middle" style="fill:var(--faint);font:600 7.5px var(--mono)">fracción final de opinión 1</text>';
      if (st.n) {
        mxp = x0 + (x1 - x0) * st.m;
        out += '<line x1="' + mxp.toFixed(1) + '" y1="' + (y0 - 4) + '" x2="' + mxp.toFixed(1) + '" y2="' + y1 + '" style="stroke:var(--trap);stroke-width:1.5;stroke-dasharray:4 3"/>';
        out += '<text x="' + Math.min(x1 - 2, mxp + 4).toFixed(1) + '" y="' + (y0 + 4) + '" style="fill:var(--trap);font:600 7.5px var(--mono)" text-anchor="' + (st.m > 0.75 ? "end" : "start") + '">media</text>';
      } else {
        out += '<text x="' + ((x0 + x1) / 2) + '" y="' + ((y0 + y1) / 2) + '" text-anchor="middle" style="fill:var(--faint);font:600 8px var(--mono)">pulsa "Lanzar 300 simulaciones"</text>';
      }
      svg.innerHTML = out;
    }

    function note(st) {
      var t;
      if (!st.n) t = "Empieza con los valores iniciales en \"Independientes\" y lanza 300 simulaciones; después cambia a \"Se imitan\" y repite.";
      else if (mode === "ind") t = "Independientes: la fracción final cae en torno a 0,5 con una desviación de unos " + fmt(0.5 / Math.sqrt(N), 3) + " (es 0,5/√N). Basta saber cuántos son y cómo se comporta uno: los promedios funcionan.";
      else if (st.ext > 0.5) t = "Se imitan: la media sigue cerca de 0,5, pero casi ninguna simulación acaba ahí. El grupo cae en un lado u otro, y la media describe un resultado que casi nunca ocurre.";
      else t = "Se imitan, pero con T = " + T + " todavía no ha dado tiempo a que la mayoría llegue al consenso. Sube T o baja N: el consenso tarda más cuantos más agentes hay.";
      $("note").textContent = t;
    }

    function outputs() {
      var st = stats();
      $("nv").textContent = N; $("tv").textContent = T;
      $("o-n").textContent = fmt(st.n, 0);
      $("o-m").textContent = st.n ? fmt(st.m, 3) : "sin datos";
      $("o-s").textContent = st.n ? fmt(st.s, 3) : "sin datos";
      $("o-c").textContent = st.n ? fmt(100 * st.mid, 1) + " %" : "sin datos";
      $("o-x").textContent = st.n ? fmt(100 * st.ext, 1) + " %" : "sin datos";
      drawTraj(); drawHist(st); note(st);
    }

    function clear() { finals = []; last = null; outputs(); }
    function run(k) {
      var i, tr;
      for (i = 0; i < k; i++) { tr = simulate(N, T, mode); finals.push(tr[tr.length - 1]); last = tr; }
      outputs();
    }

    $("m").addEventListener("change", function () { mode = this.value; clear(); });
    $("n").addEventListener("input", function () { N = +this.value; clear(); });
    $("t").addEventListener("input", function () { T = +this.value; clear(); });
    $("r300").addEventListener("click", function () { run(300); });
    $("r1").addEventListener("click", function () { run(1); });
    $("cl").addEventListener("click", clear);
    outputs();
  };
})();
