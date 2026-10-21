/*
 * Preferências do computador (não da ficha): tamanho do texto.
 *
 * No TaleSpire, ficam em TS.localStorage.global (vale para todas as campanhas
 * deste computador). No navegador, em localStorage. O tamanho é aplicado com
 * zoom na página inteira, então tudo cresce junto e o layout se mantém.
 */
"use strict";

var TEXT_SIZES = [[1, "Normal"], [1.15, "Grande"], [1.3, "Maior"]];
var PREFS_KEY = "ficha-forbidden-lands-prefs";

app.prefs = { textScale: 1 };

function applyPrefs() {
  var z = app.prefs.textScale || 1;
  document.documentElement.style.zoom = z === 1 ? "" : String(z);
}

function loadPrefs() {
  var read = window.TS && TS.localStorage && TS.localStorage.global
    ? TS.localStorage.global.getBlob().catch(function () { return null; })
    : Promise.resolve((function () { try { return window.localStorage.getItem(PREFS_KEY); } catch (e) { return null; } })());
  return read.then(function (raw) {
    if (!raw) return;
    try {
      var p = JSON.parse(raw);
      if (TEXT_SIZES.some(function (s) { return s[0] === p.textScale; })) app.prefs.textScale = p.textScale;
    } catch (e) { /* preferências ilegíveis: fica o padrão */ }
    applyPrefs();
  });
}

function savePrefs() {
  var raw = JSON.stringify(app.prefs);
  if (app.ts && TS.localStorage && TS.localStorage.global) {
    TS.localStorage.global.setBlob(raw).catch(function (err) { console.warn("prefs", err); });
  } else {
    try { window.localStorage.setItem(PREFS_KEY, raw); } catch (e) { /* modo privado */ }
  }
}

function renderTextSize() {
  return '<div class="text-size"><span class="small muted">Tamanho do texto</span>' +
    '<div class="seg" role="group" aria-label="Tamanho do texto">' + TEXT_SIZES.map(function (s) {
      return '<button data-action="textSize" data-scale="' + s[0] + '" aria-pressed="' + (app.prefs.textScale === s[0]) + '">' + s[1] + "</button>";
    }).join("") + "</div></div>";
}

Object.assign(actions, {
  textSize: function (el) {
    app.prefs.textScale = +el.dataset.scale;
    applyPrefs();
    savePrefs();
  }
});
