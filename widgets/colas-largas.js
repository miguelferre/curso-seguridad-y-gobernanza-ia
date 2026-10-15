/* Widget "colas-largas": compara una muestra de cola fina (normal) con una de cola larga (Pareto).
   Media acumulada al crecer N y cuota del total del 1 % de valores más altos. Semilla fija.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, MAXN = 5000, MEDIA = 100, SD = 15;

  function injectStyle() {
    if (document.getElementById("w-cl-style")) return;
    var st = document.createElement("style");
    st.id = "w-cl-style";
    st.textContent = [
      ".w-cl{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cl h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cl .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cl .w-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem 1rem;margin:0 0 .8rem;align-items:end}",
      ".w-cl label{display:block;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.3rem}",
      ".w-cl label b{color:var(--accent-ink);font-size:.9rem;letter-spacing:0}",
      ".w-cl input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-cl button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .8rem;cursor:pointer}",
      ".w-cl button:hover{background:var(--accent-soft)}",
      ".w-cl :focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
      ".w-cl svg{display:block;width:100%;height:auto;background:var(--ground);border:1px solid var(--rule);border-radius:8px}",
      ".w-cl .w-leg{display:flex;flex-wrap:wrap;gap:.4rem 1.2rem;margin:.5rem 0 .8rem;font-size:.82rem;color:var(--muted)}",
      ".w-cl .w-sw{display:inline-block;width:.9rem;height:.28rem;border-radius:2px;vertical-align:middle;margin-right:.35rem}",
      ".w-cl table{width:100%;border-collapse:collapse;font-size:.86rem;margin:0 0 .6rem}",
      ".w-cl th,.w-cl td{padding:.3rem .5rem;border-bottom:1px solid var(--rule);text-align:right;white-space:nowrap}",
      ".w-cl th:first-child,.w-cl td:first-child{text-align:left;white-space:normal}",
      ".w-cl thead th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-cl td.w-a{color:var(--ex);font-weight:600}.w-cl td.w-b{color:var(--trap);font-weight:600}",
      ".w-cl .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-cl .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
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
  function ce(n) { return Math.ceil(n); }

  window.WIDGETS["colas-largas"] = function (el) {
    injectStyle();
    var id = "w-cl-" + (++uid);
    var alfa = 1.3, n = 2000, seed = 1, U = [], Z = [];

    el.innerHTML = '<div class="w-cl">' +
      '<h4>Colas largas frente a colas finas</h4>' +
      '<p class="w-hint">Dos muestras con la misma media teórica (100): una campana (normal) y una Pareto de cola larga. Cambia α y N, o pide otras muestras.</p>' +
      '<div class="w-ctl">' +
      '<div><label for="' + id + '-a">Alfa (α) de la Pareto: <b id="' + id + '-av"></b></label><input type="range" id="' + id + '-a" min="1.1" max="4" step="0.05" value="' + alfa + '"></div>' +
      '<div><label for="' + id + '-n">N (muestras): <b id="' + id + '-nv"></b></label><input type="range" id="' + id + '-n" min="10" max="' + MAXN + '" step="10" value="' + n + '"></div>' +
      '<div><button type="button" id="' + id + '-b">Nuevas muestras</button> <span class="w-hint" id="' + id + '-s"></span></div>' +
      '</div>' +
      '<svg id="' + id + '-c" viewBox="0 0 560 250" role="img" aria-label="Media acumulada"></svg>' +
      '<div class="w-leg"><span><i class="w-sw" style="background:var(--ex)"></i>Campana (cola fina)</span><span><i class="w-sw" style="background:var(--trap)"></i>Pareto (cola larga)</span><span><i class="w-sw" style="background:var(--muted);height:0;border-top:2px dashed var(--muted)"></i>Media teórica (100)</span></div>' +
      '<table><thead><tr><th scope="col">Con N muestras</th><th scope="col">Campana</th><th scope="col">Pareto</th></tr></thead><tbody id="' + id + '-t"></tbody></table>' +
      '<p class="w-note" id="' + id + '-m" aria-live="polite"></p>' +
      '<p class="w-cap">La media acumulada es la media de las primeras k muestras. El eje vertical se recorta en 500: si la Pareto lo supera al principio, la línea se dibuja plana arriba. Simulación propia de la lección (datos inventados, semilla fija por pulsación).</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function gen() {
      var r = mulberry(seed * 7919 + 13), i, u1, u2;
      U = []; Z = [];
      for (i = 0; i < MAXN; i++) {
        u1 = 1 - r(); u2 = r();
        U.push(1 - r());
        Z.push(Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2));
      }
    }

    function stats(x) {
      var s = x.slice().sort(function (a, b) { return a - b; });
      var m = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      var k = Math.max(1, Math.round(n / 100)), top = 0, tot = 0, i;
      for (i = 0; i < n; i++) tot += s[i];
      for (i = n - k; i < n; i++) top += s[i];
      return { mean: tot / n, med: m, max: s[n - 1], share: top / tot };
    }

    function cum(x) {
      var out = [], t = 0, i;
      for (i = 0; i < n; i++) { t += x[i]; out.push(t / (i + 1)); }
      return out;
    }

    function draw(a, b) {
      var W = 560, H = 250, l = 46, r = 10, t = 10, bt = 30, i, mx = MEDIA * 1.5;
      for (i = 0; i < n; i++) { if (a[i] > mx) mx = a[i]; if (b[i] > mx) mx = b[i]; }
      var ymax = Math.min(500, Math.max(150, ce(mx * 1.05 / 50) * 50));
      function X(k) { return l + (k / n) * (W - l - r); }
      function Y(v) { return t + (1 - Math.min(v, ymax) / ymax) * (H - t - bt); }
      function path(x) {
        var step = Math.max(1, Math.floor(n / 300)), d = "", k;
        for (k = 0; k < n; k += step) d += (d ? "L" : "M") + X(k + 1).toFixed(1) + "," + Y(x[k]).toFixed(1);
        return d + "L" + X(n).toFixed(1) + "," + Y(x[n - 1]).toFixed(1);
      }
      var g = "", v, tick = ymax > 300 ? 100 : 50;
      for (v = 0; v <= ymax; v += tick) {
        g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" style="stroke:var(--rule)"/>' +
          '<text x="' + (l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:13px">' + v + '</text>';
      }
      g += '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + Y(MEDIA) + '" y2="' + Y(MEDIA) + '" style="stroke:var(--muted);stroke-width:1.5;stroke-dasharray:5 4"/>' +
        '<path d="' + path(a) + '" style="fill:none;stroke:var(--ex);stroke-width:2.2"/>' +
        '<path d="' + path(b) + '" style="fill:none;stroke:var(--trap);stroke-width:2.2"/>' +
        '<text x="' + l + '" y="' + (H - 8) + '" style="fill:var(--muted);font-size:13px">1</text>' +
        '<text x="' + (W - r) + '" y="' + (H - 8) + '" text-anchor="end" style="fill:var(--muted);font-size:13px">N = ' + fx(n, 0) + '</text>' +
        '<text x="' + ((l + W - r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" style="fill:var(--muted);font-size:13px">muestras usadas</text>';
      var c = $("c");
      c.innerHTML = g;
      c.setAttribute("aria-label", "Media acumulada de 1 a " + fx(n, 0) + " muestras. La campana termina en " + fx(a[n - 1], 1) + " y la Pareto en " + fx(b[n - 1], 1) + ".");
    }

    function update() {
      var A = [], B = [], i, xm = MEDIA * (alfa - 1) / alfa;
      for (i = 0; i < n; i++) {
        A.push(MEDIA + SD * Z[i]);
        B.push(xm / Math.pow(U[i], 1 / alfa));
      }
      var sa = stats(A), sb = stats(B);
      $("av").textContent = fx(alfa, 2);
      $("nv").textContent = fx(n, 0);
      $("s").textContent = "Semilla " + seed;
      draw(cum(A), cum(B));
      $("t").innerHTML =
        '<tr><th scope="row">Media de la muestra</th><td class="w-a">' + fx(sa.mean, 1) + '</td><td class="w-b">' + fx(sb.mean, 1) + '</td></tr>' +
        '<tr><th scope="row">Mediana</th><td class="w-a">' + fx(sa.med, 1) + '</td><td class="w-b">' + fx(sb.med, 1) + '</td></tr>' +
        '<tr><th scope="row">Valor máximo</th><td class="w-a">' + fx(sa.max, 0) + '</td><td class="w-b">' + fx(sb.max, 0) + '</td></tr>' +
        '<tr><th scope="row">Parte del total del 1 % más alto</th><td class="w-a">' + fx(sa.share * 100, 1) + ' %</td><td class="w-b">' + fx(sb.share * 100, 1) + ' %</td></tr>';
      $("m").textContent = "Con N = " + fx(n, 0) + ": el 1 % más alto de la Pareto aporta el " + fx(sb.share * 100, 1) +
        " % del total y el de la campana el " + fx(sa.share * 100, 1) + " %. " +
        (alfa <= 2 ? "Con α ≤ 2 la varianza teórica de la Pareto no existe, y la media de la muestra sigue moviéndose al añadir datos." :
          "Con α alta la cola es cada vez menos pesada y la Pareto se acerca a una cola fina.");
    }

    $("a").addEventListener("input", function (e) { alfa = parseFloat(e.target.value); update(); });
    $("n").addEventListener("input", function (e) { n = parseInt(e.target.value, 10); update(); });
    $("b").addEventListener("click", function () { seed++; gen(); update(); });
    gen();
    update();
  };
})();
