/* Widget "queso-suizo": lonchas con agujeros y trayectorias aleatorias de peligro.
   Cuenta cuantas atraviesan todas las capas en N intentos y lo compara con el producto teorico
   de capas independientes. El eje vertical es circular: un agujero que sale por arriba entra por abajo,
   asi cada capa deja pasar exactamente la fraccion k*s de trayectorias.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-qs-style")) return;
    var st = document.createElement("style");
    st.id = "w-qs-style";
    st.textContent = [
      ".w-qs{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-qs h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-qs .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-qs .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-qs .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-qs .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-qs input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-qs select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-qs .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem;color:var(--ink)}",
      ".w-qs .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-qs .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-qs button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-qs button:hover{background:var(--accent-soft)}",
      ".w-qs button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-qs svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-qs dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-qs dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-qs dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-qs dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-qs .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-qs .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function pct(p) {
    var v = p * 100;
    if (v === 0) return "0 %";
    return fmt(v, v < 0.01 ? 5 : v < 1 ? 3 : 2) + " %";
  }
  function num(a, b) { return a - b; }

  /* k agujeros de tamano size (fraccion de la altura), sin solaparse, en un circulo
     y con giro aleatorio: cada punto queda cubierto con probabilidad exacta k*size. */
  function place(k, size) {
    var free = 1 - k * size, xs = [], a = [], i, u = Math.random();
    for (i = 0; i < k; i++) xs.push(Math.random() * free);
    xs.sort(num);
    for (i = 0; i < k; i++) a.push((xs[i] + i * size + u) % 1);
    return a;
  }
  function covered(a, size, y) {
    var i, d;
    for (i = 0; i < a.length; i++) {
      d = y - a[i];
      if (d < 0) d += 1;
      if (d < size) return true;
    }
    return false;
  }
  /* Longitud exacta del corte de los agujeros de todas las capas (disposicion actual). */
  function exact(layers, size) {
    var pts = [0, 1], i, total = 0, lo, hi, mid, all, l;
    layers.forEach(function (a) {
      a.forEach(function (x) { pts.push(x); pts.push((x + size) % 1); });
    });
    pts.sort(num);
    for (i = 0; i < pts.length - 1; i++) {
      lo = pts[i]; hi = pts[i + 1];
      if (hi - lo < 1e-12) continue;
      mid = (lo + hi) / 2; all = true;
      for (l = 0; l < layers.length; l++) {
        if (!covered(layers[l], size, mid)) { all = false; break; }
      }
      if (all) total += hi - lo;
    }
    return total;
  }

  window.WIDGETS["queso-suizo"] = function (el) {
    injectStyle();
    var id = "w-qs-" + (++uid);
    var L = 3, K = 3, S = 15, N = 1000, reshuffle = false, aligned = false;
    var layers = [];

    el.innerHTML = '<div class="w-qs">' +
      '<h4>Queso suizo</h4>' +
      '<p class="w-hint">Cada loncha es una defensa y cada agujero una debilidad. Un peligro entra con una altura al azar y sigue recto: pasa si encuentra agujero en todas las capas.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-l">Capas <b id="' + id + '-lv"></b></label><input type="range" id="' + id + '-l" min="1" max="6" step="1" value="' + L + '"></div>' +
      '<div class="w-f"><label for="' + id + '-k">Agujeros por capa <b id="' + id + '-kv"></b></label><input type="range" id="' + id + '-k" min="1" max="5" step="1" value="' + K + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Tamaño de cada agujero <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="1" max="40" step="1" value="' + S + '"></div>' +
      '<div class="w-f"><label for="' + id + '-n">Intentos N</label><select id="' + id + '-n"><option value="100">100</option><option value="1000" selected>1000</option><option value="10000">10 000</option><option value="100000">100 000</option></select></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-r"><span>Recolocar los agujeros en cada intento (capas independientes; no se dibujan trayectorias)</span></label>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-a"><span>Alinear los agujeros de todas las capas (causa común: todas fallan por el mismo motivo)</span></label>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Lanzar intentos</button><button type="button" id="' + id + '-new">Recolocar agujeros</button><button type="button" id="' + id + '-avg">Promediar 200 disposiciones</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 220" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Cada capa deja pasar</dt><dd id="' + id + '-o-f"></dd></div>' +
      '<div><dt>Teoría: capas independientes</dt><dd id="' + id + '-o-t"></dd></div>' +
      '<div><dt>Simulado</dt><dd id="' + id + '-o-s"></dd></div>' +
      '<div><dt>Esta disposición, exacto</dt><dd id="' + id + '-o-e"></dd></div>' +
      '<div><dt>Nueves de protección (teoría)</dt><dd id="' + id + '-o-k"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Los agujeros de una capa no se solapan, y los que salen por el borde superior entran por el inferior. La teoría es el producto de lo que deja pasar cada capa; es el promedio sobre todas las disposiciones posibles.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inL = $("l"), inK = $("k"), inS = $("s"), inN = $("n"), inR = $("r"), inA = $("a"), svg = $("svg");

    function size() { return S / 100; }
    function newLayout() {
      var i, first = place(K, size()); layers = [];
      for (i = 0; i < L; i++) layers.push(aligned ? first : (i === 0 ? first : place(K, size())));
    }

    function lx(i) { return L === 1 ? 300 : 100 + i * (400 / (L - 1)); }
    function holeRects(a, x, out) {
      var sz = size(), top = 20, h = 180;
      a.forEach(function (st) {
        var end = st + sz;
        if (end <= 1) {
          out.push('<rect x="' + (x - 12) + '" y="' + (top + st * h).toFixed(1) + '" width="24" height="' + (sz * h).toFixed(1) + '" style="fill:var(--ground)"/>');
        } else {
          out.push('<rect x="' + (x - 12) + '" y="' + (top + st * h).toFixed(1) + '" width="24" height="' + ((1 - st) * h).toFixed(1) + '" style="fill:var(--ground)"/>');
          out.push('<rect x="' + (x - 12) + '" y="' + top + '" width="24" height="' + ((end - 1) * h).toFixed(1) + '" style="fill:var(--ground)"/>');
        }
      });
    }

    function draw(trajs) {
      var out = [], i;
      for (i = 0; i < L; i++) {
        out.push('<rect x="' + (lx(i) - 12) + '" y="20" width="24" height="180" rx="3" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.5"/>');
        holeRects(layers[i], lx(i), out);
      }
      trajs.forEach(function (t) {
        var Y = (20 + t.y * 180).toFixed(1);
        if (t.b < 0) {
          out.push('<line x1="8" y1="' + Y + '" x2="590" y2="' + Y + '" style="stroke:var(--trap);stroke-width:2"/>');
        } else {
          out.push('<line x1="8" y1="' + Y + '" x2="' + (lx(t.b) - 12) + '" y2="' + Y + '" style="stroke:var(--faint);stroke-width:1;opacity:.7"/>');
          out.push('<circle cx="' + (lx(t.b) - 12) + '" cy="' + Y + '" r="2.5" style="fill:var(--faint)"/>');
        }
      });
      svg.innerHTML = out.join("");
      svg.setAttribute("aria-label", L + (L === 1 ? " loncha" : " lonchas") + " con " + K + (K === 1 ? " agujero" : " agujeros") +
        " de " + S + " % de la altura cada uno. " + (reshuffle ? "Sin trayectorias dibujadas." : "Líneas ámbar: trayectorias que atraviesan todas las capas. Líneas grises: bloqueadas."));
    }

    function labels() {
      $("lv").textContent = L;
      $("kv").textContent = K;
      $("sv").textContent = S + " %";
    }

    function run() {
      var i, l, y, lay, blocked, pass = 0, trajs = [], sz = size(), f = Math.min(1, K * sz), shared;
      for (i = 0; i < N; i++) {
        y = Math.random(); blocked = -1;
        if (reshuffle && aligned) shared = place(K, sz);
        for (l = 0; l < L; l++) {
          lay = reshuffle ? (aligned ? shared : place(K, sz)) : layers[l];
          if (!covered(lay, sz, y)) { blocked = l; break; }
        }
        if (blocked < 0) pass++;
        if (!reshuffle && i < 40) trajs.push({ y: y, b: blocked });
      }
      var theo = Math.pow(f, L), ex = exact(layers, sz), sim = pass / N;
      $("o-f").textContent = pct(f);
      $("o-t").textContent = pct(theo) + " (≈ " + fmt(N * theo, 1) + " de " + fmt(N, 0) + ")";
      $("o-s").textContent = pct(sim) + " (" + fmt(pass, 0) + " de " + fmt(N, 0) + ")";
      $("o-e").textContent = reshuffle ? "no se usa en este modo" : pct(ex);
      $("o-k").textContent = theo > 0 ? fmt(-Math.log10(theo), 2) : "∞";
      var sd = Math.sqrt(N * theo * (1 - theo)), note = $("note");
      if (reshuffle) {
        var z = sd > 0 ? Math.abs(pass - N * theo) / sd : 0;
        note.textContent = aligned
          ? "Con los agujeros alineados las capas no suman protección: pasa casi lo que deja pasar una sola (" + pct(f) + "), muy por encima de la teoría de capas independientes (" + pct(theo) + ")."
          : "Cada intento tiene su propia disposición, así que las capas son independientes. La diferencia con la teoría es ruido de muestreo: " +
            fmt(z, 1) + " desviaciones típicas (lo normal es menos de 2). Repite para verlo oscilar.";
      } else if (ex === 0) {
        note.textContent = "En esta disposición no hay ningún túnel: los agujeros no se alinean en todas las capas y no pasa ningún intento. La teoría (" + pct(theo) +
          ") es el promedio sobre todas las disposiciones posibles; pulsa \"Recolocar agujeros\" hasta que aparezca alguno.";
      } else {
        note.textContent = "Con estos agujeros fijos, lo simulado tiende al valor exacto de esta disposición (" + pct(ex) +
          "), que puede quedar por encima o por debajo de la teoría. Recoloca los agujeros varias veces y verás que la teoría es el promedio.";
      }
      draw(trajs);
    }

    function fresh() { newLayout(); labels(); run(); }

    inL.addEventListener("input", function () { L = parseInt(inL.value, 10); fresh(); });
    inK.addEventListener("input", function () {
      K = parseInt(inK.value, 10);
      var mx = Math.floor(80 / K);
      inS.max = String(mx);
      if (S > mx) { S = mx; inS.value = String(S); }
      fresh();
    });
    inS.addEventListener("input", function () { S = parseInt(inS.value, 10); fresh(); });
    inN.addEventListener("change", function () { N = parseInt(inN.value, 10); run(); });
    inR.addEventListener("change", function () {
      reshuffle = inR.checked;
      if (reshuffle && N < 10000) { N = 10000; inN.value = "10000"; }
      run();
    });
    inA.addEventListener("change", function () { aligned = inA.checked; fresh(); });
    $("avg").addEventListener("click", function () {
      var t, sum = 0, pass = 0, per = Math.min(N, 500), i, l, y, ok, sz = size(), f = Math.min(1, K * sz), theo = Math.pow(f, L);
      for (t = 0; t < 200; t++) {
        newLayout();
        sum += exact(layers, sz);
        for (i = 0; i < per; i++) {
          y = Math.random(); ok = true;
          for (l = 0; l < L; l++) { if (!covered(layers[l], sz, y)) { ok = false; break; } }
          if (ok) pass++;
        }
      }
      run();
      $("note").textContent = "Promedio de 200 disposiciones distintas: exacto medio " + pct(sum / 200) + ", frecuencia simulada en " + fmt(200 * per, 0) +
        " intentos " + pct(pass / (200 * per)) + ", teoría " + pct(theo) + ". Con capas independientes coinciden; con los agujeros alineados el promedio sube a " + pct(f) + " (una sola capa).";
    });
    $("go").addEventListener("click", run);
    $("new").addEventListener("click", fresh);

    inS.max = String(Math.floor(80 / K));
    fresh();
  };
})();
