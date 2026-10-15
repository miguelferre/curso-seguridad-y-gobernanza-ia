/* Simulador "m01-l04-proxy": un optimizador voraz que maximiza una metrica sustituta (proxy).
   MODELO PROPIO (no es del libro ni del curso). Dos palancas: mejorar de verdad (h, con rendimientos
   decrecientes) o explotar un atajo (g, rendimiento constante). En cada paso el optimizador elige la que
   mas sube la metrica. Metrica = h + k(1-q)g. Objetivo real = h - d*g^2 (el atajo no aporta valor y daña
   cada vez mas). Unidades arbitrarias. Calculo determinista, sin azar.
   Sin dependencias; estilos con las variables CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, TMAX = 200, S = 8;

  function injectStyle() {
    if (document.getElementById("w-px-style")) return;
    var st = document.createElement("style");
    st.id = "w-px-style";
    st.textContent = [
      ".w-px{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-px h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-px .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-px .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-px .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-px .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-px input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-px .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-px button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-px button:hover{background:var(--accent-soft)}",
      ".w-px svg{display:block;width:100%;height:auto;margin:0 0 .5rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-px .w-leg{display:flex;flex-wrap:wrap;gap:.3rem 1.1rem;margin:0 0 .8rem;font-size:.8rem;color:var(--muted)}",
      ".w-px .w-leg i{display:inline-block;width:1.4rem;height:0;border-top:3px solid;vertical-align:middle;margin-right:.35rem}",
      ".w-px dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-px dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-px dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-px dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-px dl.w-out dd.w-bad{color:var(--trap)}",
      ".w-px .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-px .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  /* Simula TMAX pasos. Devuelve un array con {t,h,g,P,R} por paso. */
  function simulate(k, q, d) {
    var h = 0, g = 0, ug = k * (1 - q), out = [{ t: 0, h: 0, g: 0, P: 0, R: 0 }], t, uh;
    for (t = 1; t <= TMAX; t++) {
      uh = 1 / (1 + h / S);
      if (uh >= ug) h += uh; else g += 1;
      out.push({ t: t, h: h, g: g, P: h + ug * g, R: h - d * g * g });
    }
    return out;
  }
  function peakOf(o) {
    var b = 0, i;
    for (i = 1; i < o.length; i++) if (o[i].R > o[b].R + 1e-9) b = i;
    return o[b];
  }

  window.WIDGETS["m01-l04-proxy"] = function (el) {
    injectStyle();
    var id = "w-px-" + (++uid);
    var T = 100, K = 0.35, Q = 0, D = 4;

    el.innerHTML = '<div class="w-px">' +
      '<h4>Apretar la optimización de una métrica</h4>' +
      '<p class="w-hint">Un optimizador solo ve la métrica. Cada paso puede mejorar de verdad lo que nos importa o explotar un atajo que sube la métrica sin aportar valor. Sube la presión y mira las dos curvas.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-t">Presión de optimización <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="0" max="' + TMAX + '" step="1" value="' + T + '"></div>' +
      '<div class="w-f"><label for="' + id + '-k">Facilidad del atajo <b id="' + id + '-kv"></b></label><input type="range" id="' + id + '-k" min="0.05" max="1" step="0.05" value="' + K + '"></div>' +
      '<div class="w-f"><label for="' + id + '-q">Vigilancia del atajo en la métrica <b id="' + id + '-qv"></b></label><input type="range" id="' + id + '-q" min="0" max="0.95" step="0.05" value="' + Q + '"></div>' +
      '<div class="w-f"><label for="' + id + '-d">Daño del atajo <b id="' + id + '-dv"></b></label><input type="range" id="' + id + '-d" min="1" max="10" step="1" value="' + D + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-p0">Valores iniciales</button><button type="button" id="' + id + '-p1">Métrica fácil de trampear</button><button type="button" id="' + id + '-p2">Métrica bien vigilada</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 272" role="img" aria-label=""></svg>' +
      '<p class="w-leg"><span><i style="border-color:var(--accent)"></i>Métrica (lo que ve el optimizador)</span><span><i style="border-color:var(--ex)"></i>Objetivo real</span><span><i style="border-color:var(--faint);border-top-style:dashed"></i>Pico del objetivo real</span></p>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Métrica ahora</dt><dd id="' + id + '-o-p"></dd></div>' +
      '<div><dt>Objetivo real ahora</dt><dd id="' + id + '-o-r"></dd></div>' +
      '<div><dt>Pasos gastados en el atajo</dt><dd id="' + id + '-o-g"></dd></div>' +
      '<div><dt>Pico del objetivo real</dt><dd id="' + id + '-o-k"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo propio, no del libro: el optimizador es voraz y elige en cada paso lo que más sube la métrica. Mejorar de verdad rinde 1/(1 + h/8) por paso, con h la mejora acumulada; el atajo rinde facilidad × (1 − vigilancia) por paso. Objetivo real = h − daño × (pasos de atajo)². Unidades arbitrarias, cálculo exacto y sin azar.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inT = $("t"), inK = $("k"), inQ = $("q"), inD = $("d"), svg = $("svg");

    function line(o, key, x, y) {
      var pts = [], i;
      for (i = 0; i < o.length; i++) pts.push(x(o[i].t).toFixed(1) + "," + y(o[i][key]).toFixed(1));
      return pts.join(" ");
    }

    function update() {
      var o = simulate(K, Q, D / 1000), pk = peakOf(o), cur = o[T], i;
      var ymin = 0, ymax = 1;
      for (i = 0; i < o.length; i++) { ymin = Math.min(ymin, o[i].R, o[i].P); ymax = Math.max(ymax, o[i].R, o[i].P); }
      var pad = (ymax - ymin) * 0.06; ymin -= pad; ymax += pad;
      var x0 = 52, x1 = 588, y0 = 14, y1 = 222;
      function x(t) { return x0 + (x1 - x0) * t / TMAX; }
      function y(v) { return y1 - (y1 - y0) * (v - ymin) / (ymax - ymin); }
      var out = [], step = (ymax - ymin) > 160 ? 50 : (ymax - ymin) > 60 ? 20 : 10, v;
      for (v = Math.ceil(ymin / step) * step; v <= ymax; v += step) {
        out.push('<line x1="' + x0 + '" y1="' + y(v).toFixed(1) + '" x2="' + x1 + '" y2="' + y(v).toFixed(1) + '" style="stroke:var(--rule);stroke-width:' + (v === 0 ? 1.5 : 1) + '"/>');
        out.push('<text x="' + (x0 - 6) + '" y="' + (y(v) + 5).toFixed(1) + '" text-anchor="end" style="fill:var(--faint);font:16px var(--mono)">' + fmt(v, 0) + '</text>');
      }
      for (v = 0; v <= TMAX; v += 50) out.push('<text x="' + x(v) + '" y="243" text-anchor="middle" style="fill:var(--faint);font:16px var(--mono)">' + v + '</text>');
      out.push('<text x="' + ((x0 + x1) / 2) + '" y="266" text-anchor="middle" style="fill:var(--faint);font:16px var(--mono)">pasos de optimización</text>');
      out.push('<line x1="' + x(pk.t).toFixed(1) + '" y1="' + y0 + '" x2="' + x(pk.t).toFixed(1) + '" y2="' + y1 + '" style="stroke:var(--faint);stroke-width:1.5;stroke-dasharray:5 4"/>');
      out.push('<polyline points="' + line(o, "P", x, y) + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>');
      out.push('<polyline points="' + line(o, "R", x, y) + '" style="fill:none;stroke:var(--ex);stroke-width:2.5"/>');
      out.push('<line x1="' + x(T).toFixed(1) + '" y1="' + y0 + '" x2="' + x(T).toFixed(1) + '" y2="' + y1 + '" style="stroke:var(--ink);stroke-width:1"/>');
      out.push('<circle cx="' + x(T).toFixed(1) + '" cy="' + y(cur.P).toFixed(1) + '" r="4.5" style="fill:var(--accent)"/>');
      out.push('<circle cx="' + x(T).toFixed(1) + '" cy="' + y(cur.R).toFixed(1) + '" r="4.5" style="fill:var(--ex)"/>');
      svg.innerHTML = out.join("");
      svg.setAttribute("aria-label", "Curvas de la métrica y del objetivo real frente a la presión de optimización. Con presión " + T +
        " la métrica vale " + fmt(cur.P, 1) + " y el objetivo real " + fmt(cur.R, 1) + ". El objetivo real alcanza su pico en el paso " + pk.t + ".");

      $("tv").textContent = T + " pasos";
      $("kv").textContent = fmt(K, 2);
      $("qv").textContent = Math.round(Q * 100) + " %";
      $("dv").textContent = D + " × 10⁻³";
      $("o-p").textContent = fmt(cur.P, 1);
      var rr = $("o-r"); rr.textContent = fmt(cur.R, 1); rr.className = cur.R < pk.R - 0.05 ? "w-bad" : "";
      $("o-g").textContent = fmt(cur.g, 0);
      $("o-k").textContent = pk.t >= TMAX ? "no se alcanza en 200 pasos" : fmt(pk.R, 1) + " en el paso " + pk.t;

      var note = $("note");
      if (T === 0) {
        note.textContent = "Sin optimizar, todo vale 0. Sube la presión.";
      } else if (T <= pk.t) {
        note.textContent = cur.g === 0
          ? (pk.t >= TMAX && T >= TMAX
            ? "En 200 pasos el optimizador solo mejora lo que sí importa: la métrica y el objetivo real valen lo mismo y aún no cae ninguno. El atajo todavía no le compensa."
            : "Hasta aquí el optimizador solo mejora lo que sí importa: la métrica y el objetivo real suben juntos y valen lo mismo. Sigue subiendo la presión.")
          : "El optimizador ya empieza a usar el atajo, pero el daño todavía es pequeño.";
      } else {
        note.textContent = "Desde el pico (paso " + pk.t + ") la métrica ha subido " + fmt(cur.P - pk.P, 1) +
          " puntos y el objetivo real ha bajado " + fmt(pk.R - cur.R, 1) + ". Quien solo mirase la métrica vería una mejora continua.";
      }
    }

    function set(t, k, q, d) {
      T = t; K = k; Q = q; D = d;
      inT.value = t; inK.value = k; inQ.value = q; inD.value = d;
      update();
    }
    inT.addEventListener("input", function () { T = +inT.value; update(); });
    inK.addEventListener("input", function () { K = +inK.value; update(); });
    inQ.addEventListener("input", function () { Q = +inQ.value; update(); });
    inD.addEventListener("input", function () { D = +inD.value; update(); });
    $("p0").addEventListener("click", function () { set(100, 0.35, 0, 4); });
    $("p1").addEventListener("click", function () { set(100, 0.8, 0, 4); });
    $("p2").addEventListener("click", function () { set(200, 0.35, 0.5, 4); });
    update();
  };
})();
