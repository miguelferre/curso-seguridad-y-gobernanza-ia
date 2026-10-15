/* Simulador "m05-l03-calibracion": diagrama de fiabilidad de un modelo de riesgo de reingreso (datos sinteticos, propios).
   Los logits crudos son los de una red sobreconfiada; la temperatura T los divide antes de la sigmoide.
   Calcula ECE, MCE, Brier, log loss, AUROC, pendiente e intercepto de calibracion, y ajusta T minimizando
   la log loss en un conjunto de validacion (escalado de temperatura). Opcion de deriva: la poblacion de test es mas grave.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var N = 4000, SEED = 20260929, MU = -1.6, SD = 1.4, RUIDO = 0.3, GANANCIA = 2.0, DERIVA = 0.9;

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function sig(x) { return 1 / (1 + Math.exp(-x)); }

  /* Datos: z es el logit del riesgo verdadero; el modelo ve z con ruido y lo amplifica (sobreconfianza).
     u fija el azar de cada desenlace, asi que activar la deriva cambia solo z, no el sorteo. */
  function generar() {
    var r = mulberry(SEED), out = { val: [], test: [] }, k, i, z, l, o;
    for (k in out) {
      for (i = 0; i < N; i++) {
        z = MU + SD * normal(r);
        l = GANANCIA * (z + RUIDO * normal(r));
        o = { z: z, l: l, u: r() };
        out[k].push(o);
      }
    }
    return out;
  }
  function etiquetas(set, deriva) {
    return set.map(function (o) { return o.u < sig(o.z + (deriva ? DERIVA : 0)) ? 1 : 0; });
  }

  function probs(set, T) { return set.map(function (o) { return sig(o.l / T); }); }

  function nll(set, y, T) {
    var s = 0, i, p;
    for (i = 0; i < set.length; i++) {
      p = Math.min(1 - 1e-12, Math.max(1e-12, sig(set[i].l / T)));
      s -= y[i] ? Math.log(p) : Math.log(1 - p);
    }
    return s / set.length;
  }

  /* T optima: minimiza la log loss en validacion. Es convexa en beta = 1/T, asi que basta una busqueda de seccion aurea. */
  function ajustarT(set, y) {
    var a = 0.05, b = 6, g = (Math.sqrt(5) - 1) / 2, c = b - g * (b - a), d = a + g * (b - a), i;
    function f(beta) { return nll(set, y, 1 / beta); }
    var fc = f(c), fd = f(d);
    for (i = 0; i < 60; i++) {
      if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); }
      else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
    }
    return 1 / ((a + b) / 2);
  }

  function auroc(p, y) {
    var idx = p.map(function (_, i) { return i; }), n1 = 0, n0, s = 0, i, j, rank;
    idx.sort(function (a, b) { return p[a] - p[b]; });
    i = 0;
    while (i < idx.length) {
      j = i;
      while (j + 1 < idx.length && p[idx[j + 1]] === p[idx[i]]) j++;
      rank = (i + j) / 2 + 1;
      for (var k = i; k <= j; k++) if (y[idx[k]]) { s += rank; n1++; }
      i = j + 1;
    }
    n0 = idx.length - n1;
    return (s - n1 * (n1 + 1) / 2) / (n1 * n0);
  }

  function bins(p, y, B) {
    var out = [], i, b;
    for (i = 0; i < B; i++) out.push({ n: 0, sp: 0, sy: 0 });
    for (i = 0; i < p.length; i++) {
      b = Math.min(B - 1, Math.floor(p[i] * B));
      out[b].n++; out[b].sp += p[i]; out[b].sy += y[i];
    }
    return out.map(function (o) { return { n: o.n, conf: o.n ? o.sp / o.n : null, acc: o.n ? o.sy / o.n : null }; });
  }

  function metricas(set, y, T, B) {
    var p = probs(set, T), n = p.length, bs = bins(p, y, B), ece = 0, mce = 0, br = 0, prev = 0, mp = 0, i, g;
    bs.forEach(function (b) {
      if (!b.n) return;
      g = Math.abs(b.acc - b.conf);
      ece += b.n / n * g;
      if (g > mce) mce = g;
    });
    for (i = 0; i < n; i++) { br += (p[i] - y[i]) * (p[i] - y[i]); prev += y[i]; mp += p[i]; }
    prev /= n; mp /= n;
    var cal = pendiente(set, y, T);
    return {
      bins: bs, ece: ece, mce: mce, brier: br / n, nll: nll(set, y, T), auc: auroc(p, y), prev: prev, medio: mp,
      brierRef: prev * (1 - prev), pend: cal.b, inter: cal.a
    };
  }

  /* Regresion logistica del desenlace sobre el logit predicho: logit P(y=1) = a + b * logit(p) (ficha del Atlas). Newton. */
  function pendiente(set, y, T) {
    var a = 0, b = 1, it, i, x, p, w, g0, g1, h00, h01, h11, det, da, db, t, ll0, ll1;
    function ll(A, Bt) {
      var s = 0, k, q;
      for (k = 0; k < set.length; k++) {
        q = Math.min(1 - 1e-12, Math.max(1e-12, sig(A + Bt * set[k].l / T)));
        s += y[k] ? Math.log(q) : Math.log(1 - q);
      }
      return s;
    }
    for (it = 0; it < 60; it++) {
      g0 = g1 = h00 = h01 = h11 = 0;
      for (i = 0; i < set.length; i++) {
        x = set[i].l / T; p = sig(a + b * x); w = p * (1 - p);
        g0 += y[i] - p; g1 += (y[i] - p) * x;
        h00 += w; h01 += w * x; h11 += w * x * x;
      }
      det = h00 * h11 - h01 * h01;
      if (!(det > 1e-12)) break;
      da = (h11 * g0 - h01 * g1) / det; db = (-h01 * g0 + h00 * g1) / det;
      ll0 = ll(a, b); t = 1;
      while (t > 1e-4) {              /* paso amortiguado: solo se acepta si la verosimilitud sube */
        ll1 = ll(a + t * da, b + t * db);
        if (ll1 >= ll0) break;
        t /= 2;
      }
      a += t * da; b += t * db;
      if (Math.abs(t * da) + Math.abs(t * db) < 1e-9) break;
    }
    return { a: a, b: b };
  }

  /* -- La interfaz sigue mas abajo -- */
  var core = { generar: generar, etiquetas: etiquetas, metricas: metricas, ajustarT: ajustarT, nll: nll };
  window.WIDGETS["m05-l03-calibracion"] = function (el) { buildUI(el); };
  window.WIDGETS["m05-l03-calibracion"].core = core;

  function injectStyle() {
    if (document.getElementById("w-cal-style")) return;
    var st = document.createElement("style");
    st.id = "w-cal-style";
    st.textContent = [
      ".w-cal{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cal h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cal .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cal .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-cal .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-cal .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-cal input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-cal select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-cal .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem;color:var(--ink)}",
      ".w-cal .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-cal .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-cal button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-cal button:hover{background:var(--accent-soft)}",
      ".w-cal button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-cal .w-plots{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:0 0 .7rem}",
      ".w-cal svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-cal dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-cal dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-cal dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-cal dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-cal .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-cal .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(x) { return fmt(x * 100, 1) + " %"; }
  function num(x, d) { return (isFinite(x) && Math.abs(x) < 1e4) ? fmt(x, d) : "no definida"; }

  function buildUI(el) {
    injectStyle();
    var id = "w-cal-" + (++uid), data = generar(), T = 1, B = 10, deriva = false, valT = null;
    var yVal = etiquetas(data.val, false);

    el.innerHTML = '<div class="w-cal">' +
      '<h4>Calibración de un modelo de riesgo de reingreso</h4>' +
      '<p class="w-hint">Datos sintéticos de ' + fmt(N, 0) + ' pacientes de validación y ' + fmt(N, 0) + ' de test (ejemplo propio). El modelo da la probabilidad de reingreso a 30 días. La temperatura divide sus logits antes de la sigmoide.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-t">Temperatura T <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="0.3" max="4" step="0.05" value="1"></div>' +
      '<div class="w-f"><label for="' + id + '-b">Tramos (bins)</label><select id="' + id + '-b"><option value="5">5</option><option value="10" selected>10</option><option value="20">20</option><option value="40">40</option></select></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-d"><span>Deriva: la población de test es más grave que la de validación (mayor prevalencia de reingresos)</span></label>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-fit">Escalado de temperatura</button><button type="button" id="' + id + '-reset">Volver a T = 1</button></div>' +
      '<div class="w-plots"><svg id="' + id + '-rel" viewBox="0 0 300 280" role="img" aria-label=""></svg><svg id="' + id + '-his" viewBox="0 0 300 280" role="img" aria-label=""></svg></div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>ECE</dt><dd id="' + id + '-o-ece"></dd></div>' +
      '<div><dt>MCE</dt><dd id="' + id + '-o-mce"></dd></div>' +
      '<div><dt>Brier</dt><dd id="' + id + '-o-br"></dd></div>' +
      '<div><dt>Brier de predecir la prevalencia</dt><dd id="' + id + '-o-ref"></dd></div>' +
      '<div><dt>Log loss</dt><dd id="' + id + '-o-nll"></dd></div>' +
      '<div><dt>AUROC</dt><dd id="' + id + '-o-auc"></dd></div>' +
      '<div><dt>Pendiente (ideal 1)</dt><dd id="' + id + '-o-sl"></dd></div>' +
      '<div><dt>Intercepto (ideal 0)</dt><dd id="' + id + '-o-in"></dd></div>' +
      '<div><dt>Riesgo medio predicho / real</dt><dd id="' + id + '-o-pv"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Las métricas se calculan sobre el conjunto de test. El escalado busca la T que minimiza la log loss en el conjunto de validación, que nunca se usa para puntuar. El círculo de cada tramo crece con el número de pacientes.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inT = $("t"), inB = $("b"), inD = $("d");

    function px(v) { return (40 + v * 240).toFixed(1); }
    function py(v) { return (240 - v * 220).toFixed(1); }

    function drawRel(m) {
      var o = [], i, b, r, pts = [], txt = "";
      o.push('<rect x="40" y="20" width="240" height="220" style="fill:none;stroke:var(--rule-strong)"/>');
      [0, 0.5, 1].forEach(function (v) {
        o.push('<text x="' + px(v) + '" y="256" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + fmt(v, 1) + '</text>');
        o.push('<text x="34" y="' + (Number(py(v)) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:11px">' + fmt(v, 1) + '</text>');
      });
      o.push('<text x="160" y="274" text-anchor="middle" style="fill:var(--muted);font-size:11px">Probabilidad predicha</text>');
      o.push('<text x="10" y="130" text-anchor="middle" transform="rotate(-90 10 130)" style="fill:var(--muted);font-size:11px">Frecuencia observada</text>');
      o.push('<line x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(1) + '" y2="' + py(1) + '" style="stroke:var(--faint);stroke-dasharray:4 4;stroke-width:1.5"/>');
      m.bins.forEach(function (bn) {
        if (!bn.n) return;
        o.push('<line x1="' + px(bn.conf) + '" y1="' + py(bn.conf) + '" x2="' + px(bn.conf) + '" y2="' + py(bn.acc) + '" style="stroke:var(--trap);stroke-width:2.5"/>');
        pts.push(px(bn.conf) + "," + py(bn.acc));
      });
      if (pts.length > 1) o.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:1.5"/>');
      m.bins.forEach(function (bn) {
        if (!bn.n) return;
        r = Math.max(2.5, Math.min(10, 2 + Math.sqrt(bn.n) / 3.2));
        o.push('<circle cx="' + px(bn.conf) + '" cy="' + py(bn.acc) + '" r="' + r.toFixed(1) + '" style="fill:var(--accent);fill-opacity:.75;stroke:var(--accent-ink)"/>');
      });
      o.push('<text x="46" y="34" style="fill:var(--accent-ink);font-size:11px;font-weight:700">Curva de fiabilidad</text>');
      o.push('<text x="274" y="230" text-anchor="end" style="fill:var(--muted);font-size:10px">bajo la diagonal: sobreconfiado</text>');
      $("rel").innerHTML = o.join("");
      $("rel").setAttribute("aria-label", "Curva de fiabilidad con " + B + " tramos: probabilidad predicha frente a frecuencia observada. ECE " + fmt(m.ece, 3) + ".");
    }

    function drawHis(m) {
      var o = [], mx = 0, w = 240 / B, h, i;
      m.bins.forEach(function (bn) { if (bn.n > mx) mx = bn.n; });
      o.push('<rect x="40" y="20" width="240" height="220" style="fill:none;stroke:var(--rule-strong)"/>');
      m.bins.forEach(function (bn, k) {
        h = mx ? 220 * Math.sqrt(bn.n / mx) : 0;   /* raiz cuadrada: si no, el primer tramo aplasta al resto */
        o.push('<rect x="' + (40 + k * w + 0.5).toFixed(1) + '" y="' + (240 - h).toFixed(1) + '" width="' + Math.max(1, w - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" style="fill:var(--ex);fill-opacity:.6"/>');
      });
      [0, 0.5, 1].forEach(function (v) {
        o.push('<text x="' + px(v) + '" y="256" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + fmt(v, 1) + '</text>');
      });
      o.push('<text x="160" y="274" text-anchor="middle" style="fill:var(--muted);font-size:11px">Probabilidad predicha</text>');
      o.push('<text x="40" y="14" style="fill:var(--accent-ink);font-size:11px;font-weight:700">Pacientes por tramo (nitidez, altura en raíz)</text>');
      $("his").innerHTML = o.join("");
      $("his").setAttribute("aria-label", "Histograma de las probabilidades predichas. Cuanto más cerca de 0 y de 1 se agrupan, más nítido es el modelo.");
    }

    function render(msg) {
      var y = etiquetas(data.test, deriva), m = metricas(data.test, y, T, B), notas = [];
      $("tv").textContent = fmt(T, 2);
      $("o-ece").textContent = fmt(m.ece, 3);
      $("o-mce").textContent = fmt(m.mce, 3);
      $("o-br").textContent = fmt(m.brier, 4);
      $("o-ref").textContent = fmt(m.brierRef, 4);
      $("o-nll").textContent = fmt(m.nll, 3);
      $("o-auc").textContent = fmt(m.auc, 3);
      $("o-sl").textContent = num(m.pend, 2);
      $("o-in").textContent = num(m.inter, 2);
      $("o-pv").textContent = pc(m.medio) + " / " + pc(m.prev);
      drawRel(m); drawHis(m);
      if (msg) notas.push(msg);
      if (m.pend < 0.85) notas.push("Pendiente " + num(m.pend, 2) + ": el modelo es demasiado extremo, sobreconfiado. Sube la temperatura.");
      else if (m.pend > 1.15) notas.push("Pendiente " + num(m.pend, 2) + ": el modelo es demasiado tímido, infraconfiado. Baja la temperatura.");
      else notas.push("La pendiente está cerca de 1: la forma de la curva es la correcta.");
      if (Math.abs(m.inter) > 0.25) notas.push("Intercepto " + num(m.inter, 2) + ": el riesgo medio predicho (" + pc(m.medio) + ") no coincide con el real (" + pc(m.prev) + "). La temperatura no lo corrige; hace falta recalibrar el desplazamiento.");
      notas.push("El AUROC no cambia con T (" + fmt(m.auc, 3) + "): la temperatura no altera el orden de los pacientes.");
      $("note").textContent = notas.join(" ");
    }

    inT.addEventListener("input", function () { T = parseFloat(inT.value); render(); });
    inB.addEventListener("change", function () { B = parseInt(inB.value, 10); render(); });
    inD.addEventListener("change", function () { deriva = inD.checked; render(); });
    $("fit").addEventListener("click", function () {
      valT = ajustarT(data.val, yVal);
      T = Math.min(4, Math.max(0.3, Math.round(valT * 100) / 100));
      inT.value = String(T);
      render("T ajustada en validación: " + fmt(valT, 2) + ".");
    });
    $("reset").addEventListener("click", function () { T = 1; inT.value = "1"; render(); });
    render();
  }
})();
