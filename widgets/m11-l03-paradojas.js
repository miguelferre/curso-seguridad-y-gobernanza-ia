/* Simulador "m11-l03-paradojas": tres situaciones del libro (10.5) en las que la gente decide de un modo que la
   utilidad esperada no permite: la paradoja de Allais, el encuadre y la equidad. El alumno elige, se contrasta su
   pareja de elecciones con la utilidad esperada y se le muestra qué teoría alternativa del libro (teoría de las
   perspectivas, pp. 533 a 536) la explica.
   Los parámetros de la teoría de las perspectivas (alfa 0,5; lambda 2,25; g 0,4) son ilustrativos y elegidos aquí (lambda coincide
   con el de Tversky y Kahneman, 1992; con sus alfa 0,88 y g 0,61 Allais no sale): el libro no da valores. El deslizador de u(1 M$) y el umbral 10/11 son un añadido propio (álgebra de la lotería reducida).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  /* Parámetros ilustrativos de la teoría de las perspectivas (propios) */
  var P = { a: 0.5, lam: 2.25, g: 0.4 };

  function wt(p, g) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    var pg = Math.pow(p, g);
    return pg / Math.pow(pg + Math.pow(1 - p, g), 1 / g);
  }
  function vv(x) {
    return x >= 0 ? Math.pow(x, P.a) : -P.lam * Math.pow(-x, P.a);
  }
  function VV(l) {
    var s = 0;
    l.forEach(function (t) { s += wt(t[0], P.g) * vv(t[1]); });
    return s;
  }
  function fmt(x, d) { return x.toFixed(d).replace(".", ","); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Allais: resultados en millones de dólares */
  var AL = {
    A1: [[1, 1]],
    A2: [[0.10, 5], [0.89, 1], [0.01, 0]],
    B1: [[0.11, 1], [0.89, 0]],
    B2: [[0.10, 5], [0.90, 0]]
  };
  /* Encuadre: resultados en personas, respecto a la referencia "nadie salvado" (A) o "nadie muerto" (B) */
  var FR = {
    A1: [[1, 200]],
    A2: [[1 / 3, 600], [2 / 3, 0]],
    B1: [[1, -400]],
    B2: [[1 / 3, 0], [2 / 3, -600]]
  };

  function euAllais(l, u1) {
    var s = 0;
    l.forEach(function (t) { s += t[0] * (t[1] === 0 ? 0 : (t[1] === 1 ? u1 : 1)); });
    return s;
  }

  function injectStyle() {
    if (document.getElementById("w-m11l03p-style")) return;
    var st = document.createElement("style");
    st.id = "w-m11l03p-style";
    st.textContent = [
      ".w-pa{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pa h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pa h5{font:600 1rem/1.3 var(--cond);margin:.2rem 0 .3rem;color:var(--accent-ink)}",
      ".w-pa .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pa .w-nav{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .8rem}",
      ".w-pa button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-pa button:hover:not(:disabled){background:var(--accent-soft)}",
      ".w-pa button:disabled{opacity:.5;cursor:not-allowed}",
      ".w-pa button.w-main{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-pa .w-nav button[aria-current=true]{background:var(--accent);color:var(--surface);border-color:var(--accent)}",
      ".w-pa .w-nav button.w-done{border-color:var(--ex)}",
      ".w-pa .w-card{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.7rem .9rem;margin:0 0 .8rem}",
      ".w-pa .w-card p{margin:.2rem 0}",
      ".w-pa .w-tag{font:600 .66rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint)}",
      ".w-pa fieldset{border:1px solid var(--rule);border-radius:8px;margin:0 0 .5rem;padding:.4rem .8rem .55rem}",
      ".w-pa legend{font:600 .9rem var(--cond);color:var(--accent-ink);padding:0 .3rem}",
      ".w-pa .w-opts{display:flex;flex-direction:column;gap:.3rem}",
      ".w-pa .w-opts label{display:inline-flex;align-items:flex-start;gap:.4rem;cursor:pointer}",
      ".w-pa .w-opts input{accent-color:var(--accent);margin-top:.2rem}",
      ".w-pa .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.4rem 0 .8rem}",
      ".w-pa .w-row{border-left:4px solid var(--rule-strong);background:var(--ground);border-radius:0 8px 8px 0;padding:.45rem .7rem;margin:0 0 .5rem}",
      ".w-pa .w-row.w-ok{border-left-color:var(--ex)}",
      ".w-pa .w-row.w-no{border-left-color:var(--trap)}",
      ".w-pa .w-row b{font-family:var(--cond)}",
      ".w-pa .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.4rem 0 .6rem}",
      ".w-pa .w-tw{overflow-x:auto;margin:0 0 .6rem}",
      ".w-pa table{border-collapse:collapse;width:100%;min-width:24rem;font-size:.84rem}",
      ".w-pa th,.w-pa td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:left;vertical-align:top}",
      ".w-pa th{background:var(--accent-soft);font:600 .74rem/1.25 var(--cond)}",
      ".w-pa td.w-win{font-weight:700;color:var(--ex)}",
      ".w-pa .w-sl{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin:.3rem 0 .5rem}",
      ".w-pa .w-sl input[type=range]{flex:1 1 12rem;min-width:9rem;accent-color:var(--accent)}",
      ".w-pa .w-sl output{font:600 .9rem var(--mono)}",
      ".w-pa .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-pa .w-sr{position:absolute;left:-9999px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  var TABS = [
    { id: "allais", nombre: "Allais" },
    { id: "encuadre", nombre: "Encuadre" },
    { id: "equidad", nombre: "Equidad" }
  ];

  window.WIDGETS["m11-l03-paradojas"] = function (el) {
    injectStyle();
    var id = "w-pa-" + (++uid);
    var cur = 0;
    var st = {
      allais: { a: null, b: null, ok: false, u1: 0.95 },
      encuadre: { a: null, b: null, ok: false },
      equidad: { a: null, ok: false }
    };

    el.innerHTML = '<div class="w-pa">' +
      "<h4>Tres paradojas: ¿decides como un maximizador de utilidad esperada?</h4>" +
      '<p class="w-hint">Elige en cada situación con tu intuición, sin calcular. Después pulsa Comparar: verás si tu pareja de elecciones cabe en la utilidad esperada y qué teoría del libro la explica.</p>' +
      '<div class="w-nav" role="group" aria-label="Paradojas"></div>' +
      '<div class="w-body"></div>' +
      '<div class="w-summary"></div>' +
      "</div>";

    var nav = el.querySelector(".w-nav");
    var body = el.querySelector(".w-body");
    var sum = el.querySelector(".w-summary");

    function drawNav() {
      nav.innerHTML = "";
      TABS.forEach(function (t, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = t.nombre;
        b.setAttribute("aria-label", "Paradoja " + t.nombre + (st[t.id].ok ? " (comparada)" : ""));
        if (i === cur) b.setAttribute("aria-current", "true");
        if (st[t.id].ok) b.className = "w-done";
        b.addEventListener("click", function () { cur = i; drawAll(); });
        nav.appendChild(b);
      });
    }

    function radios(name, opts, val, dis) {
      var h = '<div class="w-opts">';
      opts.forEach(function (o) {
        h += '<label><input type="radio" name="' + id + "-" + name + '" value="' + o[0] + '"' +
          (val === o[0] ? " checked" : "") + dis + "> " + o[1] + "</label>";
      });
      return h + "</div>";
    }

    function tabla(cab, filas) {
      var h = '<div class="w-tw"><table><thead><tr>';
      cab.forEach(function (c) { h += "<th>" + c + "</th>"; });
      h += "</tr></thead><tbody>";
      filas.forEach(function (f) {
        h += "<tr>";
        f.forEach(function (c) { h += "<td>" + c + "</td>"; });
        h += "</tr>";
      });
      return h + "</tbody></table></div>";
    }

    /* ---------- Allais ---------- */
    function euBlock(u1) {
      var a1 = euAllais(AL.A1, u1), a2 = euAllais(AL.A2, u1), b1 = euAllais(AL.B1, u1), b2 = euAllais(AL.B2, u1);
      var wa = a1 > a2 + 1e-9 ? "G1" : (a2 > a1 + 1e-9 ? "G2" : "empate");
      var wb = b1 > b2 + 1e-9 ? "G1" : (b2 > b1 + 1e-9 ? "G2" : "empate");
      return tabla(["Utilidad esperada", "Gamble 1", "Gamble 2", "Gana"], [
        ["Escenario A", fmt(a1, 3), fmt(a2, 3), '<span class="w-win">' + wa + "</span>"],
        ["Escenario B", fmt(b1, 3), fmt(b2, 3), '<span class="w-win">' + wb + "</span>"]
      ]) + '<p class="w-cap">Con u(0) = 0 y u(5 M$) = 1. Al mover u(1 M$), los dos ganadores cambian a la vez y nunca sale G1 en A junto con G2 en B. El cambio ocurre en 10/11, casi 0,909.</p>';
    }

    function drawAllais(r, dis) {
      var h = "";
      h += '<div class="w-card"><span class="w-tag">Ejemplo del libro (10.5, pp. 530 y 531)</span>';
      h += "<h5>Dos apuestas, dos escenarios</h5>";
      h += tabla(["", "Gamble 1", "Gamble 2"], [
        ["Escenario A", "100 % de 1 M$", "10 % de 5 M$; 89 % de 1 M$; 1 % de 0"],
        ["Escenario B", "11 % de 1 M$; 89 % de 0", "10 % de 5 M$; 90 % de 0"]
      ]);
      h += "</div>";
      h += "<fieldset><legend>Escenario A: ¿qué prefieres?</legend>" + radios("aa", [["G1", "Gamble 1: 1 M$ seguro"], ["G2", "Gamble 2"]], r.a, dis) + "</fieldset>";
      h += "<fieldset><legend>Escenario B: ¿qué prefieres?</legend>" + radios("ab", [["G1", "Gamble 1"], ["G2", "Gamble 2"]], r.b, dis) + "</fieldset>";
      h += '<div class="w-btns"><button type="button" class="w-main w-check"' + (r.ok || !(r.a && r.b) ? " disabled" : "") + ">Comparar</button>" +
        '<button type="button" class="w-reset">Reiniciar esta paradoja</button></div>';
      h += '<div class="w-res" aria-live="polite"></div>';
      return h;
    }

    function resAllais(r) {
      var h = "", pareja = r.a + "," + r.b, ok = r.a === r.b;
      if (pareja === "G1,G2") {
        h += '<div class="w-row w-no"><b>Tu pareja (G1 en A, G2 en B) es la que el libro describe como la más común, y no cabe en la utilidad esperada.</b><br>La independencia exige elegir lo mismo en los dos escenarios, porque tras quitar la parte común sale el mismo juego reducido (p. 531). No es un fallo tuyo: el libro plantea que quizá el fallo esté en los axiomas.</div>';
      } else if (pareja === "G2,G1") {
        h += '<div class="w-row w-no"><b>Tu pareja (G2 en A, G1 en B) tampoco cabe en la utilidad esperada.</b><br>Exigiría u(1 M$) por debajo de 10/11 para preferir G2 en A y por encima para preferir G1 en B. Es una pareja poco habitual.</div>';
      } else if (pareja === "G1,G1") {
        h += '<div class="w-row w-ok"><b>Tu pareja (G1, G1) cabe en la utilidad esperada.</b><br>Encaja con una u muy cóncava: u(1 M$) por encima de 10/11 de u(5 M$). Es consistente, aunque no es la elección más común que describe el libro.</div>';
      } else {
        h += '<div class="w-row w-ok"><b>Tu pareja (G2, G2) cabe en la utilidad esperada.</b><br>Encaja con una u(1 M$) por debajo de 10/11 de u(5 M$). Eres consistente, y es un patrón distinto del más común que describe el libro (G1 en A, G2 en B).</div>';
      }
      h += "<h5>Prueba con la utilidad esperada</h5>";
      h += '<div class="w-sl"><label for="' + id + '-u1">u(1 M$) =</label>' +
        '<input type="range" id="' + id + '-u1" min="0" max="1" step="0.01" value="' + r.u1 + '">' +
        '<output for="' + id + '-u1">' + fmt(r.u1, 2) + "</output></div>";
      h += '<div class="w-eu">' + euBlock(r.u1) + "</div>";
      var a1 = VV(AL.A1), a2 = VV(AL.A2), b1 = VV(AL.B1), b2 = VV(AL.B2);
      h += "<h5>Qué teoría lo explica: la teoría de las perspectivas</h5>";
      h += tabla(["Con parámetros ilustrativos", "Gamble 1", "Gamble 2", "Gana"], [
        ["Escenario A", fmt(a1, 2), fmt(a2, 2), '<span class="w-win">' + (a1 > a2 ? "G1" : "G2") + "</span>"],
        ["Escenario B", fmt(b1, 2), fmt(b2, 2), '<span class="w-win">' + (b1 > b2 ? "G1" : "G2") + "</span>"]
      ]);
      h += '<div class="w-note">Lectura propia. Cambia la fórmula: en lugar de multiplicar cada resultado por su probabilidad, la multiplica por un peso de decisión w(p). Con estos parámetros, w(1) = 1 pero w(0,89) = ' + fmt(wt(0.89, P.g), 2) +
        ": la certeza pesa más que cualquier trozo de probabilidad casi segura. Por eso gana G1 en A y G2 en B: es el patrón que la utilidad esperada no puede dar. El libro describe estos pesos (pp. 534 y 535) y menciona también evitar el arrepentimiento (p. 532). Los valores de alfa y g son propios, y con los medios de 1992 este patrón no sale: en el otro simulador puedes moverlos.</div>";
      return { html: h, ok: ok };
    }

    /* ---------- Encuadre ---------- */
    function drawEncuadre(r, dis) {
      var h = "";
      h += '<div class="w-card"><span class="w-tag">Ejemplo del libro (10.5, pp. 532 y 533)</span>';
      h += "<h5>Una enfermedad amenaza a 600 personas</h5>";
      h += "<p>Eres responsable sanitario y decides entre dos políticas. Las dos preguntas se presentan por separado, con palabras distintas.</p></div>";
      h += "<fieldset><legend>Situación A (en vidas salvadas)</legend>" + radios("ea", [["1", "Política A1: se salvan 200 personas con seguridad"], ["2", "Política A2: 1/3 de probabilidad de salvar a las 600, 2/3 de no salvar a nadie"]], r.a, dis) + "</fieldset>";
      h += "<fieldset><legend>Situación B (en muertes)</legend>" + radios("eb", [["1", "Política B1: 400 personas mueren con seguridad"], ["2", "Política B2: 1/3 de probabilidad de que no muera nadie, 2/3 de que mueran las 600"]], r.b, dis) + "</fieldset>";
      h += '<div class="w-btns"><button type="button" class="w-main w-check"' + (r.ok || !(r.a && r.b) ? " disabled" : "") + ">Comparar</button>" +
        '<button type="button" class="w-reset">Reiniciar esta paradoja</button></div>';
      h += '<div class="w-res" aria-live="polite"></div>';
      return h;
    }

    function resEncuadre(r) {
      var h = "", ok = r.a === r.b;
      if (r.a === "1" && r.b === "2") {
        h += '<div class="w-row w-no"><b>Tu pareja (A1 y B2) es la que el libro describe como la tendencia de los participantes, y no cabe en la utilidad esperada.</b><br>A1 y B1 son la misma política (200 vivos, 400 muertos), y A2 y B2 la misma lotería. Elegir A1 y B2 es cambiar de opción por cambiar las palabras.</div>';
      } else if (ok) {
        h += '<div class="w-row w-ok"><b>Tu pareja (' + (r.a === "1" ? "A1 y B1" : "A2 y B2") + ") cabe en la utilidad esperada.</b><br>Has elegido la misma política en los dos encuadres. " +
          (r.a === "1" ? "Encaja con un agente que prefiere lo seguro (u cóncava)." : "Encaja con un agente que prefiere la lotería (u convexa).") + " Es consistente, aunque no es la tendencia que describe el libro.</div>";
      } else {
        h += '<div class="w-row w-no"><b>Tu pareja (A2 y B1) no cabe en la utilidad esperada.</b><br>Es la inversa de la tendencia descrita en el libro. Sigue siendo un cambio de política por cambio de palabras.</div>';
      }
      h += "<h5>Es el mismo problema</h5>";
      h += tabla(["", "Política segura", "Política de riesgo"], [
        ["Situación A", "Se salvan 200 (y mueren 400)", "1/3: se salvan 600. 2/3: no se salva nadie"],
        ["Situación B", "Mueren 400 (y se salvan 200)", "1/3: no muere nadie. 2/3: mueren 600"]
      ]);
      h += '<p class="w-cap">Vidas esperadas salvadas: 200 en la segura y 1/3 × 600 = 200 en la de riesgo, en las dos situaciones.</p>';
      var a1 = VV(FR.A1), a2 = VV(FR.A2), b1 = VV(FR.B1), b2 = VV(FR.B2);
      h += "<h5>Qué teoría lo explica: la fase de edición de la teoría de las perspectivas</h5>";
      h += tabla(["Con parámetros ilustrativos", "Política segura", "Política de riesgo", "Gana"], [
        ["Situación A (ganancias)", fmt(a1, 1), fmt(a2, 1), '<span class="w-win">' + (a1 > a2 ? "segura (A1)" : "riesgo (A2)") + "</span>"],
        ["Situación B (pérdidas)", fmt(b1, 1), fmt(b2, 1), '<span class="w-win">' + (b1 > b2 ? "segura (B1)" : "riesgo (B2)") + "</span>"]
      ]);
      h += '<div class="w-note">En la fase de edición, cada encuadre fija un punto de referencia distinto: en A los resultados son ganancias (vidas salvadas), en B son pérdidas (muertes). La función de valor es cóncava en ganancias, con aversión al riesgo, y convexa en pérdidas, con búsqueda de riesgo (p. 534). Por eso el mismo problema da lo seguro en A y la lotería en B. Aquí basta la función de valor: el patrón también sale con pesos sin distorsión (g = 1), mientras alfa sea menor que 1.</div>';
      return { html: h, ok: ok };
    }

    /* ---------- Equidad ---------- */
    function drawEquidad(r, dis) {
      var h = "";
      h += '<div class="w-card"><span class="w-tag">Ejemplo del libro (10.5, pp. 531 y 532)</span>';
      h += "<h5>El testamento de Rachel</h5>";
      h += "<p>Rachel debe dejarlo todo a una sola persona. Le da igual que sea su hijo o su hija, pero quiere tratarlos por igual. Hay un 50 % de probabilidad de que la ley cambie y lo lleve todo al hijo, diga lo que diga el testamento.</p></div>";
      h += "<fieldset><legend>Si fueras Rachel, ¿qué eliges?</legend>" + radios("q", [["LF", "Dejarlo todo a la hija: la hija se lo queda con 50 % y el hijo con 50 % (lotería justa)"], ["LU", "Dejarlo todo al hijo: el hijo se lo queda con 100 % (lotería injusta)"], ["ID", "Me da igual: las dos loterías me parecen equivalentes"]], r.a, dis) + "</fieldset>";
      h += '<div class="w-btns"><button type="button" class="w-main w-check"' + (r.ok || !r.a ? " disabled" : "") + ">Comparar</button>" +
        '<button type="button" class="w-reset">Reiniciar esta paradoja</button></div>';
      h += '<div class="w-res" aria-live="polite"></div>';
      return h;
    }

    function resEquidad(r) {
      var h = "", ok = r.a !== "LF";
      if (r.a === "LF") {
        h += '<div class="w-row w-no"><b>Preferir la lotería justa no cabe en la utilidad esperada.</b><br>Si Rachel es indiferente entre "todo al hijo" y "todo a la hija" con seguridad, la independencia dice que también lo es entre las dos loterías, porque salen de mezclar cada opción con la misma otra. Quien valora la equidad rompe esa indiferencia y elige la justa (p. 532).</div>';
      } else {
        h += '<div class="w-row w-ok"><b>' + (r.a === "ID" ? "Ser indiferente entre las dos loterías cabe en la utilidad esperada." : "Elegir la lotería injusta cabe en la utilidad esperada.") + "</b><br>Cabe si lo único que te importa es quién se queda al final con la herencia. Si te importa además cómo se reparte la posibilidad, eso también cuenta, y la independencia no lo permite (p. 532).</div>";
      }
      h += '<div class="w-note"><b>Qué teoría lo explica.</b> El libro no ofrece aquí un modelo con fórmula. Dice que la independencia choca con la equidad porque nos importa qué más podía haber ocurrido: hacemos juicios que consideran el conjunto de posibilidades y no cada resultado por separado (p. 531). Es una violación de otro tipo que las dos anteriores. Lectura propia: la teoría de las perspectivas no la resuelve, y sirve como recordatorio de que un valor moral puede ser la razón de romper un axioma.</div>';
      return { html: h, ok: ok };
    }

    var DRAW = { allais: drawAllais, encuadre: drawEncuadre, equidad: drawEquidad };
    var RES = { allais: resAllais, encuadre: resEncuadre, equidad: resEquidad };

    function drawBody() {
      var t = TABS[cur].id, r = st[t];
      body.innerHTML = DRAW[t](r, r.ok ? " disabled" : "");
      var btn = body.querySelector(".w-check");
      body.querySelectorAll("input[type=radio]").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var k = inp.name.slice(id.length + 1);
          if (t === "equidad") r.a = inp.value;
          else if (k.charAt(1) === "a") r.a = inp.value;
          else r.b = inp.value;
          btn.disabled = t === "equidad" ? !r.a : !(r.a && r.b);
        });
      });
      btn.addEventListener("click", function () {
        r.ok = true;
        drawAll();
      });
      body.querySelector(".w-reset").addEventListener("click", function () {
        st[t] = t === "allais" ? { a: null, b: null, ok: false, u1: 0.95 } : (t === "encuadre" ? { a: null, b: null, ok: false } : { a: null, ok: false });
        drawAll();
      });
      if (r.ok) showResult();
    }

    function showResult() {
      var t = TABS[cur].id, r = st[t], box = body.querySelector(".w-res"), res = RES[t](r);
      box.innerHTML = res.html;
      var sl = box.querySelector("input[type=range]");
      if (sl) {
        sl.addEventListener("input", function () {
          r.u1 = parseFloat(sl.value);
          box.querySelector("output").textContent = fmt(r.u1, 2);
          box.querySelector(".w-eu").innerHTML = euBlock(r.u1);
        });
      }
    }

    function drawSummary() {
      var n = 0, cons = 0, html = "";
      html += '<div class="w-tw"><table><caption class="w-sr">Tus elecciones en cada paradoja</caption><thead><tr><th>Paradoja</th><th>Tus elecciones</th><th>¿Coherente?</th></tr></thead><tbody>';
      TABS.forEach(function (t) {
        var r = st[t.id], txt = "·", okc = "·";
        if (r.ok) {
          var res = RES[t.id](r);
          n++;
          if (res.ok) cons++;
          if (t.id === "equidad") txt = r.a === "LF" ? "Lotería justa" : "Lotería injusta";
          else if (t.id === "encuadre") txt = "A" + r.a + " y B" + r.b;
          else txt = r.a + " y " + r.b;
          okc = res.ok ? "Sí" : "No";
        }
        html += "<tr><td>" + esc(t.nombre) + "</td><td>" + esc(txt) + "</td><td>" + okc + "</td></tr>";
      });
      html += "</tbody></table></div>";
      html += '<p class="w-cap">' + (n === 0
        ? "La tabla se rellena al comparar cada paradoja."
        : "Paradojas en las que tu elección es coherente con la utilidad esperada: " + cons + " de " + n + ". No es una nota: el libro sostiene que salirse de la utilidad esperada es habitual y no siempre es un error.") + "</p>";
      sum.innerHTML = html;
    }

    function drawAll() { drawNav(); drawBody(); drawSummary(); }
    drawAll();
  };
})();
