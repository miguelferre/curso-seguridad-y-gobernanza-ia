/* Simulador "m12-l01-conexiones": ¿qué módulos e ideas del curso se aplican a cada caso clínico?
   Actividad de repaso: seis casos PROPIOS de IA clínica, escritos para el curso (cifras inventadas). Por caso se marcan
   opciones (módulos e ideas transversales) con casillas; al comprobar se dice qué faltaba, qué sobraba y por qué, con la
   lección que lo explica. Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  var NOMBRE = {
    m0: "Módulo 0 · Fundamentos de IA", m1: "Módulo 1 · Riesgos catastróficos", m2: "Módulo 2 · Ingeniería de seguridad",
    m3: "Módulo 3 · Sistemas complejos", m4: "Módulo 4 · Robustez", m5: "Módulo 5 · Monitorización técnica",
    m6: "Módulo 6 · Monitorización en producción", m7: "Módulo 7 · Alineamiento y control",
    m8: "Módulo 8 · IA beneficiosa y ética de máquinas", m9: "Módulo 9 · Acción colectiva", m10: "Módulo 10 · Gobernanza",
    m11: "Módulo 11 · Fundamentos formales",
    i1: "Idea 1 · Defensa en profundidad", i2: "Idea 2 · Colas largas y desconocidos",
    i3: "Idea 3 · Goodhart: la medida sustituye al fin", i4: "Idea 4 · Presiones competitivas",
    i5: "Idea 5 · Incertidumbre", i6: "Idea 6 · Emergencia: el todo no es la suma",
    i7: "Idea 7 · Engaño y atajos que las pruebas no ven", i8: "Idea 8 · Personas y cultura"
  };

  /* Cada opción: [id, correcta (1 o 0), explicación, lecciones que la explican]. */
  var CASOS = [
    { t: "Un modelo que predice reingresos se entrenó con los datos de un hospital y se despliega en otro que acaba de cambiar de sistema de laboratorio. Sus probabilidades siguen pareciendo igual de seguras, pero las etiquetas de reingreso tardan semanas en llegar, así que nadie sabe todavía si acierta.",
      o: [
        ["m4", 1, "El hospital nuevo no se parece al de entrenamiento: es un desplazamiento de distribución y el modelo falla sin avisar, por dentro tan seguro como antes.", ["m04/l02"]],
        ["m6", 1, "La deriva se detecta comparando lo que llega hoy con una línea base, sin esperar a las etiquetas, y se calcula cuánto tiempo se pasa a ciegas hasta que llegan.", ["m06/l03", "m06/l02"]],
        ["m9", 0, "La acción colectiva trata de actores que compiten o se coordinan. Aquí no hay ningún rival ni dilema.", ["m09/l01"]],
        ["m10", 0, "La gobernanza mira reglas de empresa, Estado y países. El problema de este caso es técnico y de vigilancia.", ["m10/l01"]],
        ["i2", 1, "El cambio que de verdad ocurre puede ser uno que nadie imaginó. Probar con cambios fabricados solo cubre los previstos, y por eso se completa con vigilancia después.", ["m04/l02", "m02/l06"]],
        ["i5", 1, "Sin etiquetas solo se puede estimar la calidad con un modelo calibrado, y cada medición se lee con su intervalo: es admitir y medir la incertidumbre.", ["m06/l02", "m05/l03"]],
        ["i4", 0, "No hay ninguna presión competitiva en el caso.", ["m09/l01"]]
      ] },
    { t: "Una aplicación de seguimiento de pacientes crónicos se ajusta para subir el número de sesiones semanales de cada usuario. En tres meses las sesiones suben un 40 % (cifra inventada), pero la adherencia al tratamiento y el control de la enfermedad no cambian.",
      o: [
        ["m1", 1, "Es proxy gaming como riesgo: el sistema cumple el número sin lograr, o incluso estropeando, aquello para lo que se creó.", ["m01/l04"]],
        ["m5", 1, "Se detecta vigilando la brecha entre el sustituto (sesiones) y el objetivo real (adherencia), y comparando con una conducta de referencia.", ["m05/l06"]],
        ["m8", 1, "Es la app que engancha: lo que la persona hace no es lo mismo que lo que le hace bien, y la teoría del bienestar que se elija decide qué optimiza la IA.", ["m08/l03"]],
        ["m9", 0, "No hay actores que compitan ni un dilema entre ellos.", ["m09/l01"]],
        ["m4", 0, "La robustez trata de ataques y cambios de entorno. Aquí el sistema funciona exactamente como se le pidió.", ["m04/l01"]],
        ["i3", 1, "Es la ley de Goodhart: una medida útil mientras nadie la usa como palanca deja de serlo cuando se presiona sobre ella.", ["m01/l04", "m05/l06"]],
        ["i4", 0, "No hay presión competitiva en el caso: el fallo es de la medida que se eligió.", ["m01/l02"]]
      ] },
    { t: "Dos hospitales privados vecinos compiten por ser los primeros en ofrecer un asistente de altas con IA. Uno acorta la validación de tres meses a uno y el otro le imita. Ninguna norma les exige más. Al cabo de un año, la lista de comprobación de seguridad se ha saltado en varios servicios y nadie recuerda haberlo decidido.",
      o: [
        ["m9", 1, "Es un dilema repetido: cada uno recorta por miedo a quedarse atrás y los dos acaban peor. No se arregla aconsejando, sino cambiando los pagos.", ["m09/l01", "m09/l02"]],
        ["m2", 1, "Es la deriva al fallo: cada pequeña relajación parece inofensiva y, como no pasa nada, se convierte en costumbre.", ["m02/l04"]],
        ["m10", 1, "Hace falta diseñar la empresa para que el poder de parar un lanzamiento no quede en manos de quien tiene más prisa, y reglas comunes que se puedan comprobar.", ["m10/l02", "m01/l02"]],
        ["m4", 0, "No hay ningún ataque ni cambio de entorno sobre el modelo.", ["m04/l01"]],
        ["m11", 0, "Los fundamentos formales tratan de utilidad y teorías morales, y no son el problema aquí.", ["m11/l01"]],
        ["i4", 1, "Cada uno decide bien para sí y los dos acaban peor: es la presión competitiva sobre la seguridad.", ["m01/l02", "m09/l02"]],
        ["i8", 1, "La lista de comprobación se saltó sin decisión de nadie: es cultura de seguridad y falta de quien pueda parar.", ["m01/l03", "m02/l04"]],
        ["i6", 0, "No hay propiedades del conjunto que no estén en las piezas: cada relajación es visible y humana.", ["m03/l01"]]
      ] },
    { t: "Un asistente de dosificación se conecta con la farmacia, el laboratorio y la historia clínica. Cada sistema funciona bien por separado y pasó sus pruebas. Un día el laboratorio cambia el formato de un resultado y al asistente le llegan dosis erróneas, sin que ningún componente esté averiado.",
      o: [
        ["m3", 1, "El todo no es la suma: las piezas se influyen y el comportamiento del conjunto no está en ninguna de ellas, así que hay que probar el sistema completo.", ["m03/l01", "m03/l03"]],
        ["m2", 1, "Es un accidente sin fallo de componente, que los modelos de fallo no ven. Se responde con acoplamiento débil, validaciones entre sistemas y pruebas de estrés.", ["m02/l03", "m02/l06"]],
        ["m8", 0, "No se trata de decidir qué es el bien ni cómo repartirlo.", ["m08/l03"]],
        ["m9", 0, "No hay actores que compitan ni cooperen: es un fallo de integración.", ["m09/l01"]],
        ["i6", 1, "Es emergencia: el fallo nace de la interacción entre componentes que funcionan como fueron diseñados.", ["m02/l03", "m03/l01"]],
        ["i1", 1, "Aislar los datos críticos con validaciones a la entrada de cada sistema es una capa que no depende de las demás.", ["m02/l06", "m02/l02"]],
        ["i3", 0, "No hay un sustituto mal elegido que se rompa al optimizarlo.", ["m01/l04"]]
      ] },
    { t: "Un comité diseña un asistente que reparte las camas de cuidados intensivos entre pacientes graves. La primera propuesta suma el bienestar esperado de todos los pacientes. Un miembro pregunta si no habría que proteger más a quien está peor, y otro replica que ni siquiera se ponen de acuerdo en qué teoría moral es la correcta.",
      o: [
        ["m8", 1, "Elegir la regla que junta el bienestar de cada uno es una decisión de valores, y con la duda moral se pueden usar credencias y reglas como el parlamento moral.", ["m08/l04", "m08/l05"]],
        ["m11", 1, "Utilitarismo y contrato social son lentes distintas para el mismo caso, y sin consenso se trabaja con incertidumbre moral en vez de fiarlo a una sola teoría.", ["m11/l05", "m11/l06"]],
        ["m4", 0, "La robustez trata de ataques y cambios de entorno. Aquí el modelo hace lo que se le pide y la pregunta es qué pedirle.", ["m04/l01"]],
        ["m9", 0, "No hay actores que compitan ni cooperen: hay una decisión de valores dentro de un comité.", ["m09/l01"]],
        ["i5", 1, "Nadie sabe con certeza qué teoría moral es la correcta. Reconocer la duda con credencias y una regla explícita evita la falsa certeza de una sola teoría.", ["m08/l05", "m11/l06"]],
        ["i3", 0, "No hay un sustituto mal elegido que se rompa al optimizarlo, sino una decisión de valores que tomar a conciencia.", ["m08/l04"]],
        ["i2", 0, "El caso no trata de sucesos raros y enormes.", ["m02/l05"]]
      ] },
    { t: "Un hospital descarga de un repositorio público un modelo que lee radiografías y saca un 99 % en sus pruebas habituales. Meses después, un grupo descubre que si la imagen lleva una marca diminuta en una esquina, el modelo clasifica cualquier radiografía como sana.",
      o: [
        ["m5", 1, "Es un troyano: una trampa que pasa las pruebas normales porque no llevan el disparador. Se mide también su tasa de éxito y se cuida el origen de datos y modelos.", ["m05/l05"]],
        ["m4", 0, "La robustez adversarial trata de entradas retocadas para engañar a un modelo ya entrenado. Aquí la trampa se metió en el entrenamiento o en el modelo descargado.", ["m04/l01", "m05/l05"]],
        ["m8", 0, "No se trata de qué es el bien ni de cómo repartirlo.", ["m08/l03"]],
        ["m9", 0, "No hay actores que compitan ni cooperen en el caso.", ["m09/l01"]],
        ["i7", 1, "Pasar las pruebas de siempre no es ser seguro: el disparador oculto no se delata con la precisión limpia, igual que un atajo espurio.", ["m05/l05", "m05/l04"]],
        ["i4", 0, "No hay presión competitiva en el caso.", ["m09/l02"]],
        ["i2", 0, "No es un cambio del entorno ni un suceso raro que llegue de fuera: la marca la puso alguien a propósito.", ["m05/l05"]]
      ] }
  ];

  function injectStyle() {
    if (typeof document === "undefined" || document.getElementById("w-cn-style")) return;
    var st = document.createElement("style");
    st.id = "w-cn-style";
    st.textContent = [
      ".w-cn{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-cn h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-cn .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-cn .w-prog{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin:0 0 .4rem}",
      ".w-cn .w-caso{background:var(--accent-soft);border-radius:8px;padding:.7rem .9rem;margin:0 0 .7rem}",
      ".w-cn fieldset{border:0;margin:0 0 .7rem;padding:0;min-width:0}",
      ".w-cn legend{font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);padding:0;margin:0 0 .35rem}",
      ".w-cn .w-op{display:grid;grid-template-columns:1fr;gap:.35rem}",
      ".w-cn .w-op label{display:flex;align-items:flex-start;gap:.5rem;border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .65rem;cursor:pointer;font:500 .88rem/1.3 var(--cond);background:var(--surface);color:var(--ink)}",
      ".w-cn .w-op label:hover{background:var(--accent-soft)}",
      ".w-cn .w-op input{margin-top:.15rem;accent-color:var(--accent)}",
      ".w-cn .w-op label.bien{border-color:var(--ex);background:var(--ex-bg)}",
      ".w-cn .w-op label.falta{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-cn .w-op label.sobra{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-cn .w-tag{font:700 .7rem/1.2 var(--mono);letter-spacing:.05em;text-transform:uppercase;margin-left:auto;padding-left:.5rem;white-space:nowrap}",
      ".w-cn .w-fb{border-radius:8px;padding:.6rem .8rem;margin:0 0 .7rem}",
      ".w-cn .w-fb.ok{background:var(--ex-bg);border:1px solid var(--ex)}",
      ".w-cn .w-fb.mal{background:var(--trap-bg);border:1px solid var(--trap)}",
      ".w-cn .w-fb ul{margin:.4rem 0 0;padding-left:1.1rem}",
      ".w-cn .w-fb li{margin:.25rem 0}",
      ".w-cn .w-btn{font:500 .85rem/1.2 var(--cond);background:var(--accent);color:var(--ground);border:0;border-radius:8px;padding:.5rem .9rem;cursor:pointer}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function enlaces(l) {
    return l.map(function (x) {
      var p = x.split("/");
      return '<a href="#/' + p[0] + '/' + p[1] + '">' + x + '</a>';
    }).join(", ");
  }

  function widget(el) {
    injectStyle();
    var id = "w-cn-" + (++uid), i = 0, resueltos = 0, hecho = false, detalle = [];

    el.innerHTML = '<div class="w-cn"><h4>Conecta el caso con el curso</h4>' +
      '<p class="w-hint">Marca lo que se aplica y pulsa "Comprobar". La explicación dice qué faltaba, qué sobraba y en qué lección se ve.</p>' +
      '<div id="' + id + '-c"></div></div>';
    var cuerpo = el.querySelector("#" + id + "-c");

    function grupo(caso, pref, titulo) {
      var h = "", k, o;
      for (k = 0; k < caso.o.length; k++) {
        o = caso.o[k];
        if (o[0].charAt(0) !== pref) continue;
        h += '<label><input type="checkbox" value="' + o[0] + '"><span>' + NOMBRE[o[0]] + '</span></label>';
      }
      return '<fieldset><legend>' + titulo + '</legend><div class="w-op">' + h + '</div></fieldset>';
    }

    function pinta() {
      var c, k;
      if (i >= CASOS.length) { final(); return; }
      c = CASOS[i];
      hecho = false;
      cuerpo.innerHTML = '<p class="w-prog">Caso ' + (i + 1) + ' de ' + CASOS.length + ' · con el mapa exacto: ' + resueltos + '</p>' +
        '<p class="w-caso">' + esc(c.t) + '</p>' +
        grupo(c, "m", "Módulos") + grupo(c, "i", "Ideas transversales") +
        '<div id="' + id + '-fb" aria-live="polite"></div>' +
        '<button type="button" class="w-btn" id="' + id + '-ok">Comprobar</button>';
      cuerpo.querySelector("#" + id + "-ok").addEventListener("click", comprueba);
    }

    function comprueba() {
      var c = CASOS[i], bien = 0, faltan = 0, sobran = 0, lis = "", fb, k, o, cb, lab, marca, tag, btn;
      if (hecho) return;
      hecho = true;
      for (k = 0; k < c.o.length; k++) {
        o = c.o[k];
        cb = cuerpo.querySelector('input[value="' + o[0] + '"]');
        lab = cb.parentNode;
        marca = cb.checked;
        cb.disabled = true;
        if (o[1] && marca) { bien++; lab.className = "bien"; tag = "Correcta"; }
        else if (o[1] && !marca) { faltan++; lab.className = "falta"; tag = "Faltaba"; }
        else if (!o[1] && marca) { sobran++; lab.className = "sobra"; tag = "Sobraba"; }
        else { tag = ""; }
        if (tag) {
          lab.insertAdjacentHTML("beforeend", '<span class="w-tag">' + tag + '</span>');
          lis += '<li><strong>' + NOMBRE[o[0]] + ".</strong> " + o[2] + ' <span>(' + enlaces(o[3]) + ')</span></li>';
        }
      }
      var exacto = faltan === 0 && sobran === 0;
      if (exacto) resueltos++;
      detalle.push(exacto);
      fb = cuerpo.querySelector("#" + id + "-fb");
      fb.innerHTML = '<div class="w-fb ' + (exacto ? "ok" : "mal") + '"><strong>' +
        (exacto ? "Mapa exacto." : "Casi: revisa las marcas señaladas.") + '</strong> Bien marcadas: ' + bien +
        '. Te faltaban: ' + faltan + '. Sobraban: ' + sobran + '.<ul>' + lis + '</ul></div>';
      btn = cuerpo.querySelector("#" + id + "-ok");
      btn.textContent = i + 1 < CASOS.length ? "Siguiente caso" : "Ver resultado";
      btn.removeEventListener("click", comprueba);
      btn.addEventListener("click", function () { i++; pinta(); });
      btn.focus();
    }

    function final() {
      var h = '<p class="w-fb ' + (resueltos >= 4 ? "ok" : "mal") + '" aria-live="polite">Has dejado el mapa exacto en ' + resueltos +
        ' de ' + CASOS.length + ' casos. ' + (resueltos >= 4 ? "Reconoces bien cómo se conectan los módulos." :
        "Repasa la lista de ideas transversales y vuelve a intentarlo.") + '</p>' +
        '<button type="button" class="w-btn" id="' + id + '-re">Empezar de nuevo</button>';
      cuerpo.innerHTML = h;
      cuerpo.querySelector("#" + id + "-re").addEventListener("click", function () { i = 0; resueltos = 0; detalle = []; pinta(); });
    }

    pinta();
  }

  widget.modelo = { NOMBRE: NOMBRE, CASOS: CASOS };
  window.WIDGETS["m12-l01-conexiones"] = widget;
})();
