/* Simulador "m06-l02-calidad": matriz de confusion editable, prevalencia de produccion y retraso del feedback.
   Parte 1: con la matriz (iniciales del Atlas, sinteticas) calcula las metricas de calidad y las traslada a otra
   prevalencia manteniendo sensibilidad y especificidad. Parte 2: con lotes semanales, cobertura de etiquetas, minimo de
   feedback y retraso, cuenta cuantos lotes quedan sin calidad medida y cuando se veria un fallo.
   Modelo de retraso y traslado de prevalencia: propios (ver Fuentes de la leccion). Intervalo de Wilson: ficha del Atlas.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var H = 16;          /* horizonte en semanas */
  var UMBRAL = 0.80;   /* umbral inferior de exactitud del ejemplo del Atlas */
  var REF = { acc: 0.80, pr: 0.70, rc: 0.70, f1: 0.70, mcc: 0.60 };
  var ATLAS = { tp: 325, fn: 78, fp: 47, tn: 550 };
  var SANO = { tp: 0, fn: 50, fp: 0, tn: 950 };

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function div(a, b) { return b > 0 ? a / b : null; }
  function f3(x) { return x === null ? "sin definir" : fmt(x, 3); }

  /* Metricas de la matriz (los conteos pueden ser fraccionarios: sirven tambien para la columna de produccion). */
  function metricas(tp, fn, fp, tn) {
    var n = tp + fn + fp + tn, den = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)), rc = div(tp, tp + fn), sp = div(tn, tn + fp);
    return {
      n: n,
      prev: div(tp + fn, n),
      acc: div(tp + tn, n),
      pr: div(tp, tp + fp),
      rc: rc,
      sp: sp,
      vpn: div(tn, tn + fn),
      f1: div(2 * tp, 2 * tp + fp + fn),
      ba: rc !== null && sp !== null ? (rc + sp) / 2 : null,
      mcc: den > 0 ? (tp * tn - fp * fn) / den : null
    };
  }

  /* Misma sensibilidad y especificidad con otra prevalencia, por cada 1.000 casos (calculo propio, teorema de Bayes). */
  function proyectar(c, prev) {
    var pos = c.tp + c.fn, neg = c.fp + c.tn, tpr, tnr;
    if (pos <= 0 || neg <= 0) return null;
    tpr = c.tp / pos; tnr = c.tn / neg;
    return { tp: prev * tpr * 1000, fn: prev * (1 - tpr) * 1000, fp: (1 - prev) * (1 - tnr) * 1000, tn: (1 - prev) * tnr * 1000 };
  }

  /* Intervalo de Wilson al 95 % para una proporcion p con n casos (n puede ser fraccionario). */
  function wilson(p, n) {
    var z = 1.96, z2 = z * z, c, h;
    if (!(n > 0)) return null;
    c = (p + z2 / (2 * n)) / (1 + z2 / n);
    h = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / (1 + z2 / n);
    return [Math.max(0, c - h), Math.min(1, c + h)];
  }

  /* Modelo de retraso (propio). Cada semana entra un lote de n casos; una fraccion c acaba con etiqueta y esta llega d semanas
     despues. El monitor mide cuando reune min etiquetas nuevas: agrupa g lotes consecutivos, con g = ceil(min / etiquetas por lote),
     y publica la medicion del grupo en la semana (ultimo lote del grupo + d). */
  function plan(n, c, mn, d, W) {
    var lab = Math.max(0, Math.round(n * c / 100)), g = lab > 0 ? Math.ceil(mn / lab) : Infinity;
    var M = [], meds = [], blind = [], i, t, j, k, medidos = 0, suma = 0, sinMedir;
    for (i = 1; i <= H; i++) M.push(isFinite(g) ? Math.ceil(i / g) * g + d : Infinity);
    if (isFinite(g)) for (j = 1; j * g + d <= H; j++) meds.push(j * g + d);
    for (t = 1; t <= H; t++) {
      k = 0;
      for (i = 1; i <= t; i++) if (M[i - 1] > t) k++;
      blind.push(k);
    }
    for (i = 1; i <= H; i++) if (M[i - 1] <= H) { medidos++; suma += M[i - 1] - i; }
    sinMedir = H - medidos;
    return {
      lab: lab, g: g, M: M, meds: meds, blind: blind, medidos: medidos, sinMedir: sinMedir,
      primera: meds.length ? meds[0] : null,
      retrasoMedio: medidos ? suma / medidos : null,
      vista: M[W - 1],
      porMedicion: isFinite(g) ? lab * g : null
    };
  }

  function injectStyle() {
    if (document.getElementById("w-cq-style")) return;
    var st = document.createElement("style");
    st.id = "w-cq-style";
    st.textContent = [
      ".w-cq{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cq h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cq h5{font:600 .74rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-cq .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cq .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-cq .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-cq .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-cq input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-cq table{width:100%;border-collapse:collapse;margin:0 0 .8rem;font-size:.86rem}",
      ".w-cq th,.w-cq td{text-align:right;padding:.3rem .5rem;border-bottom:1px solid var(--rule)}",
      ".w-cq th:first-child,.w-cq td:first-child{text-align:left}",
      ".w-cq th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-cq table.w-mx{width:auto;min-width:16rem}",
      ".w-cq table.w-mx td{text-align:center}",
      ".w-cq input[type=number]{width:5.5rem;font:500 .95rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:6px;padding:.3rem .4rem;text-align:right}",
      ".w-cq .w-btns{display:flex;flex-wrap:wrap;gap:.5rem;margin:.2rem 0 .7rem}",
      ".w-cq button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .7rem;cursor:pointer}",
      ".w-cq button:hover{background:var(--accent-soft)}",
      ".w-cq .w-bad{color:var(--trap);font-weight:600}",
      ".w-cq .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-cq svg{display:block;width:100%;max-width:38rem;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-cq .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-cq .w-leg{list-style:none;margin:.5rem 0 .8rem;padding:0;font-size:.8rem;color:var(--muted)}",
      ".w-cq .w-leg li{margin:0 0 .15rem}",
      ".w-cq td,.w-cq th{overflow-wrap:anywhere}",
      ".w-cq .tw table{min-width:0}",
      ".w-cq table.w-met{table-layout:fixed}.w-cq table.w-met th:first-child{width:32%}",
      "@media (max-width:560px){.w-cq table.w-res,.w-cq table.w-res tbody{display:block;width:100%}.w-cq table.w-res thead{display:none}.w-cq table.w-res td{display:block;text-align:left;border-bottom:0;padding:.15rem .5rem}.w-cq table.w-res td:first-child{font-weight:600;padding-top:.5rem}.w-cq table.w-res tr{border-bottom:1px solid var(--rule);display:block}.w-cq th,.w-cq td{padding:.3rem .3rem}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  var SLIDERS = [
    { k: "prev", et: "Prevalencia en producción", min: 1, max: 60, step: 1, u: " %" },
    { k: "n", et: "Casos por lote (semanal)", min: 50, max: 1000, step: 50, u: "" },
    { k: "c", et: "Casos que acaban con etiqueta", min: 1, max: 50, step: 1, u: " %" },
    { k: "mn", et: "Mínimo de etiquetas para medir", min: 20, max: 500, step: 10, u: "" },
    { k: "d", et: "Retraso del feedback (semanas)", min: 0, max: 12, step: 1, u: "" },
    { k: "W", et: "Semana en que empieza el fallo", min: 1, max: 16, step: 1, u: "" }
  ];
  var CELDAS = [
    { k: "tp", et: "Verdaderos positivos (TP)" }, { k: "fp", et: "Falsos positivos (FP)" },
    { k: "fn", et: "Falsos negativos (FN)" }, { k: "tn", et: "Verdaderos negativos (TN)" }
  ];
  var FILAS = [
    ["Exactitud", "acc"], ["Precisión", "pr"], ["Sensibilidad (recall)", "rc"], ["Especificidad", "sp"],
    ["Valor predictivo negativo", "vpn"], ["F1", "f1"], ["Exactitud equilibrada", "ba"], ["MCC", "mcc"]
  ];

  function grafico(p, W) {
    var X0 = 66, ST = 19.5, CW = 17, o = [], i, t, bh, cx, mx = 0, txt;
    function x(k) { return X0 + (k - 1) * ST; }
    function lab(px, py, s) { return '<text x="' + px + '" y="' + py + '" style="fill:var(--muted);font-size:9px">' + s + '</text>'; }
    for (t = 0; t < H; t++) mx = Math.max(mx, p.blind[t]);
    o.push(lab(4, 29, "Lote"), lab(4, 52, "Medición"), lab(4, 86, "Lotes"), lab(4, 97, "ciegos"), lab(4, 142, "Fallo"));
    for (i = 1; i <= H; i++) {
      o.push('<text x="' + (x(i) + CW / 2) + '" y="11" text-anchor="middle" style="fill:var(--muted);font-size:8px">' + i + '</text>');
      o.push('<rect x="' + x(i) + '" y="16" width="' + CW + '" height="18" rx="3" style="' +
        (p.M[i - 1] <= H ? 'fill:var(--accent);stroke:var(--accent-ink);stroke-width:1' : 'fill:none;stroke:var(--trap);stroke-width:1.5;stroke-dasharray:3 2') + '"/>');
    }
    p.meds.forEach(function (m) {
      cx = x(m) + CW / 2;
      o.push('<path d="M' + cx + ' 42 l6 6 l-6 6 l-6 -6 z" style="fill:var(--m-calidad);stroke:var(--surface)"/>');
    });
    o.push('<line x1="' + X0 + '" y1="112" x2="' + (X0 + H * ST) + '" y2="112" style="stroke:var(--rule-strong)"/>');
    for (t = 1; t <= H; t++) {
      bh = p.blind[t - 1] / H * 44;
      if (bh > 0) o.push('<rect x="' + x(t) + '" y="' + (112 - bh) + '" width="' + CW + '" height="' + bh + '" style="fill:var(--trap-bg);stroke:var(--trap);stroke-width:1"><title>Semana ' + t + ': ' + p.blind[t - 1] + ' lotes ciegos</title></rect>');
    }
    cx = x(W) + CW / 2;
    o.push('<path d="M' + cx + ' 118 l6 9 h-12 z" style="fill:var(--m-equidad)"/>');
    o.push('<text x="' + cx + '" y="141" text-anchor="middle" style="fill:var(--m-equidad);font-size:9px;font-weight:700">F</text>');
    if (p.vista <= H) {
      cx = x(p.vista) + CW / 2;
      o.push('<path d="M' + cx + ' 118 l6 9 h-12 z" style="fill:var(--ex)"/>');
      o.push('<text x="' + cx + '" y="141" text-anchor="middle" style="fill:var(--ex);font-size:9px;font-weight:700">V</text>');
    }
    txt = "Lotes 1 a " + H + ": " + p.medidos + " con calidad medida y " + p.sinMedir + " sin medir en la semana " + H + ". Máximo de lotes ciegos a la vez: " + mx + ".";
    return '<svg viewBox="0 0 380 150" role="img" aria-label="' + txt + '"><title>' + txt + '</title>' + o.join("") + '</svg>';
  }

  window.WIDGETS["m06-l02-calidad"] = function (el) {
    injectStyle();
    var id = "w-cq-" + (++uid);
    var S = { tp: ATLAS.tp, fn: ATLAS.fn, fp: ATLAS.fp, tn: ATLAS.tn, prev: 10, n: 450, c: 10, mn: 100, d: 4, W: 6 };

    function inp(k, et) {
      return '<input type="number" min="0" max="100000" step="1" inputmode="numeric" id="' + id + '-' + k + '" value="' + S[k] + '" aria-label="' + et + '">';
    }
    function sl(d) {
      return '<div class="w-f"><label for="' + id + '-' + d.k + '">' + d.et + ' <b id="' + id + '-' + d.k + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + d.k + '" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + S[d.k] + '"></div>';
    }
    var byK = {};
    SLIDERS.forEach(function (d) { byK[d.k] = d; });

    el.innerHTML = '<div class="w-cq">' +
      '<h4>Calidad con etiquetas tardías</h4>' +
      '<p class="w-hint">Datos sintéticos. Arriba, una matriz de confusión que puedes editar y la prevalencia real de producción; abajo, cuántos lotes quedan sin calidad medida porque las etiquetas llegan tarde y en poca cantidad.</p>' +
      '<h5>1. Matriz de confusión y prevalencia</h5>' +
      '<table class="w-mx"><thead><tr><th></th><th scope="col">Real: sí</th><th scope="col">Real: no</th></tr></thead><tbody>' +
      '<tr><th scope="row">Predicho: sí</th><td>' + inp("tp", CELDAS[0].et) + '</td><td>' + inp("fp", CELDAS[1].et) + '</td></tr>' +
      '<tr><th scope="row">Predicho: no</th><td>' + inp("fn", CELDAS[2].et) + '</td><td>' + inp("tn", CELDAS[3].et) + '</td></tr></tbody></table>' +
      '<div class="w-btns"><button type="button" id="' + id + '-atlas">Ejemplo del Atlas (325, 78, 47, 550)</button>' +
      '<button type="button" id="' + id + '-sano">Cribado 5 %: siempre sano (0, 50, 0, 950)</button></div>' +
      '<div class="w-grid">' + sl(byK.prev) + '</div>' +
      '<div class="tw"><table class="w-met"><thead><tr><th>Métrica</th><th>Matriz editada</th><th id="' + id + '-hp">Con otra prevalencia</th><th>Umbral (Atlas)</th></tr></thead><tbody id="' + id + '-tb"></tbody></table></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap" id="' + id + '-mx2"></p>' +
      '<h5>2. Etiquetas que llegan tarde</h5>' +
      '<div class="w-grid">' + sl(byK.n) + sl(byK.c) + sl(byK.mn) + sl(byK.d) + sl(byK.W) + '</div>' +
      '<div id="' + id + '-svg"></div>' +
      '<ul class="w-leg"><li>Fila de lotes: relleno = calidad ya medida en la semana ' + H + '; borde discontinuo = lote sin medir.</li>' +
      '<li>Diamantes: semanas en que el monitor publica una medición nueva. Barras: lotes ciegos en cada semana (ya decidiendo, sin calidad conocida).</li>' +
      '<li>F: semana en que empieza el fallo. V: semana en que una medición lo recoge.</li></ul>' +
      '<div class="tw"><table class="w-res"><thead><tr><th>Resultado (horizonte de ' + H + ' semanas)</th><th>Valor</th></tr></thead><tbody id="' + id + '-tb2"></tbody></table></div>' +
      '<p class="w-note" id="' + id + '-note2" aria-live="polite"></p>' +
      '<p class="w-cap">Modelo propio: cada semana entra un lote; una fracción acaba con etiqueta y llega tras el retraso; el monitor espera a reunir el mínimo y mide juntos los lotes que hagan falta. La detección del fallo supone un efecto lo bastante grande para cruzar el umbral, sin dilución con los lotes sanos del mismo grupo: es una cota optimista.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    function pct(v) { return v === null ? "sin definir" : fmt(v * 100, 1) + " %"; }
    function val(v, ref) {
      if (v === null) return "sin definir";
      return f3(v) + (ref !== undefined && v < ref ? ' <span class="w-bad">(bajo el umbral)</span>' : "");
    }

    function render() {
      var m1 = metricas(S.tp, S.fn, S.fp, S.tn), pj = proyectar(S, S.prev / 100), m2 = pj ? metricas(pj.tp, pj.fn, pj.fp, pj.tn) : null;
      var p = plan(S.n, S.c, S.mn, S.d, S.W), acc = m2 && m2.acc !== null ? m2.acc : m1.acc;
      var rows = "", r2 = "", nota, nota2, ic, ic2, pos, vis, k, mx = 0;

      SLIDERS.forEach(function (d) { $(d.k + "v").textContent = S[d.k] + d.u; });
      $("hp").textContent = "Con prevalencia " + S.prev + " %";
      rows += '<tr><td>Prevalencia</td><td>' + pct(m1.prev) + '</td><td>' + (m2 ? pct(m2.prev) : "sin definir") + '</td><td>no aplica</td></tr>';
      FILAS.forEach(function (f) {
        var ref = REF[f[1]];
        rows += '<tr><td>' + f[0] + '</td><td>' + val(m1[f[1]], ref) + '</td><td>' + (m2 ? val(m2[f[1]], ref) : "sin definir") + '</td><td>' + (ref !== undefined ? fmt(ref, 2) : "no aplica") + '</td></tr>';
      });
      $("tb").innerHTML = rows;
      $("mx2").textContent = pj ? "Con prevalencia " + S.prev + " %, por cada 1.000 casos: TP " + fmt(pj.tp, 0) + ", FN " + fmt(pj.fn, 0) + ", FP " + fmt(pj.fp, 0) + ", TN " + fmt(pj.tn, 0) + " (redondeado; las métricas usan las cifras exactas)." : "";

      if (m1.n <= 0) nota = "Escribe algún caso en la matriz para ver las métricas.";
      else if (!m2) nota = "Para trasladar la matriz a otra prevalencia hacen falta casos positivos y negativos reales en la matriz.";
      else {
        nota = "Mismo modelo (sensibilidad " + f3(m1.rc) + ", especificidad " + f3(m1.sp) + ") con prevalencia " + S.prev + " %: la exactitud pasa de " + f3(m1.acc) + " a " + f3(m2.acc) +
          (m1.pr !== null && m2.pr !== null ? " y la precisión de " + f3(m1.pr) + " a " + f3(m2.pr) + "." : ". La precisión no está definida si el modelo no marca ningún caso como positivo.");
        if (m2.pr !== null && m1.pr !== null && m2.acc > m1.acc && m2.pr < m1.pr) nota += " La exactitud sube mientras la precisión cae: una sola métrica puede contar dos historias.";
        if (m1.rc === 0 && m1.acc !== null && m1.acc >= 0.9) nota += " El modelo no detecta ningún caso y aun así su exactitud es " + f3(m1.acc) + ".";
      }
      $("note").textContent = nota;

      $("svg").innerHTML = grafico(p, S.W);
      for (k = 0; k < H; k++) mx = Math.max(mx, p.blind[k]);
      r2 += '<tr><td>Etiquetas que llegan por lote</td><td>' + p.lab + '</td></tr>';
      r2 += '<tr><td>Lotes que se miden juntos</td><td>' + (isFinite(p.g) ? p.g : "no se llega nunca al mínimo") + '</td></tr>';
      r2 += '<tr><td>Etiquetas por medición</td><td>' + (p.porMedicion === null ? "sin definir" : p.porMedicion) + '</td></tr>';
      r2 += '<tr><td>Primera medición</td><td>' + (p.primera === null ? "no llega en " + H + " semanas" : "semana " + p.primera) + '</td></tr>';
      r2 += '<tr><td>Mediciones publicadas</td><td>' + p.meds.length + '</td></tr>';
      r2 += '<tr><td>Semanas sin ninguna medición nueva</td><td>' + (H - p.meds.length) + ' de ' + H + '</td></tr>';
      r2 += '<tr><td>Lotes sin medir en la semana ' + H + '</td><td>' + p.sinMedir + ' de ' + H + ' (' + fmt(p.sinMedir / H * 100, 0) + ' %)</td></tr>';
      r2 += '<tr><td>Máximo de lotes ciegos a la vez</td><td>' + mx + '</td></tr>';
      r2 += '<tr><td>Retraso medio entre decidir y conocer la calidad</td><td>' + (p.retrasoMedio === null ? "sin definir" : fmt(p.retrasoMedio, 1) + " semanas") + '</td></tr>';
      if (!isFinite(p.vista)) vis = "no se ve nunca";
      else if (p.vista <= H) vis = "se ve en la semana " + p.vista + ", tras " + (p.vista - S.W) + " semanas con el modelo fallando";
      else vis = "se vería en la semana " + p.vista + ", fuera de las " + H + " semanas";
      r2 += '<tr><td>Fallo desde la semana ' + S.W + '</td><td>' + vis + '</td></tr>';
      if (p.porMedicion !== null && acc !== null) {
        ic = wilson(acc, p.porMedicion);
        r2 += '<tr><td>Exactitud de producción con IC de Wilson al 95 %</td><td>' + fmt(acc, 3) + ' [' + fmt(ic[0], 3) + '; ' + fmt(ic[1], 3) + ']</td></tr>';
        pos = p.porMedicion * S.prev / 100;
        if (m1.rc !== null && pos > 0) {
          ic2 = wilson(m1.rc, pos);
          r2 += '<tr><td>Positivos esperados por medición y sensibilidad con su IC</td><td>≈ ' + fmt(pos, 1) + '; ' + fmt(m1.rc, 3) + ' [' + fmt(ic2[0], 3) + '; ' + fmt(ic2[1], 3) + ']</td></tr>';
        }
        nota2 = ic[0] > UMBRAL ? "El intervalo de la exactitud queda entero por encima del umbral de " + fmt(UMBRAL, 2) + ": una medición así permite dar el «ok» con cierta confianza."
          : ic[1] < UMBRAL ? "El intervalo de la exactitud queda entero por debajo del umbral de " + fmt(UMBRAL, 2) + ": la alerta es fiable."
          : "El intervalo de la exactitud cruza el umbral de " + fmt(UMBRAL, 2) + ": con tan pocas etiquetas, una medición sola no permite decidir.";
      } else nota2 = "Sin mediciones en el horizonte: el monitor de calidad no tiene ninguna cifra que enseñar.";
      $("tb2").innerHTML = r2;
      $("note2").textContent = "En la semana " + H + ", " + p.sinMedir + " de " + H + " lotes siguen sin calidad medida. " + nota2;
    }

    function leer(node, min, max) {
      var v = parseInt(node.value, 10);
      if (isNaN(v)) v = 0;
      return Math.max(min, Math.min(max, v));
    }
    CELDAS.forEach(function (c) {
      var node = $(c.k);
      node.addEventListener("input", function () { S[c.k] = leer(node, 0, 100000); render(); });
    });
    SLIDERS.forEach(function (d) {
      var node = $(d.k);
      node.addEventListener("input", function () { S[d.k] = leer(node, d.min, d.max); render(); });
    });
    function poner(o) {
      ["tp", "fn", "fp", "tn"].forEach(function (k) { S[k] = o[k]; $(k).value = o[k]; });
      render();
    }
    $("atlas").addEventListener("click", function () { poner(ATLAS); });
    $("sano").addEventListener("click", function () { poner(SANO); });
    render();
  };
})();
