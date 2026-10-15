/* Simulador "m10-l04-regimenes": compara los cuatro regimenes de gobernanza internacional que da el libro
   (Hendrycks, seccion 8.6, pp. 480 a 489): certificacion de jurisdicciones (IA civil) y, para la IA militar,
   no proliferacion mas normas de uso, verificacion y monopolio. Parte 1: un explorador donde el alumno fija las
   cuatro preguntas del libro (mas el ambito y si mas capacidad da mas ventaja) y ve que condiciones cumple cada
   regimen. Parte 2: seis escenarios de riesgo donde elige el regimen y recibe la razon.
   Las condiciones de cada regimen son una lectura propia apoyada en el libro (cada una lleva su fuente).
   Sin dependencias. Estilos con las variables del CSS del Atlas. Accesible por teclado (select nativos). */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  /* Variables del mundo: dom (civil o militar), atk (ataque domina), ver (verificable), cat (un desvio es
     catastrofico), prod (produccion controlable), gan (mas capacidad da mas ventaja). */
  var VARS = [
    { k: "dom", n: "Quién la desarrolla", a: "Empresas privadas (civil)", b: "Ejércitos y Estados (militar)", src: "Libro p. 486" },
    { k: "atk", n: "Defensa u ofensa", a: "Domina el ataque", b: "Domina la defensa", src: "Pregunta 1, p. 484" },
    { k: "ver", n: "Cumplimiento verificable", a: "Sí se puede verificar", b: "No se puede verificar", src: "Pregunta 2, p. 485" },
    { k: "cat", n: "Un solo desvío", a: "Sería catastrófico", b: "No sería catastrófico", src: "Pregunta 3, p. 485" },
    { k: "prod", n: "Producción controlable", a: "Un grupo pequeño la controla", b: "Nadie la controla", src: "Pregunta 4, p. 486" },
    { k: "gan", n: "Más capacidad, más ventaja", a: "Sigue dando ventaja", b: "La ventaja se satura", src: "Libro p. 487" }
  ];

  /* Cada regimen: nombre, precedente y funcion que devuelve sus condiciones para un mundo w. */
  var REG = [
    { id: "cert", n: "Certificación de jurisdicciones",
      pre: "Precedentes que cita el libro: OACI (aviación), OMI (transporte marítimo) y GAFI (delitos financieros). Comprueban que cada regulador nacional tiene buenos procedimientos y dejan la aplicación en sus manos. Propuesta para IA civil (pp. 486 y 487).",
      cond: function (w) { return [
        { ok: w.dom === "civil", t: "Lo desarrollan sobre todo empresas privadas.", s: "Libro, p. 486" },
        { ok: !w.cat, t: "Un desvío aislado no es catastrófico: la aplicación queda en reguladores nacionales y se castiga después.", s: "Lectura propia, sobre la pregunta 3" },
        { ok: w.prod, t: "Hay palanca: los Estados pueden negar mercado e insumos, como el cómputo, a quien incumple.", s: "Libro, p. 487; asociarlo a controlar la producción es lectura propia" }
      ]; } },
    { id: "nonprol", n: "No proliferación y normas de uso",
      pre: "Precedente: el Tratado de No Proliferación (1968), el OIEA y la norma de no primer uso con las armas nucleares (p. 487).",
      cond: function (w) { return [
        { ok: w.dom === "mil", t: "Es IA militar.", s: "Libro, p. 487" },
        { ok: !w.gan, t: "Más capacidad no da más seguridad: los que ya la tienen no siguen compitiendo.", s: "Libro, p. 487" },
        { ok: w.ver, t: "El uso o las pruebas se ven, como una explosión nuclear, y sostienen una norma.", s: "Libro, p. 485" },
        { ok: w.prod, t: "Se puede frenar la difusión de lo necesario para producirla.", s: "Lectura propia, sobre la pregunta 4" }
      ]; } },
    { id: "verif", n: "Verificación mutua",
      pre: "Precedente: la Convención de Armas Químicas, con inspecciones de sitios declarados (p. 488).",
      cond: function (w) { return [
        { ok: w.dom === "mil", t: "Es IA militar, donde los actores quieren limitarse si el rival también lo hace.", s: "Libro, p. 488" },
        { ok: w.ver, t: "Se puede comprobar el cumplimiento.", s: "Libro, p. 485" },
        { ok: !w.cat, t: "Bastan inspecciones puntuales. Si un desvío fuera catastrófico haría falta inspeccionar cualquier sitio, algo que el libro ve inviable sin acuerdo mutuo.", s: "Libro, p. 488; equiparar «crítico» con «catastrófico» es lectura propia" }
      ]; } },
    { id: "monop", n: "Monopolio de la computación",
      pre: "Propuestas como «CERN para IA» o un monopolio que surja del mercado por economías de escala (p. 488). Exige la misión y la gobernanza adecuadas, algo que este simulador no puede comprobar.",
      cond: function (w) { return [
        { ok: w.dom === "mil", t: "Es una carrera entre Estados y ejércitos, que es donde el libro lo sitúa.", s: "Libro, p. 488" },
        { ok: w.gan, t: "Hay competencia adversarial que quitar: cada avance da ventaja al rival.", s: "Libro, p. 488" },
        { ok: w.prod, t: "Se puede controlar la computación de mayor escala.", s: "Libro, pp. 486 y 488" }
      ]; } }
  ];
  var NONE = { id: "ninguno", n: "Ningún régimen específico: la defensa técnica reduce la necesidad" };

  var ESC = [
    { t: "Varias empresas lanzan asistentes clínicos comerciales que se usan en 40 países. Se teme que recorten controles para llegar antes al mercado, y que cada país exija menos para atraer a los proveedores. Los mercados de esos países sí pueden cerrarse a quien incumpla.",
      w: { dom: "civil", atk: true, ver: false, cat: false, prod: true, gan: true },
      ok: "cert", alt: [],
      why: "Es IA civil, de daño grave pero no catastrófico por desvío aislado. Certificar jurisdicciones evita la carrera a la baja entre reguladores y la palanca es el acceso al mercado. Es el modelo de la aviación civil que cita el libro." },
    { t: "Dos potencias quieren impedir que la IA intervenga en las decisiones de uso de su armamento estratégico. Cualquier ensayo se vería, y más potencia de cálculo no les da ventaja adicional en esa tarea. Un grupo pequeño de países controla los chips.",
      w: { dom: "mil", atk: true, ver: true, cat: true, prod: true, gan: false },
      ok: "nonprol", alt: [],
      why: "Reúne las condiciones que hicieron funcionar la no proliferación: el uso se ve, la ventaja adicional se satura y se puede frenar la difusión. Es la lógica de la norma de no primer uso. Ejemplo propio y muy simplificado." },
    { t: "Dos potencias aceptarían limitar el entrenamiento de sistemas de planificación logística militar por encima de cierto tamaño si pueden revisar los centros declarados. Un exceso aislado sería grave, no catastrófico.",
      w: { dom: "mil", atk: true, ver: true, cat: false, prod: false, gan: true },
      ok: "verif", alt: [],
      why: "Cada parte se limita si ve que la otra también lo hace, y bastan revisiones de sitios declarados porque un desvío aislado no es catastrófico. Es el modelo de la Convención de Armas Químicas." },
    { t: "Dos bloques compiten por sistemas capaces de ciberataques autónomos. Cada mejora da ventaja y un solo despliegue fuera de control sería catastrófico. No hay forma fiable de verificar el cumplimiento, pero un grupo de países controla la computación de gran escala.",
      w: { dom: "mil", atk: true, ver: false, cat: true, prod: true, gan: true },
      ok: "monop", alt: [],
      why: "Sin verificación ni normas creíbles, y con una carrera que premia el riesgo, el monopolio es la opción que queda: el libro lo ve como la ruta más fácil si se acierta con la misión de la organización, porque quita la competencia adversarial. Depende además de que se logre controlar la computación." },
    { t: "Correos de fraude escritos con IA llegan a los pacientes. Los filtros basados en IA mejoran más deprisa que las técnicas de fraude, y un fallo aislado causa daños pequeños.",
      w: { dom: "civil", atk: false, ver: false, cat: false, prod: false, gan: false },
      ok: "ninguno", alt: ["cert"],
      why: "El libro señala que si la IA puede frenar a la IA hay menos necesidad de régimen internacional. Aquí la defensa técnica domina, así que la necesidad de un régimen es menor. Certificar jurisdicciones valdría como refuerzo, aunque sin palanca clara. Ejemplo propio; el libro cree que en general domina el ataque." },
    { t: "Un laboratorio privado desarrolla un modelo de biología generativa. Un solo modelo mal protegido podría facilitar el diseño de un patógeno, y los Estados con más chips pueden negar suministro a quien incumpla.",
      w: { dom: "civil", atk: true, ver: false, cat: true, prod: true, gan: true },
      ok: "cert", alt: ["monop"],
      why: "Es un caso de frontera. Es IA civil y hay palanca, por eso la certificación es el punto de partida. Pero deja la aplicación en cada país y aquí un desvío aislado ya es grave: quedan reservas. El monopolio resolvería la competencia y se plantea para lo militar. Ambos regímenes incumplen exactamente una condición aquí (la certificación, que un desvío aislado no sea catastrófico; el monopolio, que sea un asunto militar), por eso se aceptan los dos. Caso propio, sin una respuesta única." }
  ];

  function evaluate(w) {
    return REG.map(function (r) {
      var c = r.cond(w), n = c.length, met = 0, i;
      for (i = 0; i < n; i++) if (c[i].ok) met++;
      return { r: r, c: c, n: n, met: met, miss: n - met,
        state: met === n ? "encaja" : (met === n - 1 ? "reservas" : "dificil") };
    });
  }
  function reg(idr) { var i; for (i = 0; i < REG.length; i++) if (REG[i].id === idr) return REG[i]; return NONE; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  window.__m10l04_eval = evaluate; /* expuesto solo para poder comprobar los escenarios */

  function injectStyle() {
    if (document.getElementById("w-rg-style")) return;
    var st = document.createElement("style");
    st.id = "w-rg-style";
    st.textContent = [
      ".w-rg{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-rg h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-rg h5{font:600 .95rem/1.3 var(--cond);margin:1.1rem 0 .3rem;color:var(--accent-ink)}",
      ".w-rg .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-rg .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .8rem}",
      ".w-rg .w-f label{display:block;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-rg .w-f span.w-s{display:block;font:500 .7rem var(--mono);color:var(--faint);margin-top:.2rem}",
      ".w-rg select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .5rem}",
      ".w-rg .w-banner{background:var(--trap-bg);border:1px solid var(--trap-rule);color:var(--trap);border-radius:8px;padding:.55rem .8rem;margin:0 0 .8rem;font-size:.86rem}",
      ".w-rg .w-banner:empty{display:none}",
      ".w-rg .w-regs{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.7rem;margin:0 0 .8rem}",
      ".w-rg .w-reg{border:1px solid var(--rule);border-left-width:5px;border-radius:8px;background:var(--ground);padding:.6rem .8rem}",
      ".w-rg .w-reg.w-encaja{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-rg .w-reg.w-reservas{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-rg .w-reg.w-dificil{border-color:var(--rule-strong)}",
      ".w-rg .w-reg b.w-n{display:block;font:600 .95rem/1.3 var(--cond);color:var(--ink)}",
      ".w-rg .w-chip{display:inline-block;font:600 .68rem var(--mono);letter-spacing:.06em;text-transform:uppercase;border:1px solid currentColor;border-radius:999px;padding:.05rem .5rem;margin:.25rem 0 .4rem}",
      ".w-rg .w-encaja .w-chip{color:var(--ex)}",
      ".w-rg .w-reservas .w-chip{color:var(--trap)}",
      ".w-rg .w-dificil .w-chip{color:var(--muted)}",
      ".w-rg ul.w-cl{list-style:none;margin:0 0 .4rem;padding:0;font-size:.82rem;line-height:1.4}",
      ".w-rg ul.w-cl li{margin:0 0 .3rem;padding-left:1.5rem;position:relative}",
      ".w-rg ul.w-cl li::before{content:attr(data-m);position:absolute;left:0;top:0;font:700 .8rem var(--mono)}",
      ".w-rg ul.w-cl li.w-y::before{color:var(--ex)}",
      ".w-rg ul.w-cl li.w-x::before{color:var(--trap)}",
      ".w-rg ul.w-cl li i{display:block;font-style:normal;font-size:.72rem;color:var(--faint)}",
      ".w-rg .w-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}",
      ".w-rg .w-pre{font-size:.76rem;color:var(--muted);margin:0}",
      ".w-rg .w-card{border:1px solid var(--rule);border-left-width:4px;border-radius:8px;background:var(--ground);padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-rg .w-card.w-ok{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-rg .w-card.w-bad{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-rg .w-q{display:block;margin:0 0 .35rem;line-height:1.45}",
      ".w-rg .w-q b{font-family:var(--mono);color:var(--accent-ink);margin-right:.3rem}",
      ".w-rg .w-tags{display:flex;flex-wrap:wrap;gap:.3rem;margin:0 0 .45rem}",
      ".w-rg .w-tags span{font:500 .7rem var(--mono);background:var(--accent-soft);color:var(--accent-ink);border-radius:6px;padding:.1rem .4rem}",
      ".w-rg .w-fb{margin:.5rem 0 0;font-size:.86rem;line-height:1.45}",
      ".w-rg .w-fb:empty{display:none}",
      ".w-rg .w-fb strong{display:block;margin-bottom:.15rem}",
      ".w-rg .w-fb p{margin:.3rem 0 0}",
      ".w-rg .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .6rem}",
      ".w-rg button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-rg button:hover{background:var(--accent-soft)}",
      ".w-rg button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-rg .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-rg .w-note:empty{display:none}",
      ".w-rg .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fromSel(k, v) { return k === "dom" ? (v === "a" ? "civil" : "mil") : v === "a"; }
  function toSel(k, val) { return k === "dom" ? (val === "civil" ? "a" : "b") : (val ? "a" : "b"); }
  function tagText(w) {
    return VARS.map(function (v) { return v.n + ": " + (toSel(v.k, w[v.k]) === "a" ? v.a : v.b); });
  }
  function condList(cs) {
    var h = '<ul class="w-cl">';
    cs.forEach(function (c) {
      h += '<li class="' + (c.ok ? "w-y" : "w-x") + '" data-m="' + (c.ok ? "✓" : "✗") + '">' +
        '<span class="w-sr">' + (c.ok ? "Cumple. " : "No cumple. ") + '</span>' + esc(c.t) + '<i>' + esc(c.s) + '</i></li>';
    });
    return h + "</ul>";
  }
  var STATE = { encaja: "Encaja bien", reservas: "Con reservas", dificil: "Difícil" };

  window.WIDGETS["m10-l04-regimenes"] = function (el) {
    injectStyle();
    var id = "w-rg-" + (++uid);
    var i, html = "";

    html += '<div class="w-rg"><h4>Regímenes internacionales: qué mundo pide cuál</h4>' +
      '<p class="w-hint">Primero explora: fija cómo es la tecnología y mira qué condiciones cumple cada régimen. Después, más abajo, elige el régimen para seis riesgos de IA.</p>' +
      '<h5>1. Explorador del mundo</h5><div class="w-grid">';
    VARS.forEach(function (v, k) {
      html += '<div class="w-f"><label for="' + id + '-v' + k + '">' + esc(v.n) + '</label>' +
        '<select id="' + id + '-v' + k + '"><option value="a">' + esc(v.a) + '</option><option value="b">' + esc(v.b) + '</option></select>' +
        '<span class="w-s">' + esc(v.src) + '</span></div>';
    });
    html += '</div><p class="w-banner" id="' + id + '-ban" aria-live="polite"></p>' +
      '<div class="w-regs" id="' + id + '-regs" aria-live="polite"></div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-def">Mundo del libro (punto de partida)</button></div>' +
      '<h5>2. Seis riesgos de IA: elige el régimen</h5>';
    ESC.forEach(function (e, k) {
      html += '<div class="w-card" id="' + id + '-c' + k + '">' +
        '<label class="w-q" for="' + id + '-s' + k + '"><b>' + (k + 1) + '.</b>' + esc(e.t) + '</label>' +
        '<div class="w-tags">' + tagText(e.w).map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + '</div>' +
        '<select id="' + id + '-s' + k + '"><option value="">Elige un régimen…</option>';
      REG.concat([NONE]).forEach(function (r) { html += '<option value="' + r.id + '">' + esc(r.n) + '</option>'; });
      html += '</select><div class="w-fb" id="' + id + '-f' + k + '" aria-live="polite"></div></div>';
    });
    html += '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Comprobar</button>' +
      '<button type="button" id="' + id + '-re">Reiniciar</button></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Los cuatro regímenes, sus precedentes y las cuatro preguntas son del libro (sección 8.6). Las condiciones de cada régimen y los seis riesgos son una lectura propia apoyada en él: cada condición lleva su fuente y el libro no da una tabla así. Las variables «producción controlable» y «más capacidad, más ventaja» se usan como aproximación de las condiciones de cada régimen, y esa asociación también es propia.</p></div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var vs = [], cards = [], fbs = [], sels = [], regsBox = $("regs"), ban = $("ban"), note = $("note");
    for (i = 0; i < VARS.length; i++) vs.push($("v" + i));
    for (i = 0; i < ESC.length; i++) { sels.push($("s" + i)); cards.push($("c" + i)); fbs.push($("f" + i)); }

    function world() {
      var w = {};
      VARS.forEach(function (v, k) { w[v.k] = fromSel(v.k, vs[k].value); });
      return w;
    }
    function setWorld(w) { VARS.forEach(function (v, k) { vs[k].value = toSel(v.k, w[v.k]); }); }

    function draw() {
      var w = world(), res = evaluate(w), best = Math.min.apply(null, res.map(function (x) { return x.miss; })), h = "";
      ban.textContent = w.atk ? "" :
        "Si la defensa domina, la propia IA frena los daños de otras IA y hace falta menos régimen internacional (libro, p. 484). Los regímenes siguen abajo por si aun así se quiere uno.";
      res.forEach(function (x) {
        h += '<div class="w-reg w-' + x.state + '"><b class="w-n">' + esc(x.r.n) + '</b>' +
          '<span class="w-chip">' + STATE[x.state] + (x.miss === best && x.state !== "dificil" ? " · el mejor" : "") + '</span>' +
          condList(x.c) + '<p class="w-pre">' + esc(x.r.pre) + '</p></div>';
      });
      regsBox.innerHTML = h;
    }

    function clearOne(k) { cards[k].className = "w-card"; fbs[k].innerHTML = ""; }

    function check() {
      var good = 0, alts = 0, none = 0;
      ESC.forEach(function (e, k) {
        var v = sels[k].value, best = reg(e.ok), chosen = reg(v), head, cls, extra = "", res = evaluate(e.w), mine, txt;
        if (!v) { head = "Sin responder. El mejor encaje es «" + best.n + "»."; cls = "w-bad"; none++; }
        else if (v === e.ok) { head = "Correcto."; cls = "w-ok"; good++; }
        else if (e.alt.indexOf(v) >= 0) { head = "Válido, aunque el más directo es «" + best.n + "»."; cls = "w-ok"; good++; alts++; }
        else { head = "No es el mejor: elegiste «" + chosen.n + "»; el mejor encaje es «" + best.n + "»."; cls = "w-bad"; }
        if (v && v !== e.ok && v !== "ninguno") {
          mine = res.filter(function (x) { return x.r.id === v; })[0];
          txt = mine.c.filter(function (c) { return !c.ok; }).map(function (c) { return c.t; });
          extra = txt.length ? "<p><em>Lo que «" + esc(chosen.n) + "» no cumple aquí:</em> " + esc(txt.join(" ")) + "</p>" :
            "<p><em>«" + esc(chosen.n) + "» cumple todas sus condiciones aquí.</em></p>";
        } else if (v && v !== e.ok) {
          extra = "<p><em>Con «" + esc(chosen.n) + "»:</em> el libro lo ve poco probable, porque cree que en general domina el ataque.</p>";
        }
        cards[k].className = "w-card " + cls;
        fbs[k].innerHTML = "<strong>" + esc(head) + "</strong>" + esc(e.why) + extra;
      });
      note.textContent = "Aciertos: " + good + " de " + ESC.length +
        (alts ? " (" + alts + " con una alternativa válida)" : "") + (none ? ". Sin responder: " + none : "") +
        ". Ningún régimen cubre todos los riesgos; el libro advierte de que cada propuesta exige superar retos serios.";
    }

    function reset() {
      for (i = 0; i < ESC.length; i++) { sels[i].value = ""; clearOne(i); }
      note.textContent = "";
    }

    vs.forEach(function (s) { s.addEventListener("change", draw); });
    $("def").addEventListener("click", function () {
      setWorld({ dom: "mil", atk: true, ver: false, cat: true, prod: false, gan: true }); draw();
    });
    sels.forEach(function (s, k) { s.addEventListener("change", function () { clearOne(k); note.textContent = ""; }); });
    $("go").addEventListener("click", check);
    $("re").addEventListener("click", reset);
    setWorld({ dom: "mil", atk: true, ver: false, cat: true, prod: false, gan: true });
    draw();
  };
})();
