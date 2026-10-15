/* Simulador "m08-l05-parlamento": compara tres reglas para decidir con incertidumbre moral:
   la teoria favorita (MFT), la maximizacion de la elegibilidad esperada (MEC) y un parlamento moral
   (delegados en proporcion a las credencias, con votacion por mayoria o con oportunidades proporcionales).
   Las credencias, la intensidad de la deontologia y la disposicion a negociar son ajustables.
   Los casos son propios; el de Alex y el de 51/49 parten de ejemplos del libro (6.9) con valores propios
   donde el libro no da cifras. La negociacion del parlamento es un modelo propio y muy simple: cada teoria
   traslada una fraccion de sus votos a la opcion de compromiso (la de mayor minimo tras normalizar cada
   teoria entre 0 y 1). Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  var EPS = 1e-9;

  var CASOS = [
    {
      id: "sepsis",
      titulo: "Historias clínicas para un detector de sepsis (caso propio)",
      desc: "Un hospital podría usar historias clínicas antiguas para entrenar un detector de sepsis que, según su estimación, salvaría vidas. Pedir el consentimiento de todos los pacientes antiguos es inviable. Elige qué hacer.",
      opciones: [
        "A. Usar todos los datos sin pedir consentimiento",
        "B. Exigir consentimiento explícito a cada paciente",
        "C. Datos anonimizados, comité de ética y exclusión voluntaria",
        "D. Piloto con consentimiento y ampliar más adelante"
      ],
      teorias: [
        { n: "Utilitarismo", c: 35, v: [80, -40, 70, 10] },
        { n: "Deontología", c: 25, v: [-400, 100, -50, 80], deon: true },
        { n: "Contractualismo", c: 25, v: [-60, 30, 90, 40] },
        { n: "Ética de la virtud", c: 15, v: [-50, 40, 30, 70] }
      ],
      nota: "Valores de elegibilidad ilustrativos y propios: no salen de ninguna medición."
    },
    {
      id: "alex",
      titulo: "Alex y la mentira (ejemplo del libro)",
      desc: "Un asesino pregunta a Alex dónde está su amigo Jordan. Decir la verdad lo llevaría a la muerte. Las credencias y los valores de mentir son los del libro (p. 354 y 355); los de decir la verdad son el espejo, una asunción propia porque el libro no los da.",
      opciones: ["Mentir", "Decir la verdad"],
      teorias: [
        { n: "Utilitarismo", c: 60, v: [500, -500] },
        { n: "Deontología", c: 30, v: [-1000, 1000], deon: true },
        { n: "Contractualismo", c: 10, v: [100, -100] }
      ],
      nota: "Con los ajustes iniciales el parlamento da 70 % a mentir y 30 % a decir la verdad, como en el libro (p. 357)."
    },
    {
      id: "5149",
      titulo: "Cincuenta y uno contra cuarenta y nueve (idea del libro, valores propios)",
      desc: "Dos teorías casi empatadas en credencia: una aprueba mentir con suavidad y la otra lo considera profundamente inmoral (libro, p. 355). Los valores concretos (+50 y −1000, con el espejo para decir la verdad) son propios.",
      opciones: ["Mentir", "Decir la verdad"],
      teorias: [
        { n: "Contractualismo", c: 51, v: [50, -50] },
        { n: "Deontología", c: 49, v: [-1000, 1000], deon: true }
      ],
      nota: "Con 51 y 49 la teoría favorita ignora casi por completo lo que dice la otra."
    }
  ];

  function argmaxSet(arr) {
    var m = -Infinity, out = [], i;
    for (i = 0; i < arr.length; i++) if (arr[i] > m) m = arr[i];
    for (i = 0; i < arr.length; i++) if (Math.abs(arr[i] - m) < EPS) out.push(i);
    return out;
  }

  /* Calcula las tres reglas. cred: credencias sin normalizar; escala: factor de la deontologia (>0);
     neg: disposicion a negociar en [0,1]. */
  function calcular(caso, cred, escala, neg) {
    var T = caso.teorias, nT = T.length, nO = caso.opciones.length, i, j;
    var suma = 0;
    for (i = 0; i < nT; i++) suma += cred[i];
    if (suma <= 0) return { vacio: true };
    var w = cred.map(function (c) { return c / suma; });
    var V = T.map(function (t) {
      var s = t.deon ? escala : 1;
      return t.v.map(function (x) { return x * s; });
    });

    /* Teoria favorita */
    var top = argmaxSet(w), mftOps = [];
    top.forEach(function (ti) {
      argmaxSet(V[ti]).forEach(function (o) { if (mftOps.indexOf(o) < 0) mftOps.push(o); });
    });

    /* MEC */
    var ec = [];
    for (j = 0; j < nO; j++) {
      var e = 0;
      for (i = 0; i < nT; i++) e += w[i] * V[i][j];
      ec.push(e);
    }
    var mecOps = argmaxSet(ec);

    /* Compromiso: mayor minimo tras normalizar cada teoria entre 0 y 1 */
    var N = V.map(function (fila) {
      var mn = Math.min.apply(null, fila), mx = Math.max.apply(null, fila);
      return fila.map(function (x) { return mx - mn < EPS ? 1 : (x - mn) / (mx - mn); });
    });
    var mins = [], sums = [];
    for (j = 0; j < nO; j++) {
      var m = Infinity, s2 = 0;
      for (i = 0; i < nT; i++) { m = Math.min(m, N[i][j]); s2 += w[i] * N[i][j]; }
      mins.push(m); sums.push(s2);
    }
    var cands = argmaxSet(mins), comp = cands[0];
    cands.forEach(function (o) { if (sums[o] > sums[comp] + EPS) comp = o; });

    /* Parlamento: cada teoria reparte su peso entre sus opciones favoritas y la de compromiso */
    var cuota = [];
    for (j = 0; j < nO; j++) cuota.push(0);
    for (i = 0; i < nT; i++) {
      var tops = argmaxSet(V[i]);
      tops.forEach(function (o) { cuota[o] += w[i] * (1 - neg) / tops.length; });
      cuota[comp] += w[i] * neg;
    }
    var parlOps = argmaxSet(cuota);

    return {
      vacio: false, w: w, V: V, ec: ec, cuota: cuota, comp: comp,
      mft: mftOps, mec: mecOps, parl: parlOps
    };
  }

  function mismoConjunto(a, b) {
    return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; });
  }

  window.WIDGETS = window.WIDGETS || {};
  if (typeof module !== "undefined" && module.exports) module.exports = { CASOS: CASOS, calcular: calcular, mismoConjunto: mismoConjunto };

  var uid = 0;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmt(x, d) {
    var s = (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(".", ",");
    if (d > 0) s = s.replace(/,0+$/, "");
    return s === "-0" ? "0" : s.replace("-", "−");
  }
  function lista(ops, caso) {
    return ops.map(function (o) { return caso.opciones[o]; }).join(" o ");
  }

  function injectStyle() {
    if (document.getElementById("w-m08l05-style")) return;
    var st = document.createElement("style");
    st.id = "w-m08l05-style";
    st.textContent = [
      ".w-pm{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pm h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pm h5{font:600 1rem/1.3 var(--cond);margin:.2rem 0 .3rem;color:var(--accent-ink)}",
      ".w-pm .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pm select{font:600 .88rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .6rem;max-width:100%}",
      ".w-pm button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-pm button:hover{background:var(--accent-soft)}",
      ".w-pm .w-card{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.7rem .9rem;margin:.6rem 0 .8rem}",
      ".w-pm .w-card p{margin:.2rem 0}",
      ".w-pm .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.4rem 1.2rem;margin:0 0 .6rem}",
      ".w-pm .w-ctl label{display:flex;justify-content:space-between;gap:.5rem;font-family:var(--cond);font-weight:600;font-size:.86rem}",
      ".w-pm .w-ctl output{font:600 .82rem var(--mono);color:var(--accent-ink);white-space:nowrap}",
      ".w-pm .w-ctl input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-pm .w-ctl .w-d{color:var(--muted);font-size:.78rem;margin:0}",
      ".w-pm .w-tw{overflow-x:auto;margin:.4rem 0 .6rem}",
      ".w-pm table{border-collapse:collapse;width:100%;min-width:30rem;font-size:.84rem}",
      ".w-pm th,.w-pm td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:left;vertical-align:top}",
      ".w-pm th{background:var(--accent-soft);font:600 .74rem/1.25 var(--cond)}",
      ".w-pm td.w-c{text-align:right;font:600 .84rem var(--mono);white-space:nowrap}",
      ".w-pm td.w-pos{color:var(--ex)}.w-pm td.w-neg{color:var(--trap)}",
      ".w-pm tr.w-win td{background:var(--accent-soft)}",
      ".w-pm .w-badge{display:inline-block;font:700 .64rem/1.3 var(--mono);letter-spacing:.04em;border:1px solid var(--accent);color:var(--accent-ink);border-radius:4px;padding:0 .3rem;margin-left:.3rem;white-space:nowrap}",
      ".w-pm .w-bar{display:block;height:.45rem;background:var(--accent);border-radius:3px;margin-top:.15rem;min-width:1px}",
      ".w-pm .w-row{border-left:4px solid var(--rule-strong);background:var(--ground);border-radius:0 8px 8px 0;padding:.45rem .7rem;margin:0 0 .4rem}",
      ".w-pm .w-row b{font-family:var(--cond)}",
      ".w-pm .w-row p{margin:.15rem 0 0;color:var(--muted);font-size:.84rem}",
      ".w-pm .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.6rem 0}",
      ".w-pm .w-warn{background:var(--trap-bg);border-left:4px solid var(--trap);border-radius:0 8px 8px 0;padding:.5rem .8rem;margin:.6rem 0}",
      ".w-pm .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-pm .w-sr{position:absolute;left:-9999px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m08-l05-parlamento"] = function (el) {
    injectStyle();
    var id = "w-pm-" + (++uid);
    var caso = CASOS[0], cred = [], escala = 1, neg = 0;

    el.innerHTML = '<div class="w-pm">' +
      "<h4>Parlamento moral: tres reglas ante un mismo dilema</h4>" +
      '<p class="w-hint">Mueve las credencias, la intensidad de la deontología y la disposición a negociar. Mira cuándo la teoría favorita, la elegibilidad esperada y el parlamento recomiendan cosas distintas.</p>' +
      '<label for="' + id + '-caso" class="w-sr">Caso</label>' +
      '<select id="' + id + '-caso"></select>' +
      '<div class="w-card"></div>' +
      '<div class="w-grid w-ctls"></div>' +
      '<div class="w-tw w-tabla"></div>' +
      '<div class="w-out" aria-live="polite"></div>' +
      '<p class="w-cap w-notacaso"></p>' +
      '<p><button type="button" class="w-reset">Restablecer este caso</button></p>' +
      "</div>";

    var sel = el.querySelector("select");
    var card = el.querySelector(".w-card");
    var ctls = el.querySelector(".w-ctls");
    var tabla = el.querySelector(".w-tabla");
    var out = el.querySelector(".w-out");
    var notaCaso = el.querySelector(".w-notacaso");
    CASOS.forEach(function (c, i) {
      var o = document.createElement("option");
      o.value = String(i);
      o.textContent = c.titulo;
      sel.appendChild(o);
    });

    function slider(idx, label, min, max, step, val, desc) {
      var d = document.createElement("div");
      d.className = "w-ctl";
      d.innerHTML = '<label for="' + id + "-" + idx + '"><span>' + esc(label) + '</span><output id="' + id + "-" + idx + '-o"></output></label>' +
        '<input type="range" id="' + id + "-" + idx + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">' +
        (desc ? '<p class="w-d">' + esc(desc) + "</p>" : "");
      return d;
    }

    function montar() {
      cred = caso.teorias.map(function (t) { return t.c; });
      escala = 1;
      neg = 0;
      var html = "<h5>" + esc(caso.titulo) + "</h5><p>" + esc(caso.desc) + "</p>";
      html += "<p><b>Opciones:</b></p><ul>";
      caso.opciones.forEach(function (o) { html += "<li>" + esc(o) + "</li>"; });
      html += "</ul>";
      card.innerHTML = html;
      notaCaso.textContent = caso.nota;

      ctls.innerHTML = "";
      caso.teorias.forEach(function (t, i) {
        var s = slider("c" + i, "Credencia en " + t.n, 0, 100, 1, cred[i], "");
        s.querySelector("input").addEventListener("input", function (e) { cred[i] = Number(e.target.value); actualizar(); });
        ctls.appendChild(s);
      });
      var se = slider("esc", "Intensidad de la deontología", 0.2, 6, 0.1, 1, "Multiplica todos sus valores. Con 1 son los valores de la tabla.");
      se.querySelector("input").addEventListener("input", function (e) { escala = Number(e.target.value); actualizar(); });
      ctls.appendChild(se);
      var sn = slider("neg", "Disposición a negociar", 0, 100, 5, 0, caso.opciones.length > 2
        ? "Cuánto de su voto traslada cada teoría a la opción de compromiso (modelo propio)."
        : "Con solo dos opciones no hay opción de compromiso: el mando no hace nada.");
      var ni = sn.querySelector("input");
      if (caso.opciones.length <= 2) ni.disabled = true;
      ni.addEventListener("input", function (e) { neg = Number(e.target.value) / 100; actualizar(); });
      ctls.appendChild(sn);
      actualizar();
    }

    function actualizar() {
      var r = calcular(caso, cred, escala, neg), i, j, html;
      var suma = cred.reduce(function (a, b) { return a + b; }, 0);
      caso.teorias.forEach(function (t, k) {
        var o = document.getElementById(id + "-c" + k + "-o");
        if (o) o.textContent = cred[k] + " (" + (suma > 0 ? fmt(100 * cred[k] / suma, 1) : "0") + " %)";
      });
      var oe = document.getElementById(id + "-esc-o");
      if (oe) oe.textContent = "×" + fmt(escala, 1);
      var on = document.getElementById(id + "-neg-o");
      if (on) on.textContent = Math.round(neg * 100) + " %";

      if (r.vacio) {
        tabla.innerHTML = "";
        out.innerHTML = '<div class="w-warn"><b>Sin credencias.</b> Sube la credencia de alguna teoría para que las tres reglas tengan algo que decidir.</div>';
        return;
      }

      html = '<table><caption class="w-sr">Elegibilidad de cada opción según cada teoría, elegibilidad esperada y reparto de votos del parlamento</caption><thead><tr><th>Opción</th>';
      caso.teorias.forEach(function (t, k) {
        html += "<th>" + esc(t.n) + " (" + fmt(100 * r.w[k], 1) + " %)</th>";
      });
      html += "<th>Elegibilidad esperada</th><th>Votos del parlamento</th></tr></thead><tbody>";
      for (j = 0; j < caso.opciones.length; j++) {
        var badges = "";
        if (r.mft.indexOf(j) >= 0) badges += '<span class="w-badge" title="Teoría favorita">MFT</span>';
        if (r.mec.indexOf(j) >= 0) badges += '<span class="w-badge" title="Elegibilidad esperada máxima">MEC</span>';
        if (r.parl.indexOf(j) >= 0) badges += '<span class="w-badge" title="Más votos en el parlamento">PARL</span>';
        html += "<tr" + (badges ? ' class="w-win"' : "") + "><td>" + esc(caso.opciones[j]) + badges + "</td>";
        for (i = 0; i < caso.teorias.length; i++) {
          var v = r.V[i][j];
          html += '<td class="w-c ' + (v > 0 ? "w-pos" : v < 0 ? "w-neg" : "") + '">' + fmt(v, 0) + "</td>";
        }
        var ecv = r.ec[j];
        html += '<td class="w-c ' + (ecv > 0 ? "w-pos" : ecv < 0 ? "w-neg" : "") + '">' + fmt(ecv, 1) + "</td>";
        html += '<td class="w-c">' + fmt(100 * r.cuota[j], 1) + ' %<span class="w-bar" style="width:' + Math.round(100 * r.cuota[j]) + '%"></span></td></tr>';
      }
      html += "</tbody></table>";
      tabla.innerHTML = html;

      var hayCompromiso = caso.opciones.length > 2;
      var probs = [];
      for (j = 0; j < caso.opciones.length; j++) probs.push(fmt(100 * r.cuota[j], 1) + " % " + caso.opciones[j].split(". ")[0]);
      var h = "";
      h += '<div class="w-row"><b>Teoría favorita (MFT):</b> ' + esc(lista(r.mft, caso)) +
        "<p>Sigue lo que dice la teoría con más credencia (" + esc(caso.teorias[argmaxSet(r.w)[0]].n) + ") y descarta lo que digan las demás.</p></div>";
      h += '<div class="w-row"><b>Elegibilidad esperada (MEC):</b> ' + esc(lista(r.mec, caso)) +
        "<p>Suma, por opción, la elegibilidad de cada teoría por su credencia. Depende de la escala de los números.</p></div>";
      h += '<div class="w-row"><b>Parlamento, mayoría simple:</b> ' + esc(lista(r.parl, caso)) +
        "<p>Gana la opción con más votos. Con oportunidades proporcionales, cada opción se toma con la probabilidad de su cuota: " + esc(probs.join("; ")) + ".</p></div>";

      var a = mismoConjunto(r.mft, r.mec), b = mismoConjunto(r.mec, r.parl), c2 = mismoConjunto(r.mft, r.parl);
      var msg;
      if (a && b) {
        msg = "Las tres reglas coinciden. Aquí la incertidumbre moral no cambia la decisión, aunque el parlamento con oportunidades proporcionales deja una probabilidad a las demás opciones.";
      } else {
        var quien = [];
        if (!a) quien.push("la teoría favorita y la elegibilidad esperada");
        if (!c2) quien.push("la teoría favorita y el parlamento");
        if (!b) quien.push("la elegibilidad esperada y el parlamento");
        msg = "Discrepan: " + quien.join("; ") + " recomiendan cosas distintas. Ahí es donde importa qué regla usa el sistema.";
      }
      if (hayCompromiso && neg === 0 && r.parl.indexOf(r.comp) < 0) {
        msg += " La opción de compromiso (" + lista([r.comp], caso) + ") no gana sin negociación: prueba a subir la disposición a negociar.";
      }
      h += '<div class="w-note"><b>Lectura.</b> ' + esc(msg) + "</div>";
      out.innerHTML = h;
    }

    sel.addEventListener("change", function () {
      caso = CASOS[Number(sel.value)];
      montar();
    });
    el.querySelector(".w-reset").addEventListener("click", montar);
    montar();
  };
})();
