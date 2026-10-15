/* Simulador "m05-l04-saliencia": radiografia sintetica de 8x8 con la marca de un hospital en la esquina.
   Clasificador lineal (regresion logistica) entrenado aqui mismo con datos sinteticos propios, y tres formas de "explicarlo":
   gradiente x entrada, gradiente solo y un detector de bordes (que no usa el modelo). Permite tapar bloques de 2x2 (oclusion)
   y ver como cambia la prediccion. Tres modelos: A aprende el atajo de la marca, B se entrena sin esa correlacion y C es aleatorio.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  var W = (typeof window !== "undefined") ? window : (globalThis.window = globalThis.window || {});
  W.WIDGETS = W.WIDGETS || {};
  var uid = 0;
  var S = 8, D = S * S;

  /* --- Datos sinteticos (propios) --- */
  var PULMON = 0.25, TORAX = 0.55, MARCA = 0.95, RUIDO = 0.10, LESION_MEDIA = 0.12, LESION_SD = 0.06;
  var MARCA_R0 = 0, MARCA_C0 = 0;                       /* marca: bloque 2x2 arriba a la izquierda */
  var LES_R = [2, 3, 4], LES_C = [4, 5];                /* esquinas posibles de la lesion 2x2, en el pulmon derecho de la imagen */
  var PREV = 0.475, PREV_H1 = 0.85, PREV_H2 = 0.10;      /* prevalencia global; hospital 1 (con marca) y hospital 2 (sin marca) */

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function sig(x) { return 1 / (1 + Math.exp(-x)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* Una imagen: vector de 64 con el orden fila a fila. lesion y marca son booleanos. */
  function imagen(r, lesion, marca) {
    var x = new Array(D), i, j, rr, cc, r0, c0, amp;
    for (i = 0; i < S; i++) for (j = 0; j < S; j++) {
      x[i * S + j] = (i >= 2 && i <= 6 && ((j >= 1 && j <= 3) || (j >= 4 && j <= 6))) ? PULMON : TORAX;
    }
    r0 = LES_R[Math.floor(r() * LES_R.length)]; c0 = LES_C[Math.floor(r() * LES_C.length)];
    amp = Math.max(0, LESION_MEDIA + LESION_SD * normal(r));   /* se sortea siempre: activar o no la lesion no cambia el ruido */
    if (lesion) {
      for (rr = 0; rr < 2; rr++) for (cc = 0; cc < 2; cc++) x[(r0 + rr) * S + c0 + cc] += amp;
    }
    if (marca) for (rr = 0; rr < 2; rr++) for (cc = 0; cc < 2; cc++) x[(MARCA_R0 + rr) * S + MARCA_C0 + cc] = MARCA;
    for (i = 0; i < D; i++) x[i] = clamp01(x[i] + RUIDO * normal(r));
    return x;
  }

  /* Conjuntos: "hospitales" reproduce el reparto del entrenamiento de A (la marca casi siempre viene con neumonia);
     "nuevo" es un hospital donde la marca no tiene relacion con la enfermedad; "limpio" es el entrenamiento de B. */
  function conjunto(tipo, n, semilla) {
    var r = mulberry(semilla), X = [], y = [], k, h1, les, marca;
    for (k = 0; k < n; k++) {
      if (tipo === "hospitales") { h1 = r() < 0.5; les = r() < (h1 ? PREV_H1 : PREV_H2); marca = h1; }
      else { les = r() < PREV; marca = r() < 0.5; }
      X.push(imagen(r, les, marca)); y.push(les ? 1 : 0);
    }
    return { X: X, y: y };
  }

  /* Regresion logistica por Newton (IRLS) con L2 solo en los pesos. Devuelve { w, b }. */
  function entrenar(set, lambda) {
    var n = set.X.length, P = D + 1, th = new Array(P).fill(0), it, i, j, k, z, p, wgt, H, g, a;
    for (it = 0; it < 12; it++) {
      H = []; g = new Array(P).fill(0);
      for (j = 0; j < P; j++) H.push(new Array(P).fill(0));
      for (i = 0; i < n; i++) {
        z = th[D]; for (j = 0; j < D; j++) z += th[j] * set.X[i][j];
        p = sig(z); wgt = p * (1 - p) + 1e-9;
        for (j = 0; j < P; j++) {
          a = (j < D ? set.X[i][j] : 1);
          g[j] += (set.y[i] - p) * a;
          for (k = j; k < P; k++) H[j][k] += wgt * a * (k < D ? set.X[i][k] : 1);
        }
      }
      for (j = 0; j < D; j++) { g[j] -= lambda * th[j]; H[j][j] += lambda; }
      for (j = 0; j < P; j++) for (k = 0; k < j; k++) H[j][k] = H[k][j];
      var d = resolver(H, g), m = 0;
      for (j = 0; j < P; j++) { th[j] += d[j]; m += Math.abs(d[j]); }
      if (m < 1e-8) break;
    }
    return { w: th.slice(0, D), b: th[D] };
  }
  function resolver(A, b) {
    var n = b.length, M = A.map(function (f, i) { return f.concat([b[i]]); }), i, j, k, p, t, f;
    for (i = 0; i < n; i++) {
      p = i; for (j = i + 1; j < n; j++) if (Math.abs(M[j][i]) > Math.abs(M[p][i])) p = j;
      t = M[i]; M[i] = M[p]; M[p] = t;
      for (j = i + 1; j < n; j++) { f = M[j][i] / M[i][i]; for (k = i; k <= n; k++) M[j][k] -= f * M[i][k]; }
    }
    var x = new Array(n);
    for (i = n - 1; i >= 0; i--) { x[i] = M[i][n]; for (j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j]; x[i] /= M[i][i]; }
    return x;
  }

  function logit(m, x) { var z = m.b, i; for (i = 0; i < D; i++) z += m.w[i] * x[i]; return z; }
  function acierto(m, set) {
    var c = 0, i; for (i = 0; i < set.X.length; i++) if ((logit(m, set.X[i]) > 0 ? 1 : 0) === set.y[i]) c++;
    return c / set.X.length;
  }

  /* --- Mapas de saliencia --- */
  function bordes(x) {
    var s = new Array(D), i, j, a, b, c, d;
    function v(r, q) { r = Math.max(0, Math.min(S - 1, r)); q = Math.max(0, Math.min(S - 1, q)); return x[r * S + q]; }
    for (i = 0; i < S; i++) for (j = 0; j < S; j++) {
      a = v(i, j + 1) - v(i, j - 1); b = v(i + 1, j) - v(i - 1, j);
      s[i * S + j] = Math.sqrt(a * a + b * b);
    }
    return s;
  }
  function saliencia(metodo, m, x) {
    var s = new Array(D), i;
    if (metodo === "gxe") for (i = 0; i < D; i++) s[i] = m.w[i] * x[i];
    else if (metodo === "grad") for (i = 0; i < D; i++) s[i] = m.w[i];
    else s = bordes(x);
    return s;
  }
  /* Reparto del valor absoluto del mapa: marca, zona de la lesion (filas 2 a 5, columnas 4 a 6) y resto. */
  function enMarca(i) { var r = Math.floor(i / S), c = i % S; return r < 2 && c < 2; }
  function enZona(i) { var r = Math.floor(i / S), c = i % S; return r >= 2 && r <= 5 && c >= 4 && c <= 6; }
  function reparto(s) {
    var t = 0, a = 0, z = 0, i, v;
    for (i = 0; i < D; i++) { v = Math.abs(s[i]); t += v; if (enMarca(i)) a += v; else if (enZona(i)) z += v; }
    if (t === 0) return { marca: 0, zona: 0, resto: 0 };
    return { marca: a / t, zona: z / t, resto: 1 - a / t - z / t };
  }
  /* Tapar bloques de 2x2 con un valor de relleno. tapados: lista de indices de bloque 0..15 (fila de bloque * 4 + columna). */
  function tapar(x, tapados, relleno) {
    var y = x.slice(), b, r, c, i, j;
    tapados.forEach(function (bl) {
      r = Math.floor(bl / 4) * 2; c = (bl % 4) * 2;
      for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) y[(r + i) * S + c + j] = relleno;
    });
    return y;
  }

  /* --- Modelos: A (atajo), B (limpio), C (aleatorio) --- */
  var cache = null;
  function modelos() {
    if (cache) return cache;
    var trA = conjunto("hospitales", 2000, 101), trB = conjunto("limpio", 2000, 202);
    var te1 = conjunto("hospitales", 2000, 303), te2 = conjunto("nuevo", 2000, 404);
    var A = entrenar(trA, 20), B = entrenar(trB, 20);
    function aleatorio(semilla) {
      var r = mulberry(semilla), w = [], i;
      for (i = 0; i < D; i++) w.push(0.5 * normal(r));
      return { w: w, b: -0.3 * w.reduce(function (s, v) { return s + v; }, 0) };
    }
    /* C es el modelo aleatorio que se puede elegir; R es otro distinto, solo para la prueba de cordura (comparar mapas). */
    var out = { A: A, B: B, C: aleatorio(505), R: aleatorio(606) };
    ["A", "B", "C"].forEach(function (k) { out[k].hosp = acierto(out[k], te1); out[k].nuevo = acierto(out[k], te2); });
    cache = out; return out;
  }

  var core = {
    imagen: imagen, conjunto: conjunto, entrenar: entrenar, logit: logit, acierto: acierto, saliencia: saliencia,
    reparto: reparto, enMarca: enMarca, enZona: enZona, tapar: tapar, modelos: modelos, mulberry: mulberry, sig: sig, S: S, D: D
  };

  /* -- La interfaz sigue mas abajo -- */
  var UI = { build: buildUI };
  W.WIDGETS["m05-l04-saliencia"] = function (el) { UI.build(el, core); };
  W.WIDGETS["m05-l04-saliencia"].core = core;

  function injectStyle() {
    if (document.getElementById("w-sal-style")) return;
    var st = document.createElement("style");
    st.id = "w-sal-style";
    st.textContent = [
      ".w-sal{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-sal h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-sal .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-sal .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-sal .w-f label{display:block;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-sal select{width:100%;font:500 .9rem var(--sans);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-sal .w-chk{display:inline-flex;align-items:center;gap:.45rem;margin:0 1rem .6rem 0;color:var(--ink)}",
      ".w-sal .w-chk input{accent-color:var(--accent)}",
      ".w-sal .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-sal button.w-b{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-sal button.w-b:hover{background:var(--accent-soft)}",
      ".w-sal .w-panels{display:flex;flex-wrap:wrap;gap:1rem 1.4rem;margin:0 0 .7rem}",
      ".w-sal .w-panel{flex:1 1 13rem;max-width:17rem}",
      ".w-sal .w-panel h5{font:600 .72rem/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0 0 .35rem}",
      ".w-sal .w-blocks,.w-sal .w-map{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;aspect-ratio:1;background:var(--rule)}",
      ".w-sal .w-map{grid-template-columns:repeat(8,1fr);gap:1px;border:1px solid var(--rule)}",
      ".w-sal .w-blk{display:grid;grid-template-columns:1fr 1fr;padding:0;border:0;margin:0;cursor:pointer;background:none;outline-offset:-3px}",
      ".w-sal .w-blk span{display:block}",
      ".w-sal .w-blk[aria-pressed=true]{outline:3px solid var(--accent)}",
      ".w-sal .w-blk:focus-visible{outline:3px solid var(--ink)}",
      ".w-sal .w-map i{display:block;background-color:var(--surface)}",
      ".w-sal .w-leg{font-size:.76rem;color:var(--muted);margin:.35rem 0 0}",
      ".w-sal .w-leg b.r{color:#C0392B}.w-sal .w-leg b.a{color:#2C6FC2}",
      ".w-sal dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-sal dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-sal dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-sal dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-sal .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-sal .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }
  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pc(p) { return fmt(p * 100, 1) + " %"; }
  function corr(a, b) {
    var n = a.length, ma = 0, mb = 0, i, sa = 0, sb = 0, sab = 0;
    for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    for (i = 0; i < n; i++) { sa += (a[i] - ma) * (a[i] - ma); sb += (b[i] - mb) * (b[i] - mb); sab += (a[i] - ma) * (b[i] - mb); }
    return (sa > 0 && sb > 0) ? sab / Math.sqrt(sa * sb) : 0;
  }

  function buildUI(el, C) {
    injectStyle();
    var id = "w-sal-" + (++uid), M = C.modelos();
    var st = { modelo: "A", metodo: "gxe", relleno: 0, lesion: false, marca: true, sem: 1, tapados: [] };
    var ZONA = [6, 7, 10, 11];
    el.innerHTML = '<div class="w-sal">' +
      '<h4>Saliencia y oclusión en una radiografía sintética</h4>' +
      '<p class="w-hint">Radiografía de 8×8 píxeles (datos sintéticos propios). El clasificador dice "neumonía" o "sano". A la izquierda, lo que ve el modelo: haz clic en un bloque de 2×2 para taparlo. A la derecha, el mapa de saliencia del método elegido.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-m">Modelo</label><select id="' + id + '-m">' +
      '<option value="A">A: con la marca correlacionada</option><option value="B">B: sin esa correlación</option><option value="C">C: aleatorio, sin entrenar</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-t">Método de saliencia</label><select id="' + id + '-t">' +
      '<option value="gxe">Gradiente × entrada</option><option value="grad">Gradiente solo</option><option value="bor">Detector de bordes (sin modelo)</option></select></div>' +
      '<div class="w-f"><label for="' + id + '-f">Al tapar, rellenar con</label><select id="' + id + '-f"><option value="0">Negro (0)</option><option value="0.5">Gris medio (0,5)</option></select></div>' +
      '</div>' +
      '<div><label class="w-chk"><input type="checkbox" id="' + id + '-l"><span>Hay lesión (neumonía real)</span></label>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-k" checked><span>Lleva la marca del hospital</span></label></div>' +
      '<div class="w-btns"><button type="button" class="w-b" id="' + id + '-r">Otro ruido</button>' +
      '<button type="button" class="w-b" id="' + id + '-tm">Tapar la marca</button>' +
      '<button type="button" class="w-b" id="' + id + '-tz">Tapar la zona de la lesión</button>' +
      '<button type="button" class="w-b" id="' + id + '-q">Quitar tapas</button></div>' +
      '<div class="w-panels">' +
      '<div class="w-panel"><h5>Lo que ve el modelo</h5><div class="w-blocks" id="' + id + '-b" role="group" aria-label="Imagen en 16 bloques de 2 por 2 píxeles"></div></div>' +
      '<div class="w-panel"><h5>Mapa de saliencia</h5><div class="w-map" id="' + id + '-p" role="img" aria-label=""></div>' +
      '<p class="w-leg"><b class="r">Rojo</b>: empuja hacia neumonía. <b class="a">Azul</b>: empuja hacia sano. Más intenso, más peso.</p></div>' +
      '</div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Probabilidad de neumonía</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Tapando lo elegido</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Reparto del mapa</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Parecido con el mapa de un modelo aleatorio</dt><dd id="' + id + '-o4"></dd></div>' +
      '<div><dt>Acierto: hospitales de entrenamiento</dt><dd id="' + id + '-o5"></dd></div>' +
      '<div><dt>Acierto: hospital nuevo</dt><dd id="' + id + '-o6"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-n" aria-live="polite"></p>' +
      '<p class="w-cap">"Marca" es el bloque de arriba a la izquierda; "zona de la lesión" son las filas 3 a 6 y las columnas 5 a 8 (contando desde 1). Con gradiente × entrada y relleno negro, el mapa de un modelo lineal reparte exactamente el logit, así que la caída al tapar coincide con lo que suma el mapa en ese bloque.</p>' +
      '</div>';
    function $(k) { return el.querySelector("#" + id + "-" + k); }
    var blocks = $("b"), map = $("p"), blk = [], cells = [], i, j, b, sp, c;
    for (b = 0; b < 16; b++) {
      c = document.createElement("button"); c.type = "button"; c.className = "w-blk"; c.setAttribute("aria-pressed", "false");
      c.setAttribute("aria-label", "Bloque fila " + (Math.floor(b / 4) + 1) + ", columna " + (b % 4 + 1) + ": tapar o destapar");
      c.dataset.b = b;
      for (j = 0; j < 4; j++) { sp = document.createElement("span"); c.appendChild(sp); }
      blocks.appendChild(c); blk.push(c);
    }
    for (i = 0; i < 64; i++) { c = document.createElement("i"); map.appendChild(c); cells.push(c); }
    function blockPixels(bl) {
      var r0 = Math.floor(bl / 4) * 2, c0 = (bl % 4) * 2;
      return [r0 * 8 + c0, r0 * 8 + c0 + 1, (r0 + 1) * 8 + c0, (r0 + 1) * 8 + c0 + 1];
    }
    function gris(v) { var g = Math.round(255 * v); return "rgb(" + g + "," + g + "," + g + ")"; }

    function render() {
      var m = M[st.modelo], x = C.imagen(C.mulberry(1000 + st.sem), st.lesion, st.marca), z = C.logit(m, x), p = C.sig(z);
      var met = st.metodo === "bor" ? "bordes" : st.metodo;
      var s = C.saliencia(met, m, x), sC = C.saliencia(met, M.R, x);
      var xt = C.tapar(x, st.tapados, st.relleno), pt = C.sig(C.logit(m, xt)), rep = C.reparto(s), mx = 0, k, a, v, ti = 0, col;
      for (k = 0; k < 64; k++) { a = Math.abs(s[k]); if (a > mx) { mx = a; ti = k; } }
      for (b = 0; b < 16; b++) {
        var px = blockPixels(b), tap = st.tapados.indexOf(b) >= 0;
        for (k = 0; k < 4; k++) blk[b].children[k].style.background = gris(tap ? st.relleno : x[px[k]]);
        blk[b].setAttribute("aria-pressed", tap ? "true" : "false");
      }
      for (k = 0; k < 64; k++) {
        v = mx > 0 ? Math.min(1, Math.abs(s[k]) / mx) * 0.92 : 0;
        col = (s[k] >= 0 ? "rgba(192,57,43," : "rgba(44,111,194,") + v.toFixed(3) + ")";
        cells[k].style.backgroundImage = "linear-gradient(" + col + "," + col + ")";
        cells[k].title = "fila " + (Math.floor(k / 8) + 1) + ", columna " + (k % 8 + 1) + ": " + fmt(s[k], 2);
      }
      map.setAttribute("aria-label", "Mapa de saliencia de 8 por 8. Máximo en fila " + (Math.floor(ti / 8) + 1) + ", columna " + (ti % 8 + 1) + (C.enMarca(ti) ? ", en la marca del hospital" : C.enZona(ti) ? ", en la zona de la lesión" : ""));
      $("o1").textContent = pc(p) + (p > 0.5 ? " (dice neumonía)" : " (dice sano)");
      $("o2").textContent = st.tapados.length ? pc(pt) + " (" + (pt - p >= 0 ? "+" : "") + fmt((pt - p) * 100, 1) + " puntos)" : "nada tapado";
      $("o3").textContent = "marca " + fmt(rep.marca * 100, 0) + " % · lesión " + fmt(rep.zona * 100, 0) + " % · resto " + fmt(rep.resto * 100, 0) + " %";
      $("o4").textContent = fmt(corr(s, sC), 2);
      $("o5").textContent = pc(m.hosp);
      $("o6").textContent = pc(m.nuevo);
      var msg = [];
      if (st.metodo === "bor") msg.push("Este mapa no usa el modelo: cambia de modelo y comprueba que no se mueve (su parecido con el de un modelo aleatorio es 1,00).");
      else if (st.metodo === "grad") msg.push("Es el mismo mapa para cualquier imagen: en un modelo lineal, el gradiente son los pesos. Marca la lesión y la marca y verás que no cambia.");
      else if (st.modelo === "C") msg.push("Los pesos son aleatorios: el mapa sale casi sin orden. Un buen método debe cambiar cuando cambia el modelo.");
      if (st.modelo === "A" && st.marca && !st.lesion && p > 0.5) msg.push("Paciente sano con la marca: el modelo A dice neumonía. Mira dónde carga el mapa y tapa la marca.");
      if (st.tapados.length) msg.push("Al tapar " + st.tapados.length + " bloque" + (st.tapados.length > 1 ? "s" : "") + " la probabilidad pasa de " + pc(p) + " a " + pc(pt) + ".");
      $("n").textContent = msg.join(" ") || "Prueba a tapar la marca o cambia de modelo.";
    }
    function fija(k, fn) { $(k).addEventListener("change", function (e) { fn(e.target); render(); }); }
    fija("m", function (t) { st.modelo = t.value; });
    fija("t", function (t) { st.metodo = t.value; });
    fija("f", function (t) { st.relleno = parseFloat(t.value); });
    fija("l", function (t) { st.lesion = t.checked; });
    fija("k", function (t) { st.marca = t.checked; });
    $("r").addEventListener("click", function () { st.sem++; render(); });
    $("tm").addEventListener("click", function () { st.tapados = [0]; render(); });
    $("tz").addEventListener("click", function () { st.tapados = ZONA.slice(); render(); });
    $("q").addEventListener("click", function () { st.tapados = []; render(); });
    blocks.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest(".w-blk") : null, n, at;
      if (!t) return;
      n = parseInt(t.dataset.b, 10); at = st.tapados.indexOf(n);
      if (at >= 0) st.tapados.splice(at, 1); else st.tapados.push(n);
      render();
    });
    render();
  }
})();
