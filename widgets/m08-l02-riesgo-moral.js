/* Simulador "m08-l02-riesgo-moral": una empresa decide si lanza un sistema con beneficio seguro y una pequena
   probabilidad de un dano enorme. Cuanto del dano asume ella (responsabilidad) decide si su calculo coincide con el de la sociedad.
   Modelo propio: VE empresa = (1-p)*G - p*s*H ; VE sociedad = (1-p)*G - p*H. Umbral de reparto s* = (1-p)*G / (p*H).
   Cifras en millones de euros. Sin dependencias; estilos con las variables del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function calc(G, p, H, s) {
    var ve = (1 - p) * G - p * s * H;
    var vs = (1 - p) * G - p * H;
    return {
      empresa: ve,
      sociedad: vs,
      tope: s * H,
      umbral: (1 - p) * G / (p * H),
      pCrit: G / (G + H),
      lanza: ve > 0,
      conviene: vs > 0
    };
  }

  function injectStyle() {
    if (document.getElementById("w-m8rm-style")) return;
    var st = document.createElement("style");
    st.id = "w-m8rm-style";
    st.textContent = [
      ".w-m8r{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m8r h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m8r .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m8r .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-m8r .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-m8r .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-m8r input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-m8r .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-m8r button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-m8r button:hover{background:var(--accent-soft)}",
      ".w-m8r svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-m8r dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-m8r dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-m8r dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-m8r dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-m8r .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-m8r .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function eur(x) { return fmt(x, 0) + " M€"; }

  var widget = function (el) {
    injectStyle();
    var id = "w-m8r-" + (++uid);
    var G = 500, P = 1, H = 200000, S = 1;

    el.innerHTML = '<div class="w-m8r">' +
      '<h4>Riesgo moral: quién paga si sale mal</h4>' +
      '<p class="w-hint">Una empresa puede lanzar un sistema que casi siempre le da un beneficio, pero que con cierta probabilidad causa un daño enorme. Decide con su propio cálculo. Mueve cuánto del daño le tocaría pagar a ella.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-g">Beneficio si todo sale bien <b id="' + id + '-gv"></b></label><input type="range" id="' + id + '-g" min="100" max="1000" step="50" value="' + G + '"></div>' +
      '<div class="w-f"><label for="' + id + '-p">Probabilidad del accidente <b id="' + id + '-pv"></b></label><input type="range" id="' + id + '-p" min="0.1" max="5" step="0.1" value="' + P + '"></div>' +
      '<div class="w-f"><label for="' + id + '-h">Daño a la sociedad <b id="' + id + '-hv"></b></label><input type="range" id="' + id + '-h" min="10000" max="500000" step="10000" value="' + H + '"></div>' +
      '<div class="w-f"><label for="' + id + '-s">Parte del daño que paga la empresa <b id="' + id + '-sv"></b></label><input type="range" id="' + id + '-s" min="0" max="100" step="1" value="' + S + '"></div>' +
      '</div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-all">La empresa paga todo el daño</button><button type="button" id="' + id + '-lim">Volver a la responsabilidad limitada</button></div>' +
      '<svg id="' + id + '-svg" viewBox="0 0 600 150" role="img" aria-label=""></svg>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Valor esperado para la empresa</dt><dd id="' + id + '-o-e"></dd></div>' +
      '<div><dt>Valor esperado para la sociedad</dt><dd id="' + id + '-o-s"></dd></div>' +
      '<div><dt>Máximo que pierde la empresa</dt><dd id="' + id + '-o-t"></dd></div>' +
      '<div><dt>Reparto mínimo para que desista</dt><dd id="' + id + '-o-u"></dd></div>' +
      '<div><dt>Probabilidad que anula el valor social</dt><dd id="' + id + '-o-c"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo propio con cifras inventadas, en millones de euros. Poner precio a un daño catastrófico es una simplificación de este ejercicio, no una valoración de vidas. La empresa decide con el valor esperado y es neutral al riesgo.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inG = $("g"), inP = $("p"), inH = $("h"), inS = $("s"), svg = $("svg");

    function draw(r) {
      var mx = Math.max(Math.abs(r.empresa), Math.abs(r.sociedad), 1), zero = 300, half = 250, o = [];
      function bar(y, v, col, txt) {
        var w = Math.abs(v) / mx * half, x = v >= 0 ? zero : zero - w;
        o.push('<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + Math.max(w, 1).toFixed(1) + '" height="30" rx="3" style="fill:' + col + '"/>');
        o.push('<text x="' + (v >= 0 ? zero + w + 6 : zero - w - 6).toFixed(1) + '" y="' + (y + 20) + '" text-anchor="' + (v >= 0 ? "start" : "end") + '" style="fill:currentColor;font-size:12px;font-weight:600">' + txt + '</text>');
      }
      o.push('<line x1="' + zero + '" y1="14" x2="' + zero + '" y2="136" style="stroke:var(--rule-strong);stroke-width:1.5"/>');
      o.push('<text x="' + zero + '" y="11" text-anchor="middle" style="fill:var(--faint);font-size:11px">0</text>');
      o.push('<text x="8" y="44" style="fill:var(--muted);font-size:12px;font-weight:600">Empresa</text>');
      o.push('<text x="8" y="100" style="fill:var(--muted);font-size:12px;font-weight:600">Sociedad</text>');
      bar(28, r.empresa, r.empresa >= 0 ? "var(--ex)" : "var(--trap)", eur(r.empresa));
      bar(84, r.sociedad, r.sociedad >= 0 ? "var(--ex)" : "var(--trap)", eur(r.sociedad));
      svg.innerHTML = o.join("");
      svg.setAttribute("aria-label", "Valor esperado para la empresa: " + eur(r.empresa) + ". Valor esperado para la sociedad: " + eur(r.sociedad) + ".");
    }

    function update() {
      var g = G, p = P / 100, h = H, s = S / 100, r = calc(g, p, h, s), note = $("note");
      $("gv").textContent = eur(G);
      $("pv").textContent = fmt(P, 1) + " %";
      $("hv").textContent = eur(H);
      $("sv").textContent = S + " %";
      $("o-e").textContent = eur(r.empresa);
      $("o-s").textContent = eur(r.sociedad);
      $("o-t").textContent = eur(r.tope);
      $("o-u").textContent = r.umbral > 1 ? "no basta ni con el 100 %" : fmt(r.umbral * 100, 1) + " % del daño";
      $("o-c").textContent = fmt(r.pCrit * 100, 2) + " %";
      if (r.lanza && !r.conviene) {
        note.textContent = "Riesgo moral: la empresa lanza porque solo paga " + eur(r.tope) + " si hay accidente, pero el cálculo de la sociedad es negativo. Necesitaría pagar al menos el " +
          fmt(r.umbral * 100, 1) + " % del daño para desistir.";
      } else if (!r.lanza && !r.conviene) {
        note.textContent = "Con esta parte del daño a su cargo, la empresa no lanza, y hace bien: a la sociedad tampoco le compensaba. Su cálculo y el social apuntan igual.";
      } else if (r.lanza && r.conviene) {
        note.textContent = "Aquí lanzar compensa a ambos: el riesgo es lo bastante pequeño frente al beneficio. Sube la probabilidad o el daño hasta que el valor social cambie de signo.";
      } else {
        note.textContent = "Este caso no puede darse en el modelo: como la empresa paga como máximo todo el daño, su valor esperado nunca es menor que el de la sociedad.";
      }
      draw(r);
    }

    inG.addEventListener("input", function () { G = parseInt(inG.value, 10); update(); });
    inP.addEventListener("input", function () { P = parseFloat(inP.value); update(); });
    inH.addEventListener("input", function () { H = parseInt(inH.value, 10); update(); });
    inS.addEventListener("input", function () { S = parseInt(inS.value, 10); update(); });
    $("all").addEventListener("click", function () { S = 100; inS.value = "100"; update(); });
    $("lim").addEventListener("click", function () { S = 1; inS.value = "1"; update(); });
    update();
  };

  widget.calc = calc;
  window.WIDGETS["m08-l02-riesgo-moral"] = widget;
})();
