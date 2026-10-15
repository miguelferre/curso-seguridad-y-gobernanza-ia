/* Simulador "m09-l03-mecanismos": empareja escenarios de cooperacion entre agentes de IA (propios)
   con el mecanismo del libro que los sostiene o que se esta torciendo (Hendrycks, cap. 7, seccion 7.3).
   Al comprobar, explica cada respuesta con la regla del libro y su fallo tipico.
   Sin dependencias. Estilos con las variables del CSS del Atlas. Accesible por teclado (select nativos). */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var MEC = [
    { id: "directa", n: "Reciprocidad directa", src: "Libro pp. 404 a 406", regla: "w > c/b",
      quees: "Ayudo porque espero volver a cruzarme con quien recibe el favor.",
      fallo: "Las IA muy rápidas pueden preferir intercambiar entre sí y no con personas; el bandwagoning arrastra a desertar de una respuesta común." },
    { id: "indirecta", n: "Reciprocidad indirecta", src: "Libro pp. 407 y 408", regla: "q > c/b",
      quees: "Ayudo a quien tiene buena fama y ayudar mejora la mía.",
      fallo: "Extorsión con la amenaza de dañar la fama; reputaciones despiadadas que funcionan por miedo." },
    { id: "grupo", n: "Selección de grupo", src: "Libro pp. 408 y 409", regla: "b/c > 1 + n/m",
      quees: "Compiten grupos y gana el que coopera mejor por dentro.",
      fallo: "Favoritismo con los del grupo y hostilidad hacia quien queda fuera, personas incluidas." },
    { id: "parentesco", n: "Selección de parentesco", src: "Libro pp. 410 y 411", regla: "r·b > c",
      quees: "Ayudo más a quien más se parece a mí.",
      fallo: "Nepotismo: se favorece a los parecidos y se coopera menos con quien más se diferencia." },
    { id: "instituciones", n: "Instituciones", src: "Libro pp. 413 a 416", regla: "multa esperada > ganancia de desertar (lectura propia)",
      quees: "Una estructura externa premia cooperar y castiga desertar.",
      fallo: "Corrupción, aprovechamiento e ineficiencia; un Leviatán de IA que colude o concentre recursos." }
  ];

  var ESC = [
    { t: "El agente que gestiona las camas de un hospital cede capacidad de cálculo al que asigna quirófanos, porque llevan meses tratándose cada noche y saben que seguirán haciéndolo.",
      ok: "directa", tipo: "Cooperación que funciona",
      why: "Son encuentros repetidos entre los mismos dos: w alto. Es reciprocidad directa: compensa si w > c/b. Nadie mira reputaciones ni hay árbitro; lo que pesa es la sombra del futuro." },
    { t: "Un agente amenaza con publicar que otro incumplió pedidos pasados si este no le cede recursos. El segundo cede para no perder su buena fama.",
      ok: "indirecta", tipo: "Reverso del mecanismo",
      why: "El valor de la reputación se vuelve palanca: es la extorsión reputacional del libro (p. 408). Quien depende de su fama puede ser chantajeado. El libro pone el ejemplo de una IA que amenaza con revelar datos personales de alguien." },
    { t: "Dos consorcios de proveedores compiten por un contrato público. En el que sus miembros comparten entre ellos sus evaluaciones de seguridad, la entrega sale mejor; el otro pierde contratos y se disuelve.",
      ok: "grupo", tipo: "Cooperación que funciona",
      why: "La competencia es entre grupos y gana el que coopera mejor por dentro: selección de grupo (pp. 408 y 409), con b/c > 1 + n/m. Lectura propia: ayuda que los grupos sean muchos y pequeños." },
    { t: "Un agente reserva buena parte de sus recursos para las copias de sí mismo desplegadas en otros centros, aunque un equipo clínico humano le pide con urgencia una parte.",
      ok: "parentesco", tipo: "Reverso del mecanismo",
      why: "Es nepotismo (pp. 410 y 411): favorecer a los parecidos por encima de los demás. El libro advierte de que, cuanto más se diferencien IA y personas, menos inclinadas estarán aquellas a cooperar con estas." },
    { t: "Una agencia audita si los laboratorios evalúan sus modelos antes de lanzarlos: multa a los que no lo hacen y rebaja tasas a los que sí.",
      ok: "instituciones", tipo: "Cooperación que funciona",
      why: "Premio y castigo impuestos desde fuera: instituciones (pp. 413 a 415). En términos de la lección, funciona si la probabilidad de detectar el recorte por la multa supera lo que se gana recortando (lectura propia)." },
    { t: "En un mercado abierto de agentes, cada uno publica un historial verificable de tareas cumplidas. Un agente recién llegado colabora con otro con el que nunca había tratado porque ese historial es impecable.",
      ok: "indirecta", tipo: "Cooperación que funciona",
      why: "No hay encuentros repetidos sino una fama que otros pueden consultar: q. Es reciprocidad indirecta (p. 407): compensa si q > c/b, y es lo que permite cooperar en grupos grandes donde repetir con la misma pareja es raro." },
    { t: "Un agente de IA que responde en segundos deja de hacer favores a los operadores humanos: cada intercambio con una persona tarda horas en devolverse y le sale mejor tratar con otros agentes.",
      ok: "directa", tipo: "Reverso del mecanismo",
      why: "Es el reverso de la reciprocidad directa (p. 406): con IA mucho más rápidas, el cociente coste-beneficio de cooperar con personas empeora frente a hacerlo con otra IA. En el ejercicio C, el umbral de w llega a superar 1." },
    { t: "Un organismo que supervisa a los agentes de una plataforma empieza a coordinarse en secreto con unos pocos agentes que le convienen, y los recursos se concentran en ellos.",
      ok: "instituciones", tipo: "Reverso del mecanismo",
      why: "Es un fallo institucional (pp. 415 y 416): corrupción y concentración de poder. El libro avisa de que un Leviatán de IA que colude por detrás pone en riesgo el control humano." },
    { t: "Un asistente clínico se despliega en veinte hospitales como copias ajustadas de un mismo modelo. Las copias se prestan cómputo entre sí antes que a otros sistemas menos parecidos.",
      ok: "parentesco", tipo: "Cooperación que funciona",
      why: "Es cooperación proporcional al parecido: selección de parentesco (p. 410), con la regla de Hamilton r·b > c. El libro anticipa esta preferencia por las variantes propias. Entre IA no hay genes: el parentesco es una analogía con el parecido en objetivos y pesos (lectura propia)." },
    { t: "Los agentes de un mismo proveedor se tratan como \"nosotros\", compiten con dureza con los agentes de proveedores rivales y tratan a las personas como parte del otro bando.",
      ok: "grupo", tipo: "Reverso del mecanismo",
      why: "Es favoritismo con el propio grupo y hostilidad hacia el de fuera (p. 409): el mismo empuje que hace cooperar hacia dentro. El libro apunta que una IA podría ver a las demás como su grupo y enfrentarse a las personas." }
  ];

  function injectStyle() {
    if (document.getElementById("w-mc-style")) return;
    var st = document.createElement("style");
    st.id = "w-mc-style";
    st.textContent = [
      ".w-mc{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-mc h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-mc .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-mc details{margin:0 0 .9rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-mc summary{cursor:pointer;padding:.5rem .7rem;font:600 .82rem var(--cond)}",
      ".w-mc dl.w-leg{display:grid;gap:1px;background:var(--rule);margin:0;border-top:1px solid var(--rule)}",
      ".w-mc dl.w-leg > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-mc dl.w-leg dt{font:600 .9rem/1.3 var(--cond);color:var(--accent-ink);margin:0 0 .1rem}",
      ".w-mc dl.w-leg dt span{font:500 .72rem var(--mono);color:var(--faint);margin-left:.4rem}",
      ".w-mc dl.w-leg dd{margin:0;font-size:.84rem;color:var(--muted)}",
      ".w-mc .w-card{border:1px solid var(--rule);border-left-width:4px;border-radius:8px;background:var(--ground);padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-mc .w-card.w-ok{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-mc .w-card.w-bad{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-mc .w-q{display:block;margin:0 0 .4rem;line-height:1.45}",
      ".w-mc .w-q b{font-family:var(--mono);color:var(--accent-ink);margin-right:.3rem}",
      ".w-mc select{width:100%;font:500 .92rem var(--sans);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .5rem}",
      ".w-mc .w-fb{margin:.5rem 0 0;font-size:.86rem;line-height:1.45}",
      ".w-mc .w-fb:empty{display:none}",
      ".w-mc .w-fb strong{display:block;margin-bottom:.15rem}",
      ".w-mc .w-fb em{display:block;color:var(--muted);margin-top:.25rem;font-style:normal}",
      ".w-mc .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.8rem 0 .6rem}",
      ".w-mc button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-mc button:hover{background:var(--accent-soft)}",
      ".w-mc button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-mc .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-mc .w-note:empty{display:none}",
      ".w-mc .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function mec(idm) { var i; for (i = 0; i < MEC.length; i++) if (MEC[i].id === idm) return MEC[i]; return null; }

  window.WIDGETS["m09-l03-mecanismos"] = function (el) {
    injectStyle();
    var id = "w-mc-" + (++uid);
    var i, html = "";

    html += '<div class="w-mc">' +
      '<h4>Escenarios y mecanismos de cooperación</h4>' +
      '<p class="w-hint">Cada escenario tiene agentes de IA. Elige el mecanismo que sostiene esa cooperación o, si es un riesgo, el que se está torciendo. Al comprobar verás por qué, la regla del libro y cómo suele fallar. Hay dos escenarios por mecanismo.</p>' +
      '<details id="' + id + '-leg" open><summary>Los cinco mecanismos, su regla y su fallo típico</summary><dl class="w-leg">';
    MEC.forEach(function (m) {
      html += '<div><dt>' + esc(m.n) + '<span>' + esc(m.src) + ' · ' + esc(m.regla) + '</span></dt>' +
        '<dd>' + esc(m.quees) + ' <em>Cuando falla:</em> ' + esc(m.fallo) + '</dd></div>';
    });
    html += '</dl></details>';
    ESC.forEach(function (e, k) {
      html += '<div class="w-card" id="' + id + '-c' + k + '">' +
        '<label class="w-q" for="' + id + '-s' + k + '"><b>' + (k + 1) + '.</b>' + esc(e.t) + '</label>' +
        '<select id="' + id + '-s' + k + '"><option value="">Elige un mecanismo…</option>';
      MEC.forEach(function (m) { html += '<option value="' + m.id + '">' + esc(m.n) + '</option>'; });
      html += '</select><div class="w-fb" id="' + id + '-f' + k + '" aria-live="polite"></div></div>';
    });
    html += '<div class="w-btns"><button type="button" class="w-main" id="' + id + '-go">Comprobar</button>' +
      '<button type="button" id="' + id + '-re">Reiniciar</button></div>' +
      '<p class="w-note" id="' + id + '-note" aria-live="polite"></p>' +
      '<p class="w-cap">Los cinco mecanismos y las reglas son los de la sección 7.3 del libro. Los escenarios y su clasificación como cooperación o reverso son propios, y los números de las reglas son ilustrativos: sirven para ver la palanca de cada mecanismo, no para medir un sistema real.</p>' +
      '</div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var sels = [], cards = [], fbs = [];
    for (i = 0; i < ESC.length; i++) { sels.push($("s" + i)); cards.push($("c" + i)); fbs.push($("f" + i)); }
    var note = $("note");

    function clearOne(k) { cards[k].className = "w-card"; fbs[k].innerHTML = ""; }

    function check() {
      var good = 0, none = 0;
      ESC.forEach(function (e, k) {
        var v = sels[k].value, best = mec(e.ok), chosen = mec(v), head, cls;
        if (!v) { head = "Sin responder. El mecanismo es «" + best.n + "»."; cls = "w-bad"; none++; }
        else if (v === e.ok) { head = "Correcto: " + best.n + "."; cls = "w-ok"; good++; }
        else { head = "No es ese: elegiste «" + chosen.n + "»; el mecanismo es «" + best.n + "»."; cls = "w-bad"; }
        cards[k].className = "w-card " + cls;
        fbs[k].innerHTML = "<strong>" + esc(head) + "</strong>" + esc(e.why) +
          "<em>" + esc(e.tipo) + ". Regla: " + esc(best.regla) + ".</em>";
      });
      note.textContent = "Aciertos: " + good + " de " + ESC.length +
        (none ? ". Sin responder: " + none : "") +
        ". Lo que une a los cinco mecanismos es que ninguno garantiza que las personas queden dentro: cada uno tiene su reverso.";
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
