/* Simulador "m11-l05-dilemas": cuatro dilemas propios de IA clínica y sanitaria (cifras inventadas).
   Para cada uno, el usuario decide primero; después se ve qué recomienda el utilitarismo (cálculo con utilidad esperada,
   que cambia con el control numérico), qué recomienda la deontología (según el tipo de acto) y qué objeción del libro
   se aplica a cada teoría. El libro (Hendrycks, sec. 11.4) no trata estos casos: se aplican sus principios.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-l5-style")) return;
    var st = document.createElement("style");
    st.id = "w-l5-style";
    st.textContent = [
      ".w-l5{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-l5 h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-l5 h5{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-l5 h6{font:600 .68rem/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--trap);margin:.7rem 0 .25rem}",
      ".w-l5 p{margin:.3rem 0}",
      ".w-l5 .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-l5 .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:.2rem 0 .4rem}",
      ".w-l5 button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .75rem;cursor:pointer;text-align:left}",
      ".w-l5 button:hover{background:var(--accent-soft)}",
      ".w-l5 button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-ink)}",
      ".w-l5 .w-caso{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem;margin:.5rem 0}",
      ".w-l5 .w-fijos{color:var(--muted);font-size:.8rem}",
      ".w-l5 .w-f{margin:.6rem 0}",
      ".w-l5 .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-l5 .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-l5 input[type=range]{width:100%;accent-color:var(--accent);min-height:1.6rem;margin:0}",
      ".w-l5 input[type=range]:disabled{opacity:.4}",
      ".w-l5 .w-chk{display:flex;align-items:center;gap:.5rem;margin:.3rem 0;font-size:.86rem}",
      ".w-l5 .w-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(15.5rem,1fr));gap:.7rem;margin:.6rem 0}",
      ".w-l5 .w-card{background:var(--ground);border:1px solid var(--rule);border-radius:8px;padding:.6rem .8rem}",
      ".w-l5 .w-card h5{margin:.1rem 0 .4rem;color:var(--accent-ink)}",
      ".w-l5 .w-num{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:6px;overflow:hidden;margin:.4rem 0}",
      ".w-l5 .w-num > div{background:var(--surface);padding:.35rem .55rem}",
      ".w-l5 .w-num dt{font:600 .62rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.15rem}",
      ".w-l5 .w-num dd{margin:0;font:600 1rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-l5 .w-num .w-win dd{color:var(--ex)}",
      ".w-l5 .w-verd{font-weight:600}",
      ".w-l5 .w-aviso{background:var(--trap-bg);border-radius:6px;padding:.4rem .6rem;font-size:.82rem}",
      ".w-l5 .w-obj{border-top:1px dashed var(--rule-strong);margin-top:.6rem;padding-top:.1rem}",
      ".w-l5 .w-res{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.5rem 0;font-weight:600}",
      ".w-l5 .w-cap{color:var(--faint);font-size:.76rem;margin:.6rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function fmt(x, d) {
    return Number(x).toLocaleString("es-ES", { minimumFractionDigits: d, maximumFractionDigits: d }).replace("-", "−");
  }

  /* Cada dilema: ctrl (controles), util(v) -> {eu:[A,B], unit, d, formulas:[..], frag, extra}, deont(v) -> {pick, text},
     objU(v,r), objD(v,r) -> {t, x}. pick: 0 = A, 1 = B, -1 = las dos permitidas. */
  var DIL = [
    {
      id: "uci", nombre: "Cama de UCI ocupada",
      caso: "Una UCI tiene una sola cama libre y ya la ocupa un paciente con mal pronóstico. Llega otro con mucho mejor pronóstico. Un asistente de triaje debe proponer qué hacer.",
      fijos: "Cifras inventadas: el paciente actual tiene un 30 % de sobrevivir con la cama; sin cama, el nuevo no sobrevive y, si se retira la cama al actual, tampoco.",
      opts: ["Mantener al paciente actual en la cama", "Retirarlo y dar la cama al paciente nuevo"],
      ctrl: [{ k: "pn", label: "Probabilidad de sobrevivir del paciente nuevo", min: 10, max: 90, step: 1, val: 45, suf: " %" }],
      util: function (v) {
        var a = 0.30, b = v.pn / 100;
        return {
          eu: [a, b], unit: "supervivientes esperados", d: 2,
          formulas: ["0,30 × 1", fmt(b, 2) + " × 1"],
          frag: Math.abs(v.pn - 30) < 20 ? "Con un error de ±10 puntos en cada pronóstico, una diferencia de " + fmt(Math.abs(v.pn - 30), 0) + " " + pl(Math.abs(v.pn - 30), "punto", "puntos") + " no basta para fiarse del veredicto." : null
        };
      },
      deont: function () {
        return { pick: 0, text: "No retirar. Retirar la cama es hacer algo que causa la muerte del paciente actual; no dársela al nuevo es dejar que ocurra algo. Con la distinción entre acción y omisión (p. 562) y el derecho a la vida como restricción, la recomendación no depende de la probabilidad del paciente nuevo. Es una lectura entre otras: con el doble efecto (p. 562) podría defenderse retirar si se pretende salvar al paciente nuevo y no causar la otra muerte, y el libro agrupa como deontológicas teorías que no coinciden entre sí." };
      },
      objU: function (v) {
        return { t: "Cálculos intratables (pp. 555 y 556)", x: "Los dos pronósticos son estimaciones. Con " + fmt(v.pn, 0) + " % frente a 30 %, el utilitarista necesita fiarse de esa diferencia. Su respuesta, según el libro, es no decidir siempre con una cuenta explícita sino con reglas prácticas probadas; pero eso deja abierta la pregunta de qué regla usar aquí." };
      },
      objD: function (v) {
        var g = (v.pn - 30) / 100;
        return { t: "Empeora el mundo (p. 563)", x: g > 0 ? "Respetar la restricción cuesta " + fmt(g, 2) + " supervivientes esperados por cada caso de este tipo. Es la paradoja de la deontología: la regla se cumple aunque el resultado sea peor." : "Con este valor la objeción no muerde: mantener al paciente actual también es lo mejor por resultados." };
      }
    },
    {
      id: "mentira", nombre: "Asistente que miente para no alarmar",
      caso: "Un asistente conversacional acompaña a un paciente cuyo análisis sale dudoso, a la espera de una prueba de confirmación. El paciente pregunta si es grave. Puede tranquilizarlo con un \"seguro que no es nada\", que no sabe, o decir la verdad con tacto: hay un resultado dudoso y se está confirmando.",
      fijos: "Cifras inventadas. Mentir: +2 de calma inmediata si no se descubre, y −20 por pérdida de confianza (en lugar de los +2) si se descubre. Decir la verdad con tacto: −3 de ansiedad segura.",
      opts: ["Mentir: tranquilizarlo", "Decir la verdad con tacto"],
      ctrl: [{ k: "q", label: "Probabilidad de que se descubra la mentira", min: 0, max: 60, step: 1, val: 10, suf: " %" }],
      util: function (v) {
        var q = v.q / 100, a = 2 * (1 - q) - 20 * q;
        return {
          eu: [a, -3], unit: "unidades de bienestar esperadas", d: 2,
          formulas: [fmt(1 - q, 2) + " × 2 + " + fmt(q, 2) + " × (−20)", "1 × (−3)"],
          frag: (v.q > 12.7 && v.q < 32.7) ? "El umbral del cálculo está en un 22,7 %. Si tu estimación de esa probabilidad falla en 10 puntos, cambia el veredicto." : null
        };
      },
      deont: function () {
        return { pick: 1, text: "No mentir. Para Kant mentir está mal siempre. Con la formulación de la humanidad (p. 566), engañar al paciente lo trata como un medio y socava su autonomía, como Nathan con la desconocida. La recomendación no depende de cuán probable sea que se descubra." };
      },
      objU: function () {
        return { t: "Cálculos intratables (pp. 555 y 556)", x: "Nadie conoce esa probabilidad, y el cálculo deja fuera efectos lejanos, como lo que aprenden otros pacientes. Por eso el libro dice que un utilitarista suele cultivar la veracidad como regla práctica (p. 556): el criterio sigue siendo maximizar el bienestar esperado, pero el procedimiento es otro." };
      },
      objD: function () {
        return { t: "Kant demasiado extremo (pp. 566 y 567)", x: "Aquí pesa poco. El caso del hachero enfrenta la mentira con un daño grave e inmediato; en este, decir la verdad con tacto no daña a nadie de ese modo. Con deberes pro tanto, la honestidad solo cedería ante un deber mayor, y una calma de +2 no lo es." };
      }
    },
    {
      id: "privacidad", nombre: "Leer mensajes privados para evitar un sabotaje",
      caso: "El sistema de seguridad de un hospital detecta indicios de que un empleado prepara un sabotaje que dejaría sin soporte vital a varios pacientes. Podría leer sus mensajes privados sin orden judicial para confirmarlo y pararlo. Hasta ahora no ha hecho nada ilegal.",
      fijos: "Cifras inventadas: probabilidad de que el sabotaje sea real, 0,2; de que leer permita pararlo, 0,8; coste de violar la privacidad, 2 (en vidas equivalentes), se lea lo que se lea.",
      opts: ["Leer los mensajes sin orden", "No leerlos y seguir por vías legales"],
      ctrl: [
        { k: "n", label: "Pacientes en riesgo", min: 1, max: 500, step: 1, val: 50, suf: "" },
        { k: "T", label: "Umbral de la deontología", min: 20, max: 500, step: 10, val: 200, suf: " pacientes", opt: "Deontología con umbral" }
      ],
      util: function (v) {
        var a = 0.2 * 0.8 * v.n - 2;
        return {
          eu: [a, 0], unit: "vidas equivalentes esperadas", d: 2,
          formulas: ["0,2 × 0,8 × " + fmt(v.n, 0) + " − 2", "0"],
          frag: (v.n > 9.5 && v.n < 18.2) ? "El cálculo cambia de signo en 12,5 pacientes. Si la probabilidad combinada (0,16) está en realidad entre 0,11 y 0,21, el umbral va de 9,5 a 18,2: con este valor el veredicto no es robusto." : null
        };
      },
      deont: function (v) {
        if (v.T === null) return { pick: 1, text: "No leer. La privacidad es un derecho negativo, un deber de abstenerse, y no se anula sumando vidas. La recomendación no cambia con el número de pacientes." };
        if (v.n >= v.T) return { pick: 0, text: "Con umbral en " + fmt(v.T, 0) + ": como " + fmt(v.n, 0) + " alcanza el umbral, la teoría cede a lo que recomienda el cálculo y permite leer (p. 563)." };
        return { pick: 1, text: "Con umbral en " + fmt(v.T, 0) + ": " + fmt(v.n, 0) + " " + pl(v.n, "paciente no alcanza", "pacientes no alcanzan") + " el umbral, así que la restricción sigue en pie y no se debe leer." };
      },
      objU: function () {
        return { t: "Demasiado valor al bienestar (pp. 556 y 557)", x: "El cálculo trata la violación como un coste más, de 2. Quien sostenga que la privacidad es un derecho y no un coste dirá que omite un valor, igual que Nozick con la máquina de experiencias. El libro no trata este caso; su réplica a Nozick, el sesgo del statu quo de Greene, sugiere que esas intuiciones no son tan limpias, pero aquí es solo una analogía." };
      },
      objD: function (v) {
        if (v.T === null) {
          if (v.n < 12.5) return { t: "Catástrofes (pp. 562 y 563)", x: "Con " + fmt(v.n, 0) + " " + pl(v.n, "paciente", "pacientes") + " en juego, el propio cálculo aconseja no leer: la objeción no muerde. Sube el número de pacientes hasta que el cálculo cambie." };
          return { t: "Catástrofes (pp. 562 y 563)", x: "Con " + fmt(v.n, 0) + " " + pl(v.n, "paciente", "pacientes") + " en juego, negarse a leer puede parecer anteponer la pureza moral a las vidas, como con Jamie ante la bomba. La salida del libro es el umbral: activa la casilla para verlo." };
        }
        return { t: "Umbral arbitrario (p. 563)", x: "Con el umbral en " + fmt(v.T, 0) + ", con " + fmt(v.T, 0) + " pacientes se permite leer y con " + fmt(v.T - 1, 0) + " no. Un paciente de diferencia cambia la recomendación y nadie sabe justificar ese número." };
      }
    },
    {
      id: "horas", nombre: "Horas extra de una médica",
      caso: "Una intensivista puede dedicar horas extra cada semana a validar un modelo de pronóstico que usarán varios hospitales. Nadie se lo exige y las horas salen de su descanso.",
      fijos: "Cifras inventadas: cada hora aporta +3 de bienestar a otros; el desgaste acumulado resta 0,15 × h² (h = horas semanales).",
      opts: ["No hacer horas extra", "Hacer las horas extra"],
      ctrl: [{ k: "h", label: "Horas extra a la semana", min: 0, max: 30, step: 1, val: 10, suf: " h" }],
      util: function (v) {
        var b = 3 * v.h - 0.15 * v.h * v.h;
        return {
          eu: [0, b], unit: "unidades de bienestar esperadas", d: 2,
          formulas: ["0", "3 × " + fmt(v.h, 0) + " − 0,15 × " + fmt(v.h, 0) + "²"],
          frag: null,
          extra: "Con estas cifras la cantidad óptima es de 10 horas, que dan 15 unidades. Para el utilitarismo no hay opción: lo correcto es la mejor."
        };
      },
      deont: function () {
        return { pick: -1, text: "Ninguna de las dos está exigida ni prohibida. No hay restricción en juego, así que las dos opciones son permisibles y ella elige (p. 560): fuera de las restricciones hay libertad." };
      },
      objU: function (v) {
        return { t: "Demasiado exigente (pp. 554 y 555)", x: v.h > 20 ? "Con " + fmt(v.h, 0) + " horas el desgaste supera el beneficio y el propio cálculo aconseja descansar. Es la respuesta del libro: en la práctica el utilitarismo pide menos de lo que parece, porque agotarse produce menos bien." : "El criterio pide lo mejor, aquí unas 10 horas, y no lo meramente bueno. La respuesta del libro es que el desgaste limita lo que exige: mueve el control por encima de 20 horas y verás cómo el cálculo pasa a recomendar descansar." };
      },
      objD: function () {
        return { t: "Empeora el mundo (p. 563)", x: "Solo en parte. Descansar priva a otros de hasta 15 unidades, pero el libro presenta las opciones como respeto a la autonomía y no como un fallo (p. 561). La objeción muerde si se cree que siempre hay que hacer el máximo bien." };
      }
    }
  ];

  function pl(n, uno, varios) { return n === 1 ? uno : varios; }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function veredictoUtil(r) {
    var d = r.eu[0] - r.eu[1];
    if (Math.abs(d) < 1e-9) return -1;
    return d > 0 ? 0 : 1;
  }

  /* Lógica pura, sin DOM: la usan la vista y las comprobaciones. */
  function evaluar(dil, v) {
    var r = dil.util(v), u = veredictoUtil(r), d = dil.deont(v);
    return { r: r, u: u, d: d, oU: dil.objU(v, r), oD: dil.objD(v, r) };
  }

  function nombreOpc(dil, i) { return i < 0 ? "" : (i === 0 ? "A" : "B") + ": " + dil.opts[i]; }

  function coincide(eleg, u, d) {
    var cu = u === -1 || eleg === u, cd = d === -1 || eleg === d;
    if (cu && cd) return "Tu elección es compatible con las dos teorías.";
    if (cu) return "Tu elección coincide con el utilitarismo y no con la deontología.";
    if (cd) return "Tu elección coincide con la deontología y no con el utilitarismo.";
    return "Tu elección no coincide con ninguna de las dos: quizá estás pesando otras consideraciones.";
  }

  window.WIDGETS["m11-l05-dilemas"] = function (el) {
    injectStyle();
    var id = "w-l5-" + (++uid);
    var S = { i: 0, eleg: null, vals: {}, tOn: false };
    DIL.forEach(function (d) {
      S.vals[d.id] = {};
      d.ctrl.forEach(function (c) { S.vals[d.id][c.k] = c.val; });
    });

    el.innerHTML = '<div class="w-l5">' +
      '<h4>Cuatro dilemas, dos teorías</h4>' +
      '<p class="w-hint">Elige un dilema, decide tú primero y después mira qué recomienda cada teoría, según lo que dice el libro, y qué objeción del libro se le aplica. Mueve el control numérico: el cálculo utilitarista cambia con los números, la deontología depende del tipo de acto. El libro no trata estos casos; se aplican sus principios.</p>' +
      '<div class="w-btns" role="group" aria-label="Dilemas" id="' + id + '-tabs"></div>' +
      '<div id="' + id + '-cuerpo"></div>' +
      '<p class="w-cap">Casos, cifras y aplicación de las teorías: propios. Base: libro, sección 11.4, subsecciones Utilitarianism y Deontology.</p>' +
      '</div>';

    var tabs = el.querySelector("#" + id + "-tabs");
    var cuerpo = el.querySelector("#" + id + "-cuerpo");

    function dibujarTabs() {
      tabs.innerHTML = DIL.map(function (d, i) {
        return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === S.i) + '">' + esc(d.nombre) + '</button>';
      }).join("");
      Array.prototype.forEach.call(tabs.querySelectorAll("button"), function (b) {
        b.addEventListener("click", function () {
          S.i = Number(b.getAttribute("data-i"));
          S.eleg = null;
          S.tOn = false;
          dibujarTabs();
          dibujarCaso();
        });
      });
    }

    function valores() {
      var dil = DIL[S.i], v = {};
      dil.ctrl.forEach(function (c) {
        v[c.k] = c.opt ? (S.tOn ? S.vals[dil.id][c.k] : null) : S.vals[dil.id][c.k];
      });
      return v;
    }

    function dibujarCaso() {
      var dil = DIL[S.i], h = "";
      h += '<div class="w-caso"><p>' + esc(dil.caso) + '</p><p class="w-fijos">' + esc(dil.fijos) + '</p></div>';
      dil.ctrl.forEach(function (c) {
        var cid = id + "-c-" + c.k;
        if (c.opt) {
          h += '<div class="w-chk"><input type="checkbox" id="' + cid + '-on"' + (S.tOn ? " checked" : "") + '><label for="' + cid + '-on">' + esc(c.opt) + '</label></div>';
        }
        h += '<div class="w-f"><label for="' + cid + '">' + esc(c.label) + ' <b id="' + cid + '-o"></b></label>' +
          '<input type="range" id="' + cid + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + S.vals[dil.id][c.k] + '"' + (c.opt && !S.tOn ? " disabled" : "") + '></div>';
      });
      h += '<h5>Antes de ver nada, decide tú</h5><div class="w-btns" role="group" aria-label="Tu decisión" id="' + id + '-eleg">' +
        dil.opts.map(function (o, i) {
          return '<button type="button" data-e="' + i + '" aria-pressed="' + (S.eleg === i) + '">' + esc(nombreOpc(dil, i)) + '</button>';
        }).join("") + '</div>';
      h += '<div id="' + id + '-res" aria-live="polite"></div>';
      cuerpo.innerHTML = h;

      dil.ctrl.forEach(function (c) {
        var cid = id + "-c-" + c.k, inp = cuerpo.querySelector("#" + cid);
        inp.addEventListener("input", function () {
          S.vals[dil.id][c.k] = Number(inp.value);
          pintar();
        });
        if (c.opt) {
          cuerpo.querySelector("#" + cid + "-on").addEventListener("change", function (e) {
            S.tOn = e.target.checked;
            inp.disabled = !S.tOn;
            pintar();
          });
        }
      });
      Array.prototype.forEach.call(cuerpo.querySelectorAll("#" + id + "-eleg button"), function (b) {
        b.addEventListener("click", function () {
          S.eleg = Number(b.getAttribute("data-e"));
          Array.prototype.forEach.call(cuerpo.querySelectorAll("#" + id + "-eleg button"), function (o) {
            o.setAttribute("aria-pressed", String(Number(o.getAttribute("data-e")) === S.eleg));
          });
          pintar();
        });
      });
      pintar();
    }

    function pintar() {
      var dil = DIL[S.i], v = valores(), out = cuerpo.querySelector("#" + id + "-res");
      dil.ctrl.forEach(function (c) {
        var o = cuerpo.querySelector("#" + id + "-c-" + c.k + "-o");
        o.textContent = fmt(S.vals[dil.id][c.k], 0) + c.suf;
      });
      if (S.eleg === null) {
        out.innerHTML = '<p class="w-hint">Elige A o B para ver las dos recomendaciones.</p>';
        return;
      }
      var e = evaluar(dil, v), r = e.r, h = "";
      var vu = e.u === -1 ? "Indiferente: las dos opciones dan lo mismo." : "Recomienda " + nombreOpc(dil, e.u) + ".";
      var vd = e.d.pick === -1 ? "Permite las dos opciones." : "Recomienda " + nombreOpc(dil, e.d.pick) + ".";
      h += '<div class="w-res">' + esc(coincide(S.eleg, e.u, e.d.pick)) + '</div>';
      h += '<div class="w-cols">';
      h += '<div class="w-card"><h5>Utilitarismo</h5><dl class="w-num">';
      [0, 1].forEach(function (i) {
        h += '<div' + (e.u === i ? ' class="w-win"' : "") + '><dt>' + (i === 0 ? "A" : "B") + ': utilidad esperada</dt><dd>' + fmt(r.eu[i], r.d) + '</dd></div>';
      });
      h += '</dl><p class="w-fijos">A = ' + esc(r.formulas[0]) + '<br>B = ' + esc(r.formulas[1]) + '<br>Unidad: ' + esc(r.unit) + '.</p>';
      h += '<p class="w-verd">' + esc(vu) + '</p>';
      if (r.extra) h += '<p>' + esc(r.extra) + '</p>';
      if (r.frag) h += '<p class="w-aviso">' + esc(r.frag) + '</p>';
      h += '<div class="w-obj"><h6>Objeción del libro: ' + esc(e.oU.t) + '</h6><p>' + esc(e.oU.x) + '</p></div></div>';
      h += '<div class="w-card"><h5>Deontología</h5><p class="w-verd">' + esc(vd) + '</p><p>' + esc(e.d.text) + '</p>';
      h += '<div class="w-obj"><h6>Objeción del libro: ' + esc(e.oD.t) + '</h6><p>' + esc(e.oD.x) + '</p></div></div>';
      h += '</div>';
      out.innerHTML = h;
    }

    dibujarTabs();
    dibujarCaso();
  };

  /* Gancho para pruebas fuera del navegador (no lo usa la lección). */
  window.WIDGETS["m11-l05-dilemas"]._evaluar = function (i, v) { return evaluar(DIL[i], v); };
})();
