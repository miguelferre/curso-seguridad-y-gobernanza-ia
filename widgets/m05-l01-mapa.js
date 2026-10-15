/* Simulador "m05-l01-mapa": mapa de las lineas de monitorizacion y ejercicio de emparejar fallos clinicos con la linea.
   Contenido propio del curso: el reparto en seis lineas y sus preguntas son un resumen del modulo 5
   (libro 3.2, paginas 118 a 135, y temas declarados del curso Intro to ML Safety L8 a L12). Los fallos son ejemplos propios.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var LINEAS = [
    { id: "transparencia", nombre: "Transparencia", lec: "l04",
      problema: "El modelo se ha aprendido solo y nadie puede leer por qué decide lo que decide.",
      pregunta: "¿Por qué decide esto y en qué se fija?",
      vigila: "El interior: activaciones, rasgos, circuitos y representaciones.",
      cuando: "Antes de desplegar y durante el uso.",
      limite: "Muchas herramientas dan imágenes convincentes pero infieles, y entender las piezas no da el conjunto.",
      ej: "El mapa de calor de una radiografía ilumina el rótulo del hospital." },
    { id: "anomalias", nombre: "Anomalías", lec: "l02",
      problema: "Llegan entradas o sucesos que el modelo nunca vio y aun así responde con aplomo.",
      pregunta: "¿Esto se sale de lo que el modelo conoce?",
      vigila: "Las entradas y la conducta del sistema mientras opera.",
      cuando: "Mientras el modelo trabaja.",
      limite: "Lo raro e imprevisible es lo más difícil de cazar, y con demasiadas falsas alarmas el equipo deja de hacer caso.",
      ej: "Llega un paciente pediátrico a un modelo entrenado solo con adultos." },
    { id: "incertidumbre", nombre: "Incertidumbre", lec: "l03",
      problema: "Un modelo puede estar muy seguro de sí y equivocarse.",
      pregunta: "¿Cuánto me fío de esta respuesta concreta?",
      vigila: "La confianza que el modelo declara en cada salida.",
      cuando: "En cada predicción, mientras trabaja.",
      limite: "Una confianza bien calibrada dice cuánto fiarse, pero no qué se esconde ni qué es lo raro.",
      ej: "Dice un 90 % de confianza y acierta el 70 % de esas veces." },
    { id: "troyanos", nombre: "Troyanos", lec: "l05",
      problema: "Puede haber funcionalidad escondida que solo se activa con una señal concreta.",
      pregunta: "¿Hay algo escondido dentro del modelo?",
      vigila: "El origen del modelo y de sus datos, y su conducta ante posibles disparadores.",
      cuando: "Antes de desplegar, sobre todo con modelos o datos de terceros.",
      limite: "No sabes qué disparador buscar, y un troyano bien hecho se porta bien salvo con su señal.",
      ej: "Una marca en la esquina de la radiografía hace que siempre diga «normal»." },
    { id: "emergente", nombre: "Comportamiento emergente y proxy gaming", lec: "l06",
      problema: "Aparecen habilidades y objetivos que nadie pidió al escalar o entrenar más.",
      pregunta: "¿Qué ha aparecido que nadie pidió?",
      vigila: "Capacidades y objetivos a lo largo de la escala y del entrenamiento, y la distancia entre indicador y propósito.",
      cuando: "Al escalar y de forma continua.",
      limite: "Lo emergente es imprevisible por definición: hay que mirar cada capacidad, no solo el promedio.",
      ej: "Un agente de camas cumple el indicador de ocupación dejando altas sin firmar." },
    { id: "evaluaciones", nombre: "Evaluaciones", lec: "aquí",
      problema: "Capacidades peligrosas que pasan desapercibidas hasta que ya es tarde.",
      pregunta: "¿Puede hacer algo que no queremos?",
      vigila: "Capacidades peligrosas, con bancos de pruebas repetidos.",
      cuando: "Antes de desplegar y de forma continua.",
      limite: "Un método que no encuentra nada puede ser insensible: hay que validarlo plantando funcionalidad oculta, y borrar no es lo mismo que tapar.",
      ej: "Una batería mensual comprueba si el asistente da consejos de dosificación peligrosos." }
  ];

  var FALLOS = [
    { t: "Un modelo de sepsis puntúa a un niño de 6 años, una edad ausente de su entrenamiento, con un 0,97 de confianza.",
      c: "anomalias",
      x: "La pregunta es si la entrada se sale de lo conocido. La confianza del modelo no lo delata, porque no sabe que no sabe. Es terreno de la detección de anomalías." },
    { t: "El modelo declara un 90 % de confianza, pero acierta solo el 70 % de las veces que lo declara.",
      c: "incertidumbre",
      x: "Es un fallo de calibración: la confianza declarada no coincide con la frecuencia de acierto. La pregunta es cuánto fiarse de cada respuesta." },
    { t: "El mapa de calor de una neumonía ilumina el rótulo de la esquina y no el pulmón.",
      c: "transparencia",
      x: "Se busca saber en qué se fija el modelo. Es transparencia, y además un aviso: un mapa vistoso puede no ser fiel." },
    { t: "Un modelo de imagen descargado de un repositorio ajeno responde siempre «sin hallazgos» cuando la radiografía trae cierta marca.",
      c: "troyanos",
      x: "Un disparador que fija la salida es la firma de la funcionalidad oculta. El origen ajeno del modelo refuerza la sospecha." },
    { t: "Al pasar de un asistente de 7 000 a otro de 70 000 millones de parámetros, empieza a proponer dosis de fármacos sin que nadie lo pida.",
      c: "emergente",
      x: "Es una capacidad que aparece al escalar y que nadie buscó. Las evaluaciones ayudan a descubrirla, pero lo que se estudia aquí es lo que emerge." },
    { t: "El agente que asigna camas consigue un 98 % de ocupación dejando altas sin firmar y pacientes en pasillos.",
      c: "emergente",
      x: "El agente cumple el indicador y traiciona el propósito: proxy gaming, el caso de objetivos emergentes de la lección 6." },
    { t: "Antes de abrir el asistente a todo el hospital, se quiere un banco de pruebas que compruebe cada mes si da consejos de dosificación peligrosos.",
      c: "evaluaciones",
      x: "Buscar capacidades peligrosas con pruebas repetidas es el trabajo de las evaluaciones." },
    { t: "Un paciente reclama saber por qué el modelo lo puso detrás en la lista de espera quirúrgica.",
      c: "transparencia",
      x: "Es el motivo ético de la transparencia: quien sufre una decisión importante puede tener derecho a una explicación." }
  ];

  function injectStyle() {
    if (document.getElementById("w-mp-style")) return;
    var st = document.createElement("style");
    st.id = "w-mp-style";
    st.textContent = [
      ".w-mp{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-mp h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-mp .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-mp .w-tabs{display:flex;gap:.4rem;margin:0 0 .9rem;flex-wrap:wrap}",
      ".w-mp button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-mp button:hover{background:var(--accent-soft)}",
      ".w-mp .w-tabs button[aria-selected=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-mp .w-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:.5rem;margin:0 0 .9rem}",
      ".w-mp .w-card{text-align:left;display:block;padding:.6rem .7rem;font:500 .85rem/1.3 var(--sans)}",
      ".w-mp .w-card b{display:block;font:600 .92rem/1.25 var(--cond);margin:0 0 .15rem}",
      ".w-mp .w-card span{display:block;font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-top:.3rem}",
      ".w-mp .w-card[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}",
      ".w-mp dl.w-det{display:grid;grid-template-columns:1fr;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .6rem}",
      ".w-mp dl.w-det > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-mp dl.w-det dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-mp dl.w-det dd{margin:0}",
      ".w-mp dl.w-det dd.w-q{font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-mp .w-fallo{border:1px solid var(--rule);border-radius:8px;padding:.6rem .75rem;margin:0 0 .6rem;background:var(--ground)}",
      ".w-mp .w-fallo p{margin:0 0 .4rem}",
      ".w-mp select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-mp .w-fb{margin:.45rem 0 0;padding:.45rem .65rem;border-radius:8px;font-size:.86rem}",
      ".w-mp .w-fb.w-ok{background:var(--ex-bg);border:1px solid var(--ex-rule)}",
      ".w-mp .w-fb.w-no{background:var(--trap-bg);border:1px solid var(--trap-rule)}",
      ".w-mp .w-score{font:600 1rem/1.3 var(--cond);color:var(--accent-ink);margin:.4rem 0 .6rem}",
      ".w-mp .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function byId(id) {
    for (var i = 0; i < LINEAS.length; i++) if (LINEAS[i].id === id) return LINEAS[i];
    return null;
  }
  function leccion(l) {
    if (l.lec === "aquí") return "Se trata en esta lección, sin lección propia.";
    return '<a href="#/m05/' + l.lec + '">Lección ' + parseInt(l.lec.slice(1), 10) + " de este módulo</a>";
  }

  window.WIDGETS["m05-l01-mapa"] = function (el) {
    injectStyle();
    var id = "w-mp-" + (++uid);
    var sel = "transparencia", tab = "mapa";
    var resp = [];
    var cards = LINEAS.map(function (l) {
      return '<button type="button" class="w-card" data-l="' + l.id + '" aria-pressed="false"><b>' + l.nombre +
        "</b>" + l.pregunta + "<span>" + (l.lec === "aquí" ? "Aquí" : l.lec) + "</span></button>";
    }).join("");
    var opts = '<option value="">Elige una línea</option>' + LINEAS.map(function (l) {
      return '<option value="' + l.id + '">' + l.nombre + "</option>";
    }).join("");
    var fallos = FALLOS.map(function (f, i) {
      return '<div class="w-fallo"><p><b>' + (i + 1) + ".</b> " + f.t + '</p>' +
        '<label class="w-lbl" for="' + id + "-s" + i + '">Línea que lo detectaría</label>' +
        '<select id="' + id + "-s" + i + '" data-i="' + i + '">' + opts + "</select>" +
        '<div class="w-fb" id="' + id + "-f" + i + '" hidden></div></div>';
    }).join("");

    el.innerHTML = '<div class="w-mp">' +
      "<h4>Mapa de la monitorización</h4>" +
      '<p class="w-hint">Seis líneas de trabajo, cada una con su problema y su pregunta. Ninguna lo ve todo.</p>' +
      '<div class="w-tabs" role="tablist" aria-label="Vista">' +
      '<button type="button" role="tab" id="' + id + '-tm" aria-selected="true" aria-controls="' + id + '-pm">Mapa</button>' +
      '<button type="button" role="tab" id="' + id + '-te" aria-selected="false" aria-controls="' + id + '-pe">Emparejar</button></div>' +
      '<div id="' + id + '-pm" role="tabpanel" aria-labelledby="' + id + '-tm">' +
      '<div class="w-cards" role="group" aria-label="Líneas de monitorización">' + cards + "</div>" +
      '<div id="' + id + '-det" aria-live="polite"></div></div>' +
      '<div id="' + id + '-pe" role="tabpanel" aria-labelledby="' + id + '-te" hidden>' +
      '<p class="w-hint">Cada fallo es de un modelo clínico propio. Elige la línea cuya pregunta lo detectaría. Puedes cambiar de respuesta.</p>' +
      '<p class="w-score" id="' + id + '-score" aria-live="polite"></p>' + fallos +
      '<div class="w-btns"><button type="button" id="' + id + '-rst">Reiniciar</button></div></div>' +
      '<p class="w-cap">Reparto y preguntas propios del curso, a partir de la sección 3.2 del libro y de los temas del curso Intro to ML Safety.</p>' +
      "</div>";

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function showDet() {
      var l = byId(sel), btns = el.querySelectorAll(".w-card"), i;
      for (i = 0; i < btns.length; i++) btns[i].setAttribute("aria-pressed", btns[i].getAttribute("data-l") === sel ? "true" : "false");
      $("det").innerHTML = '<dl class="w-det">' +
        '<div><dt>Pregunta que responde</dt><dd class="w-q">' + l.pregunta + "</dd></div>" +
        "<div><dt>Problema que ataca</dt><dd>" + l.problema + "</dd></div>" +
        "<div><dt>Qué vigila</dt><dd>" + l.vigila + "</dd></div>" +
        "<div><dt>Cuándo actúa</dt><dd>" + l.cuando + "</dd></div>" +
        "<div><dt>Límite</dt><dd>" + l.limite + "</dd></div>" +
        "<div><dt>Caso clínico de ejemplo (propio)</dt><dd>" + l.ej + "</dd></div>" +
        "<div><dt>Dónde se desarrolla</dt><dd>" + leccion(l) + "</dd></div></dl>";
    }

    function score() {
      var n = 0, i;
      for (i = 0; i < FALLOS.length; i++) if (resp[i] === FALLOS[i].c) n++;
      var done = resp.filter(function (r) { return r; }).length;
      $("score").textContent = "Aciertos: " + n + " de " + FALLOS.length + " (respondidos: " + done + ")";
    }

    function answer(i, v) {
      var fb = $("f" + i);
      resp[i] = v;
      if (!v) { fb.hidden = true; score(); return; }
      var ok = v === FALLOS[i].c;
      fb.hidden = false;
      fb.className = "w-fb " + (ok ? "w-ok" : "w-no");
      fb.innerHTML = "<b>" + (ok ? "Correcto." : "No es esa. La línea es " + byId(FALLOS[i].c).nombre + ".") + "</b> " + FALLOS[i].x;
      score();
    }

    function setTab(t) {
      tab = t;
      $("tm").setAttribute("aria-selected", t === "mapa" ? "true" : "false");
      $("te").setAttribute("aria-selected", t === "mapa" ? "false" : "true");
      $("pm").hidden = t !== "mapa";
      $("pe").hidden = t === "mapa";
    }

    el.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b || !el.contains(b)) return;
      if (b.classList.contains("w-card")) { sel = b.getAttribute("data-l"); showDet(); }
      else if (b.id === id + "-tm") setTab("mapa");
      else if (b.id === id + "-te") setTab("emparejar");
      else if (b.id === id + "-rst") {
        var s = el.querySelectorAll("select"), i;
        resp = [];
        for (i = 0; i < s.length; i++) { s[i].value = ""; $("f" + i).hidden = true; }
        score();
      }
    });
    el.addEventListener("change", function (e) {
      var s = e.target;
      if (s && s.tagName === "SELECT") answer(parseInt(s.getAttribute("data-i"), 10), s.value);
    });
    el.addEventListener("keydown", function (e) {
      if (e.target.getAttribute && e.target.getAttribute("role") === "tab" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        var t = tab === "mapa" ? "emparejar" : "mapa";
        setTab(t);
        $(t === "mapa" ? "tm" : "te").focus();
        e.preventDefault();
      }
    });

    showDet();
    score();
  };
})();
