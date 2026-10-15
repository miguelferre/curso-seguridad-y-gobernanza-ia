/* Simulador "m08-l01-casos": ocho casos propios de IA clinica en los que hay que decidir si la ley basta
   como guia o hace falta algo mas y, si hace falta, con cual de los argumentos del libro (6.2): la ley calla,
   la ley es inmoral o llega tarde, o la ley se penso para personas. Las lecturas de referencia son propias y
   defendibles, no la unica respuesta posible; los argumentos y las paginas son del libro.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var ARGS = {
    silencio: "La ley calla o deja libertad",
    inmoral: "La ley es inmoral o llega tarde",
    personas: "La ley se escribió para personas, no para sistemas"
  };
  var ARG_ORDEN = ["silencio", "inmoral", "personas"];

  var CASOS = [
    {
      titulo: "El registro del consentimiento",
      desc: "Una norma exige consentimiento informado firmado antes de un procedimiento invasivo. El sistema de admisión de un hospital debe impedir que se programe el procedimiento si no consta el consentimiento.",
      hechos: [
        "La norma tiene un disparador objetivo: sin firma registrada, no se programa.",
        "Es una norma asentada, aprobada por un proceso democrático.",
        "Los casos límite, como un paciente inconsciente en urgencias, los resuelve un procedimiento que la propia norma prevé, con una persona que decide."
      ],
      v: "basta", arg: null,
      expl: "Aquí la ley funciona bien como guía: es una regla con disparador objetivo, difícil de malinterpretar, y legítima. Los casos límite los resuelve el procedimiento humano que la norma prevé, lo que encaja con el aviso del libro de que puede seguir haciendo falta un intérprete legítimo (6.2.1, pp. 288 a 290)."
    },
    {
      titulo: "El plazo de espera con cláusula de abuso",
      desc: "Una norma fija un plazo máximo de 60 días para las pruebas diagnósticas y prohíbe además cualquier práctica cuyo fin sea aparentar el cumplimiento sin atender antes al paciente. Un sistema de citas podría reclasificar casos para que el reloj se detenga.",
      hechos: [
        "La regla da una cifra objetiva.",
        "La cláusula contra el abuso es un estándar: la aplica un decisor humano.",
        "Regla y estándar se escribieron pensando en hospitales y gestores, y valen igual para un sistema de citas."
      ],
      v: "basta", arg: null,
      expl: "Combina regla y estándar: la regla da una cifra clara y el estándar contra el abuso cubre el juego con la norma, igual que la cláusula británica contra los arreglos fiscales «abusivos» que cita el libro (6.2.1, p. 291). La ley basta aquí, con una condición: alguien tiene que interpretar qué cuenta como abuso."
    },
    {
      titulo: "El asistente que no avisa del ictus",
      desc: "Un asistente de un centro de salud atiende consultas escritas. Una usuaria describe cara caída, brazo débil y habla torpe desde hace 20 minutos. El asistente responde con consejos generales de descanso.",
      hechos: [
        "En este caso supuesto, ninguna norma obliga a un asistente de consultas a dar aviso de urgencia.",
        "Cumple las normas de protección de datos y de publicidad.",
        "Un aviso a tiempo cambiaría mucho el pronóstico."
      ],
      v: "mas", arg: "silencio",
      expl: "La ley calla: no obliga a hacer el bien. Es la lógica del deber de rescate que señala el libro, que en EE. UU. solo rige con una responsabilidad especial sobre la persona: una IA que solo cumpla la ley no actúa sin un impulso ético propio, justo donde podría ayudar más que una persona (6.2.2, p. 292)."
    },
    {
      titulo: "El contrato de la residencia",
      desc: "El asistente de una cadena de residencias de mayores redacta contratos de estancia a medida. Incluye cláusulas de renuncia que un familiar no entiende bien y que resultan legales.",
      hechos: [
        "Ninguna norma prohíbe esas cláusulas.",
        "El familiar firma sin asesoramiento, con prisa por la situación de su padre.",
        "Meses después, varias familias dicen que no habrían firmado si lo hubieran entendido."
      ],
      v: "mas", arg: "silencio",
      expl: "Es una zona de discreción, como el contenido de la mayoría de los contratos entre particulares. El libro avisa de que una IA guiada solo por la ley puede acabar arrancando contratos lamentables o siguiendo prácticas legales pero dañinas (6.2.2, pp. 291 y 292)."
    },
    {
      titulo: "La cesión de historiales seudonimizados",
      desc: "Una norma de hace años permite ceder a terceros historiales seudonimizados sin más aviso. Un sistema puede ahora reidentificar a los pacientes cruzando esos datos con otras fuentes. Ceder los datos cumple la norma.",
      hechos: [
        "Cuando se aprobó la norma, esa reidentificación no era viable.",
        "La opinión de los pacientes afectados ha cambiado, y la norma no.",
        "El sistema no infringe nada."
      ],
      v: "mas", arg: "inmoral",
      expl: "Hay un retraso entre que cambia lo que la gente considera aceptable y que cambia la ley, y las IA generan cuestiones jurídicas nuevas muy deprisa (6.2.2, p. 292). El libro propone entrenar al sistema para respetar las perspectivas éticas de quienes se ven afectados (p. 293). Hay solape con el silencio: lo decisivo aquí es que existe una norma expresa que dice que sí, escrita para otro mundo."
    },
    {
      titulo: "La lista de espera por nacionalidad",
      desc: "En una jurisdicción hipotética, una norma vigente, aprobada por mayoría, permite a los hospitales colocar en último lugar de la lista de espera a los pacientes de una nacionalidad, sin criterio clínico. Un sistema de gestión de listas la aplica.",
      hechos: [
        "La norma es legítima: la aprobó una mayoría por un procedimiento democrático.",
        "El sistema la interpreta correctamente.",
        "Casi todo el mundo fuera de esa jurisdicción la consideraría injusta."
      ],
      v: "mas", arg: "inmoral",
      expl: "Una ley puede ser inmoral aunque nazca de un proceso legítimo y se interprete bien; el libro recuerda la discriminación legal por raza y sexo (6.2.2, p. 292). Si solo la limita la ley falible de un país, una IA podría actuar de un modo que casi todo el mundo considere inmoral (p. 293)."
    },
    {
      titulo: "El archivo que conserva «a sabiendas»",
      desc: "Una norma castiga a quien conserve «a sabiendas» datos identificables de pacientes tras su baja. Un sistema de archivo conserva copias en una caché que nadie le pidió y de la que no «sabe» nada.",
      hechos: [
        "La norma se escribió pensando en personas que saben y pretenden.",
        "El sistema no tiene conocimiento ni intención en el sentido de la norma.",
        "El riesgo para los pacientes es el mismo que si lo hiciera una persona."
      ],
      v: "mas", arg: "personas",
      expl: "Es del mismo tipo que el ejemplo del libro: términos como «a sabiendas» o «con intención» quizá no se apliquen a una IA, y aplicar leyes escritas sin IA en mente puede dar interpretaciones extrañas (6.2.1, p. 288)."
    },
    {
      titulo: "De quién es la guía para pacientes",
      desc: "Un hospital usa un modelo para redactar guías para pacientes a partir de literatura médica y de notas de sus clínicos. Una editorial reclama los derechos de una guía, y nadie sabe si corresponden al hospital, a quien desarrolló el modelo o a los autores de los textos con que se entrenó.",
      hechos: [
        "La propiedad intelectual se pensó para personas y empresas que crean.",
        "Hay tres candidatos a titular: quien usa, quien desarrolla y quien creó los datos.",
        "Ninguna norma vigente contesta con claridad."
      ],
      v: "mas", arg: "personas",
      expl: "La propiedad intelectual no se escribió para sistemas: el libro señala que no está claro quién tiene los derechos entre la persona usuaria, quien desarrolla y quien creó los datos de entrenamiento (6.2.1, pp. 288 y 289)."
    }
  ];

  function injectStyle() {
    if (document.getElementById("w-m08l01c-style")) return;
    var st = document.createElement("style");
    st.id = "w-m08l01c-style";
    st.textContent = [
      ".w-lc{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-lc h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-lc h5{font:600 1rem/1.3 var(--cond);margin:.2rem 0 .3rem;color:var(--accent-ink)}",
      ".w-lc .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-lc .w-nav{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-lc button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-lc button:hover:not(:disabled){background:var(--accent-soft)}",
      ".w-lc button:disabled{opacity:.5;cursor:not-allowed}",
      ".w-lc button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-lc .w-nav button{min-width:2.3rem}",
      ".w-lc .w-nav button[aria-current=true]{background:var(--accent);color:var(--surface);border-color:var(--accent)}",
      ".w-lc .w-nav button.w-done{border-color:var(--ex)}",
      ".w-lc .w-card{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.7rem .9rem;margin:0 0 .8rem}",
      ".w-lc .w-card p{margin:.2rem 0}",
      ".w-lc .w-card ul{margin:.3rem 0 0;padding-left:1.1rem}",
      ".w-lc .w-tag{font:600 .66rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}",
      ".w-lc fieldset{border:1px solid var(--rule);border-radius:8px;margin:0 0 .5rem;padding:.4rem .8rem .55rem}",
      ".w-lc legend{font:600 .9rem var(--cond);color:var(--accent-ink);padding:0 .3rem}",
      ".w-lc .w-opts{display:flex;flex-direction:column;gap:.3rem}",
      ".w-lc .w-opts label{display:inline-flex;align-items:flex-start;gap:.4rem;cursor:pointer}",
      ".w-lc .w-opts input{accent-color:var(--accent);margin-top:.2rem}",
      ".w-lc .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 .8rem}",
      ".w-lc .w-row{border-left:4px solid var(--rule-strong);background:var(--ground);border-radius:0 8px 8px 0;padding:.45rem .7rem;margin:0 0 .4rem}",
      ".w-lc .w-row.w-ok{border-left-color:var(--ex)}",
      ".w-lc .w-row.w-no{border-left-color:var(--trap)}",
      ".w-lc .w-row b{font-family:var(--cond)}",
      ".w-lc .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.4rem 0 .6rem}",
      ".w-lc .w-tw{overflow-x:auto;margin:0 0 .6rem}",
      ".w-lc table{border-collapse:collapse;width:100%;min-width:26rem;font-size:.84rem}",
      ".w-lc th,.w-lc td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:left;vertical-align:top}",
      ".w-lc th{background:var(--accent-soft);font:600 .74rem/1.25 var(--cond)}",
      ".w-lc td.w-y{color:var(--ex)}.w-lc td.w-n{color:var(--trap)}",
      ".w-lc .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-lc .w-sr{position:absolute;left:-9999px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function refTxt(c) {
    return c.v === "basta" ? "La ley basta" : "Hace falta algo más (" + ARGS[c.arg].toLowerCase() + ")";
  }
  function miTxt(r) {
    if (r.v === "basta") return "La ley basta";
    return "Hace falta algo más" + (r.arg ? " (" + ARGS[r.arg].toLowerCase() + ")" : "");
  }
  function acierto(c, r) {
    return r.v === c.v && (c.v === "basta" || r.arg === c.arg);
  }
  function listo(r) {
    return r.v === "basta" || (r.v === "mas" && !!r.arg);
  }

  window.WIDGETS["m08-l01-casos"] = function (el) {
    injectStyle();
    var id = "w-lc-" + (++uid);
    var cur = 0;
    var resp = CASOS.map(function () { return { v: null, arg: null, ok: false }; });

    el.innerHTML = '<div class="w-lc">' +
      "<h4>Ocho casos de IA clínica: ¿basta la ley?</h4>" +
      '<p class="w-hint">Lee cada caso y decide si la ley basta como guía para ese comportamiento o si hace falta algo más. Si hace falta, elige el argumento del libro que mejor lo explica y pulsa Comprobar. Al final verás el mapa completo.</p>' +
      '<div class="w-nav" role="group" aria-label="Casos"></div>' +
      '<div class="w-body"></div>' +
      '<div class="w-summary"></div>' +
      "</div>";

    var nav = el.querySelector(".w-nav");
    var body = el.querySelector(".w-body");
    var sum = el.querySelector(".w-summary");

    function drawNav() {
      nav.innerHTML = "";
      CASOS.forEach(function (c, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = String(i + 1);
        b.setAttribute("aria-label", "Caso " + (i + 1) + ": " + c.titulo + (resp[i].ok ? " (comprobado)" : ""));
        if (i === cur) b.setAttribute("aria-current", "true");
        if (resp[i].ok) b.className = "w-done";
        b.addEventListener("click", function () { cur = i; drawAll(); });
        nav.appendChild(b);
      });
    }

    function drawBody() {
      var c = CASOS[cur], r = resp[cur], html = "", dis = r.ok ? " disabled" : "";
      html += '<div class="w-card"><span class="w-tag">Caso ' + (cur + 1) + " de " + CASOS.length + " (propio)</span>";
      html += "<h5>" + esc(c.titulo) + "</h5><p>" + esc(c.desc) + "</p><ul>";
      c.hechos.forEach(function (h) { html += "<li>" + esc(h) + "</li>"; });
      html += "</ul></div>";

      html += "<fieldset><legend>¿Basta la ley como guía?</legend>" + '<div class="w-opts">';
      [["basta", "La ley basta para este comportamiento"], ["mas", "Hace falta algo más que cumplir la ley"]].forEach(function (o) {
        html += '<label><input type="radio" name="' + id + "-" + cur + '-v" value="' + o[0] + '"' +
          (r.v === o[0] ? " checked" : "") + dis + "> " + o[1] + "</label>";
      });
      html += "</div></fieldset>";

      if (r.v === "mas") {
        html += "<fieldset><legend>¿Qué límite de la ley es?</legend>" + '<div class="w-opts">';
        ARG_ORDEN.forEach(function (k) {
          html += '<label><input type="radio" name="' + id + "-" + cur + '-a" value="' + k + '"' +
            (r.arg === k ? " checked" : "") + dis + "> " + esc(ARGS[k]) + "</label>";
        });
        html += "</div></fieldset>";
      }

      html += '<div class="w-btns"><button type="button" class="w-main w-check"' + (r.ok || !listo(r) ? " disabled" : "") + ">Comprobar</button>" +
        '<button type="button" class="w-next"' + (cur === CASOS.length - 1 ? " disabled" : "") + ">Siguiente caso</button>" +
        '<button type="button" class="w-reset">Reiniciar todo</button></div>';
      html += '<div class="w-res" aria-live="polite"></div>';
      body.innerHTML = html;

      var btn = body.querySelector(".w-check");
      body.querySelectorAll("input[type=radio]").forEach(function (inp) {
        inp.addEventListener("change", function () {
          if (inp.name.slice(-2) === "-v") {
            r.v = inp.value;
            if (r.v === "basta") r.arg = null;
            drawBody();
            var again = body.querySelector('input[name="' + id + "-" + cur + '-v"][value="' + r.v + '"]');
            if (again) again.focus();
          } else {
            r.arg = inp.value;
            btn.disabled = !listo(r);
          }
        });
      });
      btn.addEventListener("click", function () {
        r.ok = true;
        drawAll();
        showResult();
      });
      body.querySelector(".w-next").addEventListener("click", function () {
        if (cur < CASOS.length - 1) { cur++; drawAll(); }
      });
      body.querySelector(".w-reset").addEventListener("click", function () {
        resp = CASOS.map(function () { return { v: null, arg: null, ok: false }; });
        cur = 0;
        drawAll();
      });
      if (r.ok) showResult();
    }

    function showResult() {
      var c = CASOS[cur], r = resp[cur], box = body.querySelector(".w-res"), ok = acierto(c, r), html = "";
      html += '<div class="w-row ' + (ok ? "w-ok" : "w-no") + '"><b>' + (ok ? "Coincide con la lectura de referencia." : "Difiere de la lectura de referencia.") + "</b>" +
        "<br>Tu respuesta: " + esc(miTxt(r)) + ".<br>Referencia: " + esc(refTxt(c)) + ".</div>";
      html += '<div class="w-note">' + esc(c.expl) + "</div>";
      box.innerHTML = html;
    }

    function drawSummary() {
      var n = 0, hits = 0, html = "";
      html += '<div class="w-tw"><table><caption class="w-sr">Referencia y respuesta por caso</caption><thead><tr><th>Caso</th><th>Referencia</th><th>Tu respuesta</th></tr></thead><tbody>';
      CASOS.forEach(function (c, i) {
        var r = resp[i];
        html += "<tr><td>" + (i + 1) + ". " + esc(c.titulo) + "</td>";
        if (r.ok) {
          var ok = acierto(c, r);
          n++;
          if (ok) hits++;
          html += "<td>" + esc(refTxt(c)) + '</td><td class="' + (ok ? "w-y" : "w-n") + '">' + esc(miTxt(r)) +
            '<span class="w-sr">' + (ok ? " (coincide)" : " (difiere)") + "</span></td>";
        } else {
          html += "<td>·</td><td>·</td>";
        }
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      html += '<p class="w-cap">' + (n === 0
        ? "El mapa se rellena al comprobar cada caso."
        : "Coincidencias con la lectura de referencia: " + hits + " de " + n + " casos comprobados. La referencia es una lectura propia y defendible; algunos casos comparten argumentos.") + "</p>";
      sum.innerHTML = html;
    }

    function drawAll() { drawNav(); drawBody(); drawSummary(); }
    drawAll();
  };
})();
