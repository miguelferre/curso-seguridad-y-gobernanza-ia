/* Simulador "m03-l01-emergencia": Juego de la vida de Conway en un toro de 40 x 40.
   Regla local (B3/S23): una celda viva sobrevive con 2 o 3 vecinas vivas; una muerta nace con exactamente 3.
   Variante propia: "sin muerte por aglomeracion" (B3/S2-8): sobrevive con 2 a 8 vecinas.
   Nada en la regla habla de moverse, y aun asi el planeador se desplaza: comportamiento del conjunto que no esta
   en ninguna celda. Modelo propio del curso (no viene del libro). Sin dependencias.
   Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, N = 40;

  function injectStyle() {
    if (document.getElementById("w-em-style")) return;
    var st = document.createElement("style");
    st.id = "w-em-style";
    st.textContent = [
      ".w-em{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-em h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-em .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-em .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-em .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-em .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-em input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-em select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-em .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-em button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-em button:hover{background:var(--accent-soft)}",
      ".w-em button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-em canvas{display:block;width:100%;max-width:480px;aspect-ratio:1/1;height:auto;margin:0 auto .5rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground);touch-action:manipulation;cursor:pointer}",
      ".w-em canvas:focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
      ".w-em svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-em dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-em dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-em dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-em dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-em .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-em .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }

  var PRESETS = {
    planeador: { pts: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]], at: [6, 6],
      note: "Cinco celdas. Compara la forma en las generaciones 0, 4, 8 y 12: es la misma, corrida una celda en diagonal cada 4. La regla no dice nada de moverse." },
    parpadeador: { pts: [[0, 0], [1, 0], [2, 0], [8, 0], [9, 0], [8, 1], [9, 1]], at: [10, 12],
      note: "Una fila de tres celdas alterna entre horizontal y vertical (periodo 2). A su lado hay un bloque de 2 x 2 que no cambia nunca." },
    sopa: { pts: null, at: [0, 0],
      note: "Sopa aleatoria: cada celda empieza viva con la densidad elegida. Deja correr 300 generaciones y compara con otras sopas: ninguna acaba igual." },
    vacio: { pts: [], at: [0, 0],
      note: "Tablero vacío. Haz clic en las celdas (o usa las flechas y Intro) para dibujar tu propia configuración." }
  };

  window.WIDGETS["m03-l01-emergencia"] = function (el) {
    injectStyle();
    var id = "w-em-" + (++uid);
    var g = new Uint8Array(N * N), tmp = new Uint8Array(N * N);
    var gen = 0, hist = [], timer = null, born = 0, died = 0, preset = "planeador", rule = "conway", speed = 8, dens = 30;
    var cx = 20, cy = 20, edited = false;

    el.innerHTML = '<div class="w-em">' +
      '<h4>Juego de la vida</h4>' +
      '<p class="w-hint">Cada celda mira solo a sus 8 vecinas. Con la regla de Conway, una celda viva sigue viva con 2 o 3 vecinas vivas y una muerta nace con exactamente 3. El tablero se cierra sobre sí mismo: lo que sale por un borde entra por el opuesto.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-p">Configuración inicial</label><select id="' + id + '-p"><option value="planeador">Planeador</option><option value="parpadeador">Parpadeador y bloque</option><option value="sopa">Sopa aleatoria</option><option value="vacio">Tablero vacío</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-r">Regla</label><select id="' + id + '-r"><option value="conway">Conway (sobrevive con 2 o 3)</option><option value="nomuere">Sin muerte por aglomeración (sobrevive con 2 a 8)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-v">Velocidad <b id="' + id + '-vv"></b></label><input type="range" id="' + id + '-v" min="1" max="30" step="1" value="' + speed + '"></div>' +
      '<div class="w-f"><label for="' + id + '-d">Densidad de la sopa <b id="' + id + '-dv"></b></label><input type="range" id="' + id + '-d" min="5" max="60" step="5" value="' + dens + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Ejecutar</button><button type="button" id="' + id + '-s1">Una generación</button><button type="button" id="' + id + '-s10">10 generaciones</button><button type="button" id="' + id + '-rs">Reiniciar</button></div>' +
      '<canvas id="' + id + '-cv" width="480" height="480" tabindex="0" role="img" aria-label="Tablero de 40 por 40 celdas del Juego de la vida. Usa las flechas para moverte y Intro para cambiar una celda."></canvas>' +
      '<p class="w-cap">Celdas coloreadas: vivas. Haz clic para cambiar una celda, también mientras corre. Con el teclado: enfoca el tablero, flechas para moverte e Intro para cambiar la celda marcada.</p>' +
      '<svg id="' + id + '-sp" viewBox="0 0 360 80" role="img" aria-label="Celdas vivas a lo largo de las generaciones"></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Generación</dt><dd id="' + id + '-o-g"></dd></div>' +
      '<div><dt>Celdas vivas</dt><dd id="' + id + '-o-a"></dd></div>' +
      '<div><dt>Nacen / mueren</dt><dd id="' + id + '-o-c"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var cv = $("cv"), sp = $("sp"), goBtn = $("go");

    function count() { var i, n = 0; for (i = 0; i < g.length; i++) n += g[i]; return n; }

    function load() {
      var P = PRESETS[preset], i, k;
      g.fill(0); gen = 0; born = 0; died = 0; edited = false;
      if (preset === "sopa") { for (i = 0; i < g.length; i++) g[i] = Math.random() < dens / 100 ? 1 : 0; }
      else if (preset === "parpadeador") {
        [[0, 0], [1, 0], [2, 0]].forEach(function (p) { g[((p[1] + 8) % N) * N + (p[0] + 8) % N] = 1; });
        [[6, 0], [7, 0], [6, 1], [7, 1]].forEach(function (p) { g[((p[1] + 20) % N) * N + (p[0] + 20) % N] = 1; });
      } else {
        for (k = 0; k < P.pts.length; k++) g[((P.pts[k][1] + P.at[1]) % N) * N + (P.pts[k][0] + P.at[0]) % N] = 1;
      }
      hist = [count()];
      $("note").textContent = P.note;
    }

    function step() {
      var x, y, dx, dy, n, i, alive, nx, ny, b = 0, d = 0;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
        n = 0;
        for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) {
          if (dx || dy) { nx = (x + dx + N) % N; ny = (y + dy + N) % N; n += g[ny * N + nx]; }
        }
        i = y * N + x; alive = g[i];
        if (alive) tmp[i] = (n === 2 || n === 3 || (rule === "nomuere" && n >= 2)) ? 1 : 0;
        else tmp[i] = n === 3 ? 1 : 0;
        if (alive && !tmp[i]) d++;
        if (!alive && tmp[i]) b++;
      }
      g.set(tmp); gen++; born = b; died = d;
      hist.push(count());
      if (hist.length > 400) hist.shift();
    }

    function spark() {
      var W = 360, H = 80, m = Math.max.apply(null, hist), top = Math.max(m, 10), n = hist.length, span = Math.max(n - 1, 100), pts = [], i;
      for (i = 0; i < n; i++) pts.push((4 + (W - 8) * i / span).toFixed(1) + "," + (H - 6 - (H - 26) * hist[i] / top).toFixed(1));
      sp.innerHTML = '<line x1="4" y1="' + (H - 6) + '" x2="' + (W - 4) + '" y2="' + (H - 6) + '" style="stroke:var(--rule-strong)"/>' +
        '<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:1.6"/>' +
        '<text x="6" y="12" style="fill:var(--faint);font:600 7px var(--mono)">celdas vivas (máx. ' + top + ')</text>' +
        '<text x="' + (W - 6) + '" y="' + (H - 9) + '" text-anchor="end" style="fill:var(--faint);font:600 7px var(--mono)">generaciones</text>';
    }

    function draw() {
      var S = cv.clientWidth || 480, dpr = window.devicePixelRatio || 1, ctx = cv.getContext("2d"), cs = getComputedStyle(el), cell = S / N, x, y;
      var live = (cs.getPropertyValue("--accent") || "#614BC1").trim(), grid = (cs.getPropertyValue("--rule") || "#DDD").trim(), ink = (cs.getPropertyValue("--ink") || "#1C1A26").trim();
      cv.width = Math.round(S * dpr); cv.height = Math.round(S * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, S, S);
      ctx.fillStyle = live;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (g[y * N + x]) ctx.fillRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
      ctx.strokeStyle = grid; ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (x = 0; x <= N; x += 5) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, S); ctx.moveTo(0, x * cell); ctx.lineTo(S, x * cell); }
      ctx.stroke();
      if (document.activeElement === cv) { ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2); }
    }

    function outputs() {
      var a = count();
      $("o-g").textContent = fmt(gen, 0);
      $("o-a").textContent = fmt(a, 0) + " (" + fmt(100 * a / (N * N), 1) + " %)";
      $("o-c").textContent = fmt(born, 0) + " / " + fmt(died, 0);
      $("vv").textContent = speed + " gen/s";
      $("dv").textContent = dens + " %";
      spark(); draw();
    }

    function stop() { if (timer) { clearInterval(timer); timer = null; } goBtn.textContent = "Ejecutar"; }
    function start() {
      stop(); goBtn.textContent = "Pausar";
      timer = setInterval(function () {
        if (!el.isConnected) { stop(); return; }
        step(); outputs();
      }, Math.round(1000 / speed));
    }
    function toggle(x, y) { var i = y * N + x; g[i] = g[i] ? 0 : 1; edited = true; hist[hist.length - 1] = count(); $("note").textContent = "Dibujo propio: has cambiado celdas a mano. Ejecuta y observa qué hace la regla con ellas."; outputs(); }

    goBtn.addEventListener("click", function () { if (timer) stop(); else start(); });
    $("s1").addEventListener("click", function () { stop(); step(); outputs(); });
    $("s10").addEventListener("click", function () { var i; stop(); for (i = 0; i < 10; i++) step(); outputs(); });
    $("rs").addEventListener("click", function () { stop(); load(); outputs(); });
    $("p").addEventListener("change", function () { preset = this.value; stop(); load(); outputs(); });
    $("r").addEventListener("change", function () { rule = this.value; stop(); load(); outputs(); });
    $("v").addEventListener("input", function () { speed = +this.value; if (timer) start(); else outputs(); });
    $("d").addEventListener("input", function () { dens = +this.value; $("dv").textContent = dens + " %"; });
    $("d").addEventListener("change", function () { if (preset === "sopa") { stop(); load(); outputs(); } });
    cv.addEventListener("pointerdown", function (e) {
      var r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * N), y = Math.floor((e.clientY - r.top) / r.height * N);
      x = Math.min(N - 1, Math.max(0, x)); y = Math.min(N - 1, Math.max(0, y)); cx = x; cy = y; toggle(x, y);
    });
    cv.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowLeft") cx = (cx + N - 1) % N;
      else if (k === "ArrowRight") cx = (cx + 1) % N;
      else if (k === "ArrowUp") cy = (cy + N - 1) % N;
      else if (k === "ArrowDown") cy = (cy + 1) % N;
      else if (k === "Enter" || k === " ") { e.preventDefault(); toggle(cx, cy); return; }
      else return;
      e.preventDefault(); draw();
    });
    cv.addEventListener("focus", draw);
    cv.addEventListener("blur", draw);
    window.addEventListener("resize", function () { if (el.isConnected) draw(); });

    load(); outputs();
  };
})();
