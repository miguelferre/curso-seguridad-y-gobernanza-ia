/* Simulador "m11-l02-aversion": actitud ante el riesgo como curvatura de la utilidad.
   Parte 1: una lotería de dos resultados sobre una utilidad cóncava, lineal o convexa (x^a) o logarítmica;
   muestra valor esperado, utilidad esperada, certeza equivalente y prima de riesgo.
   Parte 2 (caso propio, cifras inventadas): tratamiento seguro frente a arriesgado con más beneficio esperado,
   con el punto de curvatura en el que el agente cambia de opinión.
   Fórmulas: EU = p u(alto) + (1-p) u(bajo); CE = u^-1(EU); prima = EV - CE.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var XMAX = 100;
  var SVGNS = "http://www.w3.org/2000/svg";

  function injectStyle() {
    if (document.getElementById("w-av-style")) return;
    var st = document.createElement("style");
    st.id = "w-av-style";
    st.textContent = [
      ".w-av{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-av h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-av h5{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:1.1rem 0 .5rem}",
      ".w-av .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-av .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-av .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-av .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-av input[type=range]{width:100%;accent-color:var(--accent);min-height:1.6rem;margin:0}",
      ".w-av input[type=range]:disabled{opacity:.4}",
      ".w-av .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.2rem 0 .3rem}",
      ".w-av button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-av button:hover{background:var(--accent-soft)}",
      ".w-av button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-av svg{display:block;width:100%;max-width:560px;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-av .w-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:.6rem 0}",
      ".w-av .w-res > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-av .w-res dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-av .w-res dd{margin:0;font:600 1.1rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-av .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.4rem 0}",
      ".w-av .w-verd{font-weight:600}",
      ".w-av .w-cap{color:var(--faint);font-size:.76rem;margin:.4rem 0 0}",
      ".w-av .w-lt{fill:var(--muted);font:500 11px var(--mono)}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) {
    if (x === Infinity) return "∞";
    if (x === -Infinity) return "−∞";
    var s = Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
    return s.replace("-", "−");
  }

  /* Utilidad sin normalizar: potencia x^a o logaritmo natural (u(0) = -infinito). */
  function uraw(fam, a, x) {
    if (fam === "log") return x > 0 ? Math.log(x) : -Infinity;
    return Math.pow(x, a);
  }
  function uinv(fam, a, y) {
    if (y === -Infinity) return 0;
    if (fam === "log") return Math.exp(y);
    return Math.pow(Math.max(y, 0), 1 / a);
  }
  /* Utilidad esperada de una lotería [[prob, resultado], ...]; 0 x infinito cuenta como 0. */
  function eu(fam, a, lot) {
    var s = 0, i, w, v;
    for (i = 0; i < lot.length; i++) {
      w = lot[i][0]; v = uraw(fam, a, lot[i][1]);
      if (w === 0) continue;
      s += w * v;
    }
    return s;
  }
  /* Media de orden a (potencia): el arriesgado gana al seguro s si M_a > s. Con a -> 0 es la media geométrica. */
  function powMean(g, b, q, a) {
    if (b === 0 && a <= 0) return 0;
    return Math.pow(q * Math.pow(g, a) + (1 - q) * Math.pow(b, a), 1 / a);
  }
  function puntoCambio(s, g, b, q) {
    var lo = 0.01, hi = 6, i, m;
    if (powMean(g, b, q, lo) >= s) return { tipo: "siempre-arriesgado" };
    if (powMean(g, b, q, hi) <= s) return { tipo: "siempre-seguro" };
    for (i = 0; i < 60; i++) {
      m = (lo + hi) / 2;
      if (powMean(g, b, q, m) < s) lo = m; else hi = m;
    }
    return { tipo: "punto", a: (lo + hi) / 2 };
  }

  var VIS = { W: 460, H: 290, ml: 46, mr: 16, mt: 14, mb: 44, ymin: -0.12, ymax: 1.05 };
  VIS.pw = VIS.W - VIS.ml - VIS.mr;
  VIS.ph = VIS.H - VIS.mt - VIS.mb;
  function px(x) { return VIS.ml + x / XMAX * VIS.pw; }
  function py(y) {
    var c = Math.max(VIS.ymin, Math.min(VIS.ymax, y));
    return VIS.mt + (VIS.ymax - c) / (VIS.ymax - VIS.ymin) * VIS.ph;
  }
  function r1(n) { return Math.round(n * 10) / 10; }

  window.WIDGETS["m11-l02-aversion"] = function (el) {
    injectStyle();
    var id = "w-av-" + (++uid);
    var S = { fam: "pot", a: 0.5, lo: 0, hi: 100, p: 50, ts: 8, tg: 14, tb: 3, tq: 50 };

    function slider(key, label, min, max, step, val) {
      return '<div class="w-f"><label for="' + id + '-' + key + '">' + label + ' <b id="' + id + '-o-' + key + '"></b></label>' +
        '<input type="range" id="' + id + '-' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></div>';
    }

    el.innerHTML = '<div class="w-av">' +
      '<h4>Actitud ante el riesgo y curvatura de la utilidad</h4>' +
      '<p class="w-hint">Elige la forma de la utilidad (arriba) y una lotería (abajo). Se recalculan la utilidad esperada, la certeza equivalente y la prima de riesgo. Con teclado, las flechas ajustan cada deslizador.</p>' +
      '<h5>Utilidad del agente</h5>' +
      '<div class="w-btns" role="group" aria-label="Formas de utilidad">' +
      '<button type="button" id="' + id + '-b-conc" aria-pressed="false">Cóncava (raíz)</button>' +
      '<button type="button" id="' + id + '-b-lin" aria-pressed="false">Lineal</button>' +
      '<button type="button" id="' + id + '-b-conv" aria-pressed="false">Convexa (cuadrado)</button>' +
      '<button type="button" id="' + id + '-b-log" aria-pressed="false">Logarítmica</button>' +
      '</div>' +
      '<div class="w-grid">' + slider("a", "Curvatura (exponente a)",0.2, 3, 0.05, S.a) + '</div>' +
      '<p class="w-hint" id="' + id + '-att" role="status" aria-live="polite"></p>' +
      '<h5>Parte 1. Una lotería de dos resultados</h5>' +
      '<div class="w-grid">' +
      slider("lo", "Resultado bajo", 0, 100, 1, S.lo) +
      slider("hi", "Resultado alto", 0, 100, 1, S.hi) +
      slider("p", "Probabilidad del alto (%)", 0, 100, 1, S.p) +
      '</div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 ' + VIS.W + ' ' + VIS.H + '" role="img" aria-label=""></svg>' +
      '<p class="w-cap">Dibujo con u(100) = 1. Punto relleno sobre la cuerda: utilidad esperada de la lotería. Punto sobre la curva a su altura: la certeza equivalente. La distancia entre esa cantidad y el valor esperado es la prima de riesgo. Con la logarítmica, u(0) = −∞ y no cabe en el dibujo.</p>' +
      '<dl class="w-res" aria-live="polite">' +
      '<div><dt>Valor esperado</dt><dd id="' + id + '-ev"></dd></div>' +
      '<div><dt>Utilidad esperada</dt><dd id="' + id + '-eu"></dd></div>' +
      '<div><dt>Certeza equivalente</dt><dd id="' + id + '-ce"></dd></div>' +
      '<div><dt>Prima de riesgo</dt><dd id="' + id + '-pr"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-lect" role="status" aria-live="polite"></p>' +
      '<h5>Parte 2. Caso propio: tratamiento seguro o arriesgado</h5>' +
      '<p class="w-hint">Cifras inventadas para practicar, en años de vida ajustados por calidad (AVAC). El agente usa la utilidad elegida arriba.</p>' +
      '<div class="w-grid">' +
      slider("ts", "Seguro: AVAC con certeza", 1, 20, 0.5, S.ts) +
      slider("tg", "Arriesgado: AVAC si sale bien", 1, 30, 0.5, S.tg) +
      slider("tb", "Arriesgado: AVAC si sale mal", 0, 20, 0.5, S.tb) +
      slider("tq", "Probabilidad de que salga bien (%)", 0, 100, 1, S.tq) +
      '</div>' +
      '<dl class="w-res" aria-live="polite">' +
      '<div><dt>Valor esperado arriesgado</dt><dd id="' + id + '-tev"></dd></div>' +
      '<div><dt>Certeza equivalente arriesgado</dt><dd id="' + id + '-tce"></dd></div>' +
      '<div><dt>Prima de riesgo</dt><dd id="' + id + '-tpr"></dd></div>' +
      '<div><dt>Elige</dt><dd id="' + id + '-tel"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-tlect" role="status" aria-live="polite"></p>' +
      '<p><button type="button" id="' + id + '-caso">Cargar el caso del texto</button> ' +
      '<button type="button" id="' + id + '-reset">Restablecer todo</button></p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var INIT = { fam: "pot", a: 0.5, lo: 0, hi: 100, p: 50, ts: 8, tg: 14, tb: 3, tq: 50 };
    var KEYS = ["a", "lo", "hi", "p", "ts", "tg", "tb", "tq"];

    function line(x1, y1, x2, y2, css) {
      return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" style="' + css + '"/>';
    }
    function dot(x, y, r, fill, stroke) {
      return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r + '" style="fill:' + fill + ';stroke:' + stroke + ';stroke-width:1.5"/>';
    }
    function txt(x, y, s, anchor) {
      return '<text class="w-lt" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (anchor || "middle") + '">' + s + '</text>';
    }

    function actitud() {
      if (S.fam === "log") return "Logarítmica: cóncava, aversión al riesgo. Además u(0) = −∞, así que rechaza cualquier lotería con probabilidad de acabar en 0.";
      if (Math.abs(S.a - 1) < 0.001) return "a = 1: utilidad lineal, neutralidad ante el riesgo.";
      if (S.a < 1) return "a < 1: utilidad cóncava, aversión al riesgo.";
      return "a > 1: utilidad convexa, búsqueda del riesgo.";
    }

    function dibujar(o) {
      var fam = S.fam, a = S.a, n = uraw(fam, a, XMAX);
      function un(x) { return uraw(fam, a, x) / n; }
      var s = "", x, pts = [], x0 = fam === "log" ? 1 : 0, yb = py(VIS.ymin), i;
      s += '<rect x="' + VIS.ml + '" y="' + r1(py(VIS.ymax)) + '" width="' + VIS.pw + '" height="' + r1(yb - py(VIS.ymax)) + '" style="fill:none;stroke:var(--rule-strong)"/>';
      s += line(VIS.ml, py(0), VIS.ml + VIS.pw, py(0), "stroke:var(--rule-strong);stroke-dasharray:2 3");
      for (i = 0; i <= 4; i++) {
        s += line(px(i * 25), yb, px(i * 25), yb + 4, "stroke:var(--rule-strong)");
        s += txt(px(i * 25), yb + 16, String(i * 25));
      }
      s += txt(VIS.ml - 6, py(1) + 4, "1", "end") + txt(VIS.ml - 6, py(0) + 4, "0", "end");
      s += txt(VIS.ml + 4, VIS.mt + 11, "utilidad u(x)", "start");
      s += txt(VIS.ml + VIS.pw, yb + 34, "resultado x", "end");
      for (x = x0; x <= XMAX + 1e-9; x += 0.5) pts.push(r1(px(x)) + "," + r1(py(un(x))));
      s += '<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>';
      if (o.finito) {
        s += line(px(o.lo), py(un(o.lo)), px(o.hi), py(un(o.hi)), "stroke:var(--muted);stroke-width:1.5;stroke-dasharray:5 4");
        s += line(VIS.ml, py(o.eun), px(o.ce), py(o.eun), "stroke:var(--faint);stroke-dasharray:3 3");
        s += line(px(o.ce), py(o.eun), px(o.ce), yb, "stroke:var(--faint);stroke-dasharray:3 3");
        s += line(px(o.ev), py(o.eun), px(o.ev), yb, "stroke:var(--faint);stroke-dasharray:3 3");
        s += dot(px(o.lo), py(un(o.lo)), 3.5, "var(--ground)", "var(--accent)");
        s += dot(px(o.hi), py(un(o.hi)), 3.5, "var(--ground)", "var(--accent)");
        s += dot(px(o.ev), py(un(o.ev)), 3.5, "var(--ground)", "var(--muted)");
        s += dot(px(o.ev), py(o.eun), 5, "var(--trap)", "var(--surface)");
        s += dot(px(o.ce), py(o.eun), 5, "var(--accent)", "var(--surface)");
      } else {
        s += line(px(o.ev), py(un(o.ev)), px(o.ev), yb, "stroke:var(--faint);stroke-dasharray:3 3");
        s += dot(px(o.hi), py(un(o.hi)), 3.5, "var(--ground)", "var(--accent)");
      }
      var yy = yb - 8, xa = px(o.ce), xe = px(o.ev), lo = Math.min(xa, xe), hi = Math.max(xa, xe);
      if (hi - lo > 1) {
        s += line(lo, yy, hi, yy, "stroke:var(--trap);stroke-width:3");
        if (hi - lo > 44) s += txt((lo + hi) / 2, yy - 6, "prima");
      }
      if (Math.abs(xa - xe) < 1) {
        s += txt(xe, yb + 28, "EV = CE");
      } else if (xa < xe) {
        s += txt(xa - 2, yb + 28, "CE", "end") + txt(xe + 2, yb + 28, "EV", "start");
      } else {
        s += txt(xe - 2, yb + 28, "EV", "end") + txt(xa + 2, yb + 28, "CE", "start");
      }
      var svg = $("svg");
      svg.innerHTML = s;
      svg.setAttribute("aria-label", "Curva de utilidad " + (fam === "log" ? "logarítmica" : "x elevado a " + fmt(a, 2)) +
        ". Valor esperado " + fmt(o.ev, 1) + ", certeza equivalente " + fmt(o.ce, 1) + ", prima de riesgo " + fmt(o.prima, 1) + ".");
    }

    function parte1() {
      var p = S.p / 100, lot = [[1 - p, S.lo], [p, S.hi]];
      var ev = (1 - p) * S.lo + p * S.hi;
      var e = eu(S.fam, S.a, lot), n = uraw(S.fam, S.a, XMAX);
      var ce = uinv(S.fam, S.a, e), prima = ev - ce;
      if (Math.abs(prima) < 1e-9) prima = 0;
      var finito = isFinite(e);
      dibujar({ lo: S.lo, hi: S.hi, ev: ev, ce: ce, prima: prima, eun: finito ? e / n : 0, finito: finito });
      $("ev").textContent = fmt(ev, 1);
      $("eu").textContent = finito ? fmt(e / n, 3) : "−∞";
      $("ce").textContent = fmt(ce, 1);
      $("pr").textContent = fmt(prima, 1);
      var t;
      if (!finito) {
        t = "Hay probabilidad de acabar en 0 y u(0) = −∞: la utilidad esperada es −∞ y la certeza equivalente 0. Este agente prefiere cualquier cantidad segura, por pequeña que sea, a esta lotería.";
      } else if (S.lo === S.hi || S.p === 0 || S.p === 100) {
        t = "No hay riesgo real: el resultado es seguro y la certeza equivalente coincide con el valor esperado.";
      } else if (prima > 0.05) {
        t = "El agente cambiaría la lotería por " + fmt(ce, 1) + " seguros. Renuncia a " + fmt(prima, 1) + " de valor esperado para librarse del riesgo: aversión.";
      } else if (prima < -0.05) {
        t = "El agente pagaría hasta " + fmt(-prima, 1) + " por encima del valor esperado por jugarla: le atrae el riesgo.";
      } else {
        t = "El agente es indiferente entre jugar y recibir el valor esperado seguro: neutralidad.";
      }
      $("lect").textContent = t;
    }

    function parte2() {
      var q = S.tq / 100, s = S.ts, g = S.tg, b = S.tb, fam = S.fam, a = S.a;
      var ev = q * g + (1 - q) * b;
      var e = eu(fam, a, [[1 - q, b], [q, g]]), us = uraw(fam, a, s);
      var ce = uinv(fam, a, e), prima = ev - ce;
      var dif = e - us, tol = 1e-9 * (1 + Math.abs(us));
      var elige = dif > tol ? "Arriesgado" : (dif < -tol ? "Seguro" : "Indiferente");
      $("tev").textContent = fmt(ev, 2);
      $("tce").textContent = fmt(ce, 2);
      $("tpr").textContent = fmt(prima, 2);
      $("tel").textContent = elige;
      var t = "El arriesgado da " + (ev > s ? "más" : (ev < s ? "menos" : "lo mismo")) + " beneficio esperado que el seguro (" + fmt(ev, 2) + " frente a " + fmt(s, 2) + "). ";
      if (elige === "Seguro") t += "Con esta utilidad su certeza equivalente es " + fmt(ce, 2) + ", por debajo de " + fmt(s, 2) + ": el agente prefiere el seguro.";
      else if (elige === "Arriesgado") t += "Con esta utilidad su certeza equivalente es " + fmt(ce, 2) + ", por encima de " + fmt(s, 2) + ": el agente prefiere el arriesgado.";
      else t += "Con esta utilidad ambos valen lo mismo para el agente.";
      var pc = puntoCambio(s, g, b, q);
      if (q === 0 || q === 1 || g === b) {
        t += " Sin incertidumbre real no hay punto de cambio.";
      } else if (pc.tipo === "punto") {
        t += " Con utilidades x^a, el punto de cambio está en a = " + fmt(pc.a, 2) + ": con a mayor prefiere el arriesgado y con a menor el seguro (la logarítmica equivale a un a cercano a 0).";
      } else if (pc.tipo === "siempre-arriesgado") {
        t += " Con estas cifras el arriesgado gana para cualquier curvatura de la familia x^a.";
      } else {
        t += " Con estas cifras el seguro gana para cualquier curvatura razonable (hasta a = 6).";
      }
      $("tlect").textContent = t;
    }

    function sync() {
      var i, k, v, o;
      for (i = 0; i < KEYS.length; i++) {
        k = KEYS[i]; v = S[k]; o = $("o-" + k);
        if (k === "a") o.textContent = S.fam === "log" ? "(no aplica)" : fmt(v, 2);
        else if (k === "p" || k === "tq") o.textContent = fmt(v, 0) + " %";
        else if (k === "lo" || k === "hi") o.textContent = fmt(v, 0);
        else o.textContent = fmt(v, 1);
        if (Number($(k).value) !== v) $(k).value = v;
      }
      $("hi").min = S.lo; $("lo").max = S.hi;
      $("tg").min = Math.max(1, S.tb); $("tb").max = S.tg;
      $("a").disabled = S.fam === "log";
      $("att").textContent = actitud();
      $("b-conc").setAttribute("aria-pressed", String(S.fam === "pot" && S.a === 0.5));
      $("b-lin").setAttribute("aria-pressed", String(S.fam === "pot" && S.a === 1));
      $("b-conv").setAttribute("aria-pressed", String(S.fam === "pot" && S.a === 2));
      $("b-log").setAttribute("aria-pressed", String(S.fam === "log"));
      parte1();
      parte2();
    }

    KEYS.forEach(function (k) {
      $(k).addEventListener("input", function () {
        var v = Number($(k).value);
        if (!isFinite(v)) return;
        S[k] = v;
        if (k === "lo" && S.lo > S.hi) S.hi = S.lo;
        if (k === "hi" && S.hi < S.lo) S.lo = S.hi;
        if (k === "tg" && S.tg < S.tb) S.tb = S.tg;
        if (k === "tb" && S.tb > S.tg) S.tg = S.tb;
        sync();
      });
    });
    function preset(fam, a) { return function () { S.fam = fam; if (a) S.a = a; sync(); }; }
    $("b-conc").addEventListener("click", preset("pot", 0.5));
    $("b-lin").addEventListener("click", preset("pot", 1));
    $("b-conv").addEventListener("click", preset("pot", 2));
    $("b-log").addEventListener("click", preset("log", 0));
    $("caso").addEventListener("click", function () { S.ts = 8; S.tg = 14; S.tb = 3; S.tq = 50; sync(); });
    $("reset").addEventListener("click", function () { var k; for (k in INIT) S[k] = INIT[k]; sync(); });

    sync();
  };
})();
