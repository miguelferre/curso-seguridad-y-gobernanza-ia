/* Simulador "m04-l01-ataque": clasificador 2D con dos clases y ataques FGSM y PGD en norma L-infinito.
   Dos modelos de juguete: lineal (logistico) y de anillo (frontera curva). Ataque no dirigido:
   sube la perdida de la clase real. En binario, dirigido y no dirigido coinciden.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var SVGNS = "http://www.w3.org/2000/svg";
  var VIEW = 3.2, PX = 480, EMAX = 1.5;

  /* Modelos: z(x) es el logit; positivo = clase B (y=+1). */
  var LIN = { w: [1.6, 1.1], b: 0 };
  var RING = { R2: 2.56, W: 1.6, C: 0.5 };
  function zLin(x) { return LIN.w[0] * x[0] + LIN.w[1] * x[1] + LIN.b; }
  function gLin() { return [LIN.w[0], LIN.w[1]]; }
  function zRing(x) { var d = x[0] * x[0] + x[1] * x[1] - RING.R2; return RING.C * (RING.W - d * d); }
  function gRing(x) {
    var d = x[0] * x[0] + x[1] * x[1] - RING.R2;
    return [-4 * RING.C * d * x[0], -4 * RING.C * d * x[1]];
  }
  var MODELS = {
    lin: { nombre: "Lineal (frontera recta)", z: zLin, g: gLin },
    ring: { nombre: "Anillo (frontera curva)", z: zRing, g: gRing }
  };

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = Math.max(r(), 1e-9), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function dataset(kind) {
    var r = rng(kind === "lin" ? 11 : 23), pts = [], i, a, rad;
    if (kind === "lin") {
      for (i = 0; i < 24; i++) pts.push({ x: [-1.25 + 0.7 * gauss(r), -0.85 + 0.7 * gauss(r)], y: -1 });
      for (i = 0; i < 24; i++) pts.push({ x: [1.25 + 0.7 * gauss(r), 0.85 + 0.7 * gauss(r)], y: 1 });
    } else {
      for (i = 0; i < 22; i++) {
        a = 2 * Math.PI * (i + r() * 0.6) / 22; rad = 1.6 + 0.14 * gauss(r);
        pts.push({ x: [rad * Math.cos(a), rad * Math.sin(a)], y: 1 });
      }
      for (i = 0; i < 8; i++) {
        a = 2 * Math.PI * r(); rad = Math.abs(0.4 * gauss(r));
        pts.push({ x: [rad * Math.cos(a), rad * Math.sin(a)], y: -1 });
      }
      for (i = 0; i < 16; i++) {
        a = 2 * Math.PI * (i + r() * 0.6) / 16; rad = 2.5 + 0.25 * r();
        pts.push({ x: [rad * Math.cos(a), rad * Math.sin(a)], y: -1 });
      }
    }
    return pts;
  }
  function sgn(v) { return v > 0 ? 1 : v < 0 ? -1 : 0; }
  function sigm(z) { return 1 / (1 + Math.exp(-z)); }
  /* Direccion del signo del gradiente de la perdida logistica respecto a la entrada.
     L = log(1+exp(-y z)); grad_x L = -y * sigmoide(-y z) * grad_x z. */
  function dirSigno(model, x, y) {
    var g = model.g(x);
    return [-y * sgn(g[0]), -y * sgn(g[1])];
  }
  function fgsm(model, p, eps) {
    var s = dirSigno(model, p.x, p.y);
    return [p.x[0] + eps * s[0], p.x[1] + eps * s[1]];
  }
  function pgd(model, p, eps, n) {
    var alpha = 2.5 * eps / n, x = [p.x[0], p.x[1]], path = [x.slice()], i, s, k;
    for (i = 0; i < n; i++) {
      s = dirSigno(model, x, p.y);
      for (k = 0; k < 2; k++) {
        x[k] += alpha * s[k];
        x[k] = Math.min(p.x[k] + eps, Math.max(p.x[k] - eps, x[k]));
      }
      path.push(x.slice());
    }
    return { x: x, path: path };
  }
  function attack(model, p, eps, met, n) {
    if (met === "fgsm") { var xa = fgsm(model, p, eps); return { x: xa, path: [p.x.slice(), xa] }; }
    return pgd(model, p, eps, n);
  }
  function correct(model, p) { return p.y * model.z(p.x) > 0; }
  function fracFlipped(model, pts, eps, met, n) {
    var tot = 0, fl = 0, i, a;
    for (i = 0; i < pts.length; i++) {
      if (!correct(model, pts[i])) continue;
      tot++;
      a = attack(model, pts[i], eps, met, n);
      if (pts[i].y * model.z(a.x) <= 0) fl++;
    }
    return { fl: fl, tot: tot, f: tot ? fl / tot : 0 };
  }
  var CORE = { MODELS: MODELS, dataset: dataset, attack: attack, fracFlipped: fracFlipped, correct: correct, sigm: sigm, EMAX: EMAX, LIN: LIN };

  /* ==== RENDER ==== */
  function injectStyle() {
    if (document.getElementById("w-atq-style")) return;
    var st = document.createElement("style");
    st.id = "w-atq-style";
    st.textContent = [
      ".w-atq{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-atq h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-atq .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-atq .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-atq .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-atq .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-atq input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-atq select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-atq .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-atq button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-atq button:hover{background:var(--accent-soft)}",
      ".w-atq svg{display:block;width:100%;max-width:480px;height:auto;margin:0 auto .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-atq svg.w-plot{cursor:crosshair}",
      ".w-atq dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-atq dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-atq dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-atq dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-atq .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-atq .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(f) { return fmt(f * 100, 0) + " %"; }
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag), k;
    for (k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function px(v) { return (v + VIEW) / (2 * VIEW) * PX; }
  function py(v) { return PX - (v + VIEW) / (2 * VIEW) * PX; }
  function col(y) { return y > 0 ? "var(--trap)" : "var(--accent)"; }
  function nombre(y) { return y > 0 ? "B" : "A"; }

  window.WIDGETS["m04-l01-ataque"] = function (el) {
    injectStyle();
    var id = "w-atq-" + (++uid);
    var kind = "lin", met = "fgsm", eps = 0.5, steps = 10, sel = 0, pts = [];

    el.innerHTML = '<div class="w-atq">' +
      '<h4>Ataque FGSM y PGD sobre un clasificador en 2D</h4>' +
      '<p class="w-hint">Dos clases de puntos, A en violeta y B en ámbar. El color del fondo es lo que predice el modelo. El atacante mueve un punto como mucho ε en cada coordenada (caja de norma L∞). Haz clic en un punto o elígelo en la lista.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-m">Modelo</label><select id="' + id + '-m"><option value="lin">Lineal (recta)</option><option value="ring">Anillo (curvo)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-t">Ataque</label><select id="' + id + '-t"><option value="fgsm">FGSM (1 paso)</option><option value="pgd">PGD (varios)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-e"><span style="text-transform:none">ε</span> <b id="' + id + '-ev"></b></label><input type="range" id="' + id + '-e" min="0" max="' + EMAX + '" step="0.05" value="' + eps + '"></div>' +
      '<div class="w-f" id="' + id + '-sw"><label for="' + id + '-s">Pasos de PGD <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="1" max="30" step="1" value="' + steps + '"></div>' +
      '<div class="w-f"><label for="' + id + '-p">Punto</label><select id="' + id + '-p"></select></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-prev">Punto anterior</button><button type="button" id="' + id + '-next">Punto siguiente</button><button type="button" id="' + id + '-vul">Siguiente punto que cambia de clase</button></div>' +
      '<svg class="w-plot" id="' + id + '-svg" viewBox="0 0 ' + PX + ' ' + PX + '" role="img" aria-label="Puntos de dos clases con el ataque sobre el punto elegido"></svg>' +
      '<dl class="w-out" id="' + id + '-out"></dl>' +
      '<div class="w-note" id="' + id + '-note" aria-live="polite"></div>' +
      '<svg id="' + id + '-cv" viewBox="0 0 480 204" role="img" aria-label="Porcentaje de puntos que cambian de clase según ε"></svg>' +
      '<p class="w-cap">Modelos de juguete con datos inventados y semilla fija; el ataque no dirigido es el que sube la pérdida de la clase real. Con dos clases, dirigido y no dirigido coinciden. Curva: entre los puntos que el modelo acierta sin ataque, porcentaje que acaba mal clasificado.</p>' +
      '</div>';

    var $ = function (s) { return el.querySelector("#" + id + "-" + s); };
    var svg = $("svg"), cv = $("cv");

    function model() { return MODELS[kind]; }
    function pickDefault() {
      /* Un punto que cambia con FGSM y cuyo margen ronda el 60 % del mayor margen que cae: cruza con holgura. */
      var m = model(), fl = [], mx = 0, best = 0, bd = 1e9, i, a, mg;
      for (i = 0; i < pts.length; i++) {
        if (!correct(m, pts[i])) continue;
        a = attack(m, pts[i], eps, "fgsm", steps);
        mg = pts[i].y * m.z(pts[i].x);
        if (pts[i].y * m.z(a.x) <= 0) { fl.push([i, mg]); if (mg > mx) mx = mg; }
      }
      for (i = 0; i < fl.length; i++) {
        if (Math.abs(fl[i][1] - 0.6 * mx) < bd) { bd = Math.abs(fl[i][1] - 0.6 * mx); best = fl[i][0]; }
      }
      return best;
    }
    function fillList() {
      var m = model(), s = "", i;
      for (i = 0; i < pts.length; i++) s += '<option value="' + i + '">' + (i + 1) + ' · clase ' + nombre(pts[i].y) + ' · margen ' + fmt(pts[i].y * m.z(pts[i].x), 2) + '</option>';
      $("p").innerHTML = s;
    }
    function setKind(k) {
      kind = k; pts = dataset(k); fillList(); sel = pickDefault(); $("p").value = String(sel);
    }

    function draw() {
      var m = model(), p = pts[sel], a = attack(m, p, eps, met, steps), i, j, z, c, r;
      var zb = m.z(p.x), za = m.z(a.x), pa = sigm(za), flips = correct(m, p) && p.y * za <= 0;
      $("ev").textContent = fmt(eps, 2);
      $("sv").textContent = String(steps);
      $("sw").style.display = met === "pgd" ? "" : "none";

      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var N = 32, cs = PX / N;
      for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
        z = m.z([-VIEW + (i + 0.5) * 2 * VIEW / N, VIEW - (j + 0.5) * 2 * VIEW / N]);
        mk("rect", { x: i * cs, y: j * cs, width: cs, height: cs, "shape-rendering": "crispEdges", fill: z > 0 ? "var(--trap)" : "var(--accent)", opacity: (0.07 + 0.16 * Math.min(1, Math.abs(z) / 3)).toFixed(3) }, svg);
      }
      var fr = fracFlipped(m, pts, eps, met, steps);
      for (i = 0; i < pts.length; i++) {
        c = correct(m, pts[i]) && pts[i].y * m.z(attack(m, pts[i], eps, met, steps).x) <= 0;
        if (c) mk("circle", { cx: px(pts[i].x[0]), cy: py(pts[i].x[1]), r: 8.5, fill: "none", stroke: "var(--ink)", "stroke-width": 1.2, "stroke-dasharray": "3 2" }, svg);
        mk("circle", { cx: px(pts[i].x[0]), cy: py(pts[i].x[1]), r: i === sel ? 6.5 : 4.5, fill: col(pts[i].y), stroke: i === sel ? "var(--ink)" : "var(--surface)", "stroke-width": i === sel ? 2.4 : 1 }, svg);
      }
      mk("rect", { x: px(p.x[0] - eps), y: py(p.x[1] + eps), width: 2 * eps / (2 * VIEW) * PX, height: 2 * eps / (2 * VIEW) * PX, fill: "none", stroke: "var(--ink)", "stroke-width": 1.3, "stroke-dasharray": "5 3" }, svg);
      var pl = a.path.map(function (q) { return px(q[0]).toFixed(1) + "," + py(q[1]).toFixed(1); }).join(" ");
      mk("polyline", { points: pl, fill: "none", stroke: "var(--ink)", "stroke-width": 1.8 }, svg);
      if (met === "pgd") for (i = 1; i < a.path.length - 1; i++) mk("circle", { cx: px(a.path[i][0]), cy: py(a.path[i][1]), r: 2, fill: "var(--ink)" }, svg);
      var ax = px(a.x[0]), ay = py(a.x[1]), rc = col(za > 0 ? 1 : -1);
      mk("line", { x1: ax - 6, y1: ay - 6, x2: ax + 6, y2: ay + 6, stroke: rc, "stroke-width": 3.2 }, svg);
      mk("line", { x1: ax - 6, y1: ay + 6, x2: ax + 6, y2: ay - 6, stroke: rc, "stroke-width": 3.2 }, svg);

      /* Resultados */
      var fg = fracFlipped(m, pts, eps, "fgsm", steps), pg = fracFlipped(m, pts, eps, "pgd", steps);
      var out = '<div><dt>Punto elegido</dt><dd>Clase real ' + nombre(p.y) + ', ' + (correct(m, p) ? 'bien clasificado' : 'ya mal clasificado') + '</dd></div>' +
        '<div><dt>Logit antes → después</dt><dd>' + fmt(zb, 2) + ' → ' + fmt(za, 2) + '</dd></div>' +
        '<div><dt>P(B) antes → después</dt><dd>' + pc(sigm(zb)) + ' → ' + pc(pa) + '</dd></div>' +
        '<div><dt>Con este ataque</dt><dd>' + (flips ? 'cambia de clase' : correct(m, p) ? 'resiste' : 'sin efecto') + '</dd></div>' +
        '<div><dt>Puntos que cambian: FGSM</dt><dd>' + pc(fg.f) + ' (' + fg.fl + ' de ' + fg.tot + ')</dd></div>' +
        '<div><dt>Puntos que cambian: PGD, ' + steps + ' pasos</dt><dd>' + pc(pg.f) + ' (' + pg.fl + ' de ' + pg.tot + ')</dd></div>';
      if (kind === "lin") {
        var n1 = Math.abs(LIN.w[0]) + Math.abs(LIN.w[1]), cert = 0;
        for (i = 0; i < pts.length; i++) if (correct(m, pts[i]) && Math.abs(m.z(pts[i].x)) > eps * n1) cert++;
        out += '<div><dt>Radio certificado del punto (derivación propia)</dt><dd>' + fmt(Math.abs(zb) / n1, 2) + '</dd></div>' +
          '<div><dt>Puntos certificados con este ε</dt><dd>' + cert + ' de ' + fr.tot + '</dd></div>';
      }
      else out += '<div><dt>Radio certificado del punto</dt><dd>No hay una fórmula sencilla</dd></div>' +
          '<div><dt>Norma L∞ del cambio</dt><dd>' + fmt(eps, 2) + ' como máximo</dd></div>';
      $("out").innerHTML = out;
      var nt;
      if (kind === "lin") nt = 'Modelo lineal: la dirección del signo es la misma en todo el plano, así que PGD y FGSM acaban en la misma esquina de la caja y las dos curvas coinciden. El punto cambia si su margen es menor que ε·‖w‖₁ = ' + fmt(eps * (Math.abs(LIN.w[0]) + Math.abs(LIN.w[1])), 2) + '.';
      else nt = 'Modelo curvo: la dirección que sube la pérdida cambia según dónde estés. Un solo paso grande se pasa de largo (con ε alto, un punto de la clase A puede atravesar el anillo y quedar otra vez en la clase A) y PGD, que reajusta la dirección paso a paso, suele evitarlo. Con pocos pasos PGD se parece más a FGSM.';
      $("note").textContent = nt;

      /* Curva */
      while (cv.firstChild) cv.removeChild(cv.firstChild);
      var L = 42, R = 12, T = 10, B = 44, W = 480 - L - R, H = 204 - T - B, k, e, f1, f2, d1 = [], d2 = [];
      function cx(e2) { return L + e2 / EMAX * W; }
      function cy(f) { return T + (1 - f) * H; }
      [0, 0.5, 1].forEach(function (g) {
        mk("line", { x1: L, y1: cy(g), x2: L + W, y2: cy(g), stroke: "var(--rule)", "stroke-width": 1 }, cv);
        var t = mk("text", { x: L - 6, y: cy(g) + 4, "text-anchor": "end", fill: "var(--muted)", "font-size": 11 }, cv); t.textContent = (g * 100) + " %";
      });
      [0, 0.5, 1, 1.5].forEach(function (g) {
        var t = mk("text", { x: cx(g), y: T + H + 15, "text-anchor": "middle", fill: "var(--muted)", "font-size": 11 }, cv); t.textContent = fmt(g, 1);
      });
      var tl = mk("text", { x: L + W / 2, y: T + H + 32, "text-anchor": "middle", fill: "var(--faint)", "font-size": 11 }, cv); tl.textContent = "ε (cambio máximo por coordenada)";
      for (k = 0; k <= 30; k++) {
        e = k * EMAX / 30;
        f1 = fracFlipped(m, pts, e, "fgsm", steps).f; f2 = fracFlipped(m, pts, e, "pgd", steps).f;
        d1.push(cx(e).toFixed(1) + "," + cy(f1).toFixed(1)); d2.push(cx(e).toFixed(1) + "," + cy(f2).toFixed(1));
      }
      mk("polyline", { points: d1.join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 3 }, cv);
      mk("polyline", { points: d2.join(" "), fill: "none", stroke: "var(--trap)", "stroke-width": 1.8, "stroke-dasharray": "6 3" }, cv);
      mk("line", { x1: cx(eps), y1: T, x2: cx(eps), y2: T + H, stroke: "var(--ink)", "stroke-width": 1.2 }, cv);
      mk("line", { x1: L + 8, y1: T + 8, x2: L + 30, y2: T + 8, stroke: "var(--accent)", "stroke-width": 3 }, cv);
      var l1 = mk("text", { x: L + 35, y: T + 12, fill: "var(--ink)", "font-size": 11 }, cv); l1.textContent = "FGSM";
      mk("line", { x1: L + 8, y1: T + 24, x2: L + 30, y2: T + 24, stroke: "var(--trap)", "stroke-width": 1.8, "stroke-dasharray": "6 3" }, cv);
      var l2 = mk("text", { x: L + 35, y: T + 28, fill: "var(--ink)", "font-size": 11 }, cv); l2.textContent = "PGD, " + steps + " pasos";
      svg.setAttribute("aria-label", "Punto " + (sel + 1) + " de clase " + nombre(p.y) + ", logit " + fmt(zb, 2) + " antes y " + fmt(za, 2) + " después del ataque: " + (flips ? "cambia de clase" : "resiste"));
    }

    function near(ev) {
      var r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * PX, y = (ev.clientY - r.top) / r.height * PX, i, d, bd = 1e9, bi = sel;
      for (i = 0; i < pts.length; i++) {
        d = Math.pow(px(pts[i].x[0]) - x, 2) + Math.pow(py(pts[i].x[1]) - y, 2);
        if (d < bd) { bd = d; bi = i; }
      }
      return bi;
    }
    function go(i) { sel = (i + pts.length) % pts.length; $("p").value = String(sel); draw(); }
    $("m").addEventListener("change", function () { setKind(this.value); draw(); });
    $("t").addEventListener("change", function () { met = this.value; draw(); });
    $("e").addEventListener("input", function () { eps = parseFloat(this.value); draw(); });
    $("s").addEventListener("input", function () { steps = parseInt(this.value, 10); draw(); });
    $("p").addEventListener("change", function () { go(parseInt(this.value, 10)); });
    $("prev").addEventListener("click", function () { go(sel - 1); });
    $("next").addEventListener("click", function () { go(sel + 1); });
    $("vul").addEventListener("click", function () {
      var m = model(), i, k;
      for (k = 1; k <= pts.length; k++) {
        i = (sel + k) % pts.length;
        if (correct(m, pts[i]) && pts[i].y * m.z(attack(m, pts[i], eps, met, steps).x) <= 0) { go(i); return; }
      }
    });
    svg.addEventListener("click", function (ev) { go(near(ev)); });
    setKind("lin");
    draw();
  };
  window.WIDGETS["m04-l01-ataque"].core = CORE;
})();
