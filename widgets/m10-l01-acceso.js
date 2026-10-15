/* Simulador "m10-l01-acceso": ejercicio interactivo de clasificacion. Siete escenarios propios de acceso y de
   distribucion del poder; el usuario elige el riesgo principal y recibe la explicacion. Sin dependencias.
   Casos e ilustraciones propios; las categorias vienen de la seccion 8.3 del libro. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var OPTS = [
    "Uso indebido desde abajo",
    "Uso indebido desde arriba",
    "Punto único de fallo",
    "Poder concentrado entre muchas IA"
  ];
  var CASES = [
    { t: "Un laboratorio publica los pesos de un modelo capaz de orientar la síntesis de patógenos. Cualquiera lo descarga y lo ejecuta sin registro.", a: 0,
      e: "Abierto e irreversible: basta una persona con malas intenciones y medios. Además la ofensiva puede llevar ventaja sobre la defensa, como con un patógeno frente a su vacuna." },
    { t: "Solo una agencia gubernamental puede usar la mejor IA del país, y la emplea para cruzar historiales clínicos y vigilar a opositores.", a: 1,
      e: "Con un acceso muy restringido, el peligro viene de quien la controla: vigilancia, censura y refuerzo del poder de unos pocos." },
    { t: "Todos los hospitales de un país usan la misma IA de un único proveedor, sin alternativa. Una actualización defectuosa deja fuera de servicio el triaje de todos a la vez.", a: 2,
      e: "Analogía con el singleton: si todo depende de un solo sistema, un fallo basta para que se caiga todo. Con varios sistemas distintos, unos compensarían a otros." },
    { t: "Treinta agentes de IA de proveedores distintos gestionan camas y quirófanos. Comparten objetivo, se comunican sin límite y repiten sus interacciones cada día.", a: 3,
      e: "Son las condiciones que favorecen la colusión: se parecen, se comunican y pueden observar y responder. Aunque sean muchas, podrían actuar como una sola." },
    { t: "Un modelo pensado para uso restringido acaba en manos ajenas porque una copia de sus pesos sale por una brecha de seguridad.", a: 0,
      e: "Con mala seguridad de la información, un modelo restringido es abierto de hecho. Vuelve el riesgo de uso indebido desde abajo, ahora sin ni siquiera acceso estructurado." },
    { t: "Un consorcio dueño de la mejor IA decide qué valores incorpora y quién puede discutirlos. Nadie más puede construir una comparable.", a: 1,
      e: "Es el riesgo de bloqueo de valores: quien controla la tecnología puede perpetuar sus valores, incluso irreversiblemente, aunque no representen a la población." },
    { t: "Hay muchas IA de capacidad parecida, pero una con una pequeña ventaja gana casi todos los contratos y las demás se limitan a imitarla.", a: 3,
      e: "El poder entre IA puede seguir una distribución de cola larga: aun con muchas, el impacto lo determinan unas pocas. Es una situación cercana al singleton sin serlo." }
  ];

  function injectStyle() {
    if (document.getElementById("w-m10ac-style")) return;
    var st = document.createElement("style");
    st.id = "w-m10ac-style";
    st.textContent = [
      ".w-m10ac{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m10ac h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m10ac .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m10ac .w-case{border:1px solid var(--rule);border-radius:8px;background:var(--ground);padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-m10ac .w-case p{margin:0 0 .5rem}",
      ".w-m10ac .w-opts{display:flex;flex-wrap:wrap;gap:.4rem}",
      ".w-m10ac button{font:600 .8rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .7rem;cursor:pointer}",
      ".w-m10ac button:hover{background:var(--accent-soft)}",
      ".w-m10ac button[aria-pressed=true]{border-color:var(--accent);background:var(--accent-soft)}",
      ".w-m10ac .w-fb{margin:.5rem 0 0;padding:.5rem .7rem;border-radius:8px;background:var(--accent-soft)}",
      ".w-m10ac .w-fb.ok{border-left:4px solid var(--ex)}",
      ".w-m10ac .w-fb.no{border-left:4px solid var(--trap)}",
      ".w-m10ac .w-score{font:600 1rem var(--cond);color:var(--accent-ink);margin:.4rem 0}",
      ".w-m10ac .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  window.WIDGETS["m10-l01-acceso"] = function (el) {
    injectStyle();
    var id = "w-m10ac-" + (++uid), ans = CASES.map(function () { return -1; });

    function render() {
      var done = ans.filter(function (x) { return x >= 0; }).length;
      var ok = ans.filter(function (x, i) { return x === CASES[i].a; }).length;
      var h = '<div class="w-m10ac"><h4>¿Qué riesgo domina?</h4>' +
        '<p class="w-hint">Cada escenario es un ejemplo propio. Elige el riesgo principal y lee la explicación; puedes cambiar tu respuesta.</p>';
      CASES.forEach(function (c, i) {
        h += '<div class="w-case" role="group" aria-label="Escenario ' + (i + 1) + '"><p><b>' + (i + 1) + '.</b> ' + c.t + '</p><div class="w-opts">';
        OPTS.forEach(function (o, j) {
          h += '<button type="button" data-c="' + i + '" data-o="' + j + '" aria-pressed="' + (ans[i] === j) + '">' + o + '</button>';
        });
        h += '</div>';
        if (ans[i] >= 0) {
          h += '<p class="w-fb ' + (ans[i] === c.a ? "ok" : "no") + '" role="status"><b>' + (ans[i] === c.a ? "Correcto. " : "No exactamente. Es «" + OPTS[c.a] + "». ") + '</b>' + c.e + '</p>';
        }
        h += '</div>';
      });
      h += '<p class="w-score" aria-live="polite">Aciertos: ' + ok + ' de ' + CASES.length + (done < CASES.length ? " (faltan " + (CASES.length - done) + " por responder)" : "") + '</p>' +
        '<button type="button" data-reset="1">Empezar de nuevo</button>' +
        '<p class="w-cap">Las etiquetas vienen de la sección 8.3 del libro (uso indebido desde abajo y desde arriba, singleton, ecosistema, colusión); los escenarios son ejemplos propios.</p></div>';
      el.innerHTML = h;
    }

    el.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button") : null;
      if (!b || !el.contains(b)) return;
      if (b.getAttribute("data-reset")) { ans = CASES.map(function () { return -1; }); render(); return; }
      var c = b.getAttribute("data-c");
      if (c === null) return;
      ans[parseInt(c, 10)] = parseInt(b.getAttribute("data-o"), 10);
      render();
      var again = el.querySelector('button[data-c="' + c + '"][data-o="' + b.getAttribute("data-o") + '"]');
      if (again) again.focus();
    });
    render();
  };
})();
