/* Simulador "m10-l02-diseno": diseña la gobernanza de una empresa ficticia de IA sanitaria (Vitalia IA).
   Ocho palancas del libro 8.4 (forma juridica, estatutos, propiedad, consejo, directivos, unidades,
   auditoria interna y garantia externa), una opcion por palanca. Cada opcion muestra su punto fuerte y su punto
   debil segun el libro (con pagina) o, marcado como "lectura propia", segun la leccion.
   La valoracion frente a cuatro presiones comerciales (0 nada, 1 parcial, 2 firme), las reglas de interaccion,
   el veredicto y el presupuesto de friccion son PROPIOS de la leccion, no del libro.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;
  var PRESUPUESTO = 8;

  var PRESIONES = [
    { t: "Carrera de lanzamiento", txt: "Un competidor anuncia un modelo de triaje parecido. Producto quiere lanzar el vuestro la semana próxima, sin haber terminado la evaluación de sesgos por sexo y edad." },
    { t: "Ronda de inversión", txt: "Un fondo entra con el 40 % del capital y pide crecer más deprisa: propone recortar a la mitad el equipo de seguridad y vender a más hospitales." },
    { t: "Fallo escondido", txt: "Las pruebas internas muestran que el modelo empeora en mujeres jóvenes. El director general, con un bono ligado a los ingresos, prefiere dejarlo para la versión siguiente." },
    { t: "Oferta de compra", txt: "Una gran tecnológica ofrece comprar la empresa con una prima del 60 %. Su plan es lanzar el producto sin la validación clínica lenta que hoy exigís." }
  ];

  var P = [
    { n: "Forma jurídica", opc: [
      { c: "C-corp", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "pp. 468-469",
        f: "Es la forma más común en EE. UU.: Google, Microsoft y Meta son C-corp.",
        d: "Debe maximizar el valor para los accionistas, así que sacrificar beneficio por seguridad choca con el deber de quien gobierna.",
        dep: "" },
      { c: "PBC (sociedad de beneficio público)", coste: 1, r: [1, 1, 0, 1], pag: "p. 469",
        nt: { 0: "Frenar el lanzamiento entra en lo que la empresa puede perseguir.", 1: "Los inversores no pueden exigir solo rentabilidad, pero pueden pedirla.", 3: "El consejo puede pesar el beneficio público frente a la prima." },
        f: "Además del valor puede perseguir un beneficio público, y sus estatutos deben declararlo.",
        d: "Permite, no obliga (lectura propia): sin un mecanismo de control, la declaración no frena un lanzamiento por sí sola.",
        dep: "" },
      { c: "LP propiedad de una entidad sin ánimo de lucro", coste: 3, r: [1, 2, 0, 2], pag: "pp. 469-470",
        nt: { 0: "El consejo de la entidad puede frenar sin incumplir su deber de misión.", 1: "Quien controla no rinde cuentas solo ante el capital.", 3: "El deber de misión pesa más que la oferta." },
        f: "Ejemplo del libro (fecha de 2024): el consejo de la entidad debe velar por que la IA beneficie a la humanidad, no maximizar valor.",
        d: "Estructura compleja para inversores (lectura propia) y ejemplo fechado: el libro es de 2024 y la estructura real puede haber cambiado.",
        dep: "que el consejo de la entidad sin ánimo de lucro se mantenga fiel a la misión" }
    ] },
    { n: "Estatutos", opc: [
      { c: "Misión declarada, sin reglas específicas", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "p. 469",
        f: "Suele ser obligatoria y no cuesta nada.",
        d: "Una frase de misión no obliga a hacer ni a dejar de hacer nada concreto (lectura propia).", dep: "" },
      { c: "Veto del consejo sobre el despliegue de modelos nuevos", coste: 2, r: [2, 0, 1, 0], pag: "p. 469",
        nt: { 0: "Puede detener el lanzamiento antes de que ocurra.", 2: "Si el fallo llega al consejo, puede parar el despliegue." },
        f: "Convierte una voz en un poder: el libro pone como ejemplo de regla específica que el consejo pueda vetar un despliegue.",
        d: "Solo sirve si el consejo se entera a tiempo y se atreve a usarlo; en una C-corp choca con el deber de maximizar valor (lectura propia).",
        dep: "un consejo informado que se atreva a usar el veto" }
    ] },
    { n: "Propiedad", opc: [
      { c: "Una clase de acciones", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "p. 470",
        f: "Es sencilla y la que esperan los inversores (lectura propia).",
        d: "Los accionistas pueden presionar con resoluciones en junta y demandas a los consejeros; quien más acciones tiene, más pesa (esto último, lectura propia).", dep: "" },
      { c: "Dos clases de acciones", coste: 1, r: [0, 2, 0, 2], pag: "p. 470",
        nt: { 1: "Los inversores aportan capital, pero no pueden imponer el recorte.", 3: "Sin el voto de los fundadores no hay venta." },
        f: "Las dos clases dan propiedad, pero solo una vota: los fundadores conservan el control y otros ponen capital.",
        d: "Todo el contrapeso descansa en los fundadores: si cambian de idea o se marchan, no hay red (lectura propia).",
        dep: "que los fundadores mantengan la misión" },
      { c: "Beneficio limitado (capped-profit)", coste: 2, r: [0, 1, 0, 1], pag: "p. 470",
        nt: { 1: "Con el retorno topado, correr más rinde menos a los inversores.", 3: "La prima resulta menos atractiva para quien tiene el retorno topado." },
        f: "El retorno de los inversores tiene techo y lo que lo supera pasa a la entidad sin ánimo de lucro.",
        d: "Modera el incentivo, no decide nada (lectura propia): alguien sigue controlando, y con un techo muy alto casi no cambia nada.", dep: "" },
      { c: "Fideicomiso de beneficio a largo plazo", coste: 3, r: [1, 2, 1, 2], pag: "pp. 470-471",
        nt: { 0: "Elige a un consejo pensado para frenar, aunque sea de forma indirecta.", 1: "El control no está en manos de quienes piden el recorte.", 2: "El consejo que elige puede sustituir al director.", 3: "Un consejo elegido por el fideicomiso puede rechazar la oferta." },
        f: "Un fideicomiso elige a los consejeros, que en teoría podrían despedir al director general (ejemplo del libro); también cabe pasar el control a un comité que represente a la sociedad.",
        d: "El libro dice \"en teoría\": la influencia es indirecta y depende de quiénes sean los fideicomisarios (lectura propia).",
        dep: "que los fideicomisarios sean independientes y ejerzan su poder" }
    ] },
    { n: "Consejo", opc: [
      { c: "Consejo sin comités específicos", coste: 0, r: [0, 0, 1, 0], pag: "p. 470",
        nt: { 2: "Puede sustituir al director general, si llega a enterarse." },
        f: "Ya fija las prioridades, supervisa el riesgo y puede sustituir al director general.",
        d: "Su influencia suele ser indirecta y, sin comités, nadie trabaja el riesgo a fondo (esto último, lectura propia).", dep: "" },
      { c: "Comités de riesgo y de auditoría", coste: 1, r: [1, 0, 1, 0], pag: "pp. 470-471",
        nt: { 0: "Puede exigir la evaluación pendiente, pero no la impone.", 2: "Recibe informes de riesgo y hace preguntas." },
        f: "El libro cita comités de riesgo y de auditoría como relevantes para la seguridad; darían al consejo tiempo y criterio propio y un lugar donde llegan los informes (lectura propia).",
        d: "Un comité prepara y asesora; decide el pleno del consejo (lectura propia).", dep: "" }
    ] },
    { n: "Directivos", opc: [
      { c: "Sin director de riesgos, bono solo por ingresos", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "p. 471",
        f: "Ninguna, y no cuesta nada.",
        d: "El libro recuerda que la remuneración orienta la conducta de los directivos; un bono solo por ingresos empuja en contra de la seguridad (lectura propia).", dep: "" },
      { c: "Director de riesgos y bono con indicadores de seguridad", coste: 1, r: [1, 0, 1, 0], pag: "p. 471",
        nt: { 0: "Puede dar la alarma desde dentro.", 2: "El bono deja de premiar esconderlo, pero decide igualmente el director." },
        f: "Hay una persona que responde del riesgo y la remuneración no premia solo la velocidad (el director de riesgos es del libro; los indicadores en el bono, lectura propia).",
        d: "Al director de riesgos lo nombra el director general, así que su independencia es limitada.", dep: "" },
      { c: "Lo anterior más antecedentes y postura ante riesgos de IA al nombrar", coste: 2, r: [1, 1, 1, 0], pag: "p. 471",
        nt: { 0: "Un equipo directivo sensibilizado discute el lanzamiento.", 1: "El equipo directivo resiste la presión con argumentos de riesgo.", 2: "Es menos probable que esconda el fallo." },
        f: "Filtra al nombrar: el libro sugiere comprobar antecedentes y qué piensa cada candidato sobre los riesgos de la IA.",
        d: "Sirve con las personas que se nombran hoy; no protege si la presión las cambia después (lectura propia).", dep: "" }
    ] },
    { n: "Unidades internas", opc: [
      { c: "Sin unidad específica de seguridad", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "p. 471",
        f: "Ninguna, y no cuesta nada.",
        d: "La seguridad depende de que cada equipo de producto se acuerde de ella (lectura propia).", dep: "" },
      { c: "Equipo de seguridad y gobernanza con recursos y respaldo", coste: 1, r: [1, 1, 1, 0], pag: "p. 471",
        nt: { 0: "Detecta la evaluación pendiente y la señala.", 1: "Defiende su presupuesto con datos.", 2: "Es quien probablemente encontró el fallo." },
        f: "Alguien tiene por oficio pensar en el riesgo; el libro pide que tenga recursos y el respaldo de la dirección.",
        d: "El respaldo se puede retirar: si el presupuesto lo controla quien tiene prisa, el equipo se queda sin manos (lectura propia).", dep: "" },
      { c: "Equipo, comité de ética y revisión tipo IRB", coste: 2, r: [1, 1, 1, 0], pag: "p. 471",
        nt: { 0: "Revisa el lanzamiento antes de que salga.", 1: "Defiende su presupuesto con datos.", 2: "Es quien probablemente encontró el fallo." },
        f: "Suma un comité de ética asesor y una revisión previa de lanzamientos y publicaciones delicadas, como la de Google DeepMind con AlphaFold.",
        d: "Asesora y revisa, no decide: sin un poder detrás, el informe puede quedar en un cajón (lectura propia).", dep: "" }
    ] },
    { n: "Auditoría interna", opc: [
      { c: "Sin auditoría interna", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "p. 471",
        f: "Ninguna, y no cuesta nada.",
        d: "La dirección decide qué información llega al consejo (lectura propia).", dep: "" },
      { c: "Auditoría independiente que informa al consejo", coste: 1, r: [1, 0, 1, 0], pag: "p. 471",
        nt: { 0: "Deja constancia de la evaluación pendiente y llega al consejo sin filtro.", 2: "Encuentra el fallo y lo lleva al consejo sin pasar por el director." },
        f: "Es independiente de la dirección y informa directamente al consejo, así que la información no pasa por quien podría filtrarla.",
        d: "Informa, no decide: sirve si el consejo puede y quiere actuar (lectura propia).",
        dep: "un consejo que actúe con lo que le llega" }
    ] },
    { n: "Garantía externa", opc: [
      { c: "Solo los informes que exige la ley", coste: 0, r: [0, 0, 0, 0], nt: {}, pag: "pp. 471-472",
        f: "Cumple lo obligatorio, como informar de si el consejo tiene un comité de auditoría.",
        d: "Casi no deja ver desde fuera cómo se decide la seguridad (lectura propia).", dep: "" },
      { c: "Fichas de modelo y publicación de estrategia y prácticas", coste: 1, r: [1, 1, 1, 0], pag: "p. 472",
        nt: { 0: "Lanzar sin la evaluación tendría que constar en la ficha.", 1: "Recortar seguridad tendría un coste reputacional a la vista.", 2: "Una omisión en la ficha puede detectarse desde fuera." },
        f: "Permite que investigadores y sociedad civil examinen lo que la empresa dice hacer.",
        d: "La empresa publica lo que elige publicar; sin verificación externa, es una declaración (lectura propia).", dep: "" },
      { c: "Auditorías de terceros, equipos rojos y recompensas por fallos", coste: 2, r: [1, 0, 2, 0], pag: "p. 472",
        nt: { 0: "Un equipo rojo antes de lanzar puede encontrar el sesgo.", 2: "Un tercero no depende del director general y puede hallar el fallo." },
        f: "Expertos ajenos a la empresa examinan el modelo de forma adversaria y se premia a quien encuentra errores.",
        d: "Los suele encargar la propia empresa, que puede decidir no publicar ni corregir lo hallado (lectura propia).",
        dep: "que la empresa publique y corrija lo que se encuentre" }
    ] }
  ];

  var PRESETS = [
    { n: "Punto de partida", v: [0, 0, 0, 1, 1, 1, 1, 0] },
    { n: "Todo al mínimo", v: [0, 0, 0, 0, 0, 0, 0, 0] }
  ];
  var INICIAL = PRESETS[0].v;

  /* ---------- Modelo (todo propio de la leccion) ---------- */
  function evaluar(sel) {
    var ent = [], p, s, o, coste = 0;
    for (p = 0; p < P.length; p++) {
      o = P[p].opc[sel[p]];
      coste += o.coste;
      ent[p] = [];
      for (s = 0; s < 4; s++) ent[p][s] = { r: o.r[s], nt: o.nt && o.nt[s] ? o.nt[s] : "" };
    }
    var forma = sel[0], est = sel[1], prop = sel[2], cons = sel[3], dir = sel[4], uni = sel[5], aud = sel[6];
    var canales = (cons === 1 ? 1 : 0) + (dir >= 1 ? 1 : 0) + (uni >= 1 ? 1 : 0) + (aud === 1 ? 1 : 0);
    // Reglas de interaccion, en orden
    if (est === 1 && forma === 0)
      ent[1][0] = { r: 1, nt: "En una C-corp, vetar cuesta valor y choca con el deber de maximizar el de los accionistas." };
    if (est === 1 && canales === 0) {
      ent[1][0] = { r: Math.min(ent[1][0].r, 1), nt: "Tiene el poder, pero ningún canal de información le avisa a tiempo." };
      ent[1][2] = { r: 0, nt: "" };
    }
    var vetoFirme = est === 1 && ent[1][0].r === 2;
    if (aud === 1 && vetoFirme)
      ent[6][0] = { r: 2, nt: "El informe llega a un consejo que sí puede parar el lanzamiento." };
    if (aud === 1 && cons === 1)
      ent[6][2] = { r: 2, nt: "Informa a un comité de auditoría que investiga y pregunta." };
    if (uni === 2 && vetoFirme)
      ent[5][0] = { r: 2, nt: "La revisión previa alimenta un veto que sí puede parar el lanzamiento." };
    if (uni >= 1 && prop === 0)
      ent[5][1] = { r: 0, nt: "" };
    if (prop === 3 && est === 1)
      ent[2][0] = { r: 2, nt: "Los consejeros del fideicomiso tienen además el veto en los estatutos." };

    var ver = [], lista, firm, cov, niv, tit, txt;
    for (s = 0; s < 4; s++) {
      lista = []; firm = 0; cov = 0;
      for (p = 0; p < P.length; p++) {
        if (ent[p][s].r > 0) {
          lista.push({ p: p, r: ent[p][s].r, nt: ent[p][s].nt });
          cov++; if (ent[p][s].r === 2) firm++;
        }
      }
      lista.sort(function (a, b) { return b.r - a.r; });
      if (cov === 0) { niv = "exp"; tit = "Expuesta"; txt = "Ningún mecanismo del diseño interviene: la decisión la toma quien tiene la presión."; }
      else if (firm === 0 && cov === 1) { niv = "deb"; tit = "Muy débil"; txt = "Hay una sola voz y ningún poder de decisión."; }
      else if (firm === 0) { niv = "voz"; tit = "Muchas voces, ningún poder"; txt = "Avisan y opinan, pero nadie puede parar la decisión."; }
      else if (cov === 1) { niv = "uno"; tit = "Depende de un solo mecanismo"; txt = "Frena, pero es un punto único de fallo (m02/l03): si falla, no hay segunda capa."; }
      else { niv = "ok"; tit = "Resiste"; txt = "Hay un mecanismo firme y al menos otro que respalda."; }
      ver.push({ niv: niv, tit: tit, txt: txt, lista: lista, firm: firm, cov: cov });
    }
    var deps = [], vistos = {};
    for (p = 0; p < P.length; p++) {
      var d = P[p].opc[sel[p]].dep, firme = false;
      for (s = 0; s < 4; s++) if (ent[p][s].r === 2) firme = true;
      if (d && firme && !vistos[d]) { vistos[d] = 1; deps.push(d); }
    }
    return { ent: ent, ver: ver, coste: coste, deps: deps };
  }

  /* ---------- Interfaz ---------- */
  function injectStyle() {
    if (document.getElementById("w-gv-style")) return;
    var st = document.createElement("style");
    st.id = "w-gv-style";
    st.textContent = [
      ".w-gv{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-gv h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-gv h5{font:600 .72rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin:1rem 0 .5rem}",
      ".w-gv .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-gv .w-btns{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .8rem}",
      ".w-gv button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-gv button:hover{background:var(--accent-soft)}",
      ".w-gv .w-meter{margin:0 0 .9rem}",
      ".w-gv .w-meter b{font:600 1.05rem var(--cond);color:var(--accent-ink)}",
      ".w-gv .w-bar{height:8px;border-radius:4px;background:var(--rule);overflow:hidden;margin:.35rem 0 0}",
      ".w-gv .w-bar i{display:block;height:100%;background:var(--accent)}",
      ".w-gv .w-bar.w-over i{background:var(--trap)}",
      ".w-gv .w-pals{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr));gap:.8rem}",
      ".w-gv fieldset{border:1px solid var(--rule);border-radius:8px;margin:0;padding:.5rem .7rem .7rem;min-width:0}",
      ".w-gv legend{font:600 .82rem var(--cond);padding:0 .3rem;color:var(--accent-ink)}",
      ".w-gv .w-opt{display:flex;align-items:flex-start;gap:.45rem;padding:.2rem 0;cursor:pointer}",
      ".w-gv .w-opt input{margin-top:.2rem;accent-color:var(--accent);flex:none}",
      ".w-gv .w-opt small{color:var(--faint);font:500 .72rem var(--mono);white-space:nowrap}",
      ".w-gv .w-ficha{background:var(--ground);border-radius:8px;padding:.5rem .65rem;margin:.4rem 0 0;font-size:.82rem;line-height:1.4}",
      ".w-gv .w-ficha p{margin:0 0 .3rem}",
      ".w-gv .w-ficha p:last-child{margin:0}",
      ".w-gv .w-ficha .w-pag{color:var(--faint);font-size:.74rem}",
      ".w-gv .w-pres{border:1px solid var(--rule);border-left-width:5px;border-radius:8px;padding:.6rem .8rem;margin:0 0 .6rem}",
      ".w-gv .w-pres.w-ok{border-left-color:var(--ex)}",
      ".w-gv .w-pres.w-uno{border-left-color:var(--accent)}",
      ".w-gv .w-pres.w-voz,.w-gv .w-pres.w-deb,.w-gv .w-pres.w-exp{border-left-color:var(--trap)}",
      ".w-gv .w-pres h6{margin:0 0 .2rem;font:600 .95rem/1.3 var(--cond)}",
      ".w-gv .w-pres .w-sit{color:var(--muted);margin:0 0 .4rem;font-size:.84rem}",
      ".w-gv .w-tag{display:inline-block;font:600 .72rem var(--mono);letter-spacing:.04em;border-radius:6px;padding:.1rem .45rem;margin-left:.4rem;vertical-align:middle;background:var(--accent-soft);color:var(--accent-ink)}",
      ".w-gv .w-ok .w-tag{background:var(--ex-bg);color:var(--ex)}",
      ".w-gv .w-voz .w-tag,.w-gv .w-deb .w-tag,.w-gv .w-exp .w-tag{background:var(--trap-bg);color:var(--trap)}",
      ".w-gv .w-pres ul{margin:.3rem 0 0;padding-left:1.1rem}",
      ".w-gv .w-pres li{margin:0 0 .15rem;font-size:.84rem}",
      ".w-gv .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.6rem 0 0}",
      ".w-gv .w-cap{color:var(--faint);font-size:.76rem;margin:.6rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function mk(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }

  window.WIDGETS["m10-l02-diseno"] = function (el) {
    injectStyle();
    var id = "w-gv-" + (++uid);
    var sel = INICIAL.slice();
    var radios = [], fichas = [], i;

    el.innerHTML = "";
    var root = mk("div", "w-gv");
    root.appendChild(mk("h4", null, "Diseña la gobernanza de Vitalia IA"));
    root.appendChild(mk("p", "w-hint", "Vitalia IA es una empresa ficticia que vende un modelo de triaje de urgencias. Elige una opción en cada palanca, lee su punto fuerte y su punto débil y mira cómo responde tu diseño a cuatro presiones comerciales."));

    var btns = mk("div", "w-btns");
    var PR = PRESETS.concat([
      { n: "PBC, veto y dos clases", v: [1, 1, 1, 1, 0, 0, 1, 0] },
      { n: "C-corp, veto y fideicomiso", v: [0, 1, 3, 1, 0, 0, 1, 0] }
    ]);
    PR.forEach(function (pr) {
      var b = mk("button", null, pr.n);
      b.type = "button";
      b.addEventListener("click", function () { sel = pr.v.slice(); aplicar(); });
      btns.appendChild(b);
    });
    root.appendChild(btns);

    var meter = mk("div", "w-meter");
    root.appendChild(meter);

    var pals = mk("div", "w-pals");
    P.forEach(function (pal, p) {
      var fs = mk("fieldset");
      fs.appendChild(mk("legend", null, pal.n));
      radios[p] = [];
      pal.opc.forEach(function (o, k) {
        var lb = mk("label", "w-opt");
        var r = document.createElement("input");
        r.type = "radio"; r.name = id + "-p" + p; r.value = String(k);
        r.addEventListener("change", function () { sel[p] = k; refrescar(); });
        radios[p][k] = r;
        lb.appendChild(r);
        var sp = mk("span");
        sp.appendChild(document.createTextNode(o.c + " "));
        sp.appendChild(mk("small", null, "(fricción " + o.coste + ")"));
        lb.appendChild(sp);
        fs.appendChild(lb);
      });
      fichas[p] = mk("div", "w-ficha");
      fs.appendChild(fichas[p]);
      pals.appendChild(fs);
    });
    root.appendChild(pals);

    root.appendChild(mk("h5", null, "Cuatro presiones comerciales"));
    var pres = mk("div");
    root.appendChild(pres);
    var resumen = mk("div", "w-note");
    resumen.setAttribute("aria-live", "polite");
    root.appendChild(resumen);
    root.appendChild(mk("p", "w-cap", "Puntos fuertes y débiles: de la sección 8.4 del libro (con página) o marcados como lectura propia. La valoración frente a las presiones, las reglas de interacción, los veredictos y la fricción son un modelo propio de la lección, no del libro."));
    el.appendChild(root);

    function aplicar() {
      var p, k;
      for (p = 0; p < P.length; p++) for (k = 0; k < radios[p].length; k++) radios[p][k].checked = (sel[p] === k);
      refrescar();
    }

    function refrescar() {
      var p, res = evaluar(sel), o, f;
      for (p = 0; p < P.length; p++) {
        o = P[p].opc[sel[p]];
        f = fichas[p];
        f.innerHTML = "";
        var a = mk("p"); a.appendChild(mk("b", null, "Fuerte. ")); a.appendChild(document.createTextNode(o.f)); f.appendChild(a);
        var b = mk("p"); b.appendChild(mk("b", null, "Débil. ")); b.appendChild(document.createTextNode(o.d)); f.appendChild(b);
        f.appendChild(mk("p", "w-pag", "Libro: " + o.pag));
      }
      var pct = Math.min(100, res.coste / PRESUPUESTO * 100);
      meter.innerHTML = "";
      var ln = mk("div");
      ln.appendChild(mk("b", null, "Fricción " + res.coste + " de " + PRESUPUESTO));
      ln.appendChild(document.createTextNode(res.coste > PRESUPUESTO
        ? ". Te pasas del presupuesto: decide qué palanca sacrificas."
        : ". Fricción es el coste relativo de complejidad y de convencer a inversores (estimación propia)."));
      meter.appendChild(ln);
      var bar = mk("div", "w-bar" + (res.coste > PRESUPUESTO ? " w-over" : ""));
      var fi = mk("i"); fi.style.width = pct + "%";
      bar.appendChild(fi); meter.appendChild(bar);

      pres.innerHTML = "";
      var nOk = 0;
      res.ver.forEach(function (v, s) {
        if (v.niv === "ok") nOk++;
        var c = mk("div", "w-pres w-" + v.niv);
        var h = mk("h6", null, (s + 1) + ". " + PRESIONES[s].t);
        h.appendChild(mk("span", "w-tag", v.tit));
        c.appendChild(h);
        c.appendChild(mk("p", "w-sit", PRESIONES[s].txt));
        c.appendChild(mk("p", null, v.txt));
        if (v.lista.length) {
          var ul = mk("ul");
          v.lista.forEach(function (x) {
            var li = mk("li");
            li.appendChild(mk("b", null, (x.r === 2 ? "Firme" : "Parcial") + ". "));
            li.appendChild(document.createTextNode(P[x.p].n + ": " + P[x.p].opc[sel[x.p]].c + (x.nt ? ". " + x.nt : ".")));
            ul.appendChild(li);
          });
          c.appendChild(ul);
        }
        pres.appendChild(c);
      });
      resumen.innerHTML = "";
      resumen.appendChild(mk("b", null, "Resisten " + nOk + " de 4 presiones. "));
      resumen.appendChild(document.createTextNode(res.deps.length
        ? "Las defensas firmes de tu diseño descansan en: " + res.deps.join("; ") + ". Ningún mecanismo funciona solo por existir: depende de quién lo ocupa."
        : "Ninguna defensa de tu diseño es firme, así que no depende de nadie porque tampoco frena nada."));
    }

    aplicar();
  };
  window.WIDGETS["m10-l02-diseno"].evaluar = evaluar;
  window.WIDGETS["m10-l02-diseno"].datos = P;
})();
