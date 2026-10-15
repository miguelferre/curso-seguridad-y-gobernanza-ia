/* Simulador "m00-l01-tipos-ia": coloca sistemas de ejemplo en la matriz habilidad x generalidad
   (tabla 2.1 del libro) y compara con la casilla de referencia. Once sistemas: ocho con ejemplo del
   libro y tres hipotéticos propios. Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-ti-style")) return;
    var st = document.createElement("style");
    st.id = "w-ti-style";
    st.textContent = [
      ".w-ti{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-ti h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-ti .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-ti .w-lab{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0 0 .3rem}",
      ".w-ti .w-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-ti button{font:600 .8rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.35rem .65rem;cursor:pointer}",
      ".w-ti button:hover{background:var(--accent-soft)}",
      ".w-ti button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
      ".w-ti .w-chip[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-ti .w-chip .w-m{font-family:var(--mono);margin-left:.3rem}",
      ".w-ti .w-ok{color:var(--ex)}",
      ".w-ti .w-ko{color:var(--trap)}",
      ".w-ti .w-sys{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem;margin:0 0 .8rem}",
      ".w-ti .w-sys b{font:600 1rem var(--cond);color:var(--accent-ink)}",
      ".w-ti .w-sys p{margin:.3rem 0 0}",
      ".w-ti .w-src{color:var(--faint);font-size:.76rem}",
      ".w-ti .w-grid{display:grid;grid-template-columns:minmax(5.2rem,auto) 1fr 1fr;gap:4px;margin:0 0 .8rem}",
      ".w-ti .w-ch{font:600 .72rem/1.25 var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--faint);padding:.3rem .2rem;align-self:end}",
      ".w-ti .w-rh{font:600 .8rem/1.2 var(--cond);padding:.3rem .4rem .3rem 0;align-self:center}",
      ".w-ti .w-rh small{display:block;font:400 .68rem/1.25 var(--sans);color:var(--muted);margin-top:.1rem}",
      ".w-ti .w-cell{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:.2rem;min-height:3.6rem;padding:.35rem .4rem;text-align:left;font-weight:400;border-radius:6px;background:var(--ground);min-width:0}",
      ".w-ti .w-cell .w-tag{font:italic 400 .68rem/1.25 var(--sans);color:var(--muted)}",
      ".w-ti .w-cell .w-pin{font:600 .7rem/1.25 var(--cond);background:var(--accent-soft);border:1px solid var(--accent);border-radius:5px;padding:.1rem .3rem;overflow-wrap:break-word;color:var(--accent-ink)}",
      ".w-ti .w-cell .w-pin.w-cur{background:var(--ex-bg);border-color:var(--ex);color:var(--ink)}",
      ".w-ti .w-cell.w-mine{outline:2px dashed var(--trap);outline-offset:-2px}",
      ".w-ti .w-cell.w-hit{outline:2px solid var(--ex);outline-offset:-2px}",
      ".w-ti .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .7rem}",
      ".w-ti .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-ti .w-res{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-ti .w-res p{margin:0 0 .35rem}",
      ".w-ti .w-res p:last-child{margin:0}",
      ".w-ti .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .7rem}",
      ".w-ti .w-score{font:600 .95rem var(--cond);color:var(--accent-ink);margin:0 0 .4rem}",
      ".w-ti .w-note{background:var(--trap-bg);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem;font-size:.86rem}",
      ".w-ti .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  var NIVELES = [
    { n: "Sin IA", s: "no hay IA" },
    { n: "Emergente", s: "como una persona sin formación, o algo mejor" },
    { n: "Competente", s: "al menos el percentil 50 de adultos cualificados" },
    { n: "Experto", s: "al menos el percentil 90" },
    { n: "Virtuoso", s: "al menos el percentil 99" },
    { n: "Sobrehumano", s: "supera al 100 % de las personas" }
  ];
  var COLS = ["Estrecha", "General"];
  var TAGS = [
    ["no es IA", "no es IA"],
    ["IA estrecha", "AGI emergente"],
    ["IA estrecha", "AGI competente"],
    ["IA estrecha", "AGI experta"],
    ["IA estrecha", "AGI virtuosa"],
    ["IA estrecha sobrehumana; no es ASI", "ASI"]
  ];

  var SIST = [
    { c: "Calculadora", nombre: "Calculadora (software)", r: 0, k: 0, lib: true,
      d: "Suma, multiplica y divide sin errores y mucho más deprisa que una persona.",
      e: "Sin IA y estrecha. Es rapidísima en aritmética, pero es un programa fijo que no aprende. Superar a las personas en una tarea no la convierte en inteligente." },
    { c: "Plataforma", nombre: "Plataforma que reparte tareas a personas (tipo Mechanical Turk)", r: 0, k: 1, lib: true,
      d: "Un programa recibe encargos de todo tipo y los resuelven personas reales, no un modelo.",
      e: "Sin IA y general. Abarca muchas tareas, pero la habilidad la ponen las personas. Es un ejemplo de que generalidad sin IA no es IA." },
    { c: "Reglas simples", nombre: "Sistema simple basado en reglas", r: 1, k: 0, lib: true,
      d: "Un programa con reglas escritas a mano, por ejemplo una alerta clínica del tipo «si el potasio supera un umbral, avisar» (el ejemplo de la alerta es propio).",
      e: "Emergente y estrecho: la tabla del libro pone aquí los sistemas simples de reglas. Hace una cosa, con poca flexibilidad, y no aprende de la experiencia." },
    { c: "Chatbot general", nombre: "Chatbot de propósito general (tipo ChatGPT o Gemini)", r: 1, k: 1, lib: true,
      d: "Redacta, traduce, explica y programa. Rinde bien en muchas tareas y mal en otras.",
      e: "Emergente y general: la tabla del libro lo llama AGI emergente. Ese nombre es discutible, y el propio libro recoge que algunos lo consideran AGI y otros no." },
    { c: "Asistente de voz", nombre: "Asistente de voz (tipo Siri)", r: 2, k: 0, lib: true,
      d: "Entiende órdenes habladas y ejecuta un repertorio acotado: alarmas, mensajes, llamadas.",
      e: "Competente y estrecho. Es mejor que la mediana de las personas en su terreno, pero no aprendería a redactar un ensayo ni a conducir." },
    { c: "Corrector", nombre: "Corrector ortográfico y gramatical (tipo Grammarly)", r: 3, k: 0, lib: true,
      d: "Detecta erratas y errores de estilo en un texto con un nivel muy alto.",
      e: "Experto y estrecho: la tabla del libro lo coloca en el percentil 90 o más de personas cualificadas, dentro de una única tarea." },
    { c: "Deep Blue", nombre: "Deep Blue (ajedrez, 1997)", r: 4, k: 0, lib: true,
      d: "Venció al campeón mundial Kaspárov. Fuera del ajedrez no sirve para nada.",
      e: "Virtuoso y estrecho: percentil 99 en una sola tarea. Es el ejemplo clásico de un sistema hábil que no es general." },
    { c: "AlphaFold", nombre: "AlphaFold (estructura 3D de proteínas)", r: 5, k: 0, lib: true,
      d: "Predice la forma de las proteínas, un problema que llevaba décadas sin resolverse.",
      e: "Sobrehumano y estrecho. Que sea sobrehumano en su tarea no lo hace superinteligente. Y los sistemas estrechos y sobrehumanos en dominios de riesgo alto, como virología o ciberataque, sí importan para el riesgo catastrófico." },
    { c: "Lector rayos X", nombre: "Lector de radiografías de tórax (hipotético)", r: 3, k: 0, lib: false,
      d: "Ejemplo propio e hipotético: un modelo que iguala o supera al 90 % de los radiólogos cualificados en radiografías de tórax, y nada más.",
      e: "Experto y estrecho (ejemplo propio). Muy hábil en una tarea, incapaz de redactar un correo o de leer un electrocardiograma. Si se despliega sin revisión, sus errores importan aunque sea estrecho." },
    { c: "Asistente clínico", nombre: "Asistente clínico generalista (hipotético)", r: 2, k: 1, lib: false,
      d: "Ejemplo propio e hipotético: un sistema que en cualquier tarea cognitiva rinde como el 50 % mejor de los profesionales cualificados.",
      e: "Competente y general: la casilla que la tabla del libro marca como aún no lograda, al menos en todas las tareas. El ejemplo es propio; la casilla, del libro." },
    { c: "ASI", nombre: "Sistema hipotético que supera a los humanos en casi todo", r: 5, k: 1, lib: false,
      d: "Ejemplo propio e hipotético: supera a todas las personas en prácticamente todas las tareas intelectuales.",
      e: "Sobrehumano y general: la casilla de la superinteligencia (ASI), que el libro marca como no lograda. Está en la esquina porque exige las dos cosas a la vez, habilidad máxima y amplitud." }
  ];

  window.WIDGETS["m00-l01-tipos-ia"] = function (el) {
    injectStyle();
    var id = "w-ti-" + (++uid);
    var cur = 0, showTags = true, ans = {}, focusKey = null;

    el.innerHTML = '<div class="w-ti">' +
      '<h4>Clasificador de sistemas de IA</h4>' +
      '<p class="w-hint">Elige un sistema, léelo y pulsa la casilla donde lo pondrías: la fila es cuánta habilidad tiene y la columna, cuán general es. Después verás la casilla de referencia.</p>' +
      '<p class="w-lab" id="' + id + '-l1">1. Elige un sistema</p>' +
      '<div class="w-chips" role="group" aria-labelledby="' + id + '-l1" id="' + id + '-chips"></div>' +
      '<div class="w-sys" id="' + id + '-sys" aria-live="polite"></div>' +
      '<p class="w-lab" id="' + id + '-l2">2. Pulsa su casilla</p>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-tags" checked><span>Mostrar en cada casilla qué etiqueta le corresponde</span></label>' +
      '<div class="w-grid" id="' + id + '-grid" role="group" aria-labelledby="' + id + '-l2"></div>' +
      '<div class="w-res" id="' + id + '-res" aria-live="polite"></div>' +
      '<p class="w-score" id="' + id + '-score"></p>' +
      '<div class="w-btns"><button type="button" id="' + id + '-rev">Ver la solución de este sistema</button><button type="button" id="' + id + '-rst">Empezar de nuevo</button></div>' +
      '<p class="w-note"><b>HLAI y TAI no tienen casilla.</b> La IA de nivel humano exige hacer todas las tareas humanas, al menos igual de bien y a menor coste. La IA transformadora se define por sus consecuencias en la sociedad, no por su habilidad: un sistema estrecho podría serlo.</p>' +
      '<p class="w-cap">Casillas y ejemplos de las ocho primeras entradas: tabla 2.1 del libro (pág. 60), que el propio libro presenta como un enfoque posible entre otros. Los tres sistemas hipotéticos son ejemplos propios sobre casillas de esa tabla.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

    function cellLabel(r, k) {
      var names = [];
      SIST.forEach(function (s, i) { if (ans[i] && s.r === r && s.k === k) names.push(s.c); });
      return "Fila " + NIVELES[r].n + ", columna " + COLS[k] + ". Etiqueta: " + TAGS[r][k] + "." + (names.length ? " Colocados aquí: " + names.join(", ") + "." : "");
    }

    function render() {
      var i, r, k, out = [], s = SIST[cur], a = ans[cur];

      /* chips */
      SIST.forEach(function (x, j) {
        var mark = "", cls = "";
        if (ans[j]) {
          if (ans[j].rev) { mark = "·"; }
          else if (ans[j].r === x.r && ans[j].k === x.k) { mark = "✓"; cls = " w-ok"; }
          else { mark = "✗"; cls = " w-ko"; }
        }
        out.push('<button type="button" class="w-chip" data-k="chip' + j + '" data-sys="' + j + '" aria-pressed="' + (j === cur) + '">' + esc(x.c) +
          (mark ? '<span class="w-m' + cls + '" aria-label="' + (mark === "✓" ? "acertado" : mark === "✗" ? "fallado" : "revelado") + '">' + mark + '</span>' : "") + '</button>');
      });
      $("chips").innerHTML = out.join("");

      /* ficha */
      $("sys").innerHTML = '<b>' + esc(s.nombre) + '</b><p>' + esc(s.d) + '</p><p class="w-src">' + (s.lib ? "Ejemplo del libro." : "Ejemplo propio, hipotético.") + '</p>';

      /* rejilla */
      out = ['<div></div>'];
      COLS.forEach(function (c) { out.push('<div class="w-ch">' + c + '</div>'); });
      for (r = 0; r < NIVELES.length; r++) {
        out.push('<div class="w-rh">' + NIVELES[r].n + '<small>' + NIVELES[r].s + '</small></div>');
        for (k = 0; k < 2; k++) {
          var cls = "w-cell", pins = [];
          if (a) {
            if (!a.rev && a.r === r && a.k === k && !(s.r === r && s.k === k)) cls += " w-mine";
            if (s.r === r && s.k === k) cls += " w-hit";
          }
          SIST.forEach(function (x, j) {
            if (ans[j] && x.r === r && x.k === k) pins.push('<span class="w-pin' + (j === cur ? " w-cur" : "") + '">' + esc(x.c) + '</span>');
          });
          out.push('<button type="button" class="' + cls + '" data-k="cell' + r + k + '" data-r="' + r + '" data-c="' + k + '" aria-label="' + esc(cellLabel(r, k)) + '">' +
            (showTags ? '<span class="w-tag">' + TAGS[r][k] + '</span>' : "") + pins.join("") + '</button>');
        }
      }
      $("grid").innerHTML = out.join("");

      /* resultado */
      var res = $("res");
      if (!a) {
        res.innerHTML = '<p>Pulsa una casilla para responder. Empieza por decidir si el sistema hace una sola cosa o muchas, y luego cuánta habilidad tiene comparada con personas cualificadas.</p>';
      } else {
        var head;
        if (a.rev) head = "Solución revelada: " + NIVELES[s.r].n + ", " + COLS[s.k].toLowerCase() + ".";
        else if (a.r === s.r && a.k === s.k) head = "Correcto: " + NIVELES[s.r].n + ", " + COLS[s.k].toLowerCase() + ".";
        else if (a.r === s.r) head = "La fila es correcta (" + NIVELES[s.r].n + "), pero la columna no: es " + COLS[s.k].toLowerCase() + ".";
        else if (a.k === s.k) head = "La columna es correcta (" + COLS[s.k].toLowerCase() + "), pero la fila no: es " + NIVELES[s.r].n + ".";
        else head = "Ni la fila ni la columna coinciden. Es " + NIVELES[s.r].n + " y " + COLS[s.k].toLowerCase() + ".";
        res.innerHTML = '<p><b>' + esc(head) + '</b></p><p>' + esc(s.e) + '</p>';
      }

      /* marcador */
      var n = 0, ex = 0, fi = 0, co = 0;
      SIST.forEach(function (x, j) {
        var g = ans[j];
        if (!g || g.rev) return;
        n++;
        if (g.r === x.r) fi++;
        if (g.k === x.k) co++;
        if (g.r === x.r && g.k === x.k) ex++;
      });
      $("score").textContent = n === 0 ? "Aún no has colocado ningún sistema." :
        "Colocados " + n + ": casilla exacta " + ex + ", fila acertada " + fi + ", columna acertada " + co + ".";

      if (focusKey) {
        var f = el.querySelector('[data-k="' + focusKey + '"]');
        if (f) f.focus();
        focusKey = null;
      }
    }

    el.addEventListener("click", function (ev) {
      var t = ev.target, b = t.closest ? t.closest("button") : null;
      if (!b || !el.contains(b)) return;
      if (b.hasAttribute("data-sys")) {
        cur = parseInt(b.getAttribute("data-sys"), 10);
        focusKey = b.getAttribute("data-k");
        render();
      } else if (b.hasAttribute("data-r")) {
        if (ans[cur]) { focusKey = b.getAttribute("data-k"); render(); return; }
        ans[cur] = { r: parseInt(b.getAttribute("data-r"), 10), k: parseInt(b.getAttribute("data-c"), 10) };
        focusKey = b.getAttribute("data-k");
        render();
      }
    });
    $("tags").addEventListener("change", function () { showTags = $("tags").checked; render(); });
    $("rev").addEventListener("click", function () { if (!ans[cur]) ans[cur] = { rev: true }; render(); });
    $("rst").addEventListener("click", function () { ans = {}; cur = 0; render(); });

    render();
  };
})();
