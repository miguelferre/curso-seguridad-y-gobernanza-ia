/* Simulador "m07-l02-pronostico": el usuario da una probabilidad a 16 afirmaciones cuyo desenlace ya esta fijado
   (preguntas propias e ilustrativas, de cultura general). Al puntuar calcula su Brier, su error de calibracion RMS
   (5 tramos), su confianza media, su tasa de aciertos y su sobreconfianza, y los compara con un pronosticador de
   ejemplo (cifras inventadas para la leccion, no es un modelo real) y con el que responde siempre 50 %.
   Todas las probabilidades son porcentajes enteros, asi que los tramos no dependen de errores de coma flotante.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0, NB = 5;

  /* y = 1 si la afirmacion es cierta; ml = probabilidad (%) que da el pronosticador de ejemplo. */
  var PREG = [
    { t: "El monte Kilimanjaro está en Tanzania.", y: 1, ml: 95 },
    { t: "La capital de Australia es Sídney.", y: 0, ml: 15 },
    { t: "Brasil comparte frontera con Chile.", y: 0, ml: 15 },
    { t: "El Sáhara es el mayor desierto del mundo, contando también los polares.", y: 0, ml: 85 },
    { t: "Groenlandia tiene más superficie que México.", y: 1, ml: 20 },
    { t: "Lisboa está más al oeste que Santiago de Compostela.", y: 1, ml: 55 },
    { t: "Alemania tiene más habitantes que Francia.", y: 1, ml: 95 },
    { t: "La primera vacuna, la de la viruela, se desarrolló antes de 1800.", y: 1, ml: 95 },
    { t: "La penicilina se descubrió después de 1930.", y: 0, ml: 10 },
    { t: "El río Amazonas desemboca en el océano Pacífico.", y: 0, ml: 5 },
    { t: "En reposo, el cerebro consume cerca del 20 % de la energía del cuerpo.", y: 1, ml: 90 },
    { t: "La luz del Sol tarda menos de 10 minutos en llegar a la Tierra.", y: 1, ml: 85 },
    { t: "Australia tiene más habitantes que Canadá.", y: 0, ml: 10 },
    { t: "La Gran Muralla china se ve a simple vista desde la Luna.", y: 0, ml: 5 },
    { t: "La estructura de doble hélice del ADN se propuso antes de 1960.", y: 1, ml: 85 },
    { t: "Un adulto tiene más huesos que un recién nacido.", y: 0, ml: 90 }
  ];

  function ys() { return PREG.map(function (q) { return q.y; }); }
  function mlp() { return PREG.map(function (q) { return q.ml; }); }

  /* pct: probabilidades en % (enteros); y: desenlaces 0/1. */
  function metricas(pct, y) {
    var n = pct.length, i, b, br = 0, conf = 0, hit = 0, p, bs = [], rms = 0, g;
    for (b = 0; b < NB; b++) bs.push({ n: 0, sp: 0, sy: 0 });
    for (i = 0; i < n; i++) {
      p = pct[i] / 100;
      br += (p - y[i]) * (p - y[i]);
      conf += Math.max(p, 1 - p);
      hit += pct[i] > 50 ? y[i] : (pct[i] < 50 ? 1 - y[i] : 0.5);
      b = Math.min(NB - 1, Math.floor(pct[i] / (100 / NB)));
      bs[b].n++; bs[b].sp += p; bs[b].sy += y[i];
    }
    bs = bs.map(function (o) { return { n: o.n, conf: o.n ? o.sp / o.n : null, acc: o.n ? o.sy / o.n : null }; });
    bs.forEach(function (o) {
      if (!o.n) return;
      g = o.acc - o.conf;
      rms += o.n / n * g * g;
    });
    return { brier: br / n, rms: Math.sqrt(rms), conf: conf / n, acc: hit / n, sobre: conf / n - hit / n, bins: bs, n: n };
  }

  var core = { PREG: PREG, metricas: metricas, ys: ys, mlp: mlp };
  window.WIDGETS["m07-l02-pronostico"] = function (el) { buildUI(el); };
  window.WIDGETS["m07-l02-pronostico"].core = core;

  function injectStyle() {
    if (document.getElementById("w-pr-style")) return;
    var st = document.createElement("style");
    st.id = "w-pr-style";
    st.textContent = [
      ".w-pr{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pr h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pr .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pr .w-qs{margin:0 0 .8rem;padding:0;border:0}",
      ".w-pr .w-q{display:grid;grid-template-columns:1fr;gap:.25rem;padding:.55rem 0;border-top:1px solid var(--rule)}",
      ".w-pr .w-q:first-child{border-top:0}",
      ".w-pr .w-q label{color:var(--ink)}",
      ".w-pr .w-q .w-num{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;color:var(--faint);margin-right:.4rem}",
      ".w-pr .w-row{display:flex;align-items:center;gap:.7rem}",
      ".w-pr .w-row input[type=range]{flex:1;min-width:0;accent-color:var(--accent)}",
      ".w-pr .w-row output{font:600 .95rem var(--mono);color:var(--accent-ink);min-width:3.6rem;text-align:right}",
      ".w-pr .w-res{font:600 .8rem/1.35 var(--cond);color:var(--muted);min-height:1.1em}",
      ".w-pr .w-res b{color:var(--ex)}",
      ".w-pr .w-res b.w-mal{color:var(--trap)}",
      ".w-pr .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-pr button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-pr button:hover{background:var(--accent-soft)}",
      ".w-pr button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-pr .w-out{margin:0 0 .8rem}",
      ".w-pr .w-out[hidden]{display:none}",
      ".w-pr table{width:100%;border-collapse:collapse;font-size:.88rem;margin:0 0 .8rem}",
      ".w-pr th,.w-pr td{padding:.4rem .5rem;border-bottom:1px solid var(--rule);text-align:right}",
      ".w-pr th:first-child,.w-pr td:first-child{text-align:left}",
      ".w-pr th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-pr td{white-space:nowrap}",
      ".w-pr td:first-child{white-space:normal}",
      ".w-pr td.w-tu{color:var(--accent-ink);font-weight:600}",
      ".w-pr svg{display:block;width:100%;max-width:340px;height:auto;margin:0 auto .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-pr .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-pr .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function pts(x) { return (x >= 0 ? "+" : "−") + fmt(Math.abs(x) * 100, 1) + " pts"; }

  function buildUI(el) {
    injectStyle();
    var id = "w-pr-" + (++uid), Y = ys(), ML = mlp(), revelado = false, vals = [], i;
    for (i = 0; i < PREG.length; i++) vals.push(50);

    var rows = PREG.map(function (q, k) {
      return '<div class="w-q"><label for="' + id + '-s' + k + '"><span class="w-num">' + (k < 9 ? "0" : "") + (k + 1) + '</span>' + q.t + '</label>' +
        '<div class="w-row"><input type="range" id="' + id + '-s' + k + '" min="0" max="100" step="5" value="50" aria-label="Probabilidad de que sea cierta: ' + q.t.replace(/"/g, "") + '">' +
        '<output for="' + id + '-s' + k + '" id="' + id + '-v' + k + '">50 %</output></div>' +
        '<div class="w-res" id="' + id + '-r' + k + '"></div></div>';
    }).join("");

    el.innerHTML = '<div class="w-pr">' +
      '<h4>Pronóstico y calibración con 16 preguntas</h4>' +
      '<p class="w-hint">Cada afirmación es cierta o falsa, y su desenlace ya está fijado. Da la probabilidad de que sea cierta (0 % es seguro que es falsa, 100 % seguro que es cierta). Preguntas propias e ilustrativas, de cultura general. Al puntuar se calculan tu Brier y tu calibración y se comparan con un pronosticador de ejemplo, inventado, y con el que responde siempre 50 %.</p>' +
      '<fieldset class="w-qs"><legend class="w-hint">Tus probabilidades</legend>' + rows + '</fieldset>' +
      '<div class="w-btns">' +
      '<button type="button" class="w-main" id="' + id + '-go">Puntuar mis respuestas</button>' +
      '<button type="button" id="' + id + '-ext">Extremizar mis cifras</button>' +
      '<button type="button" id="' + id + '-sua">Suavizar mis cifras</button>' +
      '<button type="button" id="' + id + '-ml">Cargar el pronosticador de ejemplo</button>' +
      '<button type="button" id="' + id + '-c50">Todo al 50 %</button>' +
      '<button type="button" id="' + id + '-rst">Empezar de nuevo</button></div>' +
      '<div class="w-out" id="' + id + '-out" hidden>' +
      '<table><thead><tr><th></th><th>Tú</th><th>Ejemplo</th><th>Siempre 50 %</th></tr></thead><tbody>' +
      '<tr><td>Brier (menos es mejor)</td><td class="w-tu" id="' + id + '-b0"></td><td id="' + id + '-b1"></td><td id="' + id + '-b2"></td></tr>' +
      '<tr><td>Error de calibración RMS</td><td class="w-tu" id="' + id + '-c0"></td><td id="' + id + '-c1"></td><td id="' + id + '-c2"></td></tr>' +
      '<tr><td>Confianza media</td><td class="w-tu" id="' + id + '-f0"></td><td id="' + id + '-f1"></td><td id="' + id + '-f2"></td></tr>' +
      '<tr><td>Tasa de aciertos</td><td class="w-tu" id="' + id + '-a0"></td><td id="' + id + '-a1"></td><td id="' + id + '-a2"></td></tr>' +
      '<tr><td>Sobreconfianza</td><td class="w-tu" id="' + id + '-o0"></td><td id="' + id + '-o1"></td><td id="' + id + '-o2"></td></tr>' +
      '</tbody></table>' +
      '<svg id="' + id + '-svg" viewBox="0 0 300 280" role="img" aria-label=""></svg>' +
      '</div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite">Responde las 16 y pulsa "Puntuar". Con todo al 50 % sacarías exactamente 0,250.</p>' +
      '<p class="w-cap">Las probabilidades del pronosticador de ejemplo están inventadas para esta lección; no es un modelo real. Calibración en 5 tramos de 20 puntos. Con 16 preguntas los tramos tienen 1 a 6 casos y las medidas son muy ruidosas: sirven para ver el mecanismo, no para juzgar a nadie. Una tasa de aciertos cuenta el 50 % como medio acierto.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var svg = $("svg");

    function px(v) { return (40 + v * 240).toFixed(1); }
    function py(v) { return (240 - v * 220).toFixed(1); }

    function curva(m, color, dash) {
      var o = [], p = [];
      m.bins.forEach(function (b) { if (b.n) p.push([b.conf, b.acc, b.n]); });
      if (p.length > 1) {
        o.push('<polyline points="' + p.map(function (q) { return px(q[0]) + "," + py(q[1]); }).join(" ") + '" style="fill:none;stroke:' + color + ';stroke-width:2' + (dash ? ';stroke-dasharray:5 3' : '') + '"/>');
      }
      p.forEach(function (q) {
        o.push('<circle cx="' + px(q[0]) + '" cy="' + py(q[1]) + '" r="' + (3 + 1.4 * Math.sqrt(q[2])).toFixed(1) + '" style="fill:' + color + ';fill-opacity:.35;stroke:' + color + ';stroke-width:1.5"/>');
      });
      return o.join("");
    }

    function dibujar(mu, me) {
      var o = [], t;
      o.push('<rect x="40" y="20" width="240" height="220" style="fill:none;stroke:var(--rule-strong)"/>');
      for (t = 0; t <= 1.0001; t += 0.2) {
        o.push('<line x1="' + px(t) + '" y1="240" x2="' + px(t) + '" y2="244" style="stroke:var(--rule-strong)"/>');
        o.push('<text x="' + px(t) + '" y="257" text-anchor="middle" style="fill:var(--faint);font-size:10px">' + Math.round(t * 100) + '</text>');
        o.push('<line x1="36" y1="' + py(t) + '" x2="40" y2="' + py(t) + '" style="stroke:var(--rule-strong)"/>');
        o.push('<text x="33" y="' + (Number(py(t)) + 3.5) + '" text-anchor="end" style="fill:var(--faint);font-size:10px">' + Math.round(t * 100) + '</text>');
      }
      o.push('<line x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(1) + '" y2="' + py(1) + '" style="stroke:var(--faint);stroke-dasharray:4 4"/>');
      o.push(curva(me, "var(--trap)", true));
      o.push(curva(mu, "var(--accent)", false));
      o.push('<text x="160" y="273" text-anchor="middle" style="fill:var(--muted);font-size:10.5px">probabilidad dada (%)</text>');
      o.push('<text x="12" y="130" text-anchor="middle" transform="rotate(-90 12 130)" style="fill:var(--muted);font-size:10.5px">frecuencia real (%)</text>');
      o.push('<circle cx="52" cy="30" r="4" style="fill:var(--accent)"/><text x="60" y="34" style="fill:currentColor;font-size:10.5px">tú</text>');
      o.push('<circle cx="92" cy="30" r="4" style="fill:var(--trap)"/><text x="100" y="34" style="fill:currentColor;font-size:10.5px">ejemplo</text>');
      svg.innerHTML = o.join("");
      svg.setAttribute("aria-label", "Curva de fiabilidad: probabilidad dada frente a frecuencia real por tramos de 20 puntos, con la diagonal de calibración perfecta. Tu Brier " + fmt(mu.brier, 3) + " y el del ejemplo " + fmt(me.brier, 3) + ".");
    }

    function pinta(pre, m, bs) {
      $(pre + "0").textContent = bs[0]; $(pre + "1").textContent = bs[1]; $(pre + "2").textContent = bs[2];
    }

    function actualizar() {
      var k, mu, me, m5, v, r, e, txt;
      for (k = 0; k < vals.length; k++) {
        $("v" + k).textContent = vals[k] + " %";
        r = $("r" + k);
        if (!revelado) { r.textContent = ""; continue; }
        e = (vals[k] / 100 - Y[k]) * (vals[k] / 100 - Y[k]);
        r.innerHTML = 'Era <b class="' + (Y[k] ? "" : "w-mal") + '">' + (Y[k] ? "cierta" : "falsa") + '</b>. Tu error² ' + fmt(e, 4) + '. Ejemplo: ' + ML[k] + ' %, error² ' + fmt((ML[k] / 100 - Y[k]) * (ML[k] / 100 - Y[k]), 4) + '.';
      }
      $("out").hidden = !revelado;
      if (!revelado) return;
      mu = metricas(vals, Y); me = metricas(ML, Y);
      m5 = metricas(vals.map(function () { return 50; }), Y);
      pinta("b", mu, [fmt(mu.brier, 3), fmt(me.brier, 3), fmt(m5.brier, 3)]);
      pinta("c", mu, [fmt(mu.rms, 3), fmt(me.rms, 3), fmt(m5.rms, 3)]);
      pinta("f", mu, [fmt(mu.conf * 100, 1) + " %", fmt(me.conf * 100, 1) + " %", fmt(m5.conf * 100, 1) + " %"]);
      pinta("a", mu, [fmt(mu.acc * 100, 1) + " %", fmt(me.acc * 100, 1) + " %", fmt(m5.acc * 100, 1) + " %"]);
      pinta("o", mu, [pts(mu.sobre), pts(me.sobre), pts(m5.sobre)]);
      dibujar(mu, me);
      v = mu.brier < m5.brier - 1e-9 ? "mejor" : (mu.brier > m5.brier + 1e-9 ? "peor" : "igual");
      txt = "Tu Brier es " + fmt(mu.brier, 3) + ": " + (v === "igual" ? "igual que" : v + " que") + " el 0,250 de responder siempre 50 %, y " +
        (mu.brier < me.brier - 1e-9 ? "mejor" : (mu.brier > me.brier + 1e-9 ? "peor" : "igual")) + " que el " + fmt(me.brier, 3) + " del ejemplo. ";
      if (mu.sobre > 0.05) txt += "Vas sobreconfiado: tu confianza media supera tu tasa de aciertos en " + fmt(mu.sobre * 100, 1) + " puntos.";
      else if (mu.sobre < -0.05) txt += "Vas infraconfiado: aciertas " + fmt(-mu.sobre * 100, 1) + " puntos más de lo que dices.";
      else txt += "Tu confianza y tu tasa de aciertos están a menos de 5 puntos: casi calibrado.";
      txt += " El 50 % constante tiene error de calibración 0 porque acierta la mitad de las veces, y aun así no sirve de nada: calibrarse no basta.";
      $("note").textContent = txt;
    }

    function poner(fn) {
      var k;
      for (k = 0; k < vals.length; k++) {
        vals[k] = Math.max(0, Math.min(100, fn(vals[k], k)));
        $("s" + k).value = String(vals[k]);
      }
      actualizar();
    }

    PREG.forEach(function (q, k) {
      $("s" + k).addEventListener("input", function () { vals[k] = Number(this.value); actualizar(); });
    });
    $("go").addEventListener("click", function () { revelado = true; actualizar(); });
    $("ext").addEventListener("click", function () {
      poner(function (v) { return v > 50 ? 100 : (v < 50 ? 0 : 50); });
    });
    $("sua").addEventListener("click", function () {
      poner(function (v) { return Math.round((50 + (v - 50) * 0.6) / 5) * 5; });
    });
    $("ml").addEventListener("click", function () { poner(function (v, k) { return ML[k]; }); });
    $("c50").addEventListener("click", function () { poner(function () { return 50; }); });
    $("rst").addEventListener("click", function () {
      revelado = false;
      $("note").textContent = 'Responde las 16 y pulsa "Puntuar". Con todo al 50 % sacarías exactamente 0,250.';
      poner(function () { return 50; });
    });
    actualizar();
  }
})();
