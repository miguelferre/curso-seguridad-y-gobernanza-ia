/* Widget "nueves-fiabilidad": convierte entre fiabilidad, nueves (k = -log10(1-p)) y fallos esperados en N usos.
   Sin dependencias. Estilos con las variables del CSS del Atlas. */
(function () {
  "use strict";
  window.WIDGETS = window.WIDGETS || {};
  var uid = 0;

  function injectStyle() {
    if (document.getElementById("w-nf-style")) return;
    var st = document.createElement("style");
    st.id = "w-nf-style";
    st.textContent = [
      ".w-nf{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:1rem 1.1rem;margin:1.2rem 0;font-size:.92rem}",
      ".w-nf h4{font:600 1.05rem/1.25 var(--cond);margin:0 0 .25rem}",
      ".w-nf .w-hint{color:var(--muted);margin:0 0 .8rem;font-size:.86rem}",
      ".w-nf .w-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr));gap:.6rem;margin:0 0 .6rem}",
      ".w-nf .w-f label{display:block;font:600 .72rem/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}",
      ".w-nf input[type=text],.w-nf input[type=number]{width:100%;min-width:0;font:500 1rem var(--mono);color:var(--ink);background:var(--ground);border:1px solid var(--rule-strong);border-radius:8px;padding:.45rem .6rem}",
      ".w-nf input[aria-invalid=true]{border-color:var(--trap);background:var(--trap-bg)}",
      ".w-nf .w-err{color:var(--trap);font-weight:600;margin:.2rem 0 .4rem;min-height:1.2em}",
      ".w-nf .w-presets{display:flex;flex-wrap:wrap;gap:.4rem;margin:.2rem 0 .8rem}",
      ".w-nf button{font:600 .82rem var(--cond);background:var(--surface);color:var(--ink);border:1px solid var(--rule-strong);border-radius:8px;padding:.4rem .75rem;cursor:pointer}",
      ".w-nf button:hover{background:var(--accent-soft)}",
      ".w-nf button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent)}",
      ".w-nf dl.w-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(11rem,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);border-radius:8px;overflow:hidden;margin:0 0 .8rem}",
      ".w-nf dl.w-out > div{background:var(--ground);padding:.5rem .7rem}",
      ".w-nf dl.w-out dt{font:600 .64rem/1.2 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.2rem}",
      ".w-nf dl.w-out dd{margin:0;font:600 1.05rem/1.3 var(--cond);color:var(--accent-ink)}",
      ".w-nf .w-note{background:var(--accent-soft);border-radius:8px;padding:.6rem .8rem;margin:0 0 .9rem}",
      ".w-nf .w-sub{font:600 .7rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin:.9rem 0 .5rem}",
      ".w-nf .w-lad{display:grid;grid-template-columns:5.6rem minmax(0,1fr) 6.2rem;gap:.3rem .6rem;align-items:center;font-size:.82rem}",
      ".w-nf .w-lad .w-k{font:600 .78rem var(--mono);color:var(--muted)}",
      ".w-nf .w-lad .w-k.w-on{color:var(--accent-ink)}",
      ".w-nf .w-track{height:.6rem;background:var(--ground);border:1px solid var(--rule);border-radius:999px;overflow:hidden}",
      ".w-nf .w-track > i{display:block;height:100%;background:var(--ex);border-radius:999px}",
      ".w-nf .w-track.w-on > i{background:var(--accent)}",
      ".w-nf .w-lad .w-v{font:500 .78rem var(--mono);text-align:right;color:var(--ink)}",
      ".w-nf .w-cap{color:var(--faint);font-size:.76rem;margin:.4rem 0 0}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function sig(x, n) {
    if (!isFinite(x)) return "∞";
    return Number(x).toLocaleString("es-ES", { maximumSignificantDigits: n || 3, useGrouping: true });
  }
  function fix(x, d) {
    return Number(x).toLocaleString("es-ES", { maximumFractionDigits: d });
  }
  function parse(s) {
    if (typeof s !== "string") return NaN;
    s = s.trim().replace(/\s/g, "").replace("%", "").replace(",", ".");
    if (s === "") return NaN;
    return Number(s);
  }

  var PRESETS = [90, 99, 99.9, 99.99, 99.999];

  window.WIDGETS["nueves-fiabilidad"] = function (el) {
    injectStyle();
    var id = "w-nf-" + (++uid);
    var q = 0.001;    // probabilidad de fallo por uso
    var n = 100;      // usos (99 % y 100 usos: el caso de la lección)

    var html = '<div class="w-nf">' +
      '<h4>Nueves de fiabilidad</h4>' +
      '<p class="w-hint">Escribe la fiabilidad o los nueves y el otro campo se calcula solo. Cada nueve más divide los fallos entre diez.</p>' +
      '<div class="w-grid">' +
      '<div class="w-f"><label for="' + id + '-p">Fiabilidad (%)</label><input type="text" inputmode="decimal" id="' + id + '-p" autocomplete="off" aria-describedby="' + id + '-err"></div>' +
      '<div class="w-f"><label for="' + id + '-k">Nueves k</label><input type="text" inputmode="decimal" id="' + id + '-k" autocomplete="off" aria-describedby="' + id + '-err"></div>' +
      '<div class="w-f"><label for="' + id + '-n">Usos N</label><input type="number" id="' + id + '-n" min="1" step="1" value="' + n + '" aria-describedby="' + id + '-err"></div>' +
      '</div>' +
      '<p class="w-err" id="' + id + '-err" role="alert"></p>' +
      '<div class="w-presets" role="group" aria-label="Fiabilidades de ejemplo">';
    PRESETS.forEach(function (p, i) {
      html += '<button type="button" data-p="' + p + '" aria-pressed="false">' + fix(p, 3) + ' %</button>';
    });
    html += '</div>' +
      '<dl class="w-out" aria-live="polite">' +
      '<div><dt>Probabilidad de fallo por uso</dt><dd id="' + id + '-o-q"></dd></div>' +
      '<div><dt>Un fallo cada (de media)</dt><dd id="' + id + '-o-t"></dd></div>' +
      '<div><dt>Fallos esperados en N usos</dt><dd id="' + id + '-o-e"></dd></div>' +
      '<div><dt>Probabilidad de al menos un fallo en N usos</dt><dd id="' + id + '-o-a"></dd></div>' +
      '</dl>' +
      '<p class="w-note" id="' + id + '-more" aria-live="polite"></p>' +
      '<div class="w-sub">Escalera de nueves para N usos (escala logarítmica)</div>' +
      '<div class="w-lad" id="' + id + '-lad" role="group" aria-label="Fallos esperados por número de nueves"></div>' +
      '<p class="w-cap">Cada peldaño tiene una décima parte de los fallos del anterior, así que en escala logarítmica forman una recta. La probabilidad de al menos un fallo supone usos independientes (cálculo propio de la lección).</p>' +
      '</div>';
    el.innerHTML = html;

    function $(s) { return el.querySelector("#" + id + "-" + s); }
    var inP = $("p"), inK = $("k"), inN = $("n"), err = $("err");

    function kOf(qq) { return -Math.log10(qq); }

    function ladder() {
      var lad = $("lad"), i, k, f, w, on;
      var kSel = q > 0 ? kOf(q) : 99;
      var fmax = n * 0.1, fmin = n * 1e-6;
      var span = Math.log10(fmax) - Math.log10(fmin);
      var rows = "";
      for (k = 1; k <= 6; k++) {
        f = n * Math.pow(10, -k);
        w = span > 0 ? (Math.log10(f) - Math.log10(fmin)) / span * 100 : 100;
        w = Math.max(3, Math.min(100, w + 3));
        on = Math.abs(kSel - k) < 0.05;
        rows += '<div class="w-k' + (on ? ' w-on' : '') + '">' + k + (k === 1 ? " nueve" : " nueves") + '</div>' +
          '<div class="w-track' + (on ? ' w-on' : '') + '" aria-hidden="true"><i style="width:' + w + '%"></i></div>' +
          '<div class="w-v">' + sig(f, 3) + ' fallos</div>';
      }
      lad.innerHTML = rows;
    }

    function outputs() {
      var t = q > 0 ? 1 / q : Infinity;
      $("o-q").textContent = q > 0 ? fix(q * 100, 8) + " %" : "0 %";
      $("o-t").textContent = q > 0 ? sig(t, 3) + " usos" : "nunca";
      $("o-e").textContent = sig(n * q, 3);
      var a = q > 0 ? -Math.expm1(n * Math.log1p(-q)) : 0;
      $("o-a").textContent = fix(a * 100, a < 0.001 ? 4 : 1) + " %";
      var more = $("more");
      if (q > 0 && q < 1) {
        more.textContent = "Con un nueve más (k = " + fix(kOf(q) + 1, 3) + "): " + sig(n * q / 10, 3) +
          " fallos esperados en " + fix(n, 0) + " usos, la décima parte. Y el primer fallo llegaría hacia el uso " + sig(t * 10, 3) + ".";
      } else if (q >= 1) {
        more.textContent = "Con fiabilidad 0 % el sistema falla en todos los usos.";
      } else {
        more.textContent = "";
      }
      var pressed = false;
      Array.prototype.forEach.call(el.querySelectorAll("button[data-p]"), function (b) {
        var on = Math.abs((100 - parseFloat(b.getAttribute("data-p"))) / 100 - q) < 1e-12;
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      ladder();
    }

    function setInvalid(input, msg) {
      input.setAttribute("aria-invalid", "true");
      err.textContent = msg;
    }
    function clearInvalid() {
      inP.removeAttribute("aria-invalid");
      inK.removeAttribute("aria-invalid");
      inN.removeAttribute("aria-invalid");
      err.textContent = "";
    }

    function fromP() {
      var x = parse(inP.value);
      if (!isFinite(x) || x < 0 || x >= 100) {
        setInvalid(inP, "La fiabilidad debe estar entre 0 y menos de 100 %.");
        return;
      }
      clearInvalid();
      q = Number(((100 - x) / 100).toPrecision(12));
      inK.value = q >= 1 ? "0" : fix(kOf(q), 3);
      outputs();
    }
    function fromK() {
      var k = parse(inK.value);
      if (!isFinite(k) || k < 0 || k > 12) {
        setInvalid(inK, "Los nueves deben estar entre 0 y 12.");
        return;
      }
      clearInvalid();
      q = Math.pow(10, -k);
      inP.value = fix(Number(((1 - q) * 100).toPrecision(13)), 10);
      outputs();
    }
    function fromN() {
      var x = parse(inN.value);
      if (!isFinite(x) || x < 1 || x > 1e12) {
        setInvalid(inN, "Los usos deben estar entre 1 y un billón.");
        return;
      }
      clearInvalid();
      n = Math.round(x);
      outputs();
    }

    inP.addEventListener("input", fromP);
    inK.addEventListener("input", fromK);
    inN.addEventListener("input", fromN);
    Array.prototype.forEach.call(el.querySelectorAll("button[data-p]"), function (b) {
      b.addEventListener("click", function () {
        inP.value = fix(parseFloat(b.getAttribute("data-p")), 3);
        fromP();
      });
    });

    inP.value = "99";
    fromP();
  };
})();
