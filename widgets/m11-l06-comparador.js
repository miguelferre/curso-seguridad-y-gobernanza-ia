/* Simulador "m11-l06-comparador": tabla interactiva de las cuatro teorías morales del libro.
   El usuario elige uno de cuatro dilemas de IA clínica (propios) o escribe el suyo, marca qué recomendaría
   cada teoría (Sí, No, Depende) y ve la pregunta que hace cada una y su principal debilidad según el libro.
   Con un dilema de ejemplo, puede desplegar después la lectura propia del curso y compararla con su marca.
   Las lecturas son ejemplos propios y discutibles; las debilidades y sus páginas salen del libro (11.4).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var VER = ["Sí", "No", "Depende"];

  var TEORIAS = [
    {
      n: "Utilitarismo", rep: true,
      dice: "Lo correcto es lo que produce más bienestar en total, contando a todos por igual.",
      q: "¿Qué opción deja más bienestar sumado, contando a todos por igual? ¿A quién afecta y cuánto?",
      deb: "Exige prever consecuencias y probabilidades que casi nunca se conocen, y puede resultar demasiado exigente. (libro, pp. 554 a 557)"
    },
    {
      n: "Deontología", rep: true,
      dice: "Hay restricciones, derechos y obligaciones que pesan más que las consecuencias.",
      q: "¿Qué regla, derecho o promesa está en juego? ¿La violaría alguna de las opciones?",
      deb: "Puede ser rígida: a veces obliga a empeorar el mundo, y el umbral con el que se corrige es arbitrario. (libro, pp. 562 y 563)"
    },
    {
      n: "Ética de la virtud", rep: false,
      dice: "Lo central es el carácter: actuar como lo haría una persona virtuosa y sabia, en camino al florecimiento.",
      q: "¿Qué haría aquí una persona justa, honesta y prudente? ¿Qué virtudes chocan?",
      deb: "No siempre dice qué hacer cuando chocan dos virtudes, y hace depender lo correcto del carácter de quien actúa. (libro, p. 570)"
    },
    {
      n: "Contrato social", rep: false,
      dice: "Es correcto lo que personas razonables acordarían, para beneficio mutuo, sin saber qué lugar ocuparán.",
      q: "¿Qué regla aceptarías sin saber si serás el más perjudicado? ¿Podría alguien rechazarla razonablemente?",
      deb: "Sin más valor de fondo que el acuerdo, cualquier acuerdo valdría; y el maximin de Rawls resulta implausible. (libro, pp. 573, 574 y 576)"
    }
  ];

  var DILEMAS = [
    {
      t: "Protocolo de UCI con un grupo peor tratado",
      x: "¿Debe el hospital adoptar el protocolo X (688 supervivientes por cada 1000, pero solo un 40 % de supervivencia en pacientes con discapacidad grave) en lugar del Y (680 por cada 1000, con un 68 % para todos)?",
      l: [
        ["Sí", "X salva 8 personas más por cada 1000, así que gana por poco si el bienestar es la supervivencia. Habría que sumar además el daño a la confianza."],
        ["No", "Dejar en clara desventaja a las personas con discapacidad grave choca con la restricción de no discriminar, aunque las cuentas favorezcan a X."],
        ["No", "La justicia y el cuidado piden no abandonar a quien corre más riesgo. Una persona prudente buscaría mejorar Y o auditar X antes de decidir."],
        ["Depende", "Sin saber si estarías en el 10 %, con aversión al peor caso (Rawls) elegirías Y, y con neutralidad ante el riesgo (Harsanyi), X. Cuenta cómo se trate el riesgo."]
      ]
    },
    {
      t: "Pronóstico completo a un paciente frágil",
      x: "¿Debe un asistente clínico responder con el pronóstico completo a un paciente que lo pide, aunque parezca emocionalmente frágil?",
      l: [
        ["Depende", "Hay que comparar el sufrimiento de saberlo con el beneficio de decidir con información. Sin datos de este paciente, el resultado depende de cómo se estime cada efecto."],
        ["Sí", "Existe la obligación de no engañar y de respetar la autonomía. Ocultar un pronóstico que el paciente pide viola su derecho a decidir."],
        ["Depende", "Honestidad y compasión pueden ir juntas o chocar. La sabiduría práctica decide cuándo y cómo decirlo, con tacto y acompañamiento, pero sin mentir."],
        ["Sí", "En el papel de paciente, nadie aceptaría una regla que permita ocultarle lo que pide saber. Sí aceptaría reglas sobre cómo comunicarlo."]
      ]
    },
    {
      t: "Datos prometidos para un modelo que salva vidas",
      x: "¿Puede el hospital reutilizar, para entrenar un modelo que salvaría vidas, unos datos que prometió a los pacientes no usar con otro fin?",
      l: [
        ["Depende", "Si el modelo salva muchas vidas puede compensar. Pero romper promesas erosiona la confianza y con ella los datos futuros, y ese efecto también cuenta."],
        ["No", "La promesa y el consentimiento son restricciones que no se rompen por el resultado. Lo correcto es pedir un consentimiento nuevo."],
        ["No", "Una institución íntegra cumple lo que promete o lo renegocia abiertamente. La prudencia aconseja buscar el permiso."],
        ["No", "Nadie aceptaría sin saber su lugar la regla de que las promesas de privacidad se rompen cuando hay buenos fines: destruiría la confianza que hace posible compartir datos."]
      ]
    },
    {
      t: "Seguimiento para el paciente peor situado",
      x: "El equipo solo puede reforzar el seguimiento de una de tres opciones. ¿Debe priorizar al paciente que está peor, aunque reforzar a los otros dos sume más bienestar entre los dos?",
      l: [
        ["No", "Reforzar a los otros dos deja más bienestar sumado, como la opción 1 en el ejemplo de Rana, Sean y Toby."],
        ["Depende", "No hay una restricción clara en juego. Cuenta el deber de cuidado con cada paciente, y ninguna regla dice quién va primero."],
        ["Depende", "El cuidado y la justicia apuntan a quien más lo necesita, pero la sabiduría práctica pide mirar cada caso."],
        ["Sí", "Sin saber cuál de los tres serás, Rawls y el prioritarismo dan más peso al peor situado. Con una prioridad muy fuerte incluso se nivelaría todo; con una suave, la respuesta cambia."]
      ]
    }
  ];

  function injectStyle() {
    if (document.getElementById("w-cm-style")) return;
    var st = document.createElement("style");
    st.id = "w-cm-style";
    st.textContent = [
      ".w-cm{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem;container-type:inline-size}",
      ".w-cm h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cm .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cm .w-f{margin:0 0 .7rem}",
      ".w-cm .w-f label{display:block;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-cm select,.w-cm textarea{width:100%;box-sizing:border-box;font:500 .92rem/1.4 var(--sans);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .55rem}",
      ".w-cm textarea{resize:vertical;min-height:3.2rem}",
      ".w-cm td select{min-width:8.5rem}",
      ".w-cm .w-dil{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .8rem}",
      ".w-cm .w-wrap{overflow-x:auto}",
      ".w-cm table{width:100%;border-collapse:collapse;font-size:.86rem}",
      ".w-cm th,.w-cm td{text-align:left;vertical-align:top;padding:.55rem .6rem;border-bottom:1px solid var(--rule)}",
      ".w-cm thead th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);border-bottom:1px solid var(--rule-strong)}",
      ".w-cm tbody th{font:400 .86rem/1.4 var(--sans);text-transform:none;letter-spacing:0;color:var(--ink);min-width:10rem}",
      ".w-cm .w-tn{display:block;font:600 .95rem var(--cond);color:var(--accent-ink);margin-bottom:.15rem}",
      ".w-cm .w-rep{font:600 .64rem var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-left:.4rem}",
      ".w-cm .w-deb{color:var(--trap)}",
      ".w-cm .w-lect{margin-top:.5rem;padding:.45rem .6rem;border-radius:8px;background:var(--ex-bg);border:1px solid var(--ex-rule)}",
      ".w-cm .w-lect b{color:var(--ex)}",
      ".w-cm .w-lect .w-cmp{display:block;color:var(--muted);font-size:.8rem;margin-top:.2rem}",
      ".w-cm .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .5rem}",
      ".w-cm button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-cm button:hover{background:var(--accent-soft)}",
      ".w-cm button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-cm .w-sum{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.3rem 0 .5rem}",
      ".w-cm .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-cm .w-sr{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}",
      "@container (max-width:46rem){",
      ".w-cm thead{position:absolute;left:-9999px}",
      ".w-cm table,.w-cm tbody,.w-cm tr,.w-cm th,.w-cm td{display:block}",
      ".w-cm tr{border:1px solid var(--rule);border-radius:8px;margin:0 0 .7rem;padding:.2rem 0;background:var(--ground)}",
      ".w-cm th,.w-cm td{border-bottom:0;padding:.35rem .7rem}",
      ".w-cm tbody th{min-width:0}",
      ".w-cm td[data-l]::before{content:attr(data-l);display:block;font:600 .64rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.15rem}",
      "}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m11-l06-comparador"] = function (el) {
    injectStyle();
    var id = "w-cm-" + (++uid);
    var idx = 0, own = "", marks = [null, null, null, null], notes = ["", "", "", ""], shown = false;

    el.innerHTML = '<div class="w-cm">' +
      '<h4>Comparador de teorías morales</h4>' +
      '<p class="w-hint">Elige un dilema de IA clínica o escribe el tuyo. Para cada teoría, lee su pregunta y marca qué recomendaría. Después compara.</p>' +
      '<div class="w-f"><label for="' + id + '-s">Dilema</label><select id="' + id + '-s"></select></div>' +
      '<div class="w-f" id="' + id + '-ow" hidden><label for="' + id + '-t">Tu dilema (una frase que empiece por "¿Debería…?")</label>' +
      '<textarea id="' + id + '-t" rows="2" placeholder="¿Debería el sistema…?"></textarea></div>' +
      '<div class="w-dil" id="' + id + '-d"></div>' +
      '<div class="w-wrap"><table><caption class="w-sr">Las cuatro teorías morales aplicadas al dilema elegido</caption>' +
      '<thead><tr><th scope="col">Teoría y qué dice</th><th scope="col">La pregunta que hace</th><th scope="col">Tu veredicto</th><th scope="col">Debilidad principal</th></tr></thead>' +
      '<tbody id="' + id + '-b"></tbody></table></div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-r" aria-pressed="false">Mostrar la lectura del curso</button>' +
      '<button type="button" id="' + id + '-c">Borrar marcas</button></div>' +
      '<div class="w-sum" id="' + id + '-m" aria-live="polite"></div>' +
      '<p class="w-cap">Las lecturas de los dilemas son ejemplos propios y discutibles. Las debilidades y sus páginas son del libro (sección 11.4).</p>' +
      '</div>';

    var $ = function (s) { return el.querySelector("#" + id + "-" + s); };
    var sel = $("s"), ow = $("ow"), ta = $("t"), dil = $("d"), body = $("b"), btnR = $("r"), btnC = $("c"), sum = $("m");

    DILEMAS.forEach(function (d, i) {
      var o = document.createElement("option");
      o.value = i; o.textContent = d.t; sel.appendChild(o);
    });
    var oo = document.createElement("option");
    oo.value = "own"; oo.textContent = "Escribo mi propio dilema"; sel.appendChild(oo);

    function isOwn() { return idx === "own"; }

    function buildRows() {
      body.innerHTML = "";
      TEORIAS.forEach(function (T, i) {
        var tr = document.createElement("tr");
        var th = document.createElement("th"); th.setAttribute("scope", "row");
        var nm = document.createElement("span"); nm.className = "w-tn"; nm.textContent = T.n;
        if (T.rep) { var rp = document.createElement("span"); rp.className = "w-rep"; rp.textContent = "lección anterior"; nm.appendChild(rp); }
        th.appendChild(nm); th.appendChild(document.createTextNode(T.dice));
        var tq = document.createElement("td"); tq.setAttribute("data-l", "La pregunta que hace"); tq.textContent = T.q;
        var tv = document.createElement("td"); tv.setAttribute("data-l", "Tu veredicto");
        var s = document.createElement("select"); s.setAttribute("aria-label", "Tu veredicto según " + T.n);
        var o0 = document.createElement("option"); o0.value = ""; o0.textContent = "Sin marcar"; s.appendChild(o0);
        VER.forEach(function (v) { var o = document.createElement("option"); o.value = v; o.textContent = v; s.appendChild(o); });
        s.value = marks[i] || "";
        s.addEventListener("change", function () { marks[i] = s.value || null; refresh(); });
        tv.appendChild(s);
        if (isOwn()) {
          var n = document.createElement("textarea"); n.rows = 2; n.value = notes[i];
          n.setAttribute("aria-label", "Tu razonamiento con la lente de " + T.n); n.placeholder = "Tu razonamiento (opcional)";
          n.style.marginTop = ".4rem";
          n.addEventListener("input", function () { notes[i] = n.value; });
          tv.appendChild(n);
        } else {
          var lc = document.createElement("div"); lc.className = "w-lect"; lc.id = id + "-l" + i; lc.hidden = true;
          tv.appendChild(lc);
        }
        var td = document.createElement("td"); td.setAttribute("data-l", "Debilidad principal (según el libro)");
        td.className = "w-deb"; td.textContent = T.deb;
        tr.appendChild(th); tr.appendChild(tq); tr.appendChild(tv); tr.appendChild(td);
        body.appendChild(tr);
      });
    }

    function refresh() {
      var i, n = 0, cnt = { "Sí": 0, "No": 0, "Depende": 0 }, msg = "", match = 0, L;
      for (i = 0; i < 4; i++) { if (marks[i]) { n++; cnt[marks[i]]++; } }
      if (!isOwn()) {
        L = DILEMAS[idx].l;
        for (i = 0; i < 4; i++) {
          var box = $("l" + i);
          if (!box) continue;
          box.hidden = !shown;
          if (shown) {
            box.innerHTML = "";
            var b = document.createElement("b"); b.textContent = "Lectura del curso: " + L[i][0] + ".";
            var tx = document.createElement("span"); tx.textContent = " " + L[i][1];
            var cm = document.createElement("span"); cm.className = "w-cmp";
            if (marks[i]) { cm.textContent = marks[i] === L[i][0] ? "Tu marca coincide." : "Tu marca era " + marks[i] + "; difiere de la lectura."; if (marks[i] === L[i][0]) match++; }
            else cm.textContent = "No habías marcado esta teoría.";
            box.appendChild(b); box.appendChild(tx); box.appendChild(cm);
          }
        }
      }
      if (n === 0) msg = "Marca un veredicto en cada teoría para ver el resumen.";
      else {
        msg = "Marcadas " + n + " de 4: " + cnt["Sí"] + " Sí, " + cnt["No"] + " No y " + cnt["Depende"] + " Depende. ";
        if (n === 4) {
          var vals = marks.filter(function (v, k) { return marks.indexOf(v) === k; });
          msg += vals.length === 1
            ? "Las cuatro lentes coinciden, así que la decisión queda bastante asegurada. Aun así, mira qué razones distintas llevan al mismo resultado."
            : "Las lentes discrepan. Ese desacuerdo es la información: pregúntate qué consideración pesa distinto en cada una y qué supuesto tendrías que declarar para decidir.";
        }
        if (!isOwn() && shown) msg += " Coincides con la lectura del curso en " + match + " de 4 (la lectura es propia y discutible).";
      }
      sum.textContent = msg;
      btnR.setAttribute("aria-pressed", shown ? "true" : "false");
      btnR.textContent = shown ? "Ocultar la lectura del curso" : "Mostrar la lectura del curso";
      btnR.hidden = isOwn();
    }

    function setDilema() {
      if (isOwn()) {
        ow.hidden = false;
        dil.textContent = own ? own : "Escribe tu dilema arriba y marca después qué diría cada teoría.";
      } else {
        ow.hidden = true;
        dil.textContent = DILEMAS[idx].x;
      }
      buildRows();
      refresh();
    }

    sel.addEventListener("change", function () {
      idx = sel.value === "own" ? "own" : Number(sel.value);
      marks = [null, null, null, null]; shown = false;
      setDilema();
    });
    ta.addEventListener("input", function () {
      own = ta.value.trim();
      dil.textContent = own ? own : "Escribe tu dilema arriba y marca después qué diría cada teoría.";
    });
    btnR.addEventListener("click", function () { shown = !shown; refresh(); });
    btnC.addEventListener("click", function () { marks = [null, null, null, null]; shown = false; buildRows(); refresh(); });

    setDilema();
  };
})();
