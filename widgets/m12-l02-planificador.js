/* Simulador "m12-l02-planificador": plan por semanas para el proyecto final.
   El usuario elige una de las seis ideas, las horas por semana, las semanas que tiene y si quiere margen.
   El plan reparte las tareas de la idea (en orden) en semanas, marca los hitos y sugiere qué lecciones repasar.
   Si no cabe, propone recortes de extensiones opcionales (nunca de la pregunta, el criterio ni los limites).
   Las horas de cada tarea son ESTIMACIONES PROPIAS del curso, no datos de ninguna fuente.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  var root = (typeof window !== "undefined") ? window : (typeof globalThis !== "undefined" ? globalThis : {});
  root.WIDGETS = root.WIDGETS || {};
  var uid = 0;

  var LEC = {
    "m01/l01": "Uso malicioso de la IA",
    "m01/l03": "Riesgos organizativos",
    "m01/l04": "IA descontrolada y conexiones entre riesgos",
    "m02/l01": "Descomposición del riesgo y nueves de fiabilidad",
    "m02/l02": "Principios de diseño seguro",
    "m02/l03": "Modelos de accidente",
    "m02/l04": "Factores sistémicos y deriva al fallo",
    "m03/l03": "Sistemas complejos y seguridad de la IA",
    "m04/l01": "Robustez adversarial",
    "m04/l02": "Robustez ante cisnes negros",
    "m05/l01": "Monitorización de modelos",
    "m05/l02": "Detección de anomalías",
    "m05/l03": "Incertidumbre interpretable",
    "m05/l06": "Comportamiento emergente y proxy gaming",
    "m06/l01": "Equidad",
    "m06/l02": "Calidad y calibración",
    "m06/l03": "Deriva",
    "m06/l05": "La capa humana",
    "m07/l01": "Alineamiento",
    "m08/l01": "La ley y la IA",
    "m10/l02": "Gobernanza corporativa",
    "m10/l03": "Gobernanza nacional",
    "m10/l04": "Gobernanza internacional",
    "m10/l05": "Gobernanza del cómputo"
  };

  /* h: horas de la tarea (multiplos de 0,5). cut: orden de recorte (1 = lo primero que se quita).
     sol: "auth" solo si trabajas en un fork propio de Vigia (MIT); "libre" solo sin fork. */
  var IDEAS = [
    { id: "i1", n: "1. FMEA y pajarita de un modelo clínico", tareas: [
      { n: "Delimitar el sistema y el evento no deseado", h: 1.5, rep: ["m02/l01"], hito: "Sistema y evento central descritos en una página" },
      { n: "Descomponer el riesgo con la ecuación", h: 1.5, rep: ["m02/l01"], hito: "Peligro, exposición y vulnerabilidad, con los supuestos marcados", cut: 2, cuesta: "priorizas sin escala común (criterio 3, método)" },
      { n: "FMEA de 8 a 10 modos de fallo", h: 3, rep: ["m02/l03"], hito: "Tabla FMEA priorizada" },
      { n: "Pajarita de los dos modos principales", h: 2.5, rep: ["m02/l03", "m02/l02"], hito: "Dos pajaritas con medidas preventivas y protectoras" },
      { n: "Capas como nueves y prueba de independencia", h: 1.5, rep: ["m02/l01", "m02/l02", "m02/l04"], hito: "Nueves por capa y capas con causa común detectadas", cut: 1, cuesta: "no compruebas si las capas son independientes (criterio 4, evidencia)" },
      { n: "Redacción, con lo que el análisis no ve", h: 2, rep: ["m03/l03", "m02/l04"], hito: "Informe de 2 a 4 páginas con límites declarados" }
    ] },
    { id: "i2", n: "2. Detector fuera de distribución: MSP y exposición a atípicos", tareas: [
      { n: "Preparar el entorno y ejecutar el notebook", h: 2, rep: ["m05/l02"], hito: "Notebook de detección de anomalías ejecutado con el modelo de CIFAR-10" },
      { n: "Fijar el protocolo: qué es normal, qué es anómalo y qué umbral cuenta como mejora", h: 2, rep: ["m05/l02", "m05/l01"], hito: "Protocolo y criterio de éxito escritos antes de medir" },
      { n: "Línea base: MSP con AUROC y FPR95", h: 4, rep: ["m05/l02"], hito: "Tabla de la línea base" },
      { n: "Entrenar con exposición a atípicos y medir", h: 5, rep: ["m05/l02", "m04/l02"], hito: "Tabla MSP frente a exposición a atípicos" },
      { n: "Añadir un conjunto anómalo cercano al normal", h: 2, rep: ["m05/l02", "m04/l02"], hito: "Resultados con un conjunto anómalo difícil", cut: 1, cuesta: "no sabes si la mejora generaliza (criterio 3, método)" },
      { n: "Repetir con varias semillas y dar intervalos", h: 2, rep: ["m06/l02"], hito: "Diferencias con su margen de ruido", cut: 2, cuesta: "no distingues mejora de ruido (criterio 4, evidencia)" },
      { n: "Redacción, con lo que no se probó", h: 3, rep: [], hito: "Informe de 2 a 4 páginas con límites declarados" }
    ] },
    { id: "i3", n: "3. Calibración de un clasificador público y su lectura en Vigía", tareas: [
      { n: "Elegir el clasificador y los datos públicos no clínicos", h: 2, rep: ["m05/l03"], hito: "Modelo y datos fijados, sin datos de pacientes" },
      { n: "Medir: curva de fiabilidad, ECE y Brier", h: 3, rep: ["m05/l03"], hito: "Curva de fiabilidad y cifras de calibración" },
      { n: "Escalado de temperatura y comparación", h: 2, rep: ["m05/l03"], hito: "Calibración antes y después de corregir", cut: 2, cuesta: "diagnosticas, pero no compruebas la corrección (criterio 3, método)" },
      { n: "Simular un cambio de población", h: 2, rep: ["m04/l02", "m05/l03"], hito: "Calibración bajo cambio", cut: 1, cuesta: "no sabes si la calibración aguanta un cambio (criterio 4, evidencia)" },
      { n: "Cargar los datos en un proyecto propio de Vigía y leer sus monitores", h: 4, rep: ["m06/l02", "m06/l03"], hito: "Capturas de lo que Vigía ve y de lo que no ve" },
      { n: "Redacción, con lo que Vigía no mide", h: 3, rep: [], hito: "Informe de 2 a 4 páginas con límites declarados" }
    ] },
    { id: "i4", n: "4. Escenario de deriva nuevo para la demo de Vigía", tareas: [
      { n: "Elegir el tipo de deriva y la hipótesis", h: 2, rep: ["m06/l03"], hito: "Hipótesis: qué cambia, cuándo y qué monitor debería saltar" },
      { n: "Especificar el escenario en papel: fases, parámetros y umbrales", h: 4, rep: ["m06/l03", "m04/l02"], hito: "Especificación de una página" },
      { n: "Predecir por escrito qué saltará y qué no", h: 2, rep: ["m06/l03", "m06/l02"], hito: "Predicción fechada antes de ejecutar nada" },
      { n: "Implementar el escenario en un fork propio de Vigía (solo si trabajas en un fork)", h: 5, rep: ["m06/l03"], hito: "Escenario implementado en tu fork de Vigía", sol: "auth" },
      { n: "Ensayos en el laboratorio de la demo y con ficheros sintéticos en un proyecto propio (sin código: especificación y ensayos)", h: 5, rep: ["m06/l03"], hito: "Ensayos ejecutados en una carpeta de datos propia", sol: "libre" },
      { n: "Ejecutar y comparar con la predicción", h: 3, rep: ["m06/l03"], hito: "Predicción frente a resultado" },
      { n: "Añadir la fase de recuperación", h: 2, rep: ["m06/l03"], hito: "Comprobado que el monitor se calma al corregir", cut: 1, cuesta: "no compruebas que la alerta desaparece al corregir (criterio 3, método)" },
      { n: "Redacción: qué acertó y qué no la predicción", h: 2, rep: [], hito: "Informe de 2 a 4 páginas con límites declarados" }
    ] },
    { id: "i5", n: "5. Evaluación responsable de un LLM local (red team)", tareas: [
      { n: "Alcance y reglas de contención", h: 2, rep: ["m01/l01", "m07/l01"], hito: "Alcance, reglas y exclusiones por escrito" },
      { n: "Batería de conductas por tipo de fallo, sin material dañino", h: 3, rep: ["m05/l01", "m05/l03"], hito: "Batería de consultas por categoría" },
      { n: "Ejecutar con semilla, temperatura y versión registradas", h: 4, rep: ["m04/l02"], hito: "Registro de ejecuciones reproducible" },
      { n: "Clasificar fallos: gravedad, frecuencia y reproducibilidad", h: 3, rep: ["m02/l01", "m03/l03"], hito: "Catálogo de fallos priorizado" },
      { n: "Repetir con otra formulación o variante del modelo", h: 2, rep: ["m04/l02"], hito: "Fallos que persisten y fallos que dependían de la formulación", cut: 1, cuesta: "no distingues fallo del modelo y fallo de la consulta (criterio 4, evidencia)" },
      { n: "Contramedidas y límites", h: 2, rep: ["m01/l04", "m05/l06"], hito: "Contramedidas propuestas y lo que no se evaluó" },
      { n: "Redacción del informe de fallos", h: 2, rep: [], hito: "Informe de 2 a 4 páginas, sin contenido dañino" }
    ] },
    { id: "i6", n: "6. Ficha de gobernanza de un sistema de IA sanitaria", tareas: [
      { n: "Describir el sistema, su uso previsto y quién decide", h: 1.5, rep: ["m08/l01"], hito: "Descripción de una página, con datos sintéticos o ficticios" },
      { n: "Mapa de actores y riesgos", h: 2, rep: ["m02/l01", "m01/l03"], hito: "Riesgos priorizados y responsables" },
      { n: "Nivel corporativo: forma jurídica, propiedad y garantías", h: 2, rep: ["m10/l02"], hito: "Sección corporativa" },
      { n: "Nivel nacional: normas, regulación y responsabilidad", h: 2, rep: ["m10/l03", "m08/l01"], hito: "Sección nacional, con la norma aplicable comprobada en su texto oficial" },
      { n: "Nivel internacional y de cómputo, si aplica", h: 1.5, rep: ["m10/l04", "m10/l05"], hito: "Sección internacional o justificación de por qué no aplica", cut: 1, cuesta: "la ficha no dice qué pasa fuera de tu jurisdicción (criterio 3, método)" },
      { n: "Plan de monitorización y de alerta", h: 2, rep: ["m06/l03", "m06/l05"], hito: "Monitores, umbrales y quién actúa" },
      { n: "Revisión cruzada de huecos y redacción", h: 2, rep: ["m03/l03"], hito: "Ficha con los huecos declarados" }
    ] }
  ];

  function ideaPorId(id) { var i; for (i = 0; i < IDEAS.length; i++) if (IDEAS[i].id === id) return IDEAS[i]; return IDEAS[0]; }

  function fmt(x) { return Number(x).toLocaleString("es-ES", { maximumFractionDigits: 1 }); }
  function h2s(v) { return fmt(v / 2); }

  /* Reparte las tareas, en orden, en semanas de capH horas (todo en medias horas, enteros). */
  function reparte(tareas, capH) {
    var cap = Math.round(capH * 2), semanas = [], cur = { t: [], u: 0 }, i, rem, tomo, empez;
    for (i = 0; i < tareas.length; i++) {
      rem = tareas[i].h2; empez = false;
      while (rem > 0) {
        if (cur.u >= cap) { semanas.push(cur); cur = { t: [], u: 0 }; }
        tomo = Math.min(rem, cap - cur.u);
        cur.t.push({ p: tareas[i], h2: tomo, fin: tomo === rem, ini: !empez });
        cur.u += tomo; rem -= tomo; empez = true;
      }
    }
    if (cur.u > 0) semanas.push(cur);
    return semanas;
  }

  /* Plan completo. ncortes = cuantos recortes se aplican (0 = ninguno). */
  function plan(idId, capH, margen, auth, ncortes) {
    var idea = ideaPorId(idId), tareas = [], quitadas = [], base2 = 0, m2 = 0, i, p;
    for (i = 0; i < idea.tareas.length; i++) {
      p = idea.tareas[i];
      if (p.sol === "auth" && !auth) continue;
      if (p.sol === "libre" && auth) continue;
      if (p.cut && p.cut <= ncortes) { quitadas.push(p); continue; }
      tareas.push({ n: p.n, h2: Math.round(p.h * 2), rep: p.rep, hito: p.hito, cut: p.cut, cuesta: p.cuesta });
      base2 += Math.round(p.h * 2);
    }
    if (margen) {
      m2 = Math.ceil(base2 * 0.2);
      tareas.push({ n: "Margen para imprevistos (20 %)", h2: m2, rep: [], hito: "Entrega", margen: true });
    }
    return { idea: idea, base2: base2, m2: m2, total2: base2 + m2, semanas: reparte(tareas, capH), quitadas: quitadas };
  }

  function maxCortes(idId, auth) {
    var idea = ideaPorId(idId), mx = 0, i, p;
    for (i = 0; i < idea.tareas.length; i++) {
      p = idea.tareas[i];
      if (p.sol === "auth" && !auth) continue;
      if (p.sol === "libre" && auth) continue;
      if (p.cut && p.cut > mx) mx = p.cut;
    }
    return mx;
  }

  /* Menor numero de recortes con el que cabe; si ninguno basta, todos, y cabe = false. */
  function sugerido(idId, capH, margen, auth, maxSem) {
    var mx = maxCortes(idId, auth), n, pl;
    for (n = 1; n <= mx; n++) {
      pl = plan(idId, capH, margen, auth, n);
      if (pl.semanas.length <= maxSem) return { n: n, cabe: true, plan: pl };
    }
    return { n: mx, cabe: false, plan: plan(idId, capH, margen, auth, mx) };
  }

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-pl-style")) return;
    var st = document.createElement("style");
    st.id = "w-pl-style";
    st.textContent = [
      ".w-pl{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-pl h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-pl .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-pl .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.7rem .9rem;margin:0 0 .7rem}",
      ".w-pl .w-f label{display:flex;justify-content:space-between;gap:.5rem;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-pl .w-f label b{color:var(--accent-ink);font-weight:600}",
      ".w-pl input[type=range]{width:100%;accent-color:var(--accent)}",
      ".w-pl select{width:100%;font:500 .95rem var(--cond);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .5rem}",
      ".w-pl [hidden]{display:none}",
      ".w-pl .w-chk{display:flex;align-items:flex-start;gap:.5rem;margin:0 0 .6rem;color:var(--ink)}",
      ".w-pl .w-chk input{margin-top:.2rem;accent-color:var(--accent)}",
      ".w-pl .w-res{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:.4rem 0 .7rem}",
      ".w-pl .w-aviso{background:var(--trap-bg);border:1px solid var(--trap);border-radius:8px;padding:.6rem .8rem;margin:0 0 .7rem}",
      ".w-pl .w-ok{background:var(--ex-bg);border:1px solid var(--ex);border-radius:8px;padding:.6rem .8rem;margin:0 0 .7rem}",
      ".w-pl .w-aviso ul,.w-pl .w-ok ul{margin:.3rem 0 0;padding-left:1.1rem}",
      ".w-pl button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer;margin:.4rem .4rem 0 0}",
      ".w-pl button:hover{background:var(--accent-soft)}",
      ".w-pl table{border-collapse:collapse;width:100%;font-size:.86rem}",
      ".w-pl th{font:600 .68rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);text-align:left;padding:.4rem .5rem;border-bottom:1px solid var(--rule-strong)}",
      ".w-pl td{vertical-align:top;padding:.5rem;border-bottom:1px solid var(--rule)}",
      ".w-pl td ul{margin:0;padding-left:1rem}",
      ".w-pl .w-barra{display:block;height:.5rem;background:var(--accent);border-radius:4px;margin-top:.3rem}",
      ".w-pl .w-hito{font-weight:600;color:var(--accent-ink)}",
      ".w-pl .w-tw{overflow-x:auto;border:1px solid var(--rule);border-radius:8px;background:var(--ground)}",
      ".w-pl .w-tw table{min-width:36rem}",
      ".w-pl .w-cap{color:var(--faint);font-size:.76rem;margin:.5rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function enlaceLec(k) {
    return '<a href="#/' + k + '">' + k + ' ' + LEC[k] + '</a>';
  }

  function widget(el) {
    injectStyle();
    var id = "w-pl-" + (++uid);
    var S = { idea: "i2", h: 4, max: 8, margen: true, auth: false, cortes: false };
    var opts = IDEAS.map(function (i) { return '<option value="' + i.id + '"' + (i.id === S.idea ? " selected" : "") + '>' + i.n + '</option>'; }).join("");
    var maxs = [4, 6, 8, 10, 12].map(function (v) { return '<option value="' + v + '"' + (v === S.max ? " selected" : "") + '>' + v + ' semanas</option>'; }).join("");

    el.innerHTML = '<div class="w-pl">' +
      '<h4>Planificador del proyecto</h4>' +
      '<p class="w-hint">Elige una idea y cuántas horas a la semana puedes dedicarle. El plan reparte las tareas en semanas, marca el hito con el que cierra cada una y te dice qué lecciones repasar. Las horas de cada tarea son estimaciones propias del curso.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-i">Idea</label><select id="' + id + '-i">' + opts + '</select></div>' +
      '<div class="w-f"><label for="' + id + '-h">Horas por semana <b id="' + id + '-hv"></b></label><input type="range" id="' + id + '-h" min="2" max="20" step="1" value="' + S.h + '"></div>' +
      '<div class="w-f"><label for="' + id + '-m">Plazo máximo</label><select id="' + id + '-m">' + maxs + '</select></div>' +
      '</div>' +
      '<label class="w-chk"><input type="checkbox" id="' + id + '-g" checked><span>Añadir un margen del 20 % para imprevistos</span></label>' +
      '<label class="w-chk" id="' + id + '-al" hidden><input type="checkbox" id="' + id + '-a"><span>Trabajo en un fork propio de Vigía (sin fork, el plan usa solo la especificación y ensayos con datos propios)</span></label>' +
      '<div id="' + id + '-out" aria-live="polite"></div>' +
      '<p class="w-cap">Las lecciones se abren al pulsar su enlace; vuelve aquí con el navegador. Las horas son un orden de magnitud: si tus dos primeras semanas se desvían, rehaz el plan con lo que tardaste de verdad.</p>' +
      '</div>';

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var out = $("out");

    function pinta() {
      var pl, sug = null, cap = S.h, txt, i, j, s, sem, semTxt, reps, seen, hitos, tareas, hlen, aviso = "", cabe;
      $("hv").textContent = S.h + " h";
      $("al").hidden = (S.idea !== "i4");
      if (S.cortes) { sug = sugerido(S.idea, cap, S.margen, S.auth, S.max); pl = sug.plan; }
      else pl = plan(S.idea, cap, S.margen, S.auth, 0);
      cabe = pl.semanas.length <= S.max;

      txt = '<p class="w-res"><strong>' + pl.semanas.length + ' ' + (pl.semanas.length === 1 ? "semana" : "semanas") + '</strong>: ' +
        h2s(pl.base2) + ' h de trabajo' + (S.margen ? ' más ' + h2s(pl.m2) + ' h de margen, ' + h2s(pl.total2) + ' h en total' : '') +
        ', a ' + cap + ' h por semana. Plazo máximo: ' + S.max + ' semanas.</p>';

      if (!S.cortes && !cabe) {
        sug = sugerido(S.idea, cap, S.margen, S.auth, S.max);
        aviso = '<div class="w-aviso" role="alert"><strong>No cabe en ' + S.max + ' semanas.</strong> ';
        if (maxCortes(S.idea, S.auth) === 0) aviso += 'Esta idea no tiene extensiones que recortar sin dañar el proyecto: sube las horas por semana o amplía el plazo.';
        else if (sug.cabe) aviso += 'Con ' + sug.n + (sug.n === 1 ? " recorte" : " recortes") + ' de extensiones sí cabe (' + sug.plan.semanas.length + ' semanas).';
        else aviso += 'Ni recortando todas las extensiones cabe (' + sug.plan.semanas.length + ' semanas): sube las horas por semana, amplía el plazo o cambia de idea.';
        if (maxCortes(S.idea, S.auth) > 0) aviso += '</div><button type="button" id="' + id + '-c">Ver el plan con los recortes sugeridos</button>';
        else aviso += '</div>';
      } else if (S.cortes) {
        aviso = '<div class="' + (cabe ? "w-ok" : "w-aviso") + '"><strong>Plan recortado' + (cabe ? "" : ", y aun así no cabe") + '.</strong> Lo que sale y lo que cuesta:<ul>';
        for (i = 0; i < pl.quitadas.length; i++) aviso += '<li>' + pl.quitadas[i].n + ' (' + fmt(pl.quitadas[i].h) + ' h): ' + pl.quitadas[i].cuesta + '.</li>';
        aviso += '</ul><p style="margin:.4rem 0 0">Nunca se recorta la pregunta, el criterio de éxito ni los límites. Si el criterio nombraba algo de lo que sale, reescríbelo antes de medir y declara el recorte en el informe.</p></div>' +
          '<button type="button" id="' + id + '-c">Volver al plan completo</button>';
      } else {
        aviso = '<div class="w-ok"><strong>Cabe en el plazo.</strong> Si en dos semanas vas por detrás, decide entonces qué extensión quitas, antes de tocar la pregunta.</div>';
      }
      txt += aviso;

      txt += '<div class="w-tw"><table><thead><tr><th>Semana</th><th>Tareas</th><th>Repasar</th><th>Hito al cerrar</th></tr></thead><tbody>';
      for (s = 0; s < pl.semanas.length; s++) {
        sem = pl.semanas[s]; tareas = ""; reps = []; seen = {}; hitos = [];
        for (j = 0; j < sem.t.length; j++) {
          tareas += '<li>' + sem.t[j].p.n + ' (' + h2s(sem.t[j].h2) + ' h' + (sem.t[j].fin ? "" : ", continúa") + ')</li>';
          if (sem.t[j].ini) sem.t[j].p.rep.forEach(function (k) { if (!seen[k]) { seen[k] = 1; reps.push(k); } });
          if (sem.t[j].fin) hitos.push(sem.t[j].p.hito);
        }
        hlen = hitos.length ? hitos[hitos.length - 1] : "Sigue la tarea en curso";
        txt += '<tr><td><strong>' + (s + 1) + '</strong><br>' + h2s(sem.u) + ' h<span class="w-barra" style="width:' + Math.round(100 * sem.u / (cap * 2)) + '%"></span></td>' +
          '<td><ul>' + tareas + '</ul></td>' +
          '<td>' + (reps.length ? '<ul>' + reps.map(function (k) { return '<li>' + enlaceLec(k) + '</li>'; }).join("") + '</ul>' : "Nada nuevo") + '</td>' +
          '<td class="w-hito">' + hlen + '</td></tr>';
      }
      txt += '</tbody></table></div>';
      out.innerHTML = txt;
      var b = $("c");
      if (b) b.addEventListener("click", function () { S.cortes = !S.cortes; pinta(); });
    }

    $("i").addEventListener("change", function () { S.idea = this.value; S.cortes = false; pinta(); });
    $("h").addEventListener("input", function () { S.h = parseInt(this.value, 10); S.cortes = false; pinta(); });
    $("m").addEventListener("change", function () { S.max = parseInt(this.value, 10); S.cortes = false; pinta(); });
    $("g").addEventListener("change", function () { S.margen = this.checked; S.cortes = false; pinta(); });
    $("a").addEventListener("change", function () { S.auth = this.checked; S.cortes = false; pinta(); });
    pinta();
  }

  widget.modelo = { IDEAS: IDEAS, plan: plan, sugerido: sugerido, maxCortes: maxCortes, reparte: reparte };
  root.WIDGETS["m12-l02-planificador"] = widget;
})();
