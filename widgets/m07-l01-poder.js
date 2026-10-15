/* Simulador "m07-l01-poder": un agente en una rejilla pequena con dos salas de distinto tamano.
   MODELO PROPIO (no es del libro ni del curso; solo ilustra la idea de convergencia instrumental).
   Cada objetivo es un mapa de recompensas: una recompensa aleatoria U(0,1) por casilla, independiente.
   El agente dispone de H pasos, elige la casilla alcanzable que maximiza recompensa - lambda * poder y va hacia ella.
   Poder de una casilla = fraccion de casillas libres alcanzables desde ella en H pasos (una medida de "opciones").
   Un solo tiro (no es aprendizaje por refuerzo) y recompensas independientes: no demuestra nada sobre IA reales.
   Sin dependencias; estilos con las variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, N = 3000, CELL = 40, PAD = 8;

  var MAPS = {
    asim: ["#######....", "..#####....", "....S......", "..#####....", "#######...."],
    sim: ["....#####....", "....#####....", "......S......", "....#####....", "....#####...."]
  };

  function parse(m) {
    var R = m.length, C = m[0].length, cells = [], idx = {}, S = 0, r, c, ch;
    for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
      ch = m[r].charAt(c);
      if (ch !== "#") { idx[r + "," + c] = cells.length; if (ch === "S") S = cells.length; cells.push({ r: r, c: c }); }
    }
    return { R: R, C: C, cells: cells, idx: idx, S: S };
  }
  function bfs(g, src) {
    var n = g.cells.length, d = [], par = [], q = [src], i, u, k, v, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (i = 0; i < n; i++) { d.push(-1); par.push(-1); }
    d[src] = 0;
    while (q.length) {
      u = q.shift();
      for (k = 0; k < 4; k++) {
        v = g.idx[(g.cells[u].r + dirs[k][0]) + "," + (g.cells[u].c + dirs[k][1])];
        if (v !== undefined && d[v] < 0) { d[v] = d[u] + 1; par[v] = u; q.push(v); }
      }
    }
    return { d: d, par: par };
  }
  function rng(a) {
    return function () {
      var t;
      a = (a + 0x6D2B79F5) | 0;
      t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Prepara mapa y horizonte: distancias, casillas alcanzables desde S, poder de cada casilla y lados. */
  function prepare(name, H) {
    var g = parse(MAPS[name]), n = g.cells.length, i, j, D = [], reach = [], opc = [], cnt, sc, left = 0, right = 0;
    for (i = 0; i < n; i++) D.push(bfs(g, i));
    for (i = 0; i < n; i++) if (D[g.S].d[i] >= 0 && D[g.S].d[i] <= H) reach.push(i);
    for (i = 0; i < n; i++) {
      cnt = 0;
      for (j = 0; j < n; j++) if (D[i].d[j] >= 0 && D[i].d[j] <= H) cnt++;
      opc.push(cnt / n);
    }
    sc = g.cells[g.S].c;
    for (i = 0; i < reach.length; i++) { if (g.cells[reach[i]].c < sc) left++; else if (g.cells[reach[i]].c > sc) right++; }
    return { g: g, D: D, reach: reach, opc: opc, left: left, right: right, sc: sc };
  }

  /* Elige la casilla final para un mapa de recompensas R con penalizacion lambda. */
  function choose(P, R, lam) {
    var bi = -1, bv = -9, i, v;
    for (i = 0; i < P.reach.length; i++) {
      v = R[P.reach[i]] - lam * P.opc[P.reach[i]];
      if (v > bv) { bv = v; bi = P.reach[i]; }
    }
    return bi;
  }

  /* N objetivos con la semilla dada: estadisticas con penalizacion lam y sin ella, y frecuencia de destino. */
  function simulate(name, H, lam, seed) {
    var P = prepare(name, H), n = P.g.cells.length, rnd = rng(seed), freq = [], k, i, R, f, f0;
    var a = { right: 0, pw: 0, rew: 0, best: 0 }, b = { right: 0, pw: 0, rew: 0, best: 0 };
    for (i = 0; i < n; i++) freq.push(0);
    for (k = 0; k < N; k++) {
      R = [];
      for (i = 0; i < n; i++) R.push(rnd());
      f = choose(P, R, lam); f0 = choose(P, R, 0);
      freq[f]++;
      if (P.g.cells[f].c > P.sc) a.right++;
      a.pw += P.opc[f]; a.rew += R[f]; if (f === f0) a.best++;
      if (P.g.cells[f0].c > P.sc) b.right++;
      b.pw += P.opc[f0]; b.rew += R[f0]; b.best++;
    }
    [a, b].forEach(function (s) { s.right /= N; s.pw /= N; s.rew /= N; s.best /= N; });
    for (i = 0; i < n; i++) freq[i] /= N;
    return { P: P, a: a, b: b, freq: freq, share: P.reach.length ? P.right / P.reach.length : 0 };
  }

  /* Un solo objetivo: recompensas, casilla elegida, mejor casilla sin penalizar y camino. */
  function sample(name, H, lam, seed) {
    var P = prepare(name, H), rnd = rng(seed * 7919 + 13), R = [], i, f, f0, path = [], u;
    for (i = 0; i < P.g.cells.length; i++) R.push(rnd());
    f = choose(P, R, lam); f0 = choose(P, R, 0);
    u = f;
    while (u >= 0) { path.unshift(u); u = P.D[P.g.S].par[u]; }
    return { P: P, R: R, f: f, f0: f0, path: path };
  }

  function injectStyle() {
    if (document.getElementById("w-pd-style")) return;
    var st = document.createElement("style");
    st.id = "w-pd-style";
    st.textContent = [
      ".w-pd{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pd h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pd .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pd .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-pd .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-pd .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-pd input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-pd select{width:100%;font:500 .9rem var(--sans);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-pd .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-pd button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-pd button:hover{background:var(--accent-soft)}",
      ".w-pd svg{display:block;width:100%;height:auto;margin:0 0 .3rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-pd table.w-tab{width:100%;border-collapse:collapse;margin:.5rem 0 .8rem;font-size:.86rem}",
      ".w-pd .w-tab th,.w-pd .w-tab td{border-bottom:1px solid var(--rule);padding:.4rem .5rem;text-align:right}",
      ".w-pd .w-tab thead th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-pd .w-tab tbody th{text-align:left;font-weight:500;color:var(--ink)}",
      ".w-pd .w-tab td{font:600 .95rem var(--cond);color:var(--accent-ink)}",
      ".w-pd .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-pd .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(x) { return fmt(x * 100, 1) + " %"; }

  window.WIDGETS["m07-l01-poder"] = function (el) {
    injectStyle();
    var id = "w-pd-" + (++uid);
    var MAP = "asim", H = 8, LAM = 0, VIEW = "freq", SEED = 1;

    el.innerHTML = '<div class="w-pd">' +
      '<h4>Un agente que maximiza recompensa: ¿adónde le conviene ir?</h4>' +
      '<p class="w-hint">Cada objetivo es un mapa de recompensas al azar, una por casilla. El agente parte de S, tiene H pasos y va a la casilla que más le compensa. Repetimos 3000 objetivos distintos y contamos cuántos llevan al agente hacia la derecha.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-m">Mapa</label><select id="' + id + '-m"><option value="asim">Asimétrico (una sala grande)</option><option value="sim">Simétrico (dos salas iguales)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-h">Horizonte H <b id="' + id + '-hv"></b></label><input type="range" id="' + id + '-h" min="2" max="12" step="1" value="' + H + '"></div>' +
      '<div class="w-f"><label for="' + id + '-l">Penalización de poder λ <b id="' + id + '-lv"></b></label><input type="range" id="' + id + '-l" min="0" max="1.5" step="0.05" value="' + LAM + '"></div>' +
      '<div class="w-f"><label for="' + id + '-v">Qué se dibuja</label><select id="' + id + '-v"><option value="freq">Destino del agente (%)</option><option value="opc">Poder de cada casilla (%)</option><option value="uno">Un objetivo concreto</option></select></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-b0">Sin penalización</button><button type="button" id="' + id + '-b1">Con penalización 0,4</button><button type="button" id="' + id + '-b2">Otros objetivos</button></div>' +
      '<svg id="' + id + '-svg" role="img" aria-label=""></svg>' +
      '<p class="w-cap" id="' + id + '-cap"></p>' +
      '<table class="w-tab"><thead><tr><th></th><th>Con penalización</th><th>Sin penalización</th></tr></thead><tbody>' +
      '<tr><th>Objetivos que van a la derecha</th><td id="' + id + '-r1"></td><td id="' + id + '-r0"></td></tr>' +
      '<tr><th>Poder medio de la casilla final</th><td id="' + id + '-p1"></td><td id="' + id + '-p0"></td></tr>' +
      '<tr><th>Recompensa media lograda (0 a 100)</th><td id="' + id + '-w1"></td><td id="' + id + '-w0"></td></tr>' +
      '<tr><th>Llega a la mejor casilla</th><td id="' + id + '-b1x"></td><td id="' + id + '-b0x"></td></tr>' +
      '</tbody></table>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo propio, no del libro: un solo tiro, recompensas independientes por casilla y poder medido como fracción de casillas alcanzables desde la casilla final en H pasos. El agente elige la casilla que maximiza recompensa − λ × poder. Ilustra la convergencia instrumental; no demuestra que una IA real vaya a buscar poder.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inM = $("m"), inH = $("h"), inL = $("l"), inV = $("v"), svg = $("svg");
    function cellRect(x, y, fillOp, dashed) {
      return '<rect x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" style="fill:var(--accent);fill-opacity:' + fillOp.toFixed(2) +
        ';stroke:var(--rule-strong);stroke-width:1' + (dashed ? ';stroke-dasharray:3 3' : '') + '"/>';
    }
    function cellText(x, y, t, bold) {
      return '<text x="' + (x + CELL / 2) + '" y="' + (y + CELL / 2 + 4) + '" text-anchor="middle" style="fill:var(--ink);font:' + (bold ? '700 13px' : '11px') + ' var(--mono)">' + t + '</text>';
    }

    function update() {
      var sim = simulate(MAP, H, LAM, SEED), P = sim.P, g = P.g, a = sim.a, b = sim.b;
      var inR = {}, i, r, c, x, y, out = [], k, maxv = 0, smp = null, W = g.C * CELL + 2 * PAD, HH = g.R * CELL + 2 * PAD + 22, v, op, txt;
      for (i = 0; i < P.reach.length; i++) inR[P.reach[i]] = true;
      if (VIEW === "uno") smp = sample(MAP, H, LAM, SEED);
      for (i = 0; i < g.cells.length; i++) {
        v = VIEW === "freq" ? sim.freq[i] : VIEW === "opc" ? P.opc[i] : 1;
        if (inR[i] && v > maxv) maxv = v;
      }
      for (r = 0; r < g.R; r++) for (c = 0; c < g.C; c++) {
        x = PAD + c * CELL; y = PAD + r * CELL; i = g.idx[r + "," + c];
        if (i === undefined) {
          out.push('<rect x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" style="fill:var(--rule-strong);fill-opacity:.55;stroke:var(--rule-strong)"/>');
          continue;
        }
        if (!inR[i]) {
          out.push('<rect x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" style="fill:var(--surface);stroke:var(--rule-strong);stroke-dasharray:3 3"/>');
          continue;
        }
        if (VIEW === "uno") { op = 0.08 + 0.8 * smp.R[i]; txt = String(Math.round(smp.R[i] * 100)); }
        else if (VIEW === "opc") { op = 0.08 + 0.8 * P.opc[i] / maxv; txt = String(Math.round(P.opc[i] * 100)); }
        else { op = 0.08 + 0.8 * sim.freq[i] / (maxv || 1); txt = fmt(sim.freq[i] * 100, 1); }
        out.push(cellRect(x, y, op, false));
        out.push(cellText(x, y, i === g.S ? "S" : txt, i === g.S));
      }
      x = PAD + g.cells[g.S].c * CELL; y = PAD + g.cells[g.S].r * CELL;
      out.push('<rect x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" style="fill:none;stroke:var(--ink);stroke-width:2.5"/>');
      if (smp) {
        var pts = [], q, cc;
        for (k = 0; k < smp.path.length; k++) {
          cc = g.cells[smp.path[k]];
          pts.push((PAD + cc.c * CELL + CELL / 2) + "," + (PAD + cc.r * CELL + CELL / 2));
        }
        out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent-ink);stroke-width:3;stroke-linejoin:round"/>');
        q = g.cells[smp.f];
        out.push('<circle cx="' + (PAD + q.c * CELL + CELL / 2) + '" cy="' + (PAD + q.r * CELL + CELL / 2) + '" r="7" style="fill:var(--accent-ink);stroke:var(--surface);stroke-width:2"/>');
        if (smp.f0 !== smp.f) {
          q = g.cells[smp.f0];
          out.push('<rect x="' + (PAD + q.c * CELL + 3) + '" y="' + (PAD + q.r * CELL + 3) + '" width="' + (CELL - 6) + '" height="' + (CELL - 6) + '" style="fill:none;stroke:var(--trap);stroke-width:2.5;stroke-dasharray:4 3"/>');
        }
      }
      var yl = PAD + g.R * CELL + 17, sc = g.cells[g.S].c;
      out.push('<text x="' + (PAD + sc * CELL / 2) + '" y="' + yl + '" text-anchor="middle" style="fill:var(--faint);font:12px var(--mono)">izquierda: ' + P.left + '</text>');
      out.push('<text x="' + (PAD + (sc + 1) * CELL + (g.C - sc - 1) * CELL / 2) + '" y="' + yl + '" text-anchor="middle" style="fill:var(--faint);font:12px var(--mono)">derecha: ' + P.right + '</text>');
      svg.setAttribute("viewBox", "0 0 " + W + " " + HH);
      svg.innerHTML = out.join("");
      svg.setAttribute("aria-label", "Rejilla con dos salas. Desde la casilla S y con " + H + " pasos hay " + P.reach.length + " casillas alcanzables: " + P.left +
        " a la izquierda y " + P.right + " a la derecha. Con λ = " + fmt(LAM, 2) + " el " + pc(a.right) + " de los objetivos lleva al agente hacia la derecha.");

      $("hv").textContent = H + " pasos";
      $("lv").textContent = fmt(LAM, 2);
      $("r1").textContent = pc(a.right); $("r0").textContent = pc(b.right);
      $("p1").textContent = pc(a.pw); $("p0").textContent = pc(b.pw);
      $("w1").textContent = fmt(a.rew * 100, 1); $("w0").textContent = fmt(b.rew * 100, 1);
      $("b1x").textContent = pc(a.best); $("b0x").textContent = pc(b.best);
      $("cap").textContent = (VIEW === "freq" ? "Cada casilla muestra el % de objetivos cuya casilla final es esa, con la penalización actual. " :
        VIEW === "opc" ? "Cada casilla muestra el % de casillas libres alcanzables desde ella en H pasos (su poder). " :
        "Cada casilla muestra la recompensa de este objetivo (0 a 100). Trazo continuo: camino elegido; recuadro discontinuo: mejor casilla sin penalizar, si es otra. ") +
        "Las casillas de trazo discontinuo quedan fuera de alcance. Alcanzables: " + P.reach.length + " de " + g.cells.length + ".";

      var note = $("note");
      if (Math.abs(P.right - P.left) <= 2) {
        note.textContent = "Con este mapa y este horizonte los dos lados ofrecen casi las mismas casillas (" + P.left + " a la izquierda y " + P.right +
          " a la derecha), así que ninguno atrae más objetivos: " + pc(b.right) + " van a la derecha. No hay sesgo que corregir" +
          (LAM > 0 ? ", y la penalización solo hace perder " + fmt((b.rew - a.rew) * 100, 1) + " puntos de recompensa media." : ".");
      } else {
        note.textContent = "Sin penalizar, " + pc(b.right) + " de los objetivos llevan a la derecha, casi el reparto de casillas alcanzables (" + pc(sim.share) +
          "): cada casilla alcanzable es la mejor con la misma probabilidad, así que el lado con más casillas atrae a más objetivos cuando estos se reparten al azar." +
          (LAM > 0 ? " Con λ = " + fmt(LAM, 2) + " baja a " + pc(a.right) + ", el poder medio al terminar pasa de " + pc(b.pw) + " a " + pc(a.pw) +
            " y se pierden " + fmt((b.rew - a.rew) * 100, 1) + " puntos de recompensa media. Solo en el " + pc(a.best) + " de los objetivos sigue llegando a la mejor casilla." : "");
      }
    }

    inM.addEventListener("change", function () { MAP = inM.value; update(); });
    inV.addEventListener("change", function () { VIEW = inV.value; update(); });
    inH.addEventListener("input", function () { H = +inH.value; update(); });
    inL.addEventListener("input", function () { LAM = +inL.value; update(); });
    $("b0").addEventListener("click", function () { LAM = 0; inL.value = 0; update(); });
    $("b1").addEventListener("click", function () { LAM = 0.4; inL.value = 0.4; update(); });
    $("b2").addEventListener("click", function () { SEED++; update(); });
    update();
  };
  window.WIDGETS["m07-l01-poder"]._model = { simulate: simulate, sample: sample, prepare: prepare };
})();
