/* Simulador "m01-l01-mitigaciones": empareja escenarios de uso malicioso con las medidas de mitigacion
   del libro (Hendrycks, cap. 1, secciones 1.2 y 1.7). Al comprobar, explica cada respuesta y el coste
   de la medida. Sin detalles operativos: solo riesgos, incentivos y medidas.
   Sin dependencias. Estilos con las variables del CSS del Atlas. Accesible por teclado (select nativos). */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var MED = [
    { id: "acceso", n: "Limitar el acceso a las IA más peligrosas", src: "Libro 1.7, p. 49",
      coste: "Si el acceso se concentra en pocas manos, alimenta la concentración de poder (p. 12); no sirve si el modelo se filtra." },
    { id: "vigilancia", n: "Vigilancia cuidadosamente dirigida", src: "Libro 1.7, p. 49",
      coste: "Su versión masiva es la sobrecorrección de las pp. 11 y 12. Dirigirla a usos y actores de riesgo es lectura propia." },
    { id: "politica", n: "Políticas y coordinación", src: "Libro 1.7, p. 50 (capítulo de Gobernanza)",
      coste: "Solo protege si vincula también al actor menos prudente." },
    { id: "verificacion", n: "IA verificadoras de información", src: "Libro 1.2.3, p. 11 (lectura propia, con reservas del libro)",
      coste: "No resuelve el problema por sí sola, crea dependencia y hay riesgo de que las diseñe quien quiere suprimir información cierta." },
    { id: "valores", n: "IA que actualizan sus valores", src: "Libro 1.2.4, p. 13 (lectura propia)",
      coste: "Queda abierto quién decide qué se actualiza (observación propia)." }
  ];

  var ESC = [
    { t: "Una empresa da su modelo de biología solo a investigadores aprobados. A las pocas semanas, el modelo completo aparece en internet.",
      ok: "acceso", alt: [],
      why: "Es la historia hipotética del libro (p. 13). La medida pertinente es limitar el acceso a las IA más peligrosas (p. 49), y el caso enseña su pega: un acceso limitado sobre el papel no protege si el modelo completo puede filtrarse. Importa quién lo custodia y cómo." },
    { t: "En un campo de investigación, nueve de cada diez equipos prefieren no publicar en abierto un modelo con capacidad biológica. El décimo quiere hacerlo.",
      ok: "politica", alt: ["acceso"],
      why: "Es el problema del actor unilateral (pp. 6 y 7): decide el menos prudente, y la prudencia de la mayoría no basta. Hace falta una regla que vincule a todos: políticas y coordinación (p. 50). Limitar el acceso también vale si alguien puede imponerlo, pero eso ya es una política común." },
    { t: "Un servicio de salud detecta una campaña que manda sobre una vacuna mensajes distintos a cada persona, a gran escala.",
      ok: "verificacion", alt: ["vigilancia"],
      why: "El libro (p. 11) menciona la verificación con IA como respuesta bienintencionada a la desinformación, pero no la da por solución: la desinformación persiste pese a los verificadores, puede diseñarse para suprimir informaciones ciertas y crea dependencia. Usarla como medida es lectura propia. Vigilar campañas coordinadas también es razonable (aplicación propia de la vigilancia dirigida), siempre que mire usos y no a las personas." },
    { t: "Un gobierno propone vigilar a toda la población y reservar la IA avanzada a una minoría de confianza para evitar el terrorismo. ¿Qué medida del libro es la versión acotada de esa propuesta?",
      ok: "vigilancia", alt: ["acceso"],
      why: "El libro pide vigilancia cuidadosamente dirigida (p. 49), no total. La propuesta completa es la sobrecorrección de las pp. 11 y 12: se evita el uso malicioso de abajo arriba y se crea el de arriba abajo, con riesgo de un régimen totalitario afianzado por la IA. Reservar la IA a pocos también sería limitar el acceso, con el mismo coste de concentrar el poder." },
    { t: "Una IA que orienta decisiones en toda una red hospitalaria aprendió sesgos de los datos históricos, y cuesta quitarlos una vez desplegada.",
      ok: "valores", alt: [],
      why: "Es el bloqueo de valores (pp. 12 y 13): los sesgos aprendidos son difíciles de eliminar y los valores de hoy pueden ser defectos que el futuro rechace. El libro apunta a diseñar las IA para que sigan actualizando su comprensión de lo que valora la sociedad. Coste: queda abierto quién decide qué se actualiza." },
    { t: "Una empresa con un sistema muy potente lo usa para empujar a sus clientes a gastar más de lo que les conviene y para influir en la política, aunque sabe que perjudica al público.",
      ok: "politica", alt: [],
      why: "El libro (p. 12) avisa de que quien controla estos sistemas tiene incentivos para no repartir el control aunque sepa que daña. Cuando el incentivo va contra el interés público, la respuesta es de reglas: políticas y coordinación (p. 50). Coste: hay que diseñarlas para que no las capture el propio sector." },
    { t: "Un proyecto abierto esquiva los filtros de seguridad de un modelo comercial y lo convierte en un agente con metas destructivas. No las logra porque le falta capacidad.",
      ok: "acceso", alt: ["vigilancia"],
      why: "Es el caso de ChaosGPT del libro (p. 9). Los filtros fueron la primera capa y se esquivaron; lo que salvó fue la falta de capacidad. Con modelos más capaces, la medida es limitar el acceso a los más peligrosos (p. 49). Lectura propia: como en el queso suizo del módulo 2, se combinan capas que no fallen a la vez." },
    { t: "Un regulador quiere detectar pronto los intentos de usar un servicio de IA para causar daño masivo, sin vigilar por igual la actividad de todos los usuarios.",
      ok: "vigilancia", alt: [],
      why: "Es la vigilancia cuidadosamente dirigida (p. 49). Que se dirija a usos y actores de riesgo es lectura propia. Coste: falsos positivos, privacidad y el riesgo de que se ensanche hasta la vigilancia masiva de las pp. 11 y 12." }
  ];

  function injectStyle() {
    if (document.getElementById("w-mm-style")) return;
    var st = document.createElement("style");
    st.id = "w-mm-style";
    st.textContent = [
      ".w-mm{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-mm h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-mm .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-mm details{margin:0 0 .9rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-mm summary{cursor:pointer;padding:.5rem .7rem;font:600 .82rem var(--cond)}",
      ".w-mm dl.w-leg{display:grid;gap:1px;background:var(--rule);margin:0;border-top:1px solid var(--rule)}",
      ".w-mm dl.w-leg > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-mm dl.w-leg dt{font:600 .9rem/1.3 var(--cond);color:var(--accent-ink);margin:0 0 .1rem}",
      ".w-mm dl.w-leg dt span{font:500 .72rem var(--mono);color:var(--faint);margin-left:.4rem}",
      ".w-mm dl.w-leg dd{margin:0;font-size:.84rem;color:var(--muted)}",
      ".w-mm .w-card{border:1px solid var(--rule);border-left-width:4px;border-radius:8px;background:var(--ground);padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-mm .w-card.w-ok{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-mm .w-card.w-bad{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-mm .w-q{display:block;margin:0 0 .4rem;line-height:1.45}",
      ".w-mm .w-q b{font-family:var(--mono);color:var(--accent-ink);margin-right:.3rem}",
      ".w-mm select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .5rem}",
      ".w-mm .w-fb{margin:.5rem 0 0;font-size:.86rem;line-height:1.45}",
      ".w-mm .w-fb:empty{display:none}",
      ".w-mm .w-fb strong{display:block;margin-bottom:.15rem}",
      ".w-mm .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .6rem}",
      ".w-mm button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-mm button:hover{background:var(--accent-soft)}",
      ".w-mm button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-mm .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-mm .w-note:empty{display:none}",
      ".w-mm .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function med(idm) { var i; for (i = 0; i < MED.length; i++) if (MED[i].id === idm) return MED[i]; return null; }

  window.WIDGETS["m01-l01-mitigaciones"] = function (el) {
    injectStyle();
    var id = "w-mm-" + (++uid);
    var i, html = "";

    html += '<div class="w-mm">' +
      '<h4>Escenarios y mitigaciones</h4>' +
      '<p class="w-hint">Cada escenario describe un riesgo de uso malicioso, sin detalles operativos. Elige la medida que mejor ataca su mecanismo; al comprobar verás por qué y cuánto cuesta.</p>' +
      '<details id="' + id + '-leg" open><summary>Las cinco medidas y su coste</summary><dl class="w-leg">';
    MED.forEach(function (m) {
      html += '<div><dt>' + esc(m.n) + '<span>' + esc(m.src) + '</span></dt><dd>' + esc(m.coste) + '</dd></div>';
    });
    html += '</dl></details>';
    ESC.forEach(function (e, k) {
      html += '<div class="w-card" id="' + id + '-c' + k + '">' +
        '<label class="w-q" for="' + id + '-s' + k + '"><b>' + (k + 1) + '.</b>' + esc(e.t) + '</label>' +
        '<select id="' + id + '-s' + k + '"><option value="">Elige una medida…</option>';
      MED.forEach(function (m) { html += '<option value="' + m.id + '">' + esc(m.n) + '</option>'; });
      html += '</select><div class="w-fb" id="' + id + '-f' + k + '" aria-live="polite"></div></div>';
    });
    html += '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Comprobar</button>' +
      '<button type="button" id="' + id + '-re">Reiniciar</button></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Las tres primeras medidas son las de la conclusión del libro (1.7, pp. 49 y 50). Las dos últimas son lectura propia de pasajes de 1.2.3 y 1.2.4. Aplicarlas a cada escenario también es interpretación del curso: por eso algunos escenarios admiten una segunda medida válida.</p>' +
      '</div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var sels = [], cards = [], fbs = [];
    for (i = 0; i < ESC.length; i++) { sels.push($("s" + i)); cards.push($("c" + i)); fbs.push($("f" + i)); }
    var note = $("note");

    function clearOne(k) { cards[k].className = "w-card"; fbs[k].innerHTML = ""; }

    function check() {
      var good = 0, alts = 0, none = 0;
      ESC.forEach(function (e, k) {
        var v = sels[k].value, best = med(e.ok), chosen = med(v), head, cls;
        if (!v) { head = "Sin responder. La más adecuada es «" + best.n + "»."; cls = "w-bad"; none++; }
        else if (v === e.ok) { head = "Correcto."; cls = "w-ok"; good++; }
        else if (e.alt.indexOf(v) >= 0) { head = "Válida, aunque la más directa es «" + best.n + "»."; cls = "w-ok"; good++; alts++; }
        else { head = "No es la mejor: elegiste «" + chosen.n + "»; la más adecuada es «" + best.n + "»."; cls = "w-bad"; }
        cards[k].className = "w-card " + cls;
        fbs[k].innerHTML = "<strong>" + esc(head) + "</strong>" + esc(e.why);
      });
      note.textContent = "Aciertos: " + good + " de " + ESC.length +
        (alts ? " (" + alts + " con una medida alternativa válida)" : "") +
        (none ? ". Sin responder: " + none : "") +
        ". Ninguna medida basta sola: el libro habla de varias medidas, y combinarlas y vigilar el coste de cada una es lectura propia del curso.";
    }

    function reset() {
      for (i = 0; i < ESC.length; i++) { sels[i].value = ""; clearOne(i); }
      note.textContent = "";
      $("leg").open = false;
    }

    sels.forEach(function (s, k) {
      s.addEventListener("change", function () { clearOne(k); note.textContent = ""; });
    });
    $("go").addEventListener("click", check);
    $("re").addEventListener("click", reset);
  };
})();
