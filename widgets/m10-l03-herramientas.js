/* Simulador "m10-l03-herramientas": empareja problemas de riesgo de IA (ejemplos propios, sanitarios) con las
   herramientas de política nacional del libro (Hendrycks, sección 8.5, pp. 472 a 480). Al comprobar, explica cada
   emparejamiento con la ventaja y el límite de la herramienta. Sin dependencias. Estilos con las variables del CSS
   del Atlas. Accesible por teclado (select nativos). */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var HER = [
    { id: "normas", n: "Normas de seguridad", src: "Libro 8.5.1, pp. 472 y 473",
      ventaja: "Fijan la buena práctica y pueden ganar fuerza: moldean lo esperable, se hacen obligatorias si una ley las incorpora o se premian, por ejemplo, en contratos públicos.",
      limite: "No obligan por sí mismas, y quien las redacta puede sobrerrepresentar a la industria." },
    { id: "regulacion", n: "Regulación obligatoria", src: "Libro 8.5.1, pp. 473 y 474",
      ventaja: "Es vinculante y la concreta una agencia con pericia y velocidad, como la aprobación previa de fármacos.",
      limite: "La agencia puede tener pocos recursos o quedar capturada por el sector regulado." },
    { id: "responsabilidad", n: "Responsabilidad legal", src: "Libro 8.5.2, pp. 474 y 475",
      ventaja: "Hace que el desarrollador pague el daño (internaliza el coste) y da rendición de cuentas sin depender de una agencia.",
      limite: "Su capacidad de pago es finita, llega después del daño y disuade poco a quien no espera causar grandes daños." },
    { id: "impuestos", n: "Impuestos dirigidos", src: "Libro 8.5.3, p. 475",
      ventaja: "Recaudan fondos reservados para prevenir riesgos o atender desastres, y sirven para redistribuir.",
      limite: "No fuerzan la internalización del riesgo, y chocan con el cabildeo y con un largo debate sobre sus efectos económicos." },
    { id: "publica", n: "Propiedad pública", src: "Libro 8.5.4, p. 476",
      ventaja: "El público recibe beneficios y riesgos a la vez (frena el riesgo moral) y el Estado puede controlar la operación y repartir los ingresos.",
      limite: "El libro no desarrolla límites. Lectura propia: exige capacidad técnica del Estado y concentra poder en quien lo dirige." },
    { id: "resiliencia", n: "Resiliencia", src: "Libro 8.5.5, pp. 476 y 477",
      ventaja: "Reduce el daño cuando ocurre y sube el nivel de capacidad necesario para una catástrofe, con lo que compra tiempo.",
      limite: "Una defensa estrecha puede esquivarse por otro flanco; las herramientas son de doble uso y algunas dañan la privacidad." },
    { id: "atras", n: "No quedarse atrás: exportaciones, talento e inteligencia", src: "Libro 8.5.6, pp. 477 y 478",
      ventaja: "Mantiene la competitividad de un país prudente: los controles de exportación de hardware pueden funcionar sin acuerdo global, y la inteligencia evita alarmas y confianzas sin base.",
      limite: "Las políticas adversarias pueden partir de supuestos falsos, provocar contramedidas y tensiones, y la tecnología se difunde igualmente." },
    { id: "infosec", n: "Seguridad de la información", src: "Libro 8.5.7, pp. 478 y 479",
      ventaja: "Protege los pesos del modelo con medidas como el doble factor, el mínimo acceso, las pruebas de penetración y un programa contra amenazas internas.",
      limite: "Quizá no baste contra Estados con muchos recursos, y sin cultura de seguridad las medidas incómodas se saltan." }
  ];

  var ESC = [
    { t: "Cada hospital valida los modelos de detección de sepsis con su propio método. Los resultados no se pueden comparar y a los proveedores prudentes no les compensa validar mejor.",
      ok: "normas", alt: ["regulacion"],
      why: "Falta un listón común de buena práctica, y una norma de validación lo describe y se puede exigir después en contratos públicos. Una regulación también valdría si el Estado quisiera obligar desde ya, pero es un paso más." },
    { t: "Un proveedor lanza un modelo de apoyo al diagnóstico sin pruebas independientes y varios hospitales ya lo usan. Las recomendaciones voluntarias no le han hecho cambiar.",
      ok: "regulacion", alt: ["normas"],
      why: "Hace falta una exigencia vinculante, como la aprobación previa que el libro cita para los fármacos. Una norma valdría si una ley la incorporase por referencia, y en ese caso el cumplimiento dejaría de ser voluntario." },
    { t: "Un modelo de triaje diseñado con negligencia ha perjudicado a cientos de pacientes. La agencia competente tiene poca plantilla y no ha actuado.",
      ok: "responsabilidad", alt: [],
      why: "Es justo el caso que el libro da a la responsabilidad legal: hace pagar al causante y rinde cuentas sin depender de una agencia débil o capturada. Sirve para daños de este tamaño; su límite aparecería si el daño fuera enorme." },
    { t: "La automatización de tareas administrativas recorta cotizaciones y el Estado prevé necesitar un fondo estable para prevenir y atender los daños de la IA.",
      ok: "impuestos", alt: [],
      why: "El libro presenta los impuestos dirigidos como fuente de ingresos reservados para prevenir o socorrer, y menciona su sesgo actual a favor del capital frente al trabajo. Su límite: no obligan a nadie a internalizar el riesgo y chocan con el cabildeo." },
    { t: "Un país teme que el sistema de IA que sostiene la historia clínica de toda la población, esencial y de uso diario, quede en manos privadas: los beneficios serían privados y los riesgos, de todos.",
      ok: "publica", alt: ["regulacion"],
      why: "Es la lógica de la propiedad pública del libro: que quien recibe los beneficios asuma también los riesgos, como en los servicios públicos con economías de escala. Regular al operador privado sería la alternativa más suave. Los límites de la propiedad pública son lectura propia." },
    { t: "Bandas criminales lanzan secuestros de datos contra redes hospitalarias. No hay un modelo concreto al que culpar y se busca aguantar el golpe cuando llegue.",
      ok: "resiliencia", alt: [],
      why: "Es un caso de ciberseguridad como resiliencia: financiar defensas, colaborar con el sector y exigir prácticas a los dueños de infraestructuras. Su límite: defender un flanco puede desplazar el ataque. La seguridad de la información del libro no encaja aquí: protege los pesos del modelo, no las redes de un hospital." },
    { t: "Un país quiere frenar el acceso de un competidor poco cauteloso al hardware especializado para entrenar modelos, sin esperar a un acuerdo internacional.",
      ok: "atras", alt: [],
      why: "El libro señala los controles de exportación entre las herramientas para no quedarse atrás: fabricar ese hardware es muy complejo y la cadena está muy concentrada. Su límite: el enfoque adversario puede provocar contramedidas y tensiones. La cooperación internacional se trata en la lección siguiente." },
    { t: "Un laboratorio nacional descubre que un empleado sobornado pudo copiar los pesos de su modelo más potente.",
      ok: "infosec", alt: [],
      why: "Es un vector de ataque del libro (sobornos e infiltrados). La respuesta es la seguridad de la información: limitar el acceso, un programa contra amenazas internas y una cultura de seguridad. Su límite: puede no bastar frente a Estados con muchos recursos." }
  ];

  function injectStyle() {
    if (document.getElementById("w-hn-style")) return;
    var st = document.createElement("style");
    st.id = "w-hn-style";
    st.textContent = [
      ".w-hn{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-hn h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-hn .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-hn details{margin:0 0 .9rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-hn summary{cursor:pointer;padding:.5rem .7rem;font:600 .82rem var(--cond)}",
      ".w-hn dl.w-leg{display:grid;gap:1px;background:var(--rule);margin:0;border-top:1px solid var(--rule)}",
      ".w-hn dl.w-leg > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-hn dl.w-leg dt{font:600 .9rem/1.3 var(--cond);color:var(--accent-ink);margin:0 0 .1rem}",
      ".w-hn dl.w-leg dt span{font:500 .72rem var(--mono);color:var(--faint);margin-left:.4rem}",
      ".w-hn dl.w-leg dd{margin:0;font-size:.84rem;color:var(--muted)}",
      ".w-hn dl.w-leg dd b{color:var(--ink)}",
      ".w-hn .w-card{border:1px solid var(--rule);border-left-width:4px;border-radius:8px;background:var(--ground);padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-hn .w-card.w-ok{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-hn .w-card.w-bad{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-hn .w-q{display:block;margin:0 0 .4rem;line-height:1.45}",
      ".w-hn .w-q b{font-family:var(--mono);color:var(--accent-ink);margin-right:.3rem}",
      ".w-hn select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .5rem}",
      ".w-hn .w-fb{margin:.5rem 0 0;font-size:.86rem;line-height:1.45}",
      ".w-hn .w-fb:empty{display:none}",
      ".w-hn .w-fb strong{display:block;margin-bottom:.15rem}",
      ".w-hn .w-fb p{margin:.3rem 0 0}",
      ".w-hn .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .6rem}",
      ".w-hn button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-hn button:hover{background:var(--accent-soft)}",
      ".w-hn button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-hn .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-hn .w-note:empty{display:none}",
      ".w-hn .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function her(idh) { var i; for (i = 0; i < HER.length; i++) if (HER[i].id === idh) return HER[i]; return null; }
  function vl(h) { return "<b>Ventaja.</b> " + esc(h.ventaja) + " <b>Límite.</b> " + esc(h.limite); }

  window.WIDGETS["m10-l03-herramientas"] = function (el) {
    injectStyle();
    var id = "w-hn-" + (++uid);
    var i, html = "";

    html += '<div class="w-hn">' +
      '<h4>Problemas y herramientas nacionales</h4>' +
      '<p class="w-hint">Cada problema es un ejemplo propio de riesgo de IA. Elige la herramienta de política nacional que mejor lo ataca. Al comprobar verás por qué, y la ventaja y el límite de la herramienta.</p>' +
      '<details id="' + id + '-leg" open><summary>Las ocho herramientas, con su ventaja y su límite</summary><dl class="w-leg">';
    HER.forEach(function (h) {
      html += '<div><dt>' + esc(h.n) + '<span>' + esc(h.src) + '</span></dt><dd>' + vl(h) + '</dd></div>';
    });
    html += '</dl></details>';
    ESC.forEach(function (e, k) {
      html += '<div class="w-card" id="' + id + '-c' + k + '">' +
        '<label class="w-q" for="' + id + '-s' + k + '"><b>' + (k + 1) + '.</b>' + esc(e.t) + '</label>' +
        '<select id="' + id + '-s' + k + '"><option value="">Elige una herramienta…</option>';
      HER.forEach(function (h) { html += '<option value="' + h.id + '">' + esc(h.n) + '</option>'; });
      html += '</select><div class="w-fb" id="' + id + '-f' + k + '" aria-live="polite"></div></div>';
    });
    html += '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Comprobar</button>' +
      '<button type="button" id="' + id + '-re">Reiniciar</button></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Las ocho herramientas y sus límites son las de la sección 8.5 del libro, salvo los límites de la propiedad pública, que son lectura propia. Los problemas y su emparejamiento con cada herramienta son ejemplos propios: por eso algunos admiten una segunda herramienta válida.</p>' +
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
        var v = sels[k].value, best = her(e.ok), chosen = her(v), head, cls, extra = "";
        if (!v) { head = "Sin responder. La más adecuada es «" + best.n + "»."; cls = "w-bad"; none++; }
        else if (v === e.ok) { head = "Correcto."; cls = "w-ok"; good++; }
        else if (e.alt.indexOf(v) >= 0) { head = "Válida, aunque la más directa es «" + best.n + "»."; cls = "w-ok"; good++; alts++; }
        else { head = "No es la mejor: elegiste «" + chosen.n + "»; la más adecuada es «" + best.n + "»."; cls = "w-bad"; }
        if (v && v !== e.ok) extra = '<p><em>Lo que ofrece «' + esc(chosen.n) + '»:</em> ' + vl(chosen) + '</p>';
        cards[k].className = "w-card " + cls;
        fbs[k].innerHTML = "<strong>" + esc(head) + "</strong>" + esc(e.why) +
          '<p><em>«' + esc(best.n) + '»:</em> ' + vl(best) + '</p>' + extra;
      });
      note.textContent = "Aciertos: " + good + " de " + ESC.length +
        (alts ? " (" + alts + " con una herramienta alternativa válida)" : "") +
        (none ? ". Sin responder: " + none : "") +
        ". Cada herramienta tiene un límite que otra puede cubrir: el libro propone combinarlas.";
    }

    function reset() {
      for (i = 0; i < ESC.length; i++) { sels[i].value = ""; clearOne(i); }
      note.textContent = "";
      $("leg").open = true;
    }

    sels.forEach(function (s, k) {
      s.addEventListener("change", function () { clearOne(k); note.textContent = ""; });
    });
    $("go").addEventListener("click", check);
    $("re").addEventListener("click", reset);
  };
})();
