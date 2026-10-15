/* Simulador "m08-l04-agregacion": varias personas, varias politicas y cuatro reglas para juntar el bienestar.
   Reglas: suma (utilitarista), suma de logaritmos en base 2 (prioritaria continua), isoelastica con alfa a mano y minimo (Rawls).
   Formulas del libro (6.8, pp. 343, 349 y 350): W = suma de w; W = suma de log2 w; W = 1/(1-alfa) * suma de w^(1-alfa); W = min w.
   Los escenarios son propios (el de plazas sanitarias, con cifras inventadas) o del libro (Tabla 6.2, el ayuntamiento).
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var EPS = 1e-9;

  var PRESETS = {
    sanidad: {
      etiqueta: "Plazas de tratamiento (propio)",
      pie: "Ejemplo propio con cifras inventadas: bienestar esperado a un año, de 0,5 a 10. El paciente A es el más grave y el que menos gana si se prioriza el máximo beneficio. Cuánto bienestar tiene cada uno es el problema de la lección anterior; aquí se dan por buenos.",
      personas: ["Paciente A", "Paciente B", "Paciente C", "Paciente D"],
      politicas: [
        { n: "Máximo beneficio", v: [2, 8, 9, 9] },
        { n: "Los más graves primero", v: [6, 6, 6, 5] },
        { n: "Mixta", v: [4, 7, 7, 8] },
        { n: "Orden de llegada", v: [3, 6, 8, 8] }
      ]
    },
    ayto: {
      etiqueta: "Ayuntamiento (ejemplo del libro)",
      pie: "Ejemplo del libro (Tabla 6.2, p. 343): tres personas y tres proyectos municipales.",
      personas: ["Ana", "Ben", "Cara"],
      politicas: [
        { n: "Clínica", v: [6, 8, 4] },
        { n: "Programa educativo", v: [8, 6, 5] },
        { n: "Parque", v: [3, 7, 10] }
      ]
    }
  };

  function copia(p) {
    return { etiqueta: p.etiqueta, pie: p.pie, personas: p.personas.slice(),
      politicas: p.politicas.map(function (q) { return { n: q.n, v: q.v.slice() }; }) };
  }

  function iso(v, a) {
    var s = 0, i;
    if (Math.abs(a - 1) < 1e-9) { for (i = 0; i < v.length; i++) s += Math.log(v[i]) / Math.LN2; return s; }
    for (i = 0; i < v.length; i++) s += Math.pow(v[i], 1 - a);
    return s / (1 - a);
  }
  function suma(v) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i]; return s; }
  function minimo(v) { return Math.min.apply(null, v); }

  function ganadoras(vals) {
    var m = Math.max.apply(null, vals), r = [], tol = Math.abs(m) * 1e-9 + 1e-300;
    for (var i = 0; i < vals.length; i++) if (vals[i] >= m - tol) r.push(i);
    return r;
  }

  function calc(pol, alfa) {
    var f = pol.map(function (q) {
      return { suma: suma(q.v), log: iso(q.v, 1), iso: iso(q.v, alfa), min: minimo(q.v) };
    });
    var w = {};
    ["suma", "log", "iso", "min"].forEach(function (k) { w[k] = ganadoras(f.map(function (x) { return x[k]; })); });
    return { f: f, w: w };
  }

  function claveAlfa(pol, a) {
    return ganadoras(pol.map(function (q) { return iso(q.v, a); })).join(",");
  }

  /* Barrido de alfa: tramos en los que gana cada politica. Los cortes se afinan por biseccion. */
  function tramos(pol) {
    var paso = 0.02, max = 12, out = [], ini = 0, prev = claveAlfa(pol, 0), a;
    for (a = paso; a <= max + 1e-9; a += paso) {
      var k = claveAlfa(pol, a);
      if (k !== prev) {
        var lo = a - paso, hi = a;
        for (var i = 0; i < 30; i++) {
          var mid = (lo + hi) / 2;
          if (claveAlfa(pol, mid) === prev) lo = mid; else hi = mid;
        }
        out.push({ desde: ini, hasta: hi, gana: prev });
        ini = hi; prev = k;
      }
    }
    out.push({ desde: ini, hasta: null, gana: prev });
    return out;
  }

  window.WIDGETS["m08-l04-agregacion"] = build;
  build.calc = calc;
  build.tramos = tramos;
  build.PRESETS = PRESETS;

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }

  function injectStyle() {
    if (document.getElementById("w-m8a-style")) return;
    var st = document.createElement("style");
    st.id = "w-m8a-style";
    st.textContent = [
      ".w-m8a{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-m8a h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-m8a .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-m8a .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-m8a button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-m8a button:hover,.w-m8a button[aria-pressed=true]{background:var(--accent-soft)}",
      ".w-m8a .w-scroll{overflow-x:auto;margin:0 0 .8rem}",
      ".w-m8a table{border-collapse:collapse;width:100%;font-size:.86rem}",
      ".w-m8a th,.w-m8a td{border:1px solid var(--rule);padding:.3rem .5rem;text-align:center}",
      ".w-m8a th{font:600 .72rem/1.25 var(--mono);letter-spacing:.05em;text-transform:uppercase;color:var(--faint);background:var(--ground)}",
      ".w-m8a th[scope=row]{text-align:left}",
      ".w-m8a input[type=number]{width:4.2rem;font:inherit;padding:.2rem .3rem;border:1px solid var(--rule-strong);border-radius:6px;background:var(--ground);color:var(--ink);text-align:center}",
      ".w-m8a .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-m8a .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-m8a input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-m8a td.w-gana{background:var(--accent-soft);font-weight:700}",
      ".w-m8a .w-win{display:inline-block;margin-left:.3rem;padding:0 .35rem;border-radius:4px;background:var(--accent);color:var(--surface);font:600 .62rem/1.5 var(--mono);letter-spacing:.05em;text-transform:uppercase}",
      ".w-m8a svg{display:block;width:100%;height:auto;margin:0 0 .7rem;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-m8a .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-m8a .w-note p{margin:0 0 .4rem}.w-m8a .w-note p:last-child{margin:0}",
      ".w-m8a .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function nombresJuntos(pol, idx) {
    return idx.map(function (j) { return "«" + pol[j].n + "»"; }).join(" y ");
  }
  function iguales(a, b) { return a.join(",") === b.join(","); }
  function peor(v) { var m = minimo(v), i = v.indexOf(m); return i; }

  function build(el) {
    injectStyle();
    var id = "w-m8a-" + (++uid);
    var clave = "sanidad";
    var preset = PRESETS[clave];
    var pol = copia(preset);
    var alfa = 2;

    el.innerHTML = '<div class="w-m8a">' +
      '<h4>Agregación: qué política elige cada regla</h4>' +
      '<p class="w-hint">Cada columna es una política y cada fila una persona; la cifra es su bienestar si se aplica esa política. Cambia las cifras y mira qué política elige cada regla y por qué no coinciden.</p>' +
      '<div class="w-btns" role="group" aria-label="Escenario"><button type="button" id="' + id + '-p-sanidad" aria-pressed="true">' + PRESETS.sanidad.etiqueta + '</button>' +
      '<button type="button" id="' + id + '-p-ayto" aria-pressed="false">' + PRESETS.ayto.etiqueta + '</button>' +
      '<button type="button" id="' + id + '-reset">Restablecer cifras</button></div>' +
      '<div class="w-scroll"><table id="' + id + '-mat"></table></div>' +
      '<div class="w-f"><label for="' + id + '-a">Prioridad al peor situado, <span style="text-transform:none">α</span> <b id="' + id + '-av"></b></label>' +
      '<input type="range" id="' + id + '-a" min="0" max="8" step="0.1" value="' + alfa + '"></div>' +
      '<div class="w-scroll"><table id="' + id + '-res"></table></div>' +
      '<div class="w-scroll"><svg id="' + id + '-svg" viewBox="0 0 600 214" role="img" aria-label="" style="min-width:520px"></svg></div>' +
      '<div class="w-note" id="' + id + '-note" aria-live="polite"></div>' +
      '<p class="w-cap" id="' + id + '-cap"></p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var mat = $("mat"), res = $("res"), svg = $("svg"), inA = $("a");

    function pintaMatriz() {
      var h = '<thead><tr><th scope="col">Bienestar</th>';
      pol.politicas.forEach(function (q) { h += '<th scope="col">' + q.n + '</th>'; });
      h += '</tr></thead><tbody>';
      pol.personas.forEach(function (p, i) {
        h += '<tr><th scope="row">' + p + '</th>';
        pol.politicas.forEach(function (q, j) {
          h += '<td><input type="number" min="0.5" max="10" step="0.5" value="' + q.v[i] + '" data-i="' + i + '" data-j="' + j +
            '" aria-label="Bienestar de ' + p + ' con la política ' + q.n + '"></td>';
        });
        h += '</tr>';
      });
      mat.innerHTML = h + '</tbody>';
    }

    function pintaBarras(r) {
      var n = pol.politicas.length, np = pol.personas.length, gw = 580 / n, bw = Math.min(28, (gw - 24) / np), o = [], base = 150, esc = 11;
      var resumen = [];
      o.push('<line x1="10" y1="' + base + '" x2="590" y2="' + base + '" style="stroke:var(--rule-strong);stroke-width:1.5"/>');
      pol.politicas.forEach(function (q, j) {
        var x0 = 10 + j * gw + (gw - bw * np) / 2, m = minimo(q.v), tags = [], lin, nm = q.n.split(" "), lines = [], cur = "";
        if (r.w.suma.indexOf(j) >= 0) tags.push("S");
        if (r.w.log.indexOf(j) >= 0) tags.push("L");
        if (r.w.iso.indexOf(j) >= 0 && alfa !== 0 && Math.abs(alfa - 1) > 1e-9) tags.push("α");
        if (r.w.min.indexOf(j) >= 0) tags.push("M");
        q.v.forEach(function (v, i) {
          var hgt = v * esc, x = x0 + i * bw;
          o.push('<rect x="' + (x + 2).toFixed(1) + '" y="' + (base - hgt).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="2" style="fill:' + (v <= m + EPS ? "var(--trap)" : "var(--accent)") + '"/>');
          o.push('<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base - hgt - 3).toFixed(1) + '" text-anchor="middle" style="fill:currentColor;font-size:10px">' + fmt(v, v % 1 ? 1 : 0) + '</text>');
          o.push('<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base + 12) + '" text-anchor="middle" style="fill:var(--muted);font-size:9.5px">' + pol.personas[i].replace(/^Paciente /, "") + '</text>');
        });
        nm.forEach(function (w) { if ((cur + " " + w).trim().length > 16 && cur) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); });
        lines.push(cur);
        lines.slice(0, 3).forEach(function (t, k) {
          o.push('<text x="' + (10 + j * gw + gw / 2).toFixed(1) + '" y="' + (base + 28 + k * 12) + '" text-anchor="middle" style="fill:currentColor;font-size:11px;font-weight:600">' + t + '</text>');
        });
        if (tags.length) o.push('<text x="' + (10 + j * gw + gw / 2).toFixed(1) + '" y="18" text-anchor="middle" style="fill:var(--accent-ink);font-size:13px;font-weight:700">' + tags.join(" · ") + '</text>');
        resumen.push(q.n + ": " + (tags.length ? "elegida por " + tags.join(", ") : "no elegida"));
      });
      svg.innerHTML = o.join("");
      svg.setAttribute("aria-label", "Bienestar de cada persona en cada política. " + resumen.join(". ") + ".");
    }

    function pintaResultados(r) {
      var h = '<thead><tr><th scope="col">Política</th><th scope="col">Suma</th><th scope="col">Logaritmo (base 2)</th><th scope="col">Isoelástica (<span style="text-transform:none">α</span> = ' + fmt(alfa, 1) +
        ')</th><th scope="col">Mínimo</th></tr></thead><tbody>';
      pol.politicas.forEach(function (q, j) {
        function celda(k, d) {
          var g = r.w[k].indexOf(j) >= 0;
          return '<td' + (g ? ' class="w-gana"' : '') + '>' + fmt(r.f[j][k], d) + (g ? '<span class="w-win">elegida</span>' : '') + '</td>';
        }
        h += '<tr><th scope="row">' + q.n + '</th>' + celda("suma", 1) + celda("log", 2) + celda("iso", 3) + celda("min", 1) + '</tr>';
      });
      res.innerHTML = h + '</tbody>';
    }

    function pintaExplicacion(r) {
      var P = pol.politicas, ps = [], S = r.w.suma, L = r.w.log, M = r.w.min, t;
      var gS = S[0], gM = M[0], gL = L[0];
      if (iguales(S, L) && iguales(L, M)) {
        if (S.length === 1) {
          ps.push("Las tres reglas eligen " + nombresJuntos(P, S) + ": tiene a la vez el mayor total y el mejor peor caso (" + fmt(r.f[gS].suma, 1) + " de total, mínimo " + fmt(r.f[gS].min, 1) + "). Aquí no hay dilema. Sube o baja cifras hasta que lo haya.");
        } else {
          ps.push("Hay un empate entre " + nombresJuntos(P, S) + " en las tres reglas: con estas cifras da igual cuál se elija.");
        }
      } else {
        ps.push("La suma elige " + nombresJuntos(P, S) + " (total " + fmt(r.f[gS].suma, 1) + "): solo cuenta el total, así que acepta que " + pol.personas[peor(P[gS].v)] + " se quede en " + fmt(r.f[gS].min, 1) + ".");
        if (M.length > 1) ps.push("El mínimo empata entre " + nombresJuntos(P, M) + ": en todas el peor queda en " + fmt(r.f[gM].min, 1) + ", así que no distingue entre ellas.");
        else ps.push("El mínimo elige " + nombresJuntos(P, M) + ": solo mira a quien está peor y allí el peor queda en " + fmt(r.f[gM].min, 1) + ", frente a " + fmt(r.f[gS].min, 1) + " con la de la suma.");
        if (iguales(L, S)) ps.push("El logaritmo coincide con la suma: con estas cifras el peor situado no está lo bastante mal como para que su peso extra cambie la elección.");
        else if (iguales(L, M)) ps.push("El logaritmo coincide con el mínimo: pesa más a quien tiene menos y aquí eso basta para inclinar la balanza.");
        else ps.push("El logaritmo elige " + nombresJuntos(P, L) + ": una vía intermedia (total " + fmt(r.f[gL].suma, 1) + ", mínimo " + fmt(r.f[gL].min, 1) + "), que ni tiene el mayor total ni el mejor mínimo.");
        if (M.length === 1 && S.indexOf(gM) < 0) {
          var dT = r.f[gS].suma - r.f[gM].suma, dm = r.f[gM].min - r.f[gS].min;
          ps.push("Pasar de la elección de la suma a la del mínimo cuesta " + fmt(dT, 1) + " puntos de total y sube " + fmt(dm, 1) + " el bienestar del peor situado.");
        }
      }
      var tr = tramos(P.map(function (q) { return { n: q.n, v: q.v }; })), partes = tr.map(function (x) {
        var quien = x.gana.split(",").map(function (s) { return "«" + P[parseInt(s, 10)].n + "»"; }).join(" y ");
        return (x.hasta === null ? "desde α = " + fmt(x.desde, 2) : (x.desde === 0 ? "hasta α = " + fmt(x.hasta, 2) : "de α = " + fmt(x.desde, 2) + " a " + fmt(x.hasta, 2))) + " gana " + quien;
      });
      ps.push("Al girar el mando α de 0 (suma) hacia arriba (mínimo): " + partes.join("; ") + ".");
      t = "";
      ps.forEach(function (x) { t += "<p>" + x + "</p>"; });
      $("note").innerHTML = t;
    }

    function update() {
      var r = calc(pol.politicas, alfa);
      $("av").textContent = alfa === 0 ? "0 (suma)" : (Math.abs(alfa - 1) < 1e-9 ? "1 (logaritmo)" : fmt(alfa, 1));
      pintaResultados(r);
      pintaBarras(r);
      pintaExplicacion(r);
    }

    function cargar(k) {
      clave = k;
      preset = PRESETS[k];
      pol = copia(preset);
      $("p-sanidad").setAttribute("aria-pressed", k === "sanidad" ? "true" : "false");
      $("p-ayto").setAttribute("aria-pressed", k === "ayto" ? "true" : "false");
      $("cap").textContent = preset.pie + " Etiquetas sobre las barras: S = suma, L = logaritmo, α = isoelástica con el α elegido, M = mínimo. La barra roja es la de quien está peor en esa política.";
      pintaMatriz();
      update();
    }

    mat.addEventListener("input", function (ev) {
      var t = ev.target;
      if (!t || t.tagName !== "INPUT") return;
      var v = parseFloat(String(t.value).replace(",", "."));
      if (!isFinite(v)) return;
      v = Math.min(10, Math.max(0.5, v));
      pol.politicas[parseInt(t.getAttribute("data-j"), 10)].v[parseInt(t.getAttribute("data-i"), 10)] = v;
      update();
    });
    mat.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!t || t.tagName !== "INPUT") return;
      t.value = pol.politicas[parseInt(t.getAttribute("data-j"), 10)].v[parseInt(t.getAttribute("data-i"), 10)];
    });
    inA.addEventListener("input", function () { alfa = parseFloat(inA.value); update(); });
    $("p-sanidad").addEventListener("click", function () { cargar("sanidad"); });
    $("p-ayto").addEventListener("click", function () { cargar("ayto"); });
    $("reset").addEventListener("click", function () { cargar(clave); });
    cargar("sanidad");
  }
})();
