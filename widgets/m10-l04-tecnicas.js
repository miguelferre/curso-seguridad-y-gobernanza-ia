/* Simulador "m10-l04-tecnicas": clasifica ocho casos en las seis tecnicas de gobernanza internacional que da el
   libro (Hendrycks, seccion 8.6.1, pp. 482 a 484), de la menos a la mas vinculante. Seis casos son del libro y
   dos son ejemplos propios, marcados. Al comprobar explica el caso y lo que significa cada tecnica.
   Sin dependencias. Estilos con las variables del CSS del Atlas. Accesible por teclado (select nativos). */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var TEC = [
    { id: "uni", n: "Compromiso unilateral", src: "p. 482",
      def: "Un solo actor, país o empresa, se compromete respecto a su propia tecnología.",
      fuerza: "No obliga a nadie más, pero cambia las mejores respuestas de los demás, genera confianza y da credibilidad para pedir acuerdos más amplios." },
    { id: "norm", n: "Normas y estándares", src: "p. 483",
      def: "Expectativas compartidas de conducta (normas) y buenas prácticas técnicas (estándares).",
      fuerza: "Sin coerción formal. Aun así orientan la conducta y facilitan pactos posteriores al alinear expectativas." },
    { id: "conv", n: "Conversaciones bilaterales o multilaterales", src: "p. 483",
      def: "Dos o más países negocian directamente un asunto.",
      fuerza: "No vinculantes por sí mismas. Dan confianza entre rivales y preparan acuerdos." },
    { id: "cumb", n: "Cumbres y foros", src: "p. 483",
      def: "Encuentros con actores diversos, como Estados, empresas y sociedad civil, para debatir y anunciar iniciativas.",
      fuerza: "Dan visibilidad, fijan hitos y movilizan presión pública, sin obligar." },
    { id: "org", n: "Organizaciones de gobernanza", src: "p. 483",
      def: "Instituciones internacionales con expertos y recursos que proponen principios y modelos y ayudan a aplicarlos.",
      fuerza: "En gran parte voluntarias, pero con autoridad delegada por sus miembros y continuidad entre cumbres." },
    { id: "trat", n: "Tratados", src: "pp. 483 y 484",
      def: "Acuerdos entre Estados con obligaciones exigibles.",
      fuerza: "La forma más fuerte: obligaciones con posible castigo e inspecciones. Cuesta pactar reglas exigibles entre rivales y verificar su cumplimiento." }
  ];

  var CAS = [
    { t: "En 1969, un presidente pone fin al programa de armas biológicas de su país y despide a sus científicos.",
      o: "Ejemplo del libro", ok: "uni",
      why: "Lo decide un solo actor sobre su propia tecnología. El libro lo presenta como pieza clave para que se llegara a la Convención sobre armas biológicas de 1972." },
    { t: "Ningún país quiere ser el primero en usar armas nucleares y todos esperan lo mismo de los demás, aunque ninguna ley lo impone.",
      o: "Ejemplo del libro", ok: "norm",
      why: "Es una expectativa compartida de conducta, la norma de «no primer uso». Orienta la conducta sin coerción formal." },
    { t: "Durante la Guerra Fría, dos potencias se sientan a negociar el tamaño y la composición de sus arsenales.",
      o: "Ejemplo del libro", ok: "conv",
      why: "Es una negociación directa entre rivales. Da confianza y prepara acuerdos, pero la conversación en sí no obliga." },
    { t: "Gobiernos, empresas y organizaciones civiles se reúnen, anuncian objetivos comunes sobre emisiones y la opinión pública presiona para cumplirlos.",
      o: "Ejemplo del libro", ok: "cumb",
      why: "Reúne a actores diversos, da visibilidad al asunto y fija hitos. Es el rasgo de las cumbres y los foros: movilizar presión, no obligar." },
    { t: "Una institución con expertos propone un paradigma de inspección y verificación para la tecnología nuclear y ofrece un foro neutral para pactar.",
      o: "Ejemplo del libro (el OIEA)", ok: "org",
      why: "Es una organización permanente con pericia, que propone modelos y ayuda a aplicarlos. Su autoridad viene de que sus miembros le delegan parte de la suya." },
    { t: "En 1968, los Estados firman un acuerdo para frenar la difusión de las armas nucleares, con inspecciones para comprobar que se cumple.",
      o: "Ejemplo del libro (el Tratado de No Proliferación)", ok: "trat",
      why: "Crea obligaciones exigibles entre Estados, con mecanismos como las inspecciones. Es la técnica más fuerte, aunque pactarla y verificarla es difícil." },
    { t: "Un fabricante de modelos clínicos anuncia públicamente que no venderá su sistema de predicción para vigilar a pacientes sin su consentimiento.",
      o: "Ejemplo propio", ok: "uni",
      why: "Se ata a sí misma una empresa, sin obligar a las demás. Puede cambiar lo que esperan los clientes y dar credibilidad para pedir reglas comunes." },
    { t: "Varias sociedades médicas de distintos países publican una guía técnica para validar modelos de detección de sepsis. Nadie está obligado a seguirla.",
      o: "Ejemplo propio", ok: "norm",
      why: "Es un estándar técnico surgido de una comunidad de expertos. Sin coerción formal, puede acabar incorporado en leyes o exigido en contratos, como vimos en la lección de gobernanza nacional." }
  ];

  function injectStyle() {
    if (document.getElementById("w-tc-style")) return;
    var st = document.createElement("style");
    st.id = "w-tc-style";
    st.textContent = [
      ".w-tc{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-tc h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-tc .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-tc details{margin:0 0 .9rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-tc summary{cursor:pointer;padding:.5rem .7rem;font:600 .82rem var(--cond)}",
      ".w-tc ol.w-leg{list-style:none;counter-reset:t;display:grid;gap:1px;background:var(--rule);margin:0;padding:0;border-top:1px solid var(--rule)}",
      ".w-tc ol.w-leg > li{counter-increment:t;background:var(--ground);padding:.5rem .7rem .5rem 2.2rem;position:relative;font-size:.84rem;color:var(--muted)}",
      ".w-tc ol.w-leg > li::before{content:counter(t);position:absolute;left:.7rem;top:.5rem;font:700 .85rem var(--mono);color:var(--accent-ink)}",
      ".w-tc ol.w-leg b{display:block;font:600 .9rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-tc ol.w-leg b span{font:500 .72rem var(--mono);color:var(--faint);margin-left:.4rem}",
      ".w-tc ol.w-leg em{font-style:normal;color:var(--ink)}",
      ".w-tc .w-card{border:1px solid var(--rule);border-left-width:4px;border-radius:8px;background:var(--ground);padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-tc .w-card.w-ok{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-tc .w-card.w-bad{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-tc .w-q{display:block;margin:0 0 .4rem;line-height:1.45}",
      ".w-tc .w-q b{font-family:var(--mono);color:var(--accent-ink);margin-right:.3rem}",
      ".w-tc .w-q i{display:block;font-style:normal;font:500 .72rem var(--mono);color:var(--faint);margin-top:.2rem}",
      ".w-tc select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .5rem}",
      ".w-tc .w-fb{margin:.5rem 0 0;font-size:.86rem;line-height:1.45}",
      ".w-tc .w-fb:empty{display:none}",
      ".w-tc .w-fb strong{display:block;margin-bottom:.15rem}",
      ".w-tc .w-fb p{margin:.3rem 0 0}",
      ".w-tc .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .6rem}",
      ".w-tc button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-tc button:hover{background:var(--accent-soft)}",
      ".w-tc button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-tc .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-tc .w-note:empty{display:none}",
      ".w-tc .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function tec(idt) { var i; for (i = 0; i < TEC.length; i++) if (TEC[i].id === idt) return TEC[i]; return null; }
  function pos(idt) { var i; for (i = 0; i < TEC.length; i++) if (TEC[i].id === idt) return i + 1; return 0; }

  window.WIDGETS["m10-l04-tecnicas"] = function (el) {
    injectStyle();
    var id = "w-tc-" + (++uid);
    var i, html = "";

    html += '<div class="w-tc"><h4>Seis técnicas de gobernanza internacional</h4>' +
      '<p class="w-hint">Cada caso corresponde a una de las seis técnicas. Elige cuál es. Al comprobar verás por qué y cuánta fuerza tiene.</p>' +
      '<details open><summary>Las seis técnicas, ordenadas de menos a más vinculante</summary><ol class="w-leg">';
    TEC.forEach(function (t) {
      html += '<li><b>' + esc(t.n) + '<span>Libro, ' + esc(t.src) + '</span></b>' + esc(t.def) + ' <em>' + esc(t.fuerza) + '</em></li>';
    });
    html += '</ol></details>';
    CAS.forEach(function (c, k) {
      html += '<div class="w-card" id="' + id + '-c' + k + '">' +
        '<label class="w-q" for="' + id + '-s' + k + '"><b>' + (k + 1) + '.</b>' + esc(c.t) + '<i>' + esc(c.o) + '</i></label>' +
        '<select id="' + id + '-s' + k + '"><option value="">Elige una técnica…</option>';
      TEC.forEach(function (t) { html += '<option value="' + t.id + '">' + esc(t.n) + '</option>'; });
      html += '</select><div class="w-fb" id="' + id + '-f' + k + '" aria-live="polite"></div></div>';
    });
    html += '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Comprobar</button>' +
      '<button type="button" id="' + id + '-re">Reiniciar</button></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Las seis técnicas y seis de los casos son de la sección 8.6.1 del libro. Los dos casos marcados como propios son ejemplos añadidos.</p></div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var sels = [], cards = [], fbs = [], note = $("note");
    for (i = 0; i < CAS.length; i++) { sels.push($("s" + i)); cards.push($("c" + i)); fbs.push($("f" + i)); }

    function clearOne(k) { cards[k].className = "w-card"; fbs[k].innerHTML = ""; }

    function check() {
      var good = 0, none = 0;
      CAS.forEach(function (c, k) {
        var v = sels[k].value, best = tec(c.ok), chosen = tec(v), head, cls, extra = "";
        if (!v) { head = "Sin responder. Es «" + best.n + "»."; cls = "w-bad"; none++; }
        else if (v === c.ok) { head = "Correcto: " + best.n + "."; cls = "w-ok"; good++; }
        else {
          head = "No es esa: elegiste «" + chosen.n + "» y es «" + best.n + "».";
          cls = "w-bad";
          extra = "<p><em>«" + esc(chosen.n) + "»:</em> " + esc(chosen.def) + " " + esc(chosen.fuerza) + "</p>";
        }
        cards[k].className = "w-card " + cls;
        fbs[k].innerHTML = "<strong>" + esc(head) + "</strong>" + esc(c.why) +
          "<p><em>Fuerza (posición " + pos(c.ok) + " de 6):</em> " + esc(best.fuerza) + "</p>" + extra;
      });
      note.textContent = "Aciertos: " + good + " de " + CAS.length + (none ? ". Sin responder: " + none : "") +
        ". Las técnicas se combinan: según el libro, un compromiso unilateral o unas conversaciones regulares pueden preparar el terreno para acuerdos más amplios.";
    }

    function reset() {
      for (i = 0; i < CAS.length; i++) { sels[i].value = ""; clearOne(i); }
      note.textContent = "";
    }

    sels.forEach(function (s, k) { s.addEventListener("change", function () { clearOne(k); note.textContent = ""; }); });
    $("go").addEventListener("click", check);
    $("re").addEventListener("click", reset);
  };
})();
