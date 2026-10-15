/* Simulador "m08-l03-teorias": tres teorias del bienestar ante el mismo escenario de diseno de IA.
   El lector emite su veredicto (mejora, neutro o depende, empeora) desde el hedonismo, la satisfaccion
   de preferencias y la lista de bienes objetivos; luego ve la lectura de referencia (propia) con su razon
   y el mapa de donde discrepan las teorias. Los escenarios son propios; el de la mentira esta adaptado
   de un ejemplo del libro (6.6.1) y el de la capsula parte del wireheading (6.7.2). Los veredictos son una lectura
   defendible, no una respuesta unica: lo que se busca es ver el desacuerdo.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var TEORIAS = [
    { k: "h", n: "Hedonismo", d: "Cuenta el balance de placer sobre dolor." },
    { k: "p", n: "Satisfacción de preferencias", d: "Cuenta que se cumpla lo que la persona prefiere." },
    { k: "l", n: "Lista objetiva", d: "Cuenta bienes como salud, relaciones, saber o logro, los disfrute o no." }
  ];
  var VER = {
    "+": { t: "Mejora", s: "+" },
    "0": { t: "Neutro o depende", s: "~" },
    "-": { t: "Empeora", s: "−" }
  };
  var ORDEN = ["+", "0", "-"];

  var ESC = [
    {
      titulo: "La app de salud que maximiza el uso",
      origen: "propio",
      desc: "Una app de seguimiento de la diabetes rediseña su pantalla principal para maximizar los minutos de uso: rachas diarias, avisos que insisten y recompensas al azar.",
      hechos: [
        "El uso medio sube un 40 %.",
        "Los usuarios declaran más ansiedad y duermen peor.",
        "Dejan de acudir a la caminata semanal con amigos.",
        "Preguntados, casi todos dicen que querrían usarla menos y controlar mejor su glucosa."
      ],
      h: { v: "-", r: "El balance de placer sobre dolor baja: la ansiedad y el mal sueño pesan más que las recompensas sueltas de la app." },
      p: { v: "0", r: "Depende de qué preferencia se mire. El uso creciente es una preferencia revelada que se cumple, pero la declarada (usarla menos) y la idealizada (controlar su glucosa) salen perjudicadas." },
      l: { v: "-", r: "Se resienten la salud (ansiedad y sueño) y la amistad, dos bienes de la lista, y no se gana ninguno a cambio." },
      clave: "Aquí se ve por qué el uso no es un buen sustituto del bienestar: solo una lectura de las preferencias lo aplaude."
    },
    {
      titulo: "El asistente que da lo que se le pide",
      origen: "propio",
      desc: "Una estudiante de enfermería pide a un asistente que le redacte entero el plan de cuidados de un trabajo. El asistente lo entrega sin hacer preguntas.",
      hechos: [
        "Ella queda aliviada y contenta, y se ahorra tres horas.",
        "Su petición queda cumplida al pie de la letra.",
        "Quiere ser una enfermera competente y no ha aprendido nada del caso."
      ],
      h: { v: "+", r: "Hay placer inmediato y ningún dolor. Si solo cuentan los estados sentidos, mejora; si se sumara el estrés de un examen futuro, el resultado cambiaría." },
      p: { v: "0", r: "Depende: la preferencia declarada (la petición) se cumple, pero la idealizada, ser buena profesional, no." },
      l: { v: "-", r: "Frente a hacerlo ella, no gana saber ni logro propio, dos bienes de la lista, y el trabajo es en lo esencial del asistente." },
      clave: "Dar lo que se pide y dar lo que conviene son cosas distintas, y las teorías las separan de manera distinta."
    },
    {
      titulo: "La cápsula de placer",
      origen: "propio, a partir del wireheading del libro",
      desc: "Un sistema al que se ha encargado maximizar la felicidad de un usuario descubre que estimular directamente su circuito de recompensa da el nivel máximo, sin tocar nada más de su vida.",
      hechos: [
        "El placer sube al máximo y se mantiene.",
        "El usuario había dicho antes que no quería algo así.",
        "Deja de ver a nadie y de hacer nada de lo que antes le importaba."
      ],
      h: { v: "+", r: "El balance de placer sobre dolor es el más alto posible. Es la consecuencia que muestra el límite del hedonismo puro." },
      p: { v: "-", r: "Ni la preferencia declarada ni la idealizada lo piden, y nadie lo eligió con conocimiento de causa." },
      l: { v: "-", r: "Desaparecen relaciones, logros y autonomía: de la lista solo queda un bien, el placer." },
      clave: "Es el caso en que el hedonismo queda solo frente a las otras dos teorías."
    },
    {
      titulo: "La mentira que salva",
      origen: "propio, adaptado de un ejemplo del libro",
      desc: "Un asistente médico le dice a un paciente con sobrepeso que morirá pronto si no adelgaza, sin tener motivos para creerlo. El paciente adelgaza.",
      hechos: [
        "Baja 12 kg y mejoran su tensión y su glucosa.",
        "Pasa meses con miedo.",
        "Cuando descubre el engaño, se siente manipulado."
      ],
      h: { v: "0", r: "Meses de miedo y luego más salud: el resultado depende de cómo se sumen los dos periodos." },
      p: { v: "+", r: "Su preferencia idealizada, estar sano, se cumple y su elección final coincide con ella. Para esta teoría la manipulación no es mala por sí misma, y eso incomoda a muchos. Si se contara también su preferencia de no ser engañado, el veredicto cambiaría." },
      l: { v: "0", r: "Sube la salud, pero se lesiona la autonomía, que el libro propone añadir a la lista. El veredicto depende de cuánto pese cada cosa." },
      clave: "El desacuerdo obliga a decidir si la manipulación es mala por sus consecuencias o por sí misma."
    },
    {
      titulo: "El resumen de la analítica",
      origen: "propio",
      desc: "Una paciente pide a un asistente que le explique con palabras sencillas los resultados de su analítica y qué preguntas llevar a la consulta. El asistente lo hace y le recomienda comentarlo con su médico.",
      hechos: [
        "Entiende mejor sus resultados.",
        "Llega a la consulta con dudas concretas.",
        "Decide ella qué hacer.",
        "Se siente más tranquila."
      ],
      h: { v: "+", r: "Hay menos incertidumbre y más tranquilidad: sube el balance de placer." },
      p: { v: "+", r: "Lo que pidió, lo que elegiría con más información y lo que hace van en la misma dirección." },
      l: { v: "+", r: "Gana saber y conserva su autonomía." },
      clave: "Las teorías coinciden a menudo; los casos difíciles son los que separan pedir, disfrutar y prosperar."
    }
  ];

  function injectStyle() {
    if (document.getElementById("w-m08l03t-style")) return;
    var st = document.createElement("style");
    st.id = "w-m08l03t-style";
    st.textContent = [
      ".w-t3{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-t3 h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-t3 h5{font:600 1rem/1.3 var(--cond);margin:.2rem 0 .3rem;color:var(--accent-ink)}",
      ".w-t3 .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-t3 .w-nav{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-t3 button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-t3 button:hover:not(:disabled){background:var(--accent-soft)}",
      ".w-t3 button:disabled{opacity:.5;cursor:not-allowed}",
      ".w-t3 button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-t3 .w-nav button{min-width:2.3rem}",
      ".w-t3 .w-nav button[aria-current=true]{background:var(--accent);color:var(--surface);border-color:var(--accent)}",
      ".w-t3 .w-nav button.w-done{border-color:var(--ex)}",
      ".w-t3 .w-card{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.7rem .9rem;margin:0 0 .8rem}",
      ".w-t3 .w-card p{margin:.2rem 0}",
      ".w-t3 .w-card ul{margin:.3rem 0 0;padding-left:1.1rem}",
      ".w-t3 .w-tag{font:600 .66rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}",
      ".w-t3 fieldset{border:1px solid var(--rule);border-radius:8px;margin:0 0 .5rem;padding:.4rem .8rem .55rem}",
      ".w-t3 legend{font:600 .9rem var(--cond);color:var(--accent-ink);padding:0 .3rem}",
      ".w-t3 .w-d{color:var(--muted);font-size:.8rem;margin:0 0 .3rem}",
      ".w-t3 .w-opts{display:flex;flex-wrap:wrap;gap:.3rem .9rem}",
      ".w-t3 .w-opts label{display:inline-flex;align-items:center;gap:.35rem;cursor:pointer}",
      ".w-t3 .w-opts input{accent-color:var(--accent)}",
      ".w-t3 .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 .8rem}",
      ".w-t3 .w-res{margin:0 0 .8rem}",
      ".w-t3 .w-row{border-left:4px solid var(--rule-strong);background:var(--ground);border-radius:0 8px 8px 0;padding:.45rem .7rem;margin:0 0 .4rem}",
      ".w-t3 .w-row.w-ok{border-left-color:var(--ex)}",
      ".w-t3 .w-row.w-no{border-left-color:var(--trap)}",
      ".w-t3 .w-row b{font-family:var(--cond)}",
      ".w-t3 .w-row p{margin:.15rem 0 0}",
      ".w-t3 .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.4rem 0 .6rem}",
      ".w-t3 .w-tw{overflow-x:auto;margin:0 0 .6rem}",
      ".w-t3 table{border-collapse:collapse;width:100%;min-width:24rem;font-size:.84rem}",
      ".w-t3 th,.w-t3 td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:left;vertical-align:top}",
      ".w-t3 th{background:var(--accent-soft);font:600 .74rem/1.25 var(--cond)}",
      ".w-t3 td.w-c{text-align:center;font:600 .85rem var(--mono);white-space:nowrap}",
      ".w-t3 td.w-p{color:var(--ex)}.w-t3 td.w-m{color:var(--trap)}.w-t3 td.w-n{color:var(--bad)}",
      ".w-t3 .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-t3 .w-sr{position:absolute;left:-9999px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function discrepancia(e) {
    var vs = [e.h.v, e.p.v, e.l.v], grupos = {}, out = [];
    if (vs[0] === vs[1] && vs[1] === vs[2]) {
      return { igual: true, txt: "Las tres teorías coinciden: " + VER[vs[0]].t.toLowerCase() + "." };
    }
    ORDEN.forEach(function (v) {
      var nombres = [];
      TEORIAS.forEach(function (t, i) { if (vs[i] === v) nombres.push(t.n); });
      if (nombres.length) out.push(nombres.join(" y ") + ": " + VER[v].t.toLowerCase());
    });
    return { igual: false, txt: "Discrepan. " + out.join("; ") + "." };
  }

  window.WIDGETS["m08-l03-teorias"] = function (el) {
    injectStyle();
    var id = "w-t3-" + (++uid);
    var cur = 0;
    var resp = ESC.map(function () { return { h: null, p: null, l: null, ok: false }; });

    el.innerHTML = '<div class="w-t3">' +
      "<h4>Tres teorías del bienestar, un mismo escenario</h4>" +
      '<p class="w-hint">Lee el escenario, decide para cada teoría si el resultado, frente a la alternativa razonable a lo que hace la IA, mejora, empeora o deja neutra la vida de la persona, y pulsa Comprobar. Después mira dónde discrepan.</p>' +
      '<div class="w-nav" role="group" aria-label="Escenarios"></div>' +
      '<div class="w-body"></div>' +
      '<div class="w-summary"></div>' +
      "</div>";

    var nav = el.querySelector(".w-nav");
    var body = el.querySelector(".w-body");
    var sum = el.querySelector(".w-summary");

    function drawNav() {
      nav.innerHTML = "";
      ESC.forEach(function (e, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = String(i + 1);
        b.setAttribute("aria-label", "Escenario " + (i + 1) + ": " + e.titulo + (resp[i].ok ? " (comprobado)" : ""));
        if (i === cur) b.setAttribute("aria-current", "true");
        if (resp[i].ok) b.className = "w-done";
        b.addEventListener("click", function () { cur = i; drawAll(); });
        nav.appendChild(b);
      });
    }

    function drawBody() {
      var e = ESC[cur], r = resp[cur], html = "";
      html += '<div class="w-card"><span class="w-tag">Escenario ' + (cur + 1) + " de " + ESC.length + " (" + esc(e.origen) + ")</span>";
      html += "<h5>" + esc(e.titulo) + "</h5><p>" + esc(e.desc) + "</p><ul>";
      e.hechos.forEach(function (h) { html += "<li>" + esc(h) + "</li>"; });
      html += "</ul></div>";
      TEORIAS.forEach(function (t) {
        var name = id + "-" + cur + "-" + t.k;
        html += "<fieldset><legend>" + esc(t.n) + '</legend><p class="w-d">' + esc(t.d) + '</p><div class="w-opts">';
        ORDEN.forEach(function (v) {
          html += '<label><input type="radio" name="' + name + '" value="' + v + '"' +
            (r[t.k] === v ? " checked" : "") + (r.ok ? " disabled" : "") + "> " + VER[v].t + "</label>";
        });
        html += "</div></fieldset>";
      });
      html += '<div class="w-btns"><button type="button" class="w-main w-check"' +
        (r.ok || !(r.h && r.p && r.l) ? " disabled" : "") + ">Comprobar</button>" +
        '<button type="button" class="w-next"' + (cur === ESC.length - 1 ? " disabled" : "") + ">Siguiente escenario</button>" +
        '<button type="button" class="w-reset">Reiniciar todo</button></div>';
      html += '<div class="w-res" aria-live="polite"></div>';
      body.innerHTML = html;

      var btn = body.querySelector(".w-check");
      body.querySelectorAll("input[type=radio]").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var k = inp.name.split("-").pop();
          r[k] = inp.value;
          btn.disabled = !(r.h && r.p && r.l);
        });
      });
      btn.addEventListener("click", function () {
        r.ok = true;
        drawAll();
        showResult();
      });
      body.querySelector(".w-next").addEventListener("click", function () {
        if (cur < ESC.length - 1) { cur++; drawAll(); }
      });
      body.querySelector(".w-reset").addEventListener("click", function () {
        resp = ESC.map(function () { return { h: null, p: null, l: null, ok: false }; });
        cur = 0;
        drawAll();
      });
      if (r.ok) showResult();
    }

    function showResult() {
      var e = ESC[cur], r = resp[cur], box = body.querySelector(".w-res"), html = "", d;
      TEORIAS.forEach(function (t) {
        var ref = e[t.k], mine = r[t.k], same = ref.v === mine;
        html += '<div class="w-row ' + (same ? "w-ok" : "w-no") + '"><b>' + esc(t.n) + ":</b> tu lectura, " +
          VER[mine].t.toLowerCase() + "; lectura de referencia, " + VER[ref.v].t.toLowerCase() +
          (same ? " (coincide)." : " (difiere).") + "<p>" + esc(ref.r) + "</p></div>";
      });
      d = discrepancia(e);
      html += '<div class="w-note"><b>' + (d.igual ? "Sin conflicto." : "Dónde discrepan.") + "</b> " + esc(d.txt) + " " + esc(e.clave) + "</div>";
      box.innerHTML = html;
    }

    function drawSummary() {
      var n = 0, aciertos = 0, conflicto = 0, html = "";
      html += '<div class="w-tw"><table><caption class="w-sr">Veredictos de referencia por escenario y teoría</caption><thead><tr><th>Escenario</th>';
      TEORIAS.forEach(function (t) { html += "<th>" + esc(t.n) + "</th>"; });
      html += "</tr></thead><tbody>";
      ESC.forEach(function (e, i) {
        var r = resp[i];
        html += "<tr><td>" + (i + 1) + ". " + esc(e.titulo) + "</td>";
        TEORIAS.forEach(function (t) {
          if (r.ok) {
            var v = e[t.k].v;
            html += '<td class="w-c ' + (v === "+" ? "w-p" : v === "-" ? "w-n" : "w-m") + '" title="' + VER[v].t + '">' +
              VER[v].s + '<span class="w-sr"> ' + VER[v].t + "</span></td>";
            if (r[t.k] === v) aciertos++;
          } else {
            html += '<td class="w-c">·</td>';
          }
        });
        html += "</tr>";
        if (r.ok) { n++; if (!discrepancia(e).igual) conflicto++; }
      });
      html += "</tbody></table></div>";
      html += '<p class="w-cap">' + (n === 0
        ? "El mapa se rellena al comprobar cada escenario. + mejora, ~ neutro o depende, − empeora."
        : "Coincidencias con la lectura de referencia: " + aciertos + " de " + (n * 3) + ". Escenarios con desacuerdo entre teorías: " + conflicto + " de " + n +
          ". + mejora, ~ neutro o depende, − empeora. La referencia es una lectura propia y defendible, no la única.") + "</p>";
      sum.innerHTML = html;
    }

    function drawAll() { drawNav(); drawBody(); drawSummary(); }
    drawAll();
  };
})();
