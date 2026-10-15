/* Widget "proceso-multiplicativo": compara un proceso aditivo (media de k factores) con uno multiplicativo
   (producto de los mismos k factores) y dibuja sus histogramas. Sin dependencias.
   Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, M = 2000, KMAX = 30, BINS = 32;

  function injectStyle() {
    if (document.getElementById("w-pm-style")) return;
    var st = document.createElement("style");
    st.id = "w-pm-style";
    st.textContent = [
      ".w-pm{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pm h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pm .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pm .w-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem 1rem;margin:0 0 .8rem;align-items:end}",
      ".w-pm label{display:block;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.3rem}",
      ".w-pm label b{color:var(--accent-ink);font-size:.9rem;letter-spacing:0}",
      ".w-pm input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-pm .w-chk{display:flex;align-items:center;gap:.4rem;font:500 .88rem var(--sans);text-transform:none;letter-spacing:0;color:var(--ink);margin:0}",
      ".w-pm button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .8rem;cursor:pointer}",
      ".w-pm button:hover{background:var(--accent-soft)}",
      ".w-pm :focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
      ".w-pm .w-tt{font:600 .78rem var(--cond);margin:.5rem 0 .25rem}",
      ".w-pm svg{display:block;width:100%;height:auto;background:var(--ground);border:1px solid var(--rule);border-radius:8px}",
      ".w-pm table{width:100%;border-collapse:collapse;font-size:.86rem;margin:.8rem 0 .6rem}",
      ".w-pm th,.w-pm td{padding:.3rem .5rem;border-bottom:1px solid var(--rule);text-align:right;white-space:nowrap}",
      ".w-pm th:first-child,.w-pm td:first-child{text-align:left;white-space:normal}",
      ".w-pm thead th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-pm td.w-a{color:var(--ex);font-weight:600}.w-pm td.w-b{color:var(--trap);font-weight:600}",
      ".w-pm .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-pm .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function fx(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function sorted(x) { return x.slice().sort(function (p, q) { return p - q; }); }
  function quant(s, p) { return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

  window.WIDGETS["proceso-multiplicativo"] = function (el) {
    injectStyle();
    var id = "w-pm-" + (++uid);
    var k = 12, amp = 0.6, seed = 1, useLog = false, U = [];

    el.innerHTML = '<div class="w-pm">' +
      '<h4>Proceso aditivo frente a multiplicativo</h4>' +
      '<p class="w-hint">Cada factor es un número al azar entre 1 − a y 1 + a (media 1). Aditivo: la media de k factores. Multiplicativo: el producto de esos mismos k factores.</p>' +
      '<div class="w-ctl">' +
      '<div><label for="' + id + '-k">Factores k: <b id="' + id + '-kv"></b></label><input type="range" id="' + id + '-k" min="1" max="' + KMAX + '" step="1" value="' + k + '"></div>' +
      '<div><label for="' + id + '-a">Amplitud a: <b id="' + id + '-av"></b></label><input type="range" id="' + id + '-a" min="0.1" max="0.9" step="0.05" value="' + amp + '"></div>' +
      '<div><label class="w-chk"><input type="checkbox" id="' + id + '-l"> Eje en logaritmo</label></div>' +
      '<div><button type="button" id="' + id + '-b">Nuevas muestras</button> <span class="w-hint" id="' + id + '-s"></span></div>' +
      '</div>' +
      '<div class="w-tt">Aditivo: media de los factores</div><svg id="' + id + '-h1" viewBox="0 0 560 150" role="img" aria-label="Histograma aditivo"></svg>' +
      '<div class="w-tt">Multiplicativo: producto de los factores</div><svg id="' + id + '-h2" viewBox="0 0 560 150" role="img" aria-label="Histograma multiplicativo"></svg>' +
      '<table><thead><tr><th scope="col">' + M + ' muestras</th><th scope="col">Aditivo</th><th scope="col">Multiplicativo</th></tr></thead><tbody id="' + id + '-t"></tbody></table>' +
      '<p class="w-note" id="' + id + '-m" aria-live="polite"></p>' +
      '<p class="w-cap">Línea discontinua: media teórica (1). Línea continua: mediana de la muestra. Cada gráfico tiene su propio eje horizontal y su propia altura; en el multiplicativo en escala lineal, los valores más allá del 99,5 % se agrupan en la última barra. Simulación propia de la lección, con datos inventados.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function gen() {
      var r = mulberry(seed * 104729 + 7), i, j, row;
      U = [];
      for (i = 0; i < M; i++) { row = []; for (j = 0; j < KMAX; j++) row.push(r()); U.push(row); }
    }

    function share(x) {
      var s = sorted(x), n = s.length, c = Math.max(1, Math.round(n / 100)), tot = 0, top = 0, i;
      for (i = 0; i < n; i++) tot += s[i];
      for (i = n - c; i < n; i++) top += s[i];
      return top / tot;
    }

    function hist(svg, x, lo, hi, color, aria) {
      var W = 560, H = 150, l = 10, r = 10, t = 8, b = 26, cnt = [], i, v, bi, mx = 0, s = sorted(x);
      for (i = 0; i < BINS; i++) cnt.push(0);
      for (i = 0; i < x.length; i++) {
        v = useLog ? Math.log(x[i]) : x[i];
        bi = Math.floor((v - lo) / (hi - lo) * BINS);
        cnt[Math.max(0, Math.min(BINS - 1, bi))]++;
      }
      for (i = 0; i < BINS; i++) if (cnt[i] > mx) mx = cnt[i];
      function X(u) { u = useLog ? Math.log(Math.max(u, 1e-12)) : u; return l + Math.max(0, Math.min(1, (u - lo) / (hi - lo))) * (W - l - r); }
      function inr(u) { u = useLog ? Math.log(u) : u; return u >= lo && u <= hi; }
      var bw = (W - l - r) / BINS, g = "", h;
      for (i = 0; i < BINS; i++) {
        h = mx ? cnt[i] / mx * (H - t - b) : 0;
        g += '<rect x="' + (l + i * bw + 0.5).toFixed(1) + '" y="' + (H - b - h).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" style="fill:' + color + ';opacity:.75"/>';
      }
      g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + (H - b) + '" y2="' + (H - b) + '" style="stroke:var(--rule-strong)"/>' +
        (inr(1) ? '<line x1="' + X(1).toFixed(1) + '" x2="' + X(1).toFixed(1) + '" y1="' + t + '" y2="' + (H - b) + '" style="stroke:var(--muted);stroke-width:1.5;stroke-dasharray:5 4"/>' : '') +
        '<line x1="' + X(quant(s, 0.5)).toFixed(1) + '" x2="' + X(quant(s, 0.5)).toFixed(1) + '" y1="' + t + '" y2="' + (H - b) + '" style="stroke:var(--accent);stroke-width:2"/>';
      var ti, tv, tx;
      for (ti = 0; ti <= 4; ti++) {
        tv = lo + (hi - lo) * ti / 4;
        if (useLog) tv = Math.exp(tv);
        tx = l + ti / 4 * (W - l - r);
        g += '<text x="' + tx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (ti === 0 ? "start" : ti === 4 ? "end" : "middle") + '" style="fill:var(--muted);font-size:13px">' + fx(tv, tv < 0.1 ? 3 : tv < 10 ? 2 : 1) + '</text>';
      }
      svg.innerHTML = g;
      svg.setAttribute("aria-label", aria + " Mediana " + fx(quant(s, 0.5), 2) + ", máximo " + fx(s[s.length - 1], 2) + ".");
    }

    function update() {
      var add = [], mul = [], i, j, p, sm, f, ta, tm;
      for (i = 0; i < M; i++) {
        p = 1; sm = 0;
        for (j = 0; j < k; j++) { f = 1 + amp * (2 * U[i][j] - 1); p *= f; sm += f; }
        add.push(sm / k); mul.push(p);
      }
      var sa = sorted(add), sm2 = sorted(mul), la, ha, lm, hm;
      if (useLog) {
        la = Math.log(sa[0]); ha = Math.log(sa[M - 1]); lm = Math.log(sm2[0]); hm = Math.log(sm2[M - 1]);
      } else {
        la = sa[0]; ha = sa[M - 1]; lm = 0; hm = Math.max(1.5, quant(sm2, 0.995));
      }
      if (ha - la < 1e-6) { la -= 0.05; ha += 0.05; }
      hist($("h1"), add, la, ha, "var(--ex)", "Histograma del proceso aditivo.");
      hist($("h2"), mul, lm, hm, "var(--trap)", "Histograma del proceso multiplicativo.");
      var ma = add.reduce(function (u, v) { return u + v; }, 0) / M, mm = mul.reduce(function (u, v) { return u + v; }, 0) / M;
      $("kv").textContent = k; $("av").textContent = fx(amp, 2); $("s").textContent = "Semilla " + seed;
      ta = share(add); tm = share(mul);
      $("t").innerHTML =
        '<tr><th scope="row">Media</th><td class="w-a">' + fx(ma, 2) + '</td><td class="w-b">' + fx(mm, 2) + '</td></tr>' +
        '<tr><th scope="row">Mediana</th><td class="w-a">' + fx(quant(sa, 0.5), 2) + '</td><td class="w-b">' + fx(quant(sm2, 0.5), 2) + '</td></tr>' +
        '<tr><th scope="row">Valor máximo</th><td class="w-a">' + fx(sa[M - 1], 2) + '</td><td class="w-b">' + fx(sm2[M - 1], 2) + '</td></tr>' +
        '<tr><th scope="row">Parte del total del 1 % más alto</th><td class="w-a">' + fx(ta * 100, 1) + ' %</td><td class="w-b">' + fx(tm * 100, 1) + ' %</td></tr>';
      $("m").textContent = k === 1 ? "Con un solo factor los dos procesos son el mismo." :
        "Con k = " + k + " y a = " + fx(amp, 2) + ": el 1 % más alto del multiplicativo aporta el " + fx(tm * 100, 1) + " % del total (aditivo: " + fx(ta * 100, 1) + " %). En el multiplicativo la mediana (" + fx(quant(sm2, 0.5), 2) + ") queda por debajo de la media (" + fx(mm, 2) + ").";
    }

    $("k").addEventListener("input", function (e) { k = parseInt(e.target.value, 10); update(); });
    $("a").addEventListener("input", function (e) { amp = parseFloat(e.target.value); update(); });
    $("l").addEventListener("change", function (e) { useLog = e.target.checked; update(); });
    $("b").addEventListener("click", function () { seed++; gen(); update(); });
    gen();
    update();
  };
})();
