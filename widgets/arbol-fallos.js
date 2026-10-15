/* Widget "arbol-fallos": arbol de fallos pequeno y fijo con puertas Y y O.
   Los eventos basicos tienen probabilidad editable; calcula la del evento superior
   suponiendo independencia. Tambien lista los conjuntos minimos de corte y la sensibilidad.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  /* Ejemplo propio con cifras inventadas: p en %. */
  var TREE = {
    id: "T", tipo: "Y", txt: "Caso urgente sin atender a tiempo",
    hijos: [
      { id: "G2", tipo: "O", txt: "El modelo lo marca como no urgente", hijos: [
        { id: "B1", corto: "Error del modelo", txt: "Error del modelo", p: 2 },
        { id: "B2", corto: "Dato de laboratorio mal volcado", txt: "Dato de laboratorio mal volcado", p: 1 }
      ] },
      { id: "G3", tipo: "O", txt: "Nadie corrige la etiqueta a tiempo", hijos: [
        { id: "B3", corto: "Turno saturado, sin revisión", txt: "Turno saturado, sin revisión", p: 10 },
        { id: "G4", tipo: "Y", txt: "La alerta sale pero no basta", hijos: [
          { id: "B4", corto: "Alerta ignorada por fatiga", txt: "La alerta se ignora por fatiga", p: 30 },
          { id: "B5", corto: "Sin reevaluación a los 30 min", txt: "No hay reevaluación a los 30 minutos", p: 20 }
        ] }
      ] }
    ]
  };

  function injectStyle() {
    if (document.getElementById("w-af-style")) return;
    var st = document.createElement("style");
    st.id = "w-af-style";
    st.textContent = [
      ".w-af{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-af h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-af h5{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-af .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-af ul.w-tree,.w-af ul.w-tree ul{list-style:none;margin:0;padding:0}",
      ".w-af ul.w-tree ul{padding-left:.9rem;margin-left:.5rem;border-left:2px solid var(--rule-strong)}",
      ".w-af .w-node{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem .6rem;padding:.4rem .6rem;margin:.35rem 0;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-af .w-node.w-top{border-color:var(--accent);background:var(--accent-soft)}",
      ".w-af .w-gate{font:700 .78rem var(--mono);border-radius:6px;padding:.1rem .45rem;border:1.5px solid var(--accent);color:var(--accent-ink);background:var(--surface)}",
      ".w-af .w-gate.w-o{border-color:var(--trap);color:var(--trap)}",
      ".w-af .w-txt{flex:1 1 10rem;min-width:0}",
      ".w-af .w-p{font:600 .95rem var(--cond);color:var(--accent-ink);white-space:nowrap}",
      ".w-af .w-leaf label{font:600 .7rem var(--mono);color:var(--faint);margin-right:.3rem}",
      ".w-af input[type=text]{width:5rem;font:500 .95rem var(--mono);color:var(--ink);background:var(--surface);border:1px solid var(--rule-strong);border-radius:8px;padding:.3rem .45rem;text-align:right}",
      ".w-af input[aria-invalid=true]{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-af .w-err{color:var(--trap);font-weight:600;margin:.2rem 0 .4rem;min-height:1.2em}",
      ".w-af .w-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:.6rem 0}",
      ".w-af .w-res > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-af .w-res dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-af .w-res dd{margin:0;font:600 1.15rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-af button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-af button:hover{background:var(--accent-soft)}",
      ".w-af .w-tw{overflow-x:auto}",
      ".w-af table{border-collapse:collapse;width:100%;font-size:.86rem}",
      ".w-af th,.w-af td{text-align:left;padding:.3rem .5rem;border-bottom:1px solid var(--rule)}",
      ".w-af th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}",
      ".w-af td.w-n{text-align:right;font-family:var(--mono);white-space:nowrap}",
      ".w-af .w-cap{color:var(--faint);font-size:.76rem;margin:.6rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d }); }
  function pct(p) {
    var v = p * 100;
    if (v === 0) return "0 %";
    return fmt(v, v < 0.01 ? 5 : v < 1 ? 3 : 2) + " %";
  }
  function parse(s) {
    if (typeof s !== "string") return NaN;
    s = s.trim().replace(/\s/g, "").replace("%", "").replace(",", ".");
    if (s === "") return NaN;
    return Number(s);
  }

  function leaves(n, out) {
    if (!n.hijos) { out.push(n); return out; }
    n.hijos.forEach(function (h) { leaves(h, out); });
    return out;
  }
  function evalNode(n, v) {
    if (!n.hijos) return v[n.id];
    var vals = n.hijos.map(function (h) { return evalNode(h, v); }), i, r;
    if (n.tipo === "Y") { r = 1; for (i = 0; i < vals.length; i++) r *= vals[i]; return r; }
    r = 1; for (i = 0; i < vals.length; i++) r *= (1 - vals[i]);
    return 1 - r;
  }
  /* Conjuntos de corte (MOCUS) y minimizacion. */
  function cuts(n) {
    if (!n.hijos) return [[n.id]];
    var subs = n.hijos.map(cuts), res, i;
    if (n.tipo === "O") {
      res = [];
      subs.forEach(function (s) { res = res.concat(s); });
      return res;
    }
    res = [[]];
    for (i = 0; i < subs.length; i++) {
      var nuevo = [];
      res.forEach(function (a) {
        subs[i].forEach(function (b) {
          var m = a.slice();
          b.forEach(function (x) { if (m.indexOf(x) < 0) m.push(x); });
          nuevo.push(m);
        });
      });
      res = nuevo;
    }
    return res;
  }
  function minimize(sets) {
    return sets.filter(function (a, i) {
      return !sets.some(function (b, j) {
        if (i === j) return false;
        var sub = b.every(function (x) { return a.indexOf(x) >= 0; });
        return sub && (b.length < a.length || (b.length === a.length && j < i));
      });
    });
  }

  window.WIDGETS["arbol-fallos"] = function (el) {
    injectStyle();
    var id = "w-af-" + (++uid);
    var hojas = leaves(TREE, []);
    var byId = {};
    hojas.forEach(function (h) { byId[h.id] = h; });
    var cortes = minimize(cuts(TREE));
    var vals = {};
    function reset() { hojas.forEach(function (h) { vals[h.id] = h.p / 100; }); }
    reset();

    function nodeHtml(n, top) {
      var li = '<li><div class="w-node' + (top ? ' w-top' : '') + (n.hijos ? '' : ' w-leaf') + '">';
      if (n.hijos) {
        li += '<span class="w-gate' + (n.tipo === "O" ? ' w-o' : '') + '" title="Puerta ' + n.tipo + '" aria-label="Puerta ' + n.tipo + '">' + n.tipo + '</span>' +
          '<span class="w-txt">' + n.txt + '</span><span class="w-p" id="' + id + '-p-' + n.id + '"></span>';
      } else {
        li += '<span class="w-txt" id="' + id + '-t-' + n.id + '">' + n.txt + '</span>' +
          '<span class="w-leaf"><label for="' + id + '-i-' + n.id + '">p (%)</label>' +
          '<input type="text" inputmode="decimal" id="' + id + '-i-' + n.id + '" data-id="' + n.id + '" autocomplete="off" aria-describedby="' + id + '-err"></span>';
      }
      li += '</div>';
      if (n.hijos) {
        li += '<ul>' + n.hijos.map(function (h) { return nodeHtml(h, false); }).join("") + '</ul>';
      }
      return li + '</li>';
    }

    el.innerHTML = '<div class="w-af">' +
      '<h4>Árbol de fallos</h4>' +
      '<p class="w-hint">Ejemplo propio de un triaje asistido, con cifras inventadas. Cambia la probabilidad (en %) de cada evento básico; las puertas y el evento superior se recalculan. Se supone que los eventos básicos son independientes.</p>' +
      '<ul class="w-tree" aria-label="Árbol de fallos">' + nodeHtml(TREE, true) + '</ul>' +
      '<p class="w-err" id="' + id + '-err" role="alert"></p>' +
      '<dl class="w-res" aria-live="polite">' +
      '<div><dt>Evento superior</dt><dd id="' + id + '-top"></dd></div>' +
      '<div><dt>Equivale a uno de cada</dt><dd id="' + id + '-uno"></dd></div>' +
      '</dl>' +
      '<p><button type="button" id="' + id + '-reset">Restaurar valores iniciales</button></p>' +
      '<h5>Conjuntos mínimos de corte</h5>' +
      '<div class="w-tw"><table><thead><tr><th>Combinación que basta</th><th>Probabilidad</th></tr></thead><tbody id="' + id + '-cuts"></tbody></table></div>' +
      '<h5>Sensibilidad: si un evento básico fuera imposible</h5>' +
      '<div class="w-tw"><table><thead><tr><th>Evento básico a 0</th><th>Evento superior</th><th>Baja un</th></tr></thead><tbody id="' + id + '-sens"></tbody></table></div>' +
      '<p class="w-cap">Puerta Y: se multiplican las probabilidades. Puerta O: uno menos el producto de las probabilidades de que no ocurra cada una. La independencia es un supuesto que aquí se declara, no una garantía.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var err = $("err");

    function refresh(skipInputs) {
      (function walk(n) {
        if (n.hijos) {
          var g = $("p-" + n.id);
          if (g) g.textContent = pct(evalNode(n, vals));
          n.hijos.forEach(walk);
        }
      })(TREE);
      var top = evalNode(TREE, vals);
      $("top").textContent = pct(top);
      $("uno").textContent = top > 0 ? fmt(Math.round(1 / top), 0) : "nunca";

      var rows = cortes.map(function (c) {
        var p = 1; c.forEach(function (x) { p *= vals[x]; });
        return { c: c, p: p };
      }).sort(function (a, b) { return b.p - a.p; });
      $("cuts").innerHTML = rows.map(function (r) {
        return '<tr><td>' + r.c.map(function (x) { return byId[x].corto; }).join(" + ") + (r.c.length === 1 ? ' (punto único de fallo)' : '') +
          '</td><td class="w-n">' + pct(r.p) + '</td></tr>';
      }).join("");

      var sens = hojas.map(function (h) {
        var copia = {}, k; for (k in vals) copia[k] = vals[k];
        copia[h.id] = 0;
        var t = evalNode(TREE, copia);
        return { h: h, t: t, baja: top > 0 ? (1 - t / top) : 0 };
      }).sort(function (a, b) { return b.baja - a.baja; });
      $("sens").innerHTML = sens.map(function (s) {
        return '<tr><td>' + s.h.corto + '</td><td class="w-n">' + pct(s.t) + '</td><td class="w-n">' + fmt(s.baja * 100, 1) + ' %</td></tr>';
      }).join("");

      if (!skipInputs) {
        hojas.forEach(function (h) {
          var inp = $("i-" + h.id);
          inp.value = fmt(Number((vals[h.id] * 100).toPrecision(8)), 6);
          inp.removeAttribute("aria-invalid");
        });
      }
    }

    Array.prototype.forEach.call(el.querySelectorAll("input[data-id]"), function (inp) {
      inp.addEventListener("input", function () {
        var x = parse(inp.value);
        if (!isFinite(x) || x < 0 || x > 100) {
          inp.setAttribute("aria-invalid", "true");
          err.textContent = "La probabilidad de \"" + byId[inp.getAttribute("data-id")].corto + "\" debe estar entre 0 y 100 %.";
          return;
        }
        inp.removeAttribute("aria-invalid");
        err.textContent = "";
        vals[inp.getAttribute("data-id")] = x / 100;
        refresh(true);
      });
    });
    $("reset").addEventListener("click", function () {
      reset();
      err.textContent = "";
      refresh(false);
    });

    refresh(false);
  };
})();
