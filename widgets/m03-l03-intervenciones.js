/* Simulador "m03-l03-intervenciones": ocho intervenciones en un hospital con IA.
   El lector predice el desenlace (lo logra, lo logra con efecto secundario, sin efecto, efecto contrario)
   y al comprobar ve las cifras y la explicacion. CASOS Y CIFRAS PROPIOS (no son del libro ni de un estudio):
   modelos minimos con parametros inventados para practicar; los calculos se hacen en calc().
   Regla de clasificacion (propia): sea m la mejora relativa de la meta (positiva = mejor).
     m <= -10 %  -> contrario; |m| < 10 % -> nulo; m >= 10 % -> logra, salvo que la metrica lateral
     empeore mas de un 10 %, y entonces es secundario.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var TIPOS = {
    logra: "Lo logra",
    secundario: "Lo logra, con un efecto secundario",
    nulo: "Casi sin efecto",
    contrario: "Efecto contrario"
  };
  var ORDEN = ["logra", "secundario", "nulo", "contrario"];

  function inj() {
    if (document.getElementById("w-iv-style")) return;
    var st = document.createElement("style");
    st.id = "w-iv-style";
    st.textContent = [
      ".w-iv{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-iv h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-iv h5{font:600 1rem/1.3 var(--cond);margin:.2rem 0 .5rem;color:var(--accent-ink)}",
      ".w-iv .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-iv .w-steps{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-iv .w-steps button{min-width:2.2rem;font:600 .8rem var(--mono);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.35rem .5rem;cursor:pointer}",
      ".w-iv .w-steps button[aria-current=step]{border-color:var(--accent);background:var(--accent-soft)}",
      ".w-iv .w-steps button.w-ok{border-color:var(--ex);color:var(--ex)}",
      ".w-iv .w-steps button.w-ko{border-color:var(--trap);color:var(--trap)}",
      ".w-iv .w-cs{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.7rem .85rem;margin:0 0 .8rem}",
      ".w-iv .w-cs p{margin:.2rem 0}",
      ".w-iv .w-cs b{font:600 .68rem/1.2 var(--mono);letter-spacing:.07em;text-transform:uppercase;color:var(--faint);display:block}",
      ".w-iv fieldset{border:1px solid var(--rule);border-radius:8px;margin:0 0 .7rem;padding:.5rem .8rem .6rem}",
      ".w-iv legend{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);padding:0 .3rem}",
      ".w-iv .w-opt{display:flex;align-items:flex-start;gap:.5rem;margin:.3rem 0;color:var(--ink)}",
      ".w-iv .w-opt input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-iv .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-iv button.w-b{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-iv button.w-b:hover:not(:disabled){background:var(--accent-soft)}",
      ".w-iv button.w-b:disabled{opacity:.5;cursor:default}",
      ".w-iv button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-iv .w-res{border-radius:8px;padding:.7rem .85rem;margin:0 0 .8rem;background:var(--accent-soft)}",
      ".w-iv .w-res.w-ok{background:var(--ex-bg);border:1px solid var(--ex-rule)}",
      ".w-iv .w-res.w-ko{background:var(--trap-bg);border:1px solid var(--trap-rule)}",
      ".w-iv .w-res p{margin:.3rem 0}",
      ".w-iv .w-veredicto{font:600 1rem/1.3 var(--cond)}",
      ".w-iv table{width:100%;border-collapse:collapse;margin:.5rem 0;font-size:.86rem}",
      ".w-iv th,.w-iv td{border-bottom:1px solid var(--rule);padding:.3rem .4rem;text-align:left}",
      ".w-iv td.w-n,.w-iv th.w-n{text-align:right;font-family:var(--mono);white-space:nowrap}",
      ".w-iv .w-tw{overflow-x:auto}",
      ".w-iv .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d == null ? 2 : d }); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* Cada caso define sus metricas con los parametros del modelo. */
  function calc() {
    var cap = 15, resp = 0.9, s0 = 0.08, s1 = 0.45;
    return [
      {
        titulo: "Prohibir el móvil personal",
        idea: "Fuerza restauradora",
        contexto: "De cada 100 consultas al asistente de IA del hospital, 30 se hacen desde el móvil personal, sin registro ni auditoría, porque el acceso oficial exige 90 segundos de inicio de sesión.",
        intervencion: "Una circular interna prohíbe usar el móvil personal para consultar el asistente y se envían recordatorios cada mes.",
        busca: "Que las consultas queden en el sistema oficial, donde se pueden auditar.",
        meta: { n: "Consultas fuera del registro, por cada 100", mejor: "menos", a: 100 * 0.30, d: 100 * 0.29 },
        expl: "La necesidad de ayuda rápida no ha cambiado y el acceso oficial sigue siendo lento, así que el personal sigue por el atajo, solo que con más discreción. Es una fuerza restauradora: el sistema tiene un estado estable (consultar rápido) y una norma que empuja contra él no lo mueve, como el «Hoy No Circula» del libro, donde la gente esquivó la norma. Fíjate en el caso 8: allí no se empuja, se cambia el paisaje."
      },
      {
        titulo: "Bajar el umbral del modelo de sepsis",
        idea: "Interdependencias: tocar una parte mueve otra",
        contexto: "El modelo de sepsis avisa 12 veces por turno y 3 de esos avisos son casos reales (precisión 0,25). El equipo puede procesar unos 15 avisos por turno y atiende bien el 90 % de los que procesa, sin poder distinguir de antemano los reales de los falsos.",
        intervencion: "Para no perder ningún caso se baja el umbral de aviso. Ahora salta 40 veces por turno y 4 de esos avisos son reales (precisión 0,10).",
        busca: "Que se atiendan a tiempo más casos reales de sepsis.",
        meta: { n: "Casos reales atendidos a tiempo, por turno", mejor: "mas", a: Math.min(12, cap) * resp * 0.25, d: Math.min(40, cap) * resp * 0.10 },
        lado: { n: "Avisos por turno", mejor: "menos", a: 12, d: 40 },
        expl: "Más sensibilidad no equivale a más casos atendidos. La atención del equipo es limitada: por encima de 15 avisos procesa lo mismo y los reales se diluyen entre los falsos. Con la carga nueva, el número de casos atendidos baja a la mitad. Es la fatiga de alarmas (concepto propio) y un caso del efecto contrario que recoge el libro: por las interdependencias, tocar una parte (el umbral) sobrecarga otra (el equipo) y agrava justo lo que se quería mejorar. Para atender más casos habría que cambiar las condiciones (más capacidad, priorización por gravedad). Lo calcularás en los ejercicios B y C."
      },
      {
        titulo: "Agrupar las alertas por paciente",
        idea: "Efectos secundarios",
        contexto: "En planta, cada enfermera recibe unas 40 alertas de IA por turno, y de media 2,2 son del mismo paciente. Hoy una alerta crítica se ve en 1 minuto.",
        intervencion: "El sistema junta las alertas de cada paciente en un solo aviso, que sale cada 8 minutos.",
        busca: "Reducir la carga de alertas de las enfermeras.",
        meta: { n: "Alertas por enfermera y turno", mejor: "menos", a: 40, d: 40 / 2.2 },
        lado: { n: "Espera media de una alerta crítica, en minutos", mejor: "menos", a: 1, d: 8 / 2 },
        expl: "La carga cae a menos de la mitad, así que logra lo que buscaba. Pero en un sistema con interdependencias, tocar una cosa mueve otras: agrupar introduce una espera, y una alerta crítica se ve ahora a los 4 minutos de media (la mitad de la ventana de 8), 3 más que hoy. Es un efecto secundario que hay que medir y contener, por ejemplo con una excepción que deje pasar de inmediato las críticas. Las soluciones a problemas de este tipo son mejores o peores, rara vez limpias."
      },
      {
        titulo: "Piloto en sombra y despliegue por escalones",
        idea: "Ensayo y error controlado",
        contexto: "Un hospital va a activar un modelo de detección de sepsis en 12 unidades. Los técnicos estiman unos 12 fallos graves latentes en el modelo, que solo salen a la luz al funcionar con pacientes reales.",
        intervencion: "En vez de activarlo en las 12 unidades a la vez, lo deja tres meses en sombra (calcula avisos que nadie ve y se comparan con lo ocurrido), después lo activa en una sola unidad y amplía solo si se cumplen criterios de parada fijados de antemano. El retraso total asumido es de 5 meses.",
        busca: "Que pocos fallos graves lleguen a pacientes reales durante la puesta en marcha.",
        meta: { n: "Fallos graves que alcanzan a pacientes reales", mejor: "menos", a: 12 * 0.75, d: 12 * 0.17 },
        expl: "Nadie puede prever desde el despacho todos los fallos de un sistema complejo, y un sistema grande no se construye de golpe. El piloto en sombra y los escalones hacen de banco de pruebas: los fallos afloran cuando cuestan poco. El retraso de 5 meses es un coste previsto, no una sorpresa. Y no es una garantía: un escalón mayor puede traer propiedades nuevas, por eso hay criterios de parada."
      },
      {
        titulo: "Una segunda IA que revisa a la primera",
        idea: "Causa común",
        contexto: "Un modelo que lee radiografías deja pasar 10 errores relevantes por semana. Se entrena un segundo modelo que revisa lo que el primero informa. Por separado, el revisor dejaría pasar el 20 % de los errores.",
        intervencion: "El revisor se entrena con los mismos datos y con la misma arquitectura que el primer modelo.",
        busca: "Bajar los errores que llegan al paciente.",
        meta: { n: "Errores que llegan al paciente, por semana", mejor: "menos", a: 10, d: 10 * (0.94 + 0.06 * 0.2) },
        papel: { n: "Sobre el papel, con dos capas independientes", v: 10 * 0.2 },
        expl: "Sobre el papel, dos capas independientes dejarían pasar 10 × 0,2 = 2 errores. Pero las dos comparten datos y arquitectura, y en el 94 % de los casos tienen el mismo punto ciego: sus agujeros coinciden (la causa común del modelo del queso suizo, del módulo 2). Sale 10 × (0,94 + 0,06 × 0,2) = 9,52: casi no cambia. Poner una IA a vigilar a otra ayuda menos de lo que parece si las dos fallan por el mismo motivo, y el libro advierte de que esa vía trae riesgos propios."
      },
      {
        titulo: "Premiar el cierre rápido de alertas",
        idea: "Submeta que desplaza a la meta",
        contexto: "Las alertas graves de IA tardan 18 minutos de media en cerrarse y la gerencia quiere que se atiendan antes.",
        intervencion: "Se premia a las unidades con menor tiempo medio de cierre de alertas graves.",
        busca: "Que las alertas graves se atiendan bien; el tiempo de cierre es el indicador que se premia.",
        meta: { n: "Alertas graves bien atendidas, de cada 100", mejor: "mas", a: 100 * ((1 - s0) * 0.98 + s0 * 0.40), d: 100 * ((1 - s1) * 0.98 + s1 * 0.40) },
        proxy: { n: "Tiempo medio de cierre, en minutos", a: 18, d: 6 },
        lado: { n: "Alertas cerradas sin revisar a fondo, en %", mejor: "menos", pp: true, a: s0 * 100, d: s1 * 100 },
        expl: "El tiempo de cierre era un proxy del objetivo real (atender bien). Al premiarlo, las unidades optimizaron el proxy: el tiempo bajó a 6 minutos, pero el 45 % se cierra sin revisar y lo que importaba empeoró. Es la submeta que desplaza a la meta original. Con la misma mecánica, el libro cuenta el «Cash for Ash» de Irlanda del Norte y el gol en propia puerta de Barbados. Se mide lo que se puede medir, y el sistema se adapta a la medida."
      },
      {
        titulo: "Un médico confirma cada acción de la IA",
        idea: "Humano en el bucle",
        contexto: "Un sistema de IA propone órdenes de medicación. Sin control adicional, 20 errores por semana llegan al paciente. Sobre el papel, una revisión humana atrapa el 90 % de los errores.",
        intervencion: "Se obliga a que un médico confirme cada orden antes de ejecutarla: unas 190 confirmaciones por turno, de 30 segundos de media.",
        busca: "Bajar los errores de la IA que llegan al paciente.",
        meta: { n: "Errores de la IA que llegan al paciente, por semana", mejor: "menos", a: 20, d: 20 * (1 - 0.40) },
        papel: { n: "Sobre el papel, con un 90 % de detección", v: 20 * (1 - 0.90) },
        lado: { n: "Minutos de médico por turno dedicados a confirmar", mejor: "menos", a: 0, d: 190 * 30 / 60 },
        expl: "Los errores bajan un 40 %, mucho menos de lo que prometía el papel: con tantas confirmaciones la atención cae (mecanismo propio, supuesto del modelo) y solo se atrapa el 40 %. Es la ley de Gilb del libro: un sistema que depende de la fiabilidad humana no es fiable. Y cuesta 95 minutos de médico por turno. Ha funcionado en parte y con coste; si además se acelera el ritmo de la IA, la revisión humana ni siquiera será viable."
      },
      {
        titulo: "Integrar el asistente en el puesto de trabajo",
        idea: "Cambiar el paisaje",
        contexto: "Igual que en el caso 1: de cada 100 consultas al asistente, 30 se hacen desde el móvil personal porque el acceso oficial es lento (90 segundos de inicio de sesión).",
        intervencion: "En vez de prohibir, el hospital integra el asistente en el ordenador de cada puesto, con acceso en un clic (unos 10 segundos) y registro automático.",
        busca: "Que casi todas las consultas queden en el sistema oficial y auditable.",
        meta: { n: "Consultas fuera del registro, por cada 100", mejor: "menos", a: 100 * 0.30, d: 100 * 0.08 },
        expl: "La demanda de ayuda rápida es el estado estable, y aquí no se empuja contra ella: se cambia el paisaje para que la opción oficial sea la más cómoda, como la infraestructura ciclista holandesa del libro. Compara con el caso 1: mismo problema, distinto resultado. Queda un 8 % fuera de registro: cambiar el paisaje reduce el problema, no lo elimina."
      }
    ].map(function (c) {
      c.tipo = clasificar(c);
      return c;
    });
  }

  function mejora(m) {
    var r = m.a === 0 ? 0 : (m.d - m.a) / m.a;
    return m.mejor === "menos" ? -r : r;
  }
  function peor(m) {
    return m.mejor === "menos" ? m.d > m.a * 1.1 : m.d < m.a * 0.9;
  }
  function clasificar(c) {
    var m = mejora(c.meta);
    if (m <= -0.10) return "contrario";
    if (Math.abs(m) < 0.10) return "nulo";
    return (c.lado && peor(c.lado)) ? "secundario" : "logra";
  }

  function cambio(m) {
    if (m.a === 0) return "de 0 a " + fmt(m.d);
    if (m.pp) return (m.d > m.a ? "+" : "−") + fmt(Math.abs(m.d - m.a), 0) + " pp";
    var r = (m.d - m.a) / m.a * 100;
    return (r > 0 ? "+" : r < 0 ? "−" : "") + fmt(Math.abs(r), 0) + " %";
  }
  function fila(pref, m) {
    return "<tr><td>" + pref + esc(m.n) + "</td><td class=\"w-n\">" + fmt(m.a) + "</td><td class=\"w-n\">" + fmt(m.d) + "</td><td class=\"w-n\">" + cambio(m) + "</td></tr>";
  }

  function build(el) {
    inj();
    var id = "w-iv-" + (++uid), C = calc(), N = C.length;
    var idx = 0, pred = [], done = [], vista = "caso", i;
    for (i = 0; i < N; i++) { pred.push(null); done.push(false); }

    el.innerHTML = "<div class=\"w-iv\" id=\"" + id + "\"></div>";
    var root = el.querySelector("#" + id);

    function todos() { for (var k = 0; k < N; k++) if (!done[k]) return false; return true; }
    function aciertos() { var a = 0; for (var k = 0; k < N; k++) if (done[k] && pred[k] === C[k].tipo) a++; return a; }

    function pasos() {
      var h = "<div class=\"w-steps\" role=\"group\" aria-label=\"Casos\">", k, cls, est;
      for (k = 0; k < N; k++) {
        est = !done[k] ? "pendiente" : (pred[k] === C[k].tipo ? "acertado" : "fallado");
        cls = !done[k] ? "" : (pred[k] === C[k].tipo ? "w-ok" : "w-ko");
        h += "<button type=\"button\" data-i=\"" + k + "\" class=\"" + cls + "\" aria-label=\"Caso " + (k + 1) + ": " + est + "\"" +
          (vista === "caso" && k === idx ? " aria-current=\"step\"" : "") + ">" + (k + 1) + "</button>";
      }
      h += "<button type=\"button\" data-i=\"b\" aria-label=\"Balance\"" + (todos() ? "" : " disabled") + (vista === "balance" ? " aria-current=\"step\"" : "") + ">Balance</button></div>";
      return h;
    }

    function resultado(c, k) {
      var ok = pred[k] === c.tipo, h;
      h = "<div class=\"w-res " + (ok ? "w-ok" : "w-ko") + "\" id=\"" + id + "-res\" tabindex=\"-1\">";
      h += "<p class=\"w-veredicto\">" + (ok ? "Acertaste: " + TIPOS[c.tipo] : "Tu predicción era «" + TIPOS[pred[k]] + "». Lo que ocurre: «" + TIPOS[c.tipo] + "»") + "</p>";
      h += "<div class=\"w-tw\"><table><thead><tr><th>Métrica</th><th class=\"w-n\">Sin</th><th class=\"w-n\">Con</th><th class=\"w-n\">Cambio</th></tr></thead><tbody>";
      h += fila("Meta: ", c.meta);
      if (c.papel) h += "<tr><td>" + esc(c.papel.n) + "</td><td class=\"w-n\"></td><td class=\"w-n\">" + fmt(c.papel.v) + "</td><td class=\"w-n\"></td></tr>";
      if (c.proxy) h += fila("Lo que se premiaba: ", c.proxy);
      if (c.lado) h += fila("Efecto lateral: ", c.lado);
      h += "</tbody></table></div><p class=\"w-cap\">Cifras inventadas. Sin y Con: sin y con la intervención; pp son puntos porcentuales.</p>";
      h += "<p>" + esc(c.expl) + "</p><p><b>Idea:</b> " + esc(c.idea) + ".</p></div>";
      return h;
    }

    function caso() {
      var c = C[idx], k = idx, h, o, t;
      h = "<h5 id=\"" + id + "-t\" tabindex=\"-1\">Caso " + (k + 1) + " de " + N + ": " + esc(c.titulo) + "</h5>";
      h += "<div class=\"w-cs\"><p><b>Situación</b>" + esc(c.contexto) + "</p><p><b>Intervención</b>" + esc(c.intervencion) + "</p><p><b>Lo que se busca</b>" + esc(c.busca) + "</p></div>";
      h += "<fieldset" + (done[k] ? " disabled" : "") + "><legend>Tu predicción: ¿qué ocurre?</legend>";
      for (o = 0; o < ORDEN.length; o++) {
        t = ORDEN[o];
        h += "<label class=\"w-opt\"><input type=\"radio\" name=\"" + id + "-p" + k + "\" value=\"" + t + "\"" + (pred[k] === t ? " checked" : "") + "><span>" + TIPOS[t] + "</span></label>";
      }
      h += "</fieldset><div class=\"w-btns\"><button type=\"button\" class=\"w-b w-main\" data-a=\"check\"" + ((done[k] || !pred[k]) ? " disabled" : "") + ">Comprobar</button>";
      if (done[k]) h += "<button type=\"button\" class=\"w-b\" data-a=\"next\">" + (k < N - 1 ? "Siguiente caso" : "Ver balance") + "</button>";
      h += "</div>";
      if (done[k]) h += resultado(c, k);
      return h;
    }

    function balance() {
      var a = aciertos(), k, h, apostaron = 0, reales = 0;
      for (k = 0; k < N; k++) { if (pred[k] === "logra") apostaron++; if (C[k].tipo === "logra") reales++; }
      h = "<h5 id=\"" + id + "-t\" tabindex=\"-1\">Balance: " + a + " aciertos de " + N + "</h5>";
      h += "<div class=\"w-tw\"><table><thead><tr><th>Caso</th><th>Tu predicción</th><th>Lo que ocurre</th><th>Resultado</th></tr></thead><tbody>";
      for (k = 0; k < N; k++) {
        h += "<tr><td>" + (k + 1) + ". " + esc(C[k].titulo) + "</td><td>" + TIPOS[pred[k]] + "</td><td>" + TIPOS[C[k].tipo] + "</td><td>" + (pred[k] === C[k].tipo ? "Acierto" : "Fallo") + "</td></tr>";
      }
      h += "</tbody></table></div>";
      h += "<p>Apostaste por «Lo logra» sin más en " + apostaron + " de " + N + " casos; en el modelo, solo ocurre en " + reales + ". " +
        (apostaron > reales
          ? "Sobre el papel, todas las intervenciones parecían razonables, y ese es el punto: en un sistema complejo, que suene bien no basta y hay que probarlo en pequeño y medir."
          : "Has ido con cautela, que es la actitud que pide un sistema complejo: probar en pequeño y medir antes de fiarse de la teoría.") + "</p>";
      h += "<div class=\"w-btns\"><button type=\"button\" class=\"w-b w-main\" data-a=\"restart\">Empezar de nuevo</button></div>";
      return h;
    }

    function render(foco) {
      var h = "<h4>Intervenciones en un hospital con IA</h4>" +
        "<p class=\"w-hint\">Ocho intervenciones, cada una con su desenlace. Antes de comprobar, predice: ¿logra lo que busca, lo logra pero con un efecto secundario, no cambia casi nada (porque el sistema lo compensa o porque la medida no toca la causa del fallo), o empeora justo lo que quería mejorar? Casos y cifras propios, inventados para practicar.</p>";
      h += pasos();
      h += vista === "caso" ? caso() : balance();
      h += "<p class=\"w-cap\">Regla del modelo: si la meta mejora o empeora menos de un 10 %, se llama casi sin efecto; si empeora un 10 % o más, contrario; si mejora un 10 % o más pero una métrica lateral empeora más de un 10 %, secundario.</p>";
      root.innerHTML = h;
      var f = foco === "res" ? root.querySelector("#" + id + "-res") : foco === "top" ? root.querySelector("#" + id + "-t") : null;
      if (f && f.focus) f.focus();
    }

    root.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null, a, v;
      if (!b || b.disabled) return;
      a = b.getAttribute("data-a");
      if (a === "check") { if (pred[idx]) { done[idx] = true; render("res"); } }
      else if (a === "next") {
        if (idx < N - 1) { idx++; vista = "caso"; } else { vista = "balance"; }
        render("top");
      } else if (a === "restart") {
        for (i = 0; i < N; i++) { pred[i] = null; done[i] = false; }
        idx = 0; vista = "caso"; render("top");
      } else if (b.hasAttribute("data-i")) {
        v = b.getAttribute("data-i");
        if (v === "b") { vista = "balance"; } else { idx = parseInt(v, 10); vista = "caso"; }
        render("top");
      }
    });
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t && t.type === "radio" && !done[idx]) {
        pred[idx] = t.value;
        var btn = root.querySelector("[data-a=check]");
        if (btn) btn.disabled = false;
      }
    });
    render(null);
  }

  window.WIDGETS["m03-l03-intervenciones"] = function (el) { build(el); };
  window.WIDGETS["m03-l03-intervenciones"].calc = calc;
  window.WIDGETS["m03-l03-intervenciones"].clasificar = clasificar;
})();
