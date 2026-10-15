/* Simulador "m06-l04-shap": valores de Shapley exactos, por enumeracion de coaliciones, de un modelo pequeno con
   5 variables clinicas sinteticas. Pinta la cascada (base -> prediccion), comprueba la eficiencia (la suma de los phi es
   la prediccion menos la base) y perturba ligeramente la entrada para ver cuan estable es el ranking.
   Modelo, fondo, pacientes y medida de estabilidad: propios (ver Fuentes de la leccion). Formula de Shapley: ficha del Atlas.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  /* Modelo sintetico de puntuacion de riesgo (puntos, escala arbitraria; no es una probabilidad). */
  var B0 = 2.45, KINT = 0.4;
  var VARS = [
    { k: "edad", et: "Edad", u: "años", w: 0.30, min: 30, max: 95, step: 1, dec: 0 },
    { k: "creat", et: "Creatinina", u: "mg/dL", w: 8, min: 0.5, max: 4, step: 0.1, dec: 1 },
    { k: "hb", et: "Hemoglobina", u: "g/dL", w: -1.5, min: 7, max: 16, step: 0.1, dec: 1 },
    { k: "fc", et: "Frecuencia cardíaca", u: "lpm", w: 0.15, min: 40, max: 140, step: 1, dec: 0 },
    { k: "est", et: "Estancia previa", u: "días", w: 1.2, min: 0, max: 20, step: 1, dec: 0 }
  ];
  var N = VARS.length;
  /* Fondo de referencia: 8 pacientes sinteticos; medias 65, 1,1, 12,5, 80 y 5. */
  var FONDO = [
    { edad: 48, creat: 0.8, hb: 14.2, fc: 62, est: 2 }, { edad: 55, creat: 0.9, hb: 13.6, fc: 68, est: 3 },
    { edad: 60, creat: 0.9, hb: 13.0, fc: 72, est: 3 }, { edad: 63, creat: 1.0, hb: 12.8, fc: 76, est: 4 },
    { edad: 67, creat: 1.1, hb: 12.4, fc: 80, est: 5 }, { edad: 70, creat: 1.2, hb: 12.0, fc: 84, est: 6 },
    { edad: 74, creat: 1.3, hb: 11.6, fc: 92, est: 7 }, { edad: 83, creat: 1.6, hb: 10.4, fc: 106, est: 10 }
  ];
  var PACIENTES = [
    { et: "A: la creatinina domina", x: { edad: 68, creat: 2.0, hb: 12.0, fc: 82, est: 6 } },
    { et: "B: dos variables casi empatadas", x: { edad: 79, creat: 1.6, hb: 11.0, fc: 78, est: 6 } },
    { et: "C: un paciente cercano a la media", x: { edad: 63, creat: 1.0, hb: 12.8, fc: 76, est: 4 } },
    { et: "D: varias señales a la vez", x: { edad: 84, creat: 2.4, hb: 9.6, fc: 104, est: 12 } }
  ];
  var SEMILLA = 20260929;

  function fmt(x, d) { return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function sg(x, d) { return (x >= 0 ? "+" : "-") + fmt(Math.abs(x), d); }

  function modelo(x, inter) {
    var s = B0, i;
    for (i = 0; i < N; i++) s += VARS[i].w * x[VARS[i].k];
    if (inter) s += KINT * (x.edad - 65) * (x.creat - 1.1);
    return s;
  }

  /* Valor de una coalicion (mascara de bits): media, sobre el fondo, del modelo con las variables de la coalicion
     tomadas del paciente y las demas del caso de fondo. */
  function valorCoalicion(x, mask, inter) {
    var t = 0, b, i, z, r;
    for (b = 0; b < FONDO.length; b++) {
      z = {};
      for (i = 0; i < N; i++) { r = VARS[i].k; z[r] = (mask >> i) & 1 ? x[r] : FONDO[b][r]; }
      t += modelo(z, inter);
    }
    return t / FONDO.length;
  }

  function fact(n) { var r = 1, i; for (i = 2; i <= n; i++) r *= i; return r; }
  function bits(m) { var c = 0; while (m) { c += m & 1; m >>= 1; } return c; }

  /* Shapley exacto: recorre las 2^N coaliciones y pondera cada aportacion marginal con |S|!(N-|S|-1)!/N!. */
  function shapley(x, inter) {
    var v = [], m, i, s, phi = [], w;
    for (m = 0; m < (1 << N); m++) v.push(valorCoalicion(x, m, inter));
    for (i = 0; i < N; i++) {
      s = 0;
      for (m = 0; m < (1 << N); m++) {
        if ((m >> i) & 1) continue;
        w = fact(bits(m)) * fact(N - bits(m) - 1) / fact(N);
        s += w * (v[m | (1 << i)] - v[m]);
      }
      phi.push(s);
    }
    return { phi: phi, base: v[0], pred: v[(1 << N) - 1], v: v };
  }

  function ranking(phi) {
    var idx = [], i;
    for (i = 0; i < phi.length; i++) idx.push(i);
    idx.sort(function (a, b) { var d = Math.abs(phi[b]) - Math.abs(phi[a]); return d !== 0 ? d : a - b; });
    return idx;
  }

  /* nDCG del orden nuevo frente al original, con relevancia = |phi| original (medida propia, simplificada). */
  function ndcg(phiOrig, ordNuevo) {
    var ordIdeal = ranking(phiOrig), dcg = 0, idcg = 0, p;
    for (p = 0; p < N; p++) {
      dcg += Math.abs(phiOrig[ordNuevo[p]]) / Math.log(p + 2) * Math.LN2;
      idcg += Math.abs(phiOrig[ordIdeal[p]]) / Math.log(p + 2) * Math.LN2;
    }
    return idcg > 0 ? dcg / idcg : 1;
  }

  function pares(ordA, ordB) {
    var posB = [], i, j, c = 0;
    for (i = 0; i < N; i++) posB[ordB[i]] = i;
    for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) if (posB[ordA[i]] > posB[ordA[j]]) c++;
    return c;
  }

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function perturbar(x, eps, rnd) {
    var z = {}, i, k;
    for (i = 0; i < N; i++) { k = VARS[i].k; z[k] = x[k] * (1 + eps * (2 * rnd() - 1)); }
    return z;
  }

  /* n perturbaciones con semilla fija: reproducible al recargar. */
  function resumenEstabilidad(x, eps, inter, n) {
    var rnd = mulberry(SEMILLA), s0 = shapley(x, inter), o0 = ranking(s0.phi), top = 0, todo = 0, nd = 0, i, s, o, same, j;
    for (i = 0; i < n; i++) {
      s = shapley(perturbar(x, eps, rnd), inter);
      o = ranking(s.phi);
      if (o[0] === o0[0]) top++;
      same = true;
      for (j = 0; j < N; j++) if (o[j] !== o0[j]) same = false;
      if (same) todo++;
      nd += ndcg(s0.phi, o);
    }
    return { n: n, top: top / n, todo: todo / n, ndcg: nd / n };
  }

  /* Comprobacion del atajo lineal: sin interaccion, phi_i = w_i (x_i - media_i). */
  function atajoLineal(x) {
    var d = 0, i, k, m, a = shapley(x, false).phi;
    for (i = 0; i < N; i++) {
      k = VARS[i].k; m = 0;
      FONDO.forEach(function (f) { m += f[k]; });
      m /= FONDO.length;
      d = Math.max(d, Math.abs(a[i] - VARS[i].w * (x[k] - m)));
    }
    return d;
  }

  function injectStyle() {
    if (document.getElementById("w-sh-style")) return;
    var st = document.createElement("style");
    st.id = "w-sh-style";
    st.textContent = [
      ".w-sh{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-sh h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-sh h5{font:600 .74rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-sh .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-sh .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-sh .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-sh .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-sh input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-sh select{font:500 .92rem var(--sans);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:6px;padding:.35rem .5rem;max-width:100%}",
      ".w-sh .w-btns{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.2rem 0 .7rem}",
      ".w-sh button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .7rem;cursor:pointer}",
      ".w-sh button:hover{background:var(--accent-soft)}",
      ".w-sh .w-chk{display:flex;gap:.4rem;align-items:center;font-size:.86rem;color:var(--muted)}",
      ".w-sh .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .5rem}",
      ".w-sh .w-ok{color:var(--ex);font-weight:600}",
      ".w-sh .w-chg{color:var(--trap);font-weight:600}",
      ".w-sh svg{display:block;width:100%;max-width:38rem;height:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-sh .w-cap{color:var(--faint);font-size:.76rem;margin:.3rem 0 0}",
      ".w-sh .tw{margin:.6rem 0 .7rem}"
    ].join("\n");
    document.head.appendChild(st);
  }

  /* Cascada horizontal: base, una fila por variable (ordenadas por |phi|) y prediccion. */
  function cascada(res, ord) {
    var LX = 128, RX = 340, RH = 28, T = 24, o = [], lv = [res.base], c = res.base, i, r, lo, hi, a, b, y, sc, cx, txt, tw, ph;
    for (i = 0; i < ord.length; i++) { c += res.phi[ord[i]]; lv.push(c); }
    lo = Math.min.apply(null, lv); hi = Math.max.apply(null, lv);
    a = (hi - lo) * 0.12 + 1; lo -= a; hi += a;
    sc = function (v) { return LX + (v - lo) / (hi - lo) * (RX - LX); };
    o.push('<text x="' + LX + '" y="12" style="fill:var(--faint);font-size:9px">' + fmt(lo, 0) + '</text>');
    o.push('<text x="' + RX + '" y="12" text-anchor="end" style="fill:var(--faint);font-size:9px">' + fmt(hi, 0) + ' puntos</text>');
    /* base */
    y = T + RH / 2;
    o.push('<text x="' + (LX - 8) + '" y="' + (y + 3.5) + '" text-anchor="end" style="fill:var(--ink);font-size:11px;font-weight:600">Base (media)</text>');
    o.push('<path d="M' + sc(res.base) + ' ' + (y - 7) + ' l7 7 l-7 7 l-7 -7 z" style="fill:var(--muted);stroke:var(--surface)"/>');
    o.push('<text x="' + (sc(res.base) + 12) + '" y="' + (y + 3.5) + '" style="fill:var(--ink);font-size:10px">' + fmt(res.base, 1) + '</text>');
    o.push('<line x1="' + sc(res.base) + '" y1="' + (y + 8) + '" x2="' + sc(res.base) + '" y2="' + (T + (N + 1) * RH) + '" style="stroke:var(--rule-strong);stroke-dasharray:3 3"/>');
    for (i = 0; i < ord.length; i++) {
      r = ord[i]; ph = res.phi[r]; y = T + (i + 1) * RH + RH / 2;
      a = sc(Math.min(lv[i], lv[i + 1])); b = sc(Math.max(lv[i], lv[i + 1]));
      txt = sg(ph, 1);
      o.push('<text x="' + (LX - 8) + '" y="' + (y + 3.5) + '" text-anchor="end" style="fill:var(--ink);font-size:11px">' + VARS[r].et + '</text>');
      o.push('<rect x="' + a + '" y="' + (y - 8) + '" width="' + Math.max(b - a, 1.5) + '" height="16" rx="2" style="fill:' + (ph >= 0 ? 'var(--accent)' : 'var(--ex)') + ';stroke:var(--surface)"><title>' + VARS[r].et + ': ' + txt + ' puntos</title></rect>');
      o.push('<line x1="' + sc(lv[i]) + '" y1="' + (y - 20) + '" x2="' + sc(lv[i]) + '" y2="' + (y - 8) + '" style="stroke:var(--faint)"/>');
      if (ph >= 0) o.push('<text x="' + (b + 4) + '" y="' + (y + 3.5) + '" style="fill:var(--ink);font-size:10px;font-weight:600">' + txt + '</text>');
      else o.push('<text x="' + (a - 4) + '" y="' + (y + 3.5) + '" text-anchor="end" style="fill:var(--ink);font-size:10px;font-weight:600">' + txt + '</text>');
    }
    y = T + (N + 1) * RH + RH / 2;
    cx = sc(res.pred);
    o.push('<text x="' + (LX - 8) + '" y="' + (y + 3.5) + '" text-anchor="end" style="fill:var(--ink);font-size:11px;font-weight:600">Predicción</text>');
    o.push('<path d="M' + cx + ' ' + (y - 8) + ' l8 8 l-8 8 l-8 -8 z" style="fill:var(--m-explicabilidad);stroke:var(--surface)"/>');
    o.push('<text x="' + (cx + 13) + '" y="' + (y + 3.5) + '" style="fill:var(--ink);font-size:10px;font-weight:600">' + fmt(res.pred, 1) + '</text>');
    tw = "Cascada: parte de la base " + fmt(res.base, 1) + " y llega a la predicción " + fmt(res.pred, 1) + ". " +
      ord.map(function (j) { return VARS[j].et + " " + sg(res.phi[j], 1); }).join(", ") + ".";
    return '<svg viewBox="0 0 400 ' + (T + (N + 2) * RH + 6) + '" role="img" aria-label="' + tw + '"><title>' + tw + '</title>' + o.join("") + '</svg>';
  }

  window.WIDGETS["m06-l04-shap"] = function (el) {
    injectStyle();
    var id = "w-sh-" + (++uid);
    var S = { pi: 0, x0: null, xp: null, inter: false, eps: 3, rnd: mulberry(SEMILLA + 1), cache: null };
    var copia = function (x) { var z = {}; VARS.forEach(function (v) { z[v.k] = x[v.k]; }); return z; };
    S.x0 = copia(PACIENTES[0].x);

    function sl(v) {
      return '<div class="w-f"><label for="' + id + '-' + v.k + '">' + v.et + ' (' + v.u + ') <b id="' + id + '-' + v.k + 'v"></b></label>' +
        '<input type="range" id="' + id + '-' + v.k + '" min="' + v.min + '" max="' + v.max + '" step="' + v.step + '" value="' + S.x0[v.k] + '"></div>';
    }
    var opts = PACIENTES.map(function (p, i) { return '<option value="' + i + '">Paciente ' + p.et + '</option>'; }).join("") +
      '<option value="c">Paciente editado por ti</option>';

    el.innerHTML = '<div class="w-sh">' +
      '<h4>Valores de Shapley de un paciente</h4>' +
      '<p class="w-hint">Datos y modelo sintéticos. Una puntuación de riesgo lineal (en puntos, no es una probabilidad) con cinco variables; su base es la media sobre un fondo de 8 pacientes ficticios. Los valores de Shapley se calculan exactos, con las 32 coaliciones posibles.</p>' +
      '<div class="w-btns"><label for="' + id + '-pac" class="w-hint" style="margin:0">Paciente</label><select id="' + id + '-pac">' + opts + '</select>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-int"> Añadir interacción edad × creatinina</label></div>' +
      '<div class="w-grid">' + VARS.map(sl).join("") + '</div>' +
      '<div id="' + id + '-svg"></div>' +
      '<p class="w-note" id="' + id + '-chk" aria-live="polite"></p>' +
      '<h5>Estabilidad del ranking al perturbar la entrada</h5>' +
      '<div class="w-grid"><div class="w-f"><label for="' + id + '-eps">Tamaño de la perturbación <b id="' + id + '-epsv"></b></label>' +
      '<input type="range" id="' + id + '-eps" min="1" max="10" step="1" value="' + S.eps + '"></div></div>' +
      '<div class="w-btns"><button type="button" id="' + id + '-per">Perturbar ligeramente la entrada</button>' +
      '<button type="button" id="' + id + '-quitar">Volver a la entrada original</button></div>' +
      '<p class="w-note" id="' + id + '-res" aria-live="polite"></p>' +
      '<div class="tw"><table><thead id="' + id + '-th"></thead><tbody id="' + id + '-tb"></tbody></table></div>' +
      '<p class="w-note" id="' + id + '-n200"></p>' +
      '<p class="w-cap">Cada variable de la entrada se multiplica por un número aleatorio entre 1 - p y 1 + p, con p el tamaño elegido. La medida de estabilidad (nDCG con relevancia igual al |φ| original) es una versión propia y simplificada de la del monitor; el esquema de relevancias de Vigía no está en la guía.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }

    function render() {
      var x = S.xp || S.x0, res = shapley(x, S.inter), ord = ranking(res.phi), res0 = null, ord0 = null;
      var i, r, sum = 0, dif, h, rows = "", pos0 = [], t, key, a, b, np, tx;
      if (S.xp) { res0 = shapley(S.x0, S.inter); ord0 = ranking(res0.phi); ord0.forEach(function (j, p) { pos0[j] = p; }); }
      VARS.forEach(function (v) { $(v.k + "v").textContent = fmt(S.x0[v.k], v.dec); });
      $("epsv").textContent = "±" + S.eps + " %";
      $("svg").innerHTML = cascada(res, ord);

      for (i = 0; i < N; i++) sum += res.phi[i];
      dif = Math.abs(sum - (res.pred - res.base));
      t = "Base " + fmt(res.base, 2) + " · predicción " + fmt(res.pred, 2) + " · predicción menos base " + fmt(res.pred - res.base, 2) +
        " · suma de los φ " + fmt(sum, 2) + ". " +
        (dif < 1e-9 ? '<span class="w-ok">La suma es exacta</span> (diferencia menor de 10<sup>-9</sup>, solo redondeo).' : '<span class="w-chg">La suma no cuadra: diferencia ' + fmt(dif, 6) + '.</span>') +
        " Se han evaluado 32 coaliciones, cada una con 8 casos de fondo: 256 llamadas al modelo por paciente. ";
      t += S.inter ? "Con interacción, el atajo lineal φ = w · (x - media) ya no vale; la enumeración sigue valiendo."
        : "Sin interacción, el atajo lineal φ = w · (x - media) da el mismo resultado (diferencia máxima " + (atajoLineal(x) < 1e-9 ? "menor de 10<sup>-9</sup>" : "distinta de cero") + ").";
      $("chk").innerHTML = t;

      h = S.xp ? "<tr><th>Puesto (perturbado)</th><th>Variable</th><th>Valor original</th><th>φ original</th><th>Valor perturbado</th><th>φ perturbado</th><th>Puesto original</th></tr>"
        : "<tr><th>Puesto</th><th>Variable</th><th>Valor</th><th>φ (puntos)</th></tr>";
      $("th").innerHTML = h;
      ord.forEach(function (j, p) {
        r = VARS[j];
        if (S.xp) {
          rows += "<tr><td>" + (p + 1) + "</td><td>" + r.et + "</td><td>" + fmt(S.x0[r.k], r.dec) + "</td><td>" + sg(res0.phi[j], 2) + "</td><td>" + fmt(S.xp[r.k], r.dec + 1) +
            "</td><td>" + sg(res.phi[j], 2) + "</td><td>" + (pos0[j] + 1) + (pos0[j] !== p ? ' <span class="w-chg">(cambia)</span>' : "") + "</td></tr>";
        } else rows += "<tr><td>" + (p + 1) + "</td><td>" + r.et + "</td><td>" + fmt(x[r.k], r.dec) + "</td><td>" + sg(res.phi[j], 2) + "</td></tr>";
      });
      $("tb").innerHTML = rows;
      /* Al ordenar por |phi| se ve el orden de la entrada activa; la tabla muestra las columnas del original y del perturbado juntas. */
      if (S.xp) {
        np = pares(ord0, ord);
        tx = "Con la perturbación de ±" + S.eps + " %: el primer puesto " + (ord[0] === ord0[0] ? "se mantiene (" + VARS[ord[0]].et + ")" : '<span class="w-chg">cambia</span>: de ' + VARS[ord0[0]].et + " a " + VARS[ord[0]].et) +
          ". Pares de variables que intercambian su orden: " + np + " de " + (N * (N - 1) / 2) + ". nDCG frente al ranking original: " + fmt(ndcg(res0.phi, ord), 3) + ".";
        $("res").innerHTML = tx;
      } else $("res").textContent = "Aún no has perturbado la entrada. Pulsa el botón para desplazar cada valor un poco y comparar los dos rankings.";
      key = JSON.stringify(S.x0) + "|" + S.eps + "|" + S.inter;
      if (!S.cache || S.cache.key !== key) S.cache = { key: key, r: resumenEstabilidad(S.x0, S.eps / 100, S.inter, 200) };
      a = S.cache.r;
      $("n200").innerHTML = "Repetido 200 veces con perturbaciones de ±" + S.eps + " %: el primer puesto se mantiene en el " + fmt(a.top * 100, 0) + " % de las veces, el ranking completo idéntico en el " +
        fmt(a.todo * 100, 0) + " % y el nDCG medio es " + fmt(a.ndcg, 3) + ". (Semilla fija: mismo resultado cada vez.)";
    }

    function ponerSliders() { VARS.forEach(function (v) { $(v.k).value = S.x0[v.k]; }); }
    $("pac").addEventListener("change", function () {
      var val = $("pac").value;
      if (val === "c") return;
      S.pi = parseInt(val, 10); S.x0 = copia(PACIENTES[S.pi].x); S.xp = null; ponerSliders(); render();
    });
    VARS.forEach(function (v) {
      $(v.k).addEventListener("input", function () {
        var n = parseFloat($(v.k).value);
        if (!isNaN(n)) S.x0[v.k] = n;
        S.xp = null; $("pac").value = "c"; render();
      });
    });
    $("int").addEventListener("change", function () { S.inter = $("int").checked; render(); });
    $("eps").addEventListener("input", function () { S.eps = parseInt($("eps").value, 10) || 3; S.xp = null; render(); });
    $("per").addEventListener("click", function () { S.xp = perturbar(S.x0, S.eps / 100, S.rnd); render(); });
    $("quitar").addEventListener("click", function () { S.xp = null; render(); });
    render();
  };

  window.WIDGETS["m06-l04-shap"]._nucleo = {
    modelo: modelo, shapley: shapley, ranking: ranking, ndcg: ndcg, pares: pares, resumenEstabilidad: resumenEstabilidad,
    atajoLineal: atajoLineal, VARS: VARS, FONDO: FONDO, PACIENTES: PACIENTES, cascada: cascada
  };
})();
