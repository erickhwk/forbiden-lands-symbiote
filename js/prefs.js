/*
 * Configurações: esquema de cores e tamanho do texto (deste computador) e a
 * página que os reúne com a cópia de segurança da ficha.
 *
 * No TaleSpire, ficam em TS.localStorage.global (vale para todas as campanhas
 * deste computador). No navegador, em localStorage. O tamanho é aplicado com
 * zoom na página inteira, então tudo cresce junto e o layout se mantém. O
 * esquema vira o atributo data-tema do <html> (css/temas.css). Um ?tema= no
 * endereço (página de comparação) tem prioridade sobre a preferência salva.
 */
"use strict";

var TEXT_SIZES = [[1, "Normal"], [1.15, "Grande"], [1.3, "Maior"]];

/* [chave, nome, fundo, moldura, ação] — as três cores desenham a amostra do botão. */
var THEMES = [
  ["", "Ferro e latão", "#1E1914", "#C9A45C", "#A8442A"],
  ["ferro", "Ferro frio", "#1B1E22", "#9AA2AA", "#8E3326"],
  ["couro", "Couro e osso", "#211912", "#C9BA98", "#8A2F22"],
  ["musgo", "Musgo e bronze", "#181C17", "#A2AE7C", "#9A4A2A"],
  ["pergaminho", "Pergaminho", "#EFE6D2", "#6B4E31", "#8E2A1E"]
];
var PREFS_KEY = "ficha-forbidden-lands-prefs";
var URL_THEME = document.documentElement.getAttribute("data-tema");

app.prefs = { textScale: 1, theme: "" };

function applyPrefs() {
  var z = app.prefs.textScale || 1;
  document.documentElement.style.zoom = z === 1 ? "" : String(z);
  var theme = URL_THEME || app.prefs.theme;
  if (theme) document.documentElement.setAttribute("data-tema", theme);
  else document.documentElement.removeAttribute("data-tema");
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
      if (THEMES.some(function (t) { return t[0] === p.theme; })) app.prefs.theme = p.theme;
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
  var current = URL_THEME || app.prefs.theme;
  return '<div class="look-prefs">' +
    '<div class="text-size"><span class="small muted">Esquema de cores</span>' +
      '<div class="theme-pick" role="group" aria-label="Esquema de cores">' + THEMES.map(function (t) {
        return '<button data-action="theme" data-theme="' + t[0] + '" aria-pressed="' + (current === t[0]) + '">' +
          '<span class="swatch" aria-hidden="true" style="background:' + t[2] + ';border-color:' + t[3] + '">' +
            '<i style="background:' + t[3] + '"></i><i style="background:' + t[4] + '"></i></span>' +
          "<span>" + t[1] + "</span></button>";
      }).join("") + "</div></div>" +
    '<div class="text-size"><span class="small muted">Tamanho do texto</span>' +
      '<div class="seg" role="group" aria-label="Tamanho do texto">' + TEXT_SIZES.map(function (s) {
        return '<button data-action="textSize" data-scale="' + s[0] + '" aria-pressed="' + (app.prefs.textScale === s[0]) + '">' + s[1] + "</button>";
      }).join("") + "</div></div>" +
  "</div>";
}

/* Página de Configurações: aparência (deste computador) e cópia de segurança (da ficha). */
function renderSettings() {
  return '<div class="back">' +
      '<button class="btn-icon sm" data-action="settingsClose" aria-label="Voltar">' + ICON.back + "</button>" +
      '<div><p class="eyebrow">' + esc(app.sheet.name || "Ficha") + '</p><h1 class="title">Configurações</h1></div></div>' +
    '<section class="stack" aria-label="Aparência"><h2 class="eyebrow">Aparência</h2>' +
      '<p class="small muted" style="margin:0">Vale só para este computador, em todas as campanhas. Cada pessoa da mesa escolhe a sua.</p>' +
      renderTextSize() + "</section>" +
    '<section class="stack" aria-label="Cópia de segurança">' + renderBackup() + "</section>" +
    '<p class="small muted version-line">Ficha Forbidden Lands · versão ' + APP_VERSION + "</p>";
}

Object.assign(actions, {
  settingsOpen: function () { app.view = "settings"; window.scrollTo(0, 0); },
  settingsClose: function () { app.view = "sheet"; app.backup = null; window.scrollTo(0, 0); },
  textSize: function (el) {
    app.prefs.textScale = +el.dataset.scale;
    applyPrefs();
    savePrefs();
  },
  theme: function (el) {
    URL_THEME = null;
    app.prefs.theme = el.dataset.theme;
    applyPrefs();
    savePrefs();
  }
});
