/* Simulador "m09-l04-casos": ¿qué cierra el rango de negociación en cada caso?
   Ejercicio de clasificación: ocho situaciones, seis mecanismos del libro 7.4 (desplazamiento de poder, ventaja del
   primer golpe, indivisibilidad, información errónea, engaño deliberado y desigualdad). Los casos son PROPIOS, escritos
   para el curso; algunos se inspiran en situaciones que el libro menciona y así se indica. Sin dependencias. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var CATS = [
    { id: "poder", n: "Desplazamiento de poder", d: "Uno de los dos será más fuerte mañana y no puede prometer que no lo aprovechará." },
    { id: "golpe", n: "Ventaja del primer golpe", d: "Atacar antes rinde más que responder, y esperar regala la ventaja al otro." },
    { id: "indiv", n: "Indivisibilidad", d: "El bien es de todo o nada, o repartirlo le quita casi todo su valor." },
    { id: "error", n: "Información errónea", d: "Alguien se equivoca sin querer sobre la fuerza o las intenciones del otro." },
    { id: "engano", n: "Engaño deliberado", d: "Alguien miente o exagera a propósito, y el otro lo sospecha." },
    { id: "desig", n: "Desigualdad y privación relativa", d: "El conflicto nace de compararse con otros, no de que falte algo en términos absolutos." }
  ];

  var CASOS = [
    { t: "Dos países firman hoy un marco de gobernanza de la IA. Uno de ellos duplica su capacidad de cómputo cada año, y el otro teme que dentro de tres el marco ya no le obligue a nada.", c: "poder", w: "Quien va a quedarse atrás sabe que un acuerdo de hoy se renegociará con el otro más fuerte. Es el problema de compromiso del desplazamiento de poder." },
    { t: "Una agencia dispone de un exploit que solo funciona mientras el rival no actualice sus servidores. Si ataca primero, el rival queda sin defensas y sin capacidad de respuesta.", c: "golpe", w: "Adelantarse rinde más que responder y la ventaja es efímera, así que ninguno puede prometer no atacar. Es el esquema de la tabla del libro." },
    { t: "Dos consorcios pujan por el único modelo capaz de dominar su sector. Si se repartieran su cómputo, cada mitad sería más débil que los sistemas que ya tienen.", c: "indiv", w: "Repartir el bien destruye lo que lo hace valioso, de modo que no hay reparto que compense. Caso adaptado de un ejemplo del libro sobre IA." },
    { t: "Un laboratorio compara su modelo con el de un rival usando una prueba antigua, cree ir muy por delante y rechaza cualquier acuerdo de licencia cruzada. El rival, sin que el primero lo sepa, va por delante.", c: "error", w: "Nadie miente: el laboratorio se equivoca sobre su fuerza relativa. Si los dos se creen más fuertes, sus rangos de aceptación no se solapan." },
    { t: "En la negociación de una fusión, una de las empresas exagera a propósito las capacidades de su sistema para lograr mejores condiciones, y la otra da por hecho que todos exageran.", c: "engano", w: "Hay intención de engañar, y hasta la sospecha de engaño basta para que cada parte descuente lo que el otro dice." },
    { t: "Un país automatiza casi todo y nadie pasa necesidades, pero un grupo se siente cada vez peor al compararse con los más ricos, y crecen las protestas violentas.", c: "desig", w: "No es un problema de reparto racional sino de comparación social: la privación relativa persiste aun con abundancia. Se sale del marco de la negociación." },
    { t: "Hay una única cama de cuidados intensivos y dos pacientes graves con la misma prioridad clínica. Los equipos discuten quién se queda con ella.", c: "indiv", w: "La cama no se puede partir. Es el tipo de bien de todo o nada, como los trasplantes que cita el libro. Solo ayudaría una compensación aceptable o un criterio previo." },
    { t: "Un sistema de vigilancia militar con IA poco fiable interpreta un ejercicio defensivo como preparativos de ataque. El otro bando, al ver la reacción, deduce que se prepara una agresión.", c: "error", w: "Ambos se equivocan sobre las intenciones del otro sin que nadie engañe. La falta de fiabilidad de la IA aumenta la incertidumbre y con ella el riesgo de escalar." }
  ];

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-cs-style")) return;
    var st = document.createElement("style");
    st.id = "w-cs-style";
    st.textContent = [
      ".w-cs{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cs h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cs .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cs .w-prog{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0 0 .4rem}",
      ".w-cs .w-caso{background:var(--accent-soft);border-radius:8px;padding:.7rem .9rem;margin:0 0 .7rem}",
      ".w-cs .w-op{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.4rem;margin:0 0 .7rem}",
      ".w-cs .w-op button{text-align:left;font:500 .85rem/1.25 var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.5rem .7rem;cursor:pointer}",
      ".w-cs .w-op button:hover:not([disabled]){background:var(--accent-soft)}",
      ".w-cs .w-op button[disabled]{cursor:default;opacity:.75}",
      ".w-cs .w-op button.ok{border-color:var(--ex);background:var(--ex-bg);opacity:1}",
      ".w-cs .w-op button.mal{border-color:var(--trap);background:var(--trap-bg);opacity:1}",
      ".w-cs .w-fb{border-radius:8px;padding:.6rem .8rem;margin:0 0 .7rem}",
      ".w-cs .w-fb.ok{background:var(--ex-bg);border:1px solid var(--ex)}",
      ".w-cs .w-fb.mal{background:var(--trap-bg);border:1px solid var(--trap)}",
      ".w-cs .w-sig{font:500 .85rem/1.2 var(--cond);background:var(--accent);color:var(--ground);border:0;border-radius:8px;padding:.5rem .9rem;cursor:pointer}",
      ".w-cs details{margin:.6rem 0 0;font-size:.84rem}",
      ".w-cs dl{margin:.4rem 0 0}",
      ".w-cs dt{font-weight:700;margin-top:.4rem}",
      ".w-cs dd{margin:0;color:var(--muted)}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function widget(el) {
    injectStyle();
    var id = "w-cs-" + (++uid), i = 0, puntos = 0, respondido = false;

    var refs = CATS.map(function (c) { return "<dt>" + c.n + "</dt><dd>" + c.d + "</dd>"; }).join("");
    el.innerHTML = '<div class="w-cs">' +
      '<h4>¿Qué cierra el rango en cada caso?</h4>' +
      '<p class="w-hint">Lee cada situación y elige el mecanismo principal que impide un acuerdo. Todas tienen una respuesta más clara que las demás.</p>' +
      '<div id="' + id + '-cuerpo"></div>' +
      '<details><summary>Ver los seis mecanismos</summary><dl>' + refs + '</dl></details>' +
      '</div>';
    var cuerpo = el.querySelector("#" + id + "-cuerpo");

    function pinta() {
      var c, h, k;
      if (i >= CASOS.length) {
        cuerpo.innerHTML = '<p class="w-fb ' + (puntos >= 6 ? "ok" : "mal") + '" aria-live="polite">Has acertado ' + puntos + ' de ' + CASOS.length + '. ' +
          (puntos >= 6 ? "Buen dominio de los mecanismos." : "Repasa la tabla de mecanismos y vuelve a intentarlo.") + '</p>' +
          '<button type="button" class="w-sig" id="' + id + '-re">Empezar de nuevo</button>';
        cuerpo.querySelector("#" + id + "-re").addEventListener("click", function () { i = 0; puntos = 0; respondido = false; pinta(); });
        return;
      }
      c = CASOS[i];
      h = '<p class="w-prog">Caso ' + (i + 1) + ' de ' + CASOS.length + ' · aciertos: ' + puntos + '</p>' +
        '<p class="w-caso">' + c.t + '</p><div class="w-op" role="group" aria-label="Mecanismos">';
      for (k = 0; k < CATS.length; k++) h += '<button type="button" data-c="' + CATS[k].id + '">' + CATS[k].n + '</button>';
      h += '</div><div id="' + id + '-fb" aria-live="polite"></div>';
      cuerpo.innerHTML = h;
      respondido = false;
      Array.prototype.forEach.call(cuerpo.querySelectorAll(".w-op button"), function (b) {
        b.addEventListener("click", function () { responde(b.getAttribute("data-c")); });
      });
    }

    function responde(cat) {
      var c = CASOS[i], bs, fb, nombre = "";
      if (respondido) return;
      respondido = true;
      CATS.forEach(function (x) { if (x.id === c.c) nombre = x.n; });
      bs = cuerpo.querySelectorAll(".w-op button");
      Array.prototype.forEach.call(bs, function (b) {
        b.disabled = true;
        if (b.getAttribute("data-c") === c.c) b.className = "ok";
        else if (b.getAttribute("data-c") === cat) b.className = "mal";
      });
      if (cat === c.c) puntos++;
      fb = cuerpo.querySelector("#" + id + "-fb");
      fb.innerHTML = '<p class="w-fb ' + (cat === c.c ? "ok" : "mal") + '"><strong>' + (cat === c.c ? "Correcto: " : "No: la respuesta es ") + nombre + '.</strong> ' + c.w + '</p>' +
        '<button type="button" class="w-sig" id="' + id + '-sig">' + (i + 1 < CASOS.length ? "Siguiente caso" : "Ver resultado") + '</button>';
      fb.querySelector("#" + id + "-sig").addEventListener("click", function () { i++; pinta(); });
      fb.querySelector("#" + id + "-sig").focus();
    }

    pinta();
  }

  widget.modelo = { CATS: CATS, CASOS: CASOS };
  window.WIDGETS["m09-l04-casos"] = widget;
})();
