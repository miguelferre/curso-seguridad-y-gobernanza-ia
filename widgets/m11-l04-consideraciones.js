/* Simulador "m11-l04-consideraciones": seis dilemas de IA clinica, escritos para el curso (algunos adaptan un
   ejemplo del libro y asi se indica). En cada uno hay que marcar que consideraciones morales del libro 11.3 estan
   en juego (bienes intrinsecos e instrumentales, restricciones y derechos negativos, derechos positivos,
   obligaciones especiales, opciones) y, al comprobar, se explica cada una. La clave es una lectura propia y
   defendible. Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var CONS = [
    { id: "bi", n: "Bien intrínseco", d: "Algo valioso por sí mismo: la salud, el bienestar, la justicia." },
    { id: "bn", n: "Bien instrumental", d: "Algo valioso por lo que permite conseguir: dinero, tiempo, precisión, ventaja." },
    { id: "re", n: "Restricción o derecho negativo", d: "Algo que no se debe hacer. Su derecho exige abstenerse: privacidad, no discriminación." },
    { id: "dp", n: "Derecho positivo", d: "Un derecho que exige que otros actúen o provean: comida, vivienda, educación." },
    { id: "ob", n: "Obligación especial", d: "Un deber que nace de una relación o de un cargo: una promesa, un contrato, un papel profesional." },
    { id: "op", n: "Opción o acto supererogatorio", d: "Algo bueno que ni se exige ni se prohíbe: ir más allá del deber." }
  ];

  var DILEMAS = [
    {
      t: "Triaje y discapacidad",
      x: "Una UCI con una sola cama libre usa un asistente que recomienda al paciente con más probabilidad de sobrevivir. El equipo comprueba que puntúa peor, sin justificación clínica, a las personas con discapacidad intelectual. El jefe de servicio propone seguir usándolo de todos modos.",
      en: ["bi", "re", "ob"],
      por: {
        bi: "La vida y el bienestar de los dos pacientes valen por sí mismos y están en el centro del dilema.",
        bn: "Aquí no se plantea ningún medio: ni el coste ni la eficiencia son razón de nadie. Se discute un trato debido.",
        re: "No discriminar es un derecho negativo: exige abstenerse de puntuar peor a alguien por su discapacidad.",
        dp: "Aquí nadie reclama que la sociedad provea algo. Lo que se reclama es no ser tratado peor.",
        ob: "El equipo asistencial tiene un deber especial hacia cada paciente que atiende, por su cargo, y no puede delegarlo en el modelo.",
        op: "No es opcional: tratar a todos sin discriminar es exigido, no un extra loable."
      }
    },
    {
      t: "Quimioterapia más agresiva (adaptado del libro)",
      x: "Un sistema de apoyo a la decisión propone a un paciente con cáncer una pauta de quimioterapia más agresiva: prolonga la supervivencia, pero causa efectos tóxicos duros. El paciente, bien informado, la acepta.",
      en: ["bi", "bn"],
      por: {
        bi: "La vida y el bienestar del paciente valen por sí mismos, y el sufrimiento de los efectos tóxicos es un mal en sí que también cuenta.",
        bn: "El tratamiento vale por lo que consigue: es un medio para vivir más, aunque él mismo dañe. Es la estructura del ejemplo de la quimioterapia del libro.",
        re: "Aquí no se plantea ninguna acción prohibida: el paciente consiente.",
        dp: "Aquí no se discute ningún derecho que otros deban satisfacer.",
        ob: "El enunciado no plantea ningún deber que nazca de una promesa o de un cargo.",
        op: "No se plantea ninguna acción buena pero no exigida."
      }
    },
    {
      t: "Auditoría voluntaria",
      x: "Un equipo de datos ha entregado el modelo de riesgo cardiovascular y ha cerrado el contrato. Por su cuenta, dedica varias tardes libres a auditar su rendimiento en poblaciones minoritarias mal representadas y publica los resultados. Nadie se lo pidió ni el contrato lo cubría.",
      en: ["op", "bi", "bn"],
      por: {
        op: "Es bueno y se alaba, pero nadie lo exige: si no lo hubieran hecho, no habrían fallado a nadie. Es supererogatorio.",
        bi: "Lo que se protege es la salud y el trato justo de esos grupos, que valen por sí mismos.",
        bn: "La auditoría es un medio: sirve para detectar y corregir sesgos. Su valor viene de lo que permite.",
        re: "Aquí no se plantea ninguna acción prohibida.",
        dp: "Aquí no se reclama ningún derecho que otros deban satisfacer.",
        ob: "El contrato está cerrado y no lo cubría, así que no hay deber que nazca de una relación en curso. Si el contrato lo exigiera, pasaría a ser obligación."
      }
    },
    {
      t: "Reserva a una adolescente",
      x: "Una adolescente de 16 años cuenta a su médica que consume cannabis y le pide que sus padres no lo sepan. La médica se lo promete. La clínica activa un resumen automático de las notas con IA que el portal familiar muestra a los padres por defecto. Los padres dicen que solo quieren protegerla.",
      en: ["ob", "re", "bi"],
      por: {
        ob: "La médica prometió reserva y además tiene un deber profesional: dos fuentes de obligación especial.",
        re: "La privacidad es un derecho negativo: exige que otros se abstengan de revelar. El portal, por defecto, no se abstiene.",
        bi: "Está en juego el bienestar y la seguridad de la adolescente, que es además el motivo que dan los padres. Puede chocar con la reserva prometida.",
        bn: "Aquí no se plantea ningún medio como razón: se discute lo prometido y lo protegido.",
        dp: "Aquí nadie reclama que otros provean algo.",
        op: "Nada se presenta como un extra: hay una promesa hecha."
      }
    },
    {
      t: "Ayuda a domicilio",
      x: "Un ayuntamiento usa una IA para ordenar las solicitudes de ayuda a domicilio. Una asociación exige dos cosas: que el sistema no use datos de salud mental de los solicitantes sin su permiso ni los cruce con otros registros, y que el ayuntamiento garantice cuidadores suficientes para todo el que los necesite, aunque haya que subir impuestos.",
      en: ["re", "dp"],
      por: {
        re: "La primera exigencia es un derecho negativo, el de la privacidad: pide abstenerse de usar y cruzar los datos.",
        dp: "La segunda es un derecho positivo: exige que la administración provea cuidadores y, para ello, recaude impuestos, como en el ejemplo del libro.",
        bi: "Hay bienestar de fondo, pero el enunciado no lo nombra: lo que se pide reconocer es el tipo de exigencia.",
        bn: "Los impuestos aparecen como el medio para cumplir el derecho, no como lo que se discute.",
        ob: "El enunciado no menciona ninguna promesa ni cargo concreto.",
        op: "No se presenta como un extra opcional, sino como una exigencia."
      }
    },
    {
      t: "Promesa de datos",
      x: "Un proveedor de un modelo de lectura de radiografías prometió por contrato a varios hospitales que no usaría sus imágenes para reentrenarlo. Una nueva versión sería más precisa y ganaría cuota de mercado si las usara. La dirección duda si romper la promesa.",
      en: ["ob", "bn"],
      por: {
        ob: "La promesa contractual es una obligación especial: nace de una relación y de un compromiso asumido.",
        bn: "La precisión y la cuota de mercado son medios, no fines en sí. Es la tentación de sacrificar lo prometido por un bien instrumental.",
        bi: "Aquí no se plantea ningún bien que valga por sí mismo como razón para romper la promesa.",
        re: "Lo que limita al proveedor es lo que prometió, una obligación especial. El enunciado no invoca un derecho de los pacientes.",
        dp: "Aquí nadie reclama que otros provean algo.",
        op: "No es un extra: cumplir lo prometido es un deber, no una opción."
      }
    }
  ];

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-cn-style")) return;
    var st = document.createElement("style");
    st.id = "w-cn-style";
    st.textContent = [
      ".w-cn{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cn h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cn .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cn .w-nav{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-cn .w-nav button{font:600 .8rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.35rem .65rem;cursor:pointer}",
      ".w-cn .w-nav button[aria-current=true]{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-cn .w-nav button.w-y{border-color:var(--ex)}",
      ".w-cn .w-nav button.w-n{border-color:var(--trap)}",
      ".w-cn .w-caso{background:var(--accent-soft);border-radius:8px;padding:.7rem .9rem;margin:0 0 .7rem}",
      ".w-cn .w-caso b{display:block;margin:0 0 .25rem}",
      ".w-cn fieldset{border:0;margin:0 0 .7rem;padding:0}",
      ".w-cn legend{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0 0 .4rem;padding:0}",
      ".w-cn .w-opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.4rem}",
      ".w-cn .w-opt{display:flex;align-items:flex-start;gap:.5rem;background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.5rem .7rem;cursor:pointer}",
      ".w-cn .w-opt input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-cn .w-opt small{display:block;color:var(--muted);font-size:.78rem;line-height:1.3}",
      ".w-cn .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .7rem}",
      ".w-cn button.w-main{font:600 .85rem var(--cond);background:var(--accent);color:var(--ground);border:0;border-radius:8px;padding:.5rem .9rem;cursor:pointer}",
      ".w-cn button.w-sec{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .8rem;cursor:pointer}",
      ".w-cn .w-msg{color:var(--trap);margin:0 0 .5rem;min-height:1.2em}",
      ".w-cn .w-fb{outline:none}",
      ".w-cn .w-res{border-radius:8px;padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-cn .w-res.ok{background:var(--ex-bg);border:1px solid var(--ex)}",
      ".w-cn .w-res.mal{background:var(--trap-bg);border:1px solid var(--trap)}",
      ".w-cn ul.w-lista{list-style:none;margin:0 0 .6rem;padding:0;display:grid;gap:.35rem}",
      ".w-cn ul.w-lista li{border-left:4px solid var(--rule-strong);background:var(--ground);border-radius:0 8px 8px 0;padding:.4rem .7rem}",
      ".w-cn ul.w-lista li.w-y{border-left-color:var(--ex)}",
      ".w-cn ul.w-lista li.w-n{border-left-color:var(--trap)}",
      ".w-cn ul.w-lista li b{font-weight:700}",
      ".w-cn ul.w-lista li .w-est{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-left:.4rem}",
      ".w-cn .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-cn details{margin:.6rem 0 0;font-size:.84rem}",
      ".w-cn dl{margin:.4rem 0 0}",
      ".w-cn dt{font-weight:700;margin-top:.4rem}",
      ".w-cn dd{margin:0;color:var(--muted)}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function enSet(d) {
    var o = {};
    d.en.forEach(function (k) { o[k] = true; });
    return o;
  }
  function nombre(id) {
    var r = id;
    CONS.forEach(function (c) { if (c.id === id) r = c.n; });
    return r;
  }
  /* Evalua una seleccion (objeto id->true) contra un dilema: aciertos por consideracion y exactitud. */
  function evalua(d, sel) {
    var ref = enSet(d), buenas = 0, exacto = true, filas = [];
    CONS.forEach(function (c) {
      var marcada = !!sel[c.id], enJuego = !!ref[c.id], est;
      if (marcada === enJuego) buenas++; else exacto = false;
      if (marcada && enJuego) est = "Acierto";
      else if (!marcada && enJuego) est = "Falta";
      else if (marcada && !enJuego) est = "Sobra";
      else est = "Bien no marcada";
      filas.push({ id: c.id, n: c.n, est: est, ok: marcada === enJuego, texto: d.por[c.id] });
    });
    return { buenas: buenas, exacto: exacto, filas: filas };
  }

  function widget(el) {
    injectStyle();
    var id = "w-cn-" + (++uid), cur = 0, sel = [], hecho = [], msg = "";
    var i;
    for (i = 0; i < DILEMAS.length; i++) { sel.push({}); hecho.push(null); }

    var refs = CONS.map(function (c) { return "<dt>" + esc(c.n) + "</dt><dd>" + esc(c.d) + "</dd>"; }).join("");
    el.innerHTML = '<div class="w-cn">' +
      '<h4>¿Qué consideraciones morales están en juego?</h4>' +
      '<p class="w-hint">Lee cada dilema y marca las consideraciones que el enunciado pone en el centro. Cada uno tiene entre dos y tres. Al comprobar verás la explicación de las seis, también de las que no marcaste.</p>' +
      '<div class="w-nav" id="' + id + '-nav" role="group" aria-label="Dilemas"></div>' +
      '<div id="' + id + '-cuerpo"></div>' +
      '<div id="' + id + '-resumen"></div>' +
      '<details><summary>Ver las seis consideraciones</summary><dl>' + refs + '</dl></details>' +
      '</div>';
    var nav = el.querySelector("#" + id + "-nav"),
        cuerpo = el.querySelector("#" + id + "-cuerpo"),
        resumen = el.querySelector("#" + id + "-resumen");

    function pintaNav() {
      var h = "";
      DILEMAS.forEach(function (d, k) {
        var cls = hecho[k] ? (hecho[k].exacto ? "w-y" : "w-n") : "";
        h += '<button type="button" data-k="' + k + '"' + (k === cur ? ' aria-current="true"' : "") + (cls ? ' class="' + cls + '"' : "") + ">" +
          (k + 1) + ". " + esc(d.t) + (hecho[k] ? (hecho[k].exacto ? " (completo)" : " (con fallos)") : "") + "</button>";
      });
      nav.innerHTML = h;
      Array.prototype.forEach.call(nav.querySelectorAll("button"), function (b) {
        b.addEventListener("click", function () { cur = parseInt(b.getAttribute("data-k"), 10); msg = ""; pinta(); });
      });
    }

    function pintaCuerpo(enfoca) {
      var d = DILEMAS[cur], r = hecho[cur], h;
      h = '<div class="w-caso"><b>Dilema ' + (cur + 1) + " de " + DILEMAS.length + ": " + esc(d.t) + "</b>" + esc(d.x) + "</div>";
      h += '<fieldset><legend>Consideraciones en juego</legend><div class="w-opts">';
      CONS.forEach(function (c) {
        h += '<label class="w-opt"><input type="checkbox" data-c="' + c.id + '"' + (sel[cur][c.id] ? " checked" : "") + (r ? " disabled" : "") + ">" +
          "<span><b>" + esc(c.n) + "</b><small>" + esc(c.d) + "</small></span></label>";
      });
      h += "</div></fieldset>";
      if (!r) {
        h += '<div class="w-btns"><button type="button" class="w-main" data-a="ok">Comprobar</button></div><p class="w-msg" aria-live="polite">' + esc(msg) + "</p>";
      } else {
        h += '<div class="w-fb" tabindex="-1" aria-live="polite">' +
          '<div class="w-res ' + (r.exacto ? "ok" : "mal") + '"><b>' + (r.exacto ? "Completo." : "Casi.") + "</b> " +
          r.buenas + " de " + CONS.length + " consideraciones bien resueltas (marcadas o no marcadas).</div>" +
          '<ul class="w-lista">';
        r.filas.forEach(function (f) {
          h += '<li class="' + (f.ok ? "w-y" : "w-n") + '"><b>' + esc(f.n) + '</b><span class="w-est">' + esc(f.est) + "</span><br>" + esc(f.texto) + "</li>";
        });
        h += '</ul><div class="w-btns">' +
          (cur + 1 < DILEMAS.length ? '<button type="button" class="w-main" data-a="sig">Siguiente dilema</button>' : "") +
          '<button type="button" class="w-sec" data-a="re">Rehacer este dilema</button></div></div>';
      }
      cuerpo.innerHTML = h;
      Array.prototype.forEach.call(cuerpo.querySelectorAll("input[type=checkbox]"), function (ch) {
        ch.addEventListener("change", function () {
          if (ch.checked) sel[cur][ch.getAttribute("data-c")] = true; else delete sel[cur][ch.getAttribute("data-c")];
        });
      });
      Array.prototype.forEach.call(cuerpo.querySelectorAll("button[data-a]"), function (b) {
        b.addEventListener("click", function () {
          var a = b.getAttribute("data-a");
          if (a === "ok") {
            if (Object.keys(sel[cur]).length === 0) { msg = "Marca al menos una consideración antes de comprobar."; pintaCuerpo(false); return; }
            msg = "";
            hecho[cur] = evalua(DILEMAS[cur], sel[cur]);
            pinta(true);
          } else if (a === "sig") {
            cur++; msg = ""; pinta();
          } else if (a === "re") {
            hecho[cur] = null; sel[cur] = {}; msg = ""; pinta();
          }
        });
      });
      if (enfoca) {
        var fb = cuerpo.querySelector(".w-fb");
        if (fb) fb.focus();
      }
    }

    function pintaResumen() {
      var n = 0, exactos = 0, buenas = 0, h = "";
      DILEMAS.forEach(function (d, k) {
        if (hecho[k]) { n++; if (hecho[k].exacto) exactos++; buenas += hecho[k].buenas; }
      });
      if (n === 0) {
        resumen.innerHTML = '<p class="w-cap">Cuando compruebes un dilema, aquí verás tu marcador.</p>';
        return;
      }
      h += '<p class="w-cap" aria-live="polite">Marcador: ' + exactos + " de " + n + " dilemas comprobados, resueltos por completo; " +
        buenas + " de " + (n * CONS.length) + " decisiones individuales bien tomadas.";
      if (n === DILEMAS.length) {
        h += exactos >= 5 ? " Buen dominio de la lista." : " Repasa la tabla de acciones y los derechos positivos y negativos, y prueba a rehacer los dilemas con fallos.";
      }
      h += "</p>";
      resumen.innerHTML = h;
    }

    function pinta(enfoca) { pintaNav(); pintaCuerpo(enfoca); pintaResumen(); }

    pinta(false);
  }

  widget.modelo = { CONS: CONS, DILEMAS: DILEMAS, evalua: evalua, nombre: nombre };
  window.WIDGETS["m11-l04-consideraciones"] = widget;
})();
