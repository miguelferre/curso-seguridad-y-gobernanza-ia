/* Simulador "m11-l03-prospecto": la función de valor y la función de pesos de la teoría de las perspectivas
   (libro 10.5, pp. 533 a 536) con tres deslizadores (alfa, lambda y g). En cada cambio se recalcula si el modelo
   reproduce el patrón humano en la paradoja de Allais y en el encuadre de las 600 personas.
   Las formas concretas, v(x) = x^alfa en ganancias y -lambda·|x|^alfa en pérdidas, y w(p) = p^g / (p^g + (1-p)^g)^(1/g),
   son propias: el libro solo dice que la función de valor tiene forma de S, más empinada en pérdidas, y que la de pesos
   sobrepondera lo poco probable (pp. 534 y 535), sin dar fórmula ni valores. Los valores iniciales, alfa 0,5, lambda 2,25
   y g 0,4, son ilustrativos y elegidos aquí para que el patrón salga (lambda coincide con el de Tversky y Kahneman, 1992).
   El botón "Valores de 1992" carga alfa 0,88, lambda 2,25 y g 0,61 (Tversky y Kahneman, 1992, añadido externo): con ellos
   Allais no sale y el encuadre sí, en la fórmula del libro y en la versión acumulativa (comprobado en Python).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var INI = { a: 0.5, lam: 2.25, g: 0.4 };

  function wt(p, g) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    var pg = Math.pow(p, g);
    return pg / Math.pow(pg + Math.pow(1 - p, g), 1 / g);
  }
  function vv(x, a, lam) {
    return x >= 0 ? Math.pow(x, a) : -lam * Math.pow(-x, a);
  }
  function VV(l, P) {
    var s = 0;
    l.forEach(function (t) { s += wt(t[0], P.g) * vv(t[1], P.a, P.lam); });
    return s;
  }
  function fmt(x, d) { return x.toFixed(d).replace(".", ","); }

  var AL = {
    A1: [[1, 1]],
    A2: [[0.10, 5], [0.89, 1], [0.01, 0]],
    B1: [[0.11, 1], [0.89, 0]],
    B2: [[0.10, 5], [0.90, 0]]
  };
  var FR = {
    A1: [[1, 200]],
    A2: [[1 / 3, 600], [2 / 3, 0]],
    B1: [[1, -400]],
    B2: [[1 / 3, 0], [2 / 3, -600]]
  };

  function quien(x, y, n1, n2) {
    if (Math.abs(x - y) < 1e-9) return "empate";
    return x > y ? n1 : n2;
  }

  function injectStyle() {
    if (document.getElementById("w-m11l03q-style")) return;
    var st = document.createElement("style");
    st.id = "w-m11l03q-style";
    st.textContent = [
      ".w-pq{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pq h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pq h5{font:600 1rem/1.3 var(--cond);margin:.6rem 0 .3rem;color:var(--accent-ink)}",
      ".w-pq .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pq button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-pq button:hover{background:var(--accent-soft)}",
      ".w-pq .w-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.6rem 1rem;margin:0 0 .6rem}",
      ".w-pq .w-ctl label{display:block;font:600 .84rem var(--cond)}",
      ".w-pq .w-ctl input{width:100%;accent-color:var(--accent)}",
      ".w-pq .w-ctl output{font:600 .86rem var(--mono);color:var(--accent-ink)}",
      ".w-pq .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.3rem 0 .8rem}",
      ".w-pq .w-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:.8rem;margin:0 0 .6rem}",
      ".w-pq .w-charts figure{margin:0;background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.4rem}",
      ".w-pq .w-charts figcaption{font-size:.78rem;color:var(--muted);margin:.2rem .3rem 0}",
      ".w-pq svg{display:block;width:100%;height:auto}",
      ".w-pq .w-tw{overflow-x:auto;margin:0 0 .6rem}",
      ".w-pq table{border-collapse:collapse;width:100%;min-width:24rem;font-size:.84rem}",
      ".w-pq th,.w-pq td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:left;vertical-align:top}",
      ".w-pq th{background:var(--accent-soft);font:600 .74rem/1.25 var(--cond)}",
      ".w-pq td.w-win{font-weight:700}",
      ".w-pq .w-row{border-left:4px solid var(--rule-strong);background:var(--ground);border-radius:0 8px 8px 0;padding:.45rem .7rem;margin:0 0 .5rem}",
      ".w-pq .w-row.w-ok{border-left-color:var(--ex)}",
      ".w-pq .w-row.w-no{border-left-color:var(--trap)}",
      ".w-pq .w-row b{font-family:var(--cond)}",
      ".w-pq .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-pq .w-sr{position:absolute;left:-9999px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function chartV(P) {
    var W = 300, H = 230, L = 34, R = 292, T = 12, B = 216, XM = 10;
    var ymax = Math.max(vv(XM, P.a, P.lam), -vv(-XM, P.a, P.lam), 1);
    function X(x) { return L + (x + XM) / (2 * XM) * (R - L); }
    function Y(y) { return T + (ymax - y) / (2 * ymax) * (B - T); }
    var d = "", i, x;
    for (i = 0; i <= 200; i++) {
      x = -XM + i * (2 * XM) / 200;
      d += (i ? "L" : "M") + X(x).toFixed(1) + " " + Y(vv(x, P.a, P.lam)).toFixed(1);
    }
    var lin = "M" + X(-XM).toFixed(1) + " " + Y(-XM).toFixed(1) + "L" + X(XM).toFixed(1) + " " + Y(XM).toFixed(1);
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Función de valor: ganancias y pérdidas respecto al punto de referencia" style="font-family:var(--sans)">' +
      '<line x1="' + L + '" y1="' + Y(0).toFixed(1) + '" x2="' + R + '" y2="' + Y(0).toFixed(1) + '" style="stroke:var(--rule-strong)"/>' +
      '<line x1="' + X(0).toFixed(1) + '" y1="' + T + '" x2="' + X(0).toFixed(1) + '" y2="' + B + '" style="stroke:var(--rule-strong)"/>' +
      '<path d="' + lin + '" style="fill:none;stroke:var(--faint);stroke-width:1;stroke-dasharray:4 3"/>' +
      '<path d="' + d + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>' +
      '<text x="' + (R - 2) + '" y="' + (Y(0) - 5).toFixed(1) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">ganancia</text>' +
      '<text x="' + (L + 2) + '" y="' + (Y(0) + 12).toFixed(1) + '" style="fill:var(--muted);font-size:10px">pérdida</text>' +
      '<text x="' + (X(0) + 4).toFixed(1) + '" y="' + (T + 9) + '" style="fill:var(--muted);font-size:10px">valor v</text>' +
      "</svg>";
  }

  function chartW(P) {
    var W = 300, H = 230, L = 34, R = 292, T = 12, B = 216;
    function X(p) { return L + p * (R - L); }
    function Y(y) { return B - y * (B - T); }
    var d = "", i, p;
    for (i = 0; i <= 200; i++) {
      p = i / 200;
      d += (i ? "L" : "M") + X(p).toFixed(1) + " " + Y(wt(p, P.g)).toFixed(1);
    }
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Función de pesos: peso de decisión frente a probabilidad" style="font-family:var(--sans)">' +
      '<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" style="fill:none;stroke:var(--rule-strong)"/>' +
      '<path d="M' + X(0) + " " + Y(0) + "L" + X(1) + " " + Y(1) + '" style="fill:none;stroke:var(--faint);stroke-width:1;stroke-dasharray:4 3"/>' +
      '<path d="' + d + '" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>' +
      '<text x="' + (R - 2) + '" y="' + (B - 4) + '" text-anchor="end" style="fill:var(--muted);font-size:10px">probabilidad p</text>' +
      '<text x="' + (L + 4) + '" y="' + (T + 11) + '" style="fill:var(--muted);font-size:10px">peso w(p)</text>' +
      "</svg>";
  }

  window.WIDGETS["m11-l03-prospecto"] = function (el) {
    injectStyle();
    var id = "w-pq-" + (++uid);
    var P = { a: INI.a, lam: INI.lam, g: INI.g };

    el.innerHTML = '<div class="w-pq">' +
      "<h4>La teoría de las perspectivas por dentro</h4>" +
      '<p class="w-hint">Mueve los tres parámetros y mira cómo cambian las curvas y si el modelo reproduce lo que hace la gente en Allais y en el encuadre. Los valores iniciales son propios e ilustrativos (lambda coincide con el de Tversky y Kahneman, 1992); el botón de 1992 carga los valores medios de la literatura.</p>' +
      '<div class="w-ctl">' +
      '<div><label for="' + id + '-a">Curvatura alfa <output for="' + id + '-a"></output></label><input type="range" id="' + id + '-a" min="0.2" max="1" step="0.01"></div>' +
      '<div><label for="' + id + '-l">Aversión a la pérdida lambda <output for="' + id + '-l"></output></label><input type="range" id="' + id + '-l" min="1" max="4" step="0.05"></div>' +
      '<div><label for="' + id + '-g">Distorsión de la probabilidad g <output for="' + id + '-g"></output></label><input type="range" id="' + id + '-g" min="0.3" max="1" step="0.01"></div>' +
      "</div>" +
      '<div class="w-btns"><button type="button" class="w-ini">Valores iniciales</button>' +
      '<button type="button" class="w-tk">Valores de 1992 (alfa 0,88, lambda 2,25, g 0,61)</button>' +
      '<button type="button" class="w-eu">Sin distorsión (alfa 1, lambda 1, g 1)</button></div>' +
      '<div class="w-charts"><figure><div class="w-cv"></div><figcaption>Función de valor: discontinua, la recta v(x) = x. Cuanto más se curva la línea, más cambia lo que vale cada ganancia adicional.</figcaption></figure>' +
      '<figure><div class="w-cw"></div><figcaption>Función de pesos: discontinua, la diagonal w(p) = p de la utilidad esperada. Lo poco probable se sobrepondera y lo muy probable se infrapondera.</figcaption></figure></div>' +
      '<div class="w-out" aria-live="polite"></div>' +
      "</div>";

    var sa = el.querySelector("#" + id + "-a"), sl = el.querySelector("#" + id + "-l"), sg = el.querySelector("#" + id + "-g");
    var oa = el.querySelector('output[for="' + id + '-a"]'), ol = el.querySelector('output[for="' + id + '-l"]'), og = el.querySelector('output[for="' + id + '-g"]');
    var cv = el.querySelector(".w-cv"), cw = el.querySelector(".w-cw"), out = el.querySelector(".w-out");

    function fila(nom, x, y, n1, n2) {
      return "<tr><td>" + nom + "</td><td>" + fmt(x, 2) + "</td><td>" + fmt(y, 2) + '</td><td class="w-win">' + quien(x, y, n1, n2) + "</td></tr>";
    }

    function update() {
      P.a = parseFloat(sa.value); P.lam = parseFloat(sl.value); P.g = parseFloat(sg.value);
      oa.textContent = fmt(P.a, 2); ol.textContent = fmt(P.lam, 2); og.textContent = fmt(P.g, 2);
      cv.innerHTML = chartV(P);
      cw.innerHTML = chartW(P);
      var a1 = VV(AL.A1, P), a2 = VV(AL.A2, P), b1 = VV(AL.B1, P), b2 = VV(AL.B2, P);
      var f1 = VV(FR.A1, P), f2 = VV(FR.A2, P), g1 = VV(FR.B1, P), g2 = VV(FR.B2, P);
      var wa = quien(a1, a2, "G1", "G2"), wb = quien(b1, b2, "G1", "G2");
      var fa = quien(f1, f2, "segura", "riesgo"), fb = quien(g1, g2, "segura", "riesgo");
      var patAl = wa === "G1" && wb === "G2", patFr = fa === "segura" && fb === "riesgo";
      var is92 = Math.abs(P.a - 0.88) < 0.005 && Math.abs(P.lam - 2.25) < 0.005 && Math.abs(P.g - 0.61) < 0.005;
      var h = "";
      h += "<h5>Allais (en millones de dólares)</h5>";
      h += '<div class="w-tw"><table><caption class="w-sr">Valores de la paradoja de Allais</caption><thead><tr><th>Escenario</th><th>Gamble 1</th><th>Gamble 2</th><th>Gana</th></tr></thead><tbody>' +
        fila("A", a1, a2, "G1", "G2") + fila("B", b1, b2, "G1", "G2") + "</tbody></table></div>";
      h += '<div class="w-row ' + (patAl ? "w-ok" : "w-no") + '"><b>' + (patAl ? "Reproduce el patrón humano: G1 en A y G2 en B." : "No reproduce el patrón humano (G1 en A y G2 en B).") + "</b><br>" +
        (P.g > 0.995 ? "Con g = 1 los pesos son las probabilidades y el modelo es una utilidad esperada con la función v: da la misma elección en A y en B, sea cual sea alfa." : (is92 ? "Con los valores medios de Tversky y Kahneman (1992), que no están en el libro, el patrón no sale: con alfa 0,88 los 5 M$ valen algo más de cuatro veces lo que 1 M$, y con g 0,61 perder la certeza pesa poco. Con alfa 0,88 haría falta g de 0,33 o menos." : "El patrón de Allais depende de que la probabilidad se distorsione; mueve g y busca dónde deja de salir.")) + "</div>";
      h += "<h5>Encuadre de las 600 personas (en personas)</h5>";
      h += '<div class="w-tw"><table><caption class="w-sr">Valores del problema del encuadre</caption><thead><tr><th>Situación</th><th>Política segura</th><th>Política de riesgo</th><th>Gana</th></tr></thead><tbody>' +
        fila("A (vidas salvadas)", f1, f2, "segura", "riesgo") + fila("B (muertes)", g1, g2, "segura", "riesgo") + "</tbody></table></div>";
      h += '<div class="w-row ' + (patFr ? "w-ok" : "w-no") + '"><b>' + (patFr ? "Reproduce la tendencia humana: segura en A, riesgo en B." : "No reproduce la tendencia humana (segura en A, riesgo en B).") + "</b><br>" +
        (patFr ? "Sale sobre todo de la curvatura de la función de valor (alfa menor que 1): cóncava en ganancias, con preferencia por lo seguro, y convexa en pérdidas, con preferencia por el riesgo. Con g = 1 sigue saliendo. Lambda no cambia quién gana aquí, porque escala igual las dos políticas en pérdidas." : (P.a > 0.995 && P.g > 0.995 ? "Sin curvatura (alfa = 1) y sin distorsión de los pesos (g = 1) el modelo es un valor esperado lineal: las dos políticas empatan en cada situación y el encuadre no produce ningún cambio." : "Con estos valores no sale segura en A y riesgo en B. Prueba a bajar alfa: la curvatura de la función de valor es lo que produce este patrón.")) + "</div>";
      h += '<p class="w-cap">Pesos con los valores actuales: w(0,10) = ' + fmt(wt(0.10, P.g), 2) + "; w(0,11) = " + fmt(wt(0.11, P.g), 2) + "; w(0,89) = " + fmt(wt(0.89, P.g), 2) + "; w(1) = 1. En el encuadre no cuentan las mismas probabilidades: 1/3 y 2/3.</p>";
      out.innerHTML = h;
    }

    function setVals(a, l, g) {
      sa.value = a; sl.value = l; sg.value = g;
      update();
    }
    [sa, sl, sg].forEach(function (s) { s.addEventListener("input", update); });
    el.querySelector(".w-ini").addEventListener("click", function () { setVals(INI.a, INI.lam, INI.g); });
    el.querySelector(".w-eu").addEventListener("click", function () { setVals(1, 1, 1); });
    el.querySelector(".w-tk").addEventListener("click", function () { setVals(0.88, 2.25, 0.61); });
    setVals(INI.a, INI.lam, INI.g);
  };
})();
