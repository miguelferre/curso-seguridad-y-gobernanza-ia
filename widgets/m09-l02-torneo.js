/* Simulador "m09-l02-torneo": torneo de dilema del prisionero iterado entre seis estrategias.
   MODELO PROPIO del curso (el libro describe los torneos de Axelrod y la tabla de estrategias, pero no da pagos ni cifras):
     pagos por ronda, en puntos: tentacion T = 5, recompensa R = 3, castigo P = 1, panolete S = 0 (matriz clasica de la literatura).
     Cada partido dura como maximo N rondas; tras cada ronda continua con probabilidad w. La ronda t se juega con probabilidad w^t.
     Ruido e: cada jugador ejecuta lo contrario de lo que quiere con probabilidad e, y los dos ven las jugadas reales.
   Los puntos son valores ESPERADOS, calculados exactamente con una cadena de Markov sobre los estados de memoria
   de las dos estrategias (no hay azar en la clasificacion). El boton de partido de muestra si sortea una partida.
   Una estrategia con c copias juega un partido contra cada uno de los demas jugadores (no contra si misma).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var PAY = [[3, 0], [5, 1]];   /* PAY[mia][suya]; 0 = coopera, 1 = deserta */
  var GEN = 1 / 3;              /* generosidad de la tit-for-tat generosa (valor habitual con estos pagos) */

  /* Cada estrategia: ns estados de memoria, init, p(s) = probabilidad de querer cooperar, next(s, jugada real del rival). */
  var STR = [
    { k: "cop", n: "Siempre coopera", c: "Coop.", ns: 1, init: 0, p: function () { return 1; }, next: function () { return 0; } },
    { k: "tra", n: "Siempre deserta", c: "Desert.", ns: 1, init: 0, p: function () { return 0; }, next: function () { return 0; } },
    { k: "tft", n: "Tit-for-tat", c: "TFT", ns: 2, init: 0, p: function (s) { return s === 0 ? 1 : 0; }, next: function (s, b) { return b; } },
    { k: "ren", n: "Rencorosa", c: "Renc.", ns: 2, init: 0, p: function (s) { return s === 0 ? 1 : 0; }, next: function (s, b) { return s | b; } },
    { k: "ale", n: "Aleatoria", c: "Aleat.", ns: 1, init: 0, p: function () { return 0.5; }, next: function () { return 0; } },
    { k: "gen", n: "TFT generosa", c: "TFT gen.", ns: 2, init: 0, p: function (s) { return s === 0 ? 1 : GEN; }, next: function (s, b) { return b; } }
  ];
  var DEF = { N: 200, w: 99, e: 0, cnt: [1, 1, 2, 1, 1, 1] };

  function injectStyle() {
    if (document.getElementById("w-to-style")) return;
    var st = document.createElement("style");
    st.id = "w-to-style";
    st.textContent = [
      ".w-to{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-to h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-to .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-to .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-to .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-to .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-to input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-to input[type=number],.w-to select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.35rem .5rem}",
      ".w-to fieldset{border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem .3rem;margin:0 0 .7rem}",
      ".w-to legend{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);padding:0 .3rem}",
      ".w-to .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-to button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-to button:hover{background:var(--accent-soft)}",
      ".w-to button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-to .w-tw{overflow-x:auto;margin:0 0 .8rem}",
      ".w-to table{border-collapse:collapse;width:100%;font-size:.86rem}",
      ".w-to th,.w-to td{border-bottom:1px solid var(--rule);padding:.35rem .5rem;text-align:left;vertical-align:middle}",
      ".w-to th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-to td.w-n{font-family:var(--mono);text-align:right;white-space:nowrap}",
      "@media(max-width:520px){.w-to .w-gr{display:none}.w-to th,.w-to td{padding:.3rem .3rem}}",
      ".w-to .w-bar{height:.7rem;border-radius:4px;background:var(--accent);min-width:2px}",
      ".w-to tr.w-top td{background:var(--accent-soft)}",
      ".w-to details{margin:0 0 .8rem}",
      ".w-to summary{cursor:pointer;font-weight:600}",
      ".w-to .w-row{display:flex;flex-wrap:wrap;gap:2px;margin:.25rem 0}",
      ".w-to .w-sq{display:inline-block;width:1.15rem;height:1.15rem;line-height:1.15rem;text-align:center;font:600 .68rem var(--mono);border-radius:3px}",
      ".w-to .w-sq.c{background:var(--ex-bg);color:var(--ex);border:1px solid var(--ex)}",
      ".w-to .w-sq.d{background:var(--trap-bg);color:var(--trap);border:1px solid var(--trap)}",
      ".w-to .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-to .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d }); }

  /* Puntos esperados de A y B en un partido: suma sobre las rondas t < N de w^t por el pago esperado de la ronda t. */
  function pair(A, B, N, w, e) {
    var na = A.ns, nb = B.ns, d = [], i, j, a, b, t, sa = 0, sb = 0, wt = 1, rounds = 0, nd, ea, eb, q, pa, pb, pr;
    for (i = 0; i < na * nb; i++) d.push(0);
    d[A.init * nb + B.init] = 1;
    for (t = 0; t < N && wt > 1e-12; t++) {
      nd = []; ea = 0; eb = 0;
      for (i = 0; i < na * nb; i++) nd.push(0);
      for (i = 0; i < na; i++) for (j = 0; j < nb; j++) {
        q = d[i * nb + j]; if (!q) continue;
        pa = A.p(i); pa = pa * (1 - e) + (1 - pa) * e;
        pb = B.p(j); pb = pb * (1 - e) + (1 - pb) * e;
        for (a = 0; a < 2; a++) for (b = 0; b < 2; b++) {
          pr = q * (a === 0 ? pa : 1 - pa) * (b === 0 ? pb : 1 - pb);
          if (!pr) continue;
          ea += pr * PAY[a][b]; eb += pr * PAY[b][a];
          nd[A.next(i, b) * nb + B.next(j, a)] += pr;
        }
      }
      sa += wt * ea; sb += wt * eb; rounds += wt; wt *= w; d = nd;
    }
    return { a: sa, b: sb, rounds: rounds };
  }

  /* Torneo: matriz M[s][t] de puntos del partido s contra t y puntuacion media de cada estrategia presente. */
  function tournament(cnt, N, w, e) {
    var M = [], s, t, r, n = 0, rows = [], sum, rounds = 1;
    for (s = 0; s < STR.length; s++) { M.push([]); n += cnt[s]; }
    for (s = 0; s < STR.length; s++) for (t = s; t < STR.length; t++) {
      r = pair(STR[s], STR[t], N, w, e); M[s][t] = r.a; M[t][s] = r.b; rounds = r.rounds;
    }
    if (n < 2) return { M: M, rows: [], n: n, rounds: rounds };
    for (s = 0; s < STR.length; s++) {
      if (!cnt[s]) continue;
      sum = (cnt[s] - 1) * M[s][s];
      for (t = 0; t < STR.length; t++) if (t !== s) sum += cnt[t] * M[s][t];
      rows.push({ s: s, score: sum / (n - 1), perRound: sum / (n - 1) / rounds });
    }
    rows.sort(function (x, y) { return y.score - x.score; });
    return { M: M, rows: rows, n: n, rounds: rounds };
  }

  /* Partido de muestra con azar: devuelve las jugadas reales (0 coopera, 1 deserta) y los puntos. */
  function play(A, B, N, w, e) {
    var sa = A.init, sb = B.init, ra = [], rb = [], pa = 0, pb = 0, t, ia, ib;
    for (t = 0; t < N; t++) {
      ia = Math.random() < A.p(sa) ? 0 : 1; ib = Math.random() < B.p(sb) ? 0 : 1;
      if (Math.random() < e) ia = 1 - ia;
      if (Math.random() < e) ib = 1 - ib;
      ra.push(ia); rb.push(ib); pa += PAY[ia][ib]; pb += PAY[ib][ia];
      sa = A.next(sa, ib); sb = B.next(sb, ia);
      if (t < N - 1 && Math.random() >= w) break;
    }
    return { ra: ra, rb: rb, pa: pa, pb: pb };
  }

  window.WIDGETS["m09-l02-torneo"] = function (el) {
    injectStyle();
    var id = "w-to-" + (++uid);
    var N = DEF.N, W = DEF.w, E = DEF.e, cnt = DEF.cnt.slice(), i, opts = "", cbox = "";

    function slider(key, label, min, max, val) {
      return '<div class="w-f"><label for="' + id + '-' + key + '">' + label + ' <b id="' + id + '-' + key + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + key + '" min="' + min + '" max="' + max + '" step="1" value="' + val + '"></div>';
    }
    for (i = 0; i < STR.length; i++) {
      opts += '<option value="' + i + '">' + STR[i].n + '</option>';
      cbox += '<div class="w-f"><label for="' + id + '-c' + i + '">' + STR[i].n + '</label>' +
        '<input type="number" id="' + id + '-c' + i + '" min="0" max="6" step="1" value="' + cnt[i] + '"></div>';
    }
    el.innerHTML = '<div class="w-to">' +
      '<h4>Torneo de dilema del prisionero iterado</h4>' +
      '<p class="w-hint">Cada jugador juega un partido contra cada uno de los demás. Gana quien tiene más puntos de media por partido. Pagos por ronda (propios, no del libro): 3 si cooperan los dos, 1 si desertan los dos, 5 al que deserta ante quien coopera y 0 al que coopera.</p>' +
      '<div class="w-grid">' + slider("n", "Rondas máximas", 1, 500, N) + slider("w", "Probabilidad de continuar", 0, 100, W) + slider("e", "Ruido", 0, 20, E) + '</div>' +
      '<fieldset><legend>Jugadores de cada estrategia (0 a 6)</legend><div class="w-grid">' + cbox + '</div></fieldset>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-b0">Valores iniciales</button>' +
      '<button type="button" id="' + id + '-b1">Un solo encuentro</button>' +
      '<button type="button" id="' + id + '-b2">Ruido del 10 %</button>' +
      '<button type="button" id="' + id + '-b3">Ejemplo a mano: 10 rondas, 1 TFT y 3 desertores</button></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<div class="w-tw"><table><thead><tr><th>Puesto</th><th>Estrategia</th><th>Jugadores</th><th>Puntos por partido</th><th>Por ronda</th><th class="w-gr">Gráfico</th></tr></thead><tbody id="' + id + '-rank"></tbody></table></div>' +
      '<details><summary>Puntos de cada partido, fila contra columna</summary><div class="w-tw"><table id="' + id + '-mat"></table></div></details>' +
      '<fieldset><legend>Un partido de muestra (con azar)</legend><div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-sa">Jugador A</label><select id="' + id + '-sa">' + opts + '</select></div>' +
      '<div class="w-f"><label for="' + id + '-sb">Jugador B</label><select id="' + id + '-sb">' + opts + '</select></div></div>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Jugar un partido</button></div>' +
      '<div id="' + id + '-match" aria-live="polite"></div></fieldset>' +
      '<p class="w-cap">Los puntos del torneo son valores esperados, calculados exactamente con el ruido y la probabilidad de continuar elegidos, así que no cambian entre pulsaciones. El partido de muestra sí sortea una partida. Se muestran las 60 primeras rondas. C: coopera. D: deserta.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inN = $("n"), inW = $("w"), inE = $("e"), selA = $("sa"), selB = $("sb");
    selA.value = "2"; selB.value = "1";

    function readCounts() {
      var k, v;
      for (k = 0; k < STR.length; k++) {
        v = parseInt($("c" + k).value, 10);
        cnt[k] = isNaN(v) ? 0 : Math.max(0, Math.min(6, v));
      }
    }
    function setAll(n, w, e, c) {
      var k;
      inN.value = n; inW.value = w; inE.value = e;
      for (k = 0; k < STR.length; k++) $("c" + k).value = c[k];
      render();
    }
    function render() {
      var out, k, j, html = "", mx = 0, rk = 0, prev = null, ok = false, rows, txt, dur, m;
      N = +inN.value; W = +inW.value; E = +inE.value; readCounts();
      $("nv").textContent = N; $("wv").textContent = W + " %"; $("ev").textContent = E + " %";
      out = tournament(cnt, N, W / 100, E / 100); rows = out.rows;
      dur = out.rounds;
      for (k = 0; k < rows.length; k++) if (rows[k].score > mx) mx = rows[k].score;
      for (k = 0; k < rows.length; k++) {
        if (prev === null || Math.abs(rows[k].score - prev) > 1e-6) rk = k + 1;
        prev = rows[k].score;
        html += '<tr' + (rk === 1 ? ' class="w-top"' : '') + '><td class="w-n">' + rk + '</td><td>' + STR[rows[k].s].n + '</td><td class="w-n">' + cnt[rows[k].s] +
          '</td><td class="w-n">' + fmt(rows[k].score, 1) + '</td><td class="w-n">' + fmt(rows[k].perRound, 2) +
          '</td><td class="w-gr" style="min-width:6rem"><div class="w-bar" style="width:' + (mx > 0 ? Math.max(2, 100 * rows[k].score / mx) : 2) + '%"></div></td></tr>';
      }
      $("rank").innerHTML = html;
      if (out.n < 2) {
        txt = "Hacen falta al menos dos jugadores para que haya partidos.";
      } else {
        var tops = [];
        for (k = 0; k < rows.length; k++) if (Math.abs(rows[k].score - rows[0].score) < 1e-6) tops.push(STR[rows[k].s].n);
        txt = "Duración esperada de cada partido: " + fmt(dur, 1) + " rondas. " + (tops.length > 1 ? "Empatan arriba: " + tops.join(" y ") + "." : "Arriba: " + tops[0] + ".") +
          " Media de puntos por ronda de la primera: " + fmt(rows[0].perRound, 2) + " (cooperar siempre entre dos daría 3).";
      }
      $("note").textContent = txt;
      ok = out.n >= 2;
      m = '<thead><tr><th></th>';
      for (k = 0; k < STR.length; k++) m += '<th scope="col">' + STR[k].c + '</th>';
      m += '</tr></thead><tbody>';
      for (k = 0; k < STR.length; k++) {
        m += '<tr><th scope="row">' + STR[k].n + '</th>';
        for (j = 0; j < STR.length; j++) m += '<td class="w-n">' + fmt(out.M[k][j], 1) + '</td>';
        m += '</tr>';
      }
      $("mat").innerHTML = m + '</tbody>';
    }

    function squares(r) {
      var s = "", k, n = Math.min(60, r.length);
      for (k = 0; k < n; k++) s += '<span class="w-sq ' + (r[k] === 0 ? "c" : "d") + '">' + (r[k] === 0 ? "C" : "D") + '</span>';
      return s;
    }
    function letters(r) { var s = "", k; for (k = 0; k < Math.min(60, r.length); k++) s += r[k] === 0 ? "C" : "D"; return s; }
    function playOne() {
      var A = STR[+selA.value], B = STR[+selB.value], g = play(A, B, N, W / 100, E / 100);
      $("match").innerHTML = '<p><b>A: ' + A.n + '</b> (' + g.pa + ' puntos)</p><div class="w-row" role="img" aria-label="Jugadas de A: ' + letters(g.ra) + '">' + squares(g.ra) + '</div>' +
        '<p><b>B: ' + B.n + '</b> (' + g.pb + ' puntos)</p><div class="w-row" role="img" aria-label="Jugadas de B: ' + letters(g.rb) + '">' + squares(g.rb) + '</div>' +
        '<p class="w-cap">Rondas jugadas: ' + g.ra.length + (g.ra.length > 60 ? " (se muestran 60)" : "") + '.</p>';
    }

    [inN, inW, inE].forEach(function (x) { x.addEventListener("input", render); });
    for (i = 0; i < STR.length; i++) $("c" + i).addEventListener("input", render);
    $("b0").addEventListener("click", function () { setAll(DEF.N, DEF.w, DEF.e, DEF.cnt); });
    $("b1").addEventListener("click", function () { setAll(DEF.N, 0, 0, DEF.cnt); });
    $("b2").addEventListener("click", function () { setAll(DEF.N, DEF.w, 10, DEF.cnt); });
    $("b3").addEventListener("click", function () { setAll(10, 100, 0, [0, 3, 1, 0, 0, 0]); });
    $("go").addEventListener("click", playOne);
    render();
    playOne();
  };
})();
