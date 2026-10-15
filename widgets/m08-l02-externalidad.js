/* Simulador "m08-l02-externalidad": mercado con demanda, oferta privada y una externalidad negativa ajustable.
   Modelo lineal (propio): demanda P = a - b*Q, coste privado marginal CPM = c + d*Q, coste externo marginal e por unidad.
   Equilibrio de mercado: demanda = CPM. Optimo social: demanda = CPM + e. Impuesto t por unidad: demanda = CPM + t.
   Perdida de bienestar = (b + d)/2 * (Q_impuesto - Q_optimo)^2. Sin dependencias; estilos con las variables del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var A = 100, B = 1, C = 20, D = 1;

  function calc(e, t) {
    var qm = (A - C) / (B + D);
    var qo = (A - C - e) / (B + D);
    var qt = (A - C - t) / (B + D);
    var w = function (q) { return (A - C - e) * q - (B + D) * q * q / 2; };
    return {
      qm: qm, qo: qo, qt: qt,
      pm: A - B * qm,
      pt: A - B * qt,
      recibe: A - B * qt - t,
      perdidaMercado: w(qo) - w(qm),
      perdidaImpuesto: w(qo) - w(qt),
      recaudacion: t * qt,
      costeExterno: e * qm
    };
  }

  function injectStyle() {
    if (document.getElementById("w-m8ext-style")) return;
    var st = document.createElement("style");
    st.id = "w-m8ext-style";
    st.textContent = [
      ".w-m8e{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m8e h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m8e .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m8e .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-m8e .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-m8e .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-m8e input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-m8e .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-m8e button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-m8e button:hover{background:var(--accent-soft)}",
      ".w-m8e svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-m8e dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-m8e dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-m8e dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-m8e dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-m8e .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-m8e .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }

  var widget = function (el) {
    injectStyle();
    var id = "w-m8e-" + (++uid);
    var E = 20, T = 0;

    el.innerHTML = '<div class="w-m8e">' +
      '<h4>Mercado con externalidad</h4>' +
      '<p class="w-hint">Un servicio se vende a un precio en euros por unidad (unidades en miles). La demanda baja con el precio, y cada unidad más cuesta algo más de producir. Además, cada unidad produce un daño a terceros que nadie les paga.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-e">Coste externo por unidad <b id="' + id + '-ev"></b></label><input type="range" id="' + id + '-e" min="0" max="40" step="1" value="' + E + '"></div>' +
      '<div class="w-f"><label for="' + id + '-t">Impuesto por unidad <b id="' + id + '-tv"></b></label><input type="range" id="' + id + '-t" min="0" max="40" step="1" value="' + T + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-eq">Impuesto igual al coste externo</button><button type="button" id="' + id + '-no">Quitar el impuesto</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 320" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Mercado sin impuesto: unidades</dt><dd id="' + id + '-o-qm"></dd></div>' +
      '<div><dt>Óptimo social: unidades</dt><dd id="' + id + '-o-qo"></dd></div>' +
      '<div><dt>Con el impuesto puesto: unidades</dt><dd id="' + id + '-o-qt"></dd></div>' +
      '<div><dt>Pérdida de bienestar sin impuesto</dt><dd id="' + id + '-o-lm"></dd></div>' +
      '<div><dt>Pérdida de bienestar con impuesto</dt><dd id="' + id + '-o-lt"></dd></div>' +
      '<div><dt>Paga el comprador / cobra el vendedor</dt><dd id="' + id + '-o-pr"></dd></div>' +
      '<div><dt>Recaudación</dt><dd id="' + id + '-o-rc"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo lineal propio con cifras inventadas: demanda P = 100 - Q, coste privado marginal 20 + Q. Las unidades de bienestar son miles de euros. El coste externo es el mismo en cada unidad, una simplificación.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inE = $("e"), inT = $("t"), svg = $("svg");

    var X0 = 50, X1 = 580, Y0 = 290, Y1 = 20, QMAX = 100, PMAX = 120;
    function sx(q) { return X0 + (q / QMAX) * (X1 - X0); }
    function sy(p) { return Y0 - (p / PMAX) * (Y0 - Y1); }
    function line(q0, p0, slope, style) {
      /* recta P = p0 + slope*q recortada a 0<=q<=QMAX y 0<=P<=PMAX */
      var qa = 0, qb = QMAX, pa, pb;
      if (slope > 0) qb = Math.min(QMAX, (PMAX - p0) / slope);
      if (slope < 0) qb = Math.min(QMAX, (0 - p0) / slope);
      if (qb < qa) return "";
      pa = p0 + slope * qa; pb = p0 + slope * qb;
      return '<line x1="' + sx(qa).toFixed(1) + '" y1="' + sy(pa).toFixed(1) + '" x2="' + sx(qb).toFixed(1) + '" y2="' + sy(pb).toFixed(1) + '" style="' + style + '"/>';
    }
    function dot(q, p, col) {
      return '<circle cx="' + sx(q).toFixed(1) + '" cy="' + sy(p).toFixed(1) + '" r="5" style="fill:' + col + ';stroke:var(--ground);stroke-width:1.5"/>';
    }
    function tag(q, p, txt, dx, dy, anchor) {
      return '<text x="' + (sx(q) + dx).toFixed(1) + '" y="' + (sy(p) + dy).toFixed(1) + '" text-anchor="' + (anchor || "start") + '" style="fill:currentColor;font-size:12px;font-weight:600">' + txt + '</text>';
    }

    function draw(r) {
      var o = [], i, ax = "stroke:var(--rule-strong);stroke-width:1";
      o.push('<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + X1 + '" y2="' + Y0 + '" style="' + ax + '"/>');
      o.push('<line x1="' + X0 + '" y1="' + Y0 + '" x2="' + X0 + '" y2="' + Y1 + '" style="' + ax + '"/>');
      for (i = 0; i <= 100; i += 20) {
        o.push('<text x="' + sx(i) + '" y="' + (Y0 + 16) + '" text-anchor="middle" style="fill:var(--faint);font-size:11px">' + i + '</text>');
      }
      for (i = 0; i <= 100; i += 20) {
        o.push('<text x="' + (X0 - 6) + '" y="' + (sy(i) + 4) + '" text-anchor="end" style="fill:var(--faint);font-size:11px">' + i + '</text>');
      }
      o.push('<text x="' + ((X0 + X1) / 2) + '" y="' + (Y0 + 32) + '" text-anchor="middle" style="fill:var(--muted);font-size:11px">Unidades (miles)</text>');
      o.push('<text x="14" y="' + Y1 + '" style="fill:var(--muted);font-size:11px">Euros por unidad</text>');
      /* triangulo de perdida (con el impuesto puesto; si t=0 es la perdida del mercado) */
      var qo = r.qo, qt = r.qt;
      if (Math.abs(qt - qo) > 1e-9) {
        var pOpt = A - B * qo;
        o.push('<polygon points="' + sx(qo).toFixed(1) + ',' + sy(pOpt).toFixed(1) + ' ' + sx(qt).toFixed(1) + ',' + sy(A - B * qt).toFixed(1) + ' ' + sx(qt).toFixed(1) + ',' + sy(C + E + D * qt).toFixed(1) + '" style="fill:var(--trap);opacity:.35;stroke:var(--trap);stroke-width:1"/>');
      }
      o.push(line(0, A, -B, "stroke:var(--accent);stroke-width:2.5"));
      o.push(line(0, C, D, "stroke:var(--ex);stroke-width:2.5"));
      o.push(line(0, C + E, D, "stroke:var(--trap);stroke-width:2.5;stroke-dasharray:6 4"));
      if (T > 0) o.push(line(0, C + T, D, "stroke:var(--ex);stroke-width:2;stroke-dasharray:2 3"));
      o.push(dot(r.qm, r.pm, "var(--ex)"));
      o.push(dot(r.qo, A - B * r.qo, "var(--trap)"));
      if (T > 0) o.push(dot(r.qt, r.pt, "var(--accent)"));
      o.push(tag(QMAX, A - B * QMAX + 4, "Demanda", -6, -8, "end"));
      o.push(tag(0, C, "Coste privado", 8, 16));
      if (E > 0) o.push(tag(0, C + E, "Coste social", 8, -6));
      o.push(tag(r.qm, r.pm, "Mercado", 9, -8));
      svg.innerHTML = o.join("");
      svg.setAttribute("aria-label", "Gráfico de oferta y demanda. Mercado sin impuesto: " + fmt(r.qm, 1) + " unidades. Óptimo social: " + fmt(r.qo, 1) +
        " unidades. Con el impuesto de " + T + ": " + fmt(r.qt, 1) + " unidades. Pérdida de bienestar con el impuesto: " + fmt(r.perdidaImpuesto, 0) + ".");
    }

    function update() {
      var r = calc(E, T), note = $("note");
      $("ev").textContent = E;
      $("tv").textContent = T;
      $("o-qm").textContent = fmt(r.qm, 1);
      $("o-qo").textContent = fmt(r.qo, 1);
      $("o-qt").textContent = fmt(r.qt, 1);
      $("o-lm").textContent = fmt(r.perdidaMercado, 0);
      $("o-lt").textContent = fmt(r.perdidaImpuesto, 0);
      $("o-pr").textContent = fmt(r.pt, 1) + " / " + fmt(r.recibe, 1);
      $("o-rc").textContent = fmt(r.recaudacion, 0);
      if (E === 0) {
        note.textContent = T === 0
          ? "Sin externalidad, el mercado ya produce lo óptimo: coste privado y social coinciden y no hay pérdida. Sube el coste externo para ver qué cambia."
          : "Sin externalidad, un impuesto no corrige nada: aleja la producción del óptimo y crea una pérdida de bienestar donde antes no había ninguna.";
      } else if (T === E) {
        note.textContent = "El impuesto es igual al coste externo: el comprador paga " + fmt(r.pt, 1) + " y el vendedor se queda " + fmt(r.recibe, 1) +
          ", la producción baja a " + fmt(r.qt, 1) + " y la pérdida desaparece. El productor y el comprador vuelven a contar el daño que causan.";
      } else if (T === 0) {
        note.textContent = "Sin impuesto se producen " + fmt(r.qm, 1) + " unidades y el óptimo es " + fmt(r.qo, 1) + ": sobran " + fmt(r.qm - r.qo, 1) +
          ". Cada unidad de más cuesta a la sociedad más de lo que vale para el comprador, y el triángulo rojo suma " + fmt(r.perdidaMercado, 0) + ". Prueba a poner un impuesto.";
      } else if (T < E) {
        note.textContent = "El impuesto se queda corto: acerca la producción al óptimo, pero aún sobran " + fmt(r.qt - r.qo, 1) + " unidades y la pérdida es " + fmt(r.perdidaImpuesto, 0) + ".";
      } else {
        note.textContent = "El impuesto se pasa: la producción baja por debajo del óptimo (faltan " + fmt(r.qo - r.qt, 1) + " unidades) y la pérdida vuelve a ser " + fmt(r.perdidaImpuesto, 0) +
          ". Acertar con el coste externo importa.";
      }
      draw(r);
    }

    inE.addEventListener("input", function () { E = parseInt(inE.value, 10); update(); });
    inT.addEventListener("input", function () { T = parseInt(inT.value, 10); update(); });
    $("eq").addEventListener("click", function () { T = E; inT.value = String(T); update(); });
    $("no").addEventListener("click", function () { T = 0; inT.value = "0"; update(); });
    update();
  };

  widget.calc = calc;
  window.WIDGETS["m08-l02-externalidad"] = widget;
})();
