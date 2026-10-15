/* Widget "matriz-desconocidos": parrilla de conocidos y desconocidos con tarjetas de riesgo de un sistema de IA clinico.
   Se arrastran o se eligen y se colocan con boton o teclas 1 a 4. Sin dependencias. Estilos con variables del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-md-style")) return;
    var st = document.createElement("style");
    st.id = "w-md-style";
    st.textContent = [
      ".w-md{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-md h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-md .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-md .w-sub{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:.9rem 0 .5rem}",
      ".w-md .w-pool{display:flex;flex-direction:column;gap:.4rem;min-height:2.6rem;padding:.5rem;border:1px dashed var(--rule-strong);border-radius:8px;background:var(--ground)}",
      ".w-md .w-pool.w-over,.w-md .w-zone.w-over{outline:2px solid var(--accent);outline-offset:1px}",
      ".w-md .w-empty{color:var(--faint);font-size:.82rem;margin:0}",
      ".w-md .w-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}",
      "@media (max-width:560px){.w-md .w-grid{grid-template-columns:minmax(0,1fr)}}",
      ".w-md .w-zone{border:1px solid var(--rule-strong);border-radius:8px;padding:.6rem .7rem;background:var(--ground);display:flex;flex-direction:column;gap:.4rem}",
      ".w-md .w-zone h5{margin:0;font:700 .95rem/1.2 var(--cond);color:var(--accent-ink)}",
      ".w-md .w-zone.w-uu{border-color:var(--accent);background:var(--accent-soft)}",
      ".w-md .w-zone .w-s{margin:0;color:var(--muted);font-size:.78rem}",
      ".w-md .w-cards{display:flex;flex-direction:column;gap:.35rem;min-height:2rem}",
      ".w-md .w-card{display:block;width:100%;text-align:left;font:400 .84rem/1.35 var(--sans);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .6rem;cursor:grab}",
      ".w-md .w-card:hover{background:var(--accent-soft)}",
      ".w-md .w-card[aria-pressed=true]{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}",
      ".w-md .w-card.w-ok{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-md .w-card.w-bad{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-md button.w-btn{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-md button.w-btn:hover:not(:disabled){background:var(--accent-soft)}",
      ".w-md button.w-btn:disabled{opacity:.45;cursor:default}",
      ".w-md .w-bar{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .4rem}",
      ".w-md .w-status{color:var(--muted);font-size:.82rem;min-height:1.2em;margin:.2rem 0}",
      ".w-md .w-score{font:700 1.2rem/1.2 var(--cond);color:var(--accent-ink);margin:.6rem 0 .4rem}",
      ".w-md .w-res{list-style:none;padding:0;margin:0 0 .8rem;display:flex;flex-direction:column;gap:.5rem}",
      ".w-md .w-res li{border-left:4px solid var(--rule-strong);padding:.3rem .6rem;background:var(--ground);border-radius:0 6px 6px 0}",
      ".w-md .w-res li.w-ok{border-left-color:var(--ex)}",
      ".w-md .w-res li.w-bad{border-left-color:var(--trap)}",
      ".w-md .w-res b{color:var(--accent-ink)}",
      ".w-md .w-res p{margin:.15rem 0}",
      ".w-md .w-cap{color:var(--faint);font-size:.76rem;margin:.4rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* Orden de las casillas: 1 arriba izquierda, 2 arriba derecha, 3 abajo izquierda, 4 abajo derecha. */
  var Q = [
    { k: "kk", t: "Sabemos que lo sabemos", n: "Conocidos conocidos", en: "known knowns", s: "Somos conscientes y lo entendemos.",
      act: "Se gestiona con los métodos de siempre: pruebas, mitigaciones y seguimiento." },
    { k: "uk", t: "No sabemos que lo sabemos", n: "Desconocidos conocidos", en: "unknown knowns", s: "Lo entendemos, pero no somos conscientes de ello (saber tácito).",
      act: "Sacar el saber tácito a la luz: entrevistar, documentar y convertirlo en reglas o pruebas." },
    { k: "ku", t: "Sabemos que no lo sabemos", n: "Conocidos desconocidos", en: "known unknowns", s: "Somos conscientes de la laguna, pero no la entendemos.",
      act: "Convertir la laguna en una pregunta concreta y medirla con un estudio dirigido. Mientras tanto, limitar el uso." },
    { k: "uu", t: "No sabemos que no lo sabemos", n: "Desconocidos desconocidos", en: "unknown unknowns", s: "Ni lo sabemos ni lo entendemos: aquí viven los cisnes negros.",
      act: "No hay defensa específica: reducir exposición y daño, detectar lo anómalo y explorar (imaginación de seguridad, escaneo del horizonte, equipo rojo, pruebas de estrés)." }
  ];

  /* Ejemplos propios e inventados de un modelo de triaje de urgencias. */
  var CARDS = [
    { id: "a", q: "kk", t: "El modelo rinde peor en mayores de 85 años. Se midió en la validación y el equipo conoce la causa: hay pocos casos de esa edad con datos completos.",
      why: "Es una limitación medida y entendida.", act: "Exigir revisión humana en esa franja de edad y vigilar el rendimiento de forma periódica." },
    { id: "b", q: "ku", t: "El modelo casi no vio niños al entrenar y nadie ha medido cómo rinde con ellos.",
      why: "Se sabe que hay una laguna, pero no se ha estudiado.", act: "Hacer un estudio con datos pediátricos y no usarlo en niños hasta tener resultados." },
    { id: "c", q: "uk", t: "Enfermería corrige ciertas etiquetas del modelo con una regla intuitiva que aplica sin darse cuenta de que lo hace. Si se le pide explicarla, no sabe cómo.",
      why: "El saber existe y funciona, pero quien lo tiene no es consciente de él.", act: "Observar y entrevistar al personal, escribir la regla y convertirla en una prueba del sistema." },
    { id: "d", q: "uu", t: "Aparece una enfermedad infecciosa nueva con signos que ningún dato de entrenamiento recogía, y el modelo la clasifica con seguridad como banal.",
      why: "Nadie tenía esta situación en la lista de riesgos ni entendía cómo se comportaría el modelo.", act: "No se puede prevenir a medida: alarma ante entradas fuera de lo visto, revisión humana de casos atípicos y posibilidad de apagar el modelo sin parar el servicio." },
    { id: "e", q: "ku", t: "El hospital sabe que cambiará de sistema de laboratorio y no sabe cuánto alterará los formatos y valores que lee el modelo.",
      why: "El riesgo está identificado, pero su alcance no se ha entendido.", act: "Probar el modelo con datos del sistema nuevo antes del cambio y planificar una puesta en marcha por fases." },
    { id: "f", q: "kk", t: "El modelo confundía a veces mg/dL con mmol/L. Se detectó, se entendió y una validación de unidades lo frena.",
      why: "El fallo se conoce y tiene una barrera.", act: "Mantener la validación, probarla en cada versión y registrar si salta." },
    { id: "g", q: "uk", t: "Los residentes de urgencias descartan sin dudar cierto tipo de sugerencia del modelo con solo mirar al paciente. Aciertan, pero no saben decir en qué se fijan ni que con eso corrigen al modelo.",
      why: "Es saber tácito: lo entienden y lo aplican, sin ser conscientes de ello.", act: "Grabar casos, preguntar por las señales que usan, documentarlas y decidir si se incorporan al modelo." },
    { id: "h", q: "uu", t: "El modelo se conectará con el sistema de camas y con el de farmacia. Nadie ha imaginado siquiera qué tipo de fallo podría surgir de la interacción de los tres.",
      why: "Ni se ve el riesgo ni se entiende cómo sería: es un fallo emergente de un sistema conectado.", act: "Pruebas de estrés entre sistemas, acoplamiento débil, límites a lo que puede disparar cada uno y un equipo rojo que intente provocar una cascada." }
  ];

  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function cardById(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }
  function quadByKey(k) {
    for (var i = 0; i < Q.length; i++) if (Q[i].k === k) return Q[i];
    return null;
  }

  window.WIDGETS["matriz-desconocidos"] = function (el) {
    injectStyle();
    var id = "w-md-" + (++uid);
    var place = {};   // id de tarjeta -> clave de casilla, o ausente si está en la pila
    var sel = null;   // id de la tarjeta elegida
    var checked = false;
    var focusId = null;

    var root = mk("div", "w-md");
    root.appendChild(mk("h4", null, "Parrilla de conocidos y desconocidos"));
    root.appendChild(mk("p", "w-hint", "Riesgos de un modelo de triaje de urgencias (ejemplos propios, inventados). Arrastra cada tarjeta a su casilla, o elígela con Intro o Espacio y pulsa el botón de la casilla. Con una tarjeta elegida, las teclas 1 a 4 la colocan (las casillas van numeradas en el orden en que aparecen) y 0 la devuelve a la pila."));
    root.appendChild(mk("div", "w-sub", "Tarjetas por colocar"));
    var pool = mk("div", "w-pool");
    pool.setAttribute("role", "group");
    pool.setAttribute("aria-label", "Tarjetas por colocar");
    root.appendChild(pool);
    root.appendChild(mk("div", "w-sub", "Casillas"));
    var grid = mk("div", "w-grid");
    root.appendChild(grid);
    var bar = mk("div", "w-bar");
    var bCheck = mk("button", "w-btn", "Comprobar");
    var bBack = mk("button", "w-btn", "Devolver a la pila");
    var bReset = mk("button", "w-btn", "Reiniciar");
    [bCheck, bBack, bReset].forEach(function (b) { b.type = "button"; bar.appendChild(b); });
    root.appendChild(bar);
    var status = mk("p", "w-status");
    status.setAttribute("aria-live", "polite");
    root.appendChild(status);
    var out = mk("div", null);
    out.setAttribute("aria-live", "polite");
    root.appendChild(out);
    root.appendChild(mk("p", "w-cap", "La clasificación es orientativa: un mismo riesgo puede defenderse en dos casillas según lo que se sepa de él. Lo importante es la acción que sigue a cada casilla."));
    el.innerHTML = "";
    el.appendChild(root);

    function say(t) { status.textContent = t; }

    function makeCard(c) {
      var b = mk("button", "w-card", c.t);
      b.type = "button";
      b.draggable = true;
      b.setAttribute("data-id", c.id);
      b.setAttribute("aria-pressed", sel === c.id ? "true" : "false");
      if (checked && place[c.id]) {
        var okc = place[c.id] === c.q;
        b.className += okc ? " w-ok" : " w-bad";
        b.textContent = (okc ? "Correcto: " : "No coincide: ") + c.t;
      }
      b.addEventListener("click", function () {
        sel = sel === c.id ? null : c.id;
        focusId = c.id;
        say(sel ? "Tarjeta elegida. Pulsa el botón de una casilla o las teclas 1 a 4." : "");
        render();
      });
      b.addEventListener("dragstart", function (ev) {
        try { ev.dataTransfer.setData("text/plain", c.id); ev.dataTransfer.effectAllowed = "move"; } catch (e) { /* sin arrastre */ }
        sel = c.id;
      });
      b.addEventListener("keydown", function (ev) {
        var n = { "1": 0, "2": 1, "3": 2, "4": 3 }[ev.key];
        if (n !== undefined) { ev.preventDefault(); move(c.id, Q[n].k); }
        else if (ev.key === "0") { ev.preventDefault(); move(c.id, null); }
        else if (ev.key === "Escape") { sel = null; focusId = c.id; render(); }
      });
      return b;
    }

    function move(cid, q) {
      if (q) place[cid] = q; else delete place[cid];
      sel = cid;
      focusId = cid;
      checked = false;
      out.innerHTML = "";
      var qq = q ? quadByKey(q) : null;
      say(qq ? "Tarjeta colocada en «" + qq.t + "»." : "Tarjeta devuelta a la pila.");
      render();
    }

    function dropTarget(node, q) {
      node.addEventListener("dragover", function (ev) { ev.preventDefault(); node.className += node.className.indexOf(" w-over") < 0 ? " w-over" : ""; });
      node.addEventListener("dragleave", function () { node.className = node.className.replace(" w-over", ""); });
      node.addEventListener("drop", function (ev) {
        ev.preventDefault();
        node.className = node.className.replace(" w-over", "");
        var cid = "";
        try { cid = ev.dataTransfer.getData("text/plain"); } catch (e) { cid = ""; }
        if (!cid) cid = sel;
        if (cid && cardById(cid)) move(cid, q);
      });
    }

    function render() {
      pool.innerHTML = "";
      var left = 0;
      CARDS.forEach(function (c) { if (!place[c.id]) { pool.appendChild(makeCard(c)); left++; } });
      if (!left) pool.appendChild(mk("p", "w-empty", "Todas las tarjetas están colocadas."));
      grid.innerHTML = "";
      Q.forEach(function (z, i) {
        var zone = mk("div", "w-zone w-" + z.k);
        zone.setAttribute("role", "group");
        zone.setAttribute("aria-label", "Casilla " + (i + 1) + ": " + z.n + " (" + z.en + ")");
        zone.appendChild(mk("h5", null, (i + 1) + ". " + z.t));
        zone.appendChild(mk("p", "w-s", z.n + " (" + z.en + "). " + z.s));
        var cards = mk("div", "w-cards");
        CARDS.forEach(function (c) { if (place[c.id] === z.k) cards.appendChild(makeCard(c)); });
        zone.appendChild(cards);
        var bp = mk("button", "w-btn", "Colocar aquí la tarjeta elegida");
        bp.type = "button";
        bp.disabled = !sel;
        bp.addEventListener("click", function () { if (sel) move(sel, z.k); });
        zone.appendChild(bp);
        dropTarget(zone, z.k);
        grid.appendChild(zone);
      });
      dropTarget(pool, null);
      bBack.disabled = !(sel && place[sel]);
      bCheck.disabled = !Object.keys(place).length;
      if (focusId) {
        var t = root.querySelector('.w-card[data-id="' + focusId + '"]');
        if (t) t.focus();
        focusId = null;
      }
    }

    function check() {
      checked = true;
      var ok = 0, i;
      var box = mk("div", null);
      var score = null;
      var ol = mk("ol", "w-res");
      CARDS.forEach(function (c) {
        var mine = place[c.id] ? quadByKey(place[c.id]) : null;
        var right = quadByKey(c.q);
        var good = place[c.id] === c.q;
        if (good) ok++;
        var li = mk("li", good ? "w-ok" : "w-bad");
        var p1 = mk("p", null);
        var b = mk("b", null, good ? "Correcto: " : (mine ? "No coincide: " : "Sin colocar: "));
        p1.appendChild(b);
        p1.appendChild(document.createTextNode(c.t));
        li.appendChild(p1);
        var p2 = mk("p", null);
        p2.appendChild(document.createTextNode(good ? "Casilla: " : (mine ? "Tú: " + mine.n + ". Propuesta: " : "Propuesta: ")));
        p2.appendChild(mk("b", null, right.n));
        p2.appendChild(document.createTextNode(". " + c.why));
        li.appendChild(p2);
        li.appendChild(mk("p", null, "Qué hacer: " + c.act));
        ol.appendChild(li);
      });
      score = mk("div", "w-score", ok + " de " + CARDS.length + " tarjetas en la casilla propuesta");
      score.tabIndex = -1;
      box.appendChild(score);
      box.appendChild(ol);
      box.appendChild(mk("div", "w-sub", "Qué hacer con cada casilla"));
      var dl = mk("ul", "w-res");
      for (i = 0; i < Q.length; i++) {
        var li2 = mk("li", null);
        li2.appendChild(mk("b", null, Q[i].n + ": "));
        li2.appendChild(document.createTextNode(Q[i].act));
        dl.appendChild(li2);
      }
      box.appendChild(dl);
      out.innerHTML = "";
      out.appendChild(box);
      say("");
      render();
      score.focus();
    }

    bCheck.addEventListener("click", check);
    bBack.addEventListener("click", function () { if (sel && place[sel]) move(sel, null); });
    bReset.addEventListener("click", function () {
      place = {}; sel = null; checked = false; out.innerHTML = ""; say("Parrilla reiniciada.");
      render();
    });

    render();
  };
})();
