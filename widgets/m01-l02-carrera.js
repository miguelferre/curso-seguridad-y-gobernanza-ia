/* Simulador "m01-l02-carrera": dos actores deciden cuanto invertir en seguridad frente a velocidad.
   MODELO PROPIO del curso (no viene del libro): cada actor elige su seguridad s (0 a 1).
     velocidad     v_i = 1 - 0,9 s_i
     gana la carrera  p_i = v_i^g / (v_i^g + v_j^g)
     accidente     r_i = rho (1 - s_i)^2 ;  q = 1 - (1 - r_A)(1 - r_B)
     pago          U_i = (1 - q) p_i W - q D - c s_i     con D = 100 (para los dos) y c = 5
   Acuerdo verificable: si s_i < suelo, sancion esperada d x F (d = probabilidad de detectar).
   El equilibrio se busca en una rejilla de 101 valores de s, con mejores respuestas.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, D = 100, KV = 0.9, CS = 5, N = 100;

  function injectStyle() {
    if (document.getElementById("w-ca-style")) return;
    var st = document.createElement("style");
    st.id = "w-ca-style";
    st.textContent = [
      ".w-ca{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-ca h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-ca .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-ca .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-ca .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-ca .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-ca input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-ca input[type=range]:disabled{opacity:.5}",
      ".w-ca fieldset{border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem .3rem;margin:0 0 .7rem}",
      ".w-ca legend{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);padding:0 .3rem}",
      ".w-ca .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .6rem;color:var(--ink)}",
      ".w-ca .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-ca .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-ca button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-ca button:hover{background:var(--accent-soft)}",
      ".w-ca button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-ca .w-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:0 0 .5rem}",
      ".w-ca svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-ca .w-leg{display:flex;flex-wrap:wrap;gap:.3rem .9rem;color:var(--muted);font-size:.78rem;margin:0 0 .8rem}",
      ".w-ca .w-leg i{display:inline-block;width:.9rem;height:.25rem;border-radius:2px;vertical-align:middle;margin-right:.3rem}",
      ".w-ca dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-ca dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-ca dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-ca dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-ca .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-ca .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d }); }
  function pc(x, d) { return fmt(x * 100, d === undefined ? 0 : d) + " %"; }

  /* Modelo: P = {W, rho, g, agree, floor, d, F}. u0 sin acuerdo, u con sancion. */
  function mk(P) {
    function q(a, b) {
      var ra = P.rho * (1 - a) * (1 - a), rb = P.rho * (1 - b) * (1 - b);
      return 1 - (1 - ra) * (1 - rb);
    }
    function pw(a, b) {
      var va = Math.pow(1 - KV * a, P.g), vb = Math.pow(1 - KV * b, P.g);
      return va / (va + vb);
    }
    function u0(a, b) { var Q = q(a, b); return (1 - Q) * pw(a, b) * P.W - Q * D - CS * a; }
    function u(a, b) { return u0(a, b) - ((P.agree && a < P.floor - 1e-9) ? P.d * P.F : 0); }
    return { q: q, pw: pw, u0: u0, u: u };
  }
  /* Mejor respuesta (indice de rejilla) a cada valor del rival; el juego es simetrico. */
  function brTable(m) {
    var t = [], i, j, b, best, bi, v;
    for (j = 0; j <= N; j++) {
      b = j / N; best = -1e18; bi = 0;
      for (i = 0; i <= N; i++) {
        v = m.u(i / N, b);
        if (v > best + 1e-12) { best = v; bi = i; }
      }
      t.push(bi);
    }
    return t;
  }
  /* Equilibrios simetricos: puntos i donde nadie gana desviandose solo (arrepentimiento <= EPS puntos).
     Se agrupan los puntos contiguos de la rejilla y se queda el de menor arrepentimiento. Comprobar el arrepentimiento
     (y no solo el cruce de la mejor respuesta con la diagonal) evita dar por equilibrio un salto de la mejor respuesta,
     que aparece cuando el acuerdo mete un escalon en el pago. */
  var EPS = 0.05;
  function equilibria(m, t) {
    var out = [], i, r, run = null, best = null, bestR = 1e18;
    function close() { if (run !== null) { out.push(best); run = null; best = null; bestR = 1e18; } }
    for (i = 0; i <= N; i++) {
      r = m.u(t[i] / N, i / N) - m.u(i / N, i / N);
      if (r <= EPS) { run = 1; if (r < bestR - 1e-12) { bestR = r; best = i; } } else close();
    }
    close();
    return out;
  }
  function jointOptimum(m) {
    var i, v, best = -1e18, bi = 0;
    for (i = 0; i <= N; i++) { v = m.u0(i / N, i / N); if (v > best) { best = v; bi = i; } }
    return bi;
  }
  /* Ganancia maxima de incumplir el suelo (G) y de subir por encima (Gup), sin sancion. */
  function deviation(P) {
    var m = mk({ W: P.W, rho: P.rho, g: P.g, agree: false }), i, s, v, G = 0, Gup = 0, base = m.u0(P.floor, P.floor);
    for (i = 0; i <= N; i++) {
      s = i / N; v = m.u0(s, P.floor) - base;
      if (s < P.floor - 1e-9) { if (v > G) G = v; } else if (v > Gup) Gup = v;
    }
    return { G: G, Gup: Gup };
  }

  window.WIDGETS["m01-l02-carrera"] = function (el) {
    injectStyle();
    var id = "w-ca-" + (++uid);
    var W = 100, R = 50, G = 2, agree = false, FL = 80, DD = 60, FF = 60, sA = 90, sB = 90, rivalBR = false, path = [];

    function slider(key, label, min, max, step, val) {
      return '<div class="w-f"><label for="' + id + '-' + key + '">' + label + ' <b id="' + id + '-' + key + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
    }
    el.innerHTML = '<div class="w-ca">' +
      '<h4>La carrera: seguridad frente a velocidad</h4>' +
      '<p class="w-hint">Dos actores, A y B, reparten su esfuerzo entre correr y ser seguros. Sin accidente, quien llega antes se lleva el premio; con accidente, los dos pierden 100. Modelo propio del curso, no del libro.</p>' +
      '<div class="w-grid">' +
      slider("w", "Premio de ganar", 20, 200, 5, W) +
      slider("r", "Peligro sin seguridad", 10, 100, 5, R) +
      slider("g", "Cuánto decide la velocidad", 1, 4, 0.5, G) +
      '</div>' +
      '<fieldset><legend>Tu jugada</legend><div class="w-grid">' +
      slider("sa", "Seguridad de A", 0, 100, 1, sA) +
      slider("sb", "Seguridad de B", 0, 100, 1, sB) +
      '</div><label class="w-chk"><input type="checkbox" id="' + id + '-riv"><span>El rival B responde siempre con su mejor respuesta</span></label></fieldset>' +
      '<div class="w-btns"><button type="button" id="' + id + '-bra">Mejor respuesta de A</button><button type="button" id="' + id + '-brb">Mejor respuesta de B</button>' +
      '<button type="button" class="w-main" id="' + id + '-eq">Ir al equilibrio</button><button type="button" id="' + id + '-rs">Volver a 90 % y 90 %</button></div>' +
      '<fieldset><legend>Acuerdo verificable</legend>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-ag"><span>Activar un acuerdo con suelo de seguridad y sanción a quien lo incumpla</span></label>' +
      '<div class="w-grid">' +
      slider("fl", "Suelo de seguridad", 0, 100, 5, FL) +
      slider("dd", "Probabilidad de detectar", 0, 100, 5, DD) +
      slider("ff", "Sanción si lo detectan", 0, 200, 10, FF) +
      '</div></fieldset>' +
      '<div class="w-charts"><svg id="' + id + '-p1" viewBox="0 0 320 320" role="img" aria-label=""></svg><svg id="' + id + '-p2" viewBox="0 0 320 320" role="img" aria-label=""></svg></div>' +
      '<p class="w-leg"><span><i style="background:var(--accent)"></i>Mejor respuesta de A</span><span><i style="background:var(--trap)"></i>Mejor respuesta de B (discontinua)</span>' +
      '<span>Círculo verde: equilibrio</span><span>Rombo: óptimo conjunto</span><span>Punto negro: tu jugada</span></p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Equilibrio: seguridad de cada uno</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Accidente en el equilibrio</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Pago de cada uno en el equilibrio</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Óptimo conjunto (seguridad igual)</dt><dd id="' + id + '-o4"></dd></div>' +
      '<div><dt>Pago y accidente en el óptimo</dt><dd id="' + id + '-o5"></dd></div>' +
      '<div><dt>Precio de la carrera por actor</dt><dd id="' + id + '-o6"></dd></div>' +
      '<div><dt>Tu jugada: pagos de A y de B</dt><dd id="' + id + '-o7"></dd></div>' +
      '<div><dt>Tu jugada: accidente y gana A</dt><dd id="' + id + '-o8"></dd></div>' +
      '<div><dt>Tentación de A y de B</dt><dd id="' + id + '-o9"></dd></div>' +
      '<div><dt>Ganancia de incumplir el suelo</dt><dd id="' + id + '-o10"></dd></div>' +
      '<div><dt>Sanción esperada d × F</dt><dd id="' + id + '-o11"></dd></div>' +
      '<div><dt>Estado del acuerdo</dt><dd id="' + id + '-o12"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Pagos en puntos: un accidente cuesta 100 a cada actor y la seguridad cuesta 5 por unidad de s. El equilibrio se busca en una rejilla de 1 punto porcentual con mejores respuestas; el juego es simétrico, así que se buscan equilibrios y óptimo entre los valores de s que eligen los dos por igual.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inW = $("w"), inR = $("r"), inG = $("g"), inA = $("sa"), inB = $("sb"), inRv = $("riv"), inAg = $("ag"),
      inFl = $("fl"), inDd = $("dd"), inFf = $("ff"), svg1 = $("p1"), svg2 = $("p2"), lastT = [];

    function params() { return { W: W, rho: R / 100, g: G, agree: agree, floor: FL / 100, d: DD / 100, F: FF }; }
    function set(k, v) { $(k).textContent = v; }
    function labels() {
      set("wv", W); set("rv", R + " %"); set("gv", fmt(G, 1)); set("sav", sA + " %"); set("sbv", sB + " %");
      set("flv", FL + " %"); set("ddv", DD + " %"); set("ffv", FF);
    }

    function X(v) { return 40 + 260 * v; }
    function Y(v) { return 280 - 260 * v; }
    function frame(out, xt, yt) {
      var k, tv = [0, 0.5, 1];
      out.push('<rect x="40" y="20" width="260" height="260" style="fill:none;stroke:var(--rule-strong);stroke-width:1"/>');
      for (k = 0; k < 3; k++) {
        out.push('<text x="' + X(tv[k]) + '" y="296" text-anchor="middle" style="fill:var(--muted);font-size:10px">' + (tv[k] * 100) + '</text>');
      }
      out.push('<text x="170" y="313" text-anchor="middle" style="fill:var(--muted);font-size:10.5px">' + xt + '</text>');
      if (yt) {
        for (k = 0; k < 3; k++) out.push('<text x="35" y="' + (Y(tv[k]) + 3) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + (tv[k] * 100) + '</text>');
        out.push('<text x="10" y="150" text-anchor="middle" transform="rotate(-90 10 150)" style="fill:var(--muted);font-size:10.5px">' + yt + '</text>');
      }
    }

    function drawPlane(m, t, eq, jo, a, b) {
      var out = [], k, pts, pth = [];
      frame(out, "Seguridad de A (%)", "Seguridad de B (%)");
      out.push('<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(1) + '" y2="' + Y(1) + '" style="stroke:var(--rule-strong);stroke-width:1;stroke-dasharray:2 4"/>');
      if (agree) {
        out.push('<line x1="' + X(FL / 100) + '" y1="20" x2="' + X(FL / 100) + '" y2="280" style="stroke:var(--ex);stroke-width:1.2;stroke-dasharray:6 3"/>');
        out.push('<line x1="40" y1="' + Y(FL / 100) + '" x2="300" y2="' + Y(FL / 100) + '" style="stroke:var(--ex);stroke-width:1.2;stroke-dasharray:6 3"/>');
        out.push('<text x="' + (X(FL / 100) + 3) + '" y="274" style="fill:var(--ex);font-size:10px">suelo</text>');
      }
      pts = []; for (k = 0; k <= N; k++) pts.push(X(t[k] / N).toFixed(1) + "," + Y(k / N).toFixed(1));
      out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2"/>');
      pts = []; for (k = 0; k <= N; k++) pts.push(X(k / N).toFixed(1) + "," + Y(t[k] / N).toFixed(1));
      out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--trap);stroke-width:2;stroke-dasharray:6 3"/>');
      if (path.length > 1) {
        path.forEach(function (q) { pth.push(X(q.a / 100).toFixed(1) + "," + Y(q.b / 100).toFixed(1)); });
        out.push('<polyline points="' + pth.join(" ") + '" style="fill:none;stroke:var(--ink);stroke-width:1.2;opacity:.75"/>');
      }
      out.push('<polygon points="' + X(jo / N) + ',' + (Y(jo / N) - 7) + ' ' + (X(jo / N) + 7) + ',' + Y(jo / N) + ' ' + X(jo / N) + ',' + (Y(jo / N) + 7) + ' ' + (X(jo / N) - 7) + ',' + Y(jo / N) +
        '" style="fill:var(--accent-ink);stroke:var(--surface);stroke-width:1"/>');
      out.push('<text x="' + (X(jo / N) - 10) + '" y="' + (Y(jo / N) + 4) + '" text-anchor="end" style="fill:var(--accent-ink);font-size:10px">óptimo</text>');
      eq.forEach(function (i) {
        out.push('<circle cx="' + X(i / N) + '" cy="' + Y(i / N) + '" r="5.5" style="fill:var(--ex);stroke:var(--surface);stroke-width:1.5"/>');
        out.push('<text x="' + (X(i / N) + 9) + '" y="' + (Y(i / N) + 17) + '" style="fill:var(--ex);font-size:10.5px;font-weight:700">Nash ' + i + ' %</text>');
      });
      out.push('<circle cx="' + X(a) + '" cy="' + Y(b) + '" r="6" style="fill:var(--ink);stroke:var(--ground);stroke-width:2"/>');
      svg1.innerHTML = out.join("");
      svg1.setAttribute("aria-label", "Plano de seguridad de A frente a seguridad de B con las curvas de mejor respuesta. Equilibrio en " +
        eq.join(" y ") + " %, óptimo conjunto en " + jo + " %, tu jugada en " + sA + " % y " + sB + " %.");
    }

    function drawPayoff(m, t, a, b) {
      var out = [], vals = [], i, mn = 1e9, mx = -1e9, v, pts = [], span, bra = t[Math.round(b * 100)], ub;
      for (i = 0; i <= N; i++) { v = m.u(i / N, b); vals.push(v); if (v < mn) mn = v; if (v > mx) mx = v; }
      span = (mx - mn) || 1; mn -= span * 0.08; mx += span * 0.08; span = mx - mn;
      function YV(x) { return 280 - 260 * (x - mn) / span; }
      frame(out, "Seguridad de A (%)", "");
      out.push('<text x="40" y="13" style="fill:var(--ink);font-size:11px;font-weight:600">Pago de A si B se queda en ' + Math.round(b * 100) + ' %</text>');
      out.push('<text x="35" y="' + (YV(mx - span * 0.04) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + fmt(mx - span * 0.04, 0) + '</text>');
      out.push('<text x="35" y="' + (YV(mn + span * 0.04) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + fmt(mn + span * 0.04, 0) + '</text>');
      if (mn < 0 && mx > 0) {
        out.push('<line x1="40" y1="' + YV(0) + '" x2="300" y2="' + YV(0) + '" style="stroke:var(--rule-strong);stroke-width:1;stroke-dasharray:3 3"/>');
        out.push('<text x="35" y="' + (YV(0) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">0</text>');
      }
      if (agree) out.push('<line x1="' + X(FL / 100) + '" y1="20" x2="' + X(FL / 100) + '" y2="280" style="stroke:var(--ex);stroke-width:1.2;stroke-dasharray:6 3"/>');
      for (i = 0; i <= N; i++) pts.push(X(i / N).toFixed(1) + "," + YV(vals[i]).toFixed(1));
      out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2"/>');
      ub = m.u(bra / N, b);
      out.push('<circle cx="' + X(bra / N) + '" cy="' + YV(ub) + '" r="5.5" style="fill:var(--ex);stroke:var(--surface);stroke-width:1.5"/>');
      out.push('<text x="' + X(bra / N) + '" y="' + (YV(ub) - 9) + '" text-anchor="middle" style="fill:var(--ex);font-size:10.5px;font-weight:700">mejor: ' + bra + ' %</text>');
      out.push('<circle cx="' + X(a) + '" cy="' + YV(m.u(a, b)) + '" r="6" style="fill:var(--ink);stroke:var(--ground);stroke-width:2"/>');
      svg2.innerHTML = out.join("");
      svg2.setAttribute("aria-label", "Pago de A según su seguridad cuando B está en " + Math.round(b * 100) + " %. Su mejor respuesta es " + bra +
        " % con pago " + fmt(ub, 1) + "; ahora está en " + sA + " % con pago " + fmt(m.u(a, b), 1) + ".");
    }

    function join(arr, f) { return arr.map(f).join(" o "); }

    function refresh() {
      var p = params(), m = mk(p), t = brTable(m), eq = equilibria(m, t), jo = jointOptimum(m), a, b, dev, base, eq0, e0, ej, note, i;
      lastT = t;
      if (rivalBR) { sB = t[sA]; inB.value = String(sB); }
      labels();
      a = sA / 100; b = sB / 100;
      e0 = eq.length ? eq[0] / 100 : 0; ej = jo / 100;
      set("o1", eq.length ? join(eq, function (i) { return i + " %"; }) : "ninguno simétrico");
      set("o2", eq.length ? join(eq, function (i) { return pc(m.q(i / N, i / N), 1); }) : "-");
      set("o3", eq.length ? join(eq, function (i) { return fmt(m.u(i / N, i / N), 1); }) : "-");
      set("o4", jo + " %");
      set("o5", fmt(m.u0(ej, ej), 1) + " y " + pc(m.q(ej, ej), 1));
      set("o6", eq.length ? fmt(m.u0(ej, ej) - m.u(e0, e0), 1) + " puntos" : "-");
      set("o7", fmt(m.u(a, b), 1) + " y " + fmt(m.u(b, a), 1));
      set("o8", pc(m.q(a, b), 1) + " y " + pc(m.pw(a, b), 0));
      i = t[sB]; set("o9", "A: " + (m.u(i / N, b) - m.u(a, b) < 0.05 ? "ninguna" : "+" + fmt(m.u(i / N, b) - m.u(a, b), 1) + " yendo a " + i + " %") +
        "; B: " + (function () { var j = t[sA]; var g = m.u(j / N, a) - m.u(b, a); return g < 0.05 ? "ninguna" : "+" + fmt(g, 1) + " yendo a " + j + " %"; })());
      dev = deviation(p);
      set("o10", agree ? fmt(dev.G, 1) : "sin acuerdo");
      set("o11", agree ? fmt(p.d * p.F, 1) : "sin acuerdo");
      base = mk({ W: p.W, rho: p.rho, g: p.g, agree: false }); eq0 = equilibria(base, brTable(base));
      if (!eq.length) {
        note = "Con estos valores no hay ningún punto en el que los dos se queden quietos con la misma seguridad: la sanción crea un salto y cada uno querría cambiar. Prueba otros valores del acuerdo.";
      } else if (!agree) {
        note = "Sin acuerdo, cada actor mira solo su pago y acaba en " + join(eq, function (i) { return i + " %"; }) + " de seguridad, con " +
          join(eq, function (i) { return pc(m.q(i / N, i / N), 1); }) + " de accidente. Lo mejor para los dos sería " + jo + " %, con " + pc(m.q(ej, ej), 1) +
          " de accidente y " + fmt(m.u0(ej, ej) - m.u(e0, e0), 1) + " puntos más por cabeza. Mira la tentación: desde el óptimo, cada uno gana moviéndose solo.";
      } else if (p.floor <= eq0[0] / 100 + 1e-9) {
        note = "El suelo (" + FL + " %) está por debajo de lo que ya harían sin acuerdo (" + eq0[0] + " %): el acuerdo no cambia nada. Súbelo.";
      } else if (eq.every(function (i) { return i / 100 >= p.floor - 1e-9; })) {
        note = "Cumplir es un equilibrio: saltarse el suelo daría como mucho +" + fmt(dev.G, 1) + " y la sanción esperada (d × F = " + fmt(p.d * p.F, 1) +
          ") lo compensa. La seguridad sube a " + join(eq, function (i) { return i + " %"; }) + " y el accidente baja a " + join(eq, function (i) { return pc(m.q(i / N, i / N), 1); }) + ".";
      } else if (eq.some(function (i) { return i / 100 >= p.floor - 1e-9; })) {
        note = "Hay dos equilibrios: todos cumplen, o nadie cumple. La sanción cubre la ganancia de incumplir cuando el otro cumple, pero si el otro no cumple, cumplir sale caro. Un acuerdo verificable funciona solo si cada uno cree que el otro también cumple; sube d o F para eliminar el equilibrio malo.";
      } else {
        note = "El acuerdo no se sostiene: saltarse el suelo gana +" + fmt(dev.G, 1) + " y la sanción esperada es solo " + fmt(p.d * p.F, 1) +
          ". Sube la probabilidad de detección o la sanción, o baja el suelo. Con detección cero, el acuerdo es solo una promesa.";
      }
      set("o12", !agree ? "desactivado" : !eq.length ? "sin equilibrio simétrico" : p.floor <= eq0[0] / 100 + 1e-9 ? "no obliga" :
        eq.every(function (i) { return i / 100 >= p.floor - 1e-9; }) ? "se sostiene" :
        eq.some(function (i) { return i / 100 >= p.floor - 1e-9; }) ? "dos equilibrios" : "no se sostiene");
      $("note").textContent = note;
      drawPlane(m, t, eq, jo, a, b);
      drawPayoff(m, t, a, b);
    }

    function fromInputs() {
      W = parseInt(inW.value, 10); R = parseInt(inR.value, 10); G = parseFloat(inG.value);
      sA = parseInt(inA.value, 10); sB = parseInt(inB.value, 10);
      FL = parseInt(inFl.value, 10); DD = parseInt(inDd.value, 10); FF = parseInt(inFf.value, 10);
      path = [];
      refresh();
    }
    [inW, inR, inG, inA, inB, inFl, inDd, inFf].forEach(function (x) { x.addEventListener("input", fromInputs); });
    inRv.addEventListener("change", function () { rivalBR = inRv.checked; inB.disabled = rivalBR; path = []; refresh(); });
    function syncAgree() { inFl.disabled = inDd.disabled = inFf.disabled = !agree; }
    inAg.addEventListener("change", function () { agree = inAg.checked; syncAgree(); path = []; refresh(); });
    $("bra").addEventListener("click", function () { sA = lastT[sB]; inA.value = String(sA); path = []; refresh(); });
    $("brb").addEventListener("click", function () { sB = lastT[sA]; inB.value = String(sB); path = []; refresh(); });
    $("rs").addEventListener("click", function () { sA = sB = 90; inA.value = inB.value = "90"; path = []; refresh(); });
    $("eq").addEventListener("click", function () {
      var k, na, nb, seen = {};
      path = [{ a: sA, b: sB }];
      for (k = 0; k < 80; k++) {
        na = lastT[sB]; path.push({ a: na, b: sB });
        nb = lastT[na]; path.push({ a: na, b: nb });
        if ((na === sA && nb === sB) || seen[na + "," + nb]) { sA = na; sB = nb; break; }
        seen[na + "," + nb] = 1; sA = na; sB = nb;
      }
      inA.value = String(sA); inB.value = String(sB);
      refresh();
    });
    syncAgree();
    refresh();
  };
})();
