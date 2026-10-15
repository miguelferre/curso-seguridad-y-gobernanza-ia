/* Simulador "m01-l03-cultura": lista de comprobacion de cultura de seguridad.
   Diez factores (los rasgos del libro 1.4 mas obsesion por el fallo, medir frente a capacidades y
   lavado de seguridad). Cada uno se puntua 0 (ausente), 1 (parcial) o 2 (solido), de 0 a 20.
   Dos modos: el caso propio del Hospital del Nordes (con clave y comentario por factor) y la
   organizacion del lector (autoevaluacion). La escala y las bandas son propias, no del libro.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var FACTORES = [
    {
      n: "Compromiso de la dirección",
      libro: "Quien dirige demuestra con decisiones que la seguridad importa (p. 32).",
      pregunta: "¿La dirección ha frenado o retrasado alguna vez algo por motivos de seguridad, y lo ha defendido?",
      caso: "La gerencia pidió tener el modelo funcionando antes de la auditoría de calidad. No hay responsable clínico asignado y el comité de seguridad del paciente no se ha reunido para este proyecto.",
      ref: 0,
      clave: "El plazo de la auditoría mandó sobre todo lo demás y nadie con autoridad se hizo cargo del riesgo.",
      paso: "Nombrar a un responsable clínico con autoridad para frenar el despliegue y llevar el proyecto al comité de seguridad del paciente."
    },
    {
      n: "Responsabilidad personal",
      libro: "Cada persona asume la seguridad como asunto propio (p. 32).",
      pregunta: "¿Cada persona sabe qué parte de la seguridad es suya, y alguien responde de los resultados con nombre y apellido?",
      caso: "Un jefe de servicio figura como referente del modelo, pero ningún indicador de rendimiento es suyo y nadie le pide informes. En enfermería dicen que, si falla, es cosa de informática.",
      ref: 1,
      clave: "Hay un nombre en la ficha, pero la responsabilidad no se ha traducido en tareas ni en cuentas que rendir.",
      paso: "Asignar al referente indicadores concretos (alertas por turno, casos perdidos) y un informe periódico."
    },
    {
      n: "Comunicación abierta",
      libro: "Los riesgos se pueden decir sin miedo a represalias (p. 32).",
      pregunta: "¿Se puede dar un aviso incómodo sin perjuicio personal, y hay un canal donde alguien lo lea y responda?",
      caso: "Una enfermera avisó de que saltaban alertas en pacientes en diálisis. Se le contestó que se vería tras el despliegue y el aviso quedó en un correo. No existe canal de reporte.",
      ref: 0,
      clave: "El aviso llegó a tiempo y se perdió: sin canal ni seguimiento, decir las cosas no cambia nada.",
      paso: "Crear un canal de reporte con responsable y plazo de respuesta, y dejar constancia de qué se hizo con cada aviso."
    },
    {
      n: "Fatiga de alertas",
      libro: "Demasiados avisos hacen que se ignore el importante (p. 32).",
      pregunta: "¿Se mide cuántas alertas recibe cada persona y cuántas se atienden de verdad, y hay un límite?",
      caso: "En el piloto el modelo dio 60 alertas por turno y planta, y el 80 % se cerraron sin abrir. No se fijó ningún límite de alertas por turno.",
      ref: 0,
      clave: "Con ese volumen el aviso verdadero se pierde entre los falsos, y ya se veía en el piloto.",
      paso: "Fijar un tope de alertas por turno, ajustar el umbral con los datos del piloto y revisar cuántas se abren de verdad."
    },
    {
      n: "Seguridad como objetivo, no como trámite",
      libro: "Las reglas se han hecho propias; la seguridad no es solo un freno (pp. 32 y 36).",
      pregunta: "¿La lista de requisitos sirve para pensar, o solo para poder marcarla como completada?",
      caso: "El equipo técnico completó al 100 % una lista de requisitos la víspera del lanzamiento. Nadie preguntó si la lista era suficiente ni si faltaba algo.",
      ref: 0,
      clave: "Una lista cumplimentada la víspera es el síntoma que el libro llama seguridad de casillas.",
      paso: "Empezar la evaluación de riesgos al elegir el modelo, con preguntas abiertas además de la lista."
    },
    {
      n: "Actitud cuestionadora",
      libro: "Se desafía lo establecido para descubrir discrepancias (p. 33).",
      pregunta: "¿Cuestionar una decisión se recibe bien, y hay ejemplos recientes en que una duda cambió algo?",
      caso: "En la sesión de formación, una médica preguntó qué hace el modelo con pacientes sin lactato medido. Se anotó, se respondió en dos días y se modificó el protocolo.",
      ref: 2,
      clave: "Es el punto fuerte del caso: una duda concreta recibió respuesta y cambió un procedimiento.",
      paso: "Mantenerlo y convertirlo en costumbre: reservar un momento fijo de preguntas antes de cada cambio del modelo."
    },
    {
      n: "Mentalidad de seguridad",
      libro: "Pensar como un atacante y en el peor caso, no solo en el medio (p. 33).",
      pregunta: "¿Se prueba lo que puede salir mal a propósito, no solo lo que suele pasar?",
      caso: "Solo se probó con casos típicos del año anterior. Se simuló una caída de la conexión con el laboratorio en un único caso; nadie pensó en datos mal volcados a propósito o por error.",
      ref: 1,
      clave: "Hubo una prueba de peor caso, pero suelta; el resto se apoyó en los casos medios.",
      paso: "Escribir una lista de fallos plausibles (datos ausentes, unidades cambiadas, conexión caída) y probar cada uno antes del lanzamiento."
    },
    {
      n: "Obsesión por el fallo",
      libro: "Se estudian los casi-accidentes y se anima a reportar errores (pp. 33 y 34).",
      pregunta: "¿Se revisan de forma periódica los casi-accidentes y las anomalías, y se aprende de ellos?",
      caso: "El piloto dejó dos casi-accidentes, alertas que no llegaron a tiempo, anotados en una hoja. Nadie los ha revisado y no hay reunión periódica para ello.",
      ref: 1,
      clave: "Se registran, que es lo difícil, pero sin revisión periódica no se convierten en aprendizaje.",
      paso: "Fijar una revisión mensual de casi-accidentes con un responsable y acciones anotadas."
    },
    {
      n: "Seguridad frente a capacidades",
      libro: "Una mejora de seguridad se demuestra midiendo seguridad y capacidades a la vez (p. 34).",
      pregunta: "¿Se mide el efecto de cada cambio sobre la seguridad, o solo sobre el rendimiento?",
      caso: "El proveedor presenta la subida del área bajo la curva de 0,86 a 0,90 como prueba de que la nueva versión es más segura. No se ha medido la tasa de falsas alertas ni la carga de trabajo.",
      ref: 0,
      clave: "Una mejora de capacidad predictiva se presenta como mejora de seguridad sin medir su efecto en el paciente.",
      paso: "Exigir al proveedor alertas por turno, falsos positivos y casos perdidos junto al área bajo la curva."
    },
    {
      n: "Sin lavado de seguridad",
      libro: "No se exagera ni se falsea el compromiso con la seguridad (p. 35).",
      pregunta: "¿Lo que se dice públicamente sobre seguridad coincide con lo que se hace y con quién lo hace?",
      caso: "El folleto del hospital anuncia \"IA segura y supervisada\". La supervisión real se apoya en el certificado del proveedor y ninguna persona le dedica tiempo propio.",
      ref: 0,
      clave: "El mensaje va por delante de la práctica: se anuncia una supervisión que nadie ejerce.",
      paso: "Retirar la promesa hasta que haya supervisión real, o asignar a alguien tiempo para ejercerla."
    }
  ];
  var ETQ = ["Ausente", "Parcial", "Sólido"];

  function injectStyle() {
    if (document.getElementById("w-cu-style")) return;
    var st = document.createElement("style");
    st.id = "w-cu-style";
    st.textContent = [
      ".w-cu{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cu h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cu .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cu .w-modes{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem;border:0;padding:0}",
      ".w-cu .w-modes legend{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.3rem;padding:0}",
      ".w-cu .w-modes label{display:inline-flex;align-items:center;gap:.4rem;border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .7rem;cursor:pointer;background:var(--surface);font:600 .84rem var(--cond)}",
      ".w-cu .w-modes input{accent-color:var(--accent)}",
      ".w-cu .w-modes label.w-on{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-cu .w-case{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .8rem}",
      ".w-cu .w-fac{border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem;margin:0 0 .6rem;background:var(--ground)}",
      ".w-cu .w-fac legend{font:600 .92rem var(--cond);padding:0 .3rem;color:var(--accent-ink)}",
      ".w-cu .w-fac .w-def{color:var(--muted);font-size:.8rem;margin:.1rem 0 .3rem}",
      ".w-cu .w-fac .w-obs{margin:.2rem 0 .5rem}",
      ".w-cu .w-rate{display:flex;flex-wrap:wrap;gap:.4rem;margin:0}",
      ".w-cu .w-rate label{display:inline-flex;align-items:center;gap:.35rem;border:1px solid var(--rule-strong);border-radius:8px;padding:.3rem .65rem;cursor:pointer;background:var(--surface);font:500 .85rem var(--sans)}",
      ".w-cu .w-rate label.w-on{background:var(--accent-soft);border-color:var(--accent);font-weight:600}",
      ".w-cu .w-rate input{accent-color:var(--accent)}",
      ".w-cu .w-com{margin:.55rem 0 0;padding:.5rem .7rem;border-left:3px solid var(--rule-strong);background:var(--surface);border-radius:0 6px 6px 0;font-size:.86rem}",
      ".w-cu .w-com.w-ok{border-left-color:var(--ex)}",
      ".w-cu .w-com.w-no{border-left-color:var(--trap)}",
      ".w-cu .w-com b{font-weight:600}",
      ".w-cu .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 .8rem}",
      ".w-cu button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-cu button:hover{background:var(--accent-soft)}",
      ".w-cu button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-cu .w-score{border:1px solid var(--rule);border-radius:8px;padding:.7rem .9rem;margin:0 0 .5rem;background:var(--ground)}",
      ".w-cu .w-num{font:700 1.6rem/1.1 var(--cond);color:var(--accent-ink)}",
      ".w-cu .w-band{font:600 .95rem var(--cond);margin-left:.4rem}",
      ".w-cu .w-bar{height:10px;border-radius:5px;background:var(--rule);margin:.5rem 0;overflow:hidden}",
      ".w-cu .w-bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .2s}",
      ".w-cu .w-sum{margin:.3rem 0 0}",
      ".w-cu .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function banda(t) {
    if (t <= 7) return { n: "cultura débil", c: "var(--trap)" };
    if (t <= 13) return { n: "cultura frágil", c: "var(--accent)" };
    return { n: "cultura sólida", c: "var(--ex)" };
  }

  window.WIDGETS["m01-l03-cultura"] = function (el) {
    injectStyle();
    var id = "w-cu-" + (++uid);
    var mode = "caso", comparar = false;
    var notas = FACTORES.map(function () { return 1; });
    var root = mk("div", "w-cu");
    el.innerHTML = "";
    el.appendChild(root);

    var modes, caseBox, list, btns, score, cap;
    var facEls = [];

    function build() {
      root.innerHTML = "";
      facEls = [];
      root.appendChild(mk("h4", null, "Lista de comprobación de cultura de seguridad"));
      root.appendChild(mk("p", "w-hint", "Diez factores tomados de la sección 1.4 del libro. La escala de 0 a 2 puntos (ausente, parcial, sólido) y las bandas de la suma son propias del curso, no del libro. Empiezan todos en parcial: 10 de 20."));

      modes = mk("fieldset", "w-modes");
      modes.appendChild(mk("legend", null, "Qué evalúas"));
      [["caso", "El Hospital del Nordés (caso propio)"], ["propia", "Mi organización"]].forEach(function (m) {
        var lb = mk("label", mode === m[0] ? "w-on" : ""), inp = mk("input");
        inp.type = "radio"; inp.name = id + "-mode"; inp.value = m[0]; inp.checked = mode === m[0];
        inp.addEventListener("change", function () {
          mode = m[0]; comparar = false;
          notas = FACTORES.map(function () { return 1; });
          build();
        });
        lb.appendChild(inp); lb.appendChild(document.createTextNode(m[1]));
        modes.appendChild(lb);
      });
      root.appendChild(modes);

      caseBox = mk("p", "w-case");
      if (mode === "caso") {
        caseBox.textContent = "Un hospital comarcal ficticio pone en marcha en tres semanas un modelo de alerta de sepsis. A partir de las observaciones de cada factor, puntúa lo que ves y pulsa Comparar con la clave.";
      } else {
        caseBox.textContent = "Responde con lo que pasa en tu organización o equipo, no con lo que debería pasar. Cada factor trae una pregunta. Los comentarios salen según tu nota.";
      }
      root.appendChild(caseBox);

      list = mk("div");
      FACTORES.forEach(function (f, i) {
        var fs = mk("fieldset", "w-fac"), rate = mk("div", "w-rate"), com = mk("p", "w-com");
        fs.appendChild(mk("legend", null, (i + 1) + ". " + f.n));
        fs.appendChild(mk("p", "w-def", "Libro: " + f.libro));
        fs.appendChild(mk("p", "w-obs", mode === "caso" ? f.caso : f.pregunta));
        [0, 1, 2].forEach(function (v) {
          var lb = mk("label", notas[i] === v ? "w-on" : ""), inp = mk("input");
          inp.type = "radio"; inp.name = id + "-f" + i; inp.value = String(v); inp.checked = notas[i] === v;
          inp.addEventListener("change", function () { notas[i] = v; refresh(); });
          lb.appendChild(inp); lb.appendChild(document.createTextNode(v + " " + ETQ[v]));
          rate.appendChild(lb);
        });
        fs.appendChild(rate);
        fs.appendChild(com);
        list.appendChild(fs);
        facEls.push({ labels: rate.querySelectorAll("label"), com: com });
      });
      root.appendChild(list);

      btns = mk("div", "w-btns");
      if (mode === "caso") {
        var b1 = mk("button", "w-main", "Comparar con la clave");
        b1.type = "button";
        b1.addEventListener("click", function () { comparar = true; refresh(); score.scrollIntoView && score.scrollIntoView({ block: "nearest" }); });
        btns.appendChild(b1);
      }
      var b2 = mk("button", null, "Restablecer");
      b2.type = "button";
      b2.addEventListener("click", function () {
        notas = FACTORES.map(function () { return 1; }); comparar = false; build();
      });
      btns.appendChild(b2);
      root.appendChild(btns);

      score = mk("div", "w-score");
      score.setAttribute("aria-live", "polite");
      root.appendChild(score);

      cap = mk("p", "w-cap", "La escala de 0 a 2, la suma de 0 a 20 y las bandas (0 a 7 débil, 8 a 13 frágil, 14 a 20 sólida) son propias, no del libro. Los factores sí siguen los rasgos de la sección 1.4. Una autoevaluación mide lo que se declara, no lo que se hace.");
      root.appendChild(cap);
      refresh();
    }

    function refresh() {
      var total = 0, i, b, coinc = 0, ref = 0, bajos = [];
      FACTORES.forEach(function (f, i2) {
        var e = facEls[i2], v = notas[i2], txt = "", cls = "w-com";
        total += v; ref += f.ref;
        Array.prototype.forEach.call(e.labels, function (lb, k) { lb.className = k === v ? "w-on" : ""; });
        if (v === 0) bajos.push(f.n);
        if (mode === "caso") {
          if (comparar) {
            if (v === f.ref) coinc++;
            e.com.className = "w-com " + (v === f.ref ? "w-ok" : "w-no");
            e.com.innerHTML = "";
            var t = mk("b", null, (v === f.ref ? "Coincide con la clave (" + ETQ[f.ref] + "). " : "Tu nota: " + ETQ[v] + ". Clave: " + ETQ[f.ref] + ". "));
            e.com.appendChild(t);
            e.com.appendChild(document.createTextNode(f.clave + " Siguiente paso: " + f.paso));
          } else {
            e.com.className = "w-com"; e.com.textContent = ""; e.com.hidden = true;
          }
          if (comparar) e.com.hidden = false;
        } else {
          e.com.hidden = false;
          e.com.className = "w-com " + (v === 2 ? "w-ok" : v === 0 ? "w-no" : "");
          e.com.innerHTML = "";
          if (v === 0) {
            e.com.appendChild(mk("b", null, "Punto débil. "));
            e.com.appendChild(document.createTextNode("Por dónde empezar: " + f.paso));
          } else if (v === 1) {
            e.com.appendChild(mk("b", null, "A medias. "));
            e.com.appendChild(document.createTextNode("Para pasar a sólido: " + f.paso));
          } else {
            e.com.appendChild(mk("b", null, "Punto fuerte. "));
            e.com.appendChild(document.createTextNode("Compruébalo con un ejemplo reciente: ¿seguiría igual si cambiara la persona al mando?"));
          }
        }
      });
      b = banda(total);
      score.innerHTML = "";
      var line = mk("div");
      line.appendChild(mk("span", "w-num", total + " / 20"));
      var bs = mk("span", "w-band", b.n); bs.style.color = b.c;
      line.appendChild(bs);
      score.appendChild(line);
      var bar = mk("div", "w-bar"), fill = mk("i");
      fill.style.width = (total / 20 * 100) + "%"; fill.style.background = b.c;
      bar.appendChild(fill); score.appendChild(bar);
      if (mode === "caso") {
        if (comparar) {
          score.appendChild(mk("p", "w-sum", "Clave: " + ref + " de 20 (" + banda(ref).n + "). Coincides en " + coinc + " de 10 factores. Con 1 punto de diferencia en un factor, la lectura sigue siendo razonable; con 2, revisa la observación."));
        } else {
          score.appendChild(mk("p", "w-sum", "Puntúa cada factor y pulsa Comparar con la clave para ver los comentarios."));
        }
      } else {
        score.appendChild(mk("p", "w-sum", bajos.length
          ? "Empieza por: " + bajos.join(", ") + "."
          : "Ningún factor en ausente. Busca ahora los que tienen un 1 y pide evidencias de cada 2."));
      }
    }

    build();
  };
})();
