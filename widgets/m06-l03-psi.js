/* Simulador "m06-l03-psi": una variable (edad de los pacientes, sintetica) en la linea base y en un lote.
   Linea base: 85 % de adultos N(62,4; 15,4) y 15 % de jovenes N(27; 5). Cifras propias, inspiradas en los controles de la demo
   de Vigia (edad media 62,4, dispersion 15,4, jovenes 15 %); no reproducen su generador.
   Lote: la media de los adultos se desplaza, su dispersion se multiplica y el peso de los jovenes cambia.
   Los 10 tramos son los deciles de la linea base, congelados (Atlas, ficha PSI). PSI = suma (P - Q) ln(P / Q), con Q minimo 0,0001.
   KS: mayor distancia vertical entre las dos funciones de distribucion acumuladas (Atlas, ficha KS); p-valor asintotico
   con la correccion de Stephens (calculo propio, estandar). Exactitud por tramo: perfil propio para ver que deriva no es dano.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var MA = 62.4, SA = 15.4, MY = 27, SY = 5, W0 = 0.15;
  var K = 10, FLOOR = 0.0001, NMAX = 10000;
  var PERFILES = {
    plano: [0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88, 0.88],
    joven: [0.60, 0.80, 0.925, 0.925, 0.925, 0.925, 0.925, 0.925, 0.925, 0.925]
  };
  var CONCEPTO = 0.08;   /* caida de acierto en todos los tramos si cambia la relacion entrada-salida */
  var UMBRAL_CAIDA = 0.10;

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pct(x, d) { return fmt(x * 100, d) + " %"; }

  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
      t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? r : 2 - r;
  }
  function phi(x) { return 0.5 * erfc(-x / Math.SQRT2); }
  function cdf(x, p) {
    return (1 - p.w) * phi((x - (MA + p.shift)) / (SA * p.disp)) + p.w * phi((x - MY) / SY);
  }
  function pdf(x, p) {
    var s = SA * p.disp, a = (x - (MA + p.shift)) / s, b = (x - MY) / SY, c = 1 / Math.sqrt(2 * Math.PI);
    return (1 - p.w) * c * Math.exp(-a * a / 2) / s + p.w * c * Math.exp(-b * b / 2) / SY;
  }
  var BASE = { shift: 0, disp: 1, w: W0 };

  /* Cortes de los deciles de la linea base, por biseccion sobre su funcion de distribucion. */
  var EDGES = (function () {
    var out = [], k, lo, hi, mid, i;
    for (k = 1; k < K; k++) {
      lo = -50; hi = 200;
      for (i = 0; i < 80; i++) { mid = (lo + hi) / 2; if (cdf(mid, BASE) < k / K) lo = mid; else hi = mid; }
      out.push((lo + hi) / 2);
    }
    return out;
  })();

  function psiDe(Q) {
    var s = 0, i, q, pp = 1 / K;
    for (i = 0; i < K; i++) { q = Math.max(Q[i], FLOOR); s += (pp - q) * Math.log(pp / q); }
    return s;
  }
  /* p-valor asintotico de Kolmogorov con n casos (correccion de Stephens). */
  function pKS(d, n) {
    var sn = Math.sqrt(n), lam = (sn + 0.12 + 0.11 / sn) * d, s = 0, k, t;
    if (lam < 0.27) return 1;
    for (k = 1; k <= 100; k++) {
      t = Math.exp(-2 * k * k * lam * lam);
      s += (k % 2 ? 1 : -1) * t;
      if (t < 1e-12) break;
    }
    return Math.min(1, Math.max(0, 2 * s));
  }
  function ksExacto(p) {
    var d = 0, x, v;
    for (x = -20; x <= 140; x += 0.05) { v = Math.abs(cdf(x, BASE) - cdf(x, p)); if (v > d) d = v; }
    return d;
  }
  function tramoDe(x) {
    var i = 0;
    while (i < K - 1 && x >= EDGES[i]) i++;
    return i;
  }
  function accPerfil(Q, perfil, concepto) {
    var i, s = 0, pr = PERFILES[perfil];
    for (i = 0; i < K; i++) s += Q[i] * (pr[i] - (concepto ? CONCEPTO : 0));
    return s;
  }
  var SEMI = { U: [], Z: [] };
  function nuevaSemilla() {
    var i, u1, u2;
    SEMI.U = []; SEMI.Z = [];
    for (i = 0; i < NMAX; i++) {
      u1 = Math.random() || 1e-12; u2 = Math.random();
      SEMI.U.push(Math.random());
      SEMI.Z.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
    }
  }
  function muestra(p, n) {
    var xs = [], i;
    for (i = 0; i < n; i++) xs.push(SEMI.U[i] < p.w ? MY + SY * SEMI.Z[i] : MA + p.shift + SA * p.disp * SEMI.Z[i]);
    return xs;
  }

  /* Todo el calculo, sin DOM. p = {shift, disp, w, n, sample, perfil, concepto}. */
  function calc(p) {
    var Q = [], i, xs = null, D, cnt, prev = 0, c;
    if (p.sample) {
      xs = muestra(p, p.n);
      cnt = []; for (i = 0; i < K; i++) cnt.push(0);
      xs.forEach(function (x) { cnt[tramoDe(x)]++; });
      for (i = 0; i < K; i++) Q.push(cnt[i] / p.n);
      var s = xs.slice().sort(function (a, b) { return a - b; }), f, d1, d2;
      D = 0;
      for (i = 0; i < s.length; i++) {
        f = cdf(s[i], BASE);
        d1 = (i + 1) / s.length - f; d2 = f - i / s.length;
        D = Math.max(D, d1, d2);
      }
    } else {
      for (i = 0; i < K; i++) {
        c = i < K - 1 ? cdf(EDGES[i], p) : 1;
        Q.push(c - prev); prev = c;
      }
      D = ksExacto(p);
    }
    var acc0 = accPerfil(BASE_Q, p.perfil, false), acc1 = accPerfil(Q, p.perfil, p.concepto);
    var contrib = Q.map(function (q) { var qq = Math.max(q, FLOOR), pp = 1 / K; return (pp - qq) * Math.log(pp / qq); });
    return { Q: Q, xs: xs, psi: psiDe(Q), contrib: contrib, D: D, pval: pKS(D, p.n), acc0: acc0, acc1: acc1, caida: acc0 - acc1,
             ruido: (K - 1) / p.n };
  }
  var BASE_Q = (function () { var a = [], i; for (i = 0; i < K; i++) a.push(1 / K); return a; })();

  function injectStyle() {
    if (document.getElementById("w-ps-style")) return;
    var st = document.createElement("style");
    st.id = "w-ps-style";
    st.textContent = [
      ".w-ps{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-ps h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-ps .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-ps .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-ps .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-ps .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-ps input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-ps select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-ps .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .6rem;color:var(--ink)}",
      ".w-ps .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-ps .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-ps button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-ps button:hover{background:var(--accent-soft)}",
      ".w-ps svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-ps dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-ps dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-ps dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-ps dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-ps dl.w-out dd.w-warn{color:var(--trap)}",
      ".w-ps .w-tw{overflow-x:auto;margin:0 0 .8rem}",
      ".w-ps table{width:100%;border-collapse:collapse;font-size:.84rem}",
      ".w-ps th,.w-ps td{text-align:right;padding:.25rem .5rem;border-bottom:1px solid var(--rule);white-space:nowrap}",
      ".w-ps th:first-child,.w-ps td:first-child{text-align:left}",
      ".w-ps th{font:600 .66rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-ps .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-ps .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function initWidget(el) {
    injectStyle();
    if (!SEMI.U.length) nuevaSemilla();
    var id = "w-ps-" + (++uid);
    var S = { shift: 10, disp: 1, w: 15, n: 450, sample: false, perfil: "plano", concepto: false };
    var SL = [
      { k: "shift", et: "Desplazamiento de la media de los adultos", min: -15, max: 15, step: 1, u: " años" },
      { k: "disp", et: "Dispersión de los adultos", min: 0.5, max: 1.8, step: 0.1, u: " ×" },
      { k: "w", et: "Jóvenes en el lote (línea base: 15 %)", min: 0, max: 50, step: 1, u: " %" }
    ];
    var h = '<div class="w-ps"><h4>Deriva de una variable: PSI y KS</h4>' +
      '<p class="w-hint">Edad de los pacientes (sintética, propia). La línea base se divide en 10 tramos con el mismo número de casos cada uno. Mueve el lote y mira cuánto cambian el PSI, el KS y el acierto del modelo.</p><div class="w-grid">';
    SL.forEach(function (s) {
      h += '<div class="w-f"><label for="' + id + '-' + s.k + '">' + s.et + ' <b id="' + id + '-' + s.k + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + s.k + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + S[s.k] + '"></div>';
    });
    h += '<div class="w-f"><label for="' + id + '-n">Casos del lote</label><select id="' + id + '-n">' +
      '<option value="100">100</option><option value="450" selected>450</option><option value="2000">2000</option><option value="10000">10 000</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-perfil">Dónde acierta el modelo</label><select id="' + id + '-perfil">' +
      '<option value="plano">Igual en todos los tramos (0,88)</option><option value="joven">Peor en los tramos de jóvenes</option></select></div></div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-s"><span>Usar una muestra aleatoria del lote (si no, población: lo que verías con infinitos casos)</span></label>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-c"><span>Cambia también la relación entrada-salida: el modelo acierta 0,08 menos en todos los tramos (deriva de concepto)</span></label>' +
      '<div class="w-btns"><button type="button" id="' + id + '-re">Remuestrear</button><button type="button" id="' + id + '-p0">Sin deriva</button>' +
      '<button type="button" id="' + id + '-p1">Jóvenes al 33 % (caso de Vigía)</button><button type="button" id="' + id + '-p2">Solo cambia el concepto</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 320" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>PSI</dt><dd id="' + id + '-o-psi"></dd></div>' +
      '<div><dt>KS: D</dt><dd id="' + id + '-o-d"></dd></div>' +
      '<div><dt>KS: p-valor con n casos</dt><dd id="' + id + '-o-p"></dd></div>' +
      '<div><dt>Exactitud: línea base y lote</dt><dd id="' + id + '-o-a"></dd></div>' +
      '<div><dt>Caída de exactitud</dt><dd id="' + id + '-o-k"></dd></div>' +
      '</dl><p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<div class="w-tw"><table><thead><tr><th>Tramo (edad)</th><th>Línea base</th><th>Lote</th><th>Aporte al PSI</th><th>Acierto</th></tr></thead><tbody id="' + id + '-tb"></tbody></table></div>' +
      '<p class="w-cap">Umbrales del Atlas para el PSI: por debajo de 0,1 sin cambio relevante, de 0,1 a 0,25 cambio moderado, por encima de 0,25 cambio significativo. El KS no tiene umbral universal para D, y aquí compara el lote con la línea base como si esta fuera conocida (una muestra contra una distribución): con una línea base también muestreada, el D necesario para ser significativo es √2 veces mayor. La exactitud del simulador es exacta porque el perfil de acierto lo fijamos nosotros; en producción sin etiquetas solo puede estimarse. El umbral de 0,10 de caída es el de model_quality_score en la configuración de referencia de Vigía (Atlas).</p></div>';
    el.innerHTML = h;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    function tramoTxt(i) {
      if (i === 0) return "< " + fmt(EDGES[0], 1);
      if (i === K - 1) return "≥ " + fmt(EDGES[K - 2], 1);
      return fmt(EDGES[i - 1], 1) + " a " + fmt(EDGES[i], 1);
    }
    function banda(v) { return v < 0.1 ? "sin cambio relevante" : v <= 0.25 ? "cambio moderado" : "cambio significativo"; }

    function grafico(r, p) {
      var o = [], x0 = 40, x1 = 580, XMAX = 110, i, x, y, ymax = 0, pb = { shift: 0, disp: 1, w: W0 };
      function X(v) { return x0 + (x1 - x0) * v / XMAX; }
      for (x = 0; x <= XMAX; x += 1) ymax = Math.max(ymax, pdf(x, pb), pdf(x, p));
      ymax *= 1.08;
      function Y(v) { return 150 - 130 * v / ymax; }
      o.push('<text x="40" y="12" style="fill:var(--faint);font-size:10px;font-weight:700">EDAD (AÑOS): DENSIDAD Y CORTES DE LOS 10 TRAMOS</text>');
      o.push('<line x1="' + x0 + '" y1="150" x2="' + x1 + '" y2="150" style="stroke:var(--rule-strong)"/>');
      for (x = 0; x <= XMAX; x += 20) o.push('<text x="' + X(x) + '" y="163" text-anchor="middle" style="fill:var(--faint);font-size:10px">' + x + '</text>');
      EDGES.forEach(function (e) { o.push('<line x1="' + X(e).toFixed(1) + '" y1="20" x2="' + X(e).toFixed(1) + '" y2="150" style="stroke:var(--rule-strong);stroke-dasharray:3 3"/>'); });
      if (p.sample) {
        var bw = 5, nb = XMAX / bw, cn = [], b;
        for (b = 0; b < nb; b++) cn.push(0);
        r.xs.forEach(function (v) { b = Math.floor(v / bw); if (b >= 0 && b < nb) cn[b]++; });
        cn.forEach(function (c, j) {
          var d = c / p.n / bw, yy = Math.min(Y(d), 150);
          o.push('<rect x="' + X(j * bw).toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + ((x1 - x0) * bw / XMAX - 1).toFixed(1) + '" height="' + (150 - yy).toFixed(1) + '" style="fill:var(--accent);opacity:.35"/>');
        });
      } else {
        var pts = [];
        for (x = 0; x <= XMAX; x += 1) pts.push(X(x).toFixed(1) + "," + Y(pdf(x, p)).toFixed(1));
        o.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      }
      var pb2 = [];
      for (x = 0; x <= XMAX; x += 1) pb2.push(X(x).toFixed(1) + "," + Y(pdf(x, pb)).toFixed(1));
      o.push('<polyline points="' + pb2.join(" ") + '" style="fill:none;stroke:var(--muted);stroke-width:2;stroke-dasharray:6 3"/>');
      o.push('<text x="576" y="30" text-anchor="end" style="fill:var(--muted);font-size:10px">guiones: línea base</text>');
      o.push('<text x="576" y="44" text-anchor="end" style="fill:var(--accent-ink);font-size:10px">línea continua: lote</text>');
      /* barras por tramo */
      var qmax = 0.2, bwid = (x1 - x0) / K;
      r.Q.forEach(function (q) { qmax = Math.max(qmax, q * 1.1); });
      function Y2(v) { return 300 - 100 * v / qmax; }
      o.push('<text x="40" y="188" style="fill:var(--faint);font-size:10px;font-weight:700">PROPORCIÓN DE CASOS EN CADA TRAMO (línea base 10 % en todos)</text>');
      o.push('<line x1="' + x0 + '" y1="300" x2="' + x1 + '" y2="300" style="stroke:var(--rule-strong)"/>');
      r.Q.forEach(function (q, j) {
        var bx = x0 + j * bwid, top = Y2(q);
        o.push('<rect x="' + (bx + 6).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + (bwid - 12).toFixed(1) + '" height="' + (300 - top).toFixed(1) + '" style="fill:var(--accent);opacity:.8"/>');
        o.push('<text x="' + (bx + bwid / 2).toFixed(1) + '" y="313" text-anchor="middle" style="fill:var(--faint);font-size:10px">' + (j + 1) + '</text>');
      });
      o.push('<line x1="' + x0 + '" y1="' + Y2(0.1).toFixed(1) + '" x2="' + x1 + '" y2="' + Y2(0.1).toFixed(1) + '" style="stroke:var(--trap);stroke-width:1.5;stroke-dasharray:6 3"/>');
      o.push('<text x="576" y="' + (Y2(0.1) - 4).toFixed(1) + '" text-anchor="end" style="fill:var(--trap);font-size:10px">10 % (línea base)</text>');
      $("svg").innerHTML = o.join("");
      $("svg").setAttribute("aria-label", "Arriba, densidad de la edad en la línea base y en el lote con los cortes de los diez tramos. Abajo, proporción de casos del lote en cada tramo frente al 10 % de la línea base. PSI " + fmt(r.psi, 3) + ", D de KS " + fmt(r.D, 3) + ".");
    }

    function render() {
      var p = { shift: S.shift, disp: S.disp, w: S.w / 100, n: S.n, sample: S.sample, perfil: S.perfil, concepto: S.concepto };
      var r = calc(p), i, rows = [], pr = PERFILES[S.perfil], dd;
      SL.forEach(function (s) { $(s.k + "v").textContent = (s.k === "disp" ? fmt(S[s.k], 1) : S[s.k]) + s.u; });
      $("o-psi").textContent = fmt(r.psi, 3) + " (" + banda(r.psi) + ")";
      $("o-psi").className = r.psi >= 0.1 ? "w-warn" : "";
      $("o-d").textContent = fmt(r.D, 3);
      $("o-p").textContent = r.pval < 0.001 ? "< 0,001" : fmt(r.pval, 3);
      $("o-a").textContent = fmt(r.acc0, 3) + " → " + fmt(r.acc1, 3);
      dd = r.caida;
      $("o-k").textContent = fmt(dd, 3) + (dd >= UMBRAL_CAIDA ? " (supera 0,10)" : "");
      $("o-k").className = dd >= UMBRAL_CAIDA ? "w-warn" : "";
      for (i = 0; i < K; i++) {
        rows.push("<tr><td>" + (i + 1) + ". " + tramoTxt(i) + "</td><td>10,0 %</td><td>" + pct(r.Q[i], 1) + "</td><td>" + fmt(r.contrib[i], 4) + "</td><td>" +
          fmt(pr[i] - (S.concepto ? CONCEPTO : 0), 3) + "</td></tr>");
      }
      $("tb").innerHTML = rows.join("");
      var msg, sube = r.psi >= 0.1, cae = dd >= UMBRAL_CAIDA;
      if (sube && cae) msg = "La entrada se ha movido y la calidad cae: deriva de datos con daño. Es el caso que sí pide actuar.";
      else if (sube) msg = "PSI en " + banda(r.psi) + " y la caída de exactitud es de " + fmt(dd, 3) + ", por debajo de 0,10: la entrada ha cambiado y el modelo sigue acertando. Es una zona de vigilancia, no de reentrenamiento inmediato (Atlas).";
      else if (cae) msg = "La entrada apenas se ha movido (PSI bajo) y la calidad cae: la deriva de datos no lo explica, sospecha de deriva de concepto. Un PSI bajo no garantiza que todo vaya bien.";
      else msg = "Ni la entrada ni la calidad se mueven de forma relevante. Prueba a desplazar la media o a subir el peso de los jóvenes.";
      if (S.sample) {
        msg += " Con " + fmt(S.n, 0) + " casos y sin deriva alguna, el PSI esperado con 10 tramos ronda " + fmt(r.ruido, 3) + " (propio: 9 dividido entre n) y el KS sale significativo en un 5 % de las muestras. Pulsa «Remuestrear» varias veces.";
      } else {
        msg += " El p-valor supone un lote de " + fmt(S.n, 0) + " casos: cambia el tamaño y verás que D no se mueve y el p-valor sí.";
      }
      $("note").textContent = msg;
      grafico(r, p);
    }

    SL.forEach(function (s) {
      $(s.k).addEventListener("input", function () { S[s.k] = parseFloat(this.value); render(); });
    });
    $("n").addEventListener("change", function () { S.n = parseInt(this.value, 10); render(); });
    $("perfil").addEventListener("change", function () { S.perfil = this.value; render(); });
    $("s").addEventListener("change", function () { S.sample = this.checked; render(); });
    $("c").addEventListener("change", function () { S.concepto = this.checked; render(); });
    $("re").addEventListener("click", function () { nuevaSemilla(); render(); });
    function fija(o) {
      var k;
      for (k in o) S[k] = o[k];
      SL.forEach(function (s) { $(s.k).value = S[s.k]; });
      $("n").value = String(S.n); $("perfil").value = S.perfil; $("s").checked = S.sample; $("c").checked = S.concepto;
      render();
    }
    $("p0").addEventListener("click", function () { fija({ shift: 0, disp: 1, w: 15, concepto: false }); });
    $("p1").addEventListener("click", function () { fija({ shift: 0, disp: 1, w: 33, perfil: "joven", concepto: false }); });
    $("p2").addEventListener("click", function () { fija({ shift: 0, disp: 1, w: 15, concepto: true }); });
    render();
  }


  window.WIDGETS["m06-l03-psi"] = function (el) { initWidget(el); };
  window.WIDGETS["m06-l03-psi"].calc = calc;
  window.WIDGETS["m06-l03-psi"].edges = EDGES;
  window.WIDGETS["m06-l03-psi"].seed = nuevaSemilla;
})();
