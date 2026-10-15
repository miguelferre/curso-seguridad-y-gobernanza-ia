/* Simulador "m06-l01-impacto-dispar": dos grupos (supervisado y de referencia) con tasa base, sensibilidad (TPR) y tasa de
   falsos positivos (FPR) ajustables. De ahi salen la tasa favorable, el impacto dispar (DI), la diferencia de paridad
   estadistica (SPD), las diferencias de FPR y de FNR y, como tercer marco, la diferencia de valor predictivo positivo (VPP).
   Cifras sinteticas. La tasa favorable NO es un mando independiente: es b*TPR + (1-b)*FPR. Los botones resuelven ese despeje.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var ID = "m06-l01-impacto-dispar";

  var INICIO = {
    A: { b: 0.10, tpr: 0.80, fpr: 0.10 },   /* supervisado: 18-35 anos, poca prevalencia */
    B: { b: 0.30, tpr: 0.80, fpr: 0.10 },   /* referencia: 36-75 anos */
    diMin: 0.80,                              /* regla de las cuatro quintas (Atlas) */
    tol: 0.10                                 /* tolerancia habitual de la literatura para las diferencias (Atlas) */
  };

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

  /* Un grupo: tasa base b, sensibilidad tpr, tasa de falsos positivos fpr. */
  function grupo(g) {
    var fav = g.b * g.tpr + (1 - g.b) * g.fpr;
    return {
      b: g.b, tpr: g.tpr, fpr: g.fpr, fnr: 1 - g.tpr, fav: fav,
      ppv: fav > 0 ? g.b * g.tpr / fav : null
    };
  }

  /* Comparacion supervisado (A) menos referencia (B), como en el Atlas. */
  function comparar(A, B, diMin, tol) {
    var a = grupo(A), b = grupo(B), m = {};
    m.a = a; m.b = b;
    m.di = b.fav > 0 ? a.fav / b.fav : null;
    m.spd = a.fav - b.fav;
    m.dfpr = a.fpr - b.fpr;
    m.dfnr = a.fnr - b.fnr;
    m.dppv = (a.ppv === null || b.ppv === null) ? null : a.ppv - b.ppv;
    m.alertaDi = m.di !== null && m.di < diMin;
    m.alertaSpd = Math.abs(m.spd) > tol;
    m.alertaFpr = Math.abs(m.dfpr) > tol;
    m.alertaFnr = Math.abs(m.dfnr) > tol;
    m.alertaPpv = m.dppv !== null && Math.abs(m.dppv) > tol;
    m.paridad = !m.alertaDi && !m.alertaSpd;
    m.errores = !m.alertaFpr && !m.alertaFnr;
    m.predictiva = !m.alertaPpv;
    m.cumple = (m.paridad ? 1 : 0) + (m.errores ? 1 : 0) + (m.predictiva ? 1 : 0);
    /* Con errores iguales, la paridad depende solo de (bA - bB) * (TPR - FPR). */
    m.spdTeorica = (A.b - B.b) * (A.tpr - A.fpr);
    return m;
  }

  /* Botones. Devuelven el nuevo estado de A y un aviso (o cadena vacia). */
  function igualarErrores(A, B) {
    return { A: { b: A.b, tpr: B.tpr, fpr: B.fpr }, aviso: "" };
  }

  /* Iguala la tasa favorable de A a la de B moviendo la FPR de A; si no cabe, mueve tambien la TPR. */
  function igualarFavorable(A, B) {
    var objetivo = grupo(B).fav, fpr, tpr = A.tpr, aviso = "";
    fpr = (objetivo - A.b * tpr) / (1 - A.b);
    if (fpr < 0 || fpr > 1) {
      fpr = clamp(fpr, 0, 1);
      tpr = clamp((objetivo - (1 - A.b) * fpr) / A.b, 0, 1);
      aviso = "Con esa sensibilidad no bastaba con mover la FPR: se ha movido también la sensibilidad.";
    }
    return { A: { b: A.b, tpr: tpr, fpr: fpr }, aviso: aviso };
  }

  /* Iguala el VPP de A al de B moviendo la FPR de A (si B no tiene VPP definido, no hace nada). */
  function igualarVpp(A, B) {
    var ppvB = grupo(B).ppv, fpr, aviso = "";
    if (ppvB === null || ppvB <= 0) return { A: A, aviso: "El grupo de referencia no tiene VPP definido." };
    fpr = A.b * A.tpr * (1 / ppvB - 1) / (1 - A.b);
    if (fpr > 1) { fpr = 1; aviso = "No es posible llegar a ese VPP con esa sensibilidad: la FPR queda en su tope."; }
    return { A: { b: A.b, tpr: A.tpr, fpr: fpr }, aviso: aviso };
  }

  var core = {
    inicio: INICIO, grupo: grupo, comparar: comparar,
    igualarErrores: igualarErrores, igualarFavorable: igualarFavorable, igualarVpp: igualarVpp
  };
  window.WIDGETS[ID] = function (el) { buildUI(el); };
  window.WIDGETS[ID].core = core;

  /* -- La interfaz sigue mas abajo -- */
  function fmt(x, d) {
    x = Number(x);
    if (Math.abs(x) < Math.pow(10, -d) / 2) x = 0;   /* evita "-0,000" por errores de redondeo */
    return x.toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function s(x, d) { return (fmt(x, d) !== fmt(0, d) && x > 0 ? "+" : "") + fmt(x, d); }
  function pc(x) { return fmt(x * 100, 0) + " %"; }
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-imp-style")) return;
    var st = document.createElement("style");
    st.id = "w-imp-style";
    st.textContent = [
      ".w-imp{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-imp h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-imp .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-imp .w-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem;margin:0 0 .7rem}",
      ".w-imp fieldset{border:1px solid var(--rule-strong);border-radius:8px;padding:.5rem .7rem .7rem;margin:0;min-width:0}",
      ".w-imp legend{font:600 .78rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--accent-ink);padding:0 .3rem}",
      ".w-imp .w-f{margin:.45rem 0 0}",
      ".w-imp .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-imp .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-imp input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-imp .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-imp button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-imp button:hover{background:var(--accent-soft)}",
      ".w-imp button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-imp .w-tw{overflow-x:auto;margin:0 0 .8rem}",
      ".w-imp table{border-collapse:collapse;width:100%;font-size:.86rem}",
      ".w-imp th,.w-imp td{border-bottom:1px solid var(--rule);padding:.35rem .5rem;text-align:left;vertical-align:top}",
      ".w-imp th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-imp td.w-num{font-family:var(--mono);white-space:nowrap}",
      ".w-imp .w-ok{color:var(--ex);font-weight:700}",
      ".w-imp .w-al{color:var(--trap);font-weight:700}",
      ".w-imp tr.w-row-al td{background:var(--trap-bg)}",
      ".w-imp svg{display:block;width:100%;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground);margin:0 0 .8rem}",
      ".w-imp .w-marcos{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.5rem;margin:0 0 .8rem}",
      ".w-imp .w-marco{border:1px solid var(--rule-strong);border-radius:8px;padding:.5rem .7rem;background:var(--ground)}",
      ".w-imp .w-marco b{display:block;font:600 .95rem/1.3 var(--cond)}",
      ".w-imp .w-marco.w-si{border-color:var(--ex-rule);background:var(--ex-bg)}",
      ".w-imp .w-marco.w-no{border-color:var(--trap-rule);background:var(--trap-bg)}",
      ".w-imp .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-imp .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function buildUI(el) {
    injectStyle();
    var p = "wi" + (++uid) + "-";
    var st = JSON.parse(JSON.stringify(INICIO));
    var aviso = "";

    function slider(id, txt, min, max, step) {
      return '<div class="w-f"><label for="' + p + id + '">' + txt + ' <b id="' + p + id + '-v"></b></label>' +
        '<input type="range" id="' + p + id + '" min="' + min + '" max="' + max + '" step="' + step + '"></div>';
    }
    function fs(k, titulo) {
      return '<fieldset><legend>' + titulo + '</legend>' +
        slider(k + "b", "Tasa base", 0.02, 0.6, 0.01) +
        slider(k + "t", "Sensibilidad (TPR)", 0.05, 1, 0.01) +
        slider(k + "f", "Falsos positivos (FPR)", 0, 1, 0.01) + '</fieldset>';
    }

    el.innerHTML =
      '<div class="w-imp">' +
      '<h4>Impacto dispar y sus hermanas</h4>' +
      '<p class="w-hint">Datos sintéticos. La tasa favorable de cada grupo no es un mando: sale de la tasa base, la sensibilidad y los falsos positivos. Favorable = derivar al paciente.</p>' +
      '<div class="w-cols">' + fs("a", "Supervisado (18-35)") + fs("b", "Referencia (36-75)") +
      '<fieldset><legend>Umbrales de alerta</legend>' +
      slider("di", "Impacto dispar mínimo", 0.5, 1, 0.01) +
      slider("tol", "Tolerancia de las diferencias", 0.02, 0.3, 0.01) + '</fieldset></div>' +
      '<div class="w-btns">' +
      '<button type="button" class="w-main" id="' + p + 'e">Igualar errores</button>' +
      '<button type="button" class="w-main" id="' + p + 'v">Igualar tasa favorable</button>' +
      '<button type="button" class="w-main" id="' + p + 'p">Igualar VPP</button>' +
      '<button type="button" id="' + p + 'r">Reiniciar</button></div>' +
      '<div class="w-tw"><table><caption class="w-cap" style="text-align:left;caption-side:top">Cada grupo</caption><thead><tr><th>Grupo</th><th>Tasa base</th><th>Favorable</th><th>TPR</th><th>FPR</th><th>FNR</th><th>VPP</th></tr></thead><tbody id="' + p + 'g"></tbody></table></div>' +
      '<div class="w-tw"><table><caption class="w-cap" style="text-align:left;caption-side:top">Supervisado menos referencia</caption><thead><tr><th>Métrica</th><th>Valor</th><th>Alerta si</th><th>Estado</th></tr></thead><tbody id="' + p + 'm"></tbody></table></div>' +
      '<svg id="' + p + 'svg" viewBox="0 0 360 210" role="img" aria-label="Barras por grupo de la tasa favorable, la FPR, la FNR y el VPP"></svg>' +
      '<div class="w-marcos" id="' + p + 'k" aria-live="polite"></div>' +
      '<p class="w-note" id="' + p + 'n" aria-live="polite"></p>' +
      '<p class="w-cap">El impacto dispar es la razón de tasas favorables; la paridad estadística, su diferencia. Con errores iguales, la diferencia de tasas favorables es (bS − bR)·(TPR − FPR).</p></div>';

    function $(id) { return document.getElementById(p + id); }
    var ctl = [
      ["ab", "A", "b", pc], ["at", "A", "tpr", pc], ["af", "A", "fpr", pc],
      ["bb", "B", "b", pc], ["bt", "B", "tpr", pc], ["bf", "B", "fpr", pc],
      ["di", null, "diMin", function (x) { return fmt(x, 2); }], ["tol", null, "tol", function (x) { return "± " + fmt(x, 2); }]
    ];
    ctl.forEach(function (c) {
      $(c[0]).addEventListener("input", function () {
        var v = parseFloat($(c[0]).value);
        if (c[1]) st[c[1]][c[2]] = v; else st[c[2]] = v;
        aviso = "";
        render();
      });
    });

    function sync() {
      ctl.forEach(function (c) {
        var v = c[1] ? st[c[1]][c[2]] : st[c[2]];
        $(c[0]).value = String(Math.round(v * 100) / 100);
        $(c[0] + "-v").textContent = c[3](v);
      });
    }

    function fila(nombre, valor, crit, alerta) {
      return '<tr class="' + (alerta ? "w-row-al" : "") + '"><td>' + nombre + '</td><td class="w-num">' + valor + '</td><td class="w-num">' + crit +
        '</td><td class="' + (alerta ? "w-al" : "w-ok") + '">' + (alerta ? "ALERTA" : "dentro") + '</td></tr>';
    }
    function filaG(nombre, g) {
      return '<tr><td>' + nombre + '</td><td class="w-num">' + pc(g.b) + '</td><td class="w-num">' + fmt(g.fav * 100, 1) + ' %</td><td class="w-num">' + pc(g.tpr) +
        '</td><td class="w-num">' + fmt(g.fpr * 100, 1) + ' %</td><td class="w-num">' + pc(g.fnr) + '</td><td class="w-num">' + (g.ppv === null ? "n. d." : fmt(g.ppv * 100, 1) + " %") + '</td></tr>';
    }

    function dibujar(m) {
      var o = [], k = [["Tasa favorable", "fav"], ["FPR", "fpr"], ["FNR", "fnr"], ["VPP", "ppv"]], i, x0, h, y, top = 20, base = 170, alto = base - top;
      [0, 0.5, 1].forEach(function (t) {
        y = base - t * alto;
        o.push('<line x1="40" x2="350" y1="' + y + '" y2="' + y + '" style="stroke:var(--rule);stroke-width:1"/>');
        o.push('<text x="34" y="' + (y + 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">' + fmt(t, 1) + '</text>');
      });
      k.forEach(function (kk, i) {
        var x0 = 52 + i * 75;
        [["a", "var(--accent)"], ["b", "var(--ex)"]].forEach(function (par, j) {
          var v = m[par[0]][kk[1]], h;
          if (v === null) {
            o.push('<text x="' + (x0 + j * 28 + 12) + '" y="' + (base - 6) + '" text-anchor="middle" style="fill:var(--muted);font-size:10px">n. d.</text>');
            return;
          }
          h = Math.max(0.5, v * alto);
          o.push('<rect x="' + (x0 + j * 28) + '" y="' + (base - h) + '" width="24" height="' + h + '" style="fill:' + par[1] + ';fill-opacity:.75"/>');
          o.push('<text x="' + (x0 + j * 28 + 12) + '" y="' + (base - h - 3) + '" text-anchor="middle" style="fill:currentColor;font-size:10px">' + fmt(v * 100, 0) + '</text>');
        });
        o.push('<text x="' + (x0 + 26) + '" y="188" text-anchor="middle" style="fill:currentColor;font-size:11px">' + kk[0] + '</text>');
      });
      o.push('<rect x="40" y="198" width="10" height="8" style="fill:var(--accent);fill-opacity:.75"/><text x="54" y="206" style="fill:currentColor;font-size:10px">Supervisado</text>');
      o.push('<rect x="130" y="198" width="10" height="8" style="fill:var(--ex);fill-opacity:.75"/><text x="144" y="206" style="fill:currentColor;font-size:10px">Referencia</text>');
      o.push('<text x="350" y="206" text-anchor="end" style="fill:var(--muted);font-size:10px">% de cada grupo</text>');
      $("svg").innerHTML = o.join("");
    }

    function render() {
      var m = comparar(st.A, st.B, st.diMin, st.tol), marcos, nota = [], db = st.A.b - st.B.b;
      var perfecto = st.A.tpr > 0.995 && st.B.tpr > 0.995 && st.A.fpr < 0.005 && st.B.fpr < 0.005;
      sync();
      $("g").innerHTML = filaG("Supervisado", m.a) + filaG("Referencia", m.b);
      $("m").innerHTML =
        fila("Impacto dispar (razón)", m.di === null ? "n. d." : fmt(m.di, 3), "< " + fmt(st.diMin, 2), m.alertaDi) +
        fila("Paridad estadística (diferencia)", s(m.spd, 3), "|x| > " + fmt(st.tol, 2), m.alertaSpd) +
        fila("Diferencia de FPR", s(m.dfpr, 3), "|x| > " + fmt(st.tol, 2), m.alertaFpr) +
        fila("Diferencia de FNR", s(m.dfnr, 3), "|x| > " + fmt(st.tol, 2), m.alertaFnr) +
        fila("Diferencia de VPP", m.dppv === null ? "n. d." : s(m.dppv, 3), "|x| > " + fmt(st.tol, 2), m.alertaPpv);
      dibujar(m);
      marcos = [["Paridad estadística", "impacto dispar y su diferencia", m.paridad], ["Errores iguales", "FPR y FNR", m.errores], ["Valor predictivo igual", "VPP", m.predictiva]];
      $("k").innerHTML = marcos.map(function (c) {
        return '<div class="w-marco ' + (c[2] ? "w-si" : "w-no") + '"><b>' + c[0] + ': ' + (c[2] ? "se cumple" : "no se cumple") + '</b>' + c[1] + '</div>';
      }).join("");
      if (aviso) nota.push(aviso);
      nota.push("Se cumplen " + m.cumple + " de 3 marcos con estos umbrales.");
      if (Math.abs(db) >= 0.02) {
        if (m.cumple === 3) nota.push("Los tres caben en la tolerancia, pero las tasas base difieren (" + pc(st.A.b) + " y " + pc(st.B.b) + "): cuanto más estreches la tolerancia, antes dejarán de caber a la vez.");
        else if (perfecto) nota.push("Con predicción perfecta no hay errores y el VPP vale 100 %, pero la tasa favorable de cada grupo es su tasa base (" + pc(st.A.b) + " y " + pc(st.B.b) + "): la paridad no se cumple.");
        else nota.push("Las tasas base difieren (" + pc(st.A.b) + " y " + pc(st.B.b) + ") y el modelo no es perfecto: no salen los tres a la vez.");
        if (Math.abs(m.dfpr) < 0.005 && Math.abs(m.dfnr) < 0.005) nota.push("Con errores iguales, la brecha de tasa favorable es (bS − bR)·(TPR − FPR) = " + s(m.spdTeorica, 3) + ".");
      } else if (m.cumple < 3) {
        nota.push("Las tasas base son casi iguales: lo que falla no es la aritmética de las tasas base, sino que el modelo trata peor a un grupo.");
      }
      $("n").textContent = nota.join(" ");
    }

    function aplica(r) { st.A = r.A; aviso = r.aviso; render(); }
    $("e").addEventListener("click", function () { aplica(igualarErrores(st.A, st.B)); });
    $("v").addEventListener("click", function () { aplica(igualarFavorable(st.A, st.B)); });
    $("p").addEventListener("click", function () { aplica(igualarVpp(st.A, st.B)); });
    $("r").addEventListener("click", function () { st = JSON.parse(JSON.stringify(INICIO)); aviso = ""; render(); });
    render();
  }
})();
