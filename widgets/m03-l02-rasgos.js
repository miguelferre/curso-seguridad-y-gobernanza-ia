/* Simulador "m03-l02-rasgos": contagio en una planta hospitalaria como transición de fase.
   Modelo PROPIO (no es del libro): rejilla de 30 x 30 camas, cada cama contacta con sus 4 vecinas y, con una
   probabilidad "atajos", con otra cama al azar (personal que se mueve entre habitaciones). Cada contacto transmite
   con probabilidad T una sola vez. Es percolación de enlaces: en una rejilla cuadrada sin atajos el umbral teórico
   es 0,5 (dato estándar de la física estadística, no del libro).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var L = 30, N = L * L;
  var CORR = 100;       // corridas por punto de la curva
  var ESTAD = 300;      // corridas para las estadísticas del T actual
  var GRANDE = 0.10;    // un brote es grande si supera este porcentaje de la planta

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      var t;
      a = (a + 0x6D2B79F5) | 0;
      t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function construir(s, r) {
    var adj = [], i, x, y, j;
    for (i = 0; i < N; i++) adj.push([]);
    for (y = 0; y < L; y++) {
      for (x = 0; x < L; x++) {
        i = y * L + x;
        if (x < L - 1) { adj[i].push(i + 1); adj[i + 1].push(i); }
        if (y < L - 1) { adj[i].push(i + L); adj[i + L].push(i); }
      }
    }
    for (i = 0; i < N; i++) {
      if (r() < s) {
        j = Math.floor(r() * N);
        if (j !== i) { adj[i].push(j); adj[j].push(i); }
      }
    }
    return adj;
  }

  function brote(adj, T, r, inicio) {
    var inf = new Uint8Array(N), q = [inicio], h = 0, v, k, i;
    inf[inicio] = 1;
    while (h < q.length) {
      v = q[h++];
      for (k = 0; k < adj[v].length; k++) {
        i = adj[v][k];
        if (!inf[i] && r() < T) { inf[i] = 1; q.push(i); }
      }
    }
    return { n: q.length, inf: inf, inicio: inicio };
  }

  function estadisticas(adj, T, r, R) {
    var sum = 0, big = 0, mn = N, mx = 0, k, o;
    for (k = 0; k < R; k++) {
      o = brote(adj, T, r, Math.floor(r() * N));
      sum += o.n; if (o.n > GRANDE * N) big++;
      if (o.n < mn) mn = o.n; if (o.n > mx) mx = o.n;
    }
    return { media: sum / R / N, grandes: big / R, min: mn, max: mx };
  }

  function curva(adj, seed) {
    var r = rng(seed), pts = [], t, e;
    for (t = 0; t <= 50; t++) {
      e = estadisticas(adj, t / 50, r, CORR);
      pts.push({ T: t / 50, media: e.media, grandes: e.grandes });
    }
    return pts;
  }

  /* T en el que la fraccion media cruza el 50 %, por interpolacion lineal. */
  function umbral(pts) {
    var i, a, b;
    for (i = 1; i < pts.length; i++) {
      if (pts[i].media >= 0.5) {
        a = pts[i - 1]; b = pts[i];
        return a.T + (0.5 - a.media) / (b.media - a.media) * (b.T - a.T);
      }
    }
    return null;
  }

  var nucleo = { rng: rng, construir: construir, brote: brote, estadisticas: estadisticas, curva: curva, umbral: umbral, L: L, N: N };

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function pct(p, d) { return fmt(p * 100, d === undefined ? 1 : d) + " %"; }

  function injectStyle() {
    if (document.getElementById("w-ra-style")) return;
    var st = document.createElement("style");
    st.id = "w-ra-style";
    st.textContent = [
      ".w-ra{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-ra h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-ra .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-ra .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-ra .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-ra .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-ra input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-ra .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-ra button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-ra button:hover{background:var(--accent-soft)}",
      ".w-ra button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-ra .w-vis{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.8rem;margin:0 0 .8rem;align-items:start}",
      ".w-ra svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-ra .w-vis figcaption{color:var(--faint);font-size:.76rem;margin:.25rem 0 0}",
      ".w-ra figure{margin:0}",
      ".w-ra dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10.5rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-ra dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-ra dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-ra dl.w-out dd{margin:0;font:600 1.02rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-ra .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-ra .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m03-l02-rasgos"] = function (el) {
    injectStyle();
    var id = "w-ra-" + (++uid);
    var T = 40, S = 0, semilla = 11, corrida = 5;
    var adj, pts, thr, ultimo;

    el.innerHTML = '<div class="w-ra">' +
      '<h4>Contagio en una planta: un umbral que lo cambia todo</h4>' +
      '<p class="w-hint">Planta de 30 x 30 camas. Cada cama contacta con sus cuatro vecinas y cada contacto transmite con probabilidad T. Empieza un solo paciente (contorno oscuro). Modelo propio de juguete, no clínico.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-t">Transmisión por contacto (T) <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="0" max="100" step="1" value="' + T + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Atajos del personal <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="0" max="100" step="5" value="' + S + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Nuevo brote</button><button type="button" id="' + id + '-new">Otra planta (otros atajos)</button></div>' +
      '<div class="w-vis">' +
      '<figure><svg id="' + id + '-g" viewBox="0 0 300 300" role="img" aria-label=""></svg><figcaption>Un brote: camas infectadas en ámbar.</figcaption></figure>' +
      '<figure><svg id="' + id + '-c" viewBox="0 0 400 300" role="img" aria-label=""></svg><figcaption>Curva de 51 valores de T, 100 brotes por valor (línea continua: fracción media infectada; discontinua: brotes que superan el 10 % de la planta).</figcaption></figure>' +
      '</div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Este brote</dt><dd id="' + id + '-o1"></dd></div>' +
      '<div><dt>Media de 300 brotes</dt><dd id="' + id + '-o2"></dd></div>' +
      '<div><dt>Brotes grandes (más del 10 %)</dt><dd id="' + id + '-o3"></dd></div>' +
      '<div><dt>Del más pequeño al mayor</dt><dd id="' + id + '-o4"></dd></div>' +
      '<div><dt>Umbral (media al 50 %)</dt><dd id="' + id + '-o5"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Cada contacto se intenta una sola vez, desde el primer extremo que se infecta. Sin atajos, la teoría de la percolación sitúa el umbral en 0,5 para una rejilla infinita; en 30 x 30 la subida es algo más suave. Con los atajos al 100 %, cada cama abre un contacto extra con otra elegida al azar.</p>' +
      '</div>';

    function $(k) { return el.querySelector("#" + id + "-" + k); }
    var inT = $("t"), inS = $("s"), svgG = $("g"), svgC = $("c");

    function otraPlanta() {
      adj = construir(S / 100, rng(semilla));
      pts = curva(adj, semilla + 1000);
      thr = umbral(pts);
    }

    function dibujaRejilla() {
      var out = [], x, y, i, c = 300 / L, inf = ultimo.inf;
      for (y = 0; y < L; y++) {
        for (x = 0; x < L; x++) {
          i = y * L + x;
          out.push('<rect x="' + (x * c + 0.6).toFixed(1) + '" y="' + (y * c + 0.6).toFixed(1) + '" width="' + (c - 1.2).toFixed(1) + '" height="' + (c - 1.2).toFixed(1) +
            '" style="fill:' + (inf[i] ? "var(--trap)" : "var(--accent-soft)") + '"/>');
        }
      }
      x = (ultimo.inicio % L) * c; y = Math.floor(ultimo.inicio / L) * c;
      out.push('<rect x="' + (x + 0.6).toFixed(1) + '" y="' + (y + 0.6).toFixed(1) + '" width="' + (c - 1.2).toFixed(1) + '" height="' + (c - 1.2).toFixed(1) +
        '" style="fill:var(--trap);stroke:var(--ink);stroke-width:2"/>');
      svgG.innerHTML = out.join("");
      svgG.setAttribute("aria-label", "Rejilla de " + N + " camas; " + ultimo.n + " infectadas.");
    }

    function px(t) { return 44 + t * 340; }
    function py(f) { return 260 - f * 240; }
    function dibujaCurva() {
      var out = [], i, a = [], b = [], f;
      for (i = 0; i <= 4; i++) {
        f = i / 4;
        out.push('<line x1="44" y1="' + py(f) + '" x2="384" y2="' + py(f) + '" style="stroke:var(--rule);stroke-width:1"/>');
        out.push('<text x="38" y="' + (py(f) + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:11px">' + (f * 100) + '</text>');
        out.push('<text x="' + px(f) + '" y="278" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + fmt(f, 2) + '</text>');
      }
      out.push('<text x="214" y="295" text-anchor="middle" style="fill:var(--muted);font-size:11px">T (probabilidad de transmisión por contacto)</text>');
      out.push('<text x="4" y="12" style="fill:var(--muted);font-size:11px">% de camas</text>');
      pts.forEach(function (p) { a.push(px(p.T).toFixed(1) + "," + py(p.media).toFixed(1)); b.push(px(p.T).toFixed(1) + "," + py(p.grandes).toFixed(1)); });
      out.push('<polyline points="' + b.join(" ") + '" style="fill:none;stroke:var(--faint);stroke-width:2;stroke-dasharray:5 4"/>');
      out.push('<polyline points="' + a.join(" ") + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      out.push('<line x1="' + px(T / 100) + '" y1="16" x2="' + px(T / 100) + '" y2="260" style="stroke:var(--trap);stroke-width:2"/>');
      svgC.innerHTML = out.join("");
      svgC.setAttribute("aria-label", "Curva de la fracción media de camas infectadas según T. Marcador en T = " + fmt(T / 100, 2) + ".");
    }

    function actualiza() {
      var e = estadisticas(adj, T / 100, rng(semilla * 7 + T), ESTAD), nota;
      $("tv").textContent = (T / 100).toFixed(2).replace(".", ",");
      $("sv").textContent = S + " %";
      $("o1").textContent = ultimo.n + " camas (" + pct(ultimo.n / N) + ")";
      $("o2").textContent = pct(e.media);
      $("o3").textContent = pct(e.grandes, 0);
      $("o4").textContent = e.min + " a " + e.max + " camas";
      $("o5").textContent = thr === null ? "no se alcanza" : "T = " + fmt(thr, 2);
      if (e.grandes < 0.05) {
        nota = "Por debajo del umbral: casi todos los brotes mueren pequeños. Subir T un poco cambia poco la media; es la parte plana de la curva.";
      } else if (e.media > 0.8) {
        nota = "Muy por encima del umbral: casi cualquier brote grande alcanza a casi toda la planta. Subir más T ya cambia poco.";
      } else {
        nota = "Zona del umbral: la media (" + pct(e.media, 0) + ") esconde dos mundos, brotes de unas pocas camas y brotes de cientos (de " + e.min + " a " + e.max + "). Un cambio pequeño de T o de atajos cambia mucho el resultado.";
      }
      $("note").textContent = nota;
      dibujaCurva();
    }

    function nuevoBrote() {
      var r = rng(semilla * 131 + (++corrida));
      ultimo = brote(adj, T / 100, r, Math.floor(r() * N));
      dibujaRejilla();
      actualiza();
    }

    inT.addEventListener("input", function () { T = parseInt(inT.value, 10); nuevoBrote(); });
    inS.addEventListener("input", function () { S = parseInt(inS.value, 10); otraPlanta(); nuevoBrote(); });
    $("go").addEventListener("click", nuevoBrote);
    $("new").addEventListener("click", function () { semilla++; otraPlanta(); nuevoBrote(); });

    otraPlanta();
    nuevoBrote();
  };
  window.WIDGETS["m03-l02-rasgos"]._nucleo = nucleo;
})();
