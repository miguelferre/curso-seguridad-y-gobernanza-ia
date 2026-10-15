/* Simulador "m11-l01-loterias": dos loterias de dos resultados, una funcion de utilidad elegible
   (lineal, logaritmica o raiz) aplicada a la riqueza final (riqueza de partida + premio).
   Calcula valor esperado y utilidad esperada, muestra la preferencia por cada criterio y dibuja la curva.
   Opcion de reescalar la utilidad (3u + 7): cambian los numeros, no la eleccion.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-m11l01lo-style")) return;
    var st = document.createElement("style");
    st.id = "w-m11l01lo-style";
    st.textContent = [
      ".w-lo{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-lo h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-lo .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-lo .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-lo fieldset{border:1px solid var(--rule);border-radius:8px;padding:.5rem .7rem .7rem;margin:0}",
      ".w-lo legend{font:600 .8rem var(--cond);padding:0 .3rem;color:var(--accent-ink)}",
      ".w-lo .w-f{margin:.35rem 0 0}",
      ".w-lo .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-lo .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-lo input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-lo select{width:100%;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-lo .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:.2rem 0 .7rem;color:var(--ink)}",
      ".w-lo .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-lo button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer;margin:0 0 .8rem}",
      ".w-lo button:hover{background:var(--accent-soft)}",
      ".w-lo svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-lo dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-lo dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-lo dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-lo dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-lo .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-lo .w-note.w-diff{background:var(--trap-bg)}",
      ".w-lo .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }

  var FUN = {
    lin: { nombre: "lineal, u(x) = x", f: function (x) { return x; } },
    log: { nombre: "logaritmo, u(x) = ln x", f: function (x) { return Math.log(x); } },
    raiz: { nombre: "raíz, u(x) = √x", f: function (x) { return Math.sqrt(x); } }
  };

  window.WIDGETS["m11-l01-loterias"] = function (el) {
    injectStyle();
    var id = "w-lo-" + (++uid);
    var DEF = { w: 10, f: "log", sc: false, a: [20, 100, 0], b: [60, 40, 0] };
    var S = { w: DEF.w, f: DEF.f, sc: DEF.sc, a: DEF.a.slice(), b: DEF.b.slice() };

    function slider(key, idx, lab, min, max, val, unit) {
      var sid = id + "-" + key + idx;
      return '<div class="w-f"><label for="' + sid + '">' + lab + ' <b id="' + sid + 'v"></b></label>' +
        '<input type="range" id="' + sid + '" min="' + min + '" max="' + max + '" step="1" value="' + val + '"></div>';
    }

    el.innerHTML = '<div class="w-lo">' +
      '<h4>Valor esperado frente a utilidad esperada</h4>' +
      '<p class="w-hint">Dos loterías de dos resultados. Los premios son en miles de euros y se suman a tu presupuesto de partida; la utilidad se aplica a la riqueza final.</p>' +
      '<div class="w-grid">' +
      '<fieldset><legend>Lotería A</legend>' +
      slider("a", 0, "Premio 1", 0, 100, S.a[0]) + slider("a", 1, "Prob. del premio 1", 0, 100, S.a[1]) + slider("a", 2, "Premio 2", 0, 100, S.a[2]) +
      '</fieldset>' +
      '<fieldset><legend>Lotería B</legend>' +
      slider("b", 0, "Premio 1", 0, 100, S.b[0]) + slider("b", 1, "Prob. del premio 1", 0, 100, S.b[1]) + slider("b", 2, "Premio 2", 0, 100, S.b[2]) +
      '</fieldset>' +
      '<fieldset><legend>Agente</legend>' +
      '<div class="w-f"><label for="' + id + '-fun">Función de utilidad</label><select id="' + id + '-fun">' +
      '<option value="lin">Lineal: x</option><option value="log">Logaritmo: ln x</option><option value="raiz">Raíz: √x</option></select></div>' +
      slider("w", "", "Presupuesto de partida", 1, 200, S.w) +
      '<div class="w-f"><label class="w-chk" style="text-transform:none;letter-spacing:0;font-family:inherit;color:var(--ink);justify-content:flex-start"><input type="checkbox" id="' + id + '-sc"><span>Reescalar la utilidad: 3u + 7</span></label></div>' +
      '</fieldset>' +
      '</div>' +
      '<button type="button" id="' + id + '-rs">Volver a los valores iniciales</button>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 240" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Valor esperado de A</dt><dd id="' + id + '-eva"></dd></div>' +
      '<div><dt>Valor esperado de B</dt><dd id="' + id + '-evb"></dd></div>' +
      '<div><dt>Utilidad esperada de A</dt><dd id="' + id + '-eua"></dd></div>' +
      '<div><dt>Utilidad esperada de B</dt><dd id="' + id + '-eub"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-n1" aria-live="polite"></p>' +
      '<p class="w-note" id="' + id + '-n2" aria-live="polite"></p>' +
      '<p class="w-cap">Círculo: resultado de A. Cuadrado: resultado de B. Las líneas discontinuas marcan la utilidad esperada de cada lotería. La utilidad es una escala arbitraria: compara siempre dentro de la misma función.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var svg = $("svg");
    $("fun").value = S.f;

    function util(x) {
      var v = FUN[S.f].f(x);
      return S.sc ? 3 * v + 7 : v;
    }
    function lot(a) { // a = [premio1, p1 en %, premio2]
      var p = a[1] / 100;
      return [{ o: a[0], p: p }, { o: a[2], p: 1 - p }];
    }
    function ev(l) { return l.reduce(function (s, x) { return s + x.p * x.o; }, 0); }
    function eu(l) { return l.reduce(function (s, x) { return s + x.p * util(S.w + x.o); }, 0); }
    function verdict(a, b, nameA, nameB, d) {
      if (Math.abs(a - b) < 1e-9) return { w: "indiferente", txt: "hay indiferencia (" + fmt(a, d) + " en los dos)" };
      return a > b ? { w: "A", txt: "se prefiere A (" + fmt(a, d) + " frente a " + fmt(b, d) + ")" } : { w: "B", txt: "se prefiere B (" + fmt(b, d) + " frente a " + fmt(a, d) + ")" };
    }

    function draw(LA, LB, uA, uB) {
      var W = 600, H = 240, ml = 52, mr = 16, mt = 14, mb = 40;
      var prizes = [S.a[0], S.a[2], S.b[0], S.b[2]];
      var xmin = S.w, xmax = S.w + Math.max(1, Math.max.apply(null, prizes));
      var i, n = 60, pts = [], ymin = Infinity, ymax = -Infinity, y, x;
      for (i = 0; i <= n; i++) {
        x = xmin + (xmax - xmin) * i / n;
        y = util(x);
        if (y < ymin) ymin = y; if (y > ymax) ymax = y;
      }
      var pad = (ymax - ymin) * 0.08 || 1;
      ymin -= pad; ymax += pad;
      function X(v) { return ml + (v - xmin) / (xmax - xmin) * (W - ml - mr); }
      function Y(v) { return mt + (ymax - v) / (ymax - ymin) * (H - mt - mb); }
      var out = [];
      out.push('<line x1="' + ml + '" y1="' + (H - mb) + '" x2="' + (W - mr) + '" y2="' + (H - mb) + '" style="stroke:var(--rule-strong)"/>');
      out.push('<line x1="' + ml + '" y1="' + mt + '" x2="' + ml + '" y2="' + (H - mb) + '" style="stroke:var(--rule-strong)"/>');
      for (i = 0; i <= n; i++) {
        x = xmin + (xmax - xmin) * i / n;
        pts.push(X(x).toFixed(1) + "," + Y(util(x)).toFixed(1));
      }
      out.push('<polyline points="' + pts.join(" ") + '" style="fill:none;stroke:var(--muted);stroke-width:2"/>');
      // lineas de utilidad esperada
      out.push('<line x1="' + ml + '" y1="' + Y(uA).toFixed(1) + '" x2="' + (W - mr) + '" y2="' + Y(uA).toFixed(1) + '" style="stroke:var(--accent);stroke-width:1.5;stroke-dasharray:6 4"/>');
      out.push('<line x1="' + ml + '" y1="' + Y(uB).toFixed(1) + '" x2="' + (W - mr) + '" y2="' + Y(uB).toFixed(1) + '" style="stroke:var(--trap);stroke-width:1.5;stroke-dasharray:2 4"/>');
      var near = Math.abs(Y(uA) - Y(uB)) < 13;
      out.push('<text x="' + (W - mr - 4) + '" y="' + (Y(uA) - 4).toFixed(1) + '" text-anchor="end" style="fill:var(--accent-ink);font-size:11px">U(A)</text>');
      out.push('<text x="' + (W - mr - 4) + '" y="' + (near ? Y(uB) + 12 : Y(uB) - 4).toFixed(1) + '" text-anchor="end" style="fill:var(--trap);font-size:11px">U(B)</text>');
      LA.forEach(function (l) {
        if (l.p <= 0) return;
        out.push('<circle cx="' + X(S.w + l.o).toFixed(1) + '" cy="' + Y(util(S.w + l.o)).toFixed(1) + '" r="' + (4 + 6 * l.p).toFixed(1) + '" style="fill:var(--accent);fill-opacity:.55;stroke:var(--accent);stroke-width:1.5"/>');
      });
      LB.forEach(function (l) {
        if (l.p <= 0) return;
        var r = 4 + 6 * l.p, cx = X(S.w + l.o), cy = Y(util(S.w + l.o));
        out.push('<rect x="' + (cx - r).toFixed(1) + '" y="' + (cy - r).toFixed(1) + '" width="' + (2 * r).toFixed(1) + '" height="' + (2 * r).toFixed(1) + '" style="fill:var(--trap);fill-opacity:.45;stroke:var(--trap);stroke-width:1.5"/>');
      });
      out.push('<text x="' + ((ml + W - mr) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" style="fill:var(--muted);font-size:11.5px">riqueza final (miles de €)</text>');
      out.push('<text x="' + ml + '" y="' + (H - mb + 15) + '" text-anchor="middle" style="fill:var(--muted);font-size:11px">' + fmt(xmin, 0) + '</text>');
      out.push('<text x="' + (W - mr) + '" y="' + (H - mb + 15) + '" text-anchor="end" style="fill:var(--muted);font-size:11px">' + fmt(xmax, 0) + '</text>');
      out.push('<text x="14" y="' + ((mt + H - mb) / 2) + '" text-anchor="middle" transform="rotate(-90 14 ' + ((mt + H - mb) / 2) + ')" style="fill:var(--muted);font-size:11.5px">utilidad</text>');
      svg.innerHTML = out.join("");
    }

    function update() {
      var LA = lot(S.a), LB = lot(S.b);
      var eva = ev(LA), evb = ev(LB), eua = eu(LA), eub = eu(LB);
      var k, keys = ["a0", "a1", "a2", "b0", "b1", "b2"];
      $("a0v").textContent = fmt(S.a[0], 0); $("a1v").textContent = S.a[1] + " %"; $("a2v").textContent = fmt(S.a[2], 0);
      $("b0v").textContent = fmt(S.b[0], 0); $("b1v").textContent = S.b[1] + " %"; $("b2v").textContent = fmt(S.b[2], 0);
      $("wv").textContent = fmt(S.w, 0);
      $("eva").textContent = fmt(eva, 2); $("evb").textContent = fmt(evb, 2);
      $("eua").textContent = fmt(eua, 4); $("eub").textContent = fmt(eub, 4);
      var v1 = verdict(eva, evb, "A", "B", 2), v2 = verdict(eua, eub, "A", "B", 4);
      $("n1").innerHTML = "Por <strong>valor esperado</strong> " + v1.txt + ".";
      $("n2").innerHTML = "Por <strong>utilidad esperada</strong> (" + FUN[S.f].nombre + (S.sc ? ", reescalada" : "") + ") " + v2.txt + ".";
      $("n2").className = "w-note" + (v1.w !== v2.w ? " w-diff" : "");
      if (v1.w !== v2.w) $("n2").innerHTML += " <strong>Los dos criterios discrepan.</strong>";
      draw(LA, LB, eua, eub);
      svg.setAttribute("aria-label", "Curva de utilidad " + FUN[S.f].nombre + " sobre la riqueza final, con los resultados de A y de B y sus utilidades esperadas: " + fmt(eua, 4) + " para A y " + fmt(eub, 4) + " para B.");
    }

    function bind(key, idx, arr) {
      var inp = $(key + idx);
      inp.addEventListener("input", function () { arr[idx] = Number(inp.value); update(); });
    }
    [0, 1, 2].forEach(function (i) { bind("a", i, S.a); bind("b", i, S.b); });
    var inW = $("w");
    inW.addEventListener("input", function () { S.w = Number(inW.value); update(); });
    $("fun").addEventListener("change", function (e) { S.f = e.target.value; update(); });
    $("sc").addEventListener("change", function (e) { S.sc = e.target.checked; update(); });
    $("rs").addEventListener("click", function () {
      S.w = DEF.w; S.f = DEF.f; S.sc = DEF.sc; S.a = DEF.a.slice(); S.b = DEF.b.slice();
      [0, 1, 2].forEach(function (i) { $("a" + i).value = S.a[i]; $("b" + i).value = S.b[i]; });
      inW.value = S.w; $("fun").value = S.f; $("sc").checked = S.sc;
      update();
    });
    update();
  };
})();
